import { ComponentStatus } from '@prisma/client';
import { logger } from '../utils/logger';
import { prisma } from '../prisma';
import { PaginationInputType, PageInfo, createPaginatedResponse } from '../schema/objects/pagination';
import { Component } from '../schema/objects/component';

export const componentResolvers = (builder: any) => {
  // Define o enumerador ComponentStatus
  const ComponentStatusEnum = builder.enumType('ComponentStatus', {
    values: Object.values(ComponentStatus) as [string, ...string[]],
  });

  // Define o tipo Category
  const Category = builder.objectType('Category', {
    fields: (t: any) => ({
      id: t.field({
        type: 'Int',
        resolve: (parent: any) => parent.id,
      }),
      name: t.field({
        type: 'String',
        resolve: (parent: any) => parent.name,
      }),
      description: t.field({
        type: 'String',
        nullable: true,
        resolve: (parent: any) => parent.description,
      }),
      image: t.field({
        type: 'String',
        nullable: true,
        resolve: (parent: any) => parent.image // Agora é um caminho de string, não um Buffer
      }),
      createdAt: t.field({
        type: 'Date',
        resolve: (parent: any) => parent.createdAt || new Date(),
      }),
      components: t.field({
        type: ['Component'],
        resolve: async (parent: any, _args: any, ctx: any) => {
          const rawComponents = await ctx.prisma.$queryRaw`
            SELECT id, name, description, status, category_id as categoryId, created_at as createdAt 
            FROM Component WHERE category_id = ${parent.id}
          `;
          return rawComponents;
        }
      }),
    }),
  });

  // Define o tipo ComponentTag
  const ComponentTag = builder.objectType('ComponentTag', {
    fields: (t: any) => ({
      id: t.field({
        type: 'Int',
        resolve: (parent: any) => parent.id,
      }),
      componentId: t.field({
        type: 'Int',
        nullable: true,
        resolve: (parent: any) => parent.componentId,
      }),
      tag: t.field({
        type: 'String',
        resolve: (parent: any) => parent.tag,
      }),
      component: t.field({
        type: 'Component',
        nullable: true,
        resolve: async (parent: any, _args: any, ctx: any) => {
          if (!parent.componentId) return null;
          
          const rawComponents = await ctx.prisma.$queryRaw`
            SELECT id, name, description, status, category_id as categoryId, created_at as createdAt 
            FROM Component WHERE id = ${parent.componentId}
          `;
          
          return rawComponents.length > 0 ? rawComponents[0] : null;
        }
      }),
    }),
  });

  // Define o tipo Component
  const Component = builder.objectType('Component', {
    fields: (t: any) => ({
      id: t.field({
        type: 'Int',
        resolve: (parent: any) => parent.id,
      }),
      name: t.field({
        type: 'String',
        resolve: (parent: any) => parent.name,
      }),
      description: t.field({
        type: 'String',
        nullable: true,
        resolve: (parent: any) => parent.description,
      }),
      status: t.field({
        type: 'String',
        resolve: (parent: any) => {
          // Garantir que o status sempre seja retornado em maiúsculas
          const status = parent.status || 'ACTIVE';
          return status.toUpperCase();
        },
      }),
      categoryId: t.field({
        type: 'Int',
        nullable: true,
        resolve: (parent: any) => parent.categoryId,
      }),
      category: t.field({
        type: Category,
        nullable: true,
        resolve: async (parent: any, _args: any, ctx: any) => {
          if (!parent.categoryId) return null;
          
          return await ctx.prisma.category.findUnique({
            where: { id: parent.categoryId }
          });
        }
      }),
      createdAt: t.field({
        type: 'Date',
        resolve: (parent: any) => {
          // Garante que createdAt nunca retorne null
          return parent.createdAt || new Date();
        },
      }),
      tags: t.field({
        type: [ComponentTag],
        resolve: async (parent: any, _args: any, ctx: any) => {
          return ctx.prisma.componentTag.findMany({
            where: { componentId: parent.id }
          });
        }
      }),
    }),
  });

  // Define o tipo ComponentRelation do Neo4j
  const ComponentRelation = builder.objectType('ComponentRelation', {
    fields: (t: any) => ({
      id: t.string(),
      sourceId: t.int(),
      targetId: t.int(),
      type: t.string(),
      properties: t.field({
        type: 'JSON',
        resolve: (parent: any) => parent.properties || {},
      }),
    }),
  });

  // GraphNode para visualização do grafo
  const GraphNode = builder.objectType('GraphNode', {
    fields: (t: any) => ({
      id: t.string(),
      name: t.string(),
      description: t.string({ nullable: true }),
      type: t.string(),
      validFrom: t.string({ nullable: true }),
      validTo: t.string({ nullable: true }),
    }),
  });

  // GraphEdge para visualização do grafo
  const GraphEdge = builder.objectType('GraphEdge', {
    fields: (t: any) => ({
      id: t.string(),
      source: t.string(),
      target: t.string(),
      label: t.string(),
      properties: t.field({
        type: 'JSON',
        resolve: (parent: any) => parent.properties || {},
      }),
    }),
  });

  // GraphData para visualização do grafo
  const GraphData = builder.objectType('GraphData', {
    fields: (t: any) => ({
      nodes: t.field({ type: [GraphNode] }),
      edges: t.field({ type: [GraphEdge] }),
    }),
  });

  // Input para criação/atualização de componente
  const ComponentInput = builder.inputType('ComponentInput', {
    fields: (t: any) => ({
      name: t.string({ required: true }),
      description: t.string(),
      status: t.field({ type: ComponentStatusEnum }),
      categoryId: t.int(),
      tags: t.field({ type: ['String'] }),
    }),
  });

  // Criar o tipo de resposta paginada para componentes
  const PaginatedComponentsResponse = createPaginatedResponse('Component', Component);

  // Atualizar a query para componentes com suporte a paginação
  builder.queryField('components', (t) =>
    t.field({
      type: PaginatedComponentsResponse,
      args: {
        status: t.arg({ type: ComponentStatusEnum, required: false }),
        pagination: t.arg({ type: PaginationInputType, required: false }),
        environmentId: t.arg.int({ required: false }),
        search: t.arg.string({ required: false }),
        categoryId: t.arg.int({ required: false }),
        teamId: t.arg.int({ required: false }),
      },
      resolve: async (_root, args, { prisma }) => {
        // Valores padrão para paginação
        const {
          pagination = { page: 1, pageSize: 20, sortOrder: 'desc', sortField: 'createdAt' }
        } = args;
        
        const page = pagination.page || 1;
        const pageSize = pagination.pageSize || 20;
        const skip = (page - 1) * pageSize;
        const take = pageSize;
        
        // Construir o objeto where baseado nos parâmetros
        const where: any = {};
        
        if (args.status) {
          where.status = args.status;
        }
        
        if (args.search) {
          where.OR = [
            { name: { contains: args.search, mode: 'insensitive' } },
            { description: { contains: args.search, mode: 'insensitive' } },
          ];
        }
        
        if (args.categoryId) {
          where.categoryId = args.categoryId;
        }
        
        if (args.teamId) {
          where.teamId = args.teamId;
        }
        
        if (args.environmentId) {
          where.instances = {
            some: {
              environmentId: args.environmentId
            }
          };
        }
        
        // Determinando a ordenação
        const sortField = pagination.sortField || 'createdAt';
        const sortOrder = pagination.sortOrder || 'desc';
        const orderBy: any = {};
        orderBy[sortField] = sortOrder;
        
        // Buscar o total de itens para calcular a paginação
        const totalItems = await prisma.component.count({ where });
        
        // Buscar os componentes com paginação
        const items = await prisma.component.findMany({
          where,
          skip,
          take,
          orderBy,
          include: {
            team: true,
            category: true,
            instances: {
              include: {
                environment: true
              }
            }
          }
        });
        
        // Calcular informações de paginação
        const totalPages = Math.ceil(totalItems / pageSize);
        
        return {
          items,
          pageInfo: {
            totalItems,
            currentPage: page,
            pageSize,
            totalPages,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1
          }
        };
      resolve: async (_root: any, args: any, ctx: any) => {
        try {
          console.log('Buscando componentes do banco de dados...');
          
          // Normaliza o status para maiúsculas se fornecido
          const status = args.status ? args.status.toUpperCase() : null;
          const categoryId = args.categoryId || null;
          
          console.log(`Status solicitado: ${status || 'TODOS'}`);
          console.log(`Categoria solicitada: ${categoryId || 'TODAS'}`);
          
          // Usa raw query para evitar problemas com enum
          let rawComponents;
          
          if (status && categoryId) {
            rawComponents = await ctx.prisma.$queryRaw`
              SELECT id, name, description, status, category_id as categoryId, created_at as createdAt FROM Component 
              WHERE status = ${status} AND category_id = ${categoryId}
            `;
          } else if (status) {
            rawComponents = await ctx.prisma.$queryRaw`
              SELECT id, name, description, status, category_id as categoryId, created_at as createdAt FROM Component 
              WHERE status = ${status}
            `;
          } else if (categoryId) {
            rawComponents = await ctx.prisma.$queryRaw`
              SELECT id, name, description, status, category_id as categoryId, created_at as createdAt FROM Component 
              WHERE category_id = ${categoryId}
            `;
          } else {
            rawComponents = await ctx.prisma.$queryRaw`
              SELECT id, name, description, status, category_id as categoryId, created_at as createdAt FROM Component
            `;
          }
          
          console.log(`Encontrados ${rawComponents.length} componentes`);
          
          // Mapeamento para o formato esperado pelo tipo Component
          return rawComponents;
        } catch (error: any) {
          console.error('Erro detalhado ao buscar componentes:', error);
          throw new Error(`Erro ao carregar os componentes: ${error.message}`);
        }
      },
    })
  );

  // Query para buscar componente por ID
  builder.queryField('component', (t: any) =>
    t.field({
      type: Component,
      nullable: true,
      args: {
        id: t.arg.int({ required: true }),
      },
      resolve: async (_root: any, args: any, ctx: any) => {
        try {
          // Usa raw query para evitar problemas com enum
          const rawComponents = await ctx.prisma.$queryRaw`
            SELECT id, name, description, status, category_id as categoryId, created_at as createdAt 
            FROM Component WHERE id = ${args.id}
          `;
          
          if (rawComponents.length === 0) {
            return null;
          }
          
          return rawComponents[0];
        } catch (error: any) {
          console.error(`Erro ao buscar componente com ID ${args.id}:`, error);
          throw new Error(`Erro ao carregar o componente: ${error.message}`);
        }
      },
    })
  );

  // Query para obter dados do grafo
  builder.queryField('graphData', (t: any) =>
    t.field({
      type: GraphData,
      args: {
        depth: t.arg.int({ defaultValue: 2 }),
      },
      resolve: async (_root: any, args: any, ctx: any) => {
        const depth = args.depth || 2;
        
        // Consulta Neo4j para obter nós e arestas
        const query = `
          MATCH path = (c:Component)-[r*0..${depth}]-(related)
          WITH nodes(path) as nodes, relationships(path) as rels
          UNWIND nodes as node
          WITH collect(distinct node) as allNodes, rels
          UNWIND rels as rel
          RETURN allNodes, collect(distinct rel) as allRels
        `;
        
        try {
          const result = await ctx.neo4j.run(query);
          
          if (!result.length) {
            return { nodes: [], edges: [] };
          }
          
          const data = result[0];
          const nodes = data.allNodes.map((node: any) => ({
            id: String(node.id),
            name: node.name,
            description: node.description,
            type: Array.isArray(node.labels) ? node.labels[0] : 'Node',
            validFrom: node.validFrom,
            validTo: node.validTo,
          }));
          
          const edges = data.allRels.map((rel: any) => ({
            id: rel.id,
            source: String(rel.startNodeId),
            target: String(rel.endNodeId),
            label: rel.type,
            properties: rel.properties,
          }));
          
          return { nodes, edges };
        } catch (error: any) {
          console.error('Erro ao obter dados do grafo:', error);
          throw new Error(`Erro ao obter dados do grafo: ${error.message}`);
        }
      },
    })
  );

  // Mutation para criar componente
  builder.mutationField('createComponent', (t: any) =>
    t.field({
      type: Component,
      args: {
        input: t.arg({ type: ComponentInput, required: true }),
      },
      resolve: async (_root: any, args: any, ctx: any) => {
        try {
          const { name, description, status, categoryId, tags } = args.input;
          
          // Cria o componente no MariaDB
          const component = await ctx.prisma.$queryRaw`
            INSERT INTO Component (name, description, status, category_id) 
            VALUES (${name}, ${description}, 'ACTIVE', ${categoryId || null})
          `;
          
          // Busca o componente que acabou de ser criado
          const rawComponents = await ctx.prisma.$queryRaw`
            SELECT id, name, description, status, category_id as categoryId, created_at as createdAt 
            FROM Component 
            WHERE name = ${name}
            ORDER BY id DESC 
            LIMIT 1
          `;
          
          if (!rawComponents.length) {
            throw new Error('Componente foi criado mas não pode ser recuperado');
          }
          
          const createdComponent = rawComponents[0];
          
          // Cria as tags, se fornecidas
          if (tags && tags.length > 0) {
            for (const tag of tags) {
              await ctx.prisma.componentTag.create({
                data: {
                  componentId: createdComponent.id,
                  tag
                }
              });
            }
          }
          
          // Cria o nó correspondente no Neo4j
          await ctx.neo4j.upsertComponent({
            id: createdComponent.id,
            name: createdComponent.name,
            description: createdComponent.description,
            validFrom: new Date().toISOString(),
            validTo: '9999-12-31T23:59:59Z'
          });
          
          await ctx.prisma.log.create({
            data: {
              userId: ctx.user?.id,
              action: `Criou componente ${name}`,
            },
          });
          
          return {
            id: createdComponent.id,
            name: createdComponent.name,
            description: createdComponent.description,
            status: createdComponent.status,
            categoryId: createdComponent.categoryId,
            createdAt: createdComponent.createdAt,
          };
        } catch (error: any) {
          console.error('Erro ao criar componente:', error);
          throw new Error(`Erro ao criar componente: ${error.message}`);
        }
      },
    })
  );

  // Mutation para atualizar componente
  builder.mutationField('updateComponent', (t: any) =>
    t.field({
      type: Component,
      args: {
        id: t.arg.int({ required: true }),
        input: t.arg({ type: ComponentInput, required: true }),
      },
      resolve: async (_root: any, args: any, ctx: any) => {
        try {
          const { id } = args;
          const { name, description, status, categoryId, tags } = args.input;
          
          // Verifica se o componente existe
          const components = await ctx.prisma.$queryRaw`
            SELECT id, name, description, status, category_id as categoryId, created_at as createdAt
            FROM Component WHERE id = ${id}
          `;
          
          if (!components.length) {
            throw new Error(`Componente com ID ${id} não encontrado`);
          }
          
          // Atualiza o componente no MariaDB
          let query = `
            UPDATE Component 
            SET 
              name = ?,
              description = ?
          `;
          
          const params = [name, description || null];
          
          if (status) {
            query += `, status = ?`;
            params.push(status);
          }
          
          query += `, category_id = ? WHERE id = ?`;
          params.push(categoryId || null, id);
          
          await ctx.prisma.$executeRawUnsafe(query, ...params);
          
          // Busca o componente atualizado
          const updatedComponents = await ctx.prisma.$queryRaw`
            SELECT id, name, description, status, category_id as categoryId, created_at as createdAt
            FROM Component WHERE id = ${id}
          `;
          
          if (!updatedComponents.length) {
            throw new Error(`Componente atualizado não pode ser recuperado`);
          }
          
          const updatedComponent = updatedComponents[0];
          
          // Se tags foram fornecidas, atualiza as tags
          if (tags !== undefined) {
            // Remove as tags existentes
            await ctx.prisma.componentTag.deleteMany({
              where: { componentId: id },
            });
            
            // Adiciona as novas tags
            if (tags.length > 0) {
              for (const tag of tags) {
                await ctx.prisma.componentTag.create({
                  data: {
                    componentId: id,
                    tag
                  }
                });
              }
            }
          }
          
          // Atualiza o nó no Neo4j
          await ctx.neo4j.upsertComponent({
            id: updatedComponent.id,
            name: updatedComponent.name,
            description: updatedComponent.description,
            validFrom: new Date().toISOString(),
            validTo: '9999-12-31T23:59:59Z'
          });
          
          await ctx.prisma.log.create({
            data: {
              userId: ctx.user?.id,
              action: `Atualizou componente ${name}`,
            },
          });
          
          return {
            id: updatedComponent.id,
            name: updatedComponent.name,
            description: updatedComponent.description,
            status: updatedComponent.status,
            categoryId: updatedComponent.categoryId,
            createdAt: updatedComponent.createdAt,
          };
        } catch (error: any) {
          console.error(`Erro ao atualizar componente com ID ${args.id}:`, error);
          throw new Error(`Erro ao atualizar componente: ${error.message}`);
        }
      },
    })
  );

  // Mutation para excluir componente
  builder.mutationField('deleteComponent', (t: any) =>
    t.field({
      type: 'Boolean',
      args: {
        id: t.arg.int({ required: true }),
      },
      resolve: async (_root: any, args: any, ctx: any) => {
        try {
          const { id } = args;
          
          // Verifica se o componente existe
          const components = await ctx.prisma.$queryRaw`
            SELECT id, name, description, status, category_id as categoryId, created_at as createdAt 
            FROM Component WHERE id = ${id}
          `;
          
          if (!components.length) {
            throw new Error(`Componente com ID ${id} não encontrado`);
          }
          
          const component = components[0];
          
          // Remove as tags associadas
          await ctx.prisma.$executeRaw`DELETE FROM ComponentTag WHERE component_id = ${id}`;
          
          // Remove o componente
          await ctx.prisma.$executeRaw`DELETE FROM Component WHERE id = ${id}`;
          
          // Remove o nó correspondente no Neo4j
          await ctx.neo4j.deleteNode('Component', id);
          
          await ctx.prisma.log.create({
            data: {
              userId: ctx.user?.id,
              action: `Excluiu componente ${component.name}`,
            },
          });
          
          return true;
        } catch (error: any) {
          console.error(`Erro ao excluir componente com ID ${args.id}:`, error);
          throw new Error(`Erro ao excluir componente: ${error.message}`);
        }
      },
    })
  );

  // Queries para instâncias de componentes
  builder.queryField('componentInstance', (t) =>
    t.prismaField({
      type: 'ComponentInstance',
      args: {
        id: t.arg.int({ required: true }),
      },
      resolve: async (query, _root, { id }, { prisma }) => {
        return prisma.componentInstance.findUniqueOrThrow({
          ...query,
          where: { id },
        });
      },
    })
  );

  builder.queryField('componentInstances', (t) =>
    t.prismaField({
      type: ['ComponentInstance'],
      args: {
        componentId: t.arg.int({ required: false }),
        environmentId: t.arg.int({ required: false }),
        skip: t.arg.int({ required: false }),
        take: t.arg.int({ required: false }),
      },
      resolve: async (query, _root, { componentId, environmentId, skip, take }, { prisma }) => {
        const where: any = {};
        
        if (componentId) {
          where.componentId = componentId;
        }
        
        if (environmentId) {
          where.environmentId = environmentId;
        }
        
        return prisma.componentInstance.findMany({
          ...query,
          where,
          skip,
          take: take ?? 50,
          orderBy: { id: 'asc' },
        });
      },
    })
  );

  // Mutations para instâncias de componentes
  builder.mutationField('createComponentInstance', (t) =>
    t.prismaField({
      type: 'ComponentInstance',
      args: {
        input: t.arg({ 
          type: 'ComponentInstanceInput',
          required: true 
        }),
      },
      resolve: async (query, _root, { input }, { prisma }) => {
        // Verificar se o componente existe
        const component = await prisma.component.findUnique({
          where: { id: input.componentId },
        });

        if (!component) {
          throw new Error(`Componente com ID ${input.componentId} não encontrado.`);
        }

        // Verificar se o ambiente existe
        const environment = await prisma.environment.findUnique({
          where: { id: input.environmentId },
        });

        if (!environment) {
          throw new Error(`Ambiente com ID ${input.environmentId} não encontrado.`);
        }

        // Verificar se já existe uma instância deste componente neste ambiente
        const existingInstance = await prisma.componentInstance.findFirst({
          where: {
            componentId: input.componentId,
            environmentId: input.environmentId,
          },
        });

        if (existingInstance) {
          throw new Error(`Já existe uma instância deste componente neste ambiente.`);
        }

        return prisma.componentInstance.create({
          ...query,
          data: {
            componentId: input.componentId,
            environmentId: input.environmentId,
            hostname: input.hostname,
            specs: input.specs,
          },
        });
      },
    })
  );

  builder.mutationField('updateComponentInstance', (t) =>
    t.prismaField({
      type: 'ComponentInstance',
      args: {
        id: t.arg.int({ required: true }),
        input: t.arg({ 
          type: 'ComponentInstanceUpdateInput',
          required: true 
        }),
      },
      resolve: async (query, _root, { id, input }, { prisma }) => {
        return prisma.componentInstance.update({
          ...query,
          where: { id },
          data: {
            hostname: input.hostname,
            specs: input.specs,
          },
        });
      },
    })
  );

  builder.mutationField('deleteComponentInstance', (t) =>
    t.prismaField({
      type: 'ComponentInstance',
      args: {
        id: t.arg.int({ required: true }),
      },
      resolve: async (query, _root, { id }, { prisma }) => {
        // Verificar se a instância existe
        const instance = await prisma.componentInstance.findUnique({
          where: { id },
        });

        if (!instance) {
          throw new Error(`Instância com ID ${id} não encontrada.`);
        }

        // Verificar se existem ADRs associados a esta instância
        const adrCount = await prisma.aDRComponentInstance.count({
          where: { instanceId: id },
        });

        if (adrCount > 0) {
          // Excluir as relações ADR -> Instância antes
          await prisma.aDRComponentInstance.deleteMany({
            where: { instanceId: id },
          });
        }

        return prisma.componentInstance.delete({
          ...query,
          where: { id },
        });
      },
    })
  );
}; 