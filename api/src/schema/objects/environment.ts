import { builder } from '../index';

// Tipo GraphQL para Environment
export const Environment = builder.prismaObject('Environment', {
  fields: (t) => ({
    id: t.exposeID('id'),
    name: t.exposeString('name'),
    description: t.exposeString('description', { nullable: true }),
    createdAt: t.expose('createdAt', { type: 'Date' }),
    
    // Relações
    instances: t.relation('instances'),
  }),
});

// Argumentos para filtragem de ambientes
export const EnvironmentWhereInput = builder.inputType('EnvironmentWhereInput', {
  fields: (t) => ({
    id: t.int({ required: false }),
    name: t.string({ required: false }),
  }),
});

// Input para criação/atualização de ambiente
export const EnvironmentInput = builder.inputType('EnvironmentInput', {
  fields: (t) => ({
    name: t.string({ required: true }),
    description: t.string({ required: false }),
  }),
}); 