import { PrismaClient } from '@prisma/client';
import { logger } from './utils/logger';

// Função para inicializar o cliente Prisma com tratamento de erros
const initPrismaClient = () => {
  try {
    logger.info('Inicializando cliente Prisma');
    logger.info(`DATABASE_URL: ${process.env.DATABASE_URL?.replace(/:.+@/, ':***@')}`);
    
    const prismaClient = new PrismaClient({
      log: ['error', 'warn'],
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

// Configuração para lidar com o desligamento do servidor
process.on('beforeExit', async () => {
  logger.info('Desconectando do Prisma antes de fechar');
  await prisma.$disconnect();
});

// Exportamos como default E como named export para garantir compatibilidade com códigos existentes
export default prisma;
export { prisma }; 