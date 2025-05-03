/* =======================================================================
   Beaver Platform 2.0 – FULL INSTALL
   Criado em: 01-mai-2025
   Compatível com: MariaDB 10.5 +  (JSON, CHECK, ENUM / LONGTEXT)
   -----------------------------------------------------------------------
       Este script **cria do zero** todo o esquema de banco de dados,
       já contemplando Roadmap para **times de desenvolvimento e de
       infraestrutura** via tabela de lookup RoadmapType.
   -----------------------------------------------------------------------
   COMO USAR
   ---------
   $ mysql -u root -p < beaver_full_install.sql
   =======================================================================*/

/*-----------------------------------------------------------------------
  0 · CONFIGURAÇÃO INICIAL
------------------------------------------------------------------------*/
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;
SET collation_connection = utf8mb4_unicode_ci;

/* 0.1 · (Re)cria o banco */
DROP   DATABASE IF EXISTS beaver;
CREATE DATABASE beaver
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;
USE beaver;

/*-----------------------------------------------------------------------
  1 · ENTIDADES DE IDENTIDADE
------------------------------------------------------------------------*/
-- 1.1 · Usuário
CREATE TABLE `User` (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  username      VARCHAR(50)  NOT NULL UNIQUE,
  email         VARCHAR(120) NOT NULL UNIQUE,
  full_name     VARCHAR(120) NOT NULL,
  password_hash CHAR(60)     NOT NULL,                             -- BCrypt
  role          ENUM('admin','architect','contributor','viewer') 
                    DEFAULT 'viewer',
  created_at    DATETIME DEFAULT NOW()
) COMMENT='Contas e perfis de acesso';

-- 1.2 · Times organizacionais
CREATE TABLE Team (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(60) NOT NULL UNIQUE,
  description VARCHAR(255),
  created_at  DATETIME DEFAULT NOW()
) COMMENT='Grupos de pessoas responsáveis';

-- 1.3 · N : N User ⇄ Team
CREATE TABLE Team_Member (
  team_id  INT NOT NULL,
  user_id  INT NOT NULL,
  joined_at DATETIME DEFAULT NOW(),
  PRIMARY KEY (team_id, user_id),
  FOREIGN KEY (team_id) REFERENCES Team(id)   ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES `User`(id) ON DELETE CASCADE
) COMMENT='Associação usuários ↔ times';

/*-----------------------------------------------------------------------
  2 · TAXONOMIAS
------------------------------------------------------------------------*/
CREATE TABLE Category (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(60) NOT NULL UNIQUE,
  description VARCHAR(255),
  image       VARCHAR(120),                               -- /public/images
  created_at  DATETIME DEFAULT NOW()
) COMMENT='Categorias de componentes';

CREATE TABLE GlossaryTerm (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  term        VARCHAR(60) NOT NULL UNIQUE,
  definition  TEXT NOT NULL,
  status      ENUM('draft','approved','deprecated') DEFAULT 'draft',
  created_at  DATETIME DEFAULT NOW()
) COMMENT='Glossário interno';

/*-----------------------------------------------------------------------
  3 · AMBIENTES & COMPONENTES
------------------------------------------------------------------------*/
CREATE TABLE Environment (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(50) NOT NULL UNIQUE,                -- prod / dev …
  description VARCHAR(255),
  created_at  DATETIME DEFAULT NOW()
) COMMENT='Domínios físicos ou lógicos onde rodam instâncias';

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

CREATE TABLE Component_Instance (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  component_id   INT NOT NULL,
  environment_id INT NOT NULL,
  hostname       VARCHAR(120),                              -- vpn-prd-fw01
  specs          JSON,
  created_at     DATETIME DEFAULT NOW(),
  UNIQUE KEY uniq_comp_env (component_id, environment_id),
  FOREIGN KEY (component_id)   REFERENCES Component(id)   ON DELETE CASCADE,
  FOREIGN KEY (environment_id) REFERENCES Environment(id) ON DELETE RESTRICT
) COMMENT='Manifestação física/lógica do componente';

/*-----------------------------------------------------------------------
  4 · ARCHITECTURE DECISION RECORDS – ADR
------------------------------------------------------------------------*/
CREATE TABLE ADR (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  title       VARCHAR(200) NOT NULL,
  description TEXT,
  status      ENUM('draft','accepted','superseded','rejected') 
                 DEFAULT 'draft',
  created_at  DATETIME DEFAULT NOW()
) COMMENT='Decisões arquiteturais';

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

CREATE TABLE ADR_ComponentInstance (
  adr_id       INT NOT NULL,
  instance_id  INT NOT NULL,
  impact_level ENUM('low','medium','high') DEFAULT 'medium',
  PRIMARY KEY (adr_id, instance_id),
  FOREIGN KEY (adr_id)      REFERENCES ADR(id)                ON DELETE CASCADE,
  FOREIGN KEY (instance_id) REFERENCES Component_Instance(id) ON DELETE CASCADE
) COMMENT='Impacto de ADR em instâncias específicas';

CREATE TABLE ADR_Component (
  adr_id       INT NOT NULL,
  component_id INT NOT NULL,
  PRIMARY KEY (adr_id, component_id),
  FOREIGN KEY (adr_id)       REFERENCES ADR(id)       ON DELETE CASCADE,
  FOREIGN KEY (component_id) REFERENCES Component(id) ON DELETE CASCADE
) COMMENT='ADR que afeta o componente inteiro';

/*-----------------------------------------------------------------------
  5 · TAGGING GERAL
------------------------------------------------------------------------*/
CREATE TABLE ComponentTag (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  component_id INT NOT NULL,
  tag          VARCHAR(60) NOT NULL,
  UNIQUE KEY cmp_tag (component_id, tag),
  FOREIGN KEY (component_id) REFERENCES Component(id) ON DELETE CASCADE
);

CREATE TABLE RelationshipTag (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  source_id INT NOT NULL,
  target_id INT NOT NULL,
  tag       VARCHAR(60) NOT NULL,
  UNIQUE KEY rel_tag (source_id, target_id, tag),
  FOREIGN KEY (source_id) REFERENCES Component(id) ON DELETE CASCADE,
  FOREIGN KEY (target_id) REFERENCES Component(id) ON DELETE CASCADE
);

CREATE TABLE ADRTag (
  id     INT AUTO_INCREMENT PRIMARY KEY,
  adr_id INT NOT NULL,
  tag    VARCHAR(60) NOT NULL,
  UNIQUE KEY adr_tag (adr_id, tag),
  FOREIGN KEY (adr_id) REFERENCES ADR(id) ON DELETE CASCADE
);

/*-----------------------------------------------------------------------
  6 · ROADMAP / BACKLOG (Dev + Infra)
------------------------------------------------------------------------*/
-- 6.1 · Tabela de tipos extensível
CREATE TABLE RoadmapType (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(40) NOT NULL UNIQUE,        -- feature / infra / …
  description VARCHAR(120),
  color_hex   CHAR(7),                            -- #4ade80
  created_at  DATETIME DEFAULT NOW()
) COMMENT='Tipos de item de roadmap (dev & infra)';

-- 6.2 · Itens de roadmap/backlog
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

/*-----------------------------------------------------------------------
  7 · LOG / AUDITORIA
------------------------------------------------------------------------*/
CREATE TABLE Log (
  id        BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id   INT NULL,
  level     ENUM('info','warn','error') DEFAULT 'info',
  message   TEXT NOT NULL,
  metadata  JSON,
  created_at DATETIME DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES `User`(id) ON DELETE SET NULL
);

/*-----------------------------------------------------------------------
  8 · ÍNDICES AUXILIARES
------------------------------------------------------------------------*/
CREATE INDEX idx_component_status ON Component(status);
CREATE INDEX idx_adr_status       ON ADR(status);
CREATE INDEX idx_ci_env           ON Component_Instance(environment_id);
CREATE INDEX idx_roadmap_status   ON RoadmapItem(status);

/*-----------------------------------------------------------------------
  9 · TRIGGER – GARANTIR PELO MENOS UM OWNER POR ADR
------------------------------------------------------------------------*/
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

/*-----------------------------------------------------------------------
 10 · SEED INICIAL
------------------------------------------------------------------------*/
INSERT INTO Environment (name, description) VALUES
 ('development','Sandbox de desenvolvedores'),
 ('homologation','QA / staging'),
 ('production', 'Ambiente de produção');

INSERT INTO Team (name) VALUES ('Network'), ('Operations'), ('Platform');

INSERT INTO Category (name) VALUES ('Networking'), ('Security'), ('Runtime');

/* tipos de backlog para Dev + Infra */
INSERT INTO RoadmapType (name, description, color_hex) VALUES
 ('feature',        'Nova funcionalidade de produto',      '#4ade80'),
 ('refactor',       'Melhoria interna (código/design)',    '#22d3ee'),
 ('technical debt', 'Dívida técnica a endereçar',          '#eab308'),
 ('infra',          'Mudança ou projeto de infraestrutura', '#6366f1'),
 ('maintenance',    'Manutenção / patch / hardening',      '#a3a3a3'),
 ('incident',       'Correção de incidente / RCA',         '#ef4444'),
 ('capacity',       'Expansão de capacidade / escala',     '#f97316');

/*=======================================================================
  FIM
=======================================================================*/
