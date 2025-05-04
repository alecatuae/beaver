import * as neo4j from 'neo4j-driver';
import type { Driver } from 'neo4j-driver';
import * as dotenv from 'dotenv';
import { PrismaClient, Component_status } from '@prisma/client';
import { logger } from '../utils/logger';
import { getEnvVar } from '../utils/env';

// Carregar variáveis de ambiente
dotenv.config();

// Inicializar o cliente Prisma
const prisma = new PrismaClient();

async function fixComponents() {
  console.log('Iniciando sincronização de componentes entre MariaDB e Neo4j...');
  
  // Configurações do Neo4j (usando as credenciais do ambiente Docker)
  const uri = 'bolt://neo4j:7687';
  const user = 'neo4j';
  const password = 'beaver12345';
  
  console.log(`Tentando conectar ao Neo4j em ${uri} com usuário ${user}`);
  
  let driver: Driver;
  
  try {
    // Conectar ao Neo4j
    driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
    
    // Verificar conexão
    await driver.verifyConnectivity();
    console.log('Conexão com Neo4j estabelecida');
    
    const session = driver.session();
    
    try {
      // Buscar todos os componentes do MariaDB
      console.log('Buscando componentes no MariaDB...');
      
      // Usar raw query para evitar problemas com enum
      const rawComponents = await prisma.$queryRaw`
        SELECT 
          id, 
          name, 
          description, 
          CASE 
            WHEN status = 'ACTIVE' THEN 'ACTIVE'
            WHEN status = 'INACTIVE' THEN 'INACTIVE'
            WHEN status = 'DEPRECATED' THEN 'DEPRECATED'
            ELSE 'ACTIVE'
          END AS status
        FROM Component
      `;
      
      // Converter raw result para array de componentes
      const components = rawComponents as {
        id: number;
        name: string;
        description: string | null;
        status: string;
      }[];
      
      console.log(`Encontrados ${components.length} componentes no MariaDB`);

      // Buscar os componentes no Neo4j
      console.log('Verificando componentes no Neo4j...');
      const neo4jResult = await session.run(`
        MATCH (c:Component)
        RETURN c.id AS id
      `);
      
      const neo4jComponentIds = neo4jResult.records.map(record => 
        typeof record.get('id') === 'number' 
          ? record.get('id') 
          : parseInt(record.get('id'))
      );
      console.log(`Encontrados ${neo4jComponentIds.length} componentes no Neo4j`);
      
      // Sincronizar todos os componentes (criar ou atualizar)
      console.log('Sincronizando componentes com Neo4j...');
      const neo4jMissing = components.filter(comp => !neo4jComponentIds.includes(comp.id));
      
      console.log(`Criando ${neo4jMissing.length} componentes novos no Neo4j`);
      
      for (const component of components) {
        // Usar MERGE para garantir que o componente exista (criar se não existir)
        console.log(`Sincronizando componente ${component.id} (${component.name}) para Neo4j`);
        
        await session.run(`
          MERGE (c:Component {id: $id})
          ON CREATE SET 
            c.name = $name,
            c.description = $description,
            c.status = $status,
            c.valid_from = datetime(),
            c.valid_to = datetime('9999-12-31T23:59:59Z')
          ON MATCH SET
            c.name = $name,
            c.description = $description,
            c.status = $status
          RETURN c
        `, {
          id: component.id,
          name: component.name,
          description: component.description || '',
          status: component.status
        });
      }
      
      // Validação final
      const finalCheckResult = await session.run(`
        MATCH (c:Component)
        RETURN count(c) as count
      `);
      
      const finalCount = finalCheckResult.records[0].get('count').toNumber();
      console.log(`Verificação final: ${finalCount} componentes no Neo4j`);
      
      if (finalCount >= components.length) {
        console.log('✅ Sincronização de componentes concluída com sucesso!');
      } else {
        console.log('⚠️ Alguns componentes podem não ter sido sincronizados corretamente.');
      }
      
    } finally {
      await session.close();
    }
  } catch (error) {
    console.error('Erro durante a sincronização:', error);
  } finally {
    if (driver) {
      await driver.close();
    }
    
    await prisma.$disconnect();
    console.log('Script de correção finalizado');
  }
}

// Executar o script
fixComponents(); 