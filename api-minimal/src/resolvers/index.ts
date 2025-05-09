// Arquivo que importa e registra todos os resolvers
// Permite uma importação organizada dos resolvers na inicialização do schema

// Importar resolvers por tipo
import './componentResolver';

// Futuramente, pode importar módulos adicionais
// import './userResolver';
// import './teamResolver';
// etc...

export default function registerResolvers() {
  // Esta função é chamada pela inicialização do schema
  // para garantir que todos os resolvers estejam registrados
  console.log('🧩 Resolvers registrados com sucesso');
} 