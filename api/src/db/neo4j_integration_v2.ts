/**
 * Módulo de integração Neo4j para Beaver v2.0
 * 
 * Este módulo estende as funcionalidades do Neo4j para suportar as novas entidades
 * introduzidas na versão 2.0 do Beaver:
 * - Ambientes (Environment)
 * - Instâncias de Componentes (ComponentInstance)
 * - Times (Team)
 * - Participantes de ADRs (ADRParticipant)
 * - Relações ADR-Instância (ADRComponentInstance)
 */

import { Driver, Session } from 'neo4j-driver';
import { logger } from '../utils/logger';
import { prisma } from '../prisma';

export class Neo4jIntegrationV2 {
  private driver: Driver;

  constructor(driver: Driver) {
    this.driver = driver;
  }

  /**
   * Sincroniza todas as entidades do MariaDB para o Neo4j.
   * Realiza uma sincronização completa de todas as entidades novas da v2.0.
   */
  async syncAllEntities(): Promise<void> {
    try {
      // Ordem é importante para respeitar dependências entre entidades
      await this.syncEnvironments();
      await this.syncTeams();
      await this.syncComponentInstances();
      await this.syncADRParticipants();
      await this.syncADRComponentInstances();
      logger.info('Sincronização com Neo4j completada com sucesso');
    } catch (error) {
      logger.error('Erro durante sincronização completa com Neo4j', { error });
      throw error;
    }
  }

  /**
   * Sincroniza ambientes do MariaDB para o Neo4j
   */
  async syncEnvironments(): Promise<void> {
    const session = this.driver.session();
    try {
      logger.info('Iniciando sincronização de ambientes');
      
      // Buscar todos os ambientes no MariaDB usando consulta SQL direta
      const environments = await prisma.$queryRaw`
        SELECT id, name, description, created_at as createdAt 
        FROM Environment
      `;
      logger.info(`Encontrados ${environments.length} ambientes para sincronizar`);
      
      // Criar/atualizar cada ambiente no Neo4j
      for (const env of environments) {
        await session.executeWrite(tx => 
          tx.run(`
            MERGE (e:Environment {id: $id})
            ON CREATE SET
              e.name = $name,
              e.description = $description,
              e.created_at = datetime($createdAt)
            ON MATCH SET
              e.name = $name,
              e.description = $description
            RETURN e
          `, {
            id: env.id,
            name: env.name,
            description: env.description || '',
            createdAt: new Date(env.createdAt).toISOString()
          })
        );
        logger.debug(`Ambiente sincronizado: ${env.name}`);
      }
      
      logger.info('Sincronização de ambientes concluída');
    } catch (error) {
      logger.error('Erro durante sincronização de ambientes', { error });
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Sincroniza times do MariaDB para o Neo4j
   */
  async syncTeams(): Promise<void> {
    const session = this.driver.session();
    try {
      logger.info('Iniciando sincronização de times');
      
      // Buscar todos os times no MariaDB
      const teams = await prisma.team.findMany();
      logger.info(`Encontrados ${teams.length} times para sincronizar`);
      
      // Criar/atualizar cada time no Neo4j
      for (const team of teams) {
        await session.executeWrite(tx => 
          tx.run(`
            MERGE (t:Team {id: $id})
            ON CREATE SET
              t.name = $name,
              t.description = $description,
              t.created_at = datetime($createdAt)
            ON MATCH SET
              t.name = $name,
              t.description = $description
            RETURN t
          `, {
            id: team.id,
            name: team.name,
            description: team.description || '',
            createdAt: team.createdAt.toISOString()
          })
        );
        logger.debug(`Time sincronizado: ${team.name}`);
      }
      
      // Buscar componentes com times associados e criar relações MANAGED_BY
      const componentsWithTeams = await prisma.component.findMany({
        where: {
          teamId: {
            not: null
          }
        }
      });
      
      logger.info(`Encontrados ${componentsWithTeams.length} componentes com times associados`);
      
      for (const component of componentsWithTeams) {
        if (component.teamId) {
          await session.executeWrite(tx =>
            tx.run(`
              MATCH (c:Component {id: $componentId}), (t:Team {id: $teamId})
              MERGE (c)-[:MANAGED_BY]->(t)
            `, {
              componentId: component.id,
              teamId: component.teamId
            })
          );
          logger.debug(`Relação MANAGED_BY criada para componente ${component.id} e time ${component.teamId}`);
        }
      }
      
      logger.info('Sincronização de times concluída');
    } catch (error) {
      logger.error('Erro durante sincronização de times', { error });
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Sincroniza instâncias de componentes do MariaDB para o Neo4j
   */
  async syncComponentInstances(): Promise<void> {
    const session = this.driver.session();
    try {
      logger.info('Iniciando sincronização de instâncias de componentes');
      
      // Buscar todas as instâncias no MariaDB usando SQL direto
      const instances = await prisma.$queryRaw`
        SELECT ci.id, ci.component_id as componentId, ci.environment_id as environmentId, 
               ci.hostname, ci.specs, ci.created_at as createdAt
        FROM Component_Instance ci
      `;
      
      logger.info(`Encontradas ${instances.length} instâncias para sincronizar`);
      
      // Criar/atualizar cada instância no Neo4j
      for (const instance of instances) {
        // 1. Criar nó da instância
        await session.executeWrite(tx =>
          tx.run(`
            MERGE (ci:ComponentInstance {id: $id})
            ON CREATE SET
              ci.component_id = $componentId,
              ci.environment_id = $environmentId,
              ci.hostname = $hostname,
              ci.specs = $specs,
              ci.created_at = datetime($createdAt)
            ON MATCH SET
              ci.hostname = $hostname,
              ci.specs = $specs
            RETURN ci
          `, {
            id: instance.id,
            componentId: instance.componentId,
            environmentId: instance.environmentId,
            hostname: instance.hostname || null,
            specs: JSON.stringify(instance.specs || {}),
            createdAt: new Date(instance.createdAt).toISOString()
          })
        );
        
        // 2. Criar relação INSTANTIATES do componente para a instância
        await session.executeWrite(tx =>
          tx.run(`
            MATCH (c:Component {id: $componentId}), (ci:ComponentInstance {id: $instanceId})
            MERGE (c)-[:INSTANTIATES]->(ci)
          `, {
            componentId: instance.componentId,
            instanceId: instance.id
          })
        );
        
        // 3. Criar relação DEPLOYED_IN da instância para o ambiente
        await session.executeWrite(tx =>
          tx.run(`
            MATCH (ci:ComponentInstance {id: $instanceId}), (e:Environment {id: $environmentId})
            MERGE (ci)-[:DEPLOYED_IN]->(e)
          `, {
            instanceId: instance.id,
            environmentId: instance.environmentId
          })
        );
        
        logger.debug(`Instância sincronizada: ID ${instance.id}, ${instance.hostname || 'sem hostname'}`);
      }
      
      logger.info('Sincronização de instâncias de componentes concluída');
    } catch (error) {
      logger.error('Erro durante sincronização de instâncias de componentes', { error });
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Sincroniza participantes de ADRs do MariaDB para o Neo4j
   */
  async syncADRParticipants(): Promise<void> {
    const session = this.driver.session();
    try {
      logger.info('Iniciando sincronização de participantes de ADRs');
      
      // Buscar todos os participantes no MariaDB usando SQL direto
      const participants = await prisma.$queryRaw`
        SELECT ap.id, ap.adr_id as adrId, ap.user_id as userId, 
               ap.role, ap.created_at as createdAt
        FROM ADR_Participant ap
      `;
      
      logger.info(`Encontrados ${participants.length} participantes para sincronizar`);
      
      // Criar/atualizar relações PARTICIPATES_IN para cada participante
      for (const participant of participants) {
        await session.executeWrite(tx =>
          tx.run(`
            MATCH (u:User {id: $userId}), (a:ADR {id: $adrId})
            MERGE (u)-[r:PARTICIPATES_IN]->(a)
            ON CREATE SET r.role = $role, r.created_at = datetime($createdAt)
            ON MATCH SET r.role = $role
            RETURN r
          `, {
            userId: participant.userId,
            adrId: participant.adrId,
            role: participant.role,
            createdAt: new Date(participant.createdAt).toISOString()
          })
        );
        
        logger.debug(`Participante sincronizado: Usuário ${participant.userId} em ADR ${participant.adrId} (papel: ${participant.role})`);
      }
      
      logger.info('Sincronização de participantes de ADRs concluída');
    } catch (error) {
      logger.error('Erro durante sincronização de participantes de ADRs', { error });
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Sincroniza relações entre ADRs e instâncias de componentes do MariaDB para o Neo4j
   */
  async syncADRComponentInstances(): Promise<void> {
    const session = this.driver.session();
    try {
      logger.info('Iniciando sincronização de relações ADR-Instância');
      
      // Buscar todas as relações ADR-Instância no MariaDB usando SQL direto
      const adrInstances = await prisma.$queryRaw`
        SELECT aci.id, aci.adr_id as adrId, aci.instance_id as instanceId, 
               aci.impact_level as impactLevel, aci.notes,
               ci.component_id as componentId
        FROM ADR_Component_Instance aci
        JOIN Component_Instance ci ON aci.instance_id = ci.id
      `;
      
      logger.info(`Encontradas ${adrInstances.length} relações ADR-Instância para sincronizar`);
      
      // Criar/atualizar relações AFFECTS_INSTANCE para cada ADR-Instância
      for (const rel of adrInstances) {
        await session.executeWrite(tx =>
          tx.run(`
            MATCH (a:ADR {id: $adrId}), (ci:ComponentInstance {id: $instanceId})
            MERGE (a)-[r:AFFECTS_INSTANCE]->(ci)
            ON CREATE SET 
              r.impact_level = $impactLevel,
              r.notes = $notes
            ON MATCH SET 
              r.impact_level = $impactLevel,
              r.notes = $notes
            RETURN r
          `, {
            adrId: rel.adrId,
            instanceId: rel.instanceId,
            impactLevel: rel.impactLevel,
            notes: rel.notes || null
          })
        );
        
        logger.debug(`Relação ADR-Instância sincronizada: ADR ${rel.adrId} -> Instância ${rel.instanceId}`);
        
        // Verificar se existe a relação ADR-Component correspondente
        const adrComponent = await prisma.$queryRaw`
          SELECT * FROM ADR_Component 
          WHERE adr_id = ${rel.adrId} AND component_id = ${rel.componentId}
          LIMIT 1
        `;
        
        // Se não existe, criar automaticamente
        if (!adrComponent || adrComponent.length === 0) {
          // Primeiro no MariaDB
          await prisma.$executeRaw`
            INSERT INTO ADR_Component(adr_id, component_id, created_at)
            VALUES (${rel.adrId}, ${rel.componentId}, NOW())
          `;
          
          // Depois no Neo4j
          await session.executeWrite(tx =>
            tx.run(`
              MATCH (a:ADR {id: $adrId}), (c:Component {id: $componentId})
              MERGE (a)-[:AFFECTS]->(c)
            `, {
              adrId: rel.adrId,
              componentId: rel.componentId
            })
          );
          
          logger.debug(`Relação ADR-Component criada automaticamente: ADR ${rel.adrId} -> Component ${rel.componentId}`);
        }
      }
      
      logger.info('Sincronização de relações ADR-Instância concluída');
    } catch (error) {
      logger.error('Erro durante sincronização de relações ADR-Instância', { error });
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Realiza a validação de integridade entre MariaDB e Neo4j
   * @returns Um relatório de integridade com contagens e discrepâncias
   */
  async validateIntegrity(): Promise<{
    valid: boolean;
    discrepancies: any[];
    countsMariaDB: any;
    countsNeo4j: any;
  }> {
    const session = this.driver.session();
    let valid = true;
    const discrepancies = [];
    
    try {
      logger.info('Iniciando validação de integridade entre MariaDB e Neo4j');
      
      // Buscar contagens no MariaDB
      const environmentCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM Environment`;
      const teamCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM Team`;
      const instanceCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM Component_Instance`;
      const participantCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM ADR_Participant`;
      const adrInstanceCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM ADR_Component_Instance`;

      const countsMariaDB = {
        environments: Number(environmentCount[0].count),
        teams: Number(teamCount[0].count),
        componentInstances: Number(instanceCount[0].count),
        adrParticipants: Number(participantCount[0].count),
        adrComponentInstances: Number(adrInstanceCount[0].count)
      };
      
      // Buscar contagens no Neo4j
      const environmentCountNeo4j = await session.executeRead(tx =>
        tx.run('MATCH (e:Environment) RETURN count(e) as count')
      );
      
      const teamCountNeo4j = await session.executeRead(tx =>
        tx.run('MATCH (t:Team) RETURN count(t) as count')
      );
      
      const instanceCountNeo4j = await session.executeRead(tx =>
        tx.run('MATCH (ci:ComponentInstance) RETURN count(ci) as count')
      );
      
      const participantCountNeo4j = await session.executeRead(tx =>
        tx.run('MATCH ()-[r:PARTICIPATES_IN]->() RETURN count(r) as count')
      );
      
      const adrInstanceCountNeo4j = await session.executeRead(tx =>
        tx.run('MATCH ()-[r:AFFECTS_INSTANCE]->() RETURN count(r) as count')
      );
      
      const countsNeo4j = {
        environments: environmentCountNeo4j.records[0]?.get('count').toNumber() || 0,
        teams: teamCountNeo4j.records[0]?.get('count').toNumber() || 0,
        componentInstances: instanceCountNeo4j.records[0]?.get('count').toNumber() || 0,
        adrParticipants: participantCountNeo4j.records[0]?.get('count').toNumber() || 0,
        adrComponentInstances: adrInstanceCountNeo4j.records[0]?.get('count').toNumber() || 0
      };
      
      // Verificar discrepâncias
      Object.keys(countsMariaDB).forEach(key => {
        if (countsMariaDB[key] !== countsNeo4j[key]) {
          valid = false;
          discrepancies.push({
            entity: key,
            mariadb: countsMariaDB[key],
            neo4j: countsNeo4j[key],
            difference: countsMariaDB[key] - countsNeo4j[key]
          });
        }
      });
      
      // Verificar relações órfãs
      const orphanedInstances = await session.executeRead(tx =>
        tx.run(`
          MATCH (ci:ComponentInstance)
          WHERE NOT (ci)<-[:INSTANTIATES]-() OR NOT (ci)-[:DEPLOYED_IN]->()
          RETURN count(ci) as count
        `)
      );
      
      const orphanedInstancesCount = orphanedInstances.records[0]?.get('count').toNumber() || 0;
      
      if (orphanedInstancesCount > 0) {
        valid = false;
        discrepancies.push({
          entity: 'orphanedInstances',
          count: orphanedInstancesCount,
          description: 'Instâncias de componente sem relações INSTANTIATES ou DEPLOYED_IN'
        });
      }
      
      logger.info(`Validação de integridade completada. Válido: ${valid}, Discrepâncias: ${discrepancies.length}`);
      
      return {
        valid,
        discrepancies,
        countsMariaDB,
        countsNeo4j
      };
    } catch (error) {
      logger.error('Erro durante validação de integridade', { error });
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Corrige inconsistências encontradas pela validação de integridade
   * @returns Um relatório das correções realizadas
   */
  async fixIntegrityIssues(): Promise<{
    fixed: boolean;
    corrections: any[];
  }> {
    // Primeira verificar integridade para identificar problemas
    const validationResult = await this.validateIntegrity();
    
    if (validationResult.valid) {
      logger.info('Nenhum problema de integridade encontrado, não há necessidade de correções');
      return {
        fixed: true,
        corrections: []
      };
    }
    
    const corrections = [];
    
    try {
      logger.info(`Iniciando correção de ${validationResult.discrepancies.length} problemas de integridade`);
      
      for (const discrepancy of validationResult.discrepancies) {
        switch (discrepancy.entity) {
          case 'environments':
            logger.info('Corrigindo discrepância em ambientes');
            await this.syncEnvironments();
            corrections.push({
              entity: 'environments',
              action: 'resync',
              status: 'success'
            });
            break;
            
          case 'teams':
            logger.info('Corrigindo discrepância em times');
            await this.syncTeams();
            corrections.push({
              entity: 'teams',
              action: 'resync',
              status: 'success'
            });
            break;
            
          case 'componentInstances':
            logger.info('Corrigindo discrepância em instâncias de componentes');
            await this.syncComponentInstances();
            corrections.push({
              entity: 'componentInstances',
              action: 'resync',
              status: 'success'
            });
            break;
            
          case 'adrParticipants':
            logger.info('Corrigindo discrepância em participantes de ADRs');
            await this.syncADRParticipants();
            corrections.push({
              entity: 'adrParticipants',
              action: 'resync',
              status: 'success'
            });
            break;
            
          case 'adrComponentInstances':
            logger.info('Corrigindo discrepância em relações ADR-Instância');
            await this.syncADRComponentInstances();
            corrections.push({
              entity: 'adrComponentInstances',
              action: 'resync',
              status: 'success'
            });
            break;
            
          case 'orphanedInstances':
            logger.info('Corrigindo instâncias órfãs');
            await this.fixOrphanedInstances();
            corrections.push({
              entity: 'orphanedInstances',
              action: 'fix',
              status: 'success'
            });
            break;
        }
      }
      
      // Verificar novamente para confirmar que os problemas foram resolvidos
      const finalValidation = await this.validateIntegrity();
      
      logger.info(`Correção de integridade completada. Válido final: ${finalValidation.valid}`);
      
      return {
        fixed: finalValidation.valid,
        corrections
      };
    } catch (error) {
      logger.error('Erro durante correção de integridade', { error });
      return {
        fixed: false,
        corrections
      };
    }
  }

  /**
   * Corrige instâncias de componentes órfãs no Neo4j
   */
  private async fixOrphanedInstances(): Promise<void> {
    const session = this.driver.session();
    try {
      // Buscar instâncias órfãs (sem relação INSTANTIATES ou DEPLOYED_IN)
      const orphanedResult = await session.executeRead(tx =>
        tx.run(`
          MATCH (ci:ComponentInstance)
          WHERE NOT (ci)<-[:INSTANTIATES]-() OR NOT (ci)-[:DEPLOYED_IN]->()
          RETURN ci.id as id, ci.component_id as componentId, ci.environment_id as environmentId
        `)
      );
      
      const orphaned = orphanedResult.records.map(record => ({
        id: record.get('id'),
        componentId: record.get('componentId'),
        environmentId: record.get('environmentId')
      }));
      
      logger.info(`Encontradas ${orphaned.length} instâncias órfãs para corrigir`);
      
      for (const instance of orphaned) {
        // Verificar se existe no MariaDB usando SQL direto
        const dbInstance = await prisma.$queryRaw`
          SELECT ci.id, ci.component_id as componentId, ci.environment_id as environmentId, 
                 ci.hostname, ci.specs
          FROM Component_Instance ci
          WHERE ci.id = ${instance.id}
          LIMIT 1
        `;
        
        if (dbInstance && dbInstance.length > 0) {
          // Recriar relações
          await session.executeWrite(tx =>
            tx.run(`
              MATCH (c:Component {id: $componentId}), (ci:ComponentInstance {id: $instanceId})
              MERGE (c)-[:INSTANTIATES]->(ci)
            `, {
              componentId: dbInstance[0].componentId,
              instanceId: dbInstance[0].id
            })
          );
          
          await session.executeWrite(tx =>
            tx.run(`
              MATCH (ci:ComponentInstance {id: $instanceId}), (e:Environment {id: $environmentId})
              MERGE (ci)-[:DEPLOYED_IN]->(e)
            `, {
              instanceId: dbInstance[0].id,
              environmentId: dbInstance[0].environmentId
            })
          );
          
          logger.debug(`Corrigidas relações para instância ${dbInstance[0].id}`);
        } else {
          // Se não existe no MariaDB, excluir do Neo4j
          await session.executeWrite(tx =>
            tx.run(`
              MATCH (ci:ComponentInstance {id: $id})
              DETACH DELETE ci
            `, {
              id: instance.id
            })
          );
          
          logger.debug(`Excluída instância órfã ${instance.id} do Neo4j`);
        }
      }
      
      logger.info('Correção de instâncias órfãs concluída');
    } catch (error) {
      logger.error('Erro durante correção de instâncias órfãs', { error });
      throw error;
    } finally {
      await session.close();
    }
  }
} 