import { logger } from '../utils/logger';

export const glossaryResolvers = (builder: any) => {
  // Define o tipo GlossaryTerm
  const GlossaryTerm = builder.prismaObject('GlossaryTerm', {
    fields: (t: any) => ({
      id: t.exposeID('id'),
      term: t.exposeString('term'),
      definition: t.exposeString('definition'),
    }),
  });

  // Input para criação/atualização de termo
  const GlossaryTermInput = builder.inputType('GlossaryTermInput', {
    fields: (t: any) => ({
      term: t.string({ required: true }),
      definition: t.string({ required: true }),
    }),
  });

  // Query para listar termos
  builder.queryField('glossaryTerms', (t: any) =>
    t.prismaField({
      type: [GlossaryTerm],
      args: {
        search: t.arg.string(),
      },
      resolve: async (query: any, _root: any, args: any, ctx: any) => {
        const search = args.search;
        
        return ctx.prisma.glossaryTerm.findMany({
          ...query,
          where: search
            ? {
                OR: [
                  { term: { contains: search } },
                  { definition: { contains: search } },
                ],
              }
            : undefined,
          orderBy: { term: 'asc' },
        });
      },
    })
  );

  // Query para buscar termo por ID
  builder.queryField('glossaryTerm', (t: any) =>
    t.prismaField({
      type: GlossaryTerm,
      nullable: true,
      args: {
        id: t.arg.int({ required: true }),
      },
      resolve: async (query: any, _root: any, args: any, ctx: any) => {
        return ctx.prisma.glossaryTerm.findUnique({
          ...query,
          where: { id: args.id },
        });
      },
    })
  );

  // Query para buscar termo por nome
  builder.queryField('glossaryTermByName', (t: any) =>
    t.prismaField({
      type: GlossaryTerm,
      nullable: true,
      args: {
        term: t.arg.string({ required: true }),
      },
      resolve: async (query: any, _root: any, args: any, ctx: any) => {
        return ctx.prisma.glossaryTerm.findFirst({
          ...query,
          where: { term: { equals: args.term, mode: 'insensitive' } },
        });
      },
    })
  );

  // Mutation para criar termo
  builder.mutationField('createGlossaryTerm', (t: any) =>
    t.prismaField({
      type: GlossaryTerm,
      args: {
        input: t.arg({ type: GlossaryTermInput, required: true }),
      },
      resolve: async (query: any, _root: any, args: any, ctx: any) => {
        if (!ctx.userId) {
          throw new Error('Não autorizado');
        }
        
        const { term, definition } = args.input;
        
        // Verificar se o termo já existe
        const existingTerm = await ctx.prisma.glossaryTerm.findFirst({
          where: { term: { equals: term, mode: 'insensitive' } },
        });
        
        if (existingTerm) {
          throw new Error(`Termo "${term}" já existe no glossário`);
        }
        
        // Criar termo no MariaDB
        const glossaryTerm = await ctx.prisma.glossaryTerm.create({
          ...query,
          data: {
            term,
            definition,
          },
        });
        
        // Criar termo no Neo4j
        try {
          await ctx.neo4j.run(`
            CREATE (g:GlossaryTerm {
              term: $term,
              definition: $definition
            })
          `, {
            term: glossaryTerm.term,
            definition: glossaryTerm.definition,
          });
          
          logger.info(`Termo de glossário criado: ${term}`);
        } catch (error) {
          logger.error(`Erro ao criar termo no Neo4j: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        }
        
        return glossaryTerm;
      },
    })
  );

  // Mutation para atualizar termo
  builder.mutationField('updateGlossaryTerm', (t: any) =>
    t.prismaField({
      type: GlossaryTerm,
      args: {
        id: t.arg.int({ required: true }),
        input: t.arg({ type: GlossaryTermInput, required: true }),
      },
      resolve: async (query: any, _root: any, args: any, ctx: any) => {
        if (!ctx.userId) {
          throw new Error('Não autorizado');
        }
        
        const { id } = args;
        const { term, definition } = args.input;
        
        // Verificar se o termo existe
        const existingTerm = await ctx.prisma.glossaryTerm.findUnique({
          where: { id },
        });
        
        if (!existingTerm) {
          throw new Error('Termo não encontrado');
        }
        
        // Atualizar termo no MariaDB
        const glossaryTerm = await ctx.prisma.glossaryTerm.update({
          ...query,
          where: { id },
          data: {
            term,
            definition,
          },
        });
        
        // Atualizar termo no Neo4j
        try {
          await ctx.neo4j.run(`
            MATCH (g:GlossaryTerm {term: $oldTerm})
            SET g.term = $term,
                g.definition = $definition
          `, {
            oldTerm: existingTerm.term,
            term: glossaryTerm.term,
            definition: glossaryTerm.definition,
          });
          
          logger.info(`Termo de glossário atualizado: ${term}`);
        } catch (error) {
          logger.error(`Erro ao atualizar termo no Neo4j: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        }
        
        return glossaryTerm;
      },
    })
  );

  // Mutation para deletar termo
  builder.mutationField('deleteGlossaryTerm', (t: any) =>
    t.field({
      type: 'Boolean',
      args: {
        id: t.arg.int({ required: true }),
      },
      resolve: async (_root: any, args: any, ctx: any) => {
        if (!ctx.userId) {
          throw new Error('Não autorizado');
        }
        
        const { id } = args;
        
        // Verificar se o termo existe
        const existingTerm = await ctx.prisma.glossaryTerm.findUnique({
          where: { id },
        });
        
        if (!existingTerm) {
          throw new Error('Termo não encontrado');
        }
        
        // Deletar termo no MariaDB
        await ctx.prisma.glossaryTerm.delete({
          where: { id },
        });
        
        // Deletar termo no Neo4j
        try {
          await ctx.neo4j.run(`
            MATCH (g:GlossaryTerm {term: $term})
            DELETE g
          `, {
            term: existingTerm.term,
          });
          
          logger.info(`Termo de glossário deletado: ${existingTerm.term}`);
        } catch (error) {
          logger.error(`Erro ao deletar termo no Neo4j: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        }
        
        return true;
      },
    })
  );
}; 