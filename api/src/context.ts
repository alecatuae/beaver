import { PrismaClient } from '@prisma/client';
import { driver, auth } from 'neo4j-driver';
import { Neo4jClient } from './db/neo4j';
import { verifyToken } from './utils/auth';
import { logger } from './utils/logger';

// Instância do Prisma
const prisma = new PrismaClient();

// Classe Mock para Neo4j - temporária para desenvolver sem o banco Neo4j
class MockNeo4jClient {
  async verifyConnectivity() {
    logger.info('Mock: Simulando conexão com Neo4j');
    return true;
  }

  async close() {
    logger.info('Mock: Simulando fechamento de conexão com Neo4j');
    return true;
  }

  async run(cypher: string, params?: any) {
    logger.info(`Mock: Simulando consulta Cypher: ${cypher}`);
    if (cypher.includes('MATCH (source:Component)-[r]->(target:Component)')) {
      // Simula dados de relacionamentos para a query relations
      return [
        {
          id: 1,
          type: 'DEPENDS_ON',
          sourceId: 1,
          targetId: 2,
          sourceName: 'Frontend',
          targetName: 'API',
          properties: { description: 'Frontend consome API' },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 2,
          type: 'CONNECTS_TO',
          sourceId: 2,
          targetId: 3,
          sourceName: 'API',
          targetName: 'Database',
          properties: { description: 'API se conecta ao banco de dados' },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
    }
    return [];
  }

  async upsertComponent(component: any) {
    logger.info(`Mock: Simulando upsert de componente: ${component.name}`);
    return component;
  }

  async createRelationship(sourceId: number, targetId: number, relationType: string, properties: any = {}) {
    logger.info(`Mock: Simulando criação de relacionamento de ${sourceId} para ${targetId} do tipo ${relationType}`);
    return {
      id: Date.now(),
      type: relationType,
      sourceId,
      targetId,
      properties
    };
  }

  async findComponents(filters: any = {}) {
    logger.info(`Mock: Simulando busca de componentes com filtros: ${JSON.stringify(filters)}`);
    return [];
  }

  async deleteNode(label: string, id: number) {
    logger.info(`Mock: Simulando exclusão de nó ${label} com id ${id}`);
    return true;
  }
}

// Usar o Mock Neo4j Client em vez do real
logger.warn('Usando MockNeo4jClient devido a problemas de conexão com Neo4j');
const neo4j = new MockNeo4jClient();

// Tipo do contexto
export interface Context {
  prisma: PrismaClient;
  neo4j: any;
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