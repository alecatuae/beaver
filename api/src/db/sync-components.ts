import * as neo4j from 'neo4j-driver';
import type { Driver } from 'neo4j-driver';
import * as dotenv from 'dotenv';
import { PrismaClient, ComponentStatus } from '@prisma/client';

// Carregar variáveis de ambiente
dotenv.config();

/**
 * Script para sincronizar componentes entre MariaDB e Neo4j
 * 
 * Este script garante que todos os componentes no MariaDB também existam no Neo4j,
 * facilitando a criação de relacionamentos no Neo4j. A sincronização é unidirecional:
 * MariaDB -> Neo4j, onde o MariaDB é considerado a fonte principal de dados.
 */
async function syncComponents() {
  console.log('Iniciando sincronização de componentes entre MariaDB e Neo4j...');
  
  // Configurações do Neo4j (usando as credenciais do ambiente Docker)
  const uri = 'bolt://neo4j:7687';
  const user = 'neo4j';
  const password = 'beaver12345';
  
  console.log(`Tentando conectar ao Neo4j em ${uri} com usuário ${user}`);
  
  let driver: Driver;
  const prisma = new PrismaClient();
  
  try {
    // Conectar ao Neo4j
    driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
    
    // Verificar conexão
    await driver.verifyConnectivity();
    console.log('Conexão com Neo4j estabelecida');
    
    const session = driver.session();
    
    try {
      // Buscar todos os componentes do MariaDB 
      console.log('Buscando componentes do MariaDB...');
      const mariadbComponents = await prisma.component.findMany({
        select: {
          id: true,
          name: true,
          description: true,
          status: true
        }
      });
      console.log(`Encontrados ${mariadbComponents.length} componentes no MariaDB`);
      
      // Buscar todos os componentes do Neo4j
      console.log('Buscando componentes do Neo4j...');
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
      
      // Identificar componentes que existem no MariaDB mas não no Neo4j
      const missingComponents = mariadbComponents.filter(
        comp => !neo4jComponentIds.includes(comp.id)
      );
      
      console.log(`Encontrados ${missingComponents.length} componentes no MariaDB que não existem no Neo4j`);
      
      // Sincronizar componentes faltantes para o Neo4j
      if (missingComponents.length > 0) {
        console.log('Iniciando sincronização de componentes faltantes para o Neo4j...');
        
        for (const component of missingComponents) {
          console.log(`Sincronizando componente: ${component.id} - ${component.name}`);
          
          // Criar o componente no Neo4j
          await session.run(`
            MERGE (c:Component {id: $id})
            ON CREATE SET 
              c.name = $name,
              c.description = $description,
              c.status = $status,
              c.valid_from = datetime(),
              c.valid_to = datetime('9999-12-31T23:59:59Z')
            RETURN c
          `, {
            id: component.id,
            name: component.name,
            description: component.description || '',
            status: component.status
          });
          
          console.log(`Componente ${component.id} sincronizado com sucesso`);
        }
        
        console.log('Sincronização de componentes concluída com sucesso');
      } else {
        console.log('Todos os componentes já estão sincronizados com o Neo4j');
      }
      
      // Verificar componentes que existem no Neo4j mas podem estar desatualizados no MariaDB
      console.log('Verificando componentes que precisam ser atualizados no Neo4j...');
      
      const componentsToUpdate = mariadbComponents.filter(
        comp => neo4jComponentIds.includes(comp.id)
      );
      
      if (componentsToUpdate.length > 0) {
        console.log(`Atualizando ${componentsToUpdate.length} componentes no Neo4j...`);
        
        for (const component of componentsToUpdate) {
          await session.run(`
            MATCH (c:Component {id: $id})
            SET 
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
        
        console.log('Atualização de componentes concluída com sucesso');
      }
      
      // Validação final: verificar se todos os componentes do MariaDB existem no Neo4j
      const finalCheckResult = await session.run(`
        MATCH (c:Component)
        RETURN count(c) as count
      `);
      
      const finalCount = finalCheckResult.records[0].get('count').toNumber();
      console.log(`Verificação final: ${finalCount} componentes no Neo4j`);
      
      if (finalCount >= mariadbComponents.length) {
        console.log('✅ Sincronização concluída com sucesso! Todos os componentes do MariaDB existem no Neo4j.');
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
    console.log('Script de sincronização finalizado');
  }
}

// Executar o script
syncComponents(); 