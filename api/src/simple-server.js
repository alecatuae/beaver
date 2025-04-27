const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const express = require('express');
const http = require('http');
const cors = require('cors');
const { json } = require('body-parser');

// Definição do schema GraphQL
const typeDefs = `
  type Query {
    hello: String
    _placeholder: Boolean
  }
`;

// Resolvers
const resolvers = {
  Query: {
    hello: () => 'Olá, mundo!',
    _placeholder: () => true,
  },
};

async function startServer() {
  // Cria o servidor Express
  const app = express();
  const httpServer = http.createServer(app);

  // Cria o servidor Apollo
  const server = new ApolloServer({
    typeDefs,
    resolvers,
  });

  // Inicia o servidor Apollo
  await server.start();

  // Aplica o middleware Apollo ao Express
  app.use(
    '/graphql',
    cors(),
    json(),
    expressMiddleware(server),
  );

  // Rota de status
  app.get('/status', (req, res) => {
    res.json({ status: 'online' });
  });

  // Inicia o servidor HTTP
  const PORT = 4001;
  await new Promise(resolve => httpServer.listen({ port: PORT }, resolve));
  
  console.log(`🚀 Servidor pronto em http://localhost:${PORT}/graphql`);
}

startServer().catch(err => {
  console.error('Erro ao iniciar o servidor:', err);
  process.exit(1);
}); 