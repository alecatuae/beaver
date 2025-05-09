import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import express from 'express';
import http from 'http';
import { json } from 'body-parser';
import { schema } from './schema';
import { createContext, initializeDbConnections, closeDbConnections } from './context';
import registerResolvers from './resolvers';

// Registrar todos os resolvers
registerResolvers();

// Iniciar as conexões dos bancos de dados
initializeDbConnections().then(async () => {
  // Configurar Express
  const app = express();
  const httpServer = http.createServer(app);

  // Criar servidor Apollo
  const server = new ApolloServer({
    schema,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
  });

  // Iniciar o servidor Apollo
  await server.start();
  console.log('🚀 Servidor Apollo iniciado');

  // Configurar middleware Express
  app.use(
    '/graphql',
    json(),
    expressMiddleware(server, {
      context: async () => createContext(),
    }),
  );

  // Iniciar servidor HTTP
  const PORT = process.env.PORT || 4000;
  httpServer.listen(PORT, () => {
    console.log(`🔥 Servidor rodando em http://localhost:${PORT}/graphql`);
  });

  // Gerenciar desligamento correto
  const handleShutdown = async () => {
    console.log('📡 Recebido sinal de interrupção, encerrando servidor...');
    await server.stop();
    await closeDbConnections();
    console.log('👋 Servidor encerrado com sucesso');
    process.exit(0);
  };

  // Tratamento de sinais para desligamento gracioso
  process.on('SIGINT', handleShutdown);
  process.on('SIGTERM', handleShutdown);
}).catch(error => {
  console.error('❌ Erro ao inicializar as conexões dos bancos de dados:', error);
  process.exit(1);
}); 