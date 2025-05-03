import { builder } from '../index';

// Tipo GraphQL para Team
export const Team = builder.prismaObject('Team', {
  fields: (t) => ({
    id: t.exposeID('id'),
    name: t.exposeString('name'),
    description: t.exposeString('description', { nullable: true }),
    createdAt: t.expose('createdAt', { type: 'Date' }),
    
    // Relações
    components: t.relation('components'),
    members: t.relation('members'),
  }),
});

// Tipo GraphQL para TeamMember
export const TeamMember = builder.prismaObject('TeamMember', {
  fields: (t) => ({
    id: t.exposeID('id'),
    teamId: t.exposeInt('teamId'),
    userId: t.exposeInt('userId'),
    joinDate: t.expose('joinDate', { type: 'Date' }),
    createdAt: t.expose('createdAt', { type: 'Date' }),
    
    // Relações
    team: t.relation('team'),
    user: t.relation('user'),
  }),
});

// Input para criação de time
export const TeamInput = builder.inputType('TeamInput', {
  fields: (t) => ({
    name: t.string({ required: true }),
    description: t.string({ required: false }),
  }),
});

// Input para adicionar membro a um time
export const TeamMemberInput = builder.inputType('TeamMemberInput', {
  fields: (t) => ({
    teamId: t.int({ required: true }),
    userId: t.int({ required: true }),
    joinDate: t.field({
      type: 'Date',
      required: false,
      defaultValue: new Date(),
    }),
  }),
});

// Input para filtragem de times
export const TeamWhereInput = builder.inputType('TeamWhereInput', {
  fields: (t) => ({
    id: t.int({ required: false }),
    name: t.string({ required: false }),
  }),
}); 