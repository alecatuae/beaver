/**
 * Script principal para executar a migração para Beaver v2.0
 * 
 * Este script executa todos os passos necessários para a migração:
 * 1. Faz backup do banco de dados
 * 2. Aplica as alterações do schema
 * 3. Executa os scripts de migração
 * 4. Sincroniza os dados com Neo4j
 */

const { exec, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const v2Migration = require('./v2_migration');
const syncNeo4j = require('./sync_neo4j');
const updateReferences = require('./update_references');
const { logger } = require('../../dist/utils/logger');
const neo4j = require('neo4j-driver');

const prisma = new PrismaClient();
const backupDir = path.join(__dirname, '../../backups');

// Certificar-se de que o diretório de backup existe
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

// Função para executar backup do banco de dados
async function backupDatabase() {
  logger.info('Iniciando backup do banco de dados...');
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(backupDir, `backup-${timestamp}.sql`);
  
  try {
    // Recuperar variáveis de ambiente do .env
    const envPath = path.join(__dirname, '../../.env');
    require('dotenv').config({ path: envPath });
    
    const { DATABASE_URL } = process.env;
    
    if (!DATABASE_URL) {
      throw new Error('DATABASE_URL não encontrada nas variáveis de ambiente');
    }
    
    // Extrair informações de conexão do DATABASE_URL
    const url = new URL(DATABASE_URL.replace('mysql://', 'http://'));
    const user = url.username;
    const password = url.password;
    const host = url.hostname;
    const port = url.port || 3306;
    const database = url.pathname.substring(1);
    
    // Executar o comando mysqldump
    execSync(
      `mysqldump --single-transaction -h ${host} -P ${port} -u ${user} ${password ? `-p${password}` : ''} ${database} > ${backupFile}`,
      { stdio: 'inherit' }
    );
    
    logger.info(`Backup do banco de dados concluído: ${backupFile}`);
    return true;
  } catch (error) {
    logger.error('Erro ao realizar backup do banco de dados:', error);
    return false;
  }
}

// Aplicar alterações do schema
async function applySchemaChanges() {
  logger.info('Aplicando alterações do schema...');
  
  try {
    // Verificar se o arquivo SQL de migração existe
    const migrationSqlPath = path.join(__dirname, '../migrations/v2_migration.sql');
    if (!fs.existsSync(migrationSqlPath)) {
      throw new Error(`Arquivo de migração não encontrado: ${migrationSqlPath}`);
    }
    
    // Recuperar variáveis de ambiente
    const { DATABASE_URL } = process.env;
    
    if (!DATABASE_URL) {
      throw new Error('DATABASE_URL não encontrada nas variáveis de ambiente');
    }
    
    // Extrair informações de conexão
    const url = new URL(DATABASE_URL.replace('mysql://', 'http://'));
    const user = url.username;
    const password = url.password;
    const host = url.hostname;
    const port = url.port || 3306;
    const database = url.pathname.substring(1);
    
    // Executar o script SQL
    execSync(
      `mysql -h ${host} -P ${port} -u ${user} ${password ? `-p${password}` : ''} ${database} < ${migrationSqlPath}`,
      { stdio: 'inherit' }
    );
    
    logger.info('Alterações do schema aplicadas com sucesso');
    return true;
  } catch (error) {
    logger.error('Erro ao aplicar alterações do schema:', error);
    return false;
  }
}

// Inicializar conexão com Neo4j
function initNeo4j() {
  const { NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD } = process.env;
  
  if (!NEO4J_URI || !NEO4J_USER || !NEO4J_PASSWORD) {
    logger.error('Variáveis de ambiente do Neo4j não encontradas');
    return null;
  }
  
  try {
    const driver = neo4j.driver(
      NEO4J_URI,
      neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD)
    );
    
    logger.info('Conexão com Neo4j inicializada');
    return driver;
  } catch (error) {
    logger.error('Erro ao conectar com Neo4j:', error);
    return null;
  }
}

// Sincronizar dados com Neo4j usando a nova integração
async function syncWithNeo4j(driver) {
  logger.info('Iniciando sincronização com Neo4j...');
  
  try {
    // Importar o módulo de integração Neo4j v2
    const { Neo4jIntegrationV2 } = require('../../dist/db/neo4j_integration_v2');
    
    // Inicializar integração
    const integration = new Neo4jIntegrationV2(driver);
    
    // Executar sincronização completa
    await integration.syncAllEntities();
    
    // Validar integridade
    const validationResult = await integration.validateIntegrity();
    
    if (!validationResult.valid) {
      logger.warn('Encontradas discrepâncias na sincronização Neo4j:', validationResult.discrepancies);
      
      // Tentar corrigir
      const fixResult = await integration.fixIntegrityIssues();
      if (fixResult.fixed) {
        logger.info('Problemas de integridade corrigidos com sucesso');
      } else {
        logger.warn('Nem todos os problemas de integridade foram corrigidos');
      }
    } else {
      logger.info('Sincronização Neo4j validada com sucesso');
    }
    
    return true;
  } catch (error) {
    logger.error('Erro ao sincronizar com Neo4j:', error);
    return false;
  }
}

// Função principal para executar todos os passos
async function runMigration() {
  try {
    logger.info('Iniciando processo de migração para Beaver v2.0...');
    
    // Passo 1: Fazer backup do banco de dados
    const backupSuccess = await backupDatabase();
    if (!backupSuccess) {
      throw new Error('Falha ao fazer backup do banco de dados. Abortando migração.');
    }
    
    // Passo 2: Aplicar alterações do schema
    const schemaSuccess = await applySchemaChanges();
    if (!schemaSuccess) {
      throw new Error('Falha ao aplicar alterações do schema. Abortando migração.');
    }
    
    // Passo 3: Executar a migração inicial
    logger.info('Executando migração de dados v2.0...');
    await v2Migration.run(prisma);
    logger.info('Migração inicial concluída com sucesso');
    
    // Passo 4: Sincronizar com Neo4j
    logger.info('Executando sincronização com Neo4j...');
    await syncNeo4j.run(prisma);
    logger.info('Sincronização com Neo4j concluída com sucesso');
    
    // Passo 5: Atualizar referências
    logger.info('Atualizando referências...');
    await updateReferences.run(prisma);
    logger.info('Atualização de referências concluída com sucesso');
    
    // Passo 6: Sincronizar com Neo4j usando nova integração
    const neo4jDriver = initNeo4j();
    if (neo4jDriver) {
      const neo4jSuccess = await syncWithNeo4j(neo4jDriver);
      if (!neo4jSuccess) {
        logger.warn('Falha na sincronização estendida com Neo4j. Migração concluída, mas pode haver inconsistências no grafo.');
      } else {
        logger.info('Sincronização estendida com Neo4j concluída com sucesso');
      }
      
      // Fechar conexão com Neo4j
      await neo4jDriver.close();
    } else {
      logger.warn('Não foi possível inicializar conexão com Neo4j para sincronização estendida');
    }
    
    logger.info('Processo de migração para Beaver v2.0 concluído com sucesso!');
  } catch (error) {
    logger.error('Erro durante o processo de migração:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar a migração
runMigration(); 