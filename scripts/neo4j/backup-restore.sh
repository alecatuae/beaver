#!/bin/bash

# Script para realizar backup e restauração do Neo4j
# Uso: ./backup-restore.sh backup|restore [arquivo_de_backup]

# Configurações
NEO4J_CONTAINER="beaver-neo4j-1"
BACKUP_DIR="./backups/neo4j"
DATE_FORMAT=$(date +"%Y%m%d-%H%M%S")
DEFAULT_BACKUP_FILE="neo4j-backup-${DATE_FORMAT}.dump"

# Verificar se o container Neo4j está rodando
check_container() {
  if ! docker ps | grep -q $NEO4J_CONTAINER; then
    echo "Erro: Container $NEO4J_CONTAINER não está rodando."
    echo "Inicie o container com: docker-compose up -d neo4j"
    exit 1
  fi
}

# Função para realizar backup
do_backup() {
  local backup_file="$1"
  
  # Criar diretório de backup se não existir
  mkdir -p "$BACKUP_DIR"
  
  echo "Iniciando backup do Neo4j..."
  echo "Backup será salvo em: $BACKUP_DIR/$backup_file"
  
  # Executar backup usando cypher-shell para exportar todos os nós e relacionamentos
  docker exec -i $NEO4J_CONTAINER bash -c "
    cypher-shell -u neo4j -p beaver12345 'CALL apoc.export.graphml.all(\"export.graphml\", {})' &&
    cat /var/lib/neo4j/export.graphml
  " > "$BACKUP_DIR/$backup_file"
  
  # Verificar se o backup foi bem-sucedido
  if [ $? -eq 0 ]; then
    echo "Backup concluído com sucesso!"
    echo "Arquivo: $BACKUP_DIR/$backup_file"
    echo "Tamanho: $(du -h "$BACKUP_DIR/$backup_file" | cut -f1)"
  else
    echo "Erro ao realizar backup!"
    exit 1
  fi
}

# Função para restaurar backup
do_restore() {
  local backup_file="$1"
  
  if [ ! -f "$backup_file" ]; then
    echo "Erro: Arquivo de backup '$backup_file' não encontrado!"
    exit 1
  fi
  
  echo "Iniciando restauração do Neo4j a partir de: $backup_file"
  
  # Limpar banco de dados atual
  echo "Limpando dados existentes..."
  docker exec -i $NEO4J_CONTAINER cypher-shell -u neo4j -p beaver12345 "MATCH (n) DETACH DELETE n;"
  
  # Copiar arquivo de backup para o container
  docker cp "$backup_file" $NEO4J_CONTAINER:/var/lib/neo4j/import/restore.graphml
  
  # Executar restauração
  echo "Restaurando dados..."
  docker exec -i $NEO4J_CONTAINER cypher-shell -u neo4j -p beaver12345 "CALL apoc.import.graphml('/import/restore.graphml', {});"
  
  # Verificar se a restauração foi bem-sucedida
  if [ $? -eq 0 ]; then
    echo "Restauração concluída com sucesso!"
  else
    echo "Erro ao restaurar dados!"
    exit 1
  fi
  
  # Verificar contagens após restauração
  echo "Contagens após restauração:"
  docker exec -i $NEO4J_CONTAINER cypher-shell -u neo4j -p beaver12345 "
    MATCH (e:Environment) RETURN count(e) as environments;
    MATCH (t:Team) RETURN count(t) as teams;
    MATCH (ci:ComponentInstance) RETURN count(ci) as instances;
    MATCH (c:Component) RETURN count(c) as components;
  "
}

# Menu principal
case "$1" in
  backup)
    check_container
    backup_file="${2:-$DEFAULT_BACKUP_FILE}"
    do_backup "$backup_file"
    ;;
  restore)
    check_container
    if [ -z "$2" ]; then
      echo "Erro: Especifique o arquivo de backup para restauração."
      echo "Uso: $0 restore caminho/para/arquivo-backup.dump"
      exit 1
    fi
    do_restore "$2"
    ;;
  *)
    echo "Uso: $0 {backup|restore} [arquivo_de_backup]"
    echo "  backup  - Realizar backup do Neo4j"
    echo "  restore - Restaurar Neo4j a partir de backup (requer caminho do arquivo)"
    exit 1
    ;;
esac

exit 0 