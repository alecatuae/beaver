#!/bin/bash

echo "Instalando dependências..."
npm install

echo "Gerando cliente Prisma..."
npx prisma generate

echo "Configuração concluída. Para executar o servidor em modo de desenvolvimento, use:"
echo "npm run dev"

echo "Para criar um build de produção, use:"
echo "npm run build"

echo "Para executar em modo de produção, use:"
echo "npm start"

echo "Para executar com Docker Compose:"
echo "docker-compose up -d" 