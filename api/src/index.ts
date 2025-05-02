import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import express from 'express';
import http from 'http';
import { json } from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import { schema } from './schema';
import { createContext } from './context';
import { logger } from './utils/logger';
import statusRoutes from './routes/status';
// Importação dos resolvers
import './resolvers/componentResolvers';
import './resolvers/relationship/relationshipResolvers';
import './resolvers/categoryResolvers';

// Carrega as variáveis de ambiente
dotenv.config();

const app = express();
const httpServer = http.createServer(app);

// Cria o servidor Apollo GraphQL
const server = new ApolloServer({
  schema,
  introspection: process.env.NODE_ENV !== 'production',
});

// Porta do servidor
const PORT = process.env.PORT || 4000;

// Inicializa o servidor Apollo
async function startServer() {
  await server.start();

  // Middlewares
  app.use(
    '/graphql',
    cors<cors.CorsRequest>(),
    json(),
    expressMiddleware(server, {
      context: createContext,
    }),
  );

  // Rotas da API REST
  app.use('/status', cors<cors.CorsRequest>(), statusRoutes);

  // Inicializa o servidor HTTP
  await new Promise<void>((resolve) => httpServer.listen({ port: PORT }, resolve));
  logger.info(`🚀 Servidor pronto em http://localhost:${PORT}/graphql`);
  logger.info(`📊 Status da API disponível em http://localhost:${PORT}/status`);
}

startServer().catch((err) => {
  logger.error(`Erro ao iniciar o servidor: ${err.message}`);
  process.exit(1);
});

// Handler para encerramento gracioso
process.on('SIGINT', () => {
  logger.info('Encerrando servidor...');
  httpServer.close(() => {
    logger.info('Servidor encerrado.');
    process.exit(0);
  });
}); 