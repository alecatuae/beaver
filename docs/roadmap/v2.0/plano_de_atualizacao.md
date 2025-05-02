# Plano de Atualização Beaver v1.x → v2.0

Este documento detalha o processo passo a passo para atualizar o Beaver da versão 1.x para a versão 2.0, com foco em preservar todos os dados existentes e garantir a continuidade operacional da aplicação.

## Pré-requisitos

- MariaDB 10.5+ instalado
- Backup completo do banco de dados atual
- Cópia de segurança do código fonte atual
- Ambiente de homologação configurado para testes

## 1. Preparação

### 1.1 Backup de Dados

```bash
# Backup do banco MariaDB
mysqldump -u [usuário] -p beaver > beaver_v1_backup.sql

# Backup do Neo4j (se disponível ferramenta de exportação)
neo4j-admin dump --database=neo4j --to=beaver_neo4j_v1_backup.dump
```

### 1.2 Criação de Ambiente de Homologação

```bash
# Clonar repositório atual para branch de homologação
git checkout -b v2-migration

# Configurar ambiente de homologação
cp .env.example .env.homolog
# Editar .env.homolog com configurações específicas
```

## 2. Migração do Banco de Dados MariaDB

### 2.1 Script de Migração para Tabelas de Lookup

Criar arquivo `migrations/v1_to_v2_lookup_tables.sql`:

```sql
-- Criar novas tabelas
CREATE TABLE Environment (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(50) NOT NULL UNIQUE,
  description VARCHAR(255),
  created_at  DATETIME DEFAULT NOW()
);

CREATE TABLE RoadmapType (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(40) NOT NULL UNIQUE,
  description VARCHAR(120),
  color_hex   CHAR(7),
  created_at  DATETIME DEFAULT NOW()
);

-- Preencher tabela Environment com valores distintos do ENUM
INSERT INTO Environment (name, description)
SELECT DISTINCT env, CONCAT('Ambiente ', env) 
FROM Component;

-- Preencher tabela RoadmapType com valores do ENUM
INSERT INTO RoadmapType (name, description, color_hex) VALUES
('feature', 'Nova funcionalidade de produto', '#4ade80'),
('bugfix', 'Correção de bugs', '#ef4444'),
('improvement', 'Melhorias em funcionalidades existentes', '#22d3ee'),
('refactor', 'Melhoria interna (código/design)', '#22d3ee'),
('technical debt', 'Dívida técnica a endereçar', '#eab308'),
('infra', 'Mudança ou projeto de infraestrutura', '#6366f1'),
('maintenance', 'Manutenção / patch / hardening', '#a3a3a3'),
('incident', 'Correção de incidente / RCA', '#ef4444'),
('capacity', 'Expansão de capacidade / escala', '#f97316');
```

### 2.2 Script de Migração para Componentes e Instâncias

Criar arquivo `migrations/v1_to_v2_components.sql`:

```sql
-- Adicionar campos team_id ao Component
ALTER TABLE Component ADD COLUMN team_id INT NULL;
ALTER TABLE Component ADD FOREIGN KEY (team_id) REFERENCES Team(id);

-- Alterar ENUM status
ALTER TABLE Component MODIFY COLUMN status ENUM('planned','active','deprecated') DEFAULT 'active';
-- Converter 'inactive' para 'planned'
UPDATE Component SET status = 'planned' WHERE status = 'inactive';

-- Criar tabela Component_Instance
CREATE TABLE Component_Instance (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  component_id   INT NOT NULL,
  environment_id INT NOT NULL,
  hostname       VARCHAR(120),
  specs          JSON NULL,
  created_at     DATETIME DEFAULT NOW(),
  UNIQUE KEY uniq_comp_env (component_id, environment_id),
  FOREIGN KEY (component_id)   REFERENCES Component(id)   ON DELETE CASCADE,
  FOREIGN KEY (environment_id) REFERENCES Environment(id) ON DELETE RESTRICT
);

-- Preencher instâncias de componentes
INSERT INTO Component_Instance (component_id, environment_id, hostname)
SELECT c.id, e.id, CONCAT(LOWER(REPLACE(c.name, ' ', '-')), '-', LOWER(e.name))
FROM Component c
JOIN Environment e
WHERE e.name = c.env;

-- Remover coluna env após migração
ALTER TABLE Component DROP COLUMN env;
```

### 2.3 Script de Migração para ADRs e Participantes

Criar arquivo `migrations/v1_to_v2_adrs.sql`:

```sql
-- Criar tabela ADR_Participant
CREATE TABLE ADR_Participant (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  adr_id     INT NOT NULL,
  user_id    INT NOT NULL,
  role       ENUM('owner','reviewer','consumer') DEFAULT 'reviewer',
  created_at DATETIME DEFAULT NOW(),
  UNIQUE KEY adr_user (adr_id, user_id),
  FOREIGN KEY (adr_id)  REFERENCES ADR(id)      ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES `User`(id)   ON DELETE CASCADE
);

-- Migrar owner_id para participantes
INSERT INTO ADR_Participant (adr_id, user_id, role, created_at)
SELECT id, owner_id, 'owner', created_at
FROM ADR
WHERE owner_id IS NOT NULL;

-- Alterar ENUM status e renomear decision para description
ALTER TABLE ADR MODIFY COLUMN status ENUM('draft','accepted','superseded','rejected') DEFAULT 'draft';
ALTER TABLE ADR CHANGE COLUMN decision description TEXT;

-- Adicionar registro extra para todos os ADRs afetados
UPDATE ADR SET status = 'draft' WHERE status = 'proposed';

-- Criar tabela ADR_Component
CREATE TABLE ADR_Component (
  adr_id       INT NOT NULL,
  component_id INT NOT NULL,
  PRIMARY KEY (adr_id, component_id),
  FOREIGN KEY (adr_id)       REFERENCES ADR(id)       ON DELETE CASCADE,
  FOREIGN KEY (component_id) REFERENCES Component(id) ON DELETE CASCADE
);

-- Migrar relações implícitas para explícitas
INSERT INTO ADR_Component (adr_id, component_id)
SELECT a.id, c.id
FROM ADR a
JOIN Component c
WHERE /* lógica para extrair relacionamentos implícitos, como menções no texto */;

-- Remover owner_id após migração
ALTER TABLE ADR DROP COLUMN owner_id;
```

### 2.4 Script de Migração para Roadmap

Criar arquivo `migrations/v1_to_v2_roadmap.sql`:

```sql
-- Adicionar coluna type_id e due_date
ALTER TABLE RoadmapItem ADD COLUMN type_id INT NULL;
ALTER TABLE RoadmapItem ADD COLUMN due_date DATE NULL;
ALTER TABLE RoadmapItem ADD COLUMN component_id INT NULL;
ALTER TABLE RoadmapItem ADD FOREIGN KEY (component_id) REFERENCES Component(id) ON DELETE SET NULL;

-- Mapear valores de ENUM para IDs na nova tabela
UPDATE RoadmapItem ri 
JOIN RoadmapType rt ON ri.type = rt.name
SET ri.type_id = rt.id;

-- Adicionar FOREIGN KEY para type_id
ALTER TABLE RoadmapItem ADD FOREIGN KEY (type_id) REFERENCES RoadmapType(id) ON DELETE RESTRICT;

-- Alterar ENUM status
ALTER TABLE RoadmapItem MODIFY COLUMN status ENUM('todo','in_progress','done','blocked') DEFAULT 'todo';

-- Remover coluna type após migração
ALTER TABLE RoadmapItem DROP COLUMN type;
```

### 2.5 Script de Migração para Log

Criar arquivo `migrations/v1_to_v2_log.sql`:

```sql
-- Adicionar colunas level e metadata
ALTER TABLE Log ADD COLUMN level ENUM('info','warn','error') DEFAULT 'info';
ALTER TABLE Log ADD COLUMN metadata JSON NULL;

-- Renomear coluna action para message
ALTER TABLE Log CHANGE COLUMN action message TEXT NOT NULL;

-- Ajustar timestamp para created_at para consistência
ALTER TABLE Log CHANGE COLUMN timestamp created_at DATETIME DEFAULT NOW();
```

### 2.6 Execução dos Scripts de Migração

```bash
# Executar scripts em sequência
mysql -u [usuário] -p beaver < migrations/v1_to_v2_lookup_tables.sql
mysql -u [usuário] -p beaver < migrations/v1_to_v2_components.sql
mysql -u [usuário] -p beaver < migrations/v1_to_v2_adrs.sql
mysql -u [usuário] -p beaver < migrations/v1_to_v2_roadmap.sql
mysql -u [usuário] -p beaver < migrations/v1_to_v2_log.sql

# Verificar migração
mysql -u [usuário] -p beaver -e "SELECT COUNT(*) FROM Component_Instance;"
```

## 3. Migração do Banco de Dados Neo4j

### 3.1 Script de Migração Neo4j - Novos Nós

Criar arquivo `migrations/v1_to_v2_neo4j_nodes.cypher`:

```cypher
// Criar constraints para novos nós
CREATE CONSTRAINT ON (ci:ComponentInstance) ASSERT ci.id IS UNIQUE;
CREATE CONSTRAINT ON (e:Environment) ASSERT e.id IS UNIQUE;
CREATE CONSTRAINT ON (e:Environment) ASSERT e.name IS UNIQUE;
CREATE CONSTRAINT ON (t:Team) ASSERT t.id IS UNIQUE;

// Criar índices para melhorar performance
CREATE INDEX ON :ComponentInstance(hostname);
CREATE INDEX ON :Environment(name);
CREATE INDEX ON :Team(name);

// Criar nós de ambiente a partir do MariaDB
CALL apoc.load.jdbc("jdbc:mysql://localhost:3306/beaver", "SELECT * FROM Environment") YIELD row
MERGE (e:Environment {id: row.id})
ON CREATE SET
  e.name = row.name,
  e.description = row.description,
  e.created_at = datetime(row.created_at);

// Criar nós de time a partir do MariaDB
CALL apoc.load.jdbc("jdbc:mysql://localhost:3306/beaver", "SELECT * FROM Team") YIELD row
MERGE (t:Team {id: row.id})
ON CREATE SET
  t.name = row.name,
  t.description = row.description,
  t.created_at = datetime(row.created_at);

// Criar nós de instâncias a partir do MariaDB
CALL apoc.load.jdbc("jdbc:mysql://localhost:3306/beaver", "SELECT * FROM Component_Instance") YIELD row
MERGE (ci:ComponentInstance {id: row.id})
ON CREATE SET
  ci.component_id = row.component_id,
  ci.environment_id = row.environment_id,
  ci.hostname = row.hostname,
  ci.specs = row.specs,
  ci.created_at = datetime(row.created_at);
```

### 3.2 Script de Migração Neo4j - Relações

Criar arquivo `migrations/v1_to_v2_neo4j_relationships.cypher`:

```cypher
// Criar relações INSTANTIATES
MATCH (c:Component), (ci:ComponentInstance)
WHERE c.id = ci.component_id
CREATE (c)-[:INSTANTIATES]->(ci);

// Criar relações DEPLOYED_IN
MATCH (ci:ComponentInstance), (e:Environment)
WHERE ci.environment_id = e.id
CREATE (ci)-[:DEPLOYED_IN]->(e);

// Criar relações MANAGED_BY
MATCH (c:Component)
WHERE c.team_id IS NOT NULL
MATCH (t:Team)
WHERE t.id = c.team_id
CREATE (c)-[:MANAGED_BY]->(t);

// Criar relações AFFECTS_INSTANCE para ADRs
CALL apoc.load.jdbc("jdbc:mysql://localhost:3306/beaver", 
  "SELECT aci.adr_id, aci.instance_id, aci.impact_level FROM ADR_ComponentInstance aci") YIELD row
MATCH (a:ADR), (ci:ComponentInstance)
WHERE a.id = row.adr_id AND ci.id = row.instance_id
CREATE (a)-[:AFFECTS_INSTANCE {impact_level: row.impact_level}]->(ci);
```

### 3.3 Execução dos Scripts Neo4j

```bash
# Executar scripts com autenticação apropriada
cat migrations/v1_to_v2_neo4j_nodes.cypher | cypher-shell -u neo4j -p [senha]
cat migrations/v1_to_v2_neo4j_relationships.cypher | cypher-shell -u neo4j -p [senha]

# Verificar migração
echo "MATCH (c:Component)-[:INSTANTIATES]->(ci:ComponentInstance) RETURN COUNT(*)" | cypher-shell -u neo4j -p [senha]
```

## 4. Atualização do Backend

### 4.1 Atualização do Schema Prisma

Atualizar `prisma/schema.prisma` com novos modelos e relações.

### 4.2 Atualizações dos Resolvers GraphQL

Atualizar resolvers para trabalhar com as novas estruturas de dados:

- Criar novos resolvers para `Environment`, `ComponentInstance`, etc.
- Atualizar resolvers existentes para refletir mudanças no schema

### 4.3 Atualização do Neo4jClient

Atualizar a classe `Neo4jClient` para sincronizar novas entidades:

```typescript
// Adicionar métodos para instâncias de componentes
async upsertComponentInstance(instanceData) {
  // Código para criar/atualizar instância no Neo4j
}

// Adicionar métodos para ambientes
async upsertEnvironment(environmentData) {
  // Código para criar/atualizar ambiente no Neo4j
}

// Adicionar métodos para times
async upsertTeam(teamData) {
  // Código para criar/atualizar time no Neo4j
}
```

### 4.4 Testes de Unidade para Novos Componentes

Criar testes para os novos resolvers e funcionalidades.

## 5. Atualização do Frontend

### 5.1 Atualização dos Tipos TypeScript

Atualizar definições de tipos para refletir as mudanças no schema.

### 5.2 Atualização das Queries GraphQL

Atualizar queries para trabalhar com as novas estruturas:

```typescript
// Exemplo de nova query para instâncias de componentes
const COMPONENT_INSTANCES_QUERY = gql`
  query ComponentInstances($componentId: ID!) {
    componentInstances(componentId: $componentId) {
      id
      hostname
      environment {
        id
        name
      }
      specs
    }
  }
`;
```

### 5.3 Criação de Novas Páginas

Implementar novas páginas para gerenciar:
- Ambientes
- Instâncias de componentes
- Associação de times a componentes

### 5.4 Atualização de Formulários

Atualizar formulários existentes para trabalhar com novas estruturas:
- Formulário de ADR com múltiplos participantes
- Formulário de componentes com seleção de time
- Formulário de roadmap com campos expandidos

## 6. Testes Integrados

### 6.1 Plano de Testes

Desenvolver plano de testes para verificar todas as funcionalidades críticas:
- CRUD para todas as entidades
- Sincronização MariaDB ↔ Neo4j
- Fluxos de trabalho existentes com novas estruturas

### 6.2 Testes Automatizados

Criar ou atualizar testes end-to-end com Playwright para verificar funcionalidades críticas.

### 6.3 Testes Manuais

Realizar testes manuais em ambiente de homologação para verificar:
- Interface de usuário
- Fluxos de navegação
- Experiência do usuário com novas funcionalidades

## 7. Implantação

### 7.1 Pré-Requisitos para Implantação

Verificar compatibilidade do ambiente com os novos requisitos:
- MariaDB 10.5+
- Dependências para campos JSON
- Suporte a triggers avançados

### 7.2 Roteiro de Implantação

```bash
# 1. Backup final antes da implantação
mysqldump -u [usuário] -p beaver > beaver_final_pre_v2_backup.sql
neo4j-admin dump --database=neo4j --to=beaver_final_pre_v2_backup.dump

# 2. Desligar aplicação
pm2 stop beaver-app

# 3. Executar scripts de migração em produção
mysql -u [usuário] -p beaver < migrations/v1_to_v2_lookup_tables.sql
mysql -u [usuário] -p beaver < migrations/v1_to_v2_components.sql
mysql -u [usuário] -p beaver < migrations/v1_to_v2_adrs.sql
mysql -u [usuário] -p beaver < migrations/v1_to_v2_roadmap.sql
mysql -u [usuário] -p beaver < migrations/v1_to_v2_log.sql

# 4. Executar scripts Neo4j em produção
cat migrations/v1_to_v2_neo4j_nodes.cypher | cypher-shell -u neo4j -p [senha]
cat migrations/v1_to_v2_neo4j_relationships.cypher | cypher-shell -u neo4j -p [senha]

# 5. Implantar nova versão do código
git checkout main
git merge v2-migration
npm install
npm run build

# 6. Iniciar aplicação
pm2 start beaver-app
```

### 7.3 Plano de Contingência

Em caso de falhas:
1. Parar imediatamente a aplicação
2. Restaurar backup do banco de dados
3. Implantar versão anterior do código
4. Realizar diagnóstico detalhado

## 8. Pós-Implantação

### 8.1 Monitoramento

Monitorar métricas críticas:
- Tempo de resposta da API
- Uso de recursos de banco de dados
- Logs de erro

### 8.2 Ajustes Finais

Realizar ajustes conforme necessário com base no feedback dos usuários.

### 8.3 Documentação

Atualizar documentação com:
- Novos fluxos de trabalho
- Mudanças de API
- Melhores práticas para novas funcionalidades

## 9. Resumo das Atividades Principais

1. **Preparação**
   - Backup completo
   - Ambiente de homologação

2. **Migração de Dados MariaDB**
   - Criar e preencher tabelas de lookup
   - Migrar componentes para o novo modelo
   - Migrar ADRs para suportar múltiplos participantes
   - Atualizar roadmap e log

3. **Migração Neo4j**
   - Criar novos nós e constraints
   - Estabelecer novas relações

4. **Backend e Frontend**
   - Atualizar resolvers e sincronização
   - Criar novas interfaces de usuário

5. **Testes e Implantação**
   - Verificação completa da funcionalidade
   - Implantação com plano de contingência

## 10. Cronograma Estimado

| Fase | Atividades | Tempo Estimado |
|------|------------|----------------|
| Preparação | Backups e ambiente | 1 dia |
| Migração MariaDB | Scripts e testes | 2 dias |
| Migração Neo4j | Scripts e testes | 1 dia |
| Backend | Resolvers e API | 3 dias |
| Frontend | UI e integração | 5 dias |
| Testes | Automatizados e manuais | 3 dias |
| Implantação | Produção | 1 dia |
| **Total** | | **16 dias** |

## Conclusão

Este plano detalha uma abordagem cuidadosa para atualizar o Beaver v1.x para v2.0, minimizando riscos e garantindo a preservação de todos os dados. A migração incremental permite validação a cada etapa, e a preparação adequada de backups fornece mecanismos de recuperação caso necessário. 