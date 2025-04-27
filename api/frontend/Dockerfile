FROM node:22-alpine AS base

# Instala as dependências necessárias
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app

# Camada de dependências
FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm ci

# Camada de build
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Compila a aplicação
RUN npm run build

# Camada de produção
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

# Cria um usuário não-root para execução da aplicação
RUN addgroup --system --gid 10001 beaver && \
    adduser --system --uid 10001 beaver

# Copia os arquivos necessários
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Configura as permissões
RUN chown -R beaver:beaver .
USER beaver

# Expõe a porta 3000
EXPOSE 3000

# Define variável de ambiente para o servidor
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Inicia a aplicação
CMD ["node", "server.js"] 