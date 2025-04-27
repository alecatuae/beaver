import { Router } from 'express';
import { prisma } from '../prisma';
import { neo4jClient } from '../context';
import { logger } from '../utils/logger';

const router = Router();

// Rota de status para verificar a conexão com os bancos de dados
router.get('/', async (req, res) => {
  const status = {
    api: 'online',
    mariadb: false,
    neo4j: false,
    neo4jConnected: false,
    neo4jMockMode: false
  };

  try {
    // Verificar a conexão com o MariaDB
    await prisma.$queryRaw`SELECT 1`;
    status.mariadb = true;
  } catch (error) {
    logger.error('Erro ao conectar com MariaDB:', error);
  }

  try {
    // Verificar se estamos usando o mock de Neo4j
    // @ts-ignore - Acessando propriedade privada para fins de diagnóstico
    status.neo4jMockMode = neo4jClient.mockMode === true;
    
    // Verificar a conexão com o Neo4j
    await neo4jClient.verifyConnectivity();
    status.neo4j = true;
    
    // Testar a consulta de relacionamentos
    const relations = await neo4jClient.getRelations();
    status.neo4jConnected = relations && Array.isArray(relations);
    
    logger.info(`Status Neo4j: Conectado=${status.neo4j}, MockMode=${status.neo4jMockMode}, Relações=${relations.length}`);
  } catch (error) {
    logger.error('Erro ao conectar com Neo4j:', error);
  }

  res.json(status);
});

export default router; 