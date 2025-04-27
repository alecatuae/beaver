import * as neo4j from 'neo4j-driver';
import type { Driver } from 'neo4j-driver';
import * as dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Interface para o tipo de componente
interface Component {
  id: number;
  name: string;
  description: string | null;
}

// Carregar variáveis de ambiente
dotenv.config();

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
      // Buscar todos os componentes do MariaDB usando SQL direto
      console.log('Buscando componentes do MariaDB...');
      const mariadbComponents = await prisma.$queryRaw<Component[]>`
        SELECT id, name, description FROM Component WHERE status = 'ACTIVE'
      `;
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
      
      // Adicionar componentes faltantes ao Neo4j
      if (missingComponents.length > 0) {
        console.log('Adicionando componentes faltantes ao Neo4j...');
        
        for (const component of missingComponents) {
          console.log(`Adicionando componente: ${component.id} - ${component.name}`);
          
          await session.run(`
            MERGE (c:Component {id: $id})
            ON CREATE SET 
              c.name = $name,
              c.description = $description,
              c.valid_from = datetime(),
              c.valid_to = datetime('9999-12-31T23:59:59Z')
            RETURN c
          `, {
            id: component.id,
            name: component.name,
            description: component.description || '',
          });
        }
        
        console.log('Componentes adicionados com sucesso!');
      }
      
      // Verificar componentes que estão no Neo4j mas não no MariaDB
      const extraComponents = neo4jComponentIds.filter(
        id => !mariadbComponents.some(comp => comp.id === id)
      );
      
      console.log(`Encontrados ${extraComponents.length} componentes no Neo4j que não existem no MariaDB`);
      
      if (extraComponents.length > 0) {
        console.log('Lista de componentes extras no Neo4j:');
        for (const id of extraComponents) {
          const compInfo = await session.run(`
            MATCH (c:Component {id: $id})
            RETURN c.name AS name
          `, { id });
          
          if (compInfo.records.length > 0) {
            console.log(`ID: ${id}, Nome: ${compInfo.records[0].get('name')}`);
          } else {
            console.log(`ID: ${id}, Nome: Desconhecido`);
          }
        }
        
        // Atenção: Não excluímos automaticamente componentes extras para evitar perda de dados
        console.log('ATENÇÃO: Componentes extras no Neo4j não foram excluídos automaticamente.');
      }
      
      // Verificar e corrigir informações desatualizadas
      console.log('Verificando componentes desatualizados...');
      let updatedCount = 0;
      
      for (const component of mariadbComponents) {
        const neo4jComponentResult = await session.run(`
          MATCH (c:Component {id: $id})
          RETURN c.name AS name, c.description AS description
        `, { id: component.id });
        
        if (neo4jComponentResult.records.length > 0) {
          const neo4jName = neo4jComponentResult.records[0].get('name');
          const neo4jDescription = neo4jComponentResult.records[0].get('description') || '';
          
          if (neo4jName !== component.name || neo4jDescription !== (component.description || '')) {
            console.log(`Atualizando informações do componente: ${component.id} - ${component.name}`);
            
            await session.run(`
              MATCH (c:Component {id: $id})
              SET c.name = $name,
                  c.description = $description,
                  c.updatedAt = datetime()
              RETURN c
            `, {
              id: component.id,
              name: component.name,
              description: component.description || '',
            });
            
            updatedCount++;
          }
        }
      }
      
      console.log(`${updatedCount} componentes atualizados no Neo4j`);
      
    } finally {
      await session.close();
      await prisma.$disconnect();
    }
  } catch (error) {
    console.error('Erro ao sincronizar componentes:', error);
  } finally {
    if (driver) {
      await driver.close();
    }
    console.log('Script de sincronização finalizado');
  }
}

// Executar o script
syncComponents(); 