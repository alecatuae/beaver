<!-- # Documentação da API Beaver v2.0 -->

## Sumário

1. [Introdução](#introdução)
2. [Alterações na v2.0](#alterações-na-v20)
3. [Esquema GraphQL](#esquema-graphql)
4. [APIs e Endpoints](#apis-e-endpoints)
5. [Compatibilidade com v1.x](#compatibilidade-com-v1x)
6. [Exemplos de Uso](#exemplos-de-uso)
7. [Tratamento de Erros](#tratamento-de-erros)
8. [Versionamento](#versionamento)
9. [Guia de Migração](#guia-de-migração)

## Introdução

A API Beaver v2.0 é implementada como um servidor GraphQL utilizando Apollo Server 4.12.x e Pothos GraphQL 3.41.x. A API fornece interfaces para gerenciar componentes de arquitetura, ADRs (Architecture Decision Records), roadmaps e o glossário técnico da organização.

Esta documentação descreve todas as operações disponíveis, mudanças desde a versão 1.x e fornece orientações sobre como migrar aplicações existentes.

## Alterações na v2.0

### Principais Mudanças Estruturais

1. **Substituição de Enums por Tabelas**
   - `Env` → `Environment` (tabela)
   - `RoadmapItemType` → `RoadmapType` (tabela)

2. **Novas Entidades**
   - `Component_Instance`: Permite um componente existir em múltiplos ambientes
   - `Team`: Gerenciamento de times e associação com componentes
   - `ADR_Participant`: Múltiplos participantes por ADR com diferentes funções

3. **Alterações em Relacionamentos**
   - ADR: Removido `owner_id`, adicionado relacionamento via `ADR_Participant`
   - Component: Removido `env`, adicionado relacionamento com `Environment` via `Component_Instance`
   - RoadmapItem: Removido `type` (enum), adicionado `type_id` (referência)

## Esquema GraphQL

### Tipos Principais

#### Component

```graphql
type Component {
  id: ID!
  name: String!
  description: String
  status: Status!
  createdAt: Date!
  team: Team
  instances: [ComponentInstance!]!
  # Campo mantido para compatibilidade com v1.x
  env: String
}
```

#### ComponentInstance

```graphql
type ComponentInstance {
  id: ID!
  componentId: Int!
  environmentId: Int!
  hostname: String
  specs: JSON
  createdAt: Date!
  component: Component!
  environment: Environment!
  adrInstances: [ADRComponentInstance!]!
}
```

#### ADR

```graphql
type ADR {
  id: ID!
  title: String!
  description: String
  status: ADRStatus!
  createdAt: Date!
  participants: [ADRParticipant!]!
  # Campo mantido para compatibilidade com v1.x
  owner: User
}
```

#### RoadmapItem

```graphql
type RoadmapItem {
  id: ID!
  title: String!
  description: String
  componentId: Int
  typeId: Int!
  status: RoadmapStatus!
  dueDate: Date
  createdAt: Date!
  component: Component
  type: RoadmapType!
  # Campo mantido para compatibilidade com v1.x
  typeString: String
}
```

### Queries

```graphql
type Query {
  # Componentes
  component(id: ID!): Component
  components(
    status: Status
    environmentId: ID
    # Parâmetro mantido para compatibilidade
    env: String
  ): [Component!]!
  componentInstances(componentId: ID!): [ComponentInstance!]!
  
  # ADRs
  adr(id: ID!): ADR
  adrs(
    status: ADRStatus
    # Parâmetro mantido para compatibilidade
    ownerId: ID
  ): [ADR!]!
  
  # Roadmap
  roadmapItem(id: ID!): RoadmapItem
  roadmapItems(
    status: RoadmapStatus
    componentId: ID
    typeId: ID
    # Parâmetro mantido para compatibilidade
    type: String
  ): [RoadmapItem!]!
  
  # Glossário
  glossaryTerm(id: ID!): GlossaryTerm
  glossaryTerms(status: GlossaryStatus): [GlossaryTerm!]!
  
  # Times
  team(id: ID!): Team
  teams: [Team!]!
  
  # Ambientes
  environment(id: ID!): Environment
  environments: [Environment!]!
  
  # Visualização
  componentGraph(componentId: ID!): GraphData!
}
```

### Mutations

```graphql
type Mutation {
  # Componentes
  createComponent(input: ComponentInput!): Component!
  updateComponent(id: ID!, input: ComponentInput!): Component!
  deleteComponent(id: ID!): Boolean!
  
  # Instâncias de Componentes
  createComponentInstance(input: ComponentInstanceInput!): ComponentInstance!
  updateComponentInstance(id: ID!, input: ComponentInstanceInput!): ComponentInstance!
  deleteComponentInstance(id: ID!): Boolean!
  
  # ADRs
  createADR(input: ADRInput!): ADR!
  updateADR(id: ID!, input: ADRInput!): ADR!
  deleteADR(id: ID!): Boolean!
  
  # Participantes de ADR
  addADRParticipant(adrId: ID!, userId: ID!, role: ParticipantRole!): ADRParticipant!
  removeADRParticipant(id: ID!): Boolean!
  
  # Roadmap
  createRoadmapItem(input: RoadmapItemInput!): RoadmapItem!
  updateRoadmapItem(id: ID!, input: RoadmapItemInput!): RoadmapItem!
  deleteRoadmapItem(id: ID!): Boolean!
  
  # Glossário
  createGlossaryTerm(input: GlossaryTermInput!): GlossaryTerm!
  updateGlossaryTerm(id: ID!, input: GlossaryTermInput!): GlossaryTerm!
  deleteGlossaryTerm(id: ID!): Boolean!
  
  # Times
  createTeam(input: TeamInput!): Team!
  updateTeam(id: ID!, input: TeamInput!): Team!
  deleteTeam(id: ID!): Boolean!
  addTeamMember(teamId: ID!, userId: ID!, role: String!): TeamMember!
  removeTeamMember(id: ID!): Boolean!
}
```

## APIs e Endpoints

O servidor GraphQL é acessível em `/graphql`. Todas as operações são realizadas através deste endpoint utilizando o protocolo GraphQL.

### Autenticação

A autenticação é realizada através de JWT (JSON Web Tokens). O token deve ser enviado no cabeçalho `Authorization` no formato `Bearer {token}`.

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Compatibilidade com v1.x

Para facilitar a migração e garantir compatibilidade com aplicações existentes, a API v2.0 implementa:

1. **Campos Compatíveis**
   - `Component.env`: Retorna o ambiente da primeira instância do componente
   - `ADR.owner`: Retorna o usuário do primeiro participante com função "owner"
   - `RoadmapItem.typeString`: Retorna o nome do tipo de roadmap como string

2. **Parâmetros Compatíveis em Queries**
   - `components(env: String)`: Traduzido para filtro por nome de ambiente
   - `adrs(ownerId: ID)`: Traduzido para filtro por participante com função "owner"
   - `roadmapItems(type: String)`: Traduzido para filtro por nome de tipo

3. **Parâmetros Compatíveis em Mutations**
   - `createComponent(env: String)`: Cria automaticamente uma instância no ambiente especificado
   - `createADR(ownerId: ID)`: Cria automaticamente um participante com função "owner"
   - `createRoadmapItem(type: String)`: Traduzido para o ID do tipo correspondente

## Exemplos de Uso

### Criar um Componente (v2.0)

```graphql
mutation {
  createComponent(input: {
    name: "API Gateway",
    description: "Gateway para serviços internos",
    status: ACTIVE,
    teamId: 1,
    categoryId: 2
  }) {
    id
    name
  }
}
```

### Criar um Componente (compatível com v1.x)

```graphql
mutation {
  createComponent(
    name: "API Gateway",
    description: "Gateway para serviços internos",
    status: ACTIVE,
    env: "development"
  ) {
    id
    name
    env
  }
}
```

### Criar uma Instância de Componente (v2.0)

```graphql
mutation {
  createComponentInstance(input: {
    componentId: 1,
    environmentId: 2,
    hostname: "api-gateway.prod",
    specs: { cpu: "4", memory: "8Gi" }
  }) {
    id
    environment {
      name
    }
  }
}
```

### Criar um ADR (v2.0)

```graphql
mutation {
  createADR(input: {
    title: "Migração para Kubernetes",
    description: "Decisão sobre migração de infraestrutura",
    status: DRAFT,
    participants: [
      { userId: 1, role: OWNER },
      { userId: 2, role: REVIEWER }
    ]
  }) {
    id
    title
  }
}
```

## Tratamento de Erros

A API utiliza o formato padrão GraphQL para erros:

```json
{
  "errors": [
    {
      "message": "ERR-1001-01-01: Componente não encontrado",
      "locations": [{ "line": 2, "column": 3 }],
      "path": ["component"],
      "extensions": {
        "code": "ERR-1001-01-01",
        "classification": "DataNotFoundError"
      }
    }
  ]
}
```

### Códigos de Erro

Os códigos de erro seguem o formato `ERR-XXXX-YY-ZZ`:

- **XXXX**: Categoria do erro (1001 = Componente, 1002 = ADR, etc.)
- **YY**: Subcategoria (01 = Query, 02 = Mutation, etc.)
- **ZZ**: Erro específico (01 = Não encontrado, 02 = Validação, etc.)

## Versionamento

A API segue o versionamento semântico:

- **Alterações Breaking**: Incremento da versão maior (2.0 → 3.0)
- **Novas Funcionalidades**: Incremento da versão menor (2.0 → 2.1)
- **Correções de Bugs**: Incremento da versão de patch (2.0 → 2.0.1)

## Guia de Migração

### De v1.x para v2.0

1. **Componentes**
   - Substituir referências a `env` por consultas a `instances` e `environment`
   - Utilizar `createComponentInstance` para criar instâncias em múltiplos ambientes

2. **ADRs**
   - Substituir referências a `owner` por consultas a `participants`
   - Utilizar `addADRParticipant` para adicionar participantes em diferentes funções

3. **RoadmapItems**
   - Substituir referências a `type` (string) por consultas a `type` (objeto)
   - Utilizar `typeId` em vez de `type` para criar ou atualizar itens

### Cronograma de Depreciação

| Fase | Data | Ação |
|------|------|------|
| Compatibilidade Total | 2025-Q3 | Lançamento da v2.0 com compatibilidade total com v1.x |
| Aviso de Depreciação | 2025-Q4 | Mensagens de aviso para uso de campos legados |
| Compatibilidade Parcial | 2026-Q1 | Remoção de compatibilidade para recursos menos utilizados |
| Compatibilidade Mínima | 2026-Q2 | Manutenção apenas de adaptadores críticos |
| Quebra de Compatibilidade | 2026-Q3 | Lançamento da v2.1 sem garantia de compatibilidade | 