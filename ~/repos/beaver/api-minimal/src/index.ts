import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import express from 'express';
import http from 'http';
import cors from 'cors';
import { json } from 'body-parser';
import dotenv from 'dotenv';
import { schema } from './schema';
import { createContext, initializeDbConnections, closeDbConnections } from './context';

// Carregar variáveis de ambiente
dotenv.config();

// Definição de porta
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 4001;

// Variável global para o servidor HTTP
let httpServer: http.Server;

// Função para iniciar o servidor
async function startServer() {
  try {
    // Inicializar conexões com bancos de dados
    await initializeDbConnections();
    
    // Criar aplicação Express
    const app = express();
    httpServer = http.createServer(app);
    
    // Criar servidor Apollo
    const server = new ApolloServer({
      schema,
      plugins: [
        ApolloServerPluginDrainHttpServer({ httpServer }),
      ],
      introspection: true,
    });
    
    // Iniciar servidor Apollo
    await server.start();
    
    // Middleware de log para requisições
    app.use((req, res, next) => {
      console.log(`📝 ${req.method} ${req.url} - ${new Date().toISOString()}`);
      next();
    });
    
    // Rota GraphQL
    app.use(
      '/graphql',
      cors<cors.CorsRequest>(),
      json(),
      expressMiddleware(server, {
        context: createContext,
      }),
    );
    
    // Rota de verificação de saúde
    app.get('/health', (req, res) => {
      res.status(200).send({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '2.0.0-minimal',
      });
    });
    
    // Iniciar servidor
    await new Promise<void>((resolve) => httpServer.listen({ port: PORT }, resolve));
    
    console.log(`
🚀 Servidor rodando em http://localhost:${PORT}/graphql
📊 Verificação de saúde em http://localhost:${PORT}/health
    `);
  } catch (error) {
    console.error('❌ Erro ao iniciar o servidor:', error);
    process.exit(1);
  }
}

// Tratamento de erros não capturados
process.on('unhandledRejection', (reason) => {
  console.error('❌ Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Iniciar servidor
startServer().catch((error) => {
  console.error('❌ Erro fatal ao iniciar o servidor:', error);
  process.exit(1);
});

// Handler para encerramento gracioso
process.on('SIGINT', async () => {
  console.log('🛑 Encerrando servidor...');
  await closeDbConnections();
  if (httpServer) {
    httpServer.close(() => {
      console.log('✅ Servidor encerrado.');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
}); 