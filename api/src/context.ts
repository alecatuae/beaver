import { PrismaClient } from '@prisma/client';
import { driver, auth } from 'neo4j-driver';
import { Neo4jClient } from './db/neo4j';
import { verifyToken } from './utils/auth';
import { logger } from './utils/logger';

// Instância do Prisma
const prisma = new PrismaClient();

// Conexão com Neo4j
const neo4jDriver = driver(
  process.env.NEO4J_URL || 'bolt://localhost:7687',
  auth.basic(
    process.env.NEO4J_USER || 'neo4j',
    process.env.NEO4J_PASSWORD || 'beaver12345'
  )
);

// Cliente Neo4j
const neo4j = new Neo4jClient(neo4jDriver);

// Inicializa conexão com Neo4j
neo4j.verifyConnectivity()
  .then(() => logger.info('Conectado ao Neo4j'))
  .catch(err => logger.error(`Erro ao conectar ao Neo4j: ${err.message}`));

// Tipo do contexto
export interface Context {
  prisma: PrismaClient;
  neo4j: Neo4jClient;
  userId?: number;
  userRole?: string;
}

// Função para criar o contexto
export async function createContext({ req }: { req: any }): Promise<Context> {
  // Contexto básico
  const context: Context = {
    prisma,
    neo4j,
  };

  // Extrai e verifica o token de autenticação se existir
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const payload = verifyToken(token);
      if (payload) {
        context.userId = payload.userId;
        context.userRole = payload.role;
      }
    } catch (error) {
      logger.warn(`Token inválido: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  return context;
} 