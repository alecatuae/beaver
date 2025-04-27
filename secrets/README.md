# Pasta de Segredos (Secrets)

Esta pasta é destinada para armazenar chaves privadas e outros arquivos sensíveis usados pela aplicação.

## Importante

**Nunca commite arquivos sensíveis para o repositório!** O arquivo `.gitignore` desta pasta está configurado para ignorar todos os arquivos exceto este README e o próprio `.gitignore`.

## Arquivos Esperados

Os seguintes arquivos são esperados nesta pasta:

- `jwt-private.pem` - Chave privada para assinatura de tokens JWT
- `jwt-public.pem` - Chave pública para verificação de tokens JWT

## Configuração

Para gerar as chaves necessárias, use o script fornecido:

```bash
./scripts/gen-jwt.sh
```

Este script irá gerar as chaves RSA necessárias para o funcionamento do sistema de autenticação. 