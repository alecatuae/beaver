-- Migration para atualização completa do schema para Beaver v2.0

-- Atualizações nas tabelas existentes
-- --------------------------------------

-- User: adicionar campo full_name
ALTER TABLE `User` ADD COLUMN `full_name` VARCHAR(120) NOT NULL AFTER `email`;

-- User: atualizar enum role
ALTER TABLE `User` MODIFY COLUMN `role` ENUM('admin', 'architect', 'contributor', 'viewer') NOT NULL DEFAULT 'viewer';

-- ADR: renomear campo description para decision
ALTER TABLE `ADR` CHANGE COLUMN `description` `decision` TEXT NOT NULL;

-- ADR: atualizar enum status
ALTER TABLE `ADR` MODIFY COLUMN `status` ENUM('draft', 'accepted', 'superseded', 'rejected') NOT NULL DEFAULT 'draft';

-- Category: adicionar campo parent_id
ALTER TABLE `Category` ADD COLUMN `parent_id` INT NULL REFERENCES `Category`(id);

-- Component: atualizar enum status
ALTER TABLE `Component` MODIFY COLUMN `status` ENUM('planned', 'active', 'deprecated') NOT NULL DEFAULT 'active';

-- Component: adicionar campo team_id
ALTER TABLE `Component` ADD COLUMN `team_id` INT NULL REFERENCES `Team`(id);

-- GlossaryTerm: adicionar campo status
ALTER TABLE `GlossaryTerm` ADD COLUMN `status` ENUM('draft', 'approved', 'deprecated') NOT NULL DEFAULT 'draft';

-- Log: substituir campo action por level e message
ALTER TABLE `Log` DROP COLUMN `action`;
ALTER TABLE `Log` ADD COLUMN `level` ENUM('info', 'warn', 'error') NOT NULL DEFAULT 'info' AFTER `user_id`;
ALTER TABLE `Log` ADD COLUMN `message` TEXT NOT NULL AFTER `level`;
ALTER TABLE `Log` ADD COLUMN `metadata` JSON NULL AFTER `message`;
ALTER TABLE `Log` CHANGE COLUMN `timestamp` `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- RoadmapItem: adicionar campos component_id, type_id e due_date
ALTER TABLE `RoadmapItem` ADD COLUMN `component_id` INT NULL REFERENCES `Component`(id) ON DELETE SET NULL;
ALTER TABLE `RoadmapItem` MODIFY COLUMN `status` ENUM('todo', 'in_progress', 'done', 'blocked') NOT NULL DEFAULT 'todo';

-- Novas tabelas
-- --------------------------------------

-- Environment
CREATE TABLE IF NOT EXISTS `Environment` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(50) NOT NULL UNIQUE,
  `description` VARCHAR(255),
  `created_at` DATETIME DEFAULT NOW()
) COMMENT='Domínios físicos ou lógicos onde rodam instâncias';

-- Component_Instance
CREATE TABLE IF NOT EXISTS `Component_Instance` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `component_id` INT NOT NULL,
  `environment_id` INT NOT NULL,
  `hostname` VARCHAR(120),
  `specs` JSON,
  `created_at` DATETIME DEFAULT NOW(),
  UNIQUE KEY `uniq_comp_env` (`component_id`, `environment_id`),
  FOREIGN KEY (`component_id`) REFERENCES `Component`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`environment_id`) REFERENCES `Environment`(`id`) ON DELETE RESTRICT
) COMMENT='Manifestação física/lógica do componente';

-- ADR_Participant
CREATE TABLE IF NOT EXISTS `ADR_Participant` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `adr_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `role` ENUM('owner', 'reviewer', 'consumer') DEFAULT 'reviewer',
  `created_at` DATETIME DEFAULT NOW(),
  UNIQUE KEY `adr_user` (`adr_id`, `user_id`),
  FOREIGN KEY (`adr_id`) REFERENCES `ADR`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE
) COMMENT='Quem participou de cada ADR';

-- ADR_ComponentInstance
CREATE TABLE IF NOT EXISTS `ADR_ComponentInstance` (
  `adr_id` INT NOT NULL,
  `instance_id` INT NOT NULL,
  `impact_level` ENUM('low', 'medium', 'high') DEFAULT 'medium',
  PRIMARY KEY (`adr_id`, `instance_id`),
  FOREIGN KEY (`adr_id`) REFERENCES `ADR`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`instance_id`) REFERENCES `Component_Instance`(`id`) ON DELETE CASCADE
) COMMENT='Impacto de ADR em instâncias específicas';

-- ADR_Component
CREATE TABLE IF NOT EXISTS `ADR_Component` (
  `adr_id` INT NOT NULL,
  `component_id` INT NOT NULL,
  PRIMARY KEY (`adr_id`, `component_id`),
  FOREIGN KEY (`adr_id`) REFERENCES `ADR`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`component_id`) REFERENCES `Component`(`id`) ON DELETE CASCADE
) COMMENT='ADR que afeta o componente inteiro';

-- Team_Member
CREATE TABLE IF NOT EXISTS `Team_Member` (
  `team_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `joined_at` DATETIME DEFAULT NOW(),
  PRIMARY KEY (`team_id`, `user_id`),
  FOREIGN KEY (`team_id`) REFERENCES `Team`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE
) COMMENT='Associação usuários ↔ times';

-- RelationshipTag
CREATE TABLE IF NOT EXISTS `RelationshipTag` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `source_id` INT NOT NULL,
  `target_id` INT NOT NULL,
  `tag` VARCHAR(60) NOT NULL,
  UNIQUE KEY `rel_tag` (`source_id`, `target_id`, `tag`),
  FOREIGN KEY (`source_id`) REFERENCES `Component`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`target_id`) REFERENCES `Component`(`id`) ON DELETE CASCADE
);

-- RoadmapType
CREATE TABLE IF NOT EXISTS `RoadmapType` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(40) NOT NULL UNIQUE,
  `description` VARCHAR(120),
  `color_hex` CHAR(7),
  `created_at` DATETIME DEFAULT NOW()
) COMMENT='Tipos de item de roadmap (dev & infra)';

-- Adicionar referência a RoadmapType na tabela RoadmapItem
ALTER TABLE `RoadmapItem` ADD COLUMN `type_id` INT NOT NULL AFTER `component_id`;
ALTER TABLE `RoadmapItem` ADD FOREIGN KEY (`type_id`) REFERENCES `RoadmapType`(`id`) ON DELETE RESTRICT;
ALTER TABLE `RoadmapItem` ADD COLUMN `due_date` DATE NULL;

-- Índices auxiliares
-- --------------------------------------
CREATE INDEX IF NOT EXISTS `idx_component_status` ON `Component`(`status`);
CREATE INDEX IF NOT EXISTS `idx_adr_status` ON `ADR`(`status`);
CREATE INDEX IF NOT EXISTS `idx_ci_env` ON `Component_Instance`(`environment_id`);
CREATE INDEX IF NOT EXISTS `idx_roadmap_status` ON `RoadmapItem`(`status`);

-- Trigger para garantir pelo menos um owner por ADR
-- --------------------------------------
DELIMITER $$
CREATE TRIGGER IF NOT EXISTS `trg_adr_owner_must_exist`
AFTER INSERT ON `ADR_Participant`
FOR EACH ROW
BEGIN
  DECLARE owners INT;
  SELECT COUNT(*) INTO owners
  FROM `ADR_Participant`
  WHERE `adr_id` = NEW.`adr_id` AND `role` = 'owner';
  IF owners = 0 THEN
    SIGNAL SQLSTATE '45000' 
      SET MESSAGE_TEXT = 'Cada ADR precisa de pelo menos um participante com role=owner';
  END IF;
END$$
DELIMITER ;

-- Dados iniciais para novas tabelas
-- --------------------------------------
INSERT INTO `Environment` (`name`, `description`) VALUES
  ('development', 'Sandbox de desenvolvedores'),
  ('homologation', 'QA / staging'),
  ('production', 'Ambiente de produção');

INSERT INTO `RoadmapType` (`name`, `description`, `color_hex`) VALUES
  ('feature', 'Nova funcionalidade de produto', '#4ade80'),
  ('refactor', 'Melhoria interna (código/design)', '#22d3ee'),
  ('technical debt', 'Dívida técnica a endereçar', '#eab308'),
  ('infra', 'Mudança ou projeto de infraestrutura', '#6366f1'),
  ('maintenance', 'Manutenção / patch / hardening', '#a3a3a3'),
  ('incident', 'Correção de incidente / RCA', '#ef4444'),
  ('capacity', 'Expansão de capacidade / escala', '#f97316'); 