-- Adiciona os novos enums (no MySQL, usamos ENUM na definição da coluna)

-- Altera a tabela ADR: substitui description por decision
ALTER TABLE `ADR` CHANGE COLUMN `description` `decision` TEXT NOT NULL;

-- Altera a tabela ADR_ComponentInstance: muda impactLevel para usar o enum
ALTER TABLE `ADR_ComponentInstance` MODIFY COLUMN `impact_level` ENUM('LOW', 'MEDIUM', 'HIGH') NOT NULL;

-- Altera a tabela Log: muda level para usar o enum
ALTER TABLE `Log` MODIFY COLUMN `level` ENUM('INFO', 'WARN', 'ERROR') NOT NULL;

-- Altera a tabela GlossaryTerm: muda status para usar o enum e adiciona valor default
ALTER TABLE `GlossaryTerm` MODIFY COLUMN `status` ENUM('DRAFT', 'APPROVED', 'DEPRECATED') NOT NULL DEFAULT 'DRAFT'; 