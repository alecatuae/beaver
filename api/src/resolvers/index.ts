// Importando módulos de resolvers
import { environmentResolvers } from './environmentResolvers';
import { teamResolvers } from './teamResolvers';
import { componentResolvers } from './componentResolvers';
import { userResolvers } from './userResolvers';
import { adrResolvers } from './adrResolvers';
import { glossaryResolvers } from './glossaryResolvers';
import { categoryResolvers } from './categoryResolvers';
import { roadmapResolvers } from './roadmapResolvers';
import { Builder } from '@pothos/core';
import { RelationType } from './relationship/relationshipResolvers';

// Função para registrar todos os resolvers
export function registerResolvers(builder: Builder) {
  // Primeiro os recursos fundamentais
  // Registra os resolvers de ambientes
  environmentResolvers(builder);
  
  // Registra os resolvers de times
  teamResolvers(builder);
  
  // Registra os resolvers de componentes
  componentResolvers(builder);
  
  // Registra os resolvers de categorias
  categoryResolvers(builder);
  
  // Registra os resolvers de usuários
  userResolvers(builder);
  
  // Registra os resolvers de ADR
  adrResolvers(builder);
  
  // Registra os resolvers de glossário
  glossaryResolvers(builder);
  
  // Registra os resolvers de roadmap
  roadmapResolvers(builder);
  
  // Não precisamos chamar registerRelationshipResolvers() pois os resolvers já são definidos no arquivo
  // e exportados como RelationType
}

// Exportando RelationType para uso em outros módulos
export { RelationType }; 