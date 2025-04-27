# Fluxo de Consulta de Componentes no Beaver

Este documento detalha o fluxo completo de dados quando componentes são consultados no sistema Beaver, desde a interface do usuário até a recuperação nos bancos de dados.

## Visão Geral do Fluxo

O fluxo de consulta de componentes percorre várias camadas da aplicação, recuperando dados principalmente do MariaDB, com dados complementares do Neo4j quando necessário.

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
                                                    ▼
                                           ┌───────────────┐
                                           │    MariaDB    │
                                           │    (Prisma)   │
                                           └───────────────┘
```

## Fluxo Detalhado

### 1. Interface do Usuário (Frontend)

- O usuário acessa a página de componentes em `src/app/components/page.tsx`
- O componente React usa o hook `useQuery` do Apollo Client para buscar os dados
- Opcionalmente, o usuário pode filtrar por status e usar a barra de pesquisa para filtrar por nome, descrição ou tags

### 2. Camada de Comunicação GraphQL

- O frontend executa a query GraphQL `GET_COMPONENTS` definida em `src/lib/graphql.ts`
- Esta query envia a solicitação para o servidor Apollo GraphQL (API BFF)
- Opcionalmente, um parâmetro `status` pode ser fornecido para filtrar os componentes

```typescript
export const GET_COMPONENTS = gql`
  query GetComponents($status: String) {
    components(status: $status) {
      id
      name
      description
      status
      createdAt
      tags {
        tag
      }
    }
  }
`;
```

### 3. Processamento no Backend (API)

- O resolver GraphQL `components` em `api/src/resolvers/componentResolvers.ts` é acionado
- O resolver realiza a consulta principal no MariaDB

### 4. Consulta no MariaDB

- O resolver executa uma consulta SQL bruta no MariaDB para evitar problemas com a conversão de enum:
  ```typescript
  // Usa raw query para evitar problemas com enum
  let rawComponents;
  if (status === 'ACTIVE') {
    rawComponents = await ctx.prisma.$queryRaw`
      SELECT id, name, description, status, created_at as createdAt FROM Component WHERE status = 'ACTIVE'
    `;
  } else if (status === 'INACTIVE') {
    rawComponents = await ctx.prisma.$queryRaw`
      SELECT id, name, description, status, created_at as createdAt FROM Component WHERE status = 'INACTIVE'
    `;
  } else if (status === 'DEPRECATED') {
    rawComponents = await ctx.prisma.$queryRaw`
      SELECT id, name, description, status, created_at as createdAt FROM Component WHERE status = 'DEPRECATED'
    `;
  } else {
    rawComponents = await ctx.prisma.$queryRaw`
      SELECT id, name, description, status, created_at as createdAt FROM Component
    `;
  }
  ```

### 5. Resolução de Tags

- Para cada componente, o campo `tags` é resolvido através de uma consulta adicional ao MariaDB:
  ```typescript
  tags: t.field({
    type: [ComponentTag],
    resolve: async (parent: any, _args: any, ctx: any) => {
      return ctx.prisma.componentTag.findMany({
        where: { componentId: parent.id }
      });
    }
  }),
  ```

### 6. Resposta ao Frontend

- O resolver retorna os dados dos componentes para o cliente
- O Apollo Client no frontend recebe a resposta da query
- O hook `useQuery` em `page.tsx` atualiza o estado com os dados recebidos

```typescript
const { loading, error, data, refetch } = useQuery(GET_COMPONENTS, {
  variables: { status: statusFilter === 'all' ? null : statusFilter },
  fetchPolicy: 'network-only'
});
```

### 7. Processamento e Exibição na UI

- Os dados dos componentes são transformados para o formato esperado pela UI:
  ```typescript
  const components = data?.components?.map((component: any) => ({
    ...component,
    created_at: new Date(component.createdAt),
    tags: component.tags?.map((tag: any) => {
      return typeof tag === 'string' ? tag : (tag?.tag || '');
    }) || []
  })) || [];
  ```

- Os dados filtrados são exibidos na interface usando cards:
  ```typescript
  const filteredComponents = components.filter((component: ComponentType) => {
    const matchesSearch = component.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        component.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        component.tags.some((tag: string) => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch;
  });
  ```

## Consulta de Componente Individual

Para a consulta de um componente específico, o fluxo é semelhante, mas usando a query `GET_COMPONENT`:

```typescript
export const GET_COMPONENT = gql`
  query GetComponent($id: Int!) {
    component(id: $id) {
      id
      name
      description
      status
      createdAt
      tags {
        tag
      }
    }
  }
`;
```

O resolver correspondente no backend executa uma consulta focada em um ID específico:

```typescript
const rawComponents = await ctx.prisma.$queryRaw`
  SELECT id, name, description, status, created_at as createdAt FROM Component WHERE id = ${args.id}
`;
```

## Consulta do Grafo de Componentes

Para visualização do grafo, uma consulta adicional `graphData` é utilizada, que recupera dados do Neo4j:

```typescript
const query = `
  MATCH path = (c:Component)-[r*0..${depth}]-(related)
  WITH nodes(path) as nodes, relationships(path) as rels
  UNWIND nodes as node
  WITH collect(distinct node) as allNodes, rels
  UNWIND rels as rel
  RETURN allNodes, collect(distinct rel) as allRels
`;
```

Este procedimento recupera nós (componentes) e arestas (relacionamentos) para visualização em um grafo utilizando a biblioteca Cytoscape.js.

## Considerações sobre o Desempenho

- As consultas principais de componentes são feitas diretamente no MariaDB, que é otimizado para consultas relacionais
- As consultas de grafo são realizadas no Neo4j, que é otimizado para processamento de grafos
- Tags são carregadas sob demanda para cada componente, o que pode aumentar o número de consultas ao banco de dados
- O frontend implementa infinite scrolling para carregar componentes em lotes, melhorando a performance para grandes conjuntos de dados 