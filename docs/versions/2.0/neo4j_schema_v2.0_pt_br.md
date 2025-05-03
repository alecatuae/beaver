# Documentação do Schema Neo4j v2.0

## Visão Geral

O schema do Neo4j v2.0 para o Beaver introduz diversos aprimoramentos para dar suporte às novas estruturas de dados do MariaDB v2.0. Foram adicionados novos tipos de nós e relações para representar instâncias de componentes, ambientes e times, além de melhorias nas propriedades e constraints existentes.

## Tipos de Nós

### Nós Existentes (Aprimorados)

#### :Component
Representa um componente lógico da arquitetura.

**Propriedades:**
- `id`: Identificador único, corresponde ao ID do MariaDB (INT)
- `name`: Nome do componente (STRING)
- `description`: Descrição do componente (STRING)
- `status`: Status atual ('planned', 'active', 'deprecated')
- `team_id`: Referência ao time responsável (INT)
- `category_id`: Referência à categoria do componente (INT)
- `valid_from`: Data de início da validade do componente (DATETIME)
- `valid_to`: Data de término da validade do componente (DATETIME)

#### :ADR
Representa um Registro de Decisão Arquitetural.

**Propriedades:**
- `id`: Identificador único, corresponde ao ID do MariaDB (INT)
- `title`: Título do ADR (STRING)
- `description`: Conteúdo da decisão (STRING)
- `status`: Status atual ('draft', 'accepted', 'superseded', 'rejected')
- `created_at`: Data de criação (DATETIME)

### Novos Nós na v2.0

#### :ComponentInstance
Representa uma instância específica de um componente em um ambiente.

**Propriedades:**
- `id`: Identificador único, corresponde ao ID do MariaDB (INT)
- `component_id`: Referência ao componente pai (INT)
- `environment_id`: Referência ao ambiente (INT)
- `hostname`: Nome do host da instância (STRING)
- `specs`: Especificações técnicas em formato JSON (MAP)
- `created_at`: Data de criação (DATETIME)

#### :Environment
Representa um ambiente de implantação.

**Propriedades:**
- `id`: Identificador único, corresponde ao ID do MariaDB (INT)
- `name`: Nome do ambiente (STRING)
- `description`: Descrição do ambiente (STRING)
- `created_at`: Data de criação (DATETIME)

#### :Team
Representa um time organizacional.

**Propriedades:**
- `id`: Identificador único, corresponde ao ID do MariaDB (INT)
- `name`: Nome do time (STRING)
- `description`: Descrição do time (STRING)
- `created_at`: Data de criação (DATETIME)

## Tipos de Relações

### Relações Existentes (Mantidas)

#### :DEPENDS_ON
Indica que um componente depende de outro.

**Propriedades:**
- `since`: Data de início da dependência (DATETIME)
- `until`: Data de término da dependência, se aplicável (DATETIME)

#### :CONNECTS_TO
Indica que um componente se conecta a outro.

**Propriedades:**
- `protocol`: Protocolo de comunicação (STRING)
- `port`: Porta de comunicação (INT)

#### :RUNS_ON
Indica que um componente roda em uma plataforma.

**Propriedades:**
- `since`: Data de início (DATETIME)

#### :STORES_DATA_IN
Indica que um componente armazena dados em algum lugar.

**Propriedades:**
- `data_type`: Tipo de dados armazenados (STRING)

#### :CONTAINS
Indica que um componente contém subcomponentes.

#### :PROTECTS
Indica que um componente protege certos dados.

**Propriedades:**
- `mechanism`: Mecanismo de proteção (STRING)

#### :HAS_DECISION
Indica que um componente está associado a uma decisão arquitetural.

**Propriedades:**
- `impact`: Nível de impacto (STRING)

### Novas Relações na v2.0

#### :INSTANTIATES
Conecta um componente lógico à sua instância física.

**Direção:** (:Component)-[:INSTANTIATES]->(:ComponentInstance)

#### :DEPLOYED_IN
Indica que uma instância de componente está implantada em um ambiente específico.

**Direção:** (:ComponentInstance)-[:DEPLOYED_IN]->(:Environment)

**Propriedades:**
- `deploy_date`: Data de implantação (DATETIME)

#### :MANAGED_BY
Indica que um componente é gerenciado por um time específico.

**Direção:** (:Component)-[:MANAGED_BY]->(:Team)

#### :INSTANCE_CONNECTS_TO
Indica uma conexão entre instâncias específicas de componentes.

**Direção:** (:ComponentInstance)-[:INSTANCE_CONNECTS_TO]->(:ComponentInstance)

**Propriedades:**
- `protocol`: Protocolo de comunicação (STRING)
- `port`: Porta de comunicação (INT)

#### :AFFECTS_INSTANCE
Indica que um ADR afeta uma instância específica de componente.

**Direção:** (:ADR)-[:AFFECTS_INSTANCE]->(:ComponentInstance)

**Propriedades:**
- `impact_level`: Nível de impacto ('low', 'medium', 'high')

#### :PARTICIPATES_IN
Indica que um usuário participa de um ADR com um papel específico.

**Direção:** (:User)-[:PARTICIPATES_IN]->(:ADR)

**Propriedades:**
- `role`: Papel do participante ('owner', 'reviewer', 'consumer')

## Constraints e Índices

### Constraints

```cypher
// Constraints - Componentes
CREATE CONSTRAINT ON (c:Component) ASSERT c.id IS UNIQUE;
CREATE CONSTRAINT ON (c:Component) ASSERT exists(c.valid_from);
CREATE CONSTRAINT ON (c:Component) ASSERT exists(c.valid_to);

// Constraints - Instâncias de Componentes (Novo na v2.0)
CREATE CONSTRAINT ON (ci:ComponentInstance) ASSERT ci.id IS UNIQUE;
CREATE CONSTRAINT ON (ci:ComponentInstance) ASSERT exists(ci.component_id);
CREATE CONSTRAINT ON (ci:ComponentInstance) ASSERT exists(ci.environment_id);

// Constraints - Ambientes (Novo na v2.0)
CREATE CONSTRAINT ON (e:Environment) ASSERT e.id IS UNIQUE;
CREATE CONSTRAINT ON (e:Environment) ASSERT e.name IS UNIQUE;

// Constraints - ADRs
CREATE CONSTRAINT ON (a:ADR) ASSERT a.id IS UNIQUE;

// Constraints - Times (Novo na v2.0)
CREATE CONSTRAINT ON (t:Team) ASSERT t.id IS UNIQUE;

// Constraints - GlossaryTerm
CREATE CONSTRAINT ON (g:GlossaryTerm) ASSERT g.term IS UNIQUE;
```

### Índices

```cypher
// Índices para melhorar performance
CREATE INDEX ON :Component(status);
CREATE INDEX ON :ComponentInstance(hostname);
CREATE INDEX ON :Environment(name);
CREATE INDEX ON :ADR(status);
CREATE INDEX ON :Team(name);
```

## Sincronização com MariaDB

A sincronização entre MariaDB e Neo4j na v2.0 foi ampliada para incluir:

1. **Criação e atualização de instâncias de componentes**:
   - Quando uma instância é criada no MariaDB, ela também é criada no Neo4j
   - As relações `INSTANTIATES` e `DEPLOYED_IN` são estabelecidas automaticamente

2. **Sincronização de ambientes**:
   - Ambientes são criados e atualizados em ambos os bancos de dados
   - Relacionamentos entre instâncias e ambientes são mantidos consistentes

3. **Sincronização de times**:
   - Times são replicados do MariaDB para o Neo4j
   - A relação `MANAGED_BY` é criada e mantida automaticamente

4. **Suporte a ADRs com múltiplos participantes**:
   - Os participantes de ADRs são representados pela relação `PARTICIPATES_IN` no Neo4j
   - A relação conecta nós `:User` aos nós `:ADR`, incluindo o papel do participante como propriedade
   - Esta relação corresponde aos dados da tabela `ADR_Participant` do MariaDB

## Operações CRUD Principais

### Upsert de Componente

```cypher
MERGE (c:Component {id: {id}})
ON CREATE SET 
  c.name = {name},
  c.description = {description},
  c.status = {status},
  c.team_id = {teamId},
  c.category_id = {categoryId},
  c.valid_from = datetime(),
  c.valid_to = datetime("9999-12-31")
ON MATCH SET
  c.name = {name},
  c.description = {description},
  c.status = {status},
  c.team_id = {teamId},
  c.category_id = {categoryId};
```

### Upsert de Instância de Componente

```cypher
MERGE (ci:ComponentInstance {id: {id}})
ON CREATE SET
  ci.component_id = {componentId},
  ci.environment_id = {environmentId},
  ci.hostname = {hostname},
  ci.specs = {specs},
  ci.created_at = datetime()
ON MATCH SET
  ci.hostname = {hostname},
  ci.specs = {specs};
```

### Criar Relação entre Instâncias

```cypher
MATCH (a:ComponentInstance), (b:ComponentInstance)
WHERE a.id = {instanceAId} AND b.id = {instanceBId}
CREATE (a)-[:INSTANCE_CONNECTS_TO {protocol: {protocol}, port: {port}}]->(b);
```

### Criar Relação de Participação em ADR

```cypher
MATCH (u:User), (a:ADR)
WHERE u.id = {userId} AND a.id = {adrId}
CREATE (u)-[:PARTICIPATES_IN {role: {participantRole}}]->(a);
```

## Consultas Comuns

### Obter Componentes com suas Instâncias

```cypher
MATCH (c:Component)-[:INSTANTIATES]->(ci:ComponentInstance)-[:DEPLOYED_IN]->(e:Environment)
RETURN c.name as component, ci.hostname as instance, e.name as environment
```

### Obter ADRs que Afetam Instâncias em um Ambiente Específico

```cypher
MATCH (a:ADR)-[:AFFECTS_INSTANCE]->(ci:ComponentInstance)-[:DEPLOYED_IN]->(e:Environment)
WHERE e.name = {environmentName}
RETURN a.title as adr, ci.hostname as instance, a.impact_level as impact
```

### Obter Componentes Gerenciados por um Time

```cypher
MATCH (c:Component)-[:MANAGED_BY]->(t:Team)
WHERE t.name = {teamName}
RETURN c.name as component, c.status as status
```

### Obter Participantes de um ADR com seus Papéis

```cypher
MATCH (u:User)-[p:PARTICIPATES_IN]->(a:ADR)
WHERE a.id = {adrId}
RETURN u.full_name as participant, p.role as role
ORDER BY 
  CASE p.role 
    WHEN 'owner' THEN 1
    WHEN 'reviewer' THEN 2
    WHEN 'consumer' THEN 3
    ELSE 4
  END, u.full_name
```

## Considerações para Migração

1. Novas entidades devem ser criadas primeiro (Environments, Teams)
2. Componentes existentes devem ser atualizados para incluir `team_id`
3. Instâncias de componentes devem ser criadas e vinculadas ao componente e ambiente
4. Novas relações devem ser criadas entre componentes, times e instâncias
5. Os relacionamentos existentes entre componentes devem ser mantidos
6. Relações `PARTICIPATES_IN` devem ser criadas para manter a coerência com a tabela `ADR_Participant` do MariaDB

## Visualização do Grafo

A visualização do grafo agora suporta:

1. Filtragem por ambiente
2. Visualização em diferentes níveis:
   - Nível de componente lógico
   - Nível de instância física
3. Coloração por time responsável
4. Visualização do impacto de ADRs em componentes ou instâncias específicas
5. Visualização de participantes de ADRs e seus papéis

## Conclusão

O schema Neo4j v2.0 amplia significativamente as capacidades analíticas do grafo de arquitetura, permitindo uma visão mais detalhada das instâncias específicas de componentes em diferentes ambientes. As novas relações entre times, componentes e instâncias proporcionam uma visualização mais rica e informativa da arquitetura empresarial. A adição da relação `PARTICIPATES_IN` permite representar com precisão o modelo de colaboração em ADRs, mantendo a coerência com o modelo de dados relacional. 