# Relatório de Análise de Impacto nas APIs Existentes - Beaver v2.0

## Sumário Executivo

Este relatório apresenta uma análise detalhada do impacto das mudanças arquiteturais da versão 2.0 do Beaver nas APIs existentes da versão 1.x. Foram identificados pontos críticos de mudança que podem afetar integrações existentes, bem como estratégias de mitigação para garantir compatibilidade.

## 1. Principais Mudanças com Impacto em APIs

### 1.1. Substituição de Enums por Tabelas

| Enum Removido | Nova Tabela | Impacto |
|---------------|-------------|---------|
| `Env` | `Environment` | Alto - Afeta queries e mutations de Componentes |
| `RoadmapItemType` | `RoadmapType` | Alto - Afeta queries e mutations de RoadmapItems |

### 1.2. Alterações na Estrutura de Relacionamentos

| Entidade | Alteração | Impacto |
|----------|-----------|---------|
| `ADR` | Removido `owner_id`, adicionado `ADR_Participant` | Alto - Afeta queries de ADR e mutations de criação/atualização |
| `Component` | Removido `env`, adicionado relacionamento com `Environment` via `Component_Instance` | Alto - Afeta todas as operações de componentes |
| `RoadmapItem` | Removido `type` (enum), adicionado `type_id` (referência) | Médio - Afeta queries e mutations, mas com mapeamento direto |

### 1.3. Novas Entidades e Relacionamentos

| Nova Entidade | Relacionada Com | Impacto |
|---------------|-----------------|---------|
| `Component_Instance` | `Component`, `Environment` | Alto - Adiciona novo conceito |
| `Team` | `Component`, `User` | Médio - Adiciona informação opcional |
| `ADR_Participant` | `ADR`, `User` | Alto - Substitui relacionamento direto |

## 2. Estratégia de Mitigação

Para garantir compatibilidade com integrações existentes, implementamos as seguintes estratégias:

### 2.1. Camada de Compatibilidade

Foi desenvolvida uma camada de compatibilidade para traduzir entre os formatos antigos e novos:

```typescript
// utils/compatibility.ts
export async function getEnvironmentIdFromLegacyEnum(prisma, legacyEnv) {
  const environment = await prisma.environment.findFirst({
    where: { name: legacyEnv }
  });
  
  if (!environment) {
    throw new Error(`Environment not found for legacy value: ${legacyEnv}`);
  }
  
  return environment.id;
}

export async function getRoadmapTypeIdFromLegacyEnum(prisma, legacyType) {
  const type = await prisma.roadmapType.findFirst({
    where: { name: legacyType }
  });
  
  if (!type) {
    throw new Error(`RoadmapType not found for legacy value: ${legacyType}`);
  }
  
  return type.id;
}
```

### 2.2. Adaptadores nos Resolvers GraphQL

Foram implementados adaptadores nos resolvers GraphQL para manter compatibilidade com o esquema antigo:

#### 2.2.1. Adaptador para ADR

```typescript
// Exemplo de adaptador para manter compatibilidade com o campo 'owner'
const ADRType = builder.prismaObject('ADR', {
  fields: (t) => ({
    // Campos básicos
    id: t.exposeID('id'),
    title: t.exposeString('title'),
    description: t.exposeString('description', { nullable: true }),
    status: t.expose('status', { type: ADRStatus }),
    createdAt: t.expose('created_at', { type: 'DateTime' }),
    
    // Campo compatível com v1.x
    owner: t.field({
      type: 'User',
      nullable: true,
      resolve: async (adr, _, ctx) => {
        const ownerParticipant = await ctx.prisma.aDRParticipant.findFirst({
          where: { adr_id: adr.id, role: 'owner' },
          include: { user: true },
        });
        return ownerParticipant?.user || null;
      },
    }),
    
    // Novos campos da v2.0
    participants: t.relation('participants'),
  }),
});
```

#### 2.2.2. Adaptador para Component

```typescript
// Exemplo de adaptador para manter compatibilidade com o campo 'env'
const ComponentType = builder.prismaObject('Component', {
  fields: (t) => ({
    // Campos básicos
    id: t.exposeID('id'),
    name: t.exposeString('name'),
    description: t.exposeString('description', { nullable: true }),
    status: t.expose('status', { type: Status }),
    createdAt: t.expose('created_at', { type: 'DateTime' }),
    
    // Campo compatível com v1.x
    env: t.field({
      type: 'String',
      resolve: async (component, _, ctx) => {
        const devInstance = await ctx.prisma.componentInstance.findFirst({
          where: { component_id: component.id },
          include: { environment: true },
          orderBy: { environment: { name: 'asc' } }, // Prioriza 'development'
        });
        return devInstance?.environment?.name || 'development';
      },
    }),
    
    // Novos campos da v2.0
    team: t.relation('team', { nullable: true }),
    instances: t.relation('instances'),
  }),
});
```

### 2.3. Migração de Dados

Durante a migração, os valores de enum existentes na v1.x foram mapeados para registros nas novas tabelas da v2.0:

```sql
-- Ambiente default para cada componente baseado no campo 'env' anterior
INSERT INTO Component_Instance (component_id, environment_id, created_at)
SELECT c.id, e.id, NOW()
FROM Component c
JOIN Environment e ON e.name = c.env;

-- Participante owner para cada ADR baseado no campo 'owner_id' anterior
INSERT INTO ADR_Participant (adr_id, user_id, role, created_at)
SELECT id, owner_id, 'owner', created_at
FROM ADR;
```

## 3. Testes de Compatibilidade

Foram implementados testes específicos para verificar a compatibilidade com as APIs existentes:

- Testes de conversão de enums legados para IDs de entidades
- Testes de preservação da estrutura de resposta para ADRs (mantendo `owner`)
- Testes de preservação da estrutura de resposta para Components (mantendo `env`)
- Testes de preservação da estrutura de resposta para RoadmapItems (mantendo `type`)
- Testes de tratamento adequado de erros para valores inexistentes

## 4. Análise de Impacto por Endpoint GraphQL

### 4.1. Queries

| Query | Impacto | Mitigação |
|-------|---------|-----------|
| `component` | Médio | Adaptador para preservar `env` |
| `components` | Médio | Adaptador + filtro por ambiente |
| `adr` | Médio | Adaptador para preservar `owner` |
| `adrs` | Médio | Adaptador + filtro por owner |
| `roadmapItem` | Baixo | Adaptador para preservar `type` |
| `roadmapItems` | Baixo | Adaptador + filtro por tipo |

### 4.2. Mutations

| Mutation | Impacto | Mitigação |
|----------|---------|-----------|
| `createComponent` | Alto | Aceita `env` e cria instância automaticamente |
| `updateComponent` | Alto | Aceita `env` e atualiza instância correspondente |
| `createADR` | Alto | Aceita `ownerId` e cria participante automaticamente |
| `updateADR` | Alto | Preserva participante owner ao atualizar |
| `createRoadmapItem` | Médio | Aceita `type` e converte para `typeId` |
| `updateRoadmapItem` | Médio | Aceita ambos `type` e `typeId` |

## 5. Recomendações para Clientes da API

### 5.1. Mudanças Recomendadas para Clientes

1. **Migração Gradual**: Recomendamos que os clientes da API migrem gradualmente para usar os novos campos e entidades.

2. **Utilização de Instâncias**: Ao invés de usar o campo `env`, utilize queries específicas para `componentInstances` para obter informações mais detalhadas sobre implantações em ambientes específicos.

3. **Participantes de ADR**: Ao invés de usar `ownerId`, utilize o array `participants` para gerenciar todos os envolvidos em um ADR, incluindo múltiplos reviewers.

### 5.2. Cronograma de Depreciação

| Fase | Data | Ação |
|------|------|------|
| Compatibilidade Total | 2025-Q3 | Lançamento da v2.0 com compatibilidade total com v1.x |
| Aviso de Depreciação | 2025-Q4 | Mensagens de aviso para uso de campos legados |
| Compatibilidade Parcial | 2026-Q1 | Remoção de compatibilidade para recursos menos utilizados |
| Compatibilidade Mínima | 2026-Q2 | Manutenção apenas de adaptadores críticos |
| Quebra de Compatibilidade | 2026-Q3 | Lançamento da v2.1 sem garantia de compatibilidade |

## 6. Conclusão

A análise indica que, apesar das mudanças estruturais significativas, é possível manter compatibilidade com as APIs existentes através de adaptadores e camadas de tradução. Os testes implementados demonstram que os clientes da v1.x podem continuar utilizando a API sem alterações imediatas, embora seja recomendado planejar a migração para aproveitar os novos recursos e melhorias da v2.0.

Recomendamos manter a camada de compatibilidade por pelo menos 12 meses após o lançamento, permitindo que os clientes tenham tempo suficiente para adaptar suas integrações.

---

## Anexo: Impactos Específicos e Técnicos

### Campo `env` em Componentes

**Antes (v1.x)**:
```graphql
{
  component(id: 1) {
    id
    name
    env # Retornava diretamente: "development", "production", etc.
  }
}
```

**Depois (v2.0 com adaptador)**:
```graphql
{
  component(id: 1) {
    id
    name
    env # Adaptado: retorna o nome do ambiente da primeira instância
    instances { # Novo campo
      id
      environment {
        id
        name # O mesmo valor que antes era retornado diretamente
      }
    }
  }
}
```

### Campo `owner` em ADRs

**Antes (v1.x)**:
```graphql
{
  adr(id: 1) {
    id
    title
    owner { # Direto da relação owner_id
      id
      username
    }
  }
}
```

**Depois (v2.0 com adaptador)**:
```graphql
{
  adr(id: 1) {
    id
    title
    owner { # Adaptado: retorna o usuário do primeiro participante com role="owner"
      id
      username
    }
    participants { # Novo campo
      role
      user {
        id
        username
      }
    }
  }
}
```

### Campo `type` em RoadmapItems

**Antes (v1.x)**:
```graphql
{
  roadmapItem(id: 1) {
    id
    title
    type # Retornava string: "feature", "bug", etc.
  }
}
```

**Depois (v2.0 com adaptador)**:
```graphql
{
  roadmapItem(id: 1) {
    id
    title
    type # Adaptado: retorna o name do tipo relacionado
    typeDetails { # Novo campo
      id
      name # O mesmo valor que antes era retornado diretamente
      color_hex # Informação adicional
    }
  }
}
``` 