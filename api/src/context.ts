import { PrismaClient } from '@prisma/client';
import { driver, auth } from 'neo4j-driver';
import Neo4jClient from './db/neo4j';
import { verifyToken } from './utils/auth';
import { logger } from './utils/logger';

// Instância do Prisma
const prisma = new PrismaClient();

// Instância do Neo4j
let neo4jClient: Neo4jClient;

// Função para inicializar a conexão com o Neo4j
async function initNeo4j() {
  try {
    // Determinar se estamos executando dentro do Docker ou localmente
    const isRunningInDocker = process.env.RUNNING_IN_DOCKER === 'true';
    
    // Usar configurações apropriadas com base no ambiente
    // No Docker: neo4j:7687 (nome do serviço)
    // Local: localhost:7687 (máquina local)
    const neo4jHost = isRunningInDocker ? 'neo4j' : 'localhost';
    const neo4jUrl = process.env.NEO4J_URL || `bolt://${neo4jHost}:7687`;
    const neo4jUser = process.env.NEO4J_USER || 'neo4j';
    const neo4jPassword = process.env.NEO4J_PASSWORD || 'beaver12345';
    
    console.log('🔌 Tentando conectar ao Neo4j...');
    console.log(`📡 URL: ${neo4jUrl}`);
    
    // Cria o driver do Neo4j
    const neo4jDriver = driver(
      neo4jUrl,
      auth.basic(neo4jUser, neo4jPassword)
    );
    
    // Testa a conectividade
    await neo4jDriver.verifyConnectivity();
    
    // Cria o cliente Neo4j usando o driver
    neo4jClient = new Neo4jClient(neo4jDriver);
    
    console.log('✅ Conexão com Neo4j estabelecida com sucesso!');
    logger.info('Conexão com Neo4j estabelecida com sucesso!');
    
    return neo4jClient;
  } catch (error) {
    // Mensagens de erro no console e nos logs
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('❌ ERRO CRÍTICO: Falha ao conectar com Neo4j');
    console.error(`❗ Mensagem de erro: ${errorMessage}`);
    console.error('📢 O aplicativo requer uma conexão com Neo4j para funcionar corretamente.');
    console.error('🔍 Verifique se:');
    console.error('   - O servidor Neo4j está em execução');
    console.error('   - As configurações de URL, usuário e senha estão corretas');
    console.error('   - Não há regras de firewall bloqueando a conexão');
    console.error('');
    console.error('Se você está executando o aplicativo localmente (fora do Docker), tenha certeza que:');
    console.error('   - Neo4j está em execução na porta 7687');
    console.error('   - O host configurado é "localhost" (ambiente local) ou "neo4j" (dentro do Docker)');
    console.error('   - Para forçar o uso de "localhost", defina a variável de ambiente RUNNING_IN_DOCKER=false');
    
    logger.error(`Falha ao conectar com Neo4j: ${errorMessage}`);
    
    // Encerra o processo com erro
    process.exit(1);
  }
}

// Chama a inicialização do Neo4j
initNeo4j().then(() => {
  logger.info('Inicialização do Neo4j concluída');
}).catch(error => {
  logger.error(`Erro na inicialização do Neo4j: ${error}`);
  process.exit(1);
});

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
    neo4j: neo4jClient,
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

// Exportar cliente Neo4j para uso em outros módulos
export { neo4jClient, prisma }; 