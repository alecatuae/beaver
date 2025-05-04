import { ADR_status } from '@prisma/client';
import { builder } from '../schema';
import { prisma } from '../prisma';
import { Neo4jClient } from '../db/neo4j';
import * as neo4jDriver from 'neo4j-driver';
import { logger } from '../utils/logger';

// Inicializar Neo4j
const neo4j = neo4jDriver.driver(
  process.env.NEO4J_URL || 'bolt://localhost:7687',
  neo4jDriver.auth.basic(
    process.env.NEO4J_USER || 'neo4j',
    process.env.NEO4J_PASSWORD || 'beaver12345'
  )
);
const neo4jClient = new Neo4jClient(neo4j);

export const adrResolvers = (builder) => {
  // Definir o tipo ADR
  builder.prismaObject('ADR', {
    fields: (t) => ({
      id: t.exposeID('id'),
      title: t.exposeString('title'),
      description: t.exposeString('description'),
      status: t.expose('status', { type: 'ADRStatus' }),
      createdAt: t.expose('createdAt', { type: 'Date' }),
      
      // Relações
      tags: t.relation('tags'),
      participants: t.relation('participants'),
      componentInstances: t.relation('componentInstances'),
      components: t.relation('components'),
    }),
  });

  // Query para listar ADRs
  builder.queryField('adrs', (t) =>
    t.prismaField({
      type: ['ADR'],
      args: {
        status: t.arg({ type: 'ADRStatus' }),
        search: t.arg.string(),
        tag: t.arg.string(),
        componentId: t.arg.int(),
      },
      resolve: async (query, _root, args) => {
        const { status, search, tag, componentId } = args;
        
        const filters: any = {};
        
        if (status) filters.status = status;
        
        if (componentId) {
          filters.components = {
            some: {
              componentId
            }
          };
        }
        
        if (search) {
          filters.OR = [
            { title: { contains: search } },
            { description: { contains: search } },
          ];
        }
        
        if (tag) {
          filters.tags = {
            some: {
              tag: { contains: tag }
            }
          };
        }
        
        return prisma.ADR.findMany({
          ...query,
          where: filters,
          orderBy: { createdAt: 'desc' },
        });
      },
    })
  );

  // Query para buscar um ADR por ID
  builder.queryField('adr', (t) =>
    t.prismaField({
      type: 'ADR',
      nullable: true,
      args: {
        id: t.arg.int({ required: true }),
      },
      resolve: async (query, _root, { id }) => {
        return prisma.ADR.findUnique({
          ...query,
          where: { id },
        });
      },
    })
  );

  // Mutation para criar um ADR
  builder.mutationField('createADR', (t) =>
    t.prismaField({
      type: 'ADR',
      args: {
        title: t.arg.string({ required: true }),
        description: t.arg.string({ required: true }),
        status: t.arg({ type: 'ADRStatus' }),
        tags: t.arg.stringList(),
        participants: t.arg.list({
          type: 'ADRParticipantInput',
          required: false,
        }),
        components: t.arg.intList(), // IDs dos componentes
        componentInstances: t.arg.list({
          type: 'ADRComponentInstanceInput',
          required: false,
        }),
      },
      resolve: async (query, _root, args) => {
        const { title, description, tags, participants, components, componentInstances } = args;
        const status = args.status || ADR_status.DRAFT;

        // Verificar título duplicado
        const existingADR = await prisma.ADR.findFirst({
          where: { title },
        });

        if (existingADR) {
          throw new Error(`Já existe um ADR com o título "${title}"`);
        }

        // Criar o ADR no MariaDB
        const adr = await prisma.ADR.create({
          ...query,
          data: {
            title,
            description,
            status,
            ...(tags && tags.length > 0
              ? {
                  tags: {
                    createMany: {
                      data: tags.map((tag) => ({ tag })),
                    },
                  },
                }
              : {}),
            ...(participants && participants.length > 0
              ? {
                  participants: {
                    createMany: {
                      data: participants.map((p) => ({
                        userId: p.userId,
                        role: p.role,
                      })),
                    },
                  },
                }
              : {}),
            ...(components && components.length > 0
              ? {
                  components: {
                    createMany: {
                      data: components.map((componentId) => ({
                        componentId,
                      })),
                    },
                  },
                }
              : {}),
            ...(componentInstances && componentInstances.length > 0
              ? {
                  componentInstances: {
                    createMany: {
                      data: componentInstances.map((ci) => ({
                        instanceId: ci.instanceId,
                        impactLevel: ci.impactLevel,
                      })),
                    },
                  },
                }
              : {}),
          },
        });

        // Sincronizar com Neo4j
        try {
          // Criar nó ADR
          await neo4jClient.run(`
            CREATE (a:ADR {
              id: $id, 
              title: $title, 
              description: $description,
              status: $status,
              created_at: datetime()
            })
            RETURN a
          `, {
            id: adr.id,
            title: adr.title,
            description: adr.description,
            status: adr.status,
          });

          // Adicionar tags
          if (tags && tags.length > 0) {
            for (const tag of tags) {
              await neo4jClient.run(`
                MATCH (a:ADR {id: $adrId})
                SET a.tags = CASE 
                  WHEN a.tags IS NULL THEN [$tag] 
                  ELSE a.tags + $tag 
                END
              `, {
                adrId: adr.id,
                tag,
              });
            }
          }

          // Adicionar relações com componentes
          if (components && components.length > 0) {
            for (const componentId of components) {
              await neo4jClient.run(`
                MATCH (a:ADR {id: $adrId})
                MATCH (c:Component {id: $componentId})
                MERGE (a)-[:AFFECTS_COMPONENT]->(c)
              `, {
                adrId: adr.id,
                componentId,
              });
            }
          }

          // Adicionar relações com instâncias
          if (componentInstances && componentInstances.length > 0) {
            for (const ci of componentInstances) {
              await neo4jClient.run(`
                MATCH (a:ADR {id: $adrId})
                MATCH (ci:ComponentInstance {id: $instanceId})
                MERGE (a)-[:AFFECTS_INSTANCE {impact_level: $impactLevel}]->(ci)
              `, {
                adrId: adr.id,
                instanceId: ci.instanceId,
                impactLevel: ci.impactLevel,
              });
            }
          }

          // Adicionar participantes
          if (participants && participants.length > 0) {
            for (const p of participants) {
              await neo4jClient.run(`
                MATCH (a:ADR {id: $adrId})
                MATCH (u:User {id: $userId})
                MERGE (u)-[:PARTICIPATES_IN {role: $role}]->(a)
              `, {
                adrId: adr.id,
                userId: p.userId,
                role: p.role,
              });
            }
          }

          logger.info(`ADR ${adr.id} sincronizado com Neo4j`);
        } catch (error) {
          logger.error(`Erro ao sincronizar ADR com Neo4j: ${error}`);
          // Continuar mesmo com erro no Neo4j
        }

        return adr;
      },
    })
  );

  // Mutation para atualizar um ADR
  builder.mutationField('updateADR', (t) =>
    t.prismaField({
      type: 'ADR',
      args: {
        id: t.arg.int({ required: true }),
        title: t.arg.string(),
        description: t.arg.string(),
        status: t.arg({ type: 'ADRStatus' }),
        tags: t.arg.stringList(),
      },
      resolve: async (query, _root, args) => {
        const { id, title, description, status, tags } = args;

        // Verificar se o ADR existe
        const existingADR = await prisma.ADR.findUnique({
          where: { id },
          include: { tags: true },
        });

        if (!existingADR) {
          throw new Error(`ADR com ID ${id} não encontrado`);
        }

        // Verificar título duplicado
        if (title && title !== existingADR.title) {
          const duplicateTitle = await prisma.ADR.findFirst({
            where: {
              title,
              id: { not: id },
            },
          });

          if (duplicateTitle) {
            throw new Error(`Já existe um ADR com o título "${title}"`);
          }
        }

        // Atualizar tags se fornecidas
        if (tags) {
          // Remover tags existentes
          await prisma.aDRTag.deleteMany({
            where: { adrId: id },
          });

          // Adicionar novas tags
          if (tags.length > 0) {
            await prisma.aDRTag.createMany({
              data: tags.map((tag) => ({ adrId: id, tag })),
            });
          }
        }

        // Atualizar o ADR
        const updatedADR = await prisma.ADR.update({
          ...query,
          where: { id },
          data: {
            ...(title && { title }),
            ...(description !== undefined && { description }),
            ...(status && { status }),
          },
          include: {
            tags: true,
          },
        });

        // Sincronizar com Neo4j
        try {
          // Atualizar nó ADR
          await neo4jClient.run(`
            MATCH (a:ADR {id: $id})
            SET a.title = $title,
                a.description = $description,
                a.status = $status
          `, {
            id: updatedADR.id,
            title: updatedADR.title,
            description: updatedADR.description,
            status: updatedADR.status,
          });

          // Atualizar tags se fornecidas
          if (tags) {
            // Limpar tags existentes
            await neo4jClient.run(`
              MATCH (a:ADR {id: $id})
              SET a.tags = []
            `, { id });

            // Adicionar novas tags
            if (tags.length > 0) {
              for (const tag of tags) {
                await neo4jClient.run(`
                  MATCH (a:ADR {id: $adrId})
                  SET a.tags = CASE 
                    WHEN a.tags IS NULL THEN [$tag] 
                    ELSE a.tags + $tag 
                  END
                `, {
                  adrId: id,
                  tag,
                });
              }
            }
          }

          logger.info(`ADR ${id} atualizado no Neo4j`);
        } catch (error) {
          logger.error(`Erro ao atualizar ADR no Neo4j: ${error}`);
          // Continuar mesmo com erro no Neo4j
        }

        return updatedADR;
      },
    })
  );

  // Mutation para excluir um ADR
  builder.mutationField('deleteADR', (t) =>
    t.boolean({
      args: {
        id: t.arg.int({ required: true }),
      },
      resolve: async (_root, { id }) => {
        // Verificar se o ADR existe
        const adr = await prisma.ADR.findUnique({
          where: { id },
        });

        if (!adr) {
          throw new Error(`ADR com ID ${id} não encontrado`);
        }

        // Excluir do MariaDB (cascata para tags, participants, etc)
        await prisma.ADR.delete({
          where: { id },
        });

        // Excluir do Neo4j
        try {
          // Remover relações entre nós no Neo4j
          await neo4jClient.run(`
            MATCH (a:ADR {id: $id})
            OPTIONAL MATCH (a)-[r]-()
            DELETE r
          `, { id });

          // Remover o nó ADR
          await neo4jClient.run(`
            MATCH (a:ADR {id: $id})
            DELETE a
          `, { id });

          logger.info(`ADR ${id} removido do Neo4j`);
        } catch (error) {
          logger.error(`Erro ao remover ADR do Neo4j: ${error}`);
          // Continuar mesmo com erro no Neo4j
        }

        return true;
      },
    })
  );

  // Mutation para adicionar uma tag ao ADR
  builder.mutationField('addADRTag', (t) =>
    t.prismaField({
      type: 'ADR',
      args: {
        adrId: t.arg.int({ required: true }),
        tag: t.arg.string({ required: true }),
      },
      resolve: async (query, _root, { adrId, tag }) => {
        // Verificar se o ADR existe
        const adr = await prisma.ADR.findUnique({
          where: { id: adrId },
        });

        if (!adr) {
          throw new Error(`ADR com ID ${adrId} não encontrado`);
        }

        // Verificar se a tag já existe
        const existingTag = await prisma.aDRTag.findFirst({
          where: {
            adrId,
            tag,
          },
        });

        if (existingTag) {
          throw new Error(`Tag "${tag}" já existe para este ADR`);
        }

        // Adicionar a tag
        await prisma.aDRTag.create({
          data: {
            adrId,
            tag,
          },
        });

        // Atualizar Neo4j
        try {
          await neo4jClient.run(`
            MATCH (a:ADR {id: $adrId})
            SET a.tags = CASE 
              WHEN a.tags IS NULL THEN [$tag] 
              ELSE a.tags + $tag 
            END
          `, {
            adrId,
            tag,
          });
          logger.info(`Tag "${tag}" adicionada ao ADR ${adrId} no Neo4j`);
        } catch (error) {
          logger.error(`Erro ao adicionar tag ao ADR no Neo4j: ${error}`);
          // Continuar mesmo com erro no Neo4j
        }

        // Retornar o ADR atualizado
        return prisma.ADR.findUnique({
          ...query,
          where: { id: adrId },
        });
      },
    })
  );

  // Mutation para remover uma tag do ADR
  builder.mutationField('removeADRTag', (t) =>
    t.prismaField({
      type: 'ADR',
      args: {
        adrId: t.arg.int({ required: true }),
        tagId: t.arg.int({ required: true }),
      },
      resolve: async (query, _root, { adrId, tagId }) => {
        // Verificar se o ADR existe
        const adr = await prisma.ADR.findUnique({
          where: { id: adrId },
        });

        if (!adr) {
          throw new Error(`ADR com ID ${adrId} não encontrado`);
        }

        // Buscar a tag
        const tag = await prisma.aDRTag.findUnique({
          where: { id: tagId },
        });

        if (!tag) {
          throw new Error(`Tag com ID ${tagId} não encontrada`);
        }

        if (tag.adrId !== adrId) {
          throw new Error(`Tag com ID ${tagId} não pertence ao ADR ${adrId}`);
        }

        // Remover a tag
        await prisma.aDRTag.delete({
          where: { id: tagId },
        });

        // Atualizar Neo4j
        try {
          await neo4jClient.run(`
            MATCH (a:ADR {id: $adrId})
            SET a.tags = [tag IN a.tags WHERE tag <> $tagValue]
          `, {
            adrId,
            tagValue: tag.tag,
          });
          logger.info(`Tag "${tag.tag}" removida do ADR ${adrId} no Neo4j`);
        } catch (error) {
          logger.error(`Erro ao remover tag do ADR no Neo4j: ${error}`);
          // Continuar mesmo com erro no Neo4j
        }

        // Retornar o ADR atualizado
        return prisma.ADR.findUnique({
          ...query,
          where: { id: adrId },
        });
      },
    })
  );
}; 