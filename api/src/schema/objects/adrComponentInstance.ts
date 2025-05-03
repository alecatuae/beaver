import { builder } from '../index';
import { ImpactLevel } from '../enums';

// Tipo GraphQL para ADRComponentInstance
export const ADRComponentInstance = builder.prismaObject('ADRComponentInstance', {
  fields: (t) => ({
    id: t.exposeID('id'),
    adrId: t.exposeInt('adrId'),
    instanceId: t.exposeInt('instanceId'),
    impactLevel: t.expose('impactLevel', { type: ImpactLevel }),
    notes: t.exposeString('notes', { nullable: true }),
    createdAt: t.expose('createdAt', { type: 'Date' }),
    
    // Relações
    adr: t.relation('adr'),
    instance: t.relation('instance'),
  }),
});

// Input para adicionar instância a um ADR
export const ADRComponentInstanceInput = builder.inputType('ADRComponentInstanceInput', {
  fields: (t) => ({
    adrId: t.int({ required: true }),
    instanceId: t.int({ required: true }),
    impactLevel: t.field({
      type: ImpactLevel,
      required: true,
    }),
    notes: t.string({ required: false }),
  }),
});

// Input para atualizar relação ADR-instância
export const ADRComponentInstanceUpdateInput = builder.inputType('ADRComponentInstanceUpdateInput', {
  fields: (t) => ({
    impactLevel: t.field({
      type: ImpactLevel,
      required: false,
    }),
    notes: t.string({ required: false }),
  }),
});

// Input para filtrar relações ADR-instância
export const ADRComponentInstanceWhereInput = builder.inputType('ADRComponentInstanceWhereInput', {
  fields: (t) => ({
    id: t.int({ required: false }),
    adrId: t.int({ required: false }),
    instanceId: t.int({ required: false }),
    impactLevel: t.field({
      type: ImpactLevel,
      required: false,
    }),
  }),
}); 