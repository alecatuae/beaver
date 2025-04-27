# Fluxo de Consulta de Relacionamentos no Beaver

Este documento detalha o fluxo completo de dados quando relacionamentos entre componentes são consultados no sistema Beaver, desde a interface do usuário até a recuperação nos bancos de dados.

## Visão Geral do Fluxo

O fluxo de consulta de relacionamentos percorre várias camadas da aplicação, recuperando dados principalmente do Neo4j (para os relacionamentos), complementados por dados do MariaDB (para detalhes dos componentes).

```
┌───────────────┐          GraphQL          ┌───────────────┐
│   Front-end   │  ───────────────────────▶ │     API BFF   │
│ Next.js (SSR) │ ◀───────────────────────  │ Apollo Server │
└───────────────┘                           └───────────────┘
                                                    │
                                                    ▼
                                           ┌───────────────┐
                                           │   Resolvers   │
                                           └───────────────┘
                                                    │
                                                    │ Consulta de relacionamentos
                                                    │ no Neo4j
                                                    ▼
                                           ┌───────────────┐
                                           │     Neo4j     │
                                           └───────────────┘
                                                    │
                                                    │ Consulta de detalhes
                                                    │ dos componentes
                                                    ▼
                                           ┌───────────────┐
                                           │    MariaDB    │
                                           └───────────────┘
```

## Fluxo Detalhado

### 1. Interface do Usuário (Frontend)

- O usuário acessa a página de relacionamentos em `src/app/relationships/page.tsx`
- O componente React usa o hook `useQuery` do Apollo Client para buscar os dados
- Opcionalmente, o usuário pode filtrar por tipo de relacionamento e usar a barra de pesquisa para filtrar por nome dos componentes ou tipo

### 2. Camada de Comunicação GraphQL

- O frontend executa a query GraphQL `GET_RELATIONS` definida em `src/lib/graphql.ts`
- Esta query envia a solicitação para o servidor Apollo GraphQL (API BFF)

```typescript
export const GET_RELATIONS = gql`
  query GetRelations {
    relations {
      id
      sourceId
      targetId
      type
      properties
      source {
        id
        name
        status
      }
      target {
        id
        name
        status
      }
      createdAt
      updatedAt
    }
  }
`;
```

### 3. Processamento no Backend (API)

- O resolver GraphQL `relations` em `api/src/resolvers/relationship/relationshipResolvers.ts` é acionado
- O resolver delega a consulta de relacionamentos ao Neo4j Client

```typescript
// Query para obter todos os relacionamentos
builder.queryField('relations', (t) =>
  t.field({
    type: [RelationType],
    resolve: async () => {
      try {
        const result = await neo4jClient.getRelations();
        return result;
      } catch (error) {
        logger.error('Erro ao buscar relações:', error);
        return [];
      }
    },
  })
);
```

### 4. Consulta no Neo4j

- O método `getRelations` do Neo4jClient executa uma consulta Cypher no Neo4j:
  ```typescript
  const result = await session.run(`
    MATCH (source)-[r]->(target)
    RETURN 
      id(r) AS id, 
      type(r) AS type, 
      source.id AS sourceId, 
      target.id AS targetId,
      r.properties AS properties,
      r.createdAt AS createdAt,
      r.updatedAt AS updatedAt
  `);
  ```

- Esta consulta recupera todos os relacionamentos do grafo com seus respectivos metadados

### 5. Consulta de Detalhes dos Componentes

- Para cada relacionamento, os campos `source` e `target` são resolvidos através de consultas adicionais ao MariaDB:
  ```typescript
  source: t.field({
    type: 'Component',
    nullable: true,
    resolve: async (relation) => {
      return prisma.component.findUnique({
        where: { id: relation.sourceId },
      });
    },
  }),
  target: t.field({
    type: 'Component',
    nullable: true,
    resolve: async (relation) => {
      return prisma.component.findUnique({
        where: { id: relation.targetId },
      });
    },
  }),
  ```

- Estas consultas ao MariaDB recuperam os detalhes dos componentes de origem e destino de cada relacionamento

### 6. Resposta ao Frontend

- O resolver retorna os dados completos dos relacionamentos para o cliente
- O Apollo Client no frontend recebe a resposta da query
- O hook `useQuery` em `page.tsx` atualiza o estado com os dados recebidos

```typescript
const { loading, error, data, refetch } = useQuery(GET_RELATIONS, {
  fetchPolicy: 'network-only',
  onError: (error) => {
    console.error('Erro na consulta GraphQL:', error);
  }
});
```

### 7. Processamento e Exibição na UI

- Os dados dos relacionamentos são transformados para o formato esperado pela UI:
  ```typescript
  const relationships = data?.relations?.map((relation: any) => ({
    ...relation,
    created_at: new Date(relation.createdAt),
    updated_at: new Date(relation.updatedAt)
  })) || [];
  ```

- Os dados são filtrados com base nos critérios do usuário:
  ```typescript
  const filteredRelationships = relationships.filter((relationship: RelationType) => {
    const sourceNameMatch = relationship.source?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const targetNameMatch = relationship.target?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const typeMatch = relationship.type.toLowerCase().includes(searchTerm.toLowerCase());
    const descriptionMatch = relationship.properties?.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSearch = sourceNameMatch || targetNameMatch || typeMatch || descriptionMatch;
    const matchesTypeFilter = typeFilter === 'all' || relationship.type === typeFilter;
    
    return matchesSearch && matchesTypeFilter;
  });
  ```

- Os relacionamentos filtrados são ordenados e exibidos na interface:
  ```typescript
  const sortedRelationships = [...filteredRelationships].sort((a, b) => {
    // Lógica de ordenação baseada nas preferências do usuário
  });
  ```

## Consulta de Relacionamento Individual

Para a consulta de um relacionamento específico, o fluxo é semelhante, mas usando a query `GET_RELATION`:

```typescript
export const GET_RELATION = gql`
  query GetRelation($id: Int!) {
    relation(id: $id) {
      id
      sourceId
      targetId
      type
      properties
      source {
        id
        name
        status
      }
      target {
        id
        name
        status
      }
      createdAt
      updatedAt
    }
  }
`;
```

O resolver correspondente executa uma consulta Cypher focada em um ID específico:

```typescript
const query = `
  MATCH (source:Component)-[r]->(target:Component)
  WHERE id(r) = $id
  RETURN 
    id(r) as id, 
    type(r) as type, 
    source.id as sourceId, 
    target.id as targetId, 
    source.name as sourceName,
    target.name as targetName,
    properties(r) as properties,
    toString(datetime()) as createdAt,
    toString(datetime()) as updatedAt
`;
```

## Particularidades do Fluxo de Consulta de Relacionamentos

Diferentemente da consulta de componentes, a consulta de relacionamentos:

1. Utiliza primariamente o Neo4j para buscar os relacionamentos (arestas do grafo)
2. Complementa os dados buscando informações dos componentes (nós do grafo) no MariaDB
3. Trata os relacionamentos exclusivamente como entidades do Neo4j, sem correspondência direta no MariaDB

## Considerações sobre o Desempenho

- As consultas de relacionamentos são realizadas diretamente no Neo4j, que é otimizado para navegação em grafos
- Para cada relacionamento, são necessárias consultas adicionais ao MariaDB para recuperar detalhes dos componentes
- O frontend implementa infinite scrolling para carregar relacionamentos em lotes, melhorando a performance para grandes conjuntos de dados
- A filtragem e ordenação são realizadas no cliente (frontend) após o carregamento dos dados, o que pode afetar o desempenho com grandes volumes de dados 