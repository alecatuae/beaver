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

  // Queries para participantes de ADR
  builder.queryField('adrParticipants', (t) =>
    t.prismaField({
      type: ['ADRParticipant'],
      args: {
        adrId: t.arg.int({ required: true }),
      },
      resolve: async (query, _root, { adrId }, { prisma }) => {
        return prisma.aDRParticipant.findMany({
          ...query,
          where: { adrId },
        });
      },
    })
  );

  // Mutations para participantes de ADR
  builder.mutationField('addADRParticipant', (t) =>
    t.prismaField({
      type: 'ADRParticipant',
      args: {
        input: t.arg({ 
          type: 'ADRParticipantInput',
          required: true 
        }),
      },
      resolve: async (query, _root, { input }, { prisma, userId }) => {
        // Verificar se o ADR existe
        const adr = await prisma.aDR.findUnique({
          where: { id: input.adrId },
        });

        if (!adr) {
          throw new Error(`ADR com ID ${input.adrId} não encontrado.`);
        }

        // Verificar se o usuário existe
        const user = await prisma.user.findUnique({
          where: { id: input.userId },
        });

        if (!user) {
          throw new Error(`Usuário com ID ${input.userId} não encontrado.`);
        }

        // Verificar se já existe um participante com este usuário neste ADR
        const existingParticipant = await prisma.aDRParticipant.findFirst({
          where: {
            adrId: input.adrId,
            userId: input.userId,
          },
        });

        if (existingParticipant) {
          throw new Error(`Usuário já é participante deste ADR.`);
        }

        return prisma.aDRParticipant.create({
          ...query,
          data: {
            adrId: input.adrId,
            userId: input.userId,
            role: input.role,
          },
        });
      },
    })
  );

  builder.mutationField('updateADRParticipant', (t) =>
    t.prismaField({
      type: 'ADRParticipant',
      args: {
        id: t.arg.int({ required: true }),
        input: t.arg({ 
          type: 'ADRParticipantUpdateInput',
          required: true 
        }),
      },
      resolve: async (query, _root, { id, input }, { prisma }) => {
        // Verificar quantos participantes com papel "OWNER" existem neste ADR
        const participant = await prisma.aDRParticipant.findUnique({
          where: { id },
        });

        if (!participant) {
          throw new Error(`Participante com ID ${id} não encontrado.`);
        }

        // Se estiver alterando de OWNER para outro papel, verificar se é o último owner
        if (participant.role === 'OWNER' && input.role !== 'OWNER') {
          const ownerCount = await prisma.aDRParticipant.count({
            where: {
              adrId: participant.adrId,
              role: 'OWNER',
            },
          });

          // Se só existe um owner, não permitir a alteração
          if (ownerCount <= 1) {
            throw new Error(
              `Não é possível alterar o papel do último owner do ADR. Cada ADR precisa ter pelo menos um participante com papel de owner.`
            );
          }
        }

        return prisma.aDRParticipant.update({
          ...query,
          where: { id },
          data: {
            role: input.role,
          },
        });
      },
    })
  );

  builder.mutationField('removeADRParticipant', (t) =>
    t.prismaField({
      type: 'ADRParticipant',
      args: {
        id: t.arg.int({ required: true }),
      },
      resolve: async (query, _root, { id }, { prisma }) => {
        const participant = await prisma.aDRParticipant.findUnique({
          where: { id },
        });

        if (!participant) {
          throw new Error(`Participante com ID ${id} não encontrado.`);
        }

        // Se for um owner, verificar se é o último
        if (participant.role === 'OWNER') {
          const ownerCount = await prisma.aDRParticipant.count({
            where: {
              adrId: participant.adrId,
              role: 'OWNER',
            },
          });

          // Se só existe um owner, não permitir a remoção
          if (ownerCount <= 1) {
            throw new Error(
              `Não é possível remover o último owner do ADR. Cada ADR precisa ter pelo menos um participante com papel de owner.`
            );
          }
        }

        return prisma.aDRParticipant.delete({
          ...query,
          where: { id },
        });
      },
    })
  );

  // Mutations para associação entre ADR e instâncias de componentes
  builder.mutationField('addADRComponentInstance', (t) =>
    t.prismaField({
      type: 'ADRComponentInstance',
      args: {
        adrId: t.arg.int({ required: true }),
        instanceId: t.arg.int({ required: true }),
        impactLevel: t.arg.string({ required: true }),
      },
      resolve: async (query, _root, { adrId, instanceId, impactLevel }, { prisma }) => {
        // Verificar se o ADR existe
        const adr = await prisma.aDR.findUnique({
          where: { id: adrId },
        });

        if (!adr) {
          throw new Error(`ADR com ID ${adrId} não encontrado.`);
        }

        // Verificar se a instância existe
        const instance = await prisma.componentInstance.findUnique({
          where: { id: instanceId },
        });

        if (!instance) {
          throw new Error(`Instância com ID ${instanceId} não encontrada.`);
        }

        // Verificar se já existe uma associação entre este ADR e esta instância
        const existingAssociation = await prisma.aDRComponentInstance.findUnique({
          where: {
            adrId_instanceId: {
              adrId,
              instanceId,
            },
          },
        });

        if (existingAssociation) {
          throw new Error(`Esta instância já está associada a este ADR.`);
        }

        // Validar o nível de impacto
        if (!['LOW', 'MEDIUM', 'HIGH'].includes(impactLevel)) {
          throw new Error(`Nível de impacto inválido. Use 'LOW', 'MEDIUM' ou 'HIGH'.`);
        }

        return prisma.aDRComponentInstance.create({
          ...query,
          data: {
            adrId,
            instanceId,
            impactLevel,
          },
        });
      },
    })
  );

  builder.mutationField('updateADRComponentInstance', (t) =>
    t.prismaField({
      type: 'ADRComponentInstance',
      args: {
        adrId: t.arg.int({ required: true }),
        instanceId: t.arg.int({ required: true }),
        impactLevel: t.arg.string({ required: true }),
      },
      resolve: async (query, _root, { adrId, instanceId, impactLevel }, { prisma }) => {
        // Verificar se a associação existe
        const association = await prisma.aDRComponentInstance.findUnique({
          where: {
            adrId_instanceId: {
              adrId,
              instanceId,
            },
          },
        });

        if (!association) {
          throw new Error(`Associação entre ADR ${adrId} e instância ${instanceId} não encontrada.`);
        }

        // Validar o nível de impacto
        if (!['LOW', 'MEDIUM', 'HIGH'].includes(impactLevel)) {
          throw new Error(`Nível de impacto inválido. Use 'LOW', 'MEDIUM' ou 'HIGH'.`);
        }

        return prisma.aDRComponentInstance.update({
          ...query,
          where: {
            adrId_instanceId: {
              adrId,
              instanceId,
            },
          },
          data: {
            impactLevel,
          },
        });
      },
    })
  );

  builder.mutationField('removeADRComponentInstance', (t) =>
    t.prismaField({
      type: 'ADRComponentInstance',
      args: {
        adrId: t.arg.int({ required: true }),
        instanceId: t.arg.int({ required: true }),
      },
      resolve: async (query, _root, { adrId, instanceId }, { prisma }) => {
        // Verificar se a associação existe
        const association = await prisma.aDRComponentInstance.findUnique({
          where: {
            adrId_instanceId: {
              adrId,
              instanceId,
            },
          },
        });

        if (!association) {
          throw new Error(`Associação entre ADR ${adrId} e instância ${instanceId} não encontrada.`);
        }

        return prisma.aDRComponentInstance.delete({
          ...query,
          where: {
            adrId_instanceId: {
              adrId,
              instanceId,
            },
          },
        });
      },
    })
  );
}; 