import { builder } from '../../schema';
import { prisma } from '../../prisma';
import { neo4jClient } from '../../db/neo4j';
import { logger } from '../../utils/logger';

// Definição do tipo Relation para GraphQL
export const RelationType = builder.objectType('Relation', {
  fields: (t) => ({
    id: t.exposeString('id', {
      resolve: (relation) => relation.id.toString(),
    }),
    sourceId: t.exposeInt('sourceId'),
    targetId: t.exposeInt('targetId'),
    type: t.exposeString('type'),
    properties: t.field({
      type: 'JSON',
      nullable: true,
      resolve: (relation) => relation.properties,
    }),
    source: t.field({
      type: 'Component',
      nullable: true,
      resolve: async (relation) => {
        return prisma.component.findUnique({
          where: { id: relation.sourceId },
        });
      },
    }),
    target: t.field({
      type: 'Component',
      nullable: true,
      resolve: async (relation) => {
        return prisma.component.findUnique({
          where: { id: relation.targetId },
        });
      },
    }),
    createdAt: t.string({
      resolve: (relation) => relation.createdAt.toISOString(),
    }),
    updatedAt: t.string({
      resolve: (relation) => relation.updatedAt.toISOString(),
    }),
  }),
});

// Query para obter todos os relacionamentos
builder.queryField('relations', (t) =>
  t.field({
    type: [RelationType],
    resolve: async () => {
      try {
        const result = await neo4jClient.getRelations();
        return result;
      } catch (error) {
        logger.error('Erro ao buscar relações:', error);
        return [];
      }
    },
  })
);

// Query para obter um relacionamento pelo ID
builder.queryField('relation', (t) =>
  t.field({
    type: RelationType,
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: async (_, { id }) => {
      try {
        const result = await neo4jClient.getRelationById(id);
        if (!result) {
          throw new Error(`Relacionamento com ID ${id} não encontrado`);
        }
        return result;
      } catch (error) {
        logger.error(`Erro ao buscar relação com ID ${id}:`, error);
        throw error;
      }
    },
  })
);

// Mutation para criar um novo relacionamento
builder.mutationField('createRelation', (t) =>
  t.field({
    type: RelationType,
    args: {
      input: t.arg({
        type: 'RelationInput',
        required: true,
      }),
    },
    resolve: async (_, { input }) => {
      try {
        // Verificar se os componentes existem no Neo4j
        const existInNeo4j = await neo4jClient.run(`
          MATCH (source:Component {id: $sourceId})
          MATCH (target:Component {id: $targetId})
          RETURN count(source) > 0 AND count(target) > 0 as exist
        `, { sourceId: input.sourceId, targetId: input.targetId });

        if (!existInNeo4j.records[0].get('exist')) {
          throw new Error('Componente não encontrado no Neo4j');
        }
        
        // Criar relacionamento no Neo4j
        const result = await neo4jClient.createRelation(
          input.sourceId,
          input.targetId,
          input.type,
          input.properties || {}
        );
        
        logger.info(`Relacionamento criado: ${input.sourceId} -> ${input.targetId}`);
        return result;
      } catch (error) {
        logger.error('Erro ao criar relacionamento:', error);
        throw error;
      }
    },
  })
);

// Mutation para atualizar um relacionamento existente
builder.mutationField('updateRelation', (t) =>
  t.field({
    type: RelationType,
    args: {
      id: t.arg.string({ required: true }),
      input: t.arg({
        type: 'RelationInput',
        required: true,
      }),
    },
    resolve: async (_, { id, input }) => {
      try {
        // Verificar se o relacionamento existe
        const existingRelation = await neo4jClient.getRelationById(id);
        if (!existingRelation) {
          throw new Error(`Relacionamento com ID ${id} não encontrado`);
        }
        
        // Verificar se os componentes existem no Neo4j
        const existInNeo4j = await neo4jClient.run(`
          MATCH (source:Component {id: $sourceId})
          MATCH (target:Component {id: $targetId})
          RETURN count(source) > 0 AND count(target) > 0 as exist
        `, { sourceId: input.sourceId, targetId: input.targetId });

        if (!existInNeo4j.records[0].get('exist')) {
          throw new Error('Componente não encontrado no Neo4j');
        }
        
        // Atualizar relacionamento no Neo4j
        const result = await neo4jClient.updateRelation(
          id,
          input.sourceId,
          input.targetId,
          input.type,
          input.properties || {}
        );
        
        logger.info(`Relacionamento atualizado: ${id}`);
        return result;
      } catch (error) {
        logger.error(`Erro ao atualizar relacionamento ${id}:`, error);
        throw error;
      }
    },
  })
);

// Mutation para excluir um relacionamento
builder.mutationField('deleteRelation', (t) =>
  t.field({
    type: 'Boolean',
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: async (_, { id }) => {
      try {
        // Verificar se o relacionamento existe
        const existingRelation = await neo4jClient.getRelationById(id);
        if (!existingRelation) {
          throw new Error(`Relacionamento com ID ${id} não encontrado`);
        }
        
        // Excluir relacionamento do Neo4j
        await neo4jClient.deleteRelation(id);
        
        logger.info(`Relacionamento excluído: ${id}`);
        return true;
      } catch (error) {
        logger.error(`Erro ao excluir relacionamento ${id}:`, error);
        throw error;
      }
    },
  })
);