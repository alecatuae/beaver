import { builder } from '../../schema';
import { neo4jClient } from '../../context';
import { prisma } from '../../prisma';
import { logger } from '../../utils/logger';

// Definição do tipo para resposta da query de verificação de relacionamentos
builder.objectType('ComponentRelationsResponse', {
  fields: (t) => ({
    hasRelations: t.exposeBoolean('hasRelations'),
    count: t.exposeInt('count'),
  }),
});

// Query para verificar se um componente tem relacionamentos
builder.queryField('componentRelations', (t) =>
  t.field({
    type: 'ComponentRelationsResponse',
    args: {
      id: t.arg.int({ required: true }),
    },
    resolve: async (_, { id }) => {
      try {
        logger.info(`Verificando relacionamentos para o componente com ID: ${id}`);
        
        // Consulta Neo4j para verificar se o componente tem relacionamentos
        const result = await neo4jClient.run(`
          MATCH (c:Component {id: $id})-[r]-() 
          RETURN count(r) as relationCount
        `, { id });
        
        const count = result.records[0]?.get('relationCount')?.toNumber() || 0;
        const hasRelations = count > 0;
        
        logger.info(`Componente ID ${id} tem ${count} relacionamento(s): ${hasRelations}`);
        
        return {
          hasRelations,
          count
        };
      } catch (error) {
        logger.error(`Erro ao verificar relacionamentos do componente ${id}:`, error);
        throw error;
      }
    },
  })
);

// Atualizar o resolver de exclusão para verificar relacionamentos antes de excluir
builder.mutationField('deleteComponent', (t) =>
  t.field({
    type: 'Component',
    args: {
      id: t.arg.int({ required: true }),
    },
    resolve: async (_, { id }) => {
      try {
        logger.info(`Iniciando exclusão do componente com ID: ${id}`);
        
        // Verificar se o componente tem relacionamentos
        const relationResult = await neo4jClient.run(`
          MATCH (c:Component {id: $id})-[r]-() 
          RETURN count(r) as relationCount
        `, { id });
        
        const relationCount = relationResult.records[0]?.get('relationCount')?.toNumber() || 0;
        
        if (relationCount > 0) {
          logger.warn(`Tentativa de excluir componente com ID ${id} que tem ${relationCount} relacionamento(s)`);
          throw new Error(`Não é possível excluir o componente pois ele está presente em ${relationCount} relacionamento(s). Remova os relacionamentos primeiro.`);
        }
        
        // Buscar o componente antes de excluir (para retornar)
        const component = await prisma.component.findUniqueOrThrow({
          where: { id },
          include: {
            tags: true,
          },
        });
        
        // Exclusão em cascata das tags
        await prisma.tag.deleteMany({
          where: {
            componentId: id,
          },
        });
        
        // Excluir componente
        await prisma.component.delete({
          where: {
            id,
          },
        });
        
        // Remover do Neo4j também
        await neo4jClient.run(`
          MATCH (c:Component {id: $id})
          DELETE c
        `, { id });
        
        logger.info(`Componente com ID ${id} excluído com sucesso`);
        
        return component;
      } catch (error) {
        logger.error(`Erro ao excluir componente ${id}:`, error);
        throw error;
      }
    },
  })
); 