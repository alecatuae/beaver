# Impacto na Aplicação - Beaver v2.0

*Última atualização → Junho 2024*

Este documento detalha o impacto da migração para a versão 2.0 do Beaver na aplicação existente, com foco nas mudanças de banco de dados, API e interface do usuário.

## Impacto no Modelo de Dados

### MariaDB / ORM (Prisma)

#### Mudanças Estruturais

- **Conversão de Enums para Tabelas**:
  - `Env` → tabela `Environment` (name, description)
  - `RoadmapType` → tabela `RoadmapType` (name, description, color_hex)
  - Permite maior flexibilidade e configuração via UI sem necessidade de alterações no código

- **Novas Entidades**:
  - `Component_Instance`: Representa a manifestação física/lógica de um componente em um ambiente específico
  - `TRMLayer`: Categoriza hierarquicamente as categorias (Infrastructure, Platform, Application, etc.)
  - `Team_Member`: Associa usuários a times com data de ingresso
  - `ADR_Participant`: Substitui o campo único `owner_id` por participantes múltiplos com papéis definidos
  - `ADR_ComponentInstance`: Associa ADRs a instâncias específicas com nível de impacto

- **Alterações em Tabelas Existentes**:
  - `Component`: Substitui campo enum `env` por referência `environment_id` à tabela `Environment`
  - `Category`: Adiciona campo `parent_id` para categorização hierárquica via TRM
  - `ADR`: Remove campo `owner_id`, agora gerenciado via tabela `ADR_Participant`
  - `Log`: Adiciona campo `metadata` tipo JSON para armazenamento flexível de dados de auditoria

#### Impacto no Prisma ORM

- **schema.prisma** precisa ser completamente reescrito para refletir:
  - Novos modelos para `Environment`, `Component_Instance`, `TRMLayer`, etc.
  - Relacionamentos N:M entre `ADR` e `User` via `ADR_Participant`
  - Propriedades JSON para `metadata` em `Log` e `specs` em `Component_Instance`
  - Trigger `trg_adr_owner_must_exist` com validação para garantir pelo menos um participante com papel "owner" por ADR

- **Código de acesso a dados** precisa ser refatorado para:
  - Buscar dados das novas tabelas em vez de usar enums fixos
  - Lidar com instâncias de componentes e seus ambientes específicos
  - Processar participantes múltiplos em ADRs
  - Utilizar campos JSON para metadados e especificações

## Impacto no Neo4j

- **Novos Nós**:
  - `:ComponentInstance` (ligado ao `:Component` via relação `:INSTANTIATES`)
  - `:Environment` (ligado ao `:ComponentInstance` via relação `:DEPLOYED_IN`)
  - `:Team` (ligado ao `:Component` via relação `:MANAGED_BY`)

- **Novas Relações**:
  - `:INSTANTIATES`: Componente → Instância
  - `:DEPLOYED_IN`: Instância → Ambiente
  - `:MANAGED_BY`: Componente → Time
  - `:INSTANCE_CONNECTS_TO`: Relações entre instâncias específicas
  - `:AFFECTS_INSTANCE`: ADR → Instância
  - `:PARTICIPATES_IN`: Usuário → ADR (com propriedade `role`)

- **Sincronização**: A API deve realizar sincronização adicional entre MariaDB e Neo4j para as novas entidades, garantindo a consistência de:
  - Instâncias de componentes
  - Ambientes
  - Times
  - Participantes de ADRs

## Impacto na API GraphQL/REST

### Novos Tipos e Queries

- **Types**:
  ```graphql
  type Environment { id: ID!, name: String!, description: String }
  type ComponentInstance { id: ID!, component: Component!, environment: Environment!, hostname: String, specs: JSON }
  type TRMLayer { id: ID!, name: String!, categories: [Category!]! }
  type ADRParticipant { id: ID!, user: User!, role: String!, adr: ADR! }
  ```

- **Queries**:
  ```graphql
  layers: [TRMLayer!]!
  environments: [Environment!]!
  categoriesByLayer(layerId: ID!): [Category!]!
  componentInstances(componentId: ID, environmentId: ID): [ComponentInstance!]!
  adrParticipants(adrId: ID!): [ADRParticipant!]!
  ```

### Alterações em Mutations Existentes

- **ADR**:
  ```graphql
  createADR(title: String!, description: String!, status: ADRStatus!, participants: [ParticipantInput!]!)
  ```
  onde `ParticipantInput` é:
  ```graphql
  input ParticipantInput {
    userId: ID!
    role: String! # "owner", "reviewer", "consumer"
  }
  ```

- **Component**:
  ```graphql
  createComponent(name: String!, description: String, status: ComponentStatus!, 
                 environmentId: ID!, categoryId: ID, teamId: ID)
  ```

- **ComponentInstance**:
  ```graphql
  createComponentInstance(componentId: ID!, environmentId: ID!, hostname: String, specs: JSON)
  ```

## Impacto no Frontend

### Alterações nos Formulários

- **Formulário de Componente**:
  - Campo `env` (dropdown fixo) substituído por seleção assíncrona da tabela `Environment`
  - Adição de seleção de `Team` responsável
  - Opção de criar instâncias em múltiplos ambientes

- **Formulário de ADR**:
  - Novo passo "Participantes" com interface para adicionar múltiplos usuários com papéis diferentes:
    - Pelo menos um "owner" (validação obrigatória)
    - Múltiplos "reviewer" e "consumer" (opcional)
  - Opção de associar ADR a instâncias específicas de componentes com níveis de impacto

- **Formulário de Categoria**:
  - Campo adicional para selecionar `TRMLayer` (Infrastructure, Platform, Application, etc.)
  - Suporte a organização hierárquica com campo `parent_id`

### Novas Páginas/Componentes

- **Gestão de Ambientes**:
  - Interface CRUD para ambientes (development, homologation, production, etc.)
  - Dashboard mostrando contadores e indicadores de status de componentes por ambiente

- **Visualização de TRM**:
  - Navegação hierárquica com drill-down:
    ```
    Layer → Category → Component → Instance
    ```
  - Visualização em árvore expandível/colapsável

- **Instâncias de Componentes**:
  - Interface para gerenciar instâncias específicas de componentes em cada ambiente
  - Campos para hostname e especificações técnicas em formato JSON
  - Matriz de relacionamentos entre instâncias específicas

- **Gestão de Times**:
  - Interface para associar usuários a times
  - Visualização dos componentes sob responsabilidade de cada time
  - Dashboard de atividades por time

### Mudanças na Visualização de Grafo

- Opção de visualizar grafo no nível de:
  - Componentes lógicos (visualização tradicional)
  - Instâncias físicas (nova visualização detalhada)
- Filtros adicionais por ambiente, time e camada TRM
- Realce visual de instâncias específicas impactadas por ADRs

## ETL / Migração de Dados

Antes de rodar o novo script em uma base já populada, execute a migração com os seguintes passos:

### 1. Preparação

```sql
-- Verificar integridade dos dados existentes
SELECT COUNT(*) FROM Component WHERE env IS NULL; -- Deve ser zero
SELECT COUNT(*) FROM ADR WHERE owner_id IS NULL; -- Deve ser zero

-- Criar backup antes da migração
-- Usando mysqldump ou ferramenta similar
```

### 2. Criação das Novas Tabelas

```sql
-- Criar TRMLayer
CREATE TABLE TRMLayer (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(60) NOT NULL UNIQUE,
  description VARCHAR(255),
  created_at DATETIME DEFAULT NOW()
);

-- Criar Environment baseado no enum Env
CREATE TABLE Environment (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  description VARCHAR(255),
  created_at DATETIME DEFAULT NOW()
);

-- Adicionar campo layer_id na tabela Category
ALTER TABLE Category ADD COLUMN layer_id INT NULL;
```

### 3. Migração de Dados

```sql
-- Inserir camadas TRM padrão
INSERT INTO TRMLayer (name) VALUES 
  ('Infrastructure'),
  ('Platform'),
  ('Application'),
  ('Shared Services');

-- Associar categorias existentes a uma camada (temporariamente)
UPDATE Category SET layer_id = 1 WHERE layer_id IS NULL;

-- Migrar valores do enum Env para a tabela Environment
INSERT INTO Environment(name, description)
SELECT DISTINCT env, CONCAT('Migrado de enum: ', env) 
FROM Component 
GROUP BY env;

-- Criar tabela de participantes de ADR
CREATE TABLE ADR_Participant (
  id INT AUTO_INCREMENT PRIMARY KEY,
  adr_id INT NOT NULL,
  user_id INT NOT NULL,
  role ENUM('owner','reviewer','consumer') DEFAULT 'reviewer',
  created_at DATETIME DEFAULT NOW(),
  FOREIGN KEY (adr_id) REFERENCES ADR(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES User(id) ON DELETE CASCADE,
  UNIQUE KEY (adr_id, user_id)
);

-- Migrar owner_id de ADR para ADR_Participant
INSERT INTO ADR_Participant (adr_id, user_id, role)
SELECT id, owner_id, 'owner' FROM ADR WHERE owner_id IS NOT NULL;

-- Criar tabela RoadmapType baseada no enum existente
CREATE TABLE RoadmapType (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(40) NOT NULL UNIQUE,
  description VARCHAR(120),
  color_hex CHAR(7) DEFAULT '#4ade80',
  created_at DATETIME DEFAULT NOW()
);

-- Inserir tipos padrão baseados no enum existente
INSERT INTO RoadmapType (name, description) VALUES
  ('feature', 'Nova funcionalidade de produto'),
  ('bugfix', 'Correção de bug'),
  ('improvement', 'Melhoria em funcionalidade existente');
```

### 4. Criação de Instâncias e Ajustes de Chaves Estrangeiras

```sql
-- Criar tabela de instâncias
CREATE TABLE Component_Instance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  component_id INT NOT NULL,
  environment_id INT NOT NULL,
  hostname VARCHAR(120),
  specs JSON,
  created_at DATETIME DEFAULT NOW(),
  FOREIGN KEY (component_id) REFERENCES Component(id) ON DELETE CASCADE,
  FOREIGN KEY (environment_id) REFERENCES Environment(id) ON DELETE RESTRICT,
  UNIQUE KEY (component_id, environment_id)
);

-- Criar instâncias baseadas no env original do componente
INSERT INTO Component_Instance (component_id, environment_id, hostname)
SELECT 
  c.id, 
  e.id,
  CONCAT(LOWER(REPLACE(c.name, ' ', '-')), '-', LOWER(e.name)) 
FROM 
  Component c
JOIN 
  Environment e ON e.name = c.env;

-- Adicionar campo environment_id na tabela Component
ALTER TABLE Component ADD COLUMN environment_id INT NULL;

-- Atualizar component.environment_id com base no env original
UPDATE Component c
JOIN Environment e ON e.name = c.env
SET c.environment_id = e.id;

-- Remover campo env da tabela Component
ALTER TABLE Component DROP COLUMN env;

-- Adicionar foreign key para environment_id
ALTER TABLE Component 
ADD CONSTRAINT fk_component_environment 
FOREIGN KEY (environment_id) REFERENCES Environment(id);
```

### 5. Ajustes Finais

```sql
-- Adicionar trigger para garantir pelo menos um owner por ADR
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

-- Remover coluna owner_id da tabela ADR (após verificar a migração)
ALTER TABLE ADR DROP FOREIGN KEY fk_adr_owner; -- Ajustar nome conforme seu schema
ALTER TABLE ADR DROP COLUMN owner_id;
```

## Requisitos Técnicos e Considerações

### Versões de Banco de Dados

- **MariaDB 10.5+** é necessário pois:
  - Suporte a campos JSON (para `specs` e `metadata`)
  - Triggers com validação (`trg_adr_owner_must_exist`)
  - Check constraints e enums aprimorados

- **Neo4j 5.x** é necessário para:
  - Melhor desempenho com grafos maiores (após inclusão de instâncias)
  - Suporte a propriedades temporais e consultas baseadas em tempo

### Ajustes de Código Necessários

- **ORM/Prisma**:
  - Atualizar `schema.prisma` para refletir as novas tabelas e relacionamentos
  - Reescrever queries e mutations que usavam enums diretamente
  - Ajustar o código que manipulava `owner_id` em ADRs para usar a tabela `ADR_Participant`
  
- **GraphQL**:
  - Atualizar schemas para incluir novos tipos e campos
  - Modificar resolvers para trabalhar com o novo modelo de dados
  - Adicionar validações específicas (como pelo menos um owner por ADR)

- **Frontend**:
  - Atualizar dropdowns que usavam enums fixos para buscar dados das tabelas
  - Implementar nova interface para participantes de ADRs
  - Criar componentes UI para visualizar e gerenciar instâncias
  - Ajustar visualizações de grafo para opções de filtro adicionais

### Considerações de Desempenho

- A conversão de enums para tabelas resultará em mais joins em consultas que antes usavam valores fixos
- A visualização de grafos com instâncias aumentará o número de nós e relacionamentos, exigindo:
  - Otimização de consultas Neo4j
  - Paginação eficiente na API
  - Renderização otimizada no frontend (lazy loading e filtros)

## Conclusão

O novo schema **não é compatível plug-and-play** com o schema original (`mariadb_schema.sql`). As mudanças fundamentais incluem:

1. **Estruturais**:
   - Conversão de enums para tabelas dinâmicas
   - Introdução do conceito de instâncias específicas de componentes
   - Múltiplos participantes em ADRs substituindo o owner único
   - Categorização hierárquica via TRM

2. **Técnicas**:
   - Utilização de campos JSON (para especificações e metadados)
   - Triggers para validação (garantindo pelo menos um owner por ADR)
   - Relacionamentos mais complexos entre entidades

Para uma migração bem-sucedida, é essencial:
- Executar os scripts de migração de dados na ordem correta
- Atualizar todo o código que interagia com as estruturas modificadas
- Realizar testes extensivos para validar a nova estrutura
- Garantir compatibilidade com MariaDB 10.5+ e Neo4j 5.x

Quando implementadas corretamente, as mudanças da v2.0 trarão benefícios significativos:
- Gerenciamento flexível de múltiplos ambientes
- Melhor rastreabilidade de instâncias específicas
- Modelo de colaboração mais rico para ADRs
- Categorização hierárquica via TRM
- Glossário integrado com suporte a referências
