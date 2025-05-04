import { PrismaClient } from '@prisma/client';
import { logger } from './utils/logger';
import neo4j from 'neo4j-driver';
import { Neo4jIntegrationV2 } from './db/neo4j_integration_v2';

// Configuração do driver Neo4j
const driver = neo4j.driver(
  process.env.NEO4J_URL || 'bolt://localhost:7687',
  neo4j.auth.basic(
    process.env.NEO4J_USER || 'neo4j',
    process.env.NEO4J_PASSWORD || 'beaver12345'
  )
);

// Função para inicializar o cliente Prisma com tratamento de erros
const initPrismaClient = () => {
  try {
    logger.info('Inicializando cliente Prisma');
    logger.info(`DATABASE_URL: ${process.env.DATABASE_URL?.replace(/:.+@/, ':***@')}`);
    
    const prismaClient = new PrismaClient({
      log: [
        {
          emit: 'event',
          level: 'query',
        },
        {
          emit: 'event',
          level: 'error',
        },
        {
          emit: 'event',
          level: 'info',
        },
        {
          emit: 'event',
          level: 'warn',
        },
      ],
    });
    
    // Evento para log de queries (opcional, descomente se quiser logs detalhados)
    // prismaClient.$use(async (params, next) => {
    //   const before = Date.now();
    //   const result = await next(params);
    //   const after = Date.now();
    //   logger.debug(
    //     `Query ${params.model}.${params.action} levou ${after - before}ms`
    //   );
    //   return result;
    // });
    
    logger.info('Cliente Prisma inicializado com sucesso');
    return prismaClient;
  } catch (error: any) {
    logger.error('Erro ao inicializar cliente Prisma:', error);
    logger.error(`Detalhes do erro: ${error.message}`);
    if (error.code) {
      logger.error(`Código do erro: ${error.code}`);
    }
    
    // Em ambiente de desenvolvimento, podemos tentar reconectar
    if (process.env.NODE_ENV === 'development') {
      logger.info('Tentando reconectar em 5 segundos...');
      setTimeout(() => {
        process.exit(1); // Forçar restart do servidor
      }, 5000);
    }
    
    throw new Error(`Falha ao inicializar o banco de dados: ${error.message}`);
  }
};

// Inicializa um único cliente Prisma para reutilização
const prisma = initPrismaClient();

// Inicializar integração Neo4j v2.0
const neo4jIntegration = new Neo4jIntegrationV2(driver);

// Log de erros
prisma.$on('error', (e) => {
  logger.error('Erro Prisma', { error: e });
});

// Log de queries lentas (mais de 500ms)
prisma.$on('query', (e) => {
  if (e.duration > 500) {
    logger.warn('Query Prisma lenta', {
      query: e.query,
      params: e.params,
      duration: `${e.duration}ms`,
    });
  }
});

// Middleware para sincronização com Neo4j
prisma.$use(async (params, next) => {
  const result = await next(params);
  
  try {
    // Sincronização com Neo4j para entidades da v2.0
    const modelName = String(params.model);
    
    // Ambientes
    if (modelName === 'Environment' && ['create', 'update', 'delete'].includes(params.action)) {
      logger.debug('Sincronizando ambientes com Neo4j');
      await neo4jIntegration.syncEnvironments();
    }
    
    // Times
    if (modelName === 'Team' && ['create', 'update', 'delete'].includes(params.action)) {
      logger.debug('Sincronizando times com Neo4j');
      await neo4jIntegration.syncTeams();
    }
    
    // Component (para relação MANAGED_BY)
    if (modelName === 'Component' && ['create', 'update'].includes(params.action) && 
        (params.args.data.teamId !== undefined)) {
      logger.debug('Sincronizando times com Neo4j (atualização de componente)');
      await neo4jIntegration.syncTeams();
    }
    
    // Instâncias de componentes
    if (modelName === 'ComponentInstance' && ['create', 'update', 'delete'].includes(params.action)) {
      logger.debug('Sincronizando instâncias de componentes com Neo4j');
      await neo4jIntegration.syncComponentInstances();
    }
    
    // Participantes de ADRs
    if (modelName === 'ADRParticipant' && ['create', 'update', 'delete'].includes(params.action)) {
      logger.debug('Sincronizando participantes de ADRs com Neo4j');
      await neo4jIntegration.syncADRParticipants();
    }
    
    // Relações ADR-Instância
    if (modelName === 'ADRComponentInstance' && ['create', 'update', 'delete'].includes(params.action)) {
      logger.debug('Sincronizando relações ADR-Instância com Neo4j');
      await neo4jIntegration.syncADRComponentInstances();
    }
  } catch (error) {
    // Log do erro, mas não falha a operação original do Prisma
    logger.error('Erro ao sincronizar com Neo4j', { 
      error,
      model: params.model,
      action: params.action
    });
  }
  
  return result;
});

// Configuração para lidar com o desligamento do servidor
process.on('beforeExit', async () => {
  logger.info('Desconectando do Prisma antes de fechar');
  await prisma.$disconnect();
});

// Exportamos como default E como named export para garantir compatibilidade com códigos existentes
export default prisma;
export { prisma }; 