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
import prisma from './prisma';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';

// Carrega as variáveis de ambiente
dotenv.config();

const app = express();
const httpServer = http.createServer(app);

// Cria o servidor Apollo GraphQL
const apolloServer = new ApolloServer({
  schema,
  plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
});

// Porta do servidor
const PORT = process.env.PORT || 4000;

// Configuração do contexto para Apollo Server
const context = async ({ req }: any) => {
  try {
    // Verificar se o banco de dados está acessível
    await prisma.$queryRaw`SELECT 1`;
    logger.debug('Conexão com o banco de dados MariaDB OK');
  } catch (error: any) {
    logger.error('Erro ao verificar a conexão com o banco de dados MariaDB:', error);
    logger.error(`Detalhes do erro: ${error.message}`);
  }

  return {
    prisma,
    // ... outros contextos conforme necessário
  };
};

// Inicializa o servidor Apollo
async function startServer() {
  await apolloServer.start();

  // Middlewares
  app.use(
    '/graphql',
    cors<cors.CorsRequest>(),
    json(),
    expressMiddleware(apolloServer, {
      context,
    }),
  );

  // Rotas da API REST
  app.use('/status', cors<cors.CorsRequest>(), statusRoutes);

  // Adicionar middleware para registro de requisições
  app.use((req, res, next) => {
    logger.info(`${req.method} ${req.url}`);
    next();
  });
  
  // Adicionar middleware para tratamento de erros
  app.use((err: any, req: any, res: any, next: any) => {
    logger.error('Erro no middleware:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  });

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