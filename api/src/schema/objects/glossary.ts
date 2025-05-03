import { builder } from '../index';
import { GlossaryStatus } from '../enums';

// Tipo GraphQL para GlossaryTerm
export const GlossaryTerm = builder.prismaObject('GlossaryTerm', {
  fields: (t) => ({
    id: t.exposeID('id'),
    term: t.exposeString('term'),
    definition: t.exposeString('definition'),
    status: t.exposeString('status'),
    createdAt: t.expose('createdAt', { type: 'Date' }),
  }),
});

// Input para criação de termo no glossário
export const GlossaryTermInput = builder.inputType('GlossaryTermInput', {
  fields: (t) => ({
    term: t.string({ required: true }),
    definition: t.string({ required: true }),
    status: t.string({ 
      required: false, 
      defaultValue: 'draft' 
    }),
  }),
});

// Input para atualização de termo no glossário
export const GlossaryTermUpdateInput = builder.inputType('GlossaryTermUpdateInput', {
  fields: (t) => ({
    term: t.string({ required: false }),
    definition: t.string({ required: false }),
    status: t.string({ required: false }),
  }),
});

// Input para filtrar termos do glossário
export const GlossaryTermWhereInput = builder.inputType('GlossaryTermWhereInput', {
  fields: (t) => ({
    id: t.int({ required: false }),
    term: t.string({ required: false }),
    status: t.string({ required: false }),
  }),
}); 