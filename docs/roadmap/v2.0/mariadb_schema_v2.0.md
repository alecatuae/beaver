# Documentação do Schema MariaDB v2.0

## Visão Geral

O schema do MariaDB v2.0 para o Beaver introduz diversas melhorias estruturais que permitem maior flexibilidade, escalabilidade e capacidade de gestão. As principais mudanças incluem:

1. Substituição de ENUMs por tabelas de lookup
2. Introdução de ambientes e instâncias de componentes
3. Refatoração do modelo de ADRs para suportar múltiplos participantes
4. Suporte a metadados avançados para log de auditoria
5. Modelo unificado de roadmap para desenvolvimento e infraestrutura

Este documento detalha cada seção do schema e as principais alterações em relação à versão anterior.

## Requisitos Técnicos

- MariaDB 10.5 ou superior
- Suporte a tipos de dados JSON
- Suporte a CHECK constraints
- Suporte a ENUM
- Charset UTF-8 (utf8mb4)

## Estrutura de Tabelas

### 1. Entidades de Identidade

#### Tabela User

```sql
CREATE TABLE `User` (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  username      VARCHAR(50)  NOT NULL UNIQUE,
  email         VARCHAR(120) NOT NULL UNIQUE,
  full_name     VARCHAR(120) NOT NULL,
  password_hash CHAR(60)     NOT NULL,
  role          ENUM('admin','architect','contributor','viewer') DEFAULT 'viewer',
  created_at    DATETIME DEFAULT NOW()
) COMMENT='Contas e perfis de acesso';
```

**Alterações na v2.0:**
- Adicionado campo `full_name`
- Refinamento nos papéis de usuário, agora mais especializados para arquitetura
- Limitações de tamanho de campo otimizadas

#### Tabela Team

```sql
CREATE TABLE Team (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(60) NOT NULL UNIQUE,
  description VARCHAR(255),
  created_at  DATETIME DEFAULT NOW()
) COMMENT='Grupos de pessoas responsáveis';
```

**Alterações na v2.0:**
- Limitação de tamanho do campo `name` para 60 caracteres
- Adição do campo `description`

#### Tabela Team_Member (Nova)

```sql
CREATE TABLE Team_Member (
  team_id   INT NOT NULL,
  user_id   INT NOT NULL,
  joined_at DATETIME DEFAULT NOW(),
  PRIMARY KEY (team_id, user_id),
  FOREIGN KEY (team_id) REFERENCES Team(id)   ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES `User`(id) ON DELETE CASCADE
) COMMENT='Associação usuários ↔ times';
```

**Novidade na v2.0:**
- Nova tabela para relação N:N entre usuários e times
- Rastreamento da data de ingresso do usuário no time

### 2. Taxonomias

#### Tabela Category

```sql
CREATE TABLE Category (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(60) NOT NULL UNIQUE,
  description VARCHAR(255),
  image       VARCHAR(120),
  created_at  DATETIME DEFAULT NOW()
) COMMENT='Categorias de componentes';
```

**Alterações na v2.0:**
- Limitação de tamanho do campo `name` para 60 caracteres
- Limitação de tamanho do campo `image` para 120 caracteres

#### Tabela GlossaryTerm

```sql
CREATE TABLE GlossaryTerm (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  term        VARCHAR(60) NOT NULL UNIQUE,
  definition  TEXT NOT NULL,
  status      ENUM('draft','approved','deprecated') DEFAULT 'draft',
  created_at  DATETIME DEFAULT NOW()
) COMMENT='Glossário interno';
```

**Alterações na v2.0:**
- Limitação de tamanho do campo `term` para 60 caracteres
- Adição do campo `status` para rastrear ciclo de vida dos termos do glossário

### 3. Ambientes e Componentes

#### Tabela Environment (Nova)

```sql
CREATE TABLE Environment (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(50) NOT NULL UNIQUE,
  description VARCHAR(255),
  created_at  DATETIME DEFAULT NOW()
) COMMENT='Domínios físicos ou lógicos onde rodam instâncias';
```

**Novidade na v2.0:**
- Nova tabela para substituir o ENUM `env` do modelo anterior
- Permite ambientes personalizáveis e específicos para cada organização

#### Tabela Component

```sql
CREATE TABLE Component (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(120) NOT NULL UNIQUE,
  description TEXT,
  status      ENUM('planned','active','deprecated') DEFAULT 'active',
  team_id     INT NULL,
  category_id INT NULL,
  created_at  DATETIME DEFAULT NOW(),
  FOREIGN KEY (team_id)     REFERENCES Team(id),
  FOREIGN KEY (category_id) REFERENCES Category(id)
) COMMENT='Serviços, aplicativos ou recursos lógicos';
```

**Alterações na v2.0:**
- Alterado ENUM `status` para incluir 'planned' em vez de 'inactive'
- Adicionado campo `team_id` para associar responsabilidade direta
- Campo `env` removido, substituído pelo modelo de instâncias

#### Tabela Component_Instance (Nova)

```sql
CREATE TABLE Component_Instance (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  component_id   INT NOT NULL,
  environment_id INT NOT NULL,
  hostname       VARCHAR(120),
  specs          JSON,
  created_at     DATETIME DEFAULT NOW(),
  UNIQUE KEY uniq_comp_env (component_id, environment_id),
  FOREIGN KEY (component_id)   REFERENCES Component(id)   ON DELETE CASCADE,
  FOREIGN KEY (environment_id) REFERENCES Environment(id) ON DELETE RESTRICT
) COMMENT='Manifestação física/lógica do componente';
```

**Novidade na v2.0:**
- Nova tabela que separa o conceito de componente lógico de sua instância física
- Campo `specs` em JSON permite armazenar metadados técnicos flexíveis
- Chave única composta evita duplicidade de instâncias no mesmo ambiente

### 4. Architecture Decision Records (ADR)

#### Tabela ADR

```sql
CREATE TABLE ADR (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  title       VARCHAR(200) NOT NULL,
  description TEXT,
  status      ENUM('draft','accepted','superseded','rejected') DEFAULT 'draft',
  created_at  DATETIME DEFAULT NOW()
) COMMENT='Decisões arquiteturais';
```

**Alterações na v2.0:**
- Campo `decision` renomeado para `description`
- Adicionado valor 'superseded' ao ENUM `status`
- Removido campo `owner_id` da versão anterior

#### Tabela ADR_Participant (Nova)

```sql
CREATE TABLE ADR_Participant (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  adr_id     INT NOT NULL,
  user_id    INT NOT NULL,
  role       ENUM('owner','reviewer','consumer') DEFAULT 'reviewer',
  created_at DATETIME DEFAULT NOW(),
  UNIQUE KEY adr_user (adr_id, user_id),
  FOREIGN KEY (adr_id)  REFERENCES ADR(id)      ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES `User`(id)   ON DELETE CASCADE
) COMMENT='Quem participou de cada ADR';
```

**Novidade na v2.0:**
- Nova tabela para substituir o campo `owner_id` da versão anterior
- Suporta múltiplos participantes em diferentes papéis
- Chave única composta garante papel único por usuário em cada ADR

#### Tabela ADR_ComponentInstance (Nova)

```sql
CREATE TABLE ADR_ComponentInstance (
  adr_id       INT NOT NULL,
  instance_id  INT NOT NULL,
  impact_level ENUM('low','medium','high') DEFAULT 'medium',
  PRIMARY KEY (adr_id, instance_id),
  FOREIGN KEY (adr_id)      REFERENCES ADR(id)                ON DELETE CASCADE,
  FOREIGN KEY (instance_id) REFERENCES Component_Instance(id) ON DELETE CASCADE
) COMMENT='Impacto de ADR em instâncias específicas';
```

**Novidade na v2.0:**
- Nova tabela para associar ADRs a instâncias específicas de componentes
- Inclui nível de impacto para análise refinada

#### Tabela ADR_Component (Nova)

```sql
CREATE TABLE ADR_Component (
  adr_id       INT NOT NULL,
  component_id INT NOT NULL,
  PRIMARY KEY (adr_id, component_id),
  FOREIGN KEY (adr_id)       REFERENCES ADR(id)       ON DELETE CASCADE,
  FOREIGN KEY (component_id) REFERENCES Component(id) ON DELETE CASCADE
) COMMENT='ADR que afeta o componente inteiro';
```

**Novidade na v2.0:**
- Nova tabela para explicitamente relacionar ADRs a componentes

### 5. Tagging Geral

#### Tabela ComponentTag

```sql
CREATE TABLE ComponentTag (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  component_id INT NOT NULL,
  tag          VARCHAR(60) NOT NULL,
  UNIQUE KEY cmp_tag (component_id, tag),
  FOREIGN KEY (component_id) REFERENCES Component(id) ON DELETE CASCADE
);
```

**Alterações na v2.0:**
- Limitação de tamanho do campo `tag` para 60 caracteres
- Chave única composta para evitar tags duplicadas no mesmo componente

#### Tabela RelationshipTag (Nova)

```sql
CREATE TABLE RelationshipTag (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  source_id INT NOT NULL,
  target_id INT NOT NULL,
  tag       VARCHAR(60) NOT NULL,
  UNIQUE KEY rel_tag (source_id, target_id, tag),
  FOREIGN KEY (source_id) REFERENCES Component(id) ON DELETE CASCADE,
  FOREIGN KEY (target_id) REFERENCES Component(id) ON DELETE CASCADE
);
```

**Novidade na v2.0:**
- Nova tabela para tags associadas a relacionamentos entre componentes
- Suporta a tripla unique de origem-destino-tag

#### Tabela ADRTag

```sql
CREATE TABLE ADRTag (
  id     INT AUTO_INCREMENT PRIMARY KEY,
  adr_id INT NOT NULL,
  tag    VARCHAR(60) NOT NULL,
  UNIQUE KEY adr_tag (adr_id, tag),
  FOREIGN KEY (adr_id) REFERENCES ADR(id) ON DELETE CASCADE
);
```

**Alterações na v2.0:**
- Limitação de tamanho do campo `tag` para 60 caracteres
- Chave única composta para evitar tags duplicadas no mesmo ADR

### 6. Roadmap / Backlog

#### Tabela RoadmapType (Nova)

```sql
CREATE TABLE RoadmapType (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(40) NOT NULL UNIQUE,
  description VARCHAR(120),
  color_hex   CHAR(7),
  created_at  DATETIME DEFAULT NOW()
) COMMENT='Tipos de item de roadmap (dev & infra)';
```

**Novidade na v2.0:**
- Nova tabela para substituir o ENUM `type` do modelo anterior
- Suporte a cores personalizáveis para UI
- Extensível para incluir novos tipos específicos da organização

#### Tabela RoadmapItem

```sql
CREATE TABLE RoadmapItem (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  title         VARCHAR(200) NOT NULL,
  description   TEXT,
  component_id  INT NULL,
  type_id       INT NOT NULL,
  status        ENUM('todo','in_progress','done','blocked') DEFAULT 'todo',
  due_date      DATE,
  created_at    DATETIME DEFAULT NOW(),
  FOREIGN KEY (component_id) REFERENCES Component(id) ON DELETE SET NULL,
  FOREIGN KEY (type_id)      REFERENCES RoadmapType(id) ON DELETE RESTRICT
) COMMENT='Demandas planejadas ou em execução';
```

**Alterações na v2.0:**
- Campo `type` substituído por `type_id` referenciando a tabela RoadmapType
- Novo ENUM `status` mais detalhado
- Adicionado campo `due_date` para planejamento
- Adicionado campo `component_id` para vincular a componentes específicos

### 7. Log / Auditoria

```sql
CREATE TABLE Log (
  id         BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT NULL,
  level      ENUM('info','warn','error') DEFAULT 'info',
  message    TEXT NOT NULL,
  metadata   JSON,
  created_at DATETIME DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES `User`(id) ON DELETE SET NULL
);
```

**Alterações na v2.0:**
- Campo `action` substituído por `message` mais genérico
- Adicionado campo `level` para categorizar diferentes tipos de log
- Adicionado campo `metadata` JSON para armazenar contexto detalhado

### 8. Índices e Otimizações

```sql
CREATE INDEX idx_component_status ON Component(status);
CREATE INDEX idx_adr_status       ON ADR(status);
CREATE INDEX idx_ci_env           ON Component_Instance(environment_id);
CREATE INDEX idx_roadmap_status   ON RoadmapItem(status);
```

**Alterações na v2.0:**
- Índices otimizados para consultas mais frequentes
- Novo índice para busca de instâncias por ambiente
- Novo índice para filtrar itens de roadmap por status

### 9. Trigger - Regras de Negócio

```sql
DELIMITER $$
CREATE TRIGGER trg_adr_owner_must_exist
AFTER INSERT ON ADR_Participant
FOR EACH ROW
BEGIN
  DECLARE owners INT;
  SELECT COUNT(*) INTO owners
  FROM ADR_Participant
  WHERE adr_id = NEW.adr_id AND role = 'owner';
  IF owners = 0 THEN
    SIGNAL SQLSTATE '45000' 
      SET MESSAGE_TEXT = 'Cada ADR precisa de pelo menos um participante com role=owner';
  END IF;
END$$
DELIMITER ;
```

**Novidade na v2.0:**
- Trigger para garantir que cada ADR tenha pelo menos um participante com papel de 'owner'
- Aplicação de regras de negócio diretamente no banco de dados

### 10. Seed Inicial

O schema v2.0 inclui dados iniciais para:
- Ambientes padrão (development, homologation, production)
- Times básicos (Network, Operations, Platform)
- Categorias iniciais (Networking, Security, Runtime)
- Tipos de itens de roadmap para equipes de desenvolvimento e infraestrutura

## Impacto na Migração de Dados

Para migrar da versão anterior (v1.x) para a v2.0, é necessário:

1. Converter ENUMs para registros nas novas tabelas de lookup
2. Mover dados de campos singleton para tabelas de relacionamento (ex: ADR.owner_id → ADR_Participant)
3. Criar instâncias de componente para cada componente existente, baseado no valor do campo `env`
4. Remapear tipos de RoadmapItem para as novas entradas na tabela RoadmapType

## Requisitos de Versão do MariaDB

A nova estrutura requer MariaDB 10.5+ devido a:
- Uso de colunas JSON para armazenamento flexível de metadados
- Uso de CHECK constraints em triggers
- Suporte avançado a ENUM com valores personalizados

## Conclusão

O schema MariaDB v2.0 proporciona maior flexibilidade, melhor organização e suporte mais robusto para casos de uso corporativos. As principais melhorias incluem a transformação de ENUMs em tabelas de lookup, separação entre componentes lógicos e suas instâncias físicas, e uma abordagem mais detalhada para rastrear decisões arquiteturais. 