#!/bin/bash

# Script para reiniciar a aplicação Beaver

echo "🔄 Reiniciando a aplicação Beaver..."

# Parar todos os contêineres do perfil base
echo "⏹️ Parando contêineres..."
docker-compose --profile base down

# Limpar volumes temporários (opcional)
echo "🧹 Limpando volumes temporários..."
rm -rf ./node_modules_frontend/.next

# Iniciar os contêineres novamente
echo "▶️ Iniciando contêineres..."
docker-compose --profile base up -d

# Verificar status
echo "🔍 Verificando status dos serviços..."
sleep 5
docker-compose --profile base ps

echo "✅ Aplicação reiniciada! Frontend em http://localhost:3002 e API em http://localhost:4000/graphql" 