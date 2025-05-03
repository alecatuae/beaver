import builder from '../schema';
import { Environment, EnvironmentInput, EnvironmentWhereInput } from '../schema/objects';

export const environmentResolvers = (builder: any) => {
  // Adicionar queries para ambientes
  builder.queryField('environment', (t) =>
    t.prismaField({
      type: Environment,
      args: {
        id: t.arg.int({ required: true }),
      },
      resolve: async (query, _root, { id }, { prisma }) => {
        return prisma.environment.findUniqueOrThrow({
          ...query,
          where: { id },
        });
      },
    })
  );

  builder.queryField('environments', (t) =>
    t.prismaField({
      type: [Environment],
      args: {
        where: t.arg({ type: EnvironmentWhereInput, required: false }),
        skip: t.arg.int({ required: false }),
        take: t.arg.int({ required: false }),
      },
      resolve: async (query, _root, { where, skip, take }, { prisma }) => {
        return prisma.environment.findMany({
          ...query,
          where,
          skip,
          take: take ?? 50,
          orderBy: { name: 'asc' },
        });
      },
    })
  );

  // Adicionar mutations para ambientes
  builder.mutationField('createEnvironment', (t) =>
    t.prismaField({
      type: Environment,
      args: {
        input: t.arg({ type: EnvironmentInput, required: true }),
      },
      resolve: async (query, _root, { input }, { prisma }) => {
        return prisma.environment.create({
          ...query,
          data: {
            name: input.name,
            description: input.description,
          },
        });
      },
    })
  );

  builder.mutationField('updateEnvironment', (t) =>
    t.prismaField({
      type: Environment,
      args: {
        id: t.arg.int({ required: true }),
        input: t.arg({ type: EnvironmentInput, required: true }),
      },
      resolve: async (query, _root, { id, input }, { prisma }) => {
        return prisma.environment.update({
          ...query,
          where: { id },
          data: {
            name: input.name,
            description: input.description,
          },
        });
      },
    })
  );

  builder.mutationField('deleteEnvironment', (t) =>
    t.prismaField({
      type: Environment,
      args: {
        id: t.arg.int({ required: true }),
      },
      resolve: async (query, _root, { id }, { prisma }) => {
        // Verificar se existem instâncias utilizando este ambiente
        const instanceCount = await prisma.componentInstance.count({
          where: { environmentId: id },
        });

        if (instanceCount > 0) {
          throw new Error(
            `Não é possível excluir o ambiente pois existem ${instanceCount} instâncias associadas a ele.`
          );
        }

        return prisma.environment.delete({
          ...query,
          where: { id },
        });
      },
    })
  );
}; 