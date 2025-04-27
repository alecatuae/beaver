import * as neo4j from 'neo4j-driver';
import type { Driver } from 'neo4j-driver';
import * as dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

async function fixRelationships() {
  console.log('Iniciando correção de relacionamentos no Neo4j...');
  
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
      // Listar todos os relacionamentos para debug
      const listResult = await session.run(`
        MATCH ()-[r]->()
        RETURN ID(r) AS id, type(r) AS type, r.createdAt AS createdAt
        ORDER BY id
        LIMIT 10
      `);
      
      console.log('Primeiros 10 relacionamentos encontrados:');
      listResult.records.forEach(record => {
        console.log(`ID: ${record.get('id')}, Tipo: ${record.get('type')}, Criado em: ${record.get('createdAt')}`);
      });
      
      // Verificar relacionamentos problemáticos - onde a origem ou destino não existem
      console.log('Procurando por relacionamentos problemáticos...');
      
      const brokenRelationsResult = await session.run(`
        MATCH ()-[r]->()
        WHERE NOT (()-[r]->()) OR NOT (()-[r]->())
        RETURN ID(r) AS id, type(r) AS type, r.createdAt AS createdAt
        LIMIT 100
      `);
      
      if (brokenRelationsResult.records.length > 0) {
        console.log(`Encontrados ${brokenRelationsResult.records.length} relacionamentos problemáticos:`);
        
        for (const record of brokenRelationsResult.records) {
          const relId = record.get('id');
          console.log(`Relacionamento ID: ${relId}, Tipo: ${record.get('type')}`);
          
          // Verificar se os endpoints do relacionamento existem
          const endpointsResult = await session.run(`
            MATCH (source)-[r]->(target)
            WHERE ID(r) = ${relId}
            RETURN source.id AS sourceId, target.id AS targetId
          `);
          
          if (endpointsResult.records.length > 0) {
            const sourceId = endpointsResult.records[0].get('sourceId');
            const targetId = endpointsResult.records[0].get('targetId');
            
            // Verificar se os componentes existem no Neo4j
            const componentsResult = await session.run(`
              MATCH (source:Component {id: $sourceId})
              MATCH (target:Component {id: $targetId})
              RETURN count(source) > 0 AND count(target) > 0 as exist
            `, { sourceId, targetId });
            
            if (!componentsResult.records[0].get('exist')) {
              console.log(`Componentes não encontrados para o relacionamento ${relId}. Excluindo relacionamento...`);
              
              // Excluir o relacionamento problemático
              const deleteResult = await session.run(`
                MATCH ()-[r]->()
                WHERE ID(r) = ${relId}
                DELETE r
                RETURN count(r) as deleted
              `);
              
              console.log(`Relacionamento ${relId} excluído: ${deleteResult.records[0].get('deleted') > 0}`);
            } else {
              console.log(`Componentes encontrados para o relacionamento ${relId}. Nenhuma ação necessária.`);
            }
          } else {
            console.log(`Não foi possível encontrar endpoints para o relacionamento ${relId}.`);
          }
        }
      } else {
        console.log('Nenhum relacionamento problemático encontrado.');
      }
      
      // Verificar se o relacionamento específico problemático existe
      const problematicId = 115292150460684976;
      console.log(`Procurando pelo relacionamento com ID ${problematicId}...`);
      
      const checkResult = await session.run(`
        MATCH ()-[r]->()
        WHERE ID(r) = ${problematicId}
        RETURN r
        LIMIT 1
      `);
      
      if (checkResult.records.length > 0) {
        console.log(`Relacionamento com ID ${problematicId} encontrado. Tentando excluir...`);
        
        const deleteResult = await session.run(`
          MATCH ()-[r]->()
          WHERE ID(r) = ${problematicId}
          DELETE r
          RETURN count(r) as deleted
        `);
        
        console.log(`Relacionamentos excluídos: ${deleteResult.records[0].get('deleted')}`);
      } else {
        console.log(`Relacionamento com ID ${problematicId} não encontrado.`);
        
        // Procurar por IDs próximos
        console.log('Procurando por IDs próximos...');
        
        const nearbyResult = await session.run(`
          MATCH ()-[r]->()
          WHERE ID(r) > ${problematicId - 1000} AND ID(r) < ${problematicId + 1000}
          RETURN ID(r) AS id, type(r) AS type
          ORDER BY id
        `);
        
        if (nearbyResult.records.length > 0) {
          console.log('Relacionamentos próximos encontrados:');
          nearbyResult.records.forEach(record => {
            console.log(`ID: ${record.get('id')}, Tipo: ${record.get('type')}`);
          });
        } else {
          console.log('Nenhum relacionamento próximo encontrado.');
        }
      }
      
      // Verificar componentes sem relacionamentos
      console.log('Verificando componentes sem relacionamentos...');
      
      const isolatedComponentsResult = await session.run(`
        MATCH (c:Component)
        WHERE NOT (c)--()
        RETURN c.id AS id, c.name AS name
        LIMIT 10
      `);
      
      if (isolatedComponentsResult.records.length > 0) {
        console.log(`Encontrados ${isolatedComponentsResult.records.length} componentes isolados:`);
        isolatedComponentsResult.records.forEach(record => {
          console.log(`ID: ${record.get('id')}, Nome: ${record.get('name')}`);
        });
      } else {
        console.log('Nenhum componente isolado encontrado.');
      }
      
    } finally {
      await session.close();
    }
  } catch (error) {
    console.error('Erro ao corrigir relacionamentos:', error);
  } finally {
    if (driver) {
      await driver.close();
    }
    console.log('Script de correção finalizado');
  }
}

// Executar o script
fixRelationships(); 