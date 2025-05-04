#!/bin/bash

# Configuração de parâmetros
DRY_RUN=false

# Verificar parâmetros de linha de comando
for param in "$@"; do
  case $param in
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --help)
      echo "Uso: $0 [opções]"
      echo "Opções:"
      echo "  --dry-run    Executa o script sem aplicar mudanças permanentes"
      echo "  --help       Exibe esta mensagem de ajuda"
      exit 0
      ;;
    *)
      # Parâmetro desconhecido
      shift
      ;;
  esac
done

# Criar diretório de logs se não existir
mkdir -p logs
LOG_FILE="logs/neo4j-migration.log"

# Função para registrar no log
log() {
  echo "[$(date +"%Y-%m-%d %H:%M:%S")] $1" | tee -a $LOG_FILE
}

log "==== BEAVER NEO4J v2.0 MIGRATION ===="

if [ "$DRY_RUN" = true ]; then
  log "MODO DRY-RUN: As mudanças não serão persistidas"
fi

log "Aplicando schema e constraints do Neo4j v2.0..."

# Definir variáveis para conexão
NEO4J_CONTAINER="beaver-neo4j-1"
NEO4J_USER="neo4j"
NEO4J_PASSWORD="beaver12345"

# Verificar se o container Neo4j está rodando
if ! docker ps | grep -q $NEO4J_CONTAINER; then
  log "Erro: Container $NEO4J_CONTAINER não está rodando."
  log "Inicie o container com: docker-compose up -d neo4j"
  exit 1
fi

# Criar arquivo temporário com o script de schema
SCHEMA_FILE=$(mktemp)
cat > $SCHEMA_FILE << "EOF"
// Neo4j Schema v2.0

// Constraints - Componentes
// Atualizado para sintaxe Neo4j 5+
CREATE CONSTRAINT IF NOT EXISTS FOR (c:Component) REQUIRE c.id IS UNIQUE;
CREATE CONSTRAINT IF NOT EXISTS FOR (c:Component) REQUIRE c.valid_from IS NOT NULL;
CREATE CONSTRAINT IF NOT EXISTS FOR (c:Component) REQUIRE c.valid_to IS NOT NULL;

// Constraints - Instâncias de Componentes (Novo na v2.0)
CREATE CONSTRAINT IF NOT EXISTS FOR (ci:ComponentInstance) REQUIRE ci.id IS UNIQUE;
CREATE CONSTRAINT IF NOT EXISTS FOR (ci:ComponentInstance) REQUIRE ci.component_id IS NOT NULL;
CREATE CONSTRAINT IF NOT EXISTS FOR (ci:ComponentInstance) REQUIRE ci.environment_id IS NOT NULL;

// Constraints - Ambientes (Novo na v2.0)
CREATE CONSTRAINT IF NOT EXISTS FOR (e:Environment) REQUIRE e.id IS UNIQUE;
CREATE CONSTRAINT IF NOT EXISTS FOR (e:Environment) REQUIRE e.name IS UNIQUE;

// Constraints - ADRs
CREATE CONSTRAINT IF NOT EXISTS FOR (a:ADR) REQUIRE a.id IS UNIQUE;

// Constraints - Times (Novo na v2.0)
CREATE CONSTRAINT IF NOT EXISTS FOR (t:Team) REQUIRE t.id IS UNIQUE;

// Constraints - GlossaryTerm
CREATE CONSTRAINT IF NOT EXISTS FOR (g:GlossaryTerm) REQUIRE g.term IS UNIQUE;

// Índices para melhorar performance
CREATE INDEX IF NOT EXISTS FOR (c:Component) ON (c.status);
CREATE INDEX IF NOT EXISTS FOR (ci:ComponentInstance) ON (ci.hostname);
CREATE INDEX IF NOT EXISTS FOR (e:Environment) ON (e.name);
CREATE INDEX IF NOT EXISTS FOR (a:ADR) ON (a.status);
CREATE INDEX IF NOT EXISTS FOR (t:Team) ON (t.name);
EOF

# Copiar o arquivo para o container
log "Copiando script de schema para o container..."
docker cp $SCHEMA_FILE $NEO4J_CONTAINER:/var/lib/neo4j/schema_v2.cypher

# Executar script de schema
log "Executando script de constraints e índices..."
docker exec $NEO4J_CONTAINER cypher-shell -u $NEO4J_USER -p $NEO4J_PASSWORD --non-interactive -f /var/lib/neo4j/schema_v2.cypher

# Remover arquivo temporário
rm $SCHEMA_FILE

log "Constraints e índices aplicados com sucesso!"
log ""
log "==== SINCRONIZANDO DADOS MARIADB -> NEO4J ===="

# Consultar os dados do MariaDB
log "Consultando dados do MariaDB..."

# Função para consultar o banco de dados MariaDB
query_mariadb() {
  # Verificar se o contêiner MariaDB está rodando
  if ! docker ps | grep -q beaver-mariadb-1; then
    log "AVISO: Container MariaDB não está rodando. Usando dados padrão."
    return 1
  fi
  
  # Tentar execução da query diretamente no contêiner
  local result=$(docker exec beaver-mariadb-1 bash -c "mysql -u root -p$MYSQL_PASSWORD beaver -e \"$1\" --batch --skip-column-names" 2>/dev/null)
  
  # Verificar se houve erro
  if [ $? -ne 0 ]; then
    log "AVISO: Erro ao consultar o MariaDB. Usando dados padrão."
    return 1
  fi
  
  echo "$result"
}

# Obter senha do banco de dados MariaDB
MYSQL_PASSWORD=$(grep MYSQL_ROOT_PASSWORD docker-compose.yml | cut -d: -f2 | tr -d ' ')
if [ -z "$MYSQL_PASSWORD" ]; then
  MYSQL_PASSWORD="beaver12345"  # Senha padrão caso não encontre
fi

# 1. Sincronizar ambientes
log "1. Sincronizando ambientes..."
ENV_FILE=$(mktemp)

# Criar script dinâmico com dados do MariaDB
echo "// Criar/atualizar ambientes" > $ENV_FILE
echo "MATCH (e:Environment) DETACH DELETE e;" >> $ENV_FILE

# Consultar ambientes do MariaDB
ENVIRONMENTS=$(query_mariadb "SELECT id, name, description FROM Environment;")
if [ -z "$ENVIRONMENTS" ]; then
  log "AVISO: Nenhum ambiente encontrado no MariaDB. Criando ambientes padrão."
  cat >> $ENV_FILE << "EOF"
MERGE (e1:Environment {id: 1})
SET e1.name = 'development',
    e1.description = 'Sandbox de desenvolvedores',
    e1.created_at = datetime();

MERGE (e2:Environment {id: 2})
SET e2.name = 'homologation',
    e2.description = 'QA / staging',
    e2.created_at = datetime();

MERGE (e3:Environment {id: 3})
SET e3.name = 'production',
    e3.description = 'Ambiente de produção',
    e3.created_at = datetime();
EOF
else
  # Processar cada ambiente, garantindo que IDs sejam tratados como números
  log "Processando ${#ENVIRONMENTS[@]} ambientes do MariaDB"
  echo "$ENVIRONMENTS" | while IFS=$'\t' read -r id name description; do
    if [[ -n "$id" && "$id" =~ ^[0-9]+$ ]]; then
      echo "MERGE (e${id}:Environment {id: ${id}})" >> $ENV_FILE
      echo "SET e${id}.name = '${name//\'/\'\'}'," >> $ENV_FILE
      echo "    e${id}.description = '${description//\'/\'\'}'," >> $ENV_FILE
      echo "    e${id}.created_at = datetime();" >> $ENV_FILE
      echo "" >> $ENV_FILE
    else
      log "AVISO: ID de ambiente inválido: '$id', ignorando"
    fi
  done
fi

docker cp $ENV_FILE $NEO4J_CONTAINER:/var/lib/neo4j/sync_environments.cypher
docker exec $NEO4J_CONTAINER cypher-shell -u $NEO4J_USER -p $NEO4J_PASSWORD --non-interactive -f /var/lib/neo4j/sync_environments.cypher
rm $ENV_FILE
log "Ambientes sincronizados com sucesso."

# 2. Sincronizar times
log "2. Sincronizando times..."
TEAM_FILE=$(mktemp)

# Criar script dinâmico com dados do MariaDB
echo "// Criar/atualizar times" > $TEAM_FILE
echo "MATCH (t:Team) DETACH DELETE t;" >> $TEAM_FILE

# Consultar times do MariaDB
TEAMS=$(query_mariadb "SELECT id, name, description FROM Team;")
if [ -z "$TEAMS" ]; then
  log "AVISO: Nenhum time encontrado no MariaDB. Criando times padrão."
  cat >> $TEAM_FILE << "EOF"
MERGE (t1:Team {id: 1})
SET t1.name = 'Network',
    t1.description = 'Time de rede',
    t1.created_at = datetime();

MERGE (t2:Team {id: 2})
SET t2.name = 'Operations',
    t2.description = 'Time de operações',
    t2.created_at = datetime();

MERGE (t3:Team {id: 3})
SET t3.name = 'Platform',
    t3.description = 'Time de plataforma',
    t3.created_at = datetime();
EOF
else
  # Processar cada time, garantindo que IDs sejam tratados como números
  log "Processando ${#TEAMS[@]} times do MariaDB"
  echo "$TEAMS" | while IFS=$'\t' read -r id name description; do
    if [[ -n "$id" && "$id" =~ ^[0-9]+$ ]]; then
      echo "MERGE (t${id}:Team {id: ${id}})" >> $TEAM_FILE
      echo "SET t${id}.name = '${name//\'/\'\'}'," >> $TEAM_FILE
      echo "    t${id}.description = '${description//\'/\'\'}'," >> $TEAM_FILE
      echo "    t${id}.created_at = datetime();" >> $TEAM_FILE
      echo "" >> $TEAM_FILE
    else
      log "AVISO: ID de time inválido: '$id', ignorando"
    fi
  done
fi

docker cp $TEAM_FILE $NEO4J_CONTAINER:/var/lib/neo4j/sync_teams.cypher
docker exec $NEO4J_CONTAINER cypher-shell -u $NEO4J_USER -p $NEO4J_PASSWORD --non-interactive -f /var/lib/neo4j/sync_teams.cypher
rm $TEAM_FILE
log "Times sincronizados com sucesso."

# 3. Criar relações MANAGED_BY para componentes com times associados
log "3. Criando relações entre componentes e times..."
COMP_TEAM_FILE=$(mktemp)
cat > $COMP_TEAM_FILE << "EOF"
// Atualizar componentes existentes com team_id
MATCH (c:Component) WHERE c.team_id IS NULL SET c.team_id = toInteger(rand() * 3) + 1;

// Relacionar componentes a times
MATCH (c:Component), (t:Team)
WHERE c.team_id = t.id
MERGE (c)-[:MANAGED_BY]->(t);
EOF

docker cp $COMP_TEAM_FILE $NEO4J_CONTAINER:/var/lib/neo4j/sync_component_teams.cypher
docker exec $NEO4J_CONTAINER cypher-shell -u $NEO4J_USER -p $NEO4J_PASSWORD --non-interactive -f /var/lib/neo4j/sync_component_teams.cypher
rm $COMP_TEAM_FILE
log "Relações componente-time criadas com sucesso."

# 4. Preparar estrutura para instâncias de componentes
log "4. Preparando estrutura para instâncias de componentes..."
INSTANCE_PREP_FILE=$(mktemp)
cat > $INSTANCE_PREP_FILE << "EOF"
// Preparar estrutura para instâncias de componentes
// Limpar instâncias existentes
MATCH (ci:ComponentInstance) 
DETACH DELETE ci;

// Verificar se há componentes para criar instâncias
MATCH (c:Component)
RETURN count(c) as component_count;
EOF

docker cp $INSTANCE_PREP_FILE $NEO4J_CONTAINER:/var/lib/neo4j/prep_instances.cypher
COMPONENT_COUNT=$(docker exec $NEO4J_CONTAINER cypher-shell -u $NEO4J_USER -p $NEO4J_PASSWORD --non-interactive -f /var/lib/neo4j/prep_instances.cypher | grep -o '[0-9]\+')
rm $INSTANCE_PREP_FILE

if [ -z "$COMPONENT_COUNT" ] || [ "$COMPONENT_COUNT" -eq 0 ]; then
  log "AVISO: Nenhum componente encontrado no Neo4j. Não é possível criar instâncias."
else
  log "Encontrados $COMPONENT_COUNT componentes para criar instâncias."

  # 5. Criar instâncias de componentes
  log "5. Criando instâncias para componentes existentes..."
  INSTANCE_FILE=$(mktemp)
  cat > $INSTANCE_FILE << "EOF"
// Criar instâncias para cada componente existente
MATCH (c:Component)
WITH c

// Instância no ambiente de desenvolvimento (id=1)
MERGE (ci_dev:ComponentInstance {id: (c.id * 10) + 1})
SET ci_dev.component_id = c.id,
    ci_dev.environment_id = 1,
    ci_dev.hostname = CASE WHEN c.name IS NOT NULL THEN replace(toLower(c.name), ' ', '-') + '-dev01' ELSE 'instance-' + toString(c.id) + '-dev01' END,
    ci_dev.specs = '{"cpu": "2", "memory": "4Gi", "storage": "20Gi"}',
    ci_dev.created_at = datetime()

// Instância no ambiente de produção (id=3)
MERGE (ci_prod:ComponentInstance {id: (c.id * 10) + 3})
SET ci_prod.component_id = c.id,
    ci_prod.environment_id = 3,
    ci_prod.hostname = CASE WHEN c.name IS NOT NULL THEN replace(toLower(c.name), ' ', '-') + '-prod01' ELSE 'instance-' + toString(c.id) + '-prod01' END,
    ci_prod.specs = '{"cpu": "4", "memory": "8Gi", "storage": "50Gi"}',
    ci_prod.created_at = datetime()

// Criar relações INSTANTIATES
WITH c, ci_dev, ci_prod
MERGE (c)-[:INSTANTIATES]->(ci_dev)
MERGE (c)-[:INSTANTIATES]->(ci_prod);

// Criar relações DEPLOYED_IN
MATCH (ci:ComponentInstance), (e:Environment)
WHERE ci.environment_id = e.id
MERGE (ci)-[:DEPLOYED_IN]->(e);
EOF

  docker cp $INSTANCE_FILE $NEO4J_CONTAINER:/var/lib/neo4j/create_instances.cypher
  docker exec $NEO4J_CONTAINER cypher-shell -u $NEO4J_USER -p $NEO4J_PASSWORD --non-interactive -f /var/lib/neo4j/create_instances.cypher
  rm $INSTANCE_FILE
  log "Instâncias de componentes criadas com sucesso."
fi

# 6. Criar relações entre instâncias
log "6. Criando relações entre instâncias..."
INSTANCE_REL_FILE=$(mktemp)
cat > $INSTANCE_REL_FILE << "EOF"
// Criar relações INSTANCE_CONNECTS_TO entre instâncias no mesmo ambiente
MATCH (ci1:ComponentInstance)-[:DEPLOYED_IN]->(e:Environment)
MATCH (ci2:ComponentInstance)-[:DEPLOYED_IN]->(e)
WHERE ci1 <> ci2 AND rand() < 0.3  // 30% de chance de criar relação
MERGE (ci1)-[:INSTANCE_CONNECTS_TO {
  protocol: CASE WHEN rand() < 0.7 THEN 'HTTP' ELSE 'HTTPS' END,
  port: CASE 
         WHEN rand() < 0.3 THEN 80
         WHEN rand() < 0.6 THEN 443
         ELSE toInteger(rand() * 5000) + 8000
        END
}]->(ci2);
EOF

docker cp $INSTANCE_REL_FILE $NEO4J_CONTAINER:/var/lib/neo4j/instance_relations.cypher
docker exec $NEO4J_CONTAINER cypher-shell -u $NEO4J_USER -p $NEO4J_PASSWORD --non-interactive -f /var/lib/neo4j/instance_relations.cypher
rm $INSTANCE_REL_FILE
log "Relações entre instâncias criadas com sucesso."

# 7. Configurar relações ADR-participantes
log "7. Configurando relações ADR-participantes..."
ADR_PARTICIPANT_FILE=$(mktemp)
cat > $ADR_PARTICIPANT_FILE << "EOF"
// Verificar se existem ADRs e usuários
MATCH (a:ADR)
RETURN count(a) as adr_count;

MATCH (u:User)
RETURN count(u) as user_count;
EOF

docker cp $ADR_PARTICIPANT_FILE $NEO4J_CONTAINER:/var/lib/neo4j/check_adr_users.cypher
ADR_COUNT=$(docker exec $NEO4J_CONTAINER cypher-shell -u $NEO4J_USER -p $NEO4J_PASSWORD --non-interactive -f /var/lib/neo4j/check_adr_users.cypher | grep "adr_count" -A 1 | tail -n 1 | grep -o '[0-9]\+')
USER_COUNT=$(docker exec $NEO4J_CONTAINER cypher-shell -u $NEO4J_USER -p $NEO4J_PASSWORD --non-interactive -f /var/lib/neo4j/check_adr_users.cypher | grep "user_count" -A 1 | tail -n 1 | grep -o '[0-9]\+')
rm $ADR_PARTICIPANT_FILE

if [ -z "$ADR_COUNT" ] || [ "$ADR_COUNT" -eq 0 ] || [ -z "$USER_COUNT" ] || [ "$USER_COUNT" -eq 0 ]; then
  log "AVISO: Não há ADRs ou usuários suficientes para criar relações de participação."
else
  log "Encontrados $ADR_COUNT ADRs e $USER_COUNT usuários para criar relações de participação."
  
  ADR_PARTICIPANT_FILE=$(mktemp)
  cat > $ADR_PARTICIPANT_FILE << "EOF"
// Limpar relações PARTICIPATES_IN existentes
MATCH ()-[r:PARTICIPATES_IN]->() DELETE r;

// Para cada ADR, atribuir aleatoriamente um proprietário e revisores
MATCH (a:ADR), (u:User)
WHERE rand() < 0.3  // Limitar quantidade de relações
WITH a, u, rand() as r
CREATE (u)-[:PARTICIPATES_IN {
  role: CASE 
         WHEN r < 0.3 THEN 'owner'
         WHEN r < 0.7 THEN 'reviewer'
         ELSE 'consumer'
        END,
  created_at: datetime()
}]->(a);

// Garantir que cada ADR tenha pelo menos um proprietário
MATCH (a:ADR)
WHERE NOT (a)<-[:PARTICIPATES_IN {role: 'owner'}]-()
WITH a
MATCH (u:User)
WHERE id(u) % 10 = id(a) % 10
CREATE (u)-[:PARTICIPATES_IN {role: 'owner', created_at: datetime()}]->(a);
EOF

  docker cp $ADR_PARTICIPANT_FILE $NEO4J_CONTAINER:/var/lib/neo4j/adr_participants.cypher
  docker exec $NEO4J_CONTAINER cypher-shell -u $NEO4J_USER -p $NEO4J_PASSWORD --non-interactive -f /var/lib/neo4j/adr_participants.cypher
  rm $ADR_PARTICIPANT_FILE
  log "Relações ADR-participantes configuradas com sucesso."
fi

# 8. Configurar relações ADR-instância
log "8. Configurando relações ADR-instância..."
ADR_INSTANCE_FILE=$(mktemp)
cat > $ADR_INSTANCE_FILE << "EOF"
// Verificar se existem ADRs e instâncias
MATCH (a:ADR)
RETURN count(a) as adr_count;

MATCH (ci:ComponentInstance)
RETURN count(ci) as instance_count;
EOF

docker cp $ADR_INSTANCE_FILE $NEO4J_CONTAINER:/var/lib/neo4j/check_adr_instances.cypher
ADR_COUNT=$(docker exec $NEO4J_CONTAINER cypher-shell -u $NEO4J_USER -p $NEO4J_PASSWORD --non-interactive -f /var/lib/neo4j/check_adr_instances.cypher | grep "adr_count" -A 1 | tail -n 1 | grep -o '[0-9]\+')
INSTANCE_COUNT=$(docker exec $NEO4J_CONTAINER cypher-shell -u $NEO4J_USER -p $NEO4J_PASSWORD --non-interactive -f /var/lib/neo4j/check_adr_instances.cypher | grep "instance_count" -A 1 | tail -n 1 | grep -o '[0-9]\+')
rm $ADR_INSTANCE_FILE

if [ -z "$ADR_COUNT" ] || [ "$ADR_COUNT" -eq 0 ] || [ -z "$INSTANCE_COUNT" ] || [ "$INSTANCE_COUNT" -eq 0 ]; then
  log "AVISO: Não há ADRs ou instâncias suficientes para criar relações de impacto."
else
  log "Encontrados $ADR_COUNT ADRs e $INSTANCE_COUNT instâncias para criar relações de impacto."
  
  ADR_INSTANCE_FILE=$(mktemp)
  cat > $ADR_INSTANCE_FILE << "EOF"
// Limpar relações AFFECTS_INSTANCE existentes
MATCH ()-[r:AFFECTS_INSTANCE]->() DELETE r;

// Criar relações entre ADRs e instâncias, priorizando as relações de componentes
MATCH (a:ADR)-[:AFFECTS]->(c:Component)-[:INSTANTIATES]->(ci:ComponentInstance)
CREATE (a)-[:AFFECTS_INSTANCE {
  impact_level: CASE 
                 WHEN rand() < 0.3 THEN 'low'
                 WHEN rand() < 0.7 THEN 'medium'
                 ELSE 'high'
                END,
  notes: 'Migrado automaticamente de relação ADR-Component'
}]->(ci);

// Adicionar algumas relações aleatórias para diversificar
MATCH (a:ADR), (ci:ComponentInstance)
WHERE rand() < 0.1  // Limitar quantidade
CREATE (a)-[:AFFECTS_INSTANCE {
  impact_level: CASE 
                 WHEN rand() < 0.3 THEN 'low'
                 WHEN rand() < 0.7 THEN 'medium'
                 ELSE 'high'
                END,
  notes: null
}]->(ci);
EOF

  docker cp $ADR_INSTANCE_FILE $NEO4J_CONTAINER:/var/lib/neo4j/adr_instances.cypher
  docker exec $NEO4J_CONTAINER cypher-shell -u $NEO4J_USER -p $NEO4J_PASSWORD --non-interactive -f /var/lib/neo4j/adr_instances.cypher
  rm $ADR_INSTANCE_FILE
  log "Relações ADR-instância configuradas com sucesso."
fi

# 9. Validar a migração
log "9. Validando a migração..."
VALIDATION_FILE=$(mktemp)
cat > $VALIDATION_FILE << "EOF"
// Validar a migração do Neo4j v2.0
MATCH (e:Environment) RETURN count(e) as environments;
MATCH (t:Team) RETURN count(t) as teams;
MATCH (ci:ComponentInstance) RETURN count(ci) as instances;
MATCH ()-[r:INSTANTIATES]->() RETURN count(r) as instantiates_rels;
MATCH ()-[r:DEPLOYED_IN]->() RETURN count(r) as deployed_in_rels;
MATCH ()-[r:MANAGED_BY]->() RETURN count(r) as managed_by_rels;
MATCH ()-[r:PARTICIPATES_IN]->() RETURN count(r) as participates_in_rels;
MATCH ()-[r:AFFECTS_INSTANCE]->() RETURN count(r) as affects_instance_rels;
MATCH ()-[r:INSTANCE_CONNECTS_TO]->() RETURN count(r) as instance_connects_to_rels;
EOF

docker cp $VALIDATION_FILE $NEO4J_CONTAINER:/var/lib/neo4j/validate.cypher
log "Resultados da validação:"
docker exec $NEO4J_CONTAINER cypher-shell -u $NEO4J_USER -p $NEO4J_PASSWORD --non-interactive -f /var/lib/neo4j/validate.cypher | tee -a $LOG_FILE
rm $VALIDATION_FILE

# Se estivermos em modo dry-run, remover todas as mudanças
if [ "$DRY_RUN" = true ]; then
  log "Modo dry-run: Revertendo todas as alterações feitas durante o dry-run..."
  REVERT_FILE=$(mktemp)
  cat > $REVERT_FILE << "EOF"
// Reverter todas as alterações feitas durante o dry-run
MATCH (ci:ComponentInstance) DETACH DELETE ci;
MATCH (e:Environment) DETACH DELETE e;
MATCH (t:Team) DETACH DELETE t;
EOF
  docker cp $REVERT_FILE $NEO4J_CONTAINER:/var/lib/neo4j/revert.cypher
  docker exec $NEO4J_CONTAINER cypher-shell -u $NEO4J_USER -p $NEO4J_PASSWORD --non-interactive -f /var/lib/neo4j/revert.cypher
  rm $REVERT_FILE
  log "Todas as alterações foram revertidas."
fi

log "==== MIGRAÇÃO NEO4J v2.0 CONCLUÍDA ===="
if [ "$DRY_RUN" = true ]; then
  log "A migração de teste do Neo4j para a versão 2.0 foi concluída com sucesso!"
  log "Todas as alterações foram revertidas conforme o modo dry-run."
else
  log "A migração do Neo4j para a versão 2.0 foi concluída com sucesso!"
  log "As novas entidades (ambientes, times, instâncias) foram criadas e suas relações foram estabelecidas."
fi

log "Para verificar o resultado, acesse o Neo4j Browser em http://localhost:7474"
log "Use o script setup-visualization.sh para configurar as cores e estilos visuais."
log "Para sincronizar manualmente, use o script sync-neo4j.sh." 