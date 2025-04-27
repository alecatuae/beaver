# Fluxo de Criação de Componentes no Beaver

Este documento detalha o fluxo completo de dados quando um novo componente é criado no sistema Beaver, desde a interface do usuário até a persistência nos bancos de dados.

## Visão Geral do Fluxo

O fluxo de criação de componentes percorre várias camadas da aplicação, garantindo a persistência sincronizada em ambos os bancos de dados (MariaDB e Neo4j).

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
                                              /         \
                                             /           \
                                            ▼             ▼
                                   ┌───────────────┐   ┌───────────────┐
                                   │    MariaDB    │   │     Neo4j     │
                                   │    (Prisma)   │   │   (Driver)    │
                                   └───────────────┘   └───────────────┘
```

## Fluxo Detalhado

### 1. Interface do Usuário (Frontend)

- O usuário preenche o formulário de criação de componente no React
- Os dados são coletados via formulário em `src/app/components/form-component.tsx`
- Ao submeter o formulário, é chamada a função `handleSaveComponent` em `src/app/components/page.tsx`

### 2. Camada de Comunicação GraphQL

- O frontend executa a mutation GraphQL `CREATE_COMPONENT` definida em `src/lib/graphql.ts`
- Esta mutation envia os dados para o servidor Apollo GraphQL (API BFF)
- Os dados incluem: nome, descrição, status (opcional, padrão é 'ACTIVE') e tags (opcional)

### 3. Processamento no Backend (API)

- O resolver GraphQL `createComponent` em `api/src/resolvers/componentResolvers.ts` é acionado
- O resolver realiza as operações de persistência em sequência

### 4. Persistência no MariaDB

- Primeiro, o componente é criado no MariaDB via Prisma:
  ```sql
  INSERT INTO Component (name, description, status) 
  VALUES (${name}, ${description}, ${status})
  ```
- Em seguida, o componente recém-criado é recuperado para obter seu ID:
  ```sql
  SELECT id, name, description, status, created_at as createdAt 
  FROM Component 
  WHERE name = ${name} AND status = ${status}
  ORDER BY id DESC 
  LIMIT 1
  ```
- Se tags foram fornecidas, elas são persistidas no MariaDB via relação `ComponentTag`:
  ```typescript
  await ctx.prisma.componentTag.create({
    data: {
      componentId: createdComponent.id,
      tag
    }
  });
  ```

### 5. Sincronização com Neo4j

- Após persistir no MariaDB, o componente é também criado no Neo4j:
  ```typescript
  await ctx.neo4j.upsertComponent({
    id: createdComponent.id,
    name: createdComponent.name,
    description: createdComponent.description,
  });
  ```
- O método `upsertComponent` em `api/src/db/neo4j.ts` executa a seguinte query Cypher:
  ```cypher
  MERGE (c:Component {id: $id})
  ON CREATE SET 
    c.name = $name,
    c.description = $description,
    c.valid_from = datetime($validFrom),
    c.valid_to = datetime($validTo)
  ON MATCH SET
    c.name = $name,
    c.description = $description,
    c.valid_from = datetime($validFrom),
    c.valid_to = datetime($validTo)
  RETURN c
  ```
- Isso cria um nó `Component` no grafo Neo4j com campos temporais `valid_from` e `valid_to`

### 6. Resposta ao Frontend

- O resolver retorna os dados do componente criado para o cliente
- O Apollo Client no frontend recebe a resposta da mutation
- O hook `useMutation` em `page.tsx` executa a função `onCompleted`
- A consulta `refetch()` é chamada para atualizar a lista de componentes na UI

### 7. Atualização da UI

- A UI é atualizada com o novo componente na lista
- O componente pode ser visualizado no grafo através da consulta `graphData` que busca os nós e arestas do Neo4j

## Garantia de Consistência

A arquitetura de persistência dual do Beaver garante:

1. **Atomicidade**: O processo tenta garantir que ambos os bancos de dados sejam atualizados no mesmo contexto de execução.
2. **Consistência**: Os IDs são compartilhados entre MariaDB e Neo4j para manter referências consistentes.
3. **Isolamento**: As operações são executadas em sequência para evitar conflitos.
4. **Durabilidade**: Os dados são persistidos em ambos os bancos de forma permanente.

## Considerações

- Se a operação falhar no Neo4j após sucesso no MariaDB, pode ocorrer uma inconsistência.
- Logs de erro são gerados para facilitar a identificação e correção dessas situações.
- A arquitetura de persistência dual permite ao Beaver oferecer tanto consultas relacionais eficientes (MariaDB) quanto análises de grafo poderosas (Neo4j). 