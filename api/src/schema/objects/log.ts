import { builder } from '../index';
import { LogLevel } from '../enums';

// Tipo GraphQL para Log
export const Log = builder.prismaObject('Log', {
  fields: (t) => ({
    id: t.expose('id', { type: 'BigInt' }),
    userId: t.exposeInt('userId', { nullable: true }),
    level: t.exposeString('level'),
    message: t.exposeString('message'),
    metadata: t.expose('metadata', { type: 'JSON', nullable: true }),
    createdAt: t.expose('createdAt', { type: 'Date' }),
    
    // Relações
    user: t.relation('user', { nullable: true }),
  }),
});

// Escalar para BigInt
builder.scalarType('BigInt', {
  serialize: (value) => String(value),
  parseValue: (value) => BigInt(value),
});

// Input para criação de log
export const LogInput = builder.inputType('LogInput', {
  fields: (t) => ({
    userId: t.int({ required: false }),
    level: t.string({ required: true }),
    message: t.string({ required: true }),
    metadata: t.field({
      type: 'JSON',
      required: false,
    }),
  }),
});

// Input para filtrar logs
export const LogWhereInput = builder.inputType('LogWhereInput', {
  fields: (t) => ({
    userId: t.int({ required: false }),
    level: t.string({ required: false }),
    startDate: t.field({
      type: 'Date',
      required: false,
    }),
    endDate: t.field({
      type: 'Date',
      required: false,
    }),
  }),
});