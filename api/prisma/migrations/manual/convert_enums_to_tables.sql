-- Arquivo: ./prisma/migrations/manual/convert_enums_to_tables.sql

-- Criar tabelas e preencher com dados de enums
CREATE TABLE Environment (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  description VARCHAR(255),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Inserir ambientes padrão
INSERT INTO Environment(name, description) 
VALUES 
  ('development', 'Ambiente de desenvolvimento'),
  ('homologation', 'Ambiente de homologação'),
  ('production', 'Ambiente de produção');

-- Criar tabela para tipos de roadmap
CREATE TABLE RoadmapType (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(40) UNIQUE NOT NULL,
  description VARCHAR(120),
  color_hex CHAR(7) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Inserir tipos padrão de roadmap
INSERT INTO RoadmapType(name, description, color_hex) 
VALUES 
  ('feature', 'Nova funcionalidade de produto', '#4ade80'),
  ('refactor', 'Melhoria interna (código/design)', '#22d3ee'),
  ('technical_debt', 'Dívida técnica a endereçar', '#eab308'),
  ('infra', 'Mudança ou projeto de infraestrutura', '#6366f1'),
  ('maintenance', 'Manutenção / patch / hardening', '#a3a3a3'),
  ('incident', 'Correção de incidente / RCA', '#ef4444'),
  ('capacity', 'Expansão de capacidade / escala', '#f97316');

-- Adicionar campo status em GlossaryTerm
ALTER TABLE GlossaryTerm
ADD COLUMN status VARCHAR(20) DEFAULT 'draft' NOT NULL,
ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP;

-- Adicionar campo fullName em User
ALTER TABLE User
ADD COLUMN full_name VARCHAR(120) DEFAULT '';

-- Atualizar campo full_name em User usando username
UPDATE User
SET full_name = username
WHERE full_name = '';

-- Atualizar papéis de usuário se necessário
UPDATE User
SET role = 'VIEWER'
WHERE role = 'USER';

-- Atualizar status de componente se necessário
UPDATE Component
SET status = 'ACTIVE'
WHERE status = 'INACTIVE';

-- Atualizar status de ADR se necessário
UPDATE ADR
SET status = 'DRAFT'
WHERE status = 'PROPOSED';

-- Converter ADRs para o novo modelo de participantes
-- Este passo deve ser executado DEPOIS que a tabela ADR_Participant existir
-- A migração Prisma criará a tabela
-- INSERT INTO ADR_Participant (adr_id, user_id, role, created_at)
-- SELECT id, owner_id, 'OWNER', created_at FROM ADR WHERE owner_id IS NOT NULL;

-- Criar novas tabelas de times e categorias se não existirem ainda
CREATE TABLE IF NOT EXISTS Team (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(80) UNIQUE NOT NULL,
  description TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Inserir times padrão
INSERT INTO Team(name, description) 
VALUES 
  ('Network', 'Equipe de redes'),
  ('Operations', 'Equipe de operações'),
  ('Platform', 'Equipe de plataforma');

-- Adicionar campos de metadados no Log
ALTER TABLE Log
MODIFY COLUMN id BIGINT AUTO_INCREMENT,
ADD COLUMN level VARCHAR(20) DEFAULT 'info',
ADD COLUMN metadata JSON,
CHANGE COLUMN timestamp created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
CHANGE COLUMN action message TEXT;

-- Atualizando os campos de Log para os novos valores
UPDATE Log SET level = 'info' WHERE level IS NULL; 