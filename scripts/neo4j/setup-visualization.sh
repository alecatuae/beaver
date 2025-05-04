#!/bin/bash

# Script para configurar a visualização do Neo4j
# Adiciona cores personalizadas aos tipos de nós para melhor visualização no dashboard

# Configurações
NEO4J_CONTAINER="beaver-neo4j-1"
NEO4J_USER="neo4j"
NEO4J_PASSWORD="beaver12345"

# Verificar se o container Neo4j está rodando
if ! docker ps | grep -q $NEO4J_CONTAINER; then
  echo "Erro: Container $NEO4J_CONTAINER não está rodando."
  echo "Inicie o container com: docker-compose up -d neo4j"
  exit 1
fi

echo "==== BEAVER NEO4J VISUALIZATION SETUP ===="
echo "Configurando estilo visual para o dashboard do Neo4j..."

# Criar script de visualização
STYLE_FILE=$(mktemp)
cat > $STYLE_FILE << "EOF"
// Configuração de visualização para o Neo4j Browser
// Adiciona cores e estilos para melhor diferenciação de nós e relacionamentos

// Remover configurações anteriores
:style reset

// Configurar estilos para nós
:style node:Component {color: #4CAF50, border-color: #388E3C, text-color-internal: #FFFFFF, diameter: 60}
:style node:ComponentInstance {color: #8BC34A, border-color: #689F38, text-color-internal: #FFFFFF, diameter: 50}
:style node:Environment {color: #2196F3, border-color: #1976D2, text-color-internal: #FFFFFF, diameter: 65}
:style node:Team {color: #9C27B0, border-color: #7B1FA2, text-color-internal: #FFFFFF, diameter: 65}
:style node:ADR {color: #F44336, border-color: #D32F2F, text-color-internal: #FFFFFF, diameter: 55}
:style node:User {color: #FF9800, border-color: #F57C00, text-color-internal: #FFFFFF, diameter: 50}
:style node:Platform {color: #607D8B, border-color: #455A64, text-color-internal: #FFFFFF, diameter: 55}
:style node:DataStore {color: #00BCD4, border-color: #0097A7, text-color-internal: #FFFFFF, diameter: 55}
:style node:Data {color: #FFEB3B, border-color: #FBC02D, text-color-internal: #212121, diameter: 45}
:style node:SubComponent {color: #795548, border-color: #5D4037, text-color-internal: #FFFFFF, diameter: 45}
:style node:GlossaryTerm {color: #E91E63, border-color: #C2185B, text-color-internal: #FFFFFF, diameter: 50}

// Configurar estilos para relacionamentos
:style relationship:RELATES_TO {color: #90CAF9, shaft-width: 2, arrow-width: 5}
:style relationship:INSTANTIATES {color: #AED581, shaft-width: 3, arrow-width: 6}
:style relationship:DEPLOYED_IN {color: #29B6F6, shaft-width: 3, arrow-width: 6}
:style relationship:MANAGED_BY {color: #CE93D8, shaft-width: 2, arrow-width: 5}
:style relationship:PARTICIPATES_IN {color: #FF8A65, shaft-width: 2, arrow-width: 5}
:style relationship:AFFECTS_INSTANCE {color: #EF5350, shaft-width: 3, arrow-width: 6}
:style relationship:CONNECTS_TO {color: #BDBDBD, shaft-width: 2, arrow-width: 5}
:style relationship:DEPENDS_ON {color: #FFA726, shaft-width: 2, arrow-width: 5}
:style relationship:CONTAINS {color: #78909C, shaft-width: 2, arrow-width: 5}
:style relationship:PROCESSES {color: #78909C, shaft-width: 2, arrow-width: 5}
:style relationship:REFERENCES {color: #78909C, shaft-width: 2, arrow-width: 5}

// Salvar como padrão para este banco de dados
:style save
EOF

echo "Copiando script para o container Neo4j..."
docker cp $STYLE_FILE $NEO4J_CONTAINER:/var/lib/neo4j/import/set_style.cypher

# Acessar o browser e executar script de estilo
echo "Aplicando configurações visuais..."
docker exec $NEO4J_CONTAINER cypher-shell -u $NEO4J_USER -p $NEO4J_PASSWORD "CALL db.schema.nodeTypeProperties()"

echo "Configuração visual concluída!"
echo "Para visualizar o grafo com os novos estilos, acesse http://localhost:7474"
echo "Após fazer login, copie e cole o conteúdo do arquivo set_style.cypher"
echo "Localizado em: /import/set_style.cypher no container Neo4j"

echo "==== CONFIGURAÇÃO VISUAL CONCLUÍDA ===="

# Limpar arquivo temporário
rm -f $STYLE_FILE 