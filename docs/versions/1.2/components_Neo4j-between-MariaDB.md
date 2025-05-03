# Relationship Between Components in MariaDB and Neo4j

## ID as Synchronization Key
- Each component's ID in MariaDB is also used as a unique identifier in Neo4j.
- When a component is created or updated in MariaDB, the same ID is used to synchronize it with Neo4j.

## Automatic Synchronization in the API
- The `Neo4jClient` class contains methods such as `upsertComponent` that are automatically called when a component is created or updated in MariaDB.
- When CRUD operations occur in MariaDB through GraphQL, the API performs the corresponding operations in Neo4j.

## Temporal Data in Neo4j
- While MariaDB stores the basic component information (name, description, status), Neo4j adds temporal fields:
  - `valid_from`: When the component started to exist
  - `valid_to`: When the component is set to expire (usually defined as "9999-12-31")
- This enables temporal queries in the graph for historical analysis.

## Relationships Stored in Neo4j
- MariaDB stores components as individual entities.
- Neo4j stores both the components and the relationships between them with specific types:
  - **DEPENDS_ON**: A component depends on another
  - **CONNECTS_TO**: A component connects to another
  - **RUNS_ON**: A component runs on a platform
  - **STORES_DATA_IN**: A component stores data somewhere
  - **CONTAINS**: A component contains subcomponents
  - **PROTECTS**: A component protects certain data
  - **HAS_DECISION**: A component is associated with a decision (ADR)

## Operation Cycle for Components
1. The user creates/updates a component via the GraphQL API.
2. The `createComponent`/`updateComponent` resolver persists the data in MariaDB.
3. The same resolver then calls `ctx.neo4j.upsertComponent` to synchronize with Neo4j.
4. Similarly, relationships are created in Neo4j after validating the entities in MariaDB.

## Graph Query
- The `graphData` operation queries Neo4j to retrieve the graph view.
- The data is returned in a format compatible with the Cytoscape.js library.
- This enables interactive visualization of the relationships between components.

## Atomically Consistent Transactions
- Consistency is maintained by the API ensuring that both databases are updated.
- If the operation in Neo4j fails after succeeding in MariaDB, an error log is generated.
- This hybrid model allows Beaver to leverage the best of both worlds:
  - **MariaDB** for structured relational storage and easy property querying.
  - **Neo4j** for advanced graph querying and visualization capabilities for architecture analysis.

# Persistência de Componentes em Múltiplos Bancos de Dados

Este documento detalha como as operações CRUD (Criar, Ler, Atualizar, Excluir) para a entidade `Component` são persistidas de forma síncrona nos bancos de dados MariaDB e Neo4j no aplicativo Beaver.

## Arquitetura de Persistência

O Beaver utiliza uma arquitetura de persistência dual:

1. **MariaDB**: Armazena dados relacionais, incluindo metadados dos componentes, tags e relações de tabelas relacionais.
2. **Neo4j**: Armazena o grafo de arquitetura, permitindo representar e consultar relações complexas entre componentes.

As operações CRUD em componentes devem ser sincronizadas entre os dois bancos para garantir consistência dos dados.

## Implementação das Operações CRUD

### Criar Componente

1. A criação começa no resolver GraphQL `createComponent`.
2. O componente é primeiro criado no MariaDB usando Prisma.
3. Em seguida, o mesmo componente é criado no Neo4j usando o método `upsertComponent`.
4. As tags relacionadas são criadas ou atualizadas no MariaDB.

```typescript
// Cria o componente no MariaDB
const component = await ctx.prisma.component.create({
  data: {
    name,
    description,
    status: status || ComponentStatus.ACTIVE,
  },
});

// Cria o componente no Neo4j
await ctx.neo4j.upsertComponent({
  id: component.id,
  name: component.name,
  description: component.description,
});
```

### Atualizar Componente

1. A atualização começa no resolver GraphQL `updateComponent`.
2. O componente é atualizado no MariaDB usando Prisma.
3. O mesmo componente é atualizado no Neo4j usando o método `upsertComponent`.
4. Tags relacionadas são atualizadas conforme necessário.

```typescript
// Atualiza o componente no MariaDB
const component = await ctx.prisma.component.update({
  where: { id },
  data: {
    name,
    description,
    status,
  },
});

// Atualiza o componente no Neo4j
await ctx.neo4j.upsertComponent({
  id: component.id,
  name: component.name,
  description: component.description,
});
```

### Excluir Componente

1. A exclusão começa no resolver GraphQL `deleteComponent`.
2. As tags do componente são excluídas do MariaDB.
3. O componente é excluído do MariaDB usando Prisma.
4. O componente e todas as suas relações são excluídos do Neo4j.

```typescript
// Exclui as tags do componente do MariaDB
if (component.tags && component.tags.length > 0) {
  await ctx.prisma.componentTag.deleteMany({
    where: { componentId: id }
  });
}

// Exclui o componente do MariaDB
const deletedComponent = await ctx.prisma.component.delete({
  where: { id }
});

// Exclui o componente e suas relações do Neo4j
await ctx.neo4j.deleteNode('Component', id);
```

## Garantia de Consistência

Para garantir a consistência entre os bancos de dados:

1. **Transações**: As operações são executadas dentro do mesmo contexto de resolução.
2. **Ordem de Operações**: A ordem de persistência é cuidadosamente planejada para minimizar inconsistências.
3. **Tratamento de Erros**: Em caso de falha, exceções são registradas e propagadas.

## Considerações Futuras

1. **Transações Distribuídas**: Avaliar a implementação de transações distribuídas para garantir atomicidade.
2. **Event Sourcing**: Considerar uma abordagem baseada em eventos para sincronização assíncrona.
3. **Resiliência**: Implementar mecanismos de retry e compensação para falhas de rede.

## Conclusão

A persistência dual em MariaDB e Neo4j permite que o Beaver ofereça tanto consultas relacionais eficientes quanto análises de grafo poderosas, enquanto mantém a consistência dos dados em ambos os sistemas de armazenamento.
