import builder from '../schema';
import { Team, TeamInput, TeamWhereInput, TeamMember, TeamMemberInput } from '../schema/objects';

export const teamResolvers = (builder: any) => {
  // Queries para times
  builder.queryField('team', (t) =>
    t.prismaField({
      type: Team,
      args: {
        id: t.arg.int({ required: true }),
      },
      resolve: async (query, _root, { id }, { prisma }) => {
        return prisma.team.findUniqueOrThrow({
          ...query,
          where: { id },
        });
      },
    })
  );

  builder.queryField('teams', (t) =>
    t.prismaField({
      type: [Team],
      args: {
        where: t.arg({ type: TeamWhereInput, required: false }),
        skip: t.arg.int({ required: false }),
        take: t.arg.int({ required: false }),
      },
      resolve: async (query, _root, { where, skip, take }, { prisma }) => {
        return prisma.team.findMany({
          ...query,
          where,
          skip,
          take: take ?? 50,
          orderBy: { name: 'asc' },
        });
      },
    })
  );

  // Mutations para times
  builder.mutationField('createTeam', (t) =>
    t.prismaField({
      type: Team,
      args: {
        input: t.arg({ type: TeamInput, required: true }),
      },
      resolve: async (query, _root, { input }, { prisma }) => {
        return prisma.team.create({
          ...query,
          data: {
            name: input.name,
            description: input.description,
          },
        });
      },
    })
  );

  builder.mutationField('updateTeam', (t) =>
    t.prismaField({
      type: Team,
      args: {
        id: t.arg.int({ required: true }),
        input: t.arg({ type: TeamInput, required: true }),
      },
      resolve: async (query, _root, { id, input }, { prisma }) => {
        return prisma.team.update({
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

  builder.mutationField('deleteTeam', (t) =>
    t.prismaField({
      type: Team,
      args: {
        id: t.arg.int({ required: true }),
      },
      resolve: async (query, _root, { id }, { prisma }) => {
        // Verificar se existem componentes usando este time
        const componentCount = await prisma.component.count({
          where: { teamId: id },
        });

        if (componentCount > 0) {
          // Ao invés de bloquear, podemos desassociar os componentes
          await prisma.component.updateMany({
            where: { teamId: id },
            data: { teamId: null },
          });
        }

        return prisma.team.delete({
          ...query,
          where: { id },
        });
      },
    })
  );

  // Queries para membros do time
  builder.queryField('teamMembers', (t) =>
    t.prismaField({
      type: [TeamMember],
      args: {
        teamId: t.arg.int({ required: true }),
      },
      resolve: async (query, _root, { teamId }, { prisma }) => {
        return prisma.teamMember.findMany({
          ...query,
          where: { teamId },
          orderBy: { joinDate: 'desc' },
        });
      },
    })
  );

  // Mutations para membros do time
  builder.mutationField('addTeamMember', (t) =>
    t.prismaField({
      type: TeamMember,
      args: {
        input: t.arg({ type: TeamMemberInput, required: true }),
      },
      resolve: async (query, _root, { input }, { prisma }) => {
        // Verificar se o usuário existe
        const user = await prisma.user.findUnique({
          where: { id: input.userId },
        });

        if (!user) {
          throw new Error(`Usuário com ID ${input.userId} não encontrado.`);
        }

        // Verificar se o time existe
        const team = await prisma.team.findUnique({
          where: { id: input.teamId },
        });

        if (!team) {
          throw new Error(`Time com ID ${input.teamId} não encontrado.`);
        }

        // Verificar se o membro já existe no time
        const existingMember = await prisma.teamMember.findFirst({
          where: {
            teamId: input.teamId,
            userId: input.userId,
          },
        });

        if (existingMember) {
          throw new Error(`Usuário já é membro deste time.`);
        }

        return prisma.teamMember.create({
          ...query,
          data: {
            teamId: input.teamId,
            userId: input.userId,
            joinDate: input.joinDate || new Date(),
          },
        });
      },
    })
  );

  builder.mutationField('removeTeamMember', (t) =>
    t.prismaField({
      type: TeamMember,
      args: {
        teamId: t.arg.int({ required: true }),
        userId: t.arg.int({ required: true }),
      },
      resolve: async (query, _root, { teamId, userId }, { prisma }) => {
        const member = await prisma.teamMember.findFirst({
          where: {
            teamId,
            userId,
          },
        });

        if (!member) {
          throw new Error(`Membro não encontrado no time.`);
        }

        return prisma.teamMember.delete({
          ...query,
          where: { id: member.id },
        });
      },
    })
  );
}; 