import { builder } from '../../schema';
import { prisma } from '../../prisma';
import { Neo4jClient } from '../../db/neo4j';
import * as neo4j from 'neo4j-driver';
import { logger } from '../../utils/logger';

// Inicializar Neo4j
const neo4jDriver = neo4j.driver(
  process.env.NEO4J_URL || 'bolt://localhost:7687',
  neo4j.auth.basic(
    process.env.NEO4J_USER || 'neo4j',
    process.env.NEO4J_PASSWORD || 'beaver12345'
  )
);
const neo4jClient = new Neo4jClient(neo4jDriver);

// Interface para Response do Neo4j
interface IRelation {
  id: string;
  source: {
    id: number;
    name: string;
    status: string;
    description: string | null;
  };
  target: {
    id: number;
    name: string;
    status: string;
    description: string | null;
  };
  type: string;
  properties: Record<string, any>;
}

// Tipo para definir a estrutura de relacionamentos
builder.objectType('Relation', {
  fields: (t) => ({
    id: t.string(),
    type: t.string(),
    properties: t.field({
      type: 'JSON',
      resolve: (relation) => relation.properties || {},
    }),
    source: t.field({
      type: 'Component',
      resolve: async (relation) => {
        try {
          const component = await prisma.component.findUnique({
            where: { id: relation.source.id },
          });

          if (!component) {
            logger.warn(`Componente origem com ID ${relation.source.id} não encontrado`);
            return {
              id: relation.source.id,
              name: relation.source.name,
              status: relation.source.status,
              description: relation.source.description,
            };
          }

          return component;
        } catch (error) {
          logger.error(`Erro ao buscar componente origem: ${(error as Error).message}`);
          return {
            id: relation.source.id,
            name: relation.source.name,
            status: relation.source.status,
            description: relation.source.description,
          };
        }
      },
    }),
    target: t.field({
      type: 'Component',
      resolve: async (relation) => {
        try {
          const component = await prisma.component.findUnique({
            where: { id: relation.target.id },
          });

          if (!component) {
            logger.warn(`Componente destino com ID ${relation.target.id} não encontrado`);
            return {
              id: relation.target.id,
              name: relation.target.name,
              status: relation.target.status,
              description: relation.target.description,
            };
          }

          return component;
        } catch (error) {
          logger.error(`Erro ao buscar componente destino: ${(error as Error).message}`);
          return {
            id: relation.target.id,
            name: relation.target.name,
            status: relation.target.status,
            description: relation.target.description,
          };
        }
      },
    }),
  }),
});

// Input para criação/atualização de relacionamentos
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

// Query para buscar todos os relacionamentos
builder.queryField('relations', (t) =>
  t.field({
    type: ['Relation'],
    args: {
      componentId: t.arg.int(),
      type: t.arg.string(),
    },
    resolve: async (_, args) => {
      try {
        const { componentId, type } = args;
        let query = `
          MATCH (a:Component)-[r]->(b:Component)
          WHERE true
        `;

        const params: Record<string, any> = {};

        if (componentId) {
          query += ` AND (a.id = $componentId OR b.id = $componentId)`;
          params.componentId = componentId;
        }

        if (type) {
          query += ` AND type(r) = $type`;
          params.type = type;
        }

        query += `
          RETURN
            id(r) AS id,
            type(r) AS type,
            properties(r) AS properties,
            a {.id, .name, .description, .status} AS source,
            b {.id, .name, .description, .status} AS target
          ORDER BY a.name, b.name
        `;

        const result = await neo4jClient.run(query, params);
        return result.records.map((record) => {
          return {
            id: record.get('id').toString(),
            type: record.get('type'),
            properties: record.get('properties'),
            source: record.get('source'),
            target: record.get('target'),
          };
        });
      } catch (error) {
        logger.error(`Erro ao buscar relacionamentos: ${(error as Error).message}`);
        throw new Error(`Erro ao buscar relacionamentos: ${(error as Error).message}`);
      }
    },
  })
);

// Query para buscar um relacionamento específico
builder.queryField('relation', (t) =>
  t.field({
    type: 'Relation',
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: async (_, { id }) => {
      try {
        const query = `
          MATCH (a:Component)-[r]->(b:Component)
          WHERE id(r) = toInteger($id)
          RETURN
            id(r) AS id,
            type(r) AS type,
            properties(r) AS properties,
            a {.id, .name, .description, .status} AS source,
            b {.id, .name, .description, .status} AS target
        `;

        const result = await neo4jClient.run(query, { id });

        if (result.records.length === 0) {
          throw new Error(`Relacionamento com ID ${id} não encontrado`);
        }

        const record = result.records[0];
        return {
          id: record.get('id').toString(),
          type: record.get('type'),
          properties: record.get('properties'),
          source: record.get('source'),
          target: record.get('target'),
        };
      } catch (error) {
        logger.error(`Erro ao buscar relacionamento: ${(error as Error).message}`);
        throw new Error(`Erro ao buscar relacionamento: ${(error as Error).message}`);
      }
    },
  })
);

// Mutation para criar um relacionamento
builder.mutationField('createRelation', (t) =>
  t.field({
    type: 'Relation',
    args: {
      input: t.arg({
        type: 'RelationInput',
        required: true,
      }),
    },
    resolve: async (_, { input }) => {
      try {
        const { sourceId, targetId, type, properties } = input;

        // Verificar se os componentes existem
        const sourceComponent = await prisma.component.findUnique({
          where: { id: sourceId },
        });

        if (!sourceComponent) {
          throw new Error(`Componente origem com ID ${sourceId} não encontrado`);
        }

        const targetComponent = await prisma.component.findUnique({
          where: { id: targetId },
        });

        if (!targetComponent) {
          throw new Error(`Componente destino com ID ${targetId} não encontrado`);
        }

        // Verificar se o relacionamento já existe
        const existingRelation = await neo4jClient.run(`
          MATCH (a:Component {id: $sourceId})-[r:${type}]->(b:Component {id: $targetId})
          RETURN r
        `, { sourceId, targetId });

        if (existingRelation.records.length > 0) {
          throw new Error(`Já existe um relacionamento do tipo ${type} entre os componentes ${sourceId} e ${targetId}`);
        }

        // Criar o relacionamento
        const query = `
          MATCH (a:Component {id: $sourceId})
          MATCH (b:Component {id: $targetId})
          CREATE (a)-[r:${type} $properties]->(b)
          RETURN
            id(r) AS id,
            type(r) AS type,
            properties(r) AS properties,
            a {.id, .name, .description, .status} AS source,
            b {.id, .name, .description, .status} AS target
        `;

        const result = await neo4jClient.run(query, {
          sourceId,
          targetId,
          properties: properties || {},
        });

        if (result.records.length === 0) {
          throw new Error(`Falha ao criar relacionamento`);
        }

        const record = result.records[0];
        return {
          id: record.get('id').toString(),
          type: record.get('type'),
          properties: record.get('properties'),
          source: record.get('source'),
          target: record.get('target'),
        };
      } catch (error) {
        logger.error(`Erro ao criar relacionamento: ${(error as Error).message}`);
        throw new Error(`Erro ao criar relacionamento: ${(error as Error).message}`);
      }
    },
  })
);

// Mutation para atualizar um relacionamento
builder.mutationField('updateRelation', (t) =>
  t.field({
    type: 'Relation',
    args: {
      id: t.arg.string({ required: true }),
      input: t.arg({
        type: 'RelationInput',
        required: true,
      }),
    },
    resolve: async (_, { id, input }) => {
      try {
        const { sourceId, targetId, type, properties } = input;

        // Verificar se os componentes existem
        const sourceComponent = await prisma.component.findUnique({
          where: { id: sourceId },
        });

        if (!sourceComponent) {
          throw new Error(`Componente origem com ID ${sourceId} não encontrado`);
        }

        const targetComponent = await prisma.component.findUnique({
          where: { id: targetId },
        });

        if (!targetComponent) {
          throw new Error(`Componente destino com ID ${targetId} não encontrado`);
        }

        // Verificar se o relacionamento existe
        const existingRelation = await neo4jClient.run(`
          MATCH ()-[r]->()
          WHERE id(r) = toInteger($id)
          RETURN r
        `, { id });

        if (existingRelation.records.length === 0) {
          throw new Error(`Relacionamento com ID ${id} não encontrado`);
        }

        // Excluir o relacionamento atual
        await neo4jClient.run(`
          MATCH ()-[r]->()
          WHERE id(r) = toInteger($id)
          DELETE r
        `, { id });

        // Criar o novo relacionamento
        const query = `
          MATCH (a:Component {id: $sourceId})
          MATCH (b:Component {id: $targetId})
          CREATE (a)-[r:${type} $properties]->(b)
          RETURN
            id(r) AS id,
            type(r) AS type,
            properties(r) AS properties,
            a {.id, .name, .description, .status} AS source,
            b {.id, .name, .description, .status} AS target
        `;

        const result = await neo4jClient.run(query, {
          sourceId,
          targetId,
          properties: properties || {},
        });

        if (result.records.length === 0) {
          throw new Error(`Falha ao atualizar relacionamento`);
        }

        const record = result.records[0];
        return {
          id: record.get('id').toString(),
          type: record.get('type'),
          properties: record.get('properties'),
          source: record.get('source'),
          target: record.get('target'),
        };
      } catch (error) {
        logger.error(`Erro ao atualizar relacionamento: ${(error as Error).message}`);
        throw new Error(`Erro ao atualizar relacionamento: ${(error as Error).message}`);
      }
    },
  })
);

// Mutation para excluir um relacionamento
builder.mutationField('deleteRelation', (t) =>
  t.boolean({
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: async (_, { id }) => {
      try {
        // Verificar se o relacionamento existe
        const existingRelation = await neo4jClient.run(`
          MATCH ()-[r]->()
          WHERE id(r) = toInteger($id)
          RETURN r
        `, { id });

        if (existingRelation.records.length === 0) {
          throw new Error(`Relacionamento com ID ${id} não encontrado`);
        }

        // Abordagem padrão para excluir relacionamento
        try {
          await neo4jClient.run(`
            MATCH ()-[r]->()
            WHERE id(r) = toInteger($id)
            DELETE r
          `, { id });
          
          logger.info(`Relacionamento ${id} excluído com sucesso`);
          return true;
        } catch (error) {
          // Em caso de erro, tenta uma abordagem alternativa para IDs problemáticos
          logger.warn(`Erro ao excluir usando toInteger, tentando com string: ${(error as Error).message}`);
          
          try {
            await neo4jClient.run(`
              MATCH ()-[r]->()
              WHERE toString(id(r)) = $id
              DELETE r
            `, { id });
            
            logger.info(`Relacionamento ${id} excluído com abordagem alternativa`);
            return true;
          } catch (specialError) {
            logger.error(`Erro na abordagem especial para ID problemático: ${(specialError as Error).message}`);
            throw new Error(`Erro ao excluir relacionamento: ${(specialError as Error).message}`);
          }
        }
      } catch (error) {
        logger.error(`Erro ao excluir relacionamento ${id}: ${(error as Error).message}`);
        throw new Error(`Erro ao excluir relacionamento: ${(error as Error).message}`);
      }
    },
  })
);