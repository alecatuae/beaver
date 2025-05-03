// Script de sincronização Neo4j para Beaver v2.0
// Este script garante a sincronização dos dados entre MariaDB e Neo4j

const { PrismaClient } = require('@prisma/client');
const { Neo4jClient } = require('../../src/db/neo4j');
const prisma = new PrismaClient();
const neo4j = new Neo4jClient();

async function syncEnvironments() {
  console.log('>>> Sincronizando ambientes...');
  
  // Buscar todos os ambientes no MariaDB
  const environments = await prisma.environment.findMany();
  console.log(`  Encontrados ${environments.length} ambientes para sincronizar`);
  
  for (const env of environments) {
    console.log(`  Processando ambiente: ${env.name} (id: ${env.id})`);
    
    // Verificar se o ambiente existe no Neo4j
    const existingEnv = await neo4j.run(`
      MATCH (e:Environment {id: $id})
      RETURN e
    `, { id: env.id });
    
    if (existingEnv.length === 0) {
      console.log(`    Criando ambiente no Neo4j: ${env.name}`);
      await neo4j.run(`
        CREATE (e:Environment {
          id: $id,
          name: $name,
          description: $description,
          created_at: datetime()
        })
      `, {
        id: env.id,
        name: env.name,
        description: env.description || ''
      });
    } else {
      console.log(`    Atualizando ambiente no Neo4j: ${env.name}`);
      await neo4j.run(`
        MATCH (e:Environment {id: $id})
        SET e.name = $name,
            e.description = $description
      `, {
        id: env.id,
        name: env.name,
        description: env.description || ''
      });
    }
  }
}

async function syncTeams() {
  console.log('>>> Sincronizando times...');
  
  // Buscar todos os times no MariaDB
  const teams = await prisma.team.findMany();
  console.log(`  Encontrados ${teams.length} times para sincronizar`);
  
  for (const team of teams) {
    console.log(`  Processando time: ${team.name} (id: ${team.id})`);
    
    // Verificar se o time existe no Neo4j
    const existingTeam = await neo4j.run(`
      MATCH (t:Team {id: $id})
      RETURN t
    `, { id: team.id });
    
    if (existingTeam.length === 0) {
      console.log(`    Criando time no Neo4j: ${team.name}`);
      await neo4j.run(`
        CREATE (t:Team {
          id: $id,
          name: $name,
          description: $description,
          created_at: datetime()
        })
      `, {
        id: team.id,
        name: team.name,
        description: team.description || ''
      });
    } else {
      console.log(`    Atualizando time no Neo4j: ${team.name}`);
      await neo4j.run(`
        MATCH (t:Team {id: $id})
        SET t.name = $name,
            t.description = $description
      `, {
        id: team.id,
        name: team.name,
        description: team.description || ''
      });
    }
    
    // Buscar componentes deste time
    const components = await prisma.component.findMany({
      where: { teamId: team.id }
    });
    
    if (components.length > 0) {
      console.log(`    Atualizando ${components.length} componentes relacionados ao time`);
      
      for (const component of components) {
        await neo4j.run(`
          MATCH (c:Component {id: $componentId}), (t:Team {id: $teamId})
          MERGE (c)-[:MANAGED_BY]->(t)
        `, {
          componentId: component.id,
          teamId: team.id
        });
      }
    }
  }
}

async function syncComponentInstances() {
  console.log('>>> Sincronizando instâncias de componentes...');
  
  // Buscar todas as instâncias no MariaDB
  const instances = await prisma.componentInstance.findMany({
    include: {
      component: true,
      environment: true
    }
  });
  
  console.log(`  Encontradas ${instances.length} instâncias para sincronizar`);
  
  for (const instance of instances) {
    console.log(`  Processando instância: ${instance.hostname || 'sem hostname'} (id: ${instance.id})`);
    
    // Verificar se a instância existe no Neo4j
    const existingInstance = await neo4j.run(`
      MATCH (ci:ComponentInstance {id: $id})
      RETURN ci
    `, { id: instance.id });
    
    if (existingInstance.length === 0) {
      console.log(`    Criando instância no Neo4j`);
      
      // 1. Criar nó da instância
      await neo4j.run(`
        CREATE (ci:ComponentInstance {
          id: $id,
          component_id: $componentId,
          environment_id: $environmentId,
          hostname: $hostname,
          specs: $specs,
          created_at: datetime()
        })
      `, {
        id: instance.id,
        componentId: instance.componentId,
        environmentId: instance.environmentId,
        hostname: instance.hostname || null,
        specs: JSON.stringify(instance.specs || {})
      });
      
      // 2. Criar relação com componente
      await neo4j.run(`
        MATCH (c:Component {id: $componentId}), (ci:ComponentInstance {id: $instanceId})
        MERGE (c)-[:INSTANTIATES]->(ci)
      `, {
        componentId: instance.componentId,
        instanceId: instance.id
      });
      
      // 3. Criar relação com ambiente
      await neo4j.run(`
        MATCH (ci:ComponentInstance {id: $instanceId}), (e:Environment {id: $environmentId})
        MERGE (ci)-[:DEPLOYED_IN]->(e)
      `, {
        instanceId: instance.id,
        environmentId: instance.environmentId
      });
    } else {
      console.log(`    Atualizando instância no Neo4j`);
      
      // Atualizar propriedades
      await neo4j.run(`
        MATCH (ci:ComponentInstance {id: $id})
        SET ci.hostname = $hostname,
            ci.specs = $specs
      `, {
        id: instance.id,
        hostname: instance.hostname || null,
        specs: JSON.stringify(instance.specs || {})
      });
      
      // Verificar relações
      await neo4j.run(`
        MATCH (c:Component {id: $componentId}), (ci:ComponentInstance {id: $instanceId})
        MERGE (c)-[:INSTANTIATES]->(ci)
      `, {
        componentId: instance.componentId,
        instanceId: instance.id
      });
      
      await neo4j.run(`
        MATCH (ci:ComponentInstance {id: $instanceId}), (e:Environment {id: $environmentId})
        MERGE (ci)-[:DEPLOYED_IN]->(e)
      `, {
        instanceId: instance.id,
        environmentId: instance.environmentId
      });
    }
  }
}

async function syncADRParticipants() {
  console.log('>>> Sincronizando participantes de ADRs...');
  
  // Buscar todos os participantes de ADRs
  const participants = await prisma.aDRParticipant.findMany({
    include: {
      adr: true,
      user: true
    }
  });
  
  console.log(`  Encontrados ${participants.length} participantes para sincronizar`);
  
  for (const participant of participants) {
    console.log(`  Processando participante: User ${participant.userId} em ADR ${participant.adrId} (papel: ${participant.role})`);
    
    // Criar ou atualizar relação no Neo4j
    await neo4j.run(`
      MATCH (u:User {id: $userId}), (a:ADR {id: $adrId})
      MERGE (u)-[r:PARTICIPATES_IN]->(a)
      ON CREATE SET r.role = $role
      ON MATCH SET r.role = $role
    `, {
      userId: participant.userId,
      adrId: participant.adrId,
      role: participant.role
    });
  }
}

async function syncADRComponentInstances() {
  console.log('>>> Sincronizando relações entre ADRs e instâncias de componentes...');
  
  // Buscar todas as relações entre ADRs e instâncias
  const adrInstances = await prisma.aDRComponentInstance.findMany();
  
  console.log(`  Encontradas ${adrInstances.length} relações para sincronizar`);
  
  for (const rel of adrInstances) {
    console.log(`  Processando relação: ADR ${rel.adrId} -> Instância ${rel.instanceId} (impacto: ${rel.impactLevel})`);
    
    // Criar ou atualizar relação no Neo4j
    await neo4j.run(`
      MATCH (a:ADR {id: $adrId}), (ci:ComponentInstance {id: $instanceId})
      MERGE (a)-[r:AFFECTS_INSTANCE]->(ci)
      ON CREATE SET r.impact_level = $impactLevel
      ON MATCH SET r.impact_level = $impactLevel
    `, {
      adrId: rel.adrId,
      instanceId: rel.instanceId,
      impactLevel: rel.impactLevel
    });
  }
}

async function verifyIntegrity() {
  console.log('>>> Verificando integridade dos dados...');
  
  // 1. Verificar contagens
  const envCountPrisma = await prisma.environment.count();
  const envCountNeo4j = await neo4j.run(`MATCH (e:Environment) RETURN count(e) as count`);
  
  const teamCountPrisma = await prisma.team.count();
  const teamCountNeo4j = await neo4j.run(`MATCH (t:Team) RETURN count(t) as count`);
  
  const instanceCountPrisma = await prisma.componentInstance.count();
  const instanceCountNeo4j = await neo4j.run(`MATCH (ci:ComponentInstance) RETURN count(ci) as count`);
  
  console.log(`  Ambientes: MariaDB=${envCountPrisma}, Neo4j=${envCountNeo4j[0]?.count || 0}`);
  console.log(`  Times: MariaDB=${teamCountPrisma}, Neo4j=${teamCountNeo4j[0]?.count || 0}`);
  console.log(`  Instâncias: MariaDB=${instanceCountPrisma}, Neo4j=${instanceCountNeo4j[0]?.count || 0}`);
  
  // 2. Verificar relações
  const instRelCountPrisma = await prisma.componentInstance.count();
  const instRelCountNeo4j = await neo4j.run(`
    MATCH (c:Component)-[:INSTANTIATES]->(ci:ComponentInstance)
    RETURN count(ci) as count
  `);
  
  const envRelCountNeo4j = await neo4j.run(`
    MATCH (ci:ComponentInstance)-[:DEPLOYED_IN]->(e:Environment)
    RETURN count(ci) as count
  `);
  
  console.log(`  Relações Component->Instance: Neo4j=${instRelCountNeo4j[0]?.count || 0}/${instRelCountPrisma}`);
  console.log(`  Relações Instance->Environment: Neo4j=${envRelCountNeo4j[0]?.count || 0}/${instRelCountPrisma}`);
  
  // 3. Verificar se há instâncias órfãs no Neo4j (sem componente ou ambiente)
  const orphanedInstances = await neo4j.run(`
    MATCH (ci:ComponentInstance)
    WHERE NOT (ci)<-[:INSTANTIATES]-() OR NOT (ci)-[:DEPLOYED_IN]->()
    RETURN count(ci) as count
  `);
  
  if ((orphanedInstances[0]?.count || 0) > 0) {
    console.log(`  ATENÇÃO: Há ${orphanedInstances[0].count} instâncias órfãs no Neo4j`);
  } else {
    console.log(`  Todas as instâncias estão corretamente relacionadas`);
  }
}

async function run() {
  try {
    console.log('Iniciando sincronização de dados MariaDB -> Neo4j para Beaver v2.0...');
    
    // 1. Sincronizar ambientes
    await syncEnvironments();
    
    // 2. Sincronizar times
    await syncTeams();
    
    // 3. Sincronizar instâncias de componentes
    await syncComponentInstances();
    
    // 4. Sincronizar participantes de ADRs
    await syncADRParticipants();
    
    // 5. Sincronizar relações ADR -> instância
    await syncADRComponentInstances();
    
    // 6. Verificar integridade
    await verifyIntegrity();
    
    console.log('Sincronização concluída com sucesso!');
  } catch (error) {
    console.error('ERRO durante sincronização:', error);
  } finally {
    await prisma.$disconnect();
    await neo4j.close();
  }
}

run(); 