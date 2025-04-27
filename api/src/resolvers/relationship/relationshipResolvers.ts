import { builder } from '../../schema';
import { prisma } from '../../prisma';
import { neo4jClient } from '../../context';
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
          logger.info(`Componentes não encontrados no Neo4j. Verificando quais componentes estão faltando...`);
          
          // Tentar encontrar qual componente está faltando
          const sourceExistsResult = await neo4jClient.run(`
            MATCH (source:Component {id: $sourceId})
            RETURN count(source) > 0 as exist
          `, { sourceId: input.sourceId });
          
          const targetExistsResult = await neo4jClient.run(`
            MATCH (target:Component {id: $targetId})
            RETURN count(target) > 0 as exist
          `, { targetId: input.targetId });
          
          const sourceExists = sourceExistsResult.records[0].get('exist');
          const targetExists = targetExistsResult.records[0].get('exist');
          
          // Buscar os componentes no MariaDB se necessário
          if (!sourceExists || !targetExists) {
            // Buscar dados do componente de origem no MariaDB
            logger.info(`Buscando dados dos componentes no MariaDB`);
            
            // Usar SQL direto para evitar problemas com enums
            const componentsData = await prisma.$queryRaw`
              SELECT id, name, description 
              FROM Component 
              WHERE id IN (${input.sourceId}, ${input.targetId})
            `;
            
            // Converter para um objeto mais fácil de usar
            const componentsMap = new Map();
            for (const comp of componentsData as any[]) {
              componentsMap.set(comp.id, {
                name: comp.name,
                description: comp.description || ''
              });
            }
            
            // Verificar se encontrou os componentes
            if (!componentsMap.has(input.sourceId)) {
              throw new Error(`Componente de origem com ID ${input.sourceId} não encontrado no MariaDB`);
            }
            
            if (!componentsMap.has(input.targetId)) {
              throw new Error(`Componente de destino com ID ${input.targetId} não encontrado no MariaDB`);
            }
            
            // Sincronizar componentes com Neo4j
            if (!sourceExists) {
              const sourceComponent = componentsMap.get(input.sourceId);
              logger.info(`Sincronizando componente de origem (ID: ${input.sourceId}) com Neo4j`);
              await neo4jClient.run(`
                MERGE (c:Component {id: $id})
                ON CREATE SET 
                  c.name = $name,
                  c.description = $description,
                  c.valid_from = datetime(),
                  c.valid_to = datetime('9999-12-31T23:59:59Z')
                RETURN c
              `, {
                id: input.sourceId,
                name: sourceComponent.name,
                description: sourceComponent.description
              });
            }
            
            if (!targetExists) {
              const targetComponent = componentsMap.get(input.targetId);
              logger.info(`Sincronizando componente de destino (ID: ${input.targetId}) com Neo4j`);
              await neo4jClient.run(`
                MERGE (c:Component {id: $id})
                ON CREATE SET 
                  c.name = $name,
                  c.description = $description,
                  c.valid_from = datetime(),
                  c.valid_to = datetime('9999-12-31T23:59:59Z')
                RETURN c
              `, {
                id: input.targetId,
                name: targetComponent.name,
                description: targetComponent.description
              });
            }
            
            logger.info(`Componentes sincronizados com Neo4j`);
          }
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
          logger.info(`Componentes não encontrados no Neo4j. Verificando quais componentes estão faltando...`);
          
          // Tentar encontrar qual componente está faltando
          const sourceExistsResult = await neo4jClient.run(`
            MATCH (source:Component {id: $sourceId})
            RETURN count(source) > 0 as exist
          `, { sourceId: input.sourceId });
          
          const targetExistsResult = await neo4jClient.run(`
            MATCH (target:Component {id: $targetId})
            RETURN count(target) > 0 as exist
          `, { targetId: input.targetId });
          
          const sourceExists = sourceExistsResult.records[0].get('exist');
          const targetExists = targetExistsResult.records[0].get('exist');
          
          // Buscar os componentes no MariaDB se necessário
          if (!sourceExists || !targetExists) {
            // Buscar dados do componente de origem no MariaDB
            logger.info(`Buscando dados dos componentes no MariaDB`);
            
            // Usar SQL direto para evitar problemas com enums
            const componentsData = await prisma.$queryRaw`
              SELECT id, name, description 
              FROM Component 
              WHERE id IN (${input.sourceId}, ${input.targetId})
            `;
            
            // Converter para um objeto mais fácil de usar
            const componentsMap = new Map();
            for (const comp of componentsData as any[]) {
              componentsMap.set(comp.id, {
                name: comp.name,
                description: comp.description || ''
              });
            }
            
            // Verificar se encontrou os componentes
            if (!componentsMap.has(input.sourceId)) {
              throw new Error(`Componente de origem com ID ${input.sourceId} não encontrado no MariaDB`);
            }
            
            if (!componentsMap.has(input.targetId)) {
              throw new Error(`Componente de destino com ID ${input.targetId} não encontrado no MariaDB`);
            }
            
            // Sincronizar componentes com Neo4j
            if (!sourceExists) {
              const sourceComponent = componentsMap.get(input.sourceId);
              logger.info(`Sincronizando componente de origem (ID: ${input.sourceId}) com Neo4j`);
              await neo4jClient.run(`
                MERGE (c:Component {id: $id})
                ON CREATE SET 
                  c.name = $name,
                  c.description = $description,
                  c.valid_from = datetime(),
                  c.valid_to = datetime('9999-12-31T23:59:59Z')
                RETURN c
              `, {
                id: input.sourceId,
                name: sourceComponent.name,
                description: sourceComponent.description
              });
            }
            
            if (!targetExists) {
              const targetComponent = componentsMap.get(input.targetId);
              logger.info(`Sincronizando componente de destino (ID: ${input.targetId}) com Neo4j`);
              await neo4jClient.run(`
                MERGE (c:Component {id: $id})
                ON CREATE SET 
                  c.name = $name,
                  c.description = $description,
                  c.valid_from = datetime(),
                  c.valid_to = datetime('9999-12-31T23:59:59Z')
                RETURN c
              `, {
                id: input.targetId,
                name: targetComponent.name,
                description: targetComponent.description
              });
            }
            
            logger.info(`Componentes sincronizados com Neo4j`);
          }
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
        logger.info(`Tentando excluir relacionamento com ID: ${id}`);
        
        // Verificar se o relacionamento existe
        const existingRelation = await neo4jClient.getRelationById(id);
        if (!existingRelation) {
          logger.error(`Relacionamento com ID ${id} não encontrado`);
          throw new Error(`Relacionamento com ID ${id} não encontrado`);
        }
        
        // Excluir relacionamento do Neo4j
        const deleted = await neo4jClient.deleteRelation(id);
        
        if (!deleted) {
          logger.error(`Falha ao excluir relacionamento com ID ${id}`);
          throw new Error(`Falha ao excluir relacionamento com ID ${id}`);
        }
        
        logger.info(`Relacionamento excluído com sucesso: ${id}`);
        return true;
      } catch (error) {
        logger.error(`Erro ao excluir relacionamento ${id}:`, error);
        throw error;
      }
    },
  })
);