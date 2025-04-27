import { ComponentStatus } from '@prisma/client';
import { logger } from '../utils/logger';

export const componentResolvers = (builder: any) => {
  // Define o enumerador ComponentStatus
  const ComponentStatusEnum = builder.enumType('ComponentStatus', {
    values: Object.values(ComponentStatus) as [string, ...string[]],
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
        type: Component,
        nullable: true,
        resolve: async (parent: any, _args: any, ctx: any) => {
          if (!parent.componentId) return null;
          
          const rawComponents = await ctx.prisma.$queryRaw`
            SELECT id, name, description, status, created_at as createdAt 
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
        resolve: (parent: any) => parent.status,
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
      tags: t.stringList(),
    }),
  });

  // Input para criação de relação entre componentes
  const RelationInput = builder.inputType('RelationInput', {
    fields: (t: any) => ({
      sourceId: t.int({ required: true }),
      targetId: t.int({ required: true }),
      type: t.string({ required: true }),
      properties: t.field({ type: 'JSON' }),
    }),
  });

  // Query para listar componentes
  builder.queryField('components', (t: any) =>
    t.field({
      type: [Component],
      args: {
        status: t.arg.string(),
      },
      resolve: async (_root: any, args: any, ctx: any) => {
        try {
          console.log('Buscando componentes do banco de dados...');
          
          // Normaliza o status para maiúsculas se fornecido
          const status = args.status ? args.status.toUpperCase() : null;
          console.log(`Status solicitado: ${status || 'TODOS'}`);
          
          // Usa raw query para evitar problemas com enum
          let rawComponents;
          if (status === 'ACTIVE') {
            rawComponents = await ctx.prisma.$queryRaw`
              SELECT id, name, description, status, created_at as createdAt FROM Component WHERE status = 'ACTIVE'
            `;
          } else if (status === 'INACTIVE') {
            rawComponents = await ctx.prisma.$queryRaw`
              SELECT id, name, description, status, created_at as createdAt FROM Component WHERE status = 'INACTIVE'
            `;
          } else if (status === 'DEPRECATED') {
            rawComponents = await ctx.prisma.$queryRaw`
              SELECT id, name, description, status, created_at as createdAt FROM Component WHERE status = 'DEPRECATED'
            `;
          } else {
            rawComponents = await ctx.prisma.$queryRaw`
              SELECT id, name, description, status, created_at as createdAt FROM Component
            `;
          }
          
          console.log(`Encontrados ${rawComponents.length} componentes`);
          
          // Mapeamento para o formato esperado pelo tipo Component
          return rawComponents;
        } catch (error) {
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
            SELECT id, name, description, status, created_at as createdAt FROM Component WHERE id = ${args.id}
          `;
          
          if (rawComponents.length === 0) {
            return null;
          }
          
          return rawComponents[0];
        } catch (error) {
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
            validFrom: node.valid_from,
            validTo: node.valid_to,
          }));
          
          const edges = data.allRels.map((rel: any, index: number) => ({
            id: `e${index}`,
            source: String(rel.startNodeId),
            target: String(rel.endNodeId),
            label: rel.type,
            properties: rel.properties,
          }));
          
          return { nodes, edges };
        } catch (error) {
          logger.error(`Erro ao buscar dados do grafo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
          throw new Error('Erro ao buscar dados do grafo');
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
        // Descomente esta verificação em produção
        // if (!ctx.userId) {
        //   throw new Error('Não autorizado');
        // }
        
        const { name, description, tags } = args.input;
        // Sempre definimos o status como 'ACTIVE' para evitar problemas
        const status = 'ACTIVE';
        
        try {
          // Cria o componente no MariaDB com SQL bruto
          await ctx.prisma.$queryRaw`
            INSERT INTO Component (name, description, status) 
            VALUES (${name}, ${description}, ${status})
          `;
          
          // Busca o componente que acabou de ser criado
          const rawComponents = await ctx.prisma.$queryRaw`
            SELECT id, name, description, status, created_at as createdAt 
            FROM Component 
            WHERE name = ${name} AND status = ${status}
            ORDER BY id DESC 
            LIMIT 1
          `;
          
          if (!rawComponents.length) {
            throw new Error('Componente foi criado mas não pode ser recuperado');
          }
          
          const createdComponent = rawComponents[0];
          
          // Adiciona tags ao componente se necessário
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
          
          // Atualiza o Neo4j
          await ctx.neo4j.upsertComponent({
            id: createdComponent.id,
            name: createdComponent.name,
            description: createdComponent.description,
          });
          
          logger.info(`Componente criado com queryRaw: ${name}`);
          
          return {
            ...createdComponent,
            id: String(createdComponent.id) // Converte ID para string conforme esperado pelo tipo
          };
        } catch (error) {
          console.error('Erro ao criar componente com queryRaw:', error);
          throw new Error(`Falha ao criar componente: ${error.message}`);
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
        // Descomente esta verificação em produção
        // if (!ctx.userId) {
        //   throw new Error('Não autorizado');
        // }
        
        const { id } = args;
        const { name, description, tags } = args.input;
        // Sempre definimos o status como 'ACTIVE' para evitar problemas
        const status = 'ACTIVE';
        
        try {
          // Atualiza o componente no MariaDB com SQL bruto
          await ctx.prisma.$queryRaw`
            UPDATE Component 
            SET name = ${name}, description = ${description}, status = ${status}
            WHERE id = ${id}
          `;
          
          // Busca o componente atualizado
          const rawComponents = await ctx.prisma.$queryRaw`
            SELECT id, name, description, status, created_at as createdAt 
            FROM Component WHERE id = ${id}
          `;
          
          if (!rawComponents.length) {
            throw new Error('Componente não foi encontrado após atualização');
          }
          
          const updatedComponent = rawComponents[0];
          
          // Atualiza as tags se necessário
          if (tags) {
            // Remove tags existentes
            await ctx.prisma.componentTag.deleteMany({
              where: { componentId: id }
            });
            
            // Adiciona novas tags
            for (const tag of tags) {
              await ctx.prisma.componentTag.create({
                data: {
                  componentId: id,
                  tag
                }
              });
            }
          }
          
          // Atualiza o Neo4j
          await ctx.neo4j.upsertComponent({
            id: updatedComponent.id,
            name: updatedComponent.name,
            description: updatedComponent.description,
          });
          
          logger.info(`Componente atualizado com queryRaw: ${name}`);
          
          return {
            ...updatedComponent,
            id: String(updatedComponent.id) // Converte ID para string conforme esperado pelo tipo
          };
        } catch (error) {
          console.error('Erro ao atualizar componente com queryRaw:', error);
          throw new Error(`Falha ao atualizar componente: ${error.message}`);
        }
      },
    })
  );

  // Mutation para criar relação entre componentes
  builder.mutationField('createRelation', (t: any) =>
    t.field({
      type: ComponentRelation,
      args: {
        input: t.arg({ type: RelationInput, required: true }),
      },
      resolve: async (_root: any, args: any, ctx: any) => {
        // Descomente esta verificação em produção
        // if (!ctx.userId) {
        //   throw new Error('Não autorizado');
        // }
        
        const { sourceId, targetId, type, properties } = args.input;
        
        // Verifica se os componentes existem
        const source = await ctx.prisma.component.findUnique({
          where: { id: sourceId },
        });
        
        const target = await ctx.prisma.component.findUnique({
          where: { id: targetId },
        });
        
        if (!source || !target) {
          throw new Error('Componente não encontrado');
        }
        
        // Cria a relação no Neo4j
        const relation = await ctx.neo4j.createRelationship(
          sourceId,
          targetId,
          type,
          properties || {}
        );
        
        logger.info(`Relação criada: ${source.name} -> ${target.name} (${type})`);
        
        return {
          id: `rel-${Date.now()}`,
          sourceId,
          targetId,
          type,
          properties: properties || {},
        };
      },
    })
  );

  // Mutation para excluir componente
  builder.mutationField('deleteComponent', (t: any) =>
    t.field({
      type: Component,
      args: {
        id: t.arg.int({ required: true }),
      },
      resolve: async (_root: any, args: any, ctx: any) => {
        try {
          const { id } = args;
          console.log(`Tentando excluir componente com ID ${id}`);
          
          // Verifica se o componente existe
          const componentes = await ctx.prisma.$queryRaw`
            SELECT id, name, description, status, created_at as createdAt 
            FROM Component WHERE id = ${id}
          `;
          
          console.log(`Resultado da busca:`, componentes);
          
          if (!componentes || componentes.length === 0) {
            console.error(`Componente com ID ${id} não encontrado`);
            throw new Error('Componente não encontrado');
          }
          
          const component = componentes[0];
          console.log(`Componente encontrado:`, component);
          
          // Busca as tags do componente para verificação
          const tags = await ctx.prisma.$queryRaw`
            SELECT * FROM ComponentTag WHERE component_id = ${id}
          `;
          console.log(`Tags encontradas: ${tags.length}`);
          
          // Exclui as tags do componente do MariaDB
          const deleteTagsResult = await ctx.prisma.$executeRaw`
            DELETE FROM ComponentTag WHERE component_id = ${id}
          `;
          console.log(`Tags excluídas: ${deleteTagsResult}`);
          
          // Exclui o componente do MariaDB
          const deleteComponentResult = await ctx.prisma.$executeRaw`
            DELETE FROM Component WHERE id = ${id}
          `;
          console.log(`Resultado da exclusão do componente: ${deleteComponentResult}`);
          
          if (deleteComponentResult === 0) {
            throw new Error(`Falha ao excluir o componente com ID ${id}`);
          }
          
          // Exclui o componente e suas relações do Neo4j
          await ctx.neo4j.deleteNode('Component', id);
          
          logger.info(`Componente excluído: ${component.name}`);
          
          return {
            ...component,
            id: String(component.id) // Converte ID para string conforme esperado pelo tipo
          };
        } catch (error) {
          console.error(`Erro detalhado ao excluir componente:`, error);
          throw new Error(`Falha ao excluir componente: ${error.message}`);
        }
      },
    })
  );
}; 