import SchemaBuilder from '@pothos/core';
import PrismaPlugin from '@pothos/plugin-prisma';
import { PrismaClient } from '@prisma/client';
import { Neo4jClient } from '../db/neo4j';
import { Context } from '../context';
import { prisma } from '../prisma';

// Cria um builder para o schema
export const builder = new SchemaBuilder<{
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

// Importando os módulos de resolvers
import { componentResolvers } from '../resolvers/componentResolvers';
import { userResolvers } from '../resolvers/userResolvers';
import { adrResolvers } from '../resolvers/adrResolvers';
import { glossaryResolvers } from '../resolvers/glossaryResolvers';

// Registra os resolvers
componentResolvers(builder);
userResolvers(builder);
adrResolvers(builder);
glossaryResolvers(builder);

// Definição do tipo RelationInput que é usado em vários resolvers
builder.inputType('RelationInput', {
  fields: (t) => ({
    sourceId: t.int({ required: true }),
    targetId: t.int({ required: true }),
    type: t.string({ required: true }),
    properties: t.field({
      type: 'JSON',
      required: false,
    }),
  }),
});

// Registra os resolvers de relacionamentos
// Importa diretamente para evitar conflitos de inicialização
import '../resolvers/relationship/relationshipResolvers';

// Constrói e exporta o schema
export const schema = builder.toSchema();

// Exportar o builder como padrão para facilitar importações
export default builder; 