// Importando módulos de resolvers
import { componentResolvers } from './componentResolvers';
import { userResolvers } from './userResolvers';
import { adrResolvers } from './adrResolvers';
import { glossaryResolvers } from './glossaryResolvers';
import { Builder } from '@pothos/core';
import { RelationType } from './relationship/relationshipResolvers';

// Função para registrar todos os resolvers
export function registerResolvers(builder: Builder) {
  // Registra os resolvers de componentes
  componentResolvers(builder);
  
  // Registra os resolvers de usuários
  userResolvers(builder);
  
  // Registra os resolvers de ADR
  adrResolvers(builder);
  
  // Registra os resolvers de glossário
  glossaryResolvers(builder);
  
  // Não precisamos chamar registerRelationshipResolvers() pois os resolvers já são definidos no arquivo
  // e exportados como RelationType
}

// Exportando RelationType para uso em outros módulos
export { RelationType }; 