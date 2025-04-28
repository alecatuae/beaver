// Aumenta o timeout padrão para os testes que interagem com o banco de dados
jest.setTimeout(10000);

// Define o NODE_ENV para testes
process.env.NODE_ENV = 'test';

// Log de início de testes
beforeAll(() => {
  console.log('Iniciando testes de integração');
});

// Log de fim de testes
afterAll(() => {
  console.log('Testes de integração concluídos');
}); 