# Guia de Implementação Backend - Beaver v2.0

## Visão Geral das Mudanças

A versão 2.0 do Beaver introduz diversas mudanças significativas no backend que exigem refatoração cuidadosa da API e das camadas de acesso a dados. Este documento orienta desenvolvedores na implementação dessas alterações, destacando pontos críticos e fornecendo recomendações específicas.

## Principais Alterações e Impactos

### 1. Alterações no Schema do Banco de Dados

#### MariaDB (Prisma ORM)

- **Conversão de Enums para Tabelas**: 
  - `Env` → tabela `Environment`
  - `RoadmapType` → tabela `RoadmapType`
  
- **Novas Entidades**:
  - `Component_Instance`: Instâncias específicas de componentes em ambientes
  - `Team` e `Team_Member`: Times e associações a usuários
  - `ADR_Participant`: Substituição do `owner_id` em ADRs por um sistema de múltiplos participantes

- **Novos Relacionamentos**:
  - `component.team_id`: Associação a times responsáveis
  - `component_instance.environment_id` e `component_instance.component_id`
  - Relações ADR → Component_Instance com níveis de impacto

#### Neo4j

- **Novos Nós**:
  - `:ComponentInstance`
  - `:Environment`
  - `:Team`

- **Novas Relações**:
  - `:INSTANTIATES` (Component → ComponentInstance)
  - `:DEPLOYED_IN` (ComponentInstance → Environment)
  - `:MANAGED_BY` (Component → Team)
  - `:INSTANCE_CONNECTS_TO` (entre instâncias)
  - `:AFFECTS_INSTANCE` (ADR → ComponentInstance)
  - `:PARTICIPATES_IN` (User → ADR)

### 2. Impacto no GraphQL Schema (Pothos)

As alterações necessárias no schema GraphQL incluem:

- **Novos Tipos**:
  - `Environment`
  - `ComponentInstance`
  - `Team`
  - `TeamMember`
  - `ADRParticipant`
  - `RoadmapType`

- **Tipos Modificados**:
  - `Component` (adição de `teamId` e remoção de `env`)
  - `ADR` (remoção de `ownerId`, adição de relacionamentos com participantes)
  - `RoadmapItem` (referência a `typeId` em vez de enum)

- **Novos Resolvers e Mutations**:
  - CRUD para `Environment`, `ComponentInstance`, `Team`
  - Gerenciamento de participantes em ADRs
  - Consultas para instâncias por ambiente

## Guia de Implementação Detalhado

### 1. Preparação da Migração do Prisma

1. **Atualize o Schema do Prisma**:

```prisma
// Novas entidades
model Environment {
  id            Int      @id @default(autoincrement())
  name          String   @unique @db.VarChar(50)
  description   String?  @db.VarChar(255)
  created_at    DateTime @default(now())
  instances     ComponentInstance[]
}

model Team {
  id            Int      @id @default(autoincrement())
  name          String   @unique @db.VarChar(80)
  description   String?  @db.Text
  created_at    DateTime @default(now())
  components    Component[]
  members       TeamMember[]
}

model TeamMember {
  id            Int      @id @default(autoincrement())
  team_id       Int
  user_id       Int
  join_date     DateTime @db.Date
  created_at    DateTime @default(now())
  team          Team     @relation(fields: [team_id], references: [id], onDelete: Cascade)
  user          User     @relation(fields: [user_id], references: [id], onDelete: Cascade)

  @@unique([team_id, user_id])
}

model ComponentInstance {
  id            Int      @id @default(autoincrement())
  component_id  Int
  environment_id Int
  hostname      String?  @db.VarChar(120)
  specs         Json?    
  created_at    DateTime @default(now())
  component     Component @relation(fields: [component_id], references: [id], onDelete: Cascade)
  environment   Environment @relation(fields: [environment_id], references: [id], onDelete: Restrict)
  adr_instances ADRComponentInstance[]

  @@unique([component_id, environment_id])
}

// Modificações em entidades existentes
model Component {
  id            Int      @id @default(autoincrement())
  name          String   @unique @db.VarChar(120)
  description   String?  @db.Text
  status        Status   @default(active)
  // Remover: env          Env      @default(dev)
  team_id       Int?
  team          Team?    @relation(fields: [team_id], references: [id], onDelete: SetNull)
  category_id   Int?
  category      Category? @relation(fields: [category_id], references: [id], onDelete: SetNull)
  created_at    DateTime @default(now())
  instances     ComponentInstance[]
  tags          ComponentTag[]
}

model ADR {
  id            Int      @id @default(autoincrement())
  title         String   @db.VarChar(200)
  description   String?  @db.Text
  status        ADRStatus @default(draft)
  // Remover: owner_id      Int
  // Remover: owner         User     @relation(fields: [owner_id], references: [id], onDelete: Restrict)
  created_at    DateTime @default(now())
  participants  ADRParticipant[]
  component_instances ADRComponentInstance[]
}

model ADRParticipant {
  id            Int      @id @default(autoincrement())
  adr_id        Int
  user_id       Int
  role          ParticipantRole
  created_at    DateTime @default(now())
  adr           ADR      @relation(fields: [adr_id], references: [id], onDelete: Cascade)
  user          User     @relation(fields: [user_id], references: [id], onDelete: Cascade)

  @@unique([adr_id, user_id])
}

model RoadmapType {
  id            Int      @id @default(autoincrement())
  name          String   @unique @db.VarChar(40)
  description   String?  @db.VarChar(120)
  color_hex     String   @db.Char(7)
  created_at    DateTime @default(now())
  items         RoadmapItem[]
}

// Atualizar RoadmapItem
model RoadmapItem {
  id            Int      @id @default(autoincrement())
  title         String   @db.VarChar(200)
  description   String?  @db.Text
  component_id  Int?
  // Substituir: type    RoadmapItemType
  type_id       Int
  type          RoadmapType @relation(fields: [type_id], references: [id], onDelete: Restrict)
  status        RoadmapStatus @default(todo)
  due_date      DateTime? @db.Date
  created_at    DateTime @default(now())
  component     Component? @relation(fields: [component_id], references: [id], onDelete: SetNull)
}
```

2. **Crie Migrations SQL Manuais**:
   
Antes de executar `prisma migrate` normal, crie um script de migração para converter dados existentes:

```sql
-- Arquivo: ./prisma/migrations/manual/convert_enums_to_tables.sql

-- Criar tabelas e preencher com dados de enums
CREATE TABLE Environment (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  description VARCHAR(255),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO Environment(name, description) 
VALUES 
  ('dev', 'Development Environment'),
  ('homolog', 'Homologation Environment'),
  ('prod', 'Production Environment');

CREATE TABLE RoadmapType (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(40) UNIQUE NOT NULL,
  description VARCHAR(120),
  color_hex CHAR(7) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO RoadmapType(name, description, color_hex) 
VALUES 
  ('feature', 'New feature', '#4CAF50'),
  ('refactor', 'Code refactoring', '#2196F3'),
  ('technical_debt', 'Technical debt', '#FFC107'),
  ('infra', 'Infrastructure', '#9C27B0'),
  ('maintenance', 'Maintenance', '#607D8B'),
  ('incident', 'Incident resolution', '#F44336'),
  ('capacity', 'Capacity increase', '#3F51B5');

-- Converter ADRs para o novo modelo de participantes
-- Este passo deve ocorrer DEPOIS da criação da tabela ADRParticipant
INSERT INTO ADRParticipant (adr_id, user_id, role, created_at)
SELECT id, owner_id, 'owner', created_at FROM ADR;
```

3. **Script de Migração Automatizada**:

Crie um script para executar as migrações e a conversão de dados:

```javascript
// scripts/migrate-v2.js
const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

async function main() {
  // Backup do banco
  console.log('Fazendo backup do banco de dados...');
  execSync('docker exec -it mariadb mariabackup --backup --user=root --password=root --target-dir=/backup');
  
  const prisma = new PrismaClient();
  
  try {
    // Passo 1: Criar tabelas novas sem dependências
    console.log('Executando migração inicial...');
    execSync('npx prisma migrate dev --name add_environments_teams_roadmaptypes');
    
    // Passo 2: Executar script manual de conversão
    console.log('Convertendo dados de enums para tabelas...');
    const sqlScript = fs.readFileSync(
      path.join(__dirname, '../prisma/migrations/manual/convert_enums_to_tables.sql'),
      'utf8'
    );
    
    // Execute statements individualmente
    const statements = sqlScript
      .split(';')
      .filter(stmt => stmt.trim())
      .map(stmt => stmt.trim() + ';');
    
    for (const stmt of statements) {
      await prisma.$executeRawUnsafe(stmt);
    }
    
    // Passo 3: Atualizar modelos que dependem das novas tabelas
    console.log('Aplicando migrações restantes...');
    execSync('npx prisma migrate dev --name update_component_adr_relations');
    
    // Passo 4: Verificações finais
    const envCount = await prisma.environment.count();
    const typeCount = await prisma.roadmapType.count();
    
    console.log(`Migração concluída. Verificações: ${envCount} ambientes, ${typeCount} tipos de roadmap`);
    
  } catch (error) {
    console.error('Erro durante migração:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
```

### 2. Atualizações no Pothos GraphQL

1. **Definição de Novos Tipos**:

```typescript
// schema/objects/environment.ts
import { builder } from '../builder';

builder.prismaObject('Environment', {
  fields: (t) => ({
    id: t.exposeID('id'),
    name: t.exposeString('name'),
    description: t.exposeString('description', { nullable: true }),
    createdAt: t.expose('created_at', { type: 'DateTime' }),
    instances: t.relation('instances'),
  }),
});

// Crie arquivos similares para Team, TeamMember, ComponentInstance, etc.
```

2. **Atualização de Tipos Existentes**:

```typescript
// schema/objects/component.ts (atualizar)
import { builder } from '../builder';

builder.prismaObject('Component', {
  fields: (t) => ({
    id: t.exposeID('id'),
    name: t.exposeString('name'),
    description: t.exposeString('description', { nullable: true }),
    status: t.expose('status', { type: Status }),
    // Remover env
    team: t.relation('team', { nullable: true }),
    category: t.relation('category', { nullable: true }),
    createdAt: t.expose('created_at', { type: 'DateTime' }),
    instances: t.relation('instances'),
    tags: t.relation('tags'),
  }),
});

// schema/objects/adr.ts (atualizar)
builder.prismaObject('ADR', {
  fields: (t) => ({
    id: t.exposeID('id'),
    title: t.exposeString('title'),
    description: t.exposeString('description', { nullable: true }),
    status: t.expose('status', { type: ADRStatus }),
    // Remover owner
    participants: t.relation('participants'),
    createdAt: t.expose('created_at', { type: 'DateTime' }),
    componentInstances: t.relation('component_instances'),
  }),
});
```

3. **Novos Inputs e Enums**:

```typescript
// schema/inputs/adrParticipant.ts
const ParticipantRole = builder.enumType('ParticipantRole', {
  values: ['owner', 'reviewer', 'consumer'] as const,
});

const ParticipantInput = builder.inputType('ParticipantInput', {
  fields: (t) => ({
    userId: t.int({ required: true }),
    role: t.field({ type: ParticipantRole, required: true }),
  }),
});

// schema/inputs/componentInstance.ts
const ComponentInstanceInput = builder.inputType('ComponentInstanceInput', {
  fields: (t) => ({
    componentId: t.int({ required: true }),
    environmentId: t.int({ required: true }),
    hostname: t.string({ required: false }),
    specs: t.field({ type: 'JSON', required: false }),
  }),
});
```

4. **Novos Queries**:

```typescript
// schema/queries/environmentQueries.ts
builder.queryFields((t) => ({
  environments: t.prismaField({
    type: ['Environment'],
    resolve: (query) => prisma.environment.findMany({ ...query }),
  }),
  environment: t.prismaField({
    type: 'Environment',
    args: {
      id: t.arg.int({ required: true }),
    },
    resolve: (query, _root, args) => 
      prisma.environment.findUniqueOrThrow({
        ...query,
        where: { id: args.id },
      }),
  }),
}));

// Adicione queries similares para teams, componentInstances, etc.
```

5. **Novas Mutations**:

```typescript
// schema/mutations/adrMutations.ts (atualizar)
builder.mutationFields((t) => ({
  createADR: t.prismaField({
    type: 'ADR',
    args: {
      title: t.arg.string({ required: true }),
      description: t.arg.string(),
      status: t.arg({ type: ADRStatus, defaultValue: 'draft' }),
      participants: t.arg({ type: [ParticipantInput], required: true }), // Nova lista de participantes
      componentsIds: t.arg.intList(),
      instancesIds: t.arg.intList(),
    },
    resolve: async (query, _root, args) => {
      // Validar que pelo menos um participante tem o papel 'owner'
      const hasOwner = args.participants.some(p => p.role === 'owner');
      if (!hasOwner) {
        throw new Error('ADR must have at least one owner');
      }
      
      return prisma.aDR.create({
        ...query,
        data: {
          title: args.title,
          description: args.description,
          status: args.status,
          participants: {
            create: args.participants.map(p => ({
              user: { connect: { id: p.userId } },
              role: p.role,
            })),
          },
          // Adicionar lógica para components e instances
        },
      });
    },
  }),
  // Implementar updateADR e deleteADR
}));

// Implementar mutations para ComponentInstance, Team, etc.
```

### 3. Atualizações na Integração com Neo4j

1. **Funções para Sincronização**:

```typescript
// db/neo4j.ts (extender)

// Sincronizar uma instância de componente
export async function syncComponentInstance(instance: ComponentInstance) {
  const session = driver.session();
  
  try {
    // 1. Criar/atualizar o nó da instância
    await session.executeWrite(tx => 
      tx.run(`
        MERGE (ci:ComponentInstance {id: $id})
        ON CREATE SET
          ci.component_id = $componentId,
          ci.environment_id = $environmentId,
          ci.hostname = $hostname,
          ci.specs = $specs,
          ci.created_at = datetime()
        ON MATCH SET
          ci.hostname = $hostname,
          ci.specs = $specs
        RETURN ci
      `, {
        id: instance.id,
        componentId: instance.component_id,
        environmentId: instance.environment_id,
        hostname: instance.hostname || null,
        specs: instance.specs || null
      })
    );
    
    // 2. Criar/verificar relação INSTANTIATES do componente para a instância
    await session.executeWrite(tx => 
      tx.run(`
        MATCH (c:Component {id: $componentId}), (ci:ComponentInstance {id: $instanceId})
        MERGE (c)-[:INSTANTIATES]->(ci)
      `, {
        componentId: instance.component_id,
        instanceId: instance.id
      })
    );
    
    // 3. Criar/verificar relação DEPLOYED_IN da instância para o ambiente
    await session.executeWrite(tx => 
      tx.run(`
        MATCH (ci:ComponentInstance {id: $instanceId}), (e:Environment {id: $environmentId})
        MERGE (ci)-[:DEPLOYED_IN]->(e)
      `, {
        instanceId: instance.id,
        environmentId: instance.environment_id
      })
    );
    
    return true;
  } finally {
    await session.close();
  }
}

// Sincronizar participante de ADR
export async function syncADRParticipant(participant: ADRParticipant) {
  const session = driver.session();
  
  try {
    // Criar relação PARTICIPATES_IN do usuário para o ADR
    await session.executeWrite(tx => 
      tx.run(`
        MATCH (u:User {id: $userId}), (a:ADR {id: $adrId})
        MERGE (u)-[:PARTICIPATES_IN {role: $role}]->(a)
      `, {
        userId: participant.user_id,
        adrId: participant.adr_id,
        role: participant.role
      })
    );
    
    return true;
  } finally {
    await session.close();
  }
}

// Adicionar funções similares para Environment, Team, etc.
```

2. **Hooks de Prisma para Sincronização Automática**:

```typescript
// prisma.ts (extender)
import { syncComponentInstance, syncADRParticipant } from './db/neo4j';

prisma.$use(async (params, next) => {
  const result = await next(params);
  
  // Sincronizar após operações de criação/atualização
  if (params.model === 'ComponentInstance' && 
      (params.action === 'create' || params.action === 'update')) {
    await syncComponentInstance(result);
  }
  
  if (params.model === 'ADRParticipant' && 
      (params.action === 'create' || params.action === 'update')) {
    await syncADRParticipant(result);
  }
  
  // Adicionar hooks para Environment, Team, etc.
  
  return result;
});
```

### 4. Validações e Regras de Negócio

1. **Verificação de pelo menos um owner em ADRs**:

```typescript
// utils/validators.ts
export function validateADRParticipants(participants: { userId: number; role: string }[]) {
  const hasOwner = participants.some(p => p.role === 'owner');
  if (!hasOwner) {
    throw new Error('ADR must have at least one owner');
  }
  return true;
}
```

2. **Validação de Unicidade de Instâncias**:

```typescript
// utils/validators.ts
export async function validateComponentInstance(
  prisma: PrismaClient,
  componentId: number,
  environmentId: number,
  instanceId?: number
) {
  const existing = await prisma.componentInstance.findFirst({
    where: {
      component_id: componentId,
      environment_id: environmentId,
      id: instanceId ? { not: instanceId } : undefined
    }
  });
  
  if (existing) {
    throw new Error(
      `Este componente já possui uma instância no ambiente especificado`
    );
  }
  
  return true;
}
```

## Recomendações para Implementação

### 1. Estratégia de Implantação Gradual

Recomenda-se seguir esta sequência para minimizar impactos:

1. Implemente e teste primeiro em ambiente de desenvolvimento
2. Execute scripts de migração e verificação de integridade
3. Faça refatoração modular, começando com entidades independentes
4. Implemente tests unitários e de integração para cada nova funcionalidade
5. Faça deploy em estágios (tabelas → ORM → GraphQL)

### 2. Segurança de Dados

- **Backups**: Realize backup completo antes de iniciar migrações
- **Rollback Plan**: Tenha um plano para reverter alterações em caso de problemas
- **Testes de Dados**: Verifique a integridade dos dados após cada migração

### 3. Considerações de Performance

- **Queries Críticas**: Identifique e otimize queries impactadas pelas mudanças
- **Índices**: Adicione índices adequados para novas tabelas e relacionamentos
- **Monitoramento**: Implemente métricas para acompanhar performance após mudanças

```sql
-- Índices adicionais recomendados
CREATE INDEX idx_component_status ON Component(status);
CREATE INDEX idx_ci_env ON ComponentInstance(environment_id);
CREATE INDEX idx_team_name ON Team(name);
CREATE INDEX idx_adr_status ON ADR(status);
```

### 4. Compatibilidade com Código Existente

Para funções que dependiam de enums agora convertidos em tabelas:

```typescript
// helpers/compatibility.ts
export async function getEnvironmentIdFromLegacyEnum(
  prisma: PrismaClient,
  legacyEnv: string
): Promise<number> {
  const environment = await prisma.environment.findFirst({
    where: { name: legacyEnv }
  });
  
  if (!environment) {
    throw new Error(`Environment not found for legacy value: ${legacyEnv}`);
  }
  
  return environment.id;
}

export async function getRoadmapTypeIdFromLegacyEnum(
  prisma: PrismaClient,
  legacyType: string
): Promise<number> {
  const type = await prisma.roadmapType.findFirst({
    where: { name: legacyType }
  });
  
  if (!type) {
    throw new Error(`RoadmapType not found for legacy value: ${legacyType}`);
  }
  
  return type.id;
}
```

## Checklist de Implementação

- [ ] Modificar schema do Prisma
- [ ] Criar scripts de migração de dados
- [ ] Atualizar schema do GraphQL (Pothos)
- [ ] Implementar novas queries e mutations
- [ ] Estender integração com Neo4j
- [ ] Implementar testes para novas funcionalidades
- [ ] Verificar impacto em APIs existentes
- [ ] Atualizar documentação da API
- [ ] Revisar e atualizar testes automatizados

## Considerações Finais

As mudanças na versão 2.0 são substanciais e exigem atenção especial à migração de dados e manutenção da compatibilidade. Siga uma abordagem gradual, teste extensivamente e mantenha backups adequados durante todo o processo.

A nova estrutura proporciona maior flexibilidade e melhor representação das relações organizacionais, mas exige refatoração significativa do código. Dedique tempo para revisar a qualidade e a cobertura dos testes após as mudanças. 