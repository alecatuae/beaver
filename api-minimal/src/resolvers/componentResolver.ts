import { builder } from '../schema';
import { Component, ComponentStatus } from '../models';

// Definir o tipo Component no GraphQL
export const ComponentRef = builder.prismaObject('Component', {
  description: 'Componente arquitetural',
  fields: (t) => ({
    id: t.exposeID('id', { description: 'ID único do componente' }),
    name: t.exposeString('name', { description: 'Nome do componente' }),
    description: t.exposeString('description', { 
      description: 'Descrição detalhada do componente',
      nullable: true,
    }),
    status: t.expose('status', {
      description: 'Status atual do componente',
      type: ComponentStatusEnum,
    }),
    createdAt: t.expose('createdAt', {
      description: 'Data de criação do registro',
      type: 'DateTime',
    }),
  }),
});

// Definir o enum ComponentStatus no GraphQL
export const ComponentStatusEnum = builder.enumType(ComponentStatus, {
  name: 'ComponentStatus',
  description: 'Status possíveis para um componente',
});

// Input para criação/atualização de componentes
export const ComponentInputRef = builder.inputType('ComponentInput', {
  description: 'Dados para criação ou atualização de um componente',
  fields: (t) => ({
    name: t.string({ required: true, description: 'Nome do componente' }),
    description: t.string({ required: false, description: 'Descrição detalhada' }),
    status: t.field({ 
      type: ComponentStatusEnum, 
      required: false, 
      description: 'Status do componente' 
    }),
  }),
});

// Definir query para buscar um componente por ID
builder.queryField('component', (t) =>
  t.prismaField({
    type: ComponentRef,
    description: 'Busca um componente por ID',
    args: {
      id: t.arg.id({ required: true, description: 'ID do componente' }),
    },
    resolve: async (query, _root, { id }, { prisma }) => {
      const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
      return prisma.component.findUniqueOrThrow({
        ...query,
        where: { id: numericId },
      });
    },
  })
);

// Definir query para listar componentes
builder.queryField('components', (t) =>
  t.prismaField({
    type: [ComponentRef],
    description: 'Lista todos os componentes',
    args: {
      search: t.arg.string({ description: 'Termo de busca por nome ou descrição' }),
      status: t.arg({ type: ComponentStatusEnum, description: 'Filtrar por status' }),
      skip: t.arg.int({ description: 'Número de registros para pular' }),
      take: t.arg.int({ description: 'Número de registros para retornar' }),
    },
    resolve: async (query, _root, { search, status, skip, take }, { prisma }) => {
      // Construir a clausula where
      const where: any = {};
      
      if (search) {
        where.OR = [
          { name: { contains: search } },
          { description: { contains: search } },
        ];
      }
      
      if (status) {
        where.status = status;
      }
      
      return prisma.component.findMany({
        ...query,
        where,
        skip: skip || undefined,
        take: take || 20,
        orderBy: { name: 'asc' },
      });
    },
  })
);

// Definir mutação para criar componente
builder.mutationField('createComponent', (t) =>
  t.prismaField({
    type: ComponentRef,
    description: 'Cria um novo componente',
    args: {
      input: t.arg({ type: ComponentInputRef, required: true }),
    },
    resolve: async (query, _root, { input }, { prisma }) => {
      return prisma.component.create({
        ...query,
        data: {
          name: input.name,
          description: input.description || null,
          status: input.status || ComponentStatus.ACTIVE,
        },
      });
    },
  })
);

// Definir mutação para atualizar componente
builder.mutationField('updateComponent', (t) =>
  t.prismaField({
    type: ComponentRef,
    description: 'Atualiza um componente existente',
    args: {
      id: t.arg.id({ required: true }),
      input: t.arg({ type: ComponentInputRef, required: true }),
    },
    resolve: async (query, _root, { id, input }, { prisma }) => {
      const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
      return prisma.component.update({
        ...query,
        where: { id: numericId },
        data: {
          name: input.name,
          description: input.description,
          status: input.status,
        },
      });
    },
  })
);

// Definir mutação para deletar componente
builder.mutationField('deleteComponent', (t) =>
  t.prismaField({
    type: ComponentRef,
    description: 'Remove um componente',
    args: {
      id: t.arg.id({ required: true }),
    },
    resolve: async (query, _root, { id }, { prisma }) => {
      const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
      return prisma.component.delete({
        ...query,
        where: { id: numericId },
      });
    },
  })
); 