# Documentação do Schema MariaDB v2.0

## Visão Geral

O schema MariaDB v2.0 para o Beaver representa uma evolução significativa em relação à versão 1.x, introduzindo suporte a múltiplos ambientes, instâncias de componentes, gerenciamento de times e estruturas mais flexíveis para dados de log e roadmap.

## Requisitos de Sistema

- MariaDB 10.5+ (recomendada 11.8)
- Suporte a JSON e triggers
- Configuração com charset UTF-8 (utf8mb4)

## Principais Entidades

### Entidades de Identidade

#### User
Armazena contas de usuário com controle de acesso baseado em papéis.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | INT | Identificador único (PK) |
| username | VARCHAR(50) | Nome de usuário (único) |
| email | VARCHAR(120) | E-mail do usuário (único) |
| full_name | VARCHAR(120) | Nome completo |
| password_hash | CHAR(60) | Hash da senha (BCrypt) |
| role | ENUM | Papel: 'admin', 'architect', 'contributor', 'viewer' |
| created_at | DATETIME | Data de criação |

#### Team
Equipes organizacionais responsáveis por componentes.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | INT | Identificador único (PK) |
| name | VARCHAR(80) | Nome do time (único) |
| description | TEXT | Descrição do time |
| created_at | DATETIME | Data de criação |

#### Team_Member
Associação entre usuários e times, com data de ingresso.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | INT | Identificador único (PK) |
| team_id | INT | Referência ao time (FK) |
| user_id | INT | Referência ao usuário (FK) |
| join_date | DATE | Data de ingresso no time |
| created_at | DATETIME | Data de criação |

### Entidades de Categorização

#### Category
Categorias para classificação hierárquica de componentes.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | INT | Identificador único (PK) |
| name | VARCHAR(80) | Nome da categoria (único) |
| description | TEXT | Descrição da categoria |
| parent_id | INT | Referência à categoria pai (FK, opcional) |
| image_path | VARCHAR(255) | Caminho para imagem representativa |
| created_at | DATETIME | Data de criação |

#### GlossaryTerm
Termos padronizados do glossário organizacional.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | INT | Identificador único (PK) |
| term | VARCHAR(80) | Termo (único) |
| definition | TEXT | Definição do termo |
| status | ENUM | Status: 'draft', 'approved', 'deprecated' |
| created_at | DATETIME | Data de criação |

### Entidades de Componentes e Ambientes

#### Environment
Ambientes onde componentes são implantados.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | INT | Identificador único (PK) |
| name | VARCHAR(50) | Nome do ambiente (único) |
| description | VARCHAR(255) | Descrição do ambiente |
| created_at | DATETIME | Data de criação |

#### Component
Componentes lógicos da arquitetura.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | INT | Identificador único (PK) |
| name | VARCHAR(120) | Nome do componente (único) |
| description | TEXT | Descrição do componente |
| status | ENUM | Status: 'planned', 'active', 'deprecated' |
| team_id | INT | Referência ao time responsável (FK, opcional) |
| category_id | INT | Referência à categoria (FK, opcional) |
| created_at | DATETIME | Data de criação |

#### Component_Instance
Instâncias específicas de componentes em ambientes.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | INT | Identificador único (PK) |
| component_id | INT | Referência ao componente (FK) |
| environment_id | INT | Referência ao ambiente (FK) |
| hostname | VARCHAR(120) | Nome do host (opcional) |
| specs | JSON | Especificações técnicas em formato JSON |
| created_at | DATETIME | Data de criação |

**Restrições:**
- Chave única para (component_id, environment_id)
- Exclusão em cascata quando o componente é excluído
- Restrição na exclusão do ambiente (RESTRICT)

### Entidades de Decisão Arquitetural

#### ADR
Registros de Decisão Arquitetural.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | INT | Identificador único (PK) |
| title | VARCHAR(200) | Título da decisão |
| description | TEXT | Conteúdo da decisão |
| status | ENUM | Status: 'draft', 'accepted', 'superseded', 'rejected' |
| created_at | DATETIME | Data de criação |

#### ADR_Participant
Participantes envolvidos em cada ADR.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | INT | Identificador único (PK) |
| adr_id | INT | Referência ao ADR (FK) |
| user_id | INT | Referência ao usuário (FK) |
| role | ENUM | Papel: 'owner', 'reviewer', 'consumer' |
| created_at | DATETIME | Data de criação |

**Restrições:**
- Chave única para (adr_id, user_id)
- Exclusão em cascata quando o ADR ou o usuário é excluído
- Trigger `trg_adr_owner_must_exist` garante que cada ADR tenha pelo menos um participante com papel 'owner'

#### ADR_ComponentInstance
Associação entre ADRs e instâncias de componentes.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| adr_id | INT | Referência ao ADR (PK, FK) |
| instance_id | INT | Referência à instância (PK, FK) |
| impact_level | ENUM | Nível de impacto: 'low', 'medium', 'high' |

**Restrições:**
- Chave primária composta (adr_id, instance_id)
- Exclusão em cascata quando o ADR ou a instância é excluído

#### ADR_Component
Associação entre ADRs e componentes (em todos os ambientes).

| Campo | Tipo | Descrição |
|-------|------|-----------|
| adr_id | INT | Referência ao ADR (PK, FK) |
| component_id | INT | Referência ao componente (PK, FK) |

**Restrições:**
- Chave primária composta (adr_id, component_id)
- Exclusão em cascata quando o ADR ou o componente é excluído

### Entidades de Tagging

#### ComponentTag
Tags associadas a componentes.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | INT | Identificador único (PK) |
| component_id | INT | Referência ao componente (FK) |
| tag | VARCHAR(60) | Tag aplicada |

**Restrições:**
- Chave única para (component_id, tag)
- Exclusão em cascata quando o componente é excluído

#### RelationshipTag
Tags associadas a relacionamentos entre componentes.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | INT | Identificador único (PK) |
| source_id | INT | Referência ao componente de origem (FK) |
| target_id | INT | Referência ao componente de destino (FK) |
| tag | VARCHAR(60) | Tag aplicada |

**Restrições:**
- Chave única para (source_id, target_id, tag)
- Exclusão em cascata quando qualquer componente é excluído

#### ADRTag
Tags associadas a ADRs.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | INT | Identificador único (PK) |
| adr_id | INT | Referência ao ADR (FK) |
| tag | VARCHAR(60) | Tag aplicada |

**Restrições:**
- Chave única para (adr_id, tag)
- Exclusão em cascata quando o ADR é excluído

### Entidades de Roadmap

#### RoadmapType
Tipos flexíveis de itens de roadmap.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | INT | Identificador único (PK) |
| name | VARCHAR(40) | Nome do tipo (único) |
| description | VARCHAR(120) | Descrição do tipo |
| color_hex | CHAR(7) | Código de cor hexadecimal |
| created_at | DATETIME | Data de criação |

#### RoadmapItem
Itens de roadmap/backlog.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | INT | Identificador único (PK) |
| title | VARCHAR(200) | Título do item |
| description | TEXT | Descrição detalhada |
| component_id | INT | Referência ao componente (FK, opcional) |
| type_id | INT | Referência ao tipo (FK) |
| status | ENUM | Status: 'todo', 'in_progress', 'done', 'blocked' |
| due_date | DATE | Data prevista (opcional) |
| created_at | DATETIME | Data de criação |

**Restrições:**
- SET NULL quando o componente é excluído
- RESTRICT quando o tipo é excluído (impede exclusão)

### Entidades de Log

#### Log
Registros de auditoria para ações do sistema.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | BIGINT | Identificador único (PK) |
| user_id | INT | Referência ao usuário (FK, opcional) |
| level | ENUM | Nível: 'info', 'warn', 'error' |
| message | TEXT | Mensagem de log |
| metadata | JSON | Dados adicionais em formato JSON |
| created_at | DATETIME | Data de criação |

**Restrições:**
- SET NULL quando o usuário é excluído

## Índices

O schema inclui os seguintes índices para otimização de consultas:

- idx_component_status sobre Component(status)
- idx_adr_status sobre ADR(status)
- idx_ci_env sobre Component_Instance(environment_id)
- idx_roadmap_status sobre RoadmapItem(status)

## Triggers

### trg_adr_owner_must_exist
Garante que cada ADR tenha pelo menos um participante com papel 'owner'.

**Operação:** AFTER INSERT em ADR_Participant
**Ação:** Verifica se existe pelo menos um participante com papel 'owner' para o ADR. Se não, lança um erro.

## Dados Iniciais (Seed)

O schema inclui dados iniciais para:

- Ambientes (development, homologation, production)
- Times (Network, Operations, Platform)
- Categorias (Networking, Security, Runtime)
- Tipos de Roadmap (feature, refactor, technical debt, infra, maintenance, incident, capacity)

## Considerações de Migração

Ao migrar da v1.x para a v2.0:

1. Os campos ENUM existentes são mantidos e padronizados:
   - Component.status: 'planned', 'active', 'deprecated'
   - ADR.status: 'draft', 'accepted', 'superseded', 'rejected'
   - RoadmapItem.status: 'todo', 'in_progress', 'done', 'blocked'

2. Novas tabelas como Environment, Team, Team_Member e RoadmapType substituem campos ENUM fixos

3. Campos JSON são usados para armazenar dados flexíveis como specs e metadata

4. O gerenciamento de ADRs agora é baseado em participantes múltiplos em vez de owner único

## Conclusão

O schema MariaDB v2.0 traz flexibilidade e extensibilidade significativas à plataforma Beaver, permitindo o gerenciamento de múltiplos ambientes, instâncias específicas de componentes e uma estrutura mais rica para colaboração em ADRs. 