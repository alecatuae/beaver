// Script de migração para Beaver v2.0
// Este script converte dados do formato v1.x para v2.0
// Deve ser executado após a aplicação das migrations do Prisma

const { PrismaClient } = require('@prisma/client');
const { Neo4jClient } = require('../../src/db/neo4j');
const prisma = new PrismaClient();
const neo4j = new Neo4jClient();

// Cores por tipo de roadmap
const ROADMAP_COLORS = {
  'feature': '#4ade80',
  'refactor': '#22d3ee',
  'technical_debt': '#eab308',
  'infra': '#6366f1',
  'maintenance': '#a3a3a3',
  'incident': '#ef4444',
  'capacity': '#f97316'
};

// Ambientes padrão
const DEFAULT_ENVIRONMENTS = [
  { name: 'development', description: 'Ambiente de desenvolvimento' },
  { name: 'homologation', description: 'Ambiente de homologação/QA' },
  { name: 'production', description: 'Ambiente de produção' }
];

// Times iniciais
const DEFAULT_TEAMS = [
  { name: 'Network', description: 'Time de infraestrutura de rede' },
  { name: 'Operations', description: 'Time de operações' },
  { name: 'Platform', description: 'Time de plataforma' }
];

// Tipos de roadmap padrão
const DEFAULT_ROADMAP_TYPES = [
  { name: 'feature', description: 'Nova funcionalidade de produto', colorHex: '#4ade80' },
  { name: 'refactor', description: 'Melhoria interna (código/design)', colorHex: '#22d3ee' },
  { name: 'technical_debt', description: 'Dívida técnica a endereçar', colorHex: '#eab308' },
  { name: 'infra', description: 'Mudança ou projeto de infraestrutura', colorHex: '#6366f1' },
  { name: 'maintenance', description: 'Manutenção / patch / hardening', colorHex: '#a3a3a3' },
  { name: 'incident', description: 'Correção de incidente / RCA', colorHex: '#ef4444' },
  { name: 'capacity', description: 'Expansão de capacidade / escala', colorHex: '#f97316' }
];

async function migrateEnv() {
  console.log('>>> Migrando ambientes...');

  // Criar ambientes padrão
  for (const env of DEFAULT_ENVIRONMENTS) {
    const existingEnv = await prisma.environment.findFirst({
      where: { name: env.name }
    });

    if (!existingEnv) {
      console.log(`  Criando ambiente: ${env.name}`);
      const newEnv = await prisma.environment.create({
        data: env
      });

      // Sincronizar com Neo4j
      await neo4j.run(`
        CREATE (e:Environment {
          id: $id,
          name: $name, 
          description: $description,
          created_at: datetime()
        })
      `, {
        id: newEnv.id,
        name: newEnv.name,
        description: newEnv.description || ''
      });
    } else {
      console.log(`  Ambiente ${env.name} já existe (id: ${existingEnv.id})`);
    }
  }
}

async function migrateTeams() {
  console.log('>>> Migrando times...');

  // Criar times padrão
  for (const team of DEFAULT_TEAMS) {
    const existingTeam = await prisma.team.findFirst({
      where: { name: team.name }
    });

    if (!existingTeam) {
      console.log(`  Criando time: ${team.name}`);
      const newTeam = await prisma.team.create({
        data: team
      });

      // Sincronizar com Neo4j
      await neo4j.run(`
        CREATE (t:Team {
          id: $id,
          name: $name, 
          description: $description,
          created_at: datetime()
        })
      `, {
        id: newTeam.id,
        name: newTeam.name,
        description: newTeam.description || ''
      });
    } else {
      console.log(`  Time ${team.name} já existe (id: ${existingTeam.id})`);
    }
  }
}

async function migrateComponentInstances() {
  console.log('>>> Migrando instâncias de componentes...');

  // Buscar todos os componentes
  const components = await prisma.component.findMany();
  console.log(`  Encontrados ${components.length} componentes para criar instâncias`);

  const envs = await prisma.environment.findMany();
  
  // Para cada componente, criar instâncias em ambientes padrão (dev, homolog, prod)
  for (const component of components) {
    console.log(`  Processando componente: ${component.name} (id: ${component.id})`);

    // Criar instância para cada ambiente
    for (const env of envs) {
      // Verificar se já existe instância para este componente neste ambiente
      const existing = await prisma.componentInstance.findFirst({
        where: {
          componentId: component.id,
          environmentId: env.id
        }
      });

      if (!existing) {
        console.log(`    Criando instância em ambiente ${env.name}`);
        
        // Criar specs de exemplo
        const specs = {
          version: "1.0",
          resources: {
            cpu: env.name === 'production' ? '2' : '1',
            memory: env.name === 'production' ? '4Gi' : '2Gi'
          },
          notes: `Instância de ${component.name} em ${env.name}`
        };

        const hostname = `${component.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${env.name.substring(0, 3)}`;
        
        try {
          const instance = await prisma.componentInstance.create({
            data: {
              componentId: component.id,
              environmentId: env.id,
              hostname: hostname,
              specs: specs
            }
          });

          // Sincronizar com Neo4j
          await syncComponentInstanceToNeo4j(instance, component.name, env.name);
        } catch (error) {
          console.error(`    ERRO ao criar instância: ${error.message}`);
        }
      } else {
        console.log(`    Instância em ambiente ${env.name} já existe (id: ${existing.id})`);
      }
    }
  }
}

async function migrateADROwners() {
  console.log('>>> Migrando proprietários de ADRs para participantes...');

  // Buscar todos os ADRs
  const adrs = await prisma.$queryRaw`
    SELECT id, title, owner_id FROM ADR WHERE owner_id IS NOT NULL;
  `;

  if (!adrs.length) {
    console.log('  Nenhum ADR encontrado com owner_id para migrar');
    return;
  }

  console.log(`  Encontrados ${adrs.length} ADRs para migrar proprietários`);

  // Para cada ADR, criar participante com papel de owner
  for (const adr of adrs) {
    console.log(`  Processando ADR: ${adr.title} (id: ${adr.id})`);

    // Verificar se já existe participante owner para este ADR
    const existingOwner = await prisma.aDRParticipant.findFirst({
      where: {
        adrId: adr.id,
        role: 'OWNER'
      }
    });

    if (!existingOwner) {
      console.log(`    Criando participante owner para o usuário ${adr.owner_id}`);
      try {
        const participant = await prisma.aDRParticipant.create({
          data: {
            adrId: adr.id,
            userId: adr.owner_id,
            role: 'OWNER'
          }
        });

        // Sincronizar com Neo4j
        await neo4j.run(`
          MATCH (u:User {id: $userId}), (a:ADR {id: $adrId})
          MERGE (u)-[:PARTICIPATES_IN {role: 'OWNER'}]->(a)
        `, {
          userId: adr.owner_id,
          adrId: adr.id
        });
      } catch (error) {
        console.error(`    ERRO ao criar participante: ${error.message}`);
      }
    } else {
      console.log(`    Participante owner já existe (id: ${existingOwner.id})`);
    }
  }
}

async function createRoadmapTypes() {
  console.log('>>> Criando tipos de roadmap...');

  // Criar tipos de roadmap padrão
  for (const type of DEFAULT_ROADMAP_TYPES) {
    const existingType = await prisma.roadmapType.findFirst({
      where: { name: type.name }
    });

    if (!existingType) {
      console.log(`  Criando tipo: ${type.name}`);
      await prisma.roadmapType.create({
        data: type
      });
    } else {
      console.log(`  Tipo ${type.name} já existe (id: ${existingType.id})`);
    }
  }
}

async function syncComponentInstanceToNeo4j(instance, componentName, envName) {
  // 1. Criar nó da instância
  const instanceNode = await neo4j.run(`
    CREATE (ci:ComponentInstance {
      id: $id,
      component_id: $componentId,
      environment_id: $environmentId,
      hostname: $hostname,
      specs: $specs,
      created_at: datetime()
    })
    RETURN ci
  `, {
    id: instance.id,
    componentId: instance.componentId,
    environmentId: instance.environmentId,
    hostname: instance.hostname,
    specs: JSON.stringify(instance.specs)
  });

  // 2. Relacionar ao componente
  await neo4j.run(`
    MATCH (c:Component {id: $componentId}), (ci:ComponentInstance {id: $instanceId})
    MERGE (c)-[:INSTANTIATES]->(ci)
  `, {
    componentId: instance.componentId,
    instanceId: instance.id
  });

  // 3. Relacionar ao ambiente
  await neo4j.run(`
    MATCH (ci:ComponentInstance {id: $instanceId}), (e:Environment {id: $environmentId})
    MERGE (ci)-[:DEPLOYED_IN]->(e)
  `, {
    instanceId: instance.id,
    environmentId: instance.environmentId
  });

  console.log(`    Instância de ${componentName} criada em Neo4j para ambiente ${envName}`);
}

async function run() {
  try {
    console.log('Iniciando migração de dados para Beaver v2.0...');
    
    // 1. Criar ambientes padrão
    await migrateEnv();
    
    // 2. Criar times padrão
    await migrateTeams();
    
    // 3. Criar instâncias para componentes existentes
    await migrateComponentInstances();
    
    // 4. Migrar proprietários de ADRs para o novo modelo de participantes
    await migrateADROwners();
    
    // 5. Criar tipos de roadmap padrão
    await createRoadmapTypes();
    
    console.log('Migração concluída com sucesso!');
  } catch (error) {
    console.error('ERRO durante migração:', error);
  } finally {
    await prisma.$disconnect();
    await neo4j.close();
  }
}

run(); 