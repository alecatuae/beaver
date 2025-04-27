import SchemaBuilder from '@pothos/core';
import PrismaPlugin from '@pothos/plugin-prisma';
import { PrismaClient } from '@prisma/client';
import { Neo4jClient } from '../db/neo4j';
import { Context } from '../context';
import { prisma } from '../prisma';

// Importando os resolvers
import { userResolvers } from '../resolvers/userResolvers';
import { componentResolvers } from '../resolvers/componentResolvers';
import { adrResolvers } from '../resolvers/adrResolvers';
import { glossaryResolvers } from '../resolvers/glossaryResolvers';

// Cria um builder para o schema
const builder = new SchemaBuilder<{
  Context: Context;
  PrismaTypes: {
    prisma: PrismaClient;
  };
  Scalars: {
    Date: {
      Input: Date;
      Output: Date;
    };
    JSON: {
      Input: any;
      Output: any;
    };
  };
}>({
  plugins: [PrismaPlugin],
  prisma: {
    client: prisma,
  },
  notStrict: 'Pothos may not work correctly when strict mode is not enabled in tsconfig.json',
});

// Define o escalar Date
builder.scalarType('Date', {
  serialize: (value: any) => (value instanceof Date ? value.toISOString() : value),
  parseValue: (value: any) => (typeof value === 'string' ? new Date(value) : new Date()),
});

// Define o escalar JSON
builder.scalarType('JSON', {
  serialize: (value) => value,
  parseValue: (value) => value,
});

// Tipo Query raiz
builder.queryType({
  fields: (t: any) => ({
    // Placeholder para manter o tipo Query válido
    _placeholder: t.boolean({
      resolve: () => true,
    }),
  }),
});

// Tipo Mutation raiz
builder.mutationType({
  fields: (t: any) => ({
    // Placeholder para manter o tipo Mutation válido
    _placeholder: t.boolean({
      resolve: () => true,
    }),
  }),
});

// Registra os resolvers
userResolvers(builder);
componentResolvers(builder);
adrResolvers(builder);
glossaryResolvers(builder);

// Constrói e exporta o schema
export const schema = builder.toSchema(); 