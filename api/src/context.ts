import { PrismaClient } from '@prisma/client';
import { driver, auth } from 'neo4j-driver';
import Neo4jClient from './db/neo4j';
import { verifyToken } from './utils/auth';
import { logger } from './utils/logger';

// Instância do Prisma
const prisma = new PrismaClient();

// Classe Mock para Neo4j - temporária para desenvolver sem o banco Neo4j
class MockNeo4jClient extends Neo4jClient {
  constructor() {
    // Passa um driver falso para o construtor da classe pai
    // @ts-ignore - Ignorando a tipagem para criar um mock
    super(null);
    this.mockMode = true;
  }

  async verifyConnectivity(): Promise<void> {
    logger.info('Mock: Simulando conexão com Neo4j');
    // Método void, sem retorno
  }

  async close(): Promise<void> {
    logger.info('Mock: Simulando fechamento de conexão com Neo4j');
    // Método void, sem retorno
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

  // Implementar todos os métodos utilizados em neo4jClient
  async getRelations() {
    logger.info('Mock: Simulando obtenção de relacionamentos');
    return [
      {
        id: 1,
        sourceId: 1,
        targetId: 2,
        type: 'DEPENDS_ON',
        properties: { description: 'Frontend depende da API' },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 2,
        sourceId: 2,
        targetId: 3,
        type: 'CONNECTS_TO',
        properties: { description: 'API se conecta ao Database' },
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  }

  async getRelationById(id: number) {
    logger.info(`Mock: Simulando obtenção de relacionamento com ID ${id}`);
    return {
      id,
      sourceId: 1,
      targetId: 2,
      type: 'DEPENDS_ON',
      properties: { description: 'Relacionamento de exemplo' },
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  async createRelation(sourceId: number, targetId: number, type: string, properties: any = {}) {
    logger.info(`Mock: Simulando criação de relacionamento ${type} entre ${sourceId} e ${targetId}`);
    return {
      id: Date.now(),
      sourceId,
      targetId,
      type,
      properties,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  async updateRelation(id: number, sourceId: number, targetId: number, type: string, properties: any = {}) {
    logger.info(`Mock: Simulando atualização de relacionamento ${id}`);
    return {
      id,
      sourceId,
      targetId,
      type,
      properties,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  async deleteRelation(id: number) {
    logger.info(`Mock: Simulando exclusão de relacionamento ${id}`);
    return true;
  }
}

// Inicialização do Neo4j (versão sem await no top-level)
// Inicialmente criamos uma instância do Neo4jClient com mockMode=true
let neo4j = new MockNeo4jClient();
export let neo4jClient = neo4j;

// Função para inicializar a conexão com o Neo4j
async function initNeo4j() {
  try {
    // Tenta criar uma conexão real com o Neo4j
    const neo4jDriver = driver(
      process.env.NEO4J_URL || 'bolt://neo4j:7687',
      auth.basic(
        process.env.NEO4J_USER || 'neo4j',
        process.env.NEO4J_PASSWORD || 'beaver12345'
      )
    );
    
    // Cria o cliente Neo4j usando o driver real
    const realNeo4j = new Neo4jClient(neo4jDriver);
    realNeo4j.mockMode = false;
    
    // Testa a conexão
    logger.info('Tentando conectar ao Neo4j...');
    await neo4jDriver.verifyConnectivity();
    logger.info('Conexão com Neo4j estabelecida com sucesso!');
    
    // Substitui a instância mock pela real
    neo4j = realNeo4j as any; // Usando type assertion para contornar a verificação de tipos
    neo4jClient = realNeo4j;
    
    return realNeo4j;
  } catch (error) {
    // Se a conexão falhar, mantém o mock
    logger.warn(`Falha ao conectar com Neo4j: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    logger.warn('Usando MockNeo4jClient como fallback');
    
    // Garante que estamos usando o cliente com mockMode=true
    neo4j.mockMode = true;
    neo4jClient = neo4j;
    
    return neo4j;
  }
}

// Chama a inicialização, mas não espera por ela no top-level
initNeo4j().then(() => {
  logger.info('Inicialização do Neo4j concluída');
}).catch(error => {
  logger.error(`Erro na inicialização do Neo4j: ${error}`);
});

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