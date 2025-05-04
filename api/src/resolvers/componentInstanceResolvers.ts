import { PothosSchemaTypes } from '@pothos/core';
import { prisma } from '../prisma';
import { logger } from '../utils/logger';

export const componentInstanceResolvers = (builder: PothosSchemaTypes.SchemaBuilder<any, any>) => {
  // Definição do tipo ComponentInstance
  builder.prismaObject('ComponentInstance', {
    fields: (t) => ({
      id: t.exposeID('id'),
      componentId: t.exposeInt('componentId'),
      environmentId: t.exposeInt('environmentId'),
      hostname: t.exposeString('hostname', { nullable: true }),
      specs: t.expose('specs', { type: 'JSON', nullable: true }),
      createdAt: t.expose('createdAt', { type: 'Date' }),
      
      // Relações
      component: t.relation('component'),
      environment: t.relation('environment'),
      adrInstances: t.relation('adrInstances')
    }),
  });

  // Input para criar uma instância de componente
  builder.inputType('ComponentInstanceInput', {
    fields: (t) => ({
      componentId: t.int({ required: true }),
      environmentId: t.int({ required: true }),
      hostname: t.string({ required: false }),
      specs: t.field({ type: 'JSON', required: false }),
    }),
  });

  // Query para buscar uma instância de componente pelo ID
  builder.queryField('componentInstance', (t) => 
    t.prismaField({
      type: 'ComponentInstance',
      args: {
        id: t.arg.int({ required: true }),
      },
      resolve: async (query, _root, { id }, _ctx) => {
        try {
          const instance = await prisma.componentInstance.findUnique({
            ...query,
            where: { id },
          });
          
          if (!instance) {
            throw new Error(`Instância de componente com ID ${id} não encontrada`);
          }
          
          return instance;
        } catch (error) {
          logger.error(`Erro ao buscar instância de componente: ${error}`);
          throw error;
        }
      },
    })
  );

  // Query para listar instâncias de componente
  builder.queryField('componentInstances', (t) => 
    t.prismaField({
      type: ['ComponentInstance'],
      args: {
        componentId: t.arg.int({ required: false }),
        environmentId: t.arg.int({ required: false }),
      },
      resolve: async (query, _root, args, _ctx) => {
        try {
          const where: any = {};
          
          if (args.componentId) {
            where.componentId = args.componentId;
          }
          
          if (args.environmentId) {
            where.environmentId = args.environmentId;
          }
          
          return prisma.componentInstance.findMany({
            ...query,
            where,
            orderBy: { id: 'asc' },
          });
        } catch (error) {
          logger.error(`Erro ao listar instâncias de componente: ${error}`);
          throw error;
        }
      },
    })
  );

  // Mutation para criar uma instância de componente
  builder.mutationField('createComponentInstance', (t) => 
    t.prismaField({
      type: 'ComponentInstance',
      args: {
        input: t.arg({ type: 'ComponentInstanceInput', required: true }),
      },
      resolve: async (query, _root, { input }, _ctx) => {
        try {
          // Verificar se o componente existe
          const component = await prisma.component.findUnique({
            where: { id: input.componentId },
          });
          
          if (!component) {
            throw new Error(`Componente com ID ${input.componentId} não encontrado`);
          }
          
          // Verificar se o ambiente existe
          const environment = await prisma.environment.findUnique({
            where: { id: input.environmentId },
          });
          
          if (!environment) {
            throw new Error(`Ambiente com ID ${input.environmentId} não encontrado`);
          }
          
          // Verificar se já existe uma instância com o mesmo componentId e environmentId
          const existingInstance = await prisma.componentInstance.findFirst({
            where: {
              componentId: input.componentId,
              environmentId: input.environmentId,
            },
          });
          
          if (existingInstance) {
            throw new Error(`Já existe uma instância para este componente neste ambiente`);
          }
          
          // Criar a instância
          return prisma.componentInstance.create({
            ...query,
            data: {
              componentId: input.componentId,
              environmentId: input.environmentId,
              hostname: input.hostname,
              specs: input.specs,
            },
          });
        } catch (error) {
          logger.error(`Erro ao criar instância de componente: ${error}`);
          throw error;
        }
      },
    })
  );

  // Mutation para atualizar uma instância de componente
  builder.mutationField('updateComponentInstance', (t) => 
    t.prismaField({
      type: 'ComponentInstance',
      args: {
        id: t.arg.int({ required: true }),
        input: t.arg({ type: 'ComponentInstanceInput', required: true }),
      },
      resolve: async (query, _root, { id, input }, _ctx) => {
        try {
          // Verificar se a instância existe
          const instance = await prisma.componentInstance.findUnique({
            where: { id },
          });
          
          if (!instance) {
            throw new Error(`Instância de componente com ID ${id} não encontrada`);
          }
          
          // Verificar se está tentando mudar para um par componentId/environmentId que já existe
          if (input.componentId !== instance.componentId || input.environmentId !== instance.environmentId) {
            const existingInstance = await prisma.componentInstance.findFirst({
              where: {
                componentId: input.componentId,
                environmentId: input.environmentId,
                NOT: { id },
              },
            });
            
            if (existingInstance) {
              throw new Error(`Já existe uma instância para este componente neste ambiente`);
            }
          }
          
          // Atualizar a instância
          return prisma.componentInstance.update({
            ...query,
            where: { id },
            data: {
              componentId: input.componentId,
              environmentId: input.environmentId,
              hostname: input.hostname,
              specs: input.specs,
            },
          });
        } catch (error) {
          logger.error(`Erro ao atualizar instância de componente: ${error}`);
          throw error;
        }
      },
    })
  );

  // Mutation para excluir uma instância de componente
  builder.mutationField('deleteComponentInstance', (t) => 
    t.boolean({
      args: {
        id: t.arg.int({ required: true }),
      },
      resolve: async (_root, { id }, _ctx) => {
        try {
          // Verificar se a instância existe
          const instance = await prisma.componentInstance.findUnique({
            where: { id },
          });
          
          if (!instance) {
            throw new Error(`Instância de componente com ID ${id} não encontrada`);
          }
          
          // Excluir a instância
          await prisma.componentInstance.delete({
            where: { id },
          });
          
          return true;
        } catch (error) {
          logger.error(`Erro ao excluir instância de componente: ${error}`);
          throw error;
        }
      },
    })
  );

  return builder;
}; 