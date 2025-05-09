import SchemaBuilder from '@pothos/core';
import { DateTimeResolver, JSONResolver } from 'graphql-scalars';
import SimpleObjectsPlugin from '@pothos/plugin-simple-objects';
import PrismaPlugin from '@pothos/plugin-prisma';
import { PrismaClient } from '@prisma/client';

// Criação do cliente Prisma
const prisma = new PrismaClient();

// Interface de contexto
export interface Context {
  prisma: PrismaClient;
}

// Builder de schema com plugins simplificado
const builder = new SchemaBuilder<{
  Context: Context;
  Scalars: {
    DateTime: { Input: Date; Output: Date };
    JSON: { Input: any; Output: any };
  };
}>({
  plugins: [SimpleObjectsPlugin, PrismaPlugin],
  prisma: {
    client: prisma,
  },
});

// Adicionar escalares
builder.addScalarType('DateTime', DateTimeResolver, {});
builder.addScalarType('JSON', JSONResolver, {});

// Definir objeto DatabaseConnection
const DbConnectionRef = builder.objectRef<{
  status: string;
  name: string;
}>('DatabaseConnection');

builder.objectType(DbConnectionRef, {
  description: 'Status de conexão com um banco de dados',
  fields: (t) => ({
    status: t.exposeString('status', { description: 'Status da conexão (connected/error)' }),
    name: t.exposeString('name', { description: 'Nome do banco de dados' }),
  }),
});

// Definir objeto HealthCheckResult com interface explícita
interface HealthCheckData {
  status: string;
  timestamp: string;
  version: string;
  databases: Array<{ status: string; name: string }>;
}

const HealthCheckRef = builder.objectRef<HealthCheckData>('HealthCheck');

builder.objectType(HealthCheckRef, {
  description: 'Resultado da verificação de saúde da API',
  fields: (t) => ({
    status: t.exposeString('status', { description: 'Status geral do sistema' }),
    timestamp: t.exposeString('timestamp', { description: 'Timestamp da verificação' }),
    version: t.exposeString('version', { description: 'Versão da API' }),
    databases: t.field({
      type: [DbConnectionRef],
      description: 'Status das conexões com bancos de dados',
      resolve: (parent) => parent.databases,
    }),
  }),
});

// Definir Query Type
builder.queryType({});

// Definir campos da Query separadamente
builder.queryFields((t) => ({
  hello: t.string({
    description: 'Retorna uma saudação simples',
    resolve: () => 'Olá do servidor Beaver v2.0 (API Minimal)!',
  }),
  health: t.field({
    description: 'Verifica o status de saúde da API',
    type: HealthCheckRef,
    resolve: async (_, __, context): Promise<HealthCheckData> => {
      const databases = [];
      
      try {
        // Verificar Prisma/MariaDB
        await context.prisma.$queryRaw`SELECT 1`;
        databases.push({ status: 'connected', name: 'MariaDB' });
      } catch (error) {
        databases.push({ status: 'error', name: 'MariaDB' });
      }
      
      // Adicionar Neo4j (simulado, sem conexão real)
      databases.push({ status: 'connected', name: 'Neo4j (simulado)' });
      
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '2.0.0',
        databases,
      };
    },
  }),
}));

// Definir Mutation Type
builder.mutationType({});

// Definir campos da Mutation separadamente
builder.mutationFields((t) => ({
  ping: t.string({
    description: 'Teste básico de mutação',
    resolve: () => 'pong',
  }),
}));

// Gerar schema
export const schema = builder.toSchema(); 