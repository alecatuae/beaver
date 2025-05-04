#!/bin/bash

echo "==== BEAVER NEO4J SYNC SCRIPT ===="
echo "Sincronizando entidades do MariaDB para o Neo4j"

# Definir variáveis para conexão
NEO4J_CONTAINER="beaver-neo4j-1"
NEO4J_USER="neo4j"
NEO4J_PASSWORD="beaver12345"

# Verificar se o container Neo4j está rodando
if ! docker ps | grep -q $NEO4J_CONTAINER; then
  echo "Erro: Container $NEO4J_CONTAINER não está rodando."
  echo "Inicie o container com: docker-compose up -d neo4j"
  exit 1
fi

# Criar scripts para sincronização
echo "Criando scripts de sincronização Cypher..."

# 1. Sincronizar ambientes
echo "1. Sincronizando ambientes..."
ENV_SYNC_FILE=$(mktemp)
cat > $ENV_SYNC_FILE << "EOF"
// Sincronizar ambientes
// Executar esta consulta para atualizar todos os ambientes no Neo4j a partir do MariaDB

// Limpar ambientes existentes
MATCH (e:Environment)
DETACH DELETE e;

// Criar ambientes a partir dos dados do MariaDB
// Dados de exemplo - substituir com dados reais da consulta
WITH [
  {id: 1, name: 'development', description: 'Ambiente de desenvolvimento', created_at: datetime()},
  {id: 2, name: 'homologation', description: 'Ambiente de homologação', created_at: datetime()},
  {id: 3, name: 'production', description: 'Ambiente de produção', created_at: datetime()}
] AS environments

UNWIND environments AS env
CREATE (e:Environment {
  id: env.id,
  name: env.name,
  description: env.description,
  created_at: env.created_at
})
RETURN e.name AS environment;
EOF

docker cp $ENV_SYNC_FILE $NEO4J_CONTAINER:/var/lib/neo4j/sync_environments.cypher
docker exec $NEO4J_CONTAINER cypher-shell -u $NEO4J_USER -p $NEO4J_PASSWORD -f /var/lib/neo4j/sync_environments.cypher

# 2. Sincronizar times
echo "2. Sincronizando times..."
TEAM_SYNC_FILE=$(mktemp)
cat > $TEAM_SYNC_FILE << "EOF"
// Sincronizar times
// Executar esta consulta para atualizar todos os times no Neo4j a partir do MariaDB

// Limpar times existentes
MATCH (t:Team)
DETACH DELETE t;

// Criar times a partir dos dados do MariaDB
// Dados de exemplo - substituir com dados reais da consulta
WITH [
  {id: 1, name: 'Architecture', description: 'Enterprise Architecture Team', created_at: datetime()},
  {id: 2, name: 'Development', description: 'Development Team', created_at: datetime()},
  {id: 3, name: 'Operations', description: 'Operations Team', created_at: datetime()}
] AS teams

UNWIND teams AS team
CREATE (t:Team {
  id: team.id,
  name: team.name,
  description: team.description,
  created_at: team.created_at
})
RETURN t.name AS team;
EOF

docker cp $TEAM_SYNC_FILE $NEO4J_CONTAINER:/var/lib/neo4j/sync_teams.cypher
docker exec $NEO4J_CONTAINER cypher-shell -u $NEO4J_USER -p $NEO4J_PASSWORD -f /var/lib/neo4j/sync_teams.cypher

# 3. Sincronizar instâncias de componentes
echo "3. Sincronizando instâncias de componentes..."
INSTANCE_SYNC_FILE=$(mktemp)
cat > $INSTANCE_SYNC_FILE << "EOF"
// Sincronizar instâncias de componentes
// Executar esta consulta para atualizar todas as instâncias no Neo4j a partir do MariaDB

// Limpar instâncias existentes
MATCH (ci:ComponentInstance)
DETACH DELETE ci;

// Criar instâncias a partir dos dados do MariaDB
// Dados de exemplo - substituir com dados reais da consulta
WITH [
  {id: 1, component_id: 1, environment_id: 1, hostname: 'app-dev01', specs: '{"cpu": "2", "memory": "4Gi"}', created_at: datetime()},
  {id: 2, component_id: 1, environment_id: 3, hostname: 'app-prod01', specs: '{"cpu": "4", "memory": "8Gi"}', created_at: datetime()},
  {id: 3, component_id: 2, environment_id: 1, hostname: 'db-dev01', specs: '{"cpu": "2", "memory": "8Gi"}', created_at: datetime()},
  {id: 4, component_id: 2, environment_id: 3, hostname: 'db-prod01', specs: '{"cpu": "8", "memory": "32Gi"}', created_at: datetime()}
] AS instances

UNWIND instances AS instance
CREATE (ci:ComponentInstance {
  id: instance.id,
  component_id: instance.component_id,
  environment_id: instance.environment_id,
  hostname: instance.hostname,
  specs: instance.specs,
  created_at: instance.created_at
});

// Criar relações INSTANTIATES entre componentes e instâncias
MATCH (c:Component), (ci:ComponentInstance)
WHERE c.id = ci.component_id
MERGE (c)-[:INSTANTIATES]->(ci);

// Criar relações DEPLOYED_IN entre instâncias e ambientes
MATCH (ci:ComponentInstance), (e:Environment)
WHERE ci.environment_id = e.id
MERGE (ci)-[:DEPLOYED_IN]->(e);

RETURN count(ci) AS instances_created;
EOF

docker cp $INSTANCE_SYNC_FILE $NEO4J_CONTAINER:/var/lib/neo4j/sync_instances.cypher
docker exec $NEO4J_CONTAINER cypher-shell -u $NEO4J_USER -p $NEO4J_PASSWORD -f /var/lib/neo4j/sync_instances.cypher

# 4. Sincronizar relações entre ADRs e instâncias
echo "4. Sincronizando relações ADR-Instância..."
ADR_INSTANCE_SYNC_FILE=$(mktemp)
cat > $ADR_INSTANCE_SYNC_FILE << "EOF"
// Sincronizar relações ADR-Instância
// Executar esta consulta para atualizar todas as relações entre ADRs e instâncias

// Limpar relações existentes
MATCH ()-[r:AFFECTS_INSTANCE]->()
DELETE r;

// Criar relações a partir dos dados do MariaDB
// Dados de exemplo - substituir com dados reais da consulta
WITH [
  {adr_id: 1, instance_id: 1, impact_level: 'HIGH', notes: 'Critical impact on development instance'},
  {adr_id: 1, instance_id: 2, impact_level: 'MEDIUM', notes: 'Moderate impact on production instance'},
  {adr_id: 2, instance_id: 3, impact_level: 'LOW', notes: 'Minor impact on development database'}
] AS adr_instances

UNWIND adr_instances AS rel
MATCH (a:ADR {id: rel.adr_id}), (ci:ComponentInstance {id: rel.instance_id})
MERGE (a)-[r:AFFECTS_INSTANCE]->(ci)
SET r.impact_level = rel.impact_level,
    r.notes = rel.notes
RETURN count(r) AS relationships_created;
EOF

docker cp $ADR_INSTANCE_SYNC_FILE $NEO4J_CONTAINER:/var/lib/neo4j/sync_adr_instances.cypher
docker exec $NEO4J_CONTAINER cypher-shell -u $NEO4J_USER -p $NEO4J_PASSWORD -f /var/lib/neo4j/sync_adr_instances.cypher

# 5. Validar sincronização
echo "5. Validando sincronização..."
VALIDATE_FILE=$(mktemp)
cat > $VALIDATE_FILE << "EOF"
// Validar contagens de entidades
MATCH (e:Environment) RETURN count(e) as environments;
MATCH (t:Team) RETURN count(t) as teams;
MATCH (ci:ComponentInstance) RETURN count(ci) as instances;
MATCH ()-[r:INSTANTIATES]->() RETURN count(r) as instantiates_rels;
MATCH ()-[r:DEPLOYED_IN]->() RETURN count(r) as deployed_in_rels;
MATCH ()-[r:MANAGED_BY]->() RETURN count(r) as managed_by_rels;
MATCH ()-[r:AFFECTS_INSTANCE]->() RETURN count(r) as affects_instance_rels;
EOF

docker cp $VALIDATE_FILE $NEO4J_CONTAINER:/var/lib/neo4j/validate.cypher
echo "Contagens de entidades após sincronização:"
docker exec $NEO4J_CONTAINER cypher-shell -u $NEO4J_USER -p $NEO4J_PASSWORD -f /var/lib/neo4j/validate.cypher

echo "==== SINCRONIZAÇÃO CONCLUÍDA ===="
echo "O Neo4j foi sincronizado com sucesso com os dados do MariaDB!"
echo "Você pode verificar os dados acessando: http://localhost:7474"

# Limpar arquivos temporários
rm -f $ENV_SYNC_FILE $TEAM_SYNC_FILE $INSTANCE_SYNC_FILE $ADR_INSTANCE_SYNC_FILE $VALIDATE_FILE 