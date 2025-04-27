#!/bin/bash

# Script para gerar par de chaves JWT para autenticação
# Baseado na documentação da Arquitetura v1.2
# Usado pelo Beaver para autenticação JWT RS256

echo "Gerando chaves JWT para autenticação..."

# Cria diretório de secrets se não existir
mkdir -p secrets

# Gera chave privada RSA
openssl genrsa -out secrets/jwt-private.pem 2048

# Gera chave pública correspondente
openssl rsa -in secrets/jwt-private.pem -pubout -out secrets/jwt-public.pem

# Configura permissões de segurança
chmod 600 secrets/jwt-private.pem
chmod 644 secrets/jwt-public.pem

echo "Chaves JWT geradas com sucesso!"
echo "  - Chave privada: secrets/jwt-private.pem"
echo "  - Chave pública: secrets/jwt-public.pem" 