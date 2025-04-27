import * as neo4j from 'neo4j-driver';
import type { Driver } from 'neo4j-driver';
import * as dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Carregar variáveis de ambiente
dotenv.config();

// Inicializar o cliente Prisma
const prisma = new PrismaClient();

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
      
      // Etapa 1: Verificar relacionamentos problemáticos - onde a origem ou destino não existem
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
              RETURN count(source) > 0 AS sourceExists, count(target) > 0 AS targetExists
            `, { sourceId, targetId });
            
            const sourceExists = componentsResult.records[0]?.get('sourceExists');
            const targetExists = componentsResult.records[0]?.get('targetExists');
            
            // Se algum dos componentes não existe, verificar se existe no MariaDB
            if (!sourceExists || !targetExists) {
              console.log(`Um ou mais componentes não encontrados para o relacionamento ${relId}. Verificando no MariaDB...`);
              
              // Buscar componentes no MariaDB
              try {
                const missingComponentIds = [];
                if (!sourceExists) missingComponentIds.push(parseInt(sourceId));
                if (!targetExists) missingComponentIds.push(parseInt(targetId));
                
                console.log(`Buscando componentes com IDs [${missingComponentIds.join(', ')}] no MariaDB`);
                
                const componentsFromDb = await prisma.component.findMany({
                  where: {
                    id: {
                      in: missingComponentIds
                    }
                  },
                  select: {
                    id: true,
                    name: true,
                    description: true,
                    status: true
                  }
                });
                
                console.log(`Encontrados ${componentsFromDb.length} componentes no MariaDB`);
                
                // Se encontrou componentes, sincronizar com Neo4j
                if (componentsFromDb.length > 0) {
                  for (const component of componentsFromDb) {
                    console.log(`Sincronizando componente ID: ${component.id} (${component.name}) com Neo4j`);
                    
                    // Verificar se o componente está ativo
                    if (component.status !== 'ACTIVE') {
                      console.log(`Componente ID: ${component.id} não está ativo (status: ${component.status}). Pulando sincronização.`);
                      continue;
                    }
                    
                    // Sincronizar componente com Neo4j
                    const syncResult = await session.run(`
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
                      description: component.description || ''
                    });
                    
                    console.log(`Componente ID: ${component.id} sincronizado com Neo4j`);
                  }
                  
                  // Verificar se agora o relacionamento está válido
                  const revalidateResult = await session.run(`
                    MATCH (source:Component {id: $sourceId})
                    MATCH (target:Component {id: $targetId})
                    RETURN count(source) > 0 AND count(target) > 0 AS valid
                  `, { sourceId, targetId });
                  
                  const isValid = revalidateResult.records[0]?.get('valid');
                  
                  if (isValid) {
                    console.log(`Relacionamento ${relId} agora é válido após sincronização. Mantendo.`);
                  } else {
                    console.log(`Relacionamento ${relId} ainda é inválido após sincronização. Excluindo...`);
                    
                    // Excluir o relacionamento problemático
                    const deleteResult = await session.run(`
                      MATCH ()-[r]->()
                      WHERE ID(r) = ${relId}
                      DELETE r
                      RETURN count(r) as deleted
                    `);
                    
                    console.log(`Relacionamento ${relId} excluído: ${deleteResult.records[0].get('deleted') > 0}`);
                  }
                } else {
                  console.log(`Componentes não encontrados no MariaDB. Excluindo relacionamento ${relId}...`);
                  
                  // Excluir o relacionamento problemático
                  const deleteResult = await session.run(`
                    MATCH ()-[r]->()
                    WHERE ID(r) = ${relId}
                    DELETE r
                    RETURN count(r) as deleted
                  `);
                  
                  console.log(`Relacionamento ${relId} excluído: ${deleteResult.records[0].get('deleted') > 0}`);
                }
              } catch (dbError) {
                console.error(`Erro ao buscar componentes no MariaDB:`, dbError);
                
                // Excluir o relacionamento problemático
                const deleteResult = await session.run(`
                  MATCH ()-[r]->()
                  WHERE ID(r) = ${relId}
                  DELETE r
                  RETURN count(r) as deleted
                `);
                
                console.log(`Relacionamento ${relId} excluído após erro: ${deleteResult.records[0].get('deleted') > 0}`);
              }
            } else {
              console.log(`Componentes encontrados para o relacionamento ${relId}. Nenhuma ação necessária.`);
            }
          } else {
            console.log(`Não foi possível encontrar endpoints para o relacionamento ${relId}. Excluindo...`);
            
            // Excluir o relacionamento problemático
            const deleteResult = await session.run(`
              MATCH ()-[r]->()
              WHERE ID(r) = ${relId}
              DELETE r
              RETURN count(r) as deleted
            `);
            
            console.log(`Relacionamento ${relId} excluído: ${deleteResult.records[0].get('deleted') > 0}`);
          }
        }
      } else {
        console.log('Nenhum relacionamento problemático encontrado.');
      }
      
      // Etapa 2: Verificar se o relacionamento específico problemático existe
      // Atualizado para verificar ambas as possíveis versões do ID
      const problematicIds = [
        115292150460684976,  // Versão encontrada em erros
        1152921504606846976  // Versão correta no Neo4j (com 1 no início)
      ];
      
      for (const problematicId of problematicIds) {
        console.log(`Procurando pelo relacionamento com ID ${problematicId}...`);
        
        const checkResult = await session.run(`
          MATCH ()-[r]->()
          WHERE ID(r) = ${problematicId}
          RETURN r, ID(r) as id
          LIMIT 1
        `);
        
        if (checkResult.records.length > 0) {
          const foundId = checkResult.records[0].get('id');
          console.log(`Relacionamento encontrado com ID ${foundId}.`);
          
          // Verificar se o relacionamento é válido (possui componentes de origem e destino)
          const validationResult = await session.run(`
            MATCH (source)-[r]->(target)
            WHERE ID(r) = ${foundId}
            RETURN 
              source.id IS NOT NULL AS sourceValid,
              target.id IS NOT NULL AS targetValid
          `);
          
          if (validationResult.records.length > 0) {
            const sourceValid = validationResult.records[0].get('sourceValid');
            const targetValid = validationResult.records[0].get('targetValid');
            
            if (sourceValid && targetValid) {
              console.log(`Relacionamento com ID ${foundId} é válido, mantendo na base.`);
            } else {
              console.log(`Relacionamento com ID ${foundId} é inválido (source: ${sourceValid}, target: ${targetValid}). Excluindo...`);
              
              const deleteResult = await session.run(`
                MATCH ()-[r]->()
                WHERE ID(r) = ${foundId}
                DELETE r
                RETURN count(r) as deleted
              `);
              
              console.log(`Relacionamentos excluídos: ${deleteResult.records[0].get('deleted')}`);
            }
          } else {
            console.log(`Não foi possível validar o relacionamento com ID ${foundId}. Excluindo...`);
            
            const deleteResult = await session.run(`
              MATCH ()-[r]->()
              WHERE ID(r) = ${foundId}
              DELETE r
              RETURN count(r) as deleted
            `);
            
            console.log(`Relacionamentos excluídos: ${deleteResult.records[0].get('deleted')}`);
          }
        } else {
          console.log(`Relacionamento com ID ${problematicId} não encontrado.`);
        }
      }
      
      // Procurar por IDs próximos
      console.log('Procurando por IDs próximos...');
      
      const startId = Math.min(...problematicIds) - 1000;
      const endId = Math.max(...problematicIds) + 1000;
      
      const nearbyResult = await session.run(`
        MATCH ()-[r]->()
        WHERE ID(r) > ${startId} AND ID(r) < ${endId}
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
      
      // Etapa 3: Verificar componentes sem relacionamentos
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
      
      // Etapa 4: Estatísticas finais
      const statsResult = await session.run(`
        MATCH (c:Component)
        RETURN count(c) AS nodeCount
      `);
      
      const relStats = await session.run(`
        MATCH ()-[r]->()
        RETURN count(r) AS relCount
      `);
      
      console.log('Estatísticas do banco de dados:');
      console.log(`Total de componentes: ${statsResult.records[0].get('nodeCount')}`);
      console.log(`Total de relacionamentos: ${relStats.records[0].get('relCount')}`);
      
    } finally {
      await session.close();
    }
  } catch (error) {
    console.error('Erro ao corrigir relacionamentos:', error);
  } finally {
    if (driver) {
      await driver.close();
    }
    
    // Fechar conexão com o Prisma
    await prisma.$disconnect();
    
    console.log('Script de correção finalizado');
  }
}

// Executar o script
fixRelationships(); 