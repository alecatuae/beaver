/**
 * Script de integração Neo4j para Beaver v2.0
 * 
 * Este script facilita a execução da migração e sincronização do Neo4j
 * para a versão 2.0 do Beaver, fornecendo uma interface de linha de comando
 * para executar as várias operações de sincronização.
 */

import { driver } from '../neo4j';
import { Neo4jIntegrationV2 } from './neo4j_integration_v2';
import { logger } from '../utils/logger';

// Criar instância do integrador
const integration = new Neo4jIntegrationV2(driver);

// Parsear argumentos de linha de comando
const args = process.argv.slice(2);
const command = args[0];

// Funções para cada comando
async function syncAll() {
  logger.info('Iniciando sincronização completa');
  try {
    await integration.syncAllEntities();
    logger.info('Sincronização completa concluída com sucesso');
  } catch (error) {
    logger.error('Erro durante sincronização completa', { error });
    process.exit(1);
  }
}

async function syncEnvironments() {
  logger.info('Iniciando sincronização de ambientes');
  try {
    await integration.syncEnvironments();
    logger.info('Sincronização de ambientes concluída com sucesso');
  } catch (error) {
    logger.error('Erro durante sincronização de ambientes', { error });
    process.exit(1);
  }
}

async function syncTeams() {
  logger.info('Iniciando sincronização de times');
  try {
    await integration.syncTeams();
    logger.info('Sincronização de times concluída com sucesso');
  } catch (error) {
    logger.error('Erro durante sincronização de times', { error });
    process.exit(1);
  }
}

async function syncComponentInstances() {
  logger.info('Iniciando sincronização de instâncias de componentes');
  try {
    await integration.syncComponentInstances();
    logger.info('Sincronização de instâncias de componentes concluída com sucesso');
  } catch (error) {
    logger.error('Erro durante sincronização de instâncias de componentes', { error });
    process.exit(1);
  }
}

async function syncADRParticipants() {
  logger.info('Iniciando sincronização de participantes de ADRs');
  try {
    await integration.syncADRParticipants();
    logger.info('Sincronização de participantes de ADRs concluída com sucesso');
  } catch (error) {
    logger.error('Erro durante sincronização de participantes de ADRs', { error });
    process.exit(1);
  }
}

async function syncADRComponentInstances() {
  logger.info('Iniciando sincronização de relações ADR-Instância');
  try {
    await integration.syncADRComponentInstances();
    logger.info('Sincronização de relações ADR-Instância concluída com sucesso');
  } catch (error) {
    logger.error('Erro durante sincronização de relações ADR-Instância', { error });
    process.exit(1);
  }
}

async function validateIntegrity() {
  logger.info('Iniciando validação de integridade');
  try {
    const result = await integration.validateIntegrity();
    console.log('\nResultado da validação de integridade:');
    console.log(`- Integridade válida: ${result.valid ? 'Sim' : 'Não'}`);
    console.log(`- Discrepâncias encontradas: ${result.discrepancies.length}`);
    
    if (result.discrepancies.length > 0) {
      console.log('\nDiscrepâncias:');
      result.discrepancies.forEach(d => {
        if (d.entity === 'orphanedInstances') {
          console.log(`- ${d.count} instâncias órfãs encontradas: ${d.description}`);
        } else {
          console.log(`- ${d.entity}: MariaDB=${d.mariadb}, Neo4j=${d.neo4j}, Diferença=${d.difference}`);
        }
      });
    }
    
    console.log('\nContagens MariaDB:');
    Object.entries(result.countsMariaDB).forEach(([key, value]) => {
      console.log(`- ${key}: ${value}`);
    });
    
    console.log('\nContagens Neo4j:');
    Object.entries(result.countsNeo4j).forEach(([key, value]) => {
      console.log(`- ${key}: ${value}`);
    });
    
    logger.info('Validação de integridade concluída');
  } catch (error) {
    logger.error('Erro durante validação de integridade', { error });
    process.exit(1);
  }
}

async function fixIntegrityIssues() {
  logger.info('Iniciando correção de problemas de integridade');
  try {
    const result = await integration.fixIntegrityIssues();
    console.log('\nResultado da correção de integridade:');
    console.log(`- Problemas corrigidos: ${result.fixed ? 'Sim' : 'Não'}`);
    console.log(`- Correções realizadas: ${result.corrections.length}`);
    
    if (result.corrections.length > 0) {
      console.log('\nCorreções:');
      result.corrections.forEach(c => {
        console.log(`- ${c.entity}: ${c.action} (${c.status})`);
      });
    }
    
    logger.info('Correção de integridade concluída');
  } catch (error) {
    logger.error('Erro durante correção de integridade', { error });
    process.exit(1);
  }
}

// Função para exibir ajuda
function showHelp() {
  console.log(`
Uso: node neo4j_v2_integration.js <comando>

Comandos disponíveis:
  all                    Sincroniza todas as entidades da v2.0 com o Neo4j
  environments           Sincroniza apenas ambientes
  teams                  Sincroniza apenas times
  component-instances    Sincroniza apenas instâncias de componentes
  adr-participants       Sincroniza apenas participantes de ADRs
  adr-instances          Sincroniza apenas relações ADR-Instância
  validate               Valida a integridade entre MariaDB e Neo4j
  fix                    Corrige problemas de integridade
  help                   Exibe esta ajuda
  `);
}

// Função principal que executa o comando apropriado
async function main() {
  switch (command) {
    case 'all':
      await syncAll();
      break;
    case 'environments':
      await syncEnvironments();
      break;
    case 'teams':
      await syncTeams();
      break;
    case 'component-instances':
      await syncComponentInstances();
      break;
    case 'adr-participants':
      await syncADRParticipants();
      break;
    case 'adr-instances':
      await syncADRComponentInstances();
      break;
    case 'validate':
      await validateIntegrity();
      break;
    case 'fix':
      await fixIntegrityIssues();
      break;
    case 'help':
    default:
      showHelp();
      break;
  }
  
  // Fechar conexão com Neo4j
  await driver.close();
}

// Executar o script
main().catch(error => {
  logger.error('Erro fatal durante execução', { error });
  process.exit(1);
}); 