import builder from '../schema';
import { ADRComponentInstance, ADRComponentInstanceInput, ADRComponentInstanceUpdateInput, ADRComponentInstanceWhereInput } from '../schema/objects/adrComponentInstance';
import { prisma } from '../prisma';
import { Neo4jClient } from '../db/neo4j';

const neo4j = new Neo4jClient();

export const adrComponentInstanceResolvers = (builder: any) => {
  // Query para buscar uma relação ADR-instância específica
  builder.queryField('adrComponentInstance', (t) =>
    t.prismaField({
      type: ADRComponentInstance,
      args: {
        id: t.arg.int({ required: true }),
      },
      resolve: async (query, _root, { id }, { prisma }) => {
        return prisma.aDRComponentInstance.findUniqueOrThrow({
          ...query,
          where: { id },
        });
      },
    })
  );

  // Query para listar relações ADR-instância com filtros
  builder.queryField('adrComponentInstances', (t) =>
    t.prismaField({
      type: [ADRComponentInstance],
      args: {
        where: t.arg({ type: ADRComponentInstanceWhereInput, required: false }),
        skip: t.arg.int({ required: false }),
        take: t.arg.int({ required: false }),
      },
      resolve: async (query, _root, { where, skip, take }, { prisma }) => {
        return prisma.aDRComponentInstance.findMany({
          ...query,
          where,
          skip,
          take: take ?? 50,
          orderBy: { createdAt: 'desc' },
        });
      },
    })
  );

  // Query para listar instâncias afetadas por um ADR específico
  builder.queryField('instancesByADR', (t) =>
    t.prismaField({
      type: [ADRComponentInstance],
      args: {
        adrId: t.arg.int({ required: true }),
      },
      resolve: async (query, _root, { adrId }, { prisma }) => {
        return prisma.aDRComponentInstance.findMany({
          ...query,
          where: { adrId },
          orderBy: { impactLevel: 'desc' },
        });
      },
    })
  );

  // Query para listar ADRs que afetam uma instância específica
  builder.queryField('adrsByInstance', (t) =>
    t.prismaField({
      type: [ADRComponentInstance],
      args: {
        instanceId: t.arg.int({ required: true }),
      },
      resolve: async (query, _root, { instanceId }, { prisma }) => {
        return prisma.aDRComponentInstance.findMany({
          ...query,
          where: { instanceId },
          orderBy: { impactLevel: 'desc' },
        });
      },
    })
  );

  // Mutation para adicionar uma instância a um ADR
  builder.mutationField('addADRComponentInstance', (t) =>
    t.prismaField({
      type: ADRComponentInstance,
      args: {
        input: t.arg({ type: ADRComponentInstanceInput, required: true }),
      },
      resolve: async (query, _root, { input }, { prisma, currentUser }) => {
        // Verificar permissões
        if (!currentUser || !['ADMIN', 'ARCHITECT'].includes(currentUser.role)) {
          // Verificar se o usuário é owner do ADR
          const isOwner = await prisma.aDRParticipant.findFirst({
            where: {
              adrId: input.adrId,
              userId: currentUser?.id,
              role: 'OWNER'
            }
          });

          if (!isOwner) {
            throw new Error('Permissão negada. Apenas administradores, arquitetos ou donos do ADR podem adicionar instâncias.');
          }
        }

        // Verificar se o ADR existe
        const adr = await prisma.aDR.findUnique({
          where: { id: input.adrId }
        });

        if (!adr) {
          throw new Error(`ADR com ID ${input.adrId} não encontrado.`);
        }

        // Verificar se a instância existe
        const instance = await prisma.componentInstance.findUnique({
          where: { id: input.instanceId },
          include: { component: true }
        });

        if (!instance) {
          throw new Error(`Instância com ID ${input.instanceId} não encontrada.`);
        }

        // Verificar se a relação já existe
        const existingRelation = await prisma.aDRComponentInstance.findFirst({
          where: {
            adrId: input.adrId,
            instanceId: input.instanceId
          }
        });

        if (existingRelation) {
          throw new Error(`Esta instância já está associada a este ADR.`);
        }

        // Criar relação no MariaDB
        const relation = await prisma.aDRComponentInstance.create({
          ...query,
          data: {
            adrId: input.adrId,
            instanceId: input.instanceId,
            impactLevel: input.impactLevel,
            notes: input.notes || null
          },
        });

        // Sincronizar com Neo4j
        await neo4j.run(`
          MATCH (a:ADR {id: $adrId}), (ci:ComponentInstance {id: $instanceId})
          MERGE (a)-[r:AFFECTS_INSTANCE]->(ci)
          ON CREATE SET r.impact_level = $impactLevel, r.notes = $notes
          ON MATCH SET r.impact_level = $impactLevel, r.notes = $notes
        `, {
          adrId: input.adrId,
          instanceId: input.instanceId,
          impactLevel: input.impactLevel,
          notes: input.notes || null
        });

        // Verificar se existe a relação ADRComponent correspondente
        // Se não existir, criar automaticamente
        const adrComponent = await prisma.aDRComponent.findFirst({
          where: {
            adrId: input.adrId,
            componentId: instance.componentId
          }
        });

        if (!adrComponent) {
          await prisma.aDRComponent.create({
            data: {
              adrId: input.adrId,
              componentId: instance.componentId
            }
          });

          // Sincronizar com Neo4j
          await neo4j.run(`
            MATCH (a:ADR {id: $adrId}), (c:Component {id: $componentId})
            MERGE (a)-[:AFFECTS]->(c)
          `, {
            adrId: input.adrId,
            componentId: instance.componentId
          });
        }

        return relation;
      },
    })
  );

  // Mutation para atualizar uma relação ADR-instância
  builder.mutationField('updateADRComponentInstance', (t) =>
    t.prismaField({
      type: ADRComponentInstance,
      args: {
        id: t.arg.int({ required: true }),
        input: t.arg({ type: ADRComponentInstanceUpdateInput, required: true }),
      },
      resolve: async (query, _root, { id, input }, { prisma, currentUser }) => {
        // Buscar a relação atual
        const relation = await prisma.aDRComponentInstance.findUnique({
          where: { id },
          include: { adr: true }
        });

        if (!relation) {
          throw new Error(`Relação com ID ${id} não encontrada.`);
        }

        // Verificar permissões
        if (!currentUser || !['ADMIN', 'ARCHITECT'].includes(currentUser.role)) {
          // Verificar se o usuário é owner do ADR
          const isOwner = await prisma.aDRParticipant.findFirst({
            where: {
              adrId: relation.adrId,
              userId: currentUser?.id,
              role: 'OWNER'
            }
          });

          if (!isOwner) {
            throw new Error('Permissão negada. Apenas administradores, arquitetos ou donos do ADR podem modificar instâncias.');
          }
        }

        // Preparar dados para atualização
        const updateData: any = {};
        if (input.impactLevel !== undefined) updateData.impactLevel = input.impactLevel;
        if (input.notes !== undefined) updateData.notes = input.notes;

        // Atualizar relação no MariaDB
        const updatedRelation = await prisma.aDRComponentInstance.update({
          ...query,
          where: { id },
          data: updateData,
        });

        // Atualizar no Neo4j
        await neo4j.run(`
          MATCH (a:ADR {id: $adrId})-[r:AFFECTS_INSTANCE]->(ci:ComponentInstance {id: $instanceId})
          SET r.impact_level = $impactLevel,
              r.notes = $notes
        `, {
          adrId: relation.adrId,
          instanceId: relation.instanceId,
          impactLevel: updatedRelation.impactLevel,
          notes: updatedRelation.notes
        });

        return updatedRelation;
      },
    })
  );

  // Mutation para remover uma relação ADR-instância
  builder.mutationField('removeADRComponentInstance', (t) =>
    t.prismaField({
      type: ADRComponentInstance,
      args: {
        id: t.arg.int({ required: true }),
      },
      resolve: async (query, _root, { id }, { prisma, currentUser }) => {
        // Buscar a relação atual
        const relation = await prisma.aDRComponentInstance.findUnique({
          where: { id },
          include: { 
            adr: true,
            instance: {
              include: {
                component: true
              }
            }
          }
        });

        if (!relation) {
          throw new Error(`Relação com ID ${id} não encontrada.`);
        }

        // Verificar permissões
        if (!currentUser || !['ADMIN', 'ARCHITECT'].includes(currentUser.role)) {
          // Verificar se o usuário é owner do ADR
          const isOwner = await prisma.aDRParticipant.findFirst({
            where: {
              adrId: relation.adrId,
              userId: currentUser?.id,
              role: 'OWNER'
            }
          });

          if (!isOwner) {
            throw new Error('Permissão negada. Apenas administradores, arquitetos ou donos do ADR podem remover instâncias.');
          }
        }

        // Armazenar dados para Neo4j antes de excluir
        const { adrId, instanceId } = relation;

        // Buscar a relação completa para retornar
        const relationToReturn = await prisma.aDRComponentInstance.findUniqueOrThrow({
          ...query,
          where: { id },
        });

        // Remover do Neo4j
        await neo4j.run(`
          MATCH (a:ADR {id: $adrId})-[r:AFFECTS_INSTANCE]->(ci:ComponentInstance {id: $instanceId})
          DELETE r
        `, { adrId, instanceId });

        // Remover do MariaDB
        await prisma.aDRComponentInstance.delete({
          where: { id },
        });

        // Verificar se há outras instâncias deste componente associadas ao ADR
        const otherInstances = await prisma.aDRComponentInstance.findFirst({
          where: {
            adrId,
            instance: {
              componentId: relation.instance.componentId
            }
          }
        });

        // Se não houver mais instâncias, considerar remover também a relação ADRComponent
        if (!otherInstances) {
          // Verificar se o usuário quer remover automaticamente a relação com o componente
          const adrComponent = await prisma.aDRComponent.findFirst({
            where: {
              adrId,
              componentId: relation.instance.componentId
            }
          });

          if (adrComponent) {
            await prisma.aDRComponent.delete({
              where: {
                id: adrComponent.id
              }
            });

            // Remover do Neo4j
            await neo4j.run(`
              MATCH (a:ADR {id: $adrId})-[r:AFFECTS]->(c:Component {id: $componentId})
              DELETE r
            `, { 
              adrId, 
              componentId: relation.instance.componentId 
            });
          }
        }

        return relationToReturn;
      },
    })
  );
}; 