# Development Guide

## Introduction
This guide provides detailed instructions on how to develop and maintain the Beaver application. It is based on the architecture and standards outlined in the `Architecture_v1.2_en_us.md` document.

## Prerequisites
- Familiarity with React, Next.js, and Node.js.
- Understanding of GraphQL and Neo4j.
- Basic knowledge of Docker and containerization.

## Development Environment Setup
1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd beaver
   ```

2. **Install Dependencies**
   Ensure you have Node.js 20+ (frontend) and Node.js 22 LTS (API) and Docker installed. Then run:
   ```bash
   # Para o frontend
   npm install
   
   # Para a API
   cd api && npm install && cd ..
   
   # Iniciar os contêineres
   docker-compose --profile base up -d
   ```

3. **Environment Configuration**
   Copy the example environment file and generate JWT keys:
   ```bash
   cp .env.example .env
   ./scripts/gen-jwt.sh
   ```

## Development Workflow
1. **Frontend Development**
   - Next.js 14.1.x para server-side rendering e React 18.2.x para componentes de UI.
   - TailwindCSS 3.4.x para estilização.
   - Apollo Client 3.13.x para conexão GraphQL.
   - Componentes Radix UI para elementos de interface.

2. **API Development**
   - Apollo Server 4.12.x e Pothos GraphQL para construção da API.
   - Prisma 5.8.x para interações com o MariaDB.
   - Neo4j-driver 5.15.x para interações com o banco de dados de grafos.
   - Express 4.21.x como servidor HTTP.
   - JWT para autenticação.

3. **Best Practices**
   - **Operações de Exclusão**:
     - **Sempre** implementar um diálogo de confirmação para qualquer operação de exclusão
     - Fornecer mensagem clara sobre a natureza permanente da ação
     - Oferecer opção de cancelamento facilmente acessível
     - Manter um padrão consistente para todas as operações de exclusão em toda a aplicação
     - Implementar exclusão como uma operação assíncrona com feedback visual
     - Atualizar listagens automaticamente após a conclusão da operação

4. **Testing**
   - Jest 29.7.x e Supertest 6.3.x para testes unitários e de integração.
   - Cypress/Playwright para testes end-to-end.

5. **Code Quality and Standards**
   - ESLint 9.x e Biome 1.6.x para qualidade de código.
   - TypeScript 5.x para tipagem estática.
   - Commitizen para mensagens de commit e semantic-release para versionamento.

6. **Observability and Monitoring**
   - Optional: Use Prometheus, Grafana, Loki, and Tempo for monitoring and observability.

## Deployment
- Docker Compose para orquestração de contêineres (perfis "base" e "observability").
- Utilize o script `scripts/update-app.sh` para facilitar a atualização e reinicialização dos contêineres.

## Update and Maintenance
To update or restart containers, use the `update-app.sh` script:

```bash
# Update both frontend and backend
./scripts/update-app.sh

# Update only backend with rebuild
./scripts/update-app.sh -b --build

# Just restart frontend
./scripts/update-app.sh -f --restart

# See all options
./scripts/update-app.sh --help
```

## Conclusion
This guide provides a comprehensive overview of the development process for the Beaver application. For more detailed information, refer to the `Architecture_v1.2_en_us.md` document. 