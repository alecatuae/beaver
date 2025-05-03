# Integração Neo4j para Beaver v2.0

Este diretório contém os módulos para integração estendida com Neo4j para suporte às novas entidades e relacionamentos introduzidos na versão 2.0 do Beaver.

## Novas Entidades e Relacionamentos

A versão 2.0 do Beaver introduz várias novas entidades que precisam ser sincronizadas entre o MariaDB e o Neo4j:

### Nós

| Nó | Descrição |
|----|-----------|
| `:Environment` | Ambientes onde os componentes são implantados (development, homologation, production) |
| `:Team` | Times responsáveis pelos componentes |
| `:ComponentInstance` | Instâncias específicas de componentes em ambientes |

### Relacionamentos

| Relacionamento | Descrição |
|----------------|-----------|
| `:INSTANTIATES` | De um componente para sua instância específica |
| `:DEPLOYED_IN` | De uma instância para o ambiente onde está implantada |
| `:MANAGED_BY` | De um componente para o time responsável |
| `:PARTICIPATES_IN` | De um usuário para um ADR, com papel específico (owner, reviewer, consumer) |
| `:AFFECTS_INSTANCE` | De um ADR para uma instância específica de componente |

## Arquivos

- **neo4j_integration_v2.ts**: Classe principal que implementa a funcionalidade de sincronização
- **neo4j_v2_integration.ts**: Script executável para operações de sincronização a partir da linha de comando

## Uso do Script de Integração

```bash
# Executar a sincronização completa
node dist/db/neo4j_v2_integration.js all

# Sincronizar apenas ambientes
node dist/db/neo4j_v2_integration.js environments

# Sincronizar apenas times
node dist/db/neo4j_v2_integration.js teams

# Sincronizar apenas instâncias de componentes
node dist/db/neo4j_v2_integration.js component-instances

# Sincronizar apenas participantes de ADRs
node dist/db/neo4j_v2_integration.js adr-participants

# Sincronizar apenas relações ADR-Instância
node dist/db/neo4j_v2_integration.js adr-instances

# Validar a integridade entre MariaDB e Neo4j
node dist/db/neo4j_v2_integration.js validate

# Corrigir problemas de integridade
node dist/db/neo4j_v2_integration.js fix

# Exibir ajuda
node dist/db/neo4j_v2_integration.js help
```

## Uso Programático

```typescript
import { driver } from '../neo4j';
import { Neo4jIntegrationV2 } from './neo4j_integration_v2';

// Criar instância do integrador
const integration = new Neo4jIntegrationV2(driver);

// Sincronizar todas as entidades
await integration.syncAllEntities();

// Validar integridade
const validationResult = await integration.validateIntegrity();
console.log(`Integridade válida: ${validationResult.valid}`);

// Corrigir problemas de integridade
if (!validationResult.valid) {
  const fixResult = await integration.fixIntegrityIssues();
  console.log(`Problemas corrigidos: ${fixResult.fixed}`);
}
```

## Validação de Integridade

O método `validateIntegrity()` verifica se há discrepâncias entre os dados no MariaDB e no Neo4j. Ele retorna um objeto com:

- `valid`: Boolean indicando se a sincronização está consistente
- `discrepancies`: Array de problemas encontrados
- `countsMariaDB`: Contagens de entidades no MariaDB
- `countsNeo4j`: Contagens de entidades no Neo4j

## Correção de Problemas

O método `fixIntegrityIssues()` tenta corrigir automaticamente os problemas encontrados pela validação de integridade:

1. Ressincroniza as entidades com discrepâncias
2. Corrige instâncias órfãs (sem relações INSTANTIATES ou DEPLOYED_IN)
3. Realiza uma nova validação para confirmar as correções

## Hooks de Prisma

Para manter a sincronização automática durante operações no MariaDB, recomenda-se usar os hooks do Prisma:

```typescript
// Em prisma.ts
import { PrismaClient } from '@prisma/client';
import { Neo4jIntegrationV2 } from './db/neo4j_integration_v2';
import { driver } from './neo4j';

const neo4jIntegration = new Neo4jIntegrationV2(driver);

export const prisma = new PrismaClient().$use(async (params, next) => {
  const result = await next(params);
  
  // Sincronizar após operações de criação/atualização/exclusão
  if (params.model === 'Environment' && ['create', 'update', 'delete'].includes(params.action)) {
    await neo4jIntegration.syncEnvironments();
  }
  
  if (params.model === 'Team' && ['create', 'update', 'delete'].includes(params.action)) {
    await neo4jIntegration.syncTeams();
  }
  
  if (params.model === 'ComponentInstance' && ['create', 'update', 'delete'].includes(params.action)) {
    await neo4jIntegration.syncComponentInstances();
  }
  
  if (params.model === 'ADRParticipant' && ['create', 'update', 'delete'].includes(params.action)) {
    await neo4jIntegration.syncADRParticipants();
  }
  
  if (params.model === 'ADRComponentInstance' && ['create', 'update', 'delete'].includes(params.action)) {
    await neo4jIntegration.syncADRComponentInstances();
  }
  
  return result;
});
```

## Consultas Cypher Úteis

### Buscar Instâncias por Ambiente

```cypher
MATCH (c:Component)-[:INSTANTIATES]->(ci:ComponentInstance)-[:DEPLOYED_IN]->(e:Environment)
WHERE e.name = 'production'
RETURN c.name as component, ci.hostname as instance, e.name as environment
```

### Buscar ADRs que Afetam uma Instância Específica

```cypher
MATCH (a:ADR)-[r:AFFECTS_INSTANCE]->(ci:ComponentInstance)
WHERE ci.id = 123
RETURN a.title, r.impact_level
```

### Buscar Participantes de um ADR

```cypher
MATCH (u:User)-[r:PARTICIPATES_IN]->(a:ADR)
WHERE a.id = 456
RETURN u.username, r.role
ORDER BY 
  CASE r.role 
    WHEN 'OWNER' THEN 1
    WHEN 'REVIEWER' THEN 2
    WHEN 'CONSUMER' THEN 3
  END, u.username
```

### Buscar Componentes por Time Responsável

```cypher
MATCH (c:Component)-[:MANAGED_BY]->(t:Team)
WHERE t.name = 'Platform'
RETURN c.name, c.status
```

## Considerações de Performance

A integração foi projetada para ser eficiente e minimizar o impacto no desempenho do sistema:

1. Usa transações Neo4j para operações em lote
2. Implementa o padrão MERGE para criar/atualizar nós e relacionamentos sem duplicação
3. Logs detalhados para facilitar o diagnóstico de problemas 