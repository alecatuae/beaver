import { builder } from '../index';

// Tipo GraphQL para ComponentInstance
export const ComponentInstance = builder.prismaObject('ComponentInstance', {
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
    adrInstances: t.relation('adrInstances'),
  }),
});

// Input para criação de instância de componente
export const ComponentInstanceInput = builder.inputType('ComponentInstanceInput', {
  fields: (t) => ({
    componentId: t.int({ required: true }),
    environmentId: t.int({ required: true }),
    hostname: t.string({ required: false }),
    specs: t.field({
      type: 'JSON',
      required: false,
    }),
  }),
});

// Input para atualização de instância de componente
export const ComponentInstanceUpdateInput = builder.inputType('ComponentInstanceUpdateInput', {
  fields: (t) => ({
    hostname: t.string({ required: false }),
    specs: t.field({
      type: 'JSON',
      required: false,
    }),
  }),
});

// Input para filtrar instâncias de componente
export const ComponentInstanceWhereInput = builder.inputType('ComponentInstanceWhereInput', {
  fields: (t) => ({
    id: t.int({ required: false }),
    componentId: t.int({ required: false }),
    environmentId: t.int({ required: false }),
    hostname: t.string({ required: false }),
  }),
}); 