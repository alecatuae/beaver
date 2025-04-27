import builder from '../../schema';
import { prisma } from '../../prisma';
import { neo4jClient } from '../../db/neo4j';
import { logger } from '../../utils/logger';

// Definição do tipo de entrada para relacionamento
builder.inputType('RelationInput', {
  fields: (t) => ({
    sourceId: t.int({ required: true }),
    targetId: t.int({ required: true }),
    type: t.string({ required: true }),
    properties: t.field({
      type: 'JSON',
      required: false,
    }),
  }),
});

// Definição do tipo Relation para GraphQL
const RelationType = builder.objectType('Relation', {
  fields: (t) => ({
    id: t.exposeInt('id'),
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
      id: t.arg.int({ required: true }),
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
      input: t.arg({ type: 'RelationInput', required: true }),
    },
    resolve: async (_, { input }) => {
      try {
        // Verificar se os componentes existem
        const sourceComponent = await prisma.component.findUnique({
          where: { id: input.sourceId },
        });
        
        const targetComponent = await prisma.component.findUnique({
          where: { id: input.targetId },
        });
        
        if (!sourceComponent || !targetComponent) {
          throw new Error('Componente de origem ou destino não encontrado');
        }
        
        // Criar relacionamento no Neo4j
        const result = await neo4jClient.createRelation(
          input.sourceId,
          input.targetId,
          input.type,
          input.properties || {}
        );
        
        logger.info(`Relacionamento criado: ${sourceComponent.name} -> ${targetComponent.name}`);
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
      id: t.arg.int({ required: true }),
      input: t.arg({ type: 'RelationInput', required: true }),
    },
    resolve: async (_, { id, input }) => {
      try {
        // Verificar se o relacionamento existe
        const existingRelation = await neo4jClient.getRelationById(id);
        if (!existingRelation) {
          throw new Error(`Relacionamento com ID ${id} não encontrado`);
        }
        
        // Verificar se os componentes existem
        const sourceComponent = await prisma.component.findUnique({
          where: { id: input.sourceId },
        });
        
        const targetComponent = await prisma.component.findUnique({
          where: { id: input.targetId },
        });
        
        if (!sourceComponent || !targetComponent) {
          throw new Error('Componente de origem ou destino não encontrado');
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
      id: t.arg.int({ required: true }),
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

export default RelationType;