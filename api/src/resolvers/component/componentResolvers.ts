import { builder } from '../../schema';
import { neo4jClient } from '../../context';
import { prisma } from '../../prisma';
import { logger } from '../../utils/logger';
import { Component_status } from '@prisma/client';

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

// Utilitário para manipular operações relacionadas a componentes
export const componentResolvers = (builder) => {
  // Endpoint para criar um componente
  builder.mutationField('createComponent', (t) =>
    t.prismaField({
      type: 'Component',
      args: {
        name: t.arg.string({ required: true }),
        description: t.arg.string(),
        status: t.arg({ type: 'ComponentStatus' }),
        categoryId: t.arg.int(),
        teamId: t.arg.int(),
      },
      resolve: async (query, _root, args) => {
        const { name, description, status, categoryId, teamId } = args;

        // Verifica se já existe um componente com o mesmo nome
        const existingComponent = await prisma.component.findFirst({
          where: { name },
        });

        if (existingComponent) {
          throw new Error(`Já existe um componente com o nome "${name}"`);
        }

        // Cria o componente no banco de dados
        return prisma.component.create({
          ...query,
          data: {
            name,
            description: description || null,
            status: status || Component_status.ACTIVE,
            categoryId: categoryId || null,
            teamId: teamId || null,
          },
        });
      },
    })
  );

  // Endpoint para atualizar um componente
  builder.mutationField('updateComponent', (t) =>
    t.prismaField({
      type: 'Component',
      args: {
        id: t.arg.int({ required: true }),
        name: t.arg.string(),
        description: t.arg.string(),
        status: t.arg({ type: 'ComponentStatus' }),
        categoryId: t.arg.int(),
        teamId: t.arg.int(),
      },
      resolve: async (query, _root, args) => {
        const { id, name, description, status, categoryId, teamId } = args;

        // Verifica se o componente existe
        const component = await prisma.component.findUnique({
          where: { id },
        });

        if (!component) {
          throw new Error(`Componente com ID ${id} não encontrado`);
        }

        // Verifica nome duplicado, apenas se o nome foi alterado
        if (name && name !== component.name) {
          const existingComponent = await prisma.component.findFirst({
            where: {
              name,
              id: { not: id }, // Não considerar o próprio componente
            },
          });

          if (existingComponent) {
            throw new Error(`Já existe um componente com o nome "${name}"`);
          }
        }

        // Atualiza o componente
        return prisma.component.update({
          ...query,
          where: { id },
          data: {
            ...(name && { name }),
            ...(description !== undefined && { description }),
            ...(status && { status }),
            ...(categoryId !== undefined && { categoryId }),
            ...(teamId !== undefined && { teamId }),
          },
        });
      },
    })
  );

  // Busca componentes com filtros
  builder.queryField('components', (t) =>
    t.prismaField({
      type: ['Component'],
      args: {
        status: t.arg({ type: 'ComponentStatus' }),
        categoryId: t.arg.int(),
        teamId: t.arg.int(),
        search: t.arg.string(),
      },
      resolve: async (query, _root, args) => {
        const { status, categoryId, teamId, search } = args;

        // Constrói os filtros
        const where = {
          ...(status && { status }),
          ...(categoryId && { categoryId }),
          ...(teamId && { teamId }),
          ...(search && {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
            ],
          }),
        };

        // Busca os componentes
        return prisma.component.findMany({
          ...query,
          where,
          orderBy: { name: 'asc' },
        });
      },
    })
  );

  // Busca um componente por ID
  builder.queryField('component', (t) =>
    t.prismaField({
      type: 'Component',
      nullable: true,
      args: {
        id: t.arg.int({ required: true }),
      },
      resolve: async (query, _root, { id }) => {
        return prisma.component.findUnique({
          ...query,
          where: { id },
        });
      },
    })
  );
}; 