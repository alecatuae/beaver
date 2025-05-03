// Script para atualizar referências entre entidades no Beaver v2.0
// Este script atualiza e corrige referências entre componentes, ADRs e outras entidades

const { PrismaClient } = require('@prisma/client');
const { Neo4jClient } = require('../../src/db/neo4j');
const prisma = new PrismaClient();
const neo4j = new Neo4jClient();

async function updateTeamComponentReferences() {
  console.log('>>> Atualizando referências entre times e componentes...');
  
  // Buscar componentes sem time
  const componentsWithoutTeam = await prisma.component.findMany({
    where: {
      teamId: null
    }
  });
  
  console.log(`  Encontrados ${componentsWithoutTeam.length} componentes sem time associado`);
  
  if (componentsWithoutTeam.length > 0) {
    // Buscar time padrão (Platform)
    const defaultTeam = await prisma.team.findFirst({
      where: {
        name: 'Platform'
      }
    });
    
    if (defaultTeam) {
      console.log(`  Associando componentes ao time padrão: ${defaultTeam.name} (id: ${defaultTeam.id})`);
      
      for (const component of componentsWithoutTeam) {
        console.log(`    Associando componente ${component.name} ao time ${defaultTeam.name}`);
        
        await prisma.component.update({
          where: { id: component.id },
          data: { teamId: defaultTeam.id }
        });
        
        // Atualizar no Neo4j
        await neo4j.run(`
          MATCH (c:Component {id: $componentId}), (t:Team {id: $teamId})
          MERGE (c)-[:MANAGED_BY]->(t)
        `, {
          componentId: component.id,
          teamId: defaultTeam.id
        });
      }
    } else {
      console.log('  Time padrão (Platform) não encontrado. Componentes permanecerão sem associação.');
    }
  }
}

async function updateGlossaryTermStatuses() {
  console.log('>>> Atualizando status dos termos de glossário...');
  
  // Buscar termos que não estão com status no formato enum
  const termsToUpdate = await prisma.$queryRaw`
    SELECT id, term, status FROM GlossaryTerm 
    WHERE status NOT IN ('DRAFT', 'APPROVED', 'DEPRECATED')
  `;
  
  console.log(`  Encontrados ${termsToUpdate.length} termos para atualizar status`);
  
  for (const term of termsToUpdate) {
    console.log(`  Processando termo: ${term.term} (status atual: ${term.status})`);
    
    // Mapear valores antigos para novos enums
    let newStatus = 'DRAFT';
    
    if (term.status) {
      const status = term.status.toUpperCase();
      
      if (status.includes('APROV') || status.includes('APPROV') || status === 'ACTIVE') {
        newStatus = 'APPROVED';
      } else if (status.includes('DEPREC') || status === 'DEPRECATED' || status === 'LEGACY') {
        newStatus = 'DEPRECATED';
      }
    }
    
    console.log(`    Atualizando status para: ${newStatus}`);
    
    await prisma.glossaryTerm.update({
      where: { id: term.id },
      data: { status: newStatus }
    });
  }
}

async function updateLogLevels() {
  console.log('>>> Atualizando níveis de log...');
  
  // Buscar logs que não estão com level no formato enum
  const logsToUpdate = await prisma.$queryRaw`
    SELECT id, level FROM Log 
    WHERE level NOT IN ('INFO', 'WARN', 'ERROR')
  `;
  
  console.log(`  Encontrados ${logsToUpdate.length} logs para atualizar nível`);
  
  for (const log of logsToUpdate) {
    console.log(`  Processando log ${log.id} (nível atual: ${log.level})`);
    
    // Mapear valores antigos para novos enums
    let newLevel = 'INFO';
    
    if (log.level) {
      const level = log.level.toUpperCase();
      
      if (level.includes('WARN') || level.includes('ALERT')) {
        newLevel = 'WARN';
      } else if (level.includes('ERR') || level.includes('CRIT') || level.includes('FATAL')) {
        newLevel = 'ERROR';
      }
    }
    
    console.log(`    Atualizando nível para: ${newLevel}`);
    
    await prisma.log.update({
      where: { id: log.id },
      data: { level: newLevel }
    });
  }
}

async function updateMissingReferences() {
  console.log('>>> Verificando e corrigindo referências ausentes...');
  
  // 1. ADRs sem participantes (adicionar dono com base em log)
  const adrsWithoutParticipants = await prisma.aDR.findMany({
    where: {
      participants: {
        none: {}
      }
    },
    include: {
      tags: true
    }
  });
  
  console.log(`  Encontrados ${adrsWithoutParticipants.length} ADRs sem participantes`);
  
  if (adrsWithoutParticipants.length > 0) {
    // Buscar administrador para associar como dono
    const admin = await prisma.user.findFirst({
      where: {
        role: 'ADMIN'
      }
    });
    
    if (admin) {
      console.log(`  Associando ADRs ao administrador: ${admin.username} (id: ${admin.id})`);
      
      for (const adr of adrsWithoutParticipants) {
        console.log(`    Associando ADR ${adr.title} (id: ${adr.id}) ao administrador`);
        
        await prisma.aDRParticipant.create({
          data: {
            adrId: adr.id,
            userId: admin.id,
            role: 'OWNER'
          }
        });
        
        // Atualizar no Neo4j
        await neo4j.run(`
          MATCH (u:User {id: $userId}), (a:ADR {id: $adrId})
          MERGE (u)-[:PARTICIPATES_IN {role: 'OWNER'}]->(a)
        `, {
          userId: admin.id,
          adrId: adr.id
        });
      }
    } else {
      console.log('  Administrador não encontrado. ADRs permanecerão sem participantes.');
    }
  }
  
  // 2. Componentes em ADRs sem instâncias
  const adrComponents = await prisma.aDRComponent.findMany({
    include: {
      component: true,
      adr: true
    }
  });
  
  console.log(`  Encontrados ${adrComponents.length} associações entre ADRs e componentes para verificar`);
  
  for (const adrComp of adrComponents) {
    // Verificar se já existe associação com instâncias deste componente
    const existingInstanceRefs = await prisma.aDRComponentInstance.findMany({
      where: {
        adrId: adrComp.adrId,
        instance: {
          componentId: adrComp.componentId
        }
      }
    });
    
    if (existingInstanceRefs.length === 0) {
      console.log(`    ADR ${adrComp.adr.title} referencia componente ${adrComp.component.name} sem instâncias`);
      
      // Buscar instâncias deste componente
      const instances = await prisma.componentInstance.findMany({
        where: {
          componentId: adrComp.componentId
        }
      });
      
      if (instances.length > 0) {
        console.log(`      Criando associações com ${instances.length} instâncias`);
        
        for (const instance of instances) {
          try {
            await prisma.aDRComponentInstance.create({
              data: {
                adrId: adrComp.adrId,
                instanceId: instance.id,
                impactLevel: 'MEDIUM'
              }
            });
            
            // Atualizar no Neo4j
            await neo4j.run(`
              MATCH (a:ADR {id: $adrId}), (ci:ComponentInstance {id: $instanceId})
              MERGE (a)-[:AFFECTS_INSTANCE {impact_level: 'MEDIUM'}]->(ci)
            `, {
              adrId: adrComp.adrId,
              instanceId: instance.id
            });
          } catch (error) {
            console.error(`      ERRO ao criar associação: ${error.message}`);
          }
        }
      } else {
        console.log(`      Componente não possui instâncias para associar`);
      }
    }
  }
}

async function run() {
  try {
    console.log('Iniciando atualização de referências para Beaver v2.0...');
    
    // 1. Atualizar referências entre times e componentes
    await updateTeamComponentReferences();
    
    // 2. Atualizar status de termos do glossário
    await updateGlossaryTermStatuses();
    
    // 3. Atualizar níveis de log
    await updateLogLevels();
    
    // 4. Verificar e corrigir referências ausentes
    await updateMissingReferences();
    
    console.log('Atualização de referências concluída com sucesso!');
  } catch (error) {
    console.error('ERRO durante atualização de referências:', error);
  } finally {
    await prisma.$disconnect();
    await neo4j.close();
  }
}

run(); 