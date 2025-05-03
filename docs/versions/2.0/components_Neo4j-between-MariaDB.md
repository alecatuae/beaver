# Relacionamento Entre Componentes no MariaDB e Neo4j - v2.0

*Última atualização → Junho 2024*

## Visão Geral

Este documento descreve como os componentes e seus relacionamentos são sincronizados entre o banco de dados relacional (MariaDB) e o banco de dados de grafos (Neo4j) na plataforma Beaver v2.0. A arquitetura dual de persistência foi aprimorada para suportar novas entidades como instâncias de componentes, ambientes e times.

## Modelo de Dados e Sincronização

### Componentes Base

#### MariaDB → Neo4j
- Quando um `Component` é criado no MariaDB, a API cria automaticamente um nó correspondente `:Component` no Neo4j
- Os metadados como `name`, `description`, `status` são replicados
- Os campos de validade temporal (`valid_from`, `valid_to`) são adicionados automaticamente no Neo4j

```
// Upsert de um componente
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
  c.category_id = {categoryId}
```

### Novas Entidades na v2.0

#### Instâncias de Componentes
- Um `Component_Instance` no MariaDB é representado como um nó `:ComponentInstance` no Neo4j
- A API estabelece duas relações importantes:
  - `:INSTANTIATES` do componente para sua instância
  - `:DEPLOYED_IN` da instância para o ambiente específico

```
// Upsert de instância de componente
MERGE (ci:ComponentInstance {id: {id}})
ON CREATE SET
  ci.component_id = {componentId},
  ci.environment_id = {environmentId},
  ci.hostname = {hostname},
  ci.specs = {specs},
  ci.created_at = datetime()
ON MATCH SET
  ci.hostname = {hostname},
  ci.specs = {specs}
```

#### Ambientes
- Cada `Environment` no MariaDB é representado como um nó `:Environment` no Neo4j
- Os ambientes são criados primeiro no MariaDB e depois sincronizados para o Neo4j

```
// Sincronização de ambiente
MERGE (e:Environment {id: {id}})
ON CREATE SET
  e.name = {name},
  e.description = {description},
  e.created_at = datetime()
ON MATCH SET
  e.name = {name},
  e.description = {description}
```

#### Times
- Cada `Team` no MariaDB é representado como um nó `:Team` no Neo4j
- A relação `:MANAGED_BY` conecta componentes aos times responsáveis

```
// Sincronização de time
MERGE (t:Team {id: {id}})
ON CREATE SET
  t.name = {name},
  t.description = {description},
  t.created_at = datetime()
ON MATCH SET
  t.name = {name},
  t.description = {description}
```

## Fluxo de Sincronização

### Criação e Atualização
1. Um usuário cria/atualiza uma entidade no frontend (ex: um componente)
2. A API recebe a requisição e valida os dados
3. A API salva os dados no MariaDB
4. A API cria ou atualiza o nó correspondente no Neo4j
5. A API estabelece as relações necessárias no Neo4j

### Exclusão
1. Um usuário exclui uma entidade no frontend
2. A API recebe a requisição e valida permissões
3. A API exclui o registro do MariaDB
4. A API remove o nó e suas relações do Neo4j

## Relacionamentos Especiais

### Relacionamentos entre Instâncias de Componentes
- **Novo na v2.0**: Relacionamentos podem ser criados diretamente entre instâncias específicas
- No MariaDB: Registrado via tabelas de relacionamento
- No Neo4j: Representado pela relação `:INSTANCE_CONNECTS_TO`

```
// Criar relação entre instâncias
MATCH (a:ComponentInstance), (b:ComponentInstance)
WHERE a.id = {instanceAId} AND b.id = {instanceBId}
CREATE (a)-[:INSTANCE_CONNECTS_TO {protocol: {protocol}, port: {port}}]->(b)
```

### ADRs e Instâncias
- **Novo na v2.0**: Um ADR pode afetar instâncias específicas de componentes
- No MariaDB: Registrado na tabela `ADR_ComponentInstance`
- No Neo4j: Representado pela relação `:AFFECTS_INSTANCE`

```
// ADR afeta instância específica
MATCH (a:ADR), (ci:ComponentInstance)
WHERE a.id = {adrId} AND ci.id = {instanceId}
CREATE (a)-[:AFFECTS_INSTANCE {impact_level: {impactLevel}}]->(ci)
```

### Participantes de ADRs
- **Novo na v2.0**: Múltiplos participantes com papéis definidos para cada ADR
- No MariaDB: Registrado na tabela `ADR_Participant`
- No Neo4j: Representado pela relação `:PARTICIPATES_IN`

```
// Usuário participa de um ADR
MATCH (u:User), (a:ADR)
WHERE u.id = {userId} AND a.id = {adrId}
CREATE (u)-[:PARTICIPATES_IN {role: {participantRole}}]->(a)
```

## Propriedades Temporais

Os componentes no Neo4j incluem propriedades temporais que não existem no MariaDB:
- `valid_from`: Data a partir da qual o componente é válido
- `valid_to`: Data até a qual o componente é válido

Estas propriedades permitem consultas temporais no Neo4j, como:

```cypher
// Encontrar componentes válidos em uma data específica
MATCH (c:Component)
WHERE c.valid_from <= datetime('2024-06-01')
  AND c.valid_to >= datetime('2024-06-01')
RETURN c.name, c.status
```

## Garantia de Consistência

A consistência entre os dois bancos de dados é garantida exclusivamente pela camada de API. Os seguintes mecanismos são empregados:

1. **Transações**: Operações que afetam ambos os bancos são executadas em um fluxo transacional
2. **Verificações de Integridade**: A API inclui verificações para garantir que as relações sejam válidas
3. **Resiliência**: Em caso de falha de sincronização, a API mantém logs detalhados para resolução manual
4. **Jobs de Reconciliação**: Tasks periódicas para verificar e corrigir inconsistências

## Consultas Comuns

### Componentes com suas Instâncias por Ambiente

```cypher
MATCH (c:Component)-[:INSTANTIATES]->(ci:ComponentInstance)-[:DEPLOYED_IN]->(e:Environment)
WHERE e.name = {environmentName}
RETURN c.name as component, ci.hostname as instance, e.name as environment
```

### ADRs que Afetam Instâncias Gerenciadas por um Time

```cypher
MATCH (t:Team)<-[:MANAGED_BY]-(c:Component)-[:INSTANTIATES]->(ci:ComponentInstance)<-[:AFFECTS_INSTANCE]-(a:ADR)
WHERE t.name = {teamName}
RETURN a.title as adr, c.name as component, ci.hostname as instance
```

### Participantes de um ADR por Papel

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

## Conclusão

A arquitetura dual de persistência da plataforma Beaver v2.0 foi significativamente aprimorada para suportar o gerenciamento de múltiplos ambientes, instâncias específicas de componentes e uma estrutura mais rica para colaboração em ADRs. A sincronização entre o MariaDB e o Neo4j é gerenciada pela camada de API, que garante a consistência dos dados e permite que cada banco de dados seja otimizado para seu propósito principal - o MariaDB para armazenamento relacional estruturado e o Neo4j para consultas e visualizações de relacionamentos complexos. 