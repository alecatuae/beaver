// Importando módulos de resolvers
import { componentResolvers } from './componentResolvers';
import { userResolvers } from './userResolvers';
import { adrResolvers } from './adrResolvers';
import { glossaryResolvers } from './glossaryResolvers';
import SchemaBuilder from '@pothos/core';

// Importamos diretamente da pasta relationship
import { registerRelationshipResolvers, RelationType } from './relationship/relationshipResolvers';

// Função para registrar todos os resolvers
export function registerResolvers(builder: SchemaBuilder<any>) {
  // Registra os resolvers de componentes
  componentResolvers(builder);
  
  // Registra os resolvers de usuários
  userResolvers(builder);
  
  // Registra os resolvers de ADR
  adrResolvers(builder);
  
  // Registra os resolvers de glossário
  glossaryResolvers(builder);
  
  // Registra os resolvers de relacionamentos
  try {
    registerRelationshipResolvers();
    console.log("Resolvers de relacionamentos registrados com sucesso");
  } catch (error) {
    console.error('Erro ao registrar resolvers de relacionamentos:', error);
  }
}

// Exportando RelationType para uso em outros módulos
export { RelationType }; 