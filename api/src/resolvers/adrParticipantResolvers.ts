import { builder } from '../schema';
import { ADRParticipant, ADRParticipantInput, ADRParticipantUpdateInput, ADRParticipantWhereInput } from '../schema/objects/adrParticipant';
import { prisma } from '../prisma';
import { Neo4jClient } from '../db/neo4j';
import neo4jDriver from 'neo4j-driver';
import { logger } from '../utils/logger';

// Inicializar Neo4j
const driver = neo4jDriver.driver(
  process.env.NEO4J_URL || 'bolt://localhost:7687',
  neo4jDriver.auth.basic(
    process.env.NEO4J_USER || 'neo4j',
    process.env.NEO4J_PASSWORD || 'beaver12345'
  )
);
const neo4jClient = new Neo4jClient(driver);

export const adrParticipantResolvers = (builder) => {
  // Query para buscar participantes por ADR ID
  builder.queryField('adrParticipants', (t) =>
    t.prismaField({
      type: ['ADR_Participant'],
      args: {
        adrId: t.arg.int({ required: true }),
      },
      resolve: async (query, _root, { adrId }) => {
        return prisma.aDR_Participant.findMany({
          ...query,
          where: { adrId },
        });
      },
    })
  );

  // Query para buscar participantes por ID
  builder.queryField('adrParticipant', (t) =>
    t.prismaField({
      type: 'ADR_Participant',
      nullable: true,
      args: {
        id: t.arg.int({ required: true }),
      },
      resolve: async (query, _root, { id }) => {
        return prisma.aDR_Participant.findUnique({
          ...query,
          where: { id },
        });
      },
    })
  );

  // Query para listar participantes com filtros
  builder.queryField('adrParticipants', (t) =>
    t.prismaField({
      type: [ADRParticipant],
      args: {
        where: t.arg({ type: ADRParticipantWhereInput, required: false }),
        skip: t.arg.int({ required: false }),
        take: t.arg.int({ required: false }),
      },
      resolve: async (query, _root, { where, skip, take }, { prisma }) => {
        return prisma.aDRParticipant.findMany({
          ...query,
          where,
          skip,
          take: take ?? 50,
          orderBy: { createdAt: 'desc' },
        });
      },
    })
  );

  // Query para listar participantes de um ADR específico
  builder.queryField('participantsByADR', (t) =>
    t.prismaField({
      type: [ADRParticipant],
      args: {
        adrId: t.arg.int({ required: true }),
      },
      resolve: async (query, _root, { adrId }, { prisma }) => {
        return prisma.aDRParticipant.findMany({
          ...query,
          where: { adrId },
          orderBy: { role: 'asc' },
        });
      },
    })
  );

  // Query para listar ADRs em que um usuário é participante
  builder.queryField('adrsByParticipant', (t) =>
    t.prismaField({
      type: [ADRParticipant],
      args: {
        userId: t.arg.int({ required: true }),
        role: t.arg({ type: 'ParticipantRole', required: false }),
      },
      resolve: async (query, _root, { userId, role }, { prisma }) => {
        return prisma.aDRParticipant.findMany({
          ...query,
          where: { 
            userId,
            ...(role ? { role } : {})
          },
          orderBy: { adr: { updatedAt: 'desc' } },
        });
      },
    })
  );

  // Mutation para adicionar participante a um ADR
  builder.mutationField('addADRParticipant', (t) =>
    t.prismaField({
      type: 'ADR_Participant',
      args: {
        input: t.arg({
          type: 'ADRParticipantInput',
          required: true,
        }),
      },
      resolve: async (query, _root, { input }) => {
        const { adrId, userId, role } = input;

        // Verifica se o ADR existe
        const adr = await prisma.aDR.findUnique({
          where: { id: adrId },
        });

        if (!adr) {
          throw new Error(`ADR com ID ${adrId} não encontrado`);
        }

        // Verifica se o usuário existe
        const user = await prisma.user.findUnique({
          where: { id: userId },
        });

        if (!user) {
          throw new Error(`Usuário com ID ${userId} não encontrado`);
        }

        // Verifica se já existe essa relação
        const existingParticipant = await prisma.aDR_Participant.findFirst({
          where: {
            adrId,
            userId,
          },
        });

        if (existingParticipant) {
          throw new Error(`Usuário já é participante deste ADR`);
        }

        // Cria o participante
        const newParticipant = await prisma.aDR_Participant.create({
          ...query,
          data: {
            adrId,
            userId,
            role,
          },
        });

        // Sincroniza com Neo4j
        try {
          await neo4jClient.run(`
            MATCH (u:User {id: $userId})
            MATCH (a:ADR {id: $adrId})
            MERGE (u)-[:PARTICIPATES_IN {role: $role, id: $participantId}]->(a)
          `, {
            userId,
            adrId,
            role,
            participantId: newParticipant.id
          });
        } catch (error) {
          logger.warn(`Erro ao sincronizar participante com Neo4j: ${error}`);
          // Continua mesmo com erro no Neo4j
        }

        return newParticipant;
      },
    })
  );

  // Mutation para atualizar o papel de um participante
  builder.mutationField('updateADRParticipant', (t) =>
    t.prismaField({
      type: ADRParticipant,
      args: {
        id: t.arg.int({ required: true }),
        input: t.arg({ type: ADRParticipantUpdateInput, required: true }),
      },
      resolve: async (query, _root, { id, input }, { prisma, currentUser }) => {
        // Buscar o participante atual
        const participant = await prisma.aDRParticipant.findUnique({
          where: { id },
          include: { adr: true }
        });

        if (!participant) {
          throw new Error(`Participante com ID ${id} não encontrado.`);
        }

        // Verificar permissões
        const isOwner = await prisma.aDRParticipant.findFirst({
          where: {
            adrId: participant.adrId,
            userId: currentUser?.id,
            role: 'OWNER'
          }
        });

        if (!currentUser || 
            (!['ADMIN', 'ARCHITECT'].includes(currentUser.role) && !isOwner)) {
          throw new Error('Permissão negada. Apenas administradores, arquitetos ou donos do ADR podem atualizar papéis.');
        }

        // Verificar se não está tentando remover o último owner
        if (participant.role === 'OWNER' && input.role !== 'OWNER') {
          const ownerCount = await prisma.aDRParticipant.count({
            where: {
              adrId: participant.adrId,
              role: 'OWNER'
            }
          });

          if (ownerCount <= 1) {
            throw new Error('Não é possível alterar o papel do último owner do ADR. Adicione outro owner antes.');
          }
        }

        // Atualizar participante no MariaDB
        const updatedParticipant = await prisma.aDRParticipant.update({
          ...query,
          where: { id },
          data: {
            role: input.role
          },
        });

        // Atualizar no Neo4j
        await neo4jClient.run(`
          MATCH (u:User {id: $userId})-[r:PARTICIPATES_IN]->(a:ADR {id: $adrId})
          SET r.role = $role
        `, {
          userId: participant.userId,
          adrId: participant.adrId,
          role: input.role
        });

        return updatedParticipant;
      },
    })
  );

  // Mutation para remover participante de um ADR
  builder.mutationField('removeADRParticipant', (t) =>
    t.boolean({
      args: {
        id: t.arg.int({ required: true }),
      },
      resolve: async (_root, { id }) => {
        // Verifica se o participante existe
        const participant = await prisma.aDR_Participant.findUnique({
          where: { id },
          include: { adr: true },
        });

        if (!participant) {
          throw new Error(`Participante com ID ${id} não encontrado`);
        }

        // Verificar se é o último owner
        if (participant.role === 'OWNER') {
          const ownersCount = await prisma.aDR_Participant.count({
            where: {
              adrId: participant.adrId,
              role: 'OWNER',
            },
          });

          if (ownersCount <= 1) {
            throw new Error(`Não é possível remover o último owner do ADR`);
          }
        }

        // Remove o participante no MariaDB
        await prisma.aDR_Participant.delete({
          where: { id },
        });

        // Remove a relação no Neo4j
        try {
          await neo4jClient.run(`
            MATCH (u:User {id: $userId})-[r:PARTICIPATES_IN {id: $participantId}]->(a:ADR {id: $adrId})
            DELETE r
          `, {
            userId: participant.userId,
            adrId: participant.adrId,
            participantId: id
          });
        } catch (error) {
          logger.warn(`Erro ao remover participante do Neo4j: ${error}`);
          // Continua mesmo com erro no Neo4j
        }

        return true;
      },
    })
  );
}; 