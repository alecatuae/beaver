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

# Gera o cliente Prisma
RUN npx prisma generate

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
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma

# Configura as permissões
RUN chown -R beaver:beaver .
USER beaver

# Expõe a porta 4000
EXPOSE 4000

# Inicia a aplicação
CMD ["node", "dist/index.js"] 