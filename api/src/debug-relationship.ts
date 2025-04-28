import { Neo4jClient } from './db/neo4j';
import * as dotenv from 'dotenv';
import { driver, auth } from 'neo4j-driver';
import { logger } from './utils/logger';

// Carregar variáveis de ambiente
dotenv.config();

async function debugRelationship() {
  const relationshipId = process.argv[2];
  
  if (!relationshipId) {
    console.error('Uso: npx ts-node src/debug-relationship.ts <ID_DO_RELACIONAMENTO>');
    process.exit(1);
  }

  console.log(`Depurando relacionamento com ID: ${relationshipId}`);
  
  const neo4jUrl = process.env.NEO4J_URL || 'bolt://neo4j:7687';
  const neo4jUser = process.env.NEO4J_USER || 'neo4j';
  const neo4jPassword = process.env.NEO4J_PASSWORD || 'beaver12345';

  console.log(`Conectando ao Neo4j em ${neo4jUrl} como usuário ${neo4jUser}`);
  const neo4jDriver = driver(neo4jUrl, auth.basic(neo4jUser, neo4jPassword));
  const neo4jClient = new Neo4jClient(neo4jDriver);

  try {
    const session = neo4jDriver.session();
    
    try {
      console.log('\n1. Verificando existência com toString(id(r)) = $id:');
      const result1 = await session.run(`
        MATCH ()-[r]->()
        WHERE toString(id(r)) = $id
        RETURN r, id(r) as intId, toString(id(r)) as stringId
      `, { id: relationshipId });
      
      if (result1.records.length > 0) {
        console.log('✅ Relacionamento encontrado!');
        console.log('Detalhes:', {
          intId: result1.records[0].get('intId').toString(),
          stringId: result1.records[0].get('stringId'),
          type: result1.records[0].get('r').type,
        });
      } else {
        console.log('❌ Relacionamento NÃO encontrado com ID exato.');
      }

      // Tenta com prefixo 1
      if (!relationshipId.startsWith('1')) {
        const prefixedId = '1' + relationshipId;
        console.log(`\n2. Tentando com prefixo '1': ${prefixedId}`);
        const result2 = await session.run(`
          MATCH ()-[r]->()
          WHERE toString(id(r)) = $id
          RETURN r, id(r) as intId, toString(id(r)) as stringId
        `, { id: prefixedId });
        
        if (result2.records.length > 0) {
          console.log('✅ Relacionamento encontrado com prefixo 1!');
          console.log('Detalhes:', {
            intId: result2.records[0].get('intId').toString(),
            stringId: result2.records[0].get('stringId'),
            type: result2.records[0].get('r').type,
          });
        } else {
          console.log('❌ Relacionamento NÃO encontrado com prefixo 1.');
        }
      }

      // Tenta com id(r) = toInteger($id)
      console.log('\n3. Tentando com id(r) = toInteger($id):');
      const result3 = await session.run(`
        MATCH ()-[r]->()
        WHERE id(r) = toInteger($id)
        RETURN r, id(r) as intId, toString(id(r)) as stringId
      `, { id: relationshipId });
      
      if (result3.records.length > 0) {
        console.log('✅ Relacionamento encontrado com toInteger!');
        console.log('Detalhes:', {
          intId: result3.records[0].get('intId').toString(),
          stringId: result3.records[0].get('stringId'),
          type: result3.records[0].get('r').type,
        });
      } else {
        console.log('❌ Relacionamento NÃO encontrado com toInteger.');
      }

      // Busca todos os relacionamentos para verificar proximidade
      console.log('\n4. Buscando relacionamentos próximos:');
      const result4 = await session.run(`
        MATCH ()-[r]->()
        RETURN r, id(r) as intId, toString(id(r)) as stringId
        LIMIT 10
      `);
      
      if (result4.records.length > 0) {
        console.log(`Encontrados ${result4.records.length} relacionamentos:`);
        result4.records.forEach((record, index) => {
          console.log(`Relacionamento #${index + 1}:`, {
            intId: record.get('intId').toString(),
            stringId: record.get('stringId'),
            type: record.get('r').type,
          });
        });
        
        // Verificar se há algum relacionamento com ID similar
        const targetIdPrefix = relationshipId.substring(0, 10);
        const similarIds = result4.records
          .filter(record => record.get('stringId').includes(targetIdPrefix))
          .map(record => ({
            intId: record.get('intId').toString(),
            stringId: record.get('stringId'),
            type: record.get('r').type,
          }));
        
        if (similarIds.length > 0) {
          console.log(`\nEncontrados ${similarIds.length} relacionamentos com prefixo similar (${targetIdPrefix}):`);
          similarIds.forEach((id, index) => {
            console.log(`ID Similar #${index + 1}:`, id);
          });
        } else {
          console.log(`\nNenhum relacionamento com prefixo similar (${targetIdPrefix}) encontrado.`);
        }
      } else {
        console.log('Não há relacionamentos no banco de dados.');
      }
    } finally {
      await session.close();
    }
  } catch (error) {
    console.error('Erro ao depurar relacionamento:', error);
  } finally {
    await neo4jDriver.close();
  }
}

debugRelationship()
  .then(() => console.log('Depuração concluída.'))
  .catch(error => console.error('Erro durante a depuração:', error)); 