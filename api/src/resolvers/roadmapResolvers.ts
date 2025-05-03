import builder from '../schema';
import { RoadmapType, RoadmapTypeInput, RoadmapTypeWhereInput, RoadmapItem, RoadmapItemInput, RoadmapItemUpdateInput, RoadmapItemWhereInput } from '../schema/objects';

export const roadmapResolvers = (builder: any) => {
  // Queries para tipos de roadmap
  builder.queryField('roadmapType', (t) =>
    t.prismaField({
      type: RoadmapType,
      args: {
        id: t.arg.int({ required: true }),
      },
      resolve: async (query, _root, { id }, { prisma }) => {
        return prisma.roadmapType.findUniqueOrThrow({
          ...query,
          where: { id },
        });
      },
    })
  );

  builder.queryField('roadmapTypes', (t) =>
    t.prismaField({
      type: [RoadmapType],
      args: {
        where: t.arg({ type: RoadmapTypeWhereInput, required: false }),
      },
      resolve: async (query, _root, { where }, { prisma }) => {
        return prisma.roadmapType.findMany({
          ...query,
          where,
          orderBy: { name: 'asc' },
        });
      },
    })
  );

  // Mutations para tipos de roadmap
  builder.mutationField('createRoadmapType', (t) =>
    t.prismaField({
      type: RoadmapType,
      args: {
        input: t.arg({ type: RoadmapTypeInput, required: true }),
      },
      resolve: async (query, _root, { input }, { prisma }) => {
        // Validar o formato de color hex (deve ser #RRGGBB)
        if (!/^#[0-9A-Fa-f]{6}$/.test(input.colorHex)) {
          throw new Error('A cor deve estar no formato hexadecimal: #RRGGBB');
        }

        return prisma.roadmapType.create({
          ...query,
          data: {
            name: input.name,
            description: input.description,
            colorHex: input.colorHex,
          },
        });
      },
    })
  );

  builder.mutationField('updateRoadmapType', (t) =>
    t.prismaField({
      type: RoadmapType,
      args: {
        id: t.arg.int({ required: true }),
        input: t.arg({ type: RoadmapTypeInput, required: true }),
      },
      resolve: async (query, _root, { id, input }, { prisma }) => {
        // Validar o formato de color hex (deve ser #RRGGBB)
        if (!/^#[0-9A-Fa-f]{6}$/.test(input.colorHex)) {
          throw new Error('A cor deve estar no formato hexadecimal: #RRGGBB');
        }

        return prisma.roadmapType.update({
          ...query,
          where: { id },
          data: {
            name: input.name,
            description: input.description,
            colorHex: input.colorHex,
          },
        });
      },
    })
  );

  builder.mutationField('deleteRoadmapType', (t) =>
    t.prismaField({
      type: RoadmapType,
      args: {
        id: t.arg.int({ required: true }),
      },
      resolve: async (query, _root, { id }, { prisma }) => {
        // Verificar se existem itens usando este tipo
        const itemCount = await prisma.roadmapItem.count({
          where: { typeId: id },
        });

        if (itemCount > 0) {
          throw new Error(`Não é possível excluir este tipo de roadmap pois existem ${itemCount} itens associados a ele.`);
        }

        return prisma.roadmapType.delete({
          ...query,
          where: { id },
        });
      },
    })
  );

  // Queries para itens de roadmap
  builder.queryField('roadmapItem', (t) =>
    t.prismaField({
      type: RoadmapItem,
      args: {
        id: t.arg.int({ required: true }),
      },
      resolve: async (query, _root, { id }, { prisma }) => {
        return prisma.roadmapItem.findUniqueOrThrow({
          ...query,
          where: { id },
        });
      },
    })
  );

  builder.queryField('roadmapItems', (t) =>
    t.prismaField({
      type: [RoadmapItem],
      args: {
        where: t.arg({ type: RoadmapItemWhereInput, required: false }),
        skip: t.arg.int({ required: false }),
        take: t.arg.int({ required: false }),
      },
      resolve: async (query, _root, { where, skip, take }, { prisma }) => {
        return prisma.roadmapItem.findMany({
          ...query,
          where,
          skip,
          take: take ?? 50,
          orderBy: [
            { status: 'asc' },
            { dueDate: 'asc' },
          ],
        });
      },
    })
  );

  // Mutations para itens de roadmap
  builder.mutationField('createRoadmapItem', (t) =>
    t.prismaField({
      type: RoadmapItem,
      args: {
        input: t.arg({ type: RoadmapItemInput, required: true }),
      },
      resolve: async (query, _root, { input }, { prisma }) => {
        // Verificar se o tipo existe
        const type = await prisma.roadmapType.findUnique({
          where: { id: input.typeId },
        });

        if (!type) {
          throw new Error(`Tipo de roadmap com ID ${input.typeId} não encontrado.`);
        }

        // Verificar se o componente existe, se foi especificado
        if (input.componentId) {
          const component = await prisma.component.findUnique({
            where: { id: input.componentId },
          });

          if (!component) {
            throw new Error(`Componente com ID ${input.componentId} não encontrado.`);
          }
        }

        return prisma.roadmapItem.create({
          ...query,
          data: {
            title: input.title,
            description: input.description,
            componentId: input.componentId,
            typeId: input.typeId,
            status: input.status ?? 'TODO',
            dueDate: input.dueDate,
          },
        });
      },
    })
  );

  builder.mutationField('updateRoadmapItem', (t) =>
    t.prismaField({
      type: RoadmapItem,
      args: {
        id: t.arg.int({ required: true }),
        input: t.arg({ type: RoadmapItemUpdateInput, required: true }),
      },
      resolve: async (query, _root, { id, input }, { prisma }) => {
        // Verificar se o tipo existe, se foi especificado
        if (input.typeId) {
          const type = await prisma.roadmapType.findUnique({
            where: { id: input.typeId },
          });

          if (!type) {
            throw new Error(`Tipo de roadmap com ID ${input.typeId} não encontrado.`);
          }
        }

        // Verificar se o componente existe, se foi especificado
        if (input.componentId !== undefined) {
          if (input.componentId === null) {
            // Permitir remover associação com componente
          } else {
            const component = await prisma.component.findUnique({
              where: { id: input.componentId },
            });

            if (!component) {
              throw new Error(`Componente com ID ${input.componentId} não encontrado.`);
            }
          }
        }

        return prisma.roadmapItem.update({
          ...query,
          where: { id },
          data: {
            title: input.title,
            description: input.description,
            componentId: input.componentId,
            typeId: input.typeId,
            status: input.status,
            dueDate: input.dueDate,
          },
        });
      },
    })
  );

  builder.mutationField('deleteRoadmapItem', (t) =>
    t.prismaField({
      type: RoadmapItem,
      args: {
        id: t.arg.int({ required: true }),
      },
      resolve: async (query, _root, { id }, { prisma }) => {
        return prisma.roadmapItem.delete({
          ...query,
          where: { id },
        });
      },
    })
  );
}; 