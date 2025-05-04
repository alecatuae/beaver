import { builder } from '../index';
import { ParticipantRole } from '../enums';

// Tipo GraphQL para ADRParticipant
export const ADRParticipant = builder.prismaObject('ADR_Participant', {
  fields: (t) => ({
    id: t.exposeID('id'),
    adrId: t.exposeInt('adrId'),
    userId: t.exposeInt('userId'),
    role: t.expose('role', { type: ParticipantRole }),
    createdAt: t.expose('createdAt', { type: 'Date' }),
    
    // Relações
    adr: t.relation('adr'),
    user: t.relation('user'),
  }),
});

// Input para adicionar participante a um ADR
export const ADRParticipantInput = builder.inputType('ADRParticipantInput', {
  fields: (t) => ({
    adrId: t.int({ required: true }),
    userId: t.int({ required: true }),
    role: t.field({
      type: ParticipantRole,
      required: true,
    }),
  }),
});

// Input para atualizar papel de um participante
export const ADRParticipantUpdateInput = builder.inputType('ADRParticipantUpdateInput', {
  fields: (t) => ({
    role: t.field({
      type: ParticipantRole,
      required: true,
    }),
  }),
});

// Input para filtrar participantes
export const ADRParticipantWhereInput = builder.inputType('ADRParticipantWhereInput', {
  fields: (t) => ({
    id: t.int({ required: false }),
    adrId: t.int({ required: false }),
    userId: t.int({ required: false }),
    role: t.field({
      type: ParticipantRole,
      required: false,
    }),
  }),
}); 