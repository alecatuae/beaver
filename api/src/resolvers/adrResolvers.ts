import { ADRStatus } from '@prisma/client';
import { logger } from '../utils/logger';

export const adrResolvers = (builder: any) => {
  // Define o enumerador ADRStatus
  const ADRStatusEnum = builder.enumType('ADRStatus', {
    values: Object.values(ADRStatus) as [string, ...string[]],
  });

  // Define o tipo ADRTag
  const ADRTag = builder.prismaObject('ADRTag', {
    fields: (t: any) => ({
      id: t.exposeID('id'),
      adrId: t.exposeInt('adrId', { nullable: true }),
      tag: t.exposeString('tag'),
      adr: t.relation('adr', { nullable: true }),
    }),
  });

  // Define o tipo ADR
  const ADR = builder.prismaObject('ADR', {
    fields: (t: any) => ({
      id: t.exposeID('id'),
      title: t.exposeString('title'),
      decision: t.exposeString('decision'),
      status: t.expose('status', { type: ADRStatusEnum }),
      createdAt: t.expose('createdAt', { type: 'Date' }),
      tags: t.relation('tags'),
    }),
  });

  // Input para criação/atualização de ADR
  const ADRInput = builder.inputType('ADRInput', {
    fields: (t: any) => ({
      title: t.string({ required: true }),
      decision: t.string({ required: true }),
      status: t.field({ type: ADRStatusEnum }),
      componentId: t.int(),
    }),
  });

  // Query para listar ADRs
  builder.queryField('adrs', (t: any) =>
    t.prismaField({
      type: [ADR],
      args: {
        status: t.arg({ type: ADRStatusEnum }),
      },
      resolve: async (query: any, _root: any, args: any, ctx: any) => {
        return ctx.prisma.aDR.findMany({
          ...query,
          where: args.status ? { status: args.status } : undefined,
        });
      },
    })
  );

  // Query para buscar ADR por ID
  builder.queryField('adr', (t: any) =>
    t.prismaField({
      type: ADR,
      nullable: true,
      args: {
        id: t.arg.int({ required: true }),
      },
      resolve: async (query: any, _root: any, args: any, ctx: any) => {
        return ctx.prisma.aDR.findUnique({
          ...query,
          where: { id: args.id },
        });
      },
    })
  );

  // Mutation para criar ADR
  builder.mutationField('createADR', (t: any) =>
    t.prismaField({
      type: ADR,
      args: {
        input: t.arg({ type: ADRInput, required: true }),
      },
      resolve: async (query: any, _root: any, args: any, ctx: any) => {
        // Descomente esta verificação em produção
        // if (!ctx.userId) {
        //   throw new Error('Não autorizado');
        // }
        
        const { title, decision, status, componentId } = args.input;
        
        // Criar ADR no MariaDB
        const adr = await ctx.prisma.aDR.create({
          ...query,
          data: {
            title,
            decision,
            status: status || ADRStatus.PROPOSED,
          },
        });
        
        // Se tiver componentId, criar relação no Neo4j
        if (componentId) {
          try {
            // Criar nó ADR no Neo4j
            const adrNode = await ctx.neo4j.run(`
              CREATE (a:ADR {
                id: $id,
                title: $title,
                decision: $decision,
                status: $status
              })
              RETURN a
            `, {
              id: adr.id,
              title: adr.title,
              decision: adr.decision,
              status: adr.status,
            });
            
            // Criar relação entre Component e ADR
            await ctx.neo4j.createRelationship(componentId, adr.id, 'HAS_DECISION');
            
            logger.info(`ADR criado e associado ao componente ${componentId}: ${title}`);
          } catch (error) {
            logger.error(`Erro ao criar ADR no Neo4j: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
          }
        } else {
          logger.info(`ADR criado: ${title}`);
        }
        
        return adr;
      },
    })
  );

  // Mutation para atualizar ADR
  builder.mutationField('updateADR', (t: any) =>
    t.prismaField({
      type: ADR,
      args: {
        id: t.arg.int({ required: true }),
        input: t.arg({ type: ADRInput, required: true }),
      },
      resolve: async (query: any, _root: any, args: any, ctx: any) => {
        // Descomente esta verificação em produção
        // if (!ctx.userId) {
        //   throw new Error('Não autorizado');
        // }
        
        const { id } = args;
        const { title, decision, status } = args.input;
        
        // Verificar se o ADR existe
        const existingADR = await ctx.prisma.aDR.findUnique({
          where: { id },
        });
        
        if (!existingADR) {
          throw new Error('ADR não encontrado');
        }
        
        // Atualizar ADR no MariaDB
        const adr = await ctx.prisma.aDR.update({
          ...query,
          where: { id },
          data: {
            title,
            decision,
            status,
          },
        });
        
        // Atualizar ADR no Neo4j
        try {
          await ctx.neo4j.run(`
            MATCH (a:ADR {id: $id})
            SET a.title = $title,
                a.decision = $decision,
                a.status = $status
          `, {
            id: adr.id,
            title: adr.title,
            decision: adr.decision,
            status: adr.status,
          });
          
          logger.info(`ADR atualizado: ${title}`);
        } catch (error) {
          logger.error(`Erro ao atualizar ADR no Neo4j: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        }
        
        return adr;
      },
    })
  );
}; 