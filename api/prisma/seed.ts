import { PrismaClient, User_role, Component_status, ADR_status } from '@prisma/client';
import { hashPassword } from '../src/utils/auth';
import * as neo4j from 'neo4j-driver';
import { Neo4jClient } from '../src/db/neo4j';

const prisma = new PrismaClient();

// Cliente Neo4j para sincronizar componentes
const neo4jDriver = neo4j.driver(
  process.env.NEO4J_URL || 'bolt://localhost:7687',
  neo4j.auth.basic(
    process.env.NEO4J_USER || 'neo4j',
    process.env.NEO4J_PASSWORD || 'beaver12345'
  )
);
const neo4jClient = new Neo4jClient(neo4jDriver);

async function main() {
  console.log('Iniciando seed de dados...');

  // Cria usuários iniciais
  const adminPassword = await hashPassword('admin123');
  const userPassword = await hashPassword('user123');
  const guestPassword = await hashPassword('guest123');

  console.log('Criando usuários...');
  const admin = await prisma.user.upsert({
    where: { email: 'admin@beaver.com' },
    update: {},
    create: {
      email: 'admin@beaver.com',
      username: 'admin',
      passwordHash: adminPassword,
      role: User_role.ADMIN,
    },
  });

  const user = await prisma.user.upsert({
    where: { email: 'user@beaver.com' },
    update: {},
    create: {
      email: 'user@beaver.com',
      username: 'user',
      passwordHash: userPassword,
      role: User_role.USER,
    },
  });

  const guest = await prisma.user.upsert({
    where: { email: 'guest@beaver.com' },
    update: {},
    create: {
      email: 'guest@beaver.com',
      username: 'guest',
      passwordHash: guestPassword,
      role: User_role.GUEST,
    },
  });

  console.log('Criando categorias...');
  // Criar as categorias
  const categories = [
    { name: 'Application', description: 'Aplicações e software' },
    { name: 'Authentication and Authorization', description: 'Sistemas de autenticação e autorização' },
    { name: 'Compliance', description: 'Sistemas de conformidade regulatória' },
    { name: 'Database', description: 'Sistemas de banco de dados' },
    { name: 'Facilities', description: 'Instalações físicas' },
    { name: 'Infrastructure Management', description: 'Gerenciamento de infraestrutura' },
    { name: 'Infrastructure Monitoring', description: 'Monitoramento de infraestrutura' },
    { name: 'Network Services', description: 'Serviços de rede' },
    { name: 'Networking', description: 'Componentes de rede' },
    { name: 'Operation Systems', description: 'Sistemas operacionais' },
    { name: 'Platform', description: 'Plataformas de desenvolvimento' },
    { name: 'Runtime', description: 'Ambientes de execução' },
    { name: 'Security', description: 'Sistemas de segurança' },
    { name: 'Servers', description: 'Servidores físicos ou virtuais' },
    { name: 'Storage', description: 'Sistemas de armazenamento' },
    { name: 'Telecom', description: 'Sistemas de telecomunicações' },
    { name: 'Virtualization', description: 'Sistemas de virtualização' },
    { name: 'NA (Default)', description: 'Categoria padrão para componentes sem categorização específica' }
  ];

  for (const category of categories) {
    // Criando cada categoria com um ID único
    await prisma.$executeRaw`INSERT IGNORE INTO Category (name, description) VALUES (${category.name}, ${category.description})`;
  }

  // Obter a categoria NA (Default)
  const defaultCategory = await prisma.category.findFirst({
    where: { name: 'NA (Default)' },
  });

  const databaseCategory = await prisma.category.findFirst({
    where: { name: 'Database' },
  });

  const appCategory = await prisma.category.findFirst({
    where: { name: 'Application' },
  });

  console.log('Criando componentes...');
  
  // Criar componentes de teste
  const componentes = [
    { 
      name: 'API Gateway', 
      description: 'API Gateway principal', 
      status: Component_status.ACTIVE,
      categoryId: appCategory?.id || defaultCategory?.id
    },
    { 
      name: 'Serviço de Autenticação', 
      description: 'Serviço responsável pela autenticação de usuários', 
      status: Component_status.ACTIVE,
      categoryId: appCategory?.id || defaultCategory?.id
    },
    { 
      name: 'Banco de Dados Principal', 
      description: 'Banco de dados relacional principal', 
      status: Component_status.ACTIVE,
      categoryId: databaseCategory?.id || defaultCategory?.id
    },
    { 
      name: 'Serviço de Notificações', 
      description: 'Serviço de notificações push e email', 
      status: Component_status.PLANNED,
      categoryId: appCategory?.id || defaultCategory?.id
    }
  ];

  // Criar componentes no MariaDB e sincronizar com Neo4j
  const componentesIds = [];
  for (const comp of componentes) {
    // Primeiro verificar se o componente já existe
    let component = await prisma.component.findFirst({
      where: { name: comp.name }
    });
    
    // Se não existir, criar
    if (!component) {
      component = await prisma.component.create({
        data: {
          name: comp.name,
          description: comp.description,
          status: comp.status,
          categoryId: comp.categoryId
        },
      });
      console.log(`Componente criado: ${component.id} - ${component.name}`);
    } else {
      console.log(`Componente já existe: ${component.id} - ${component.name}`);
    }
    
    componentesIds.push(component.id);
    
    // Sincronizar com Neo4j
    await neo4jClient.upsertComponent({
      id: component.id,
      name: component.name,
      description: component.description || '',
      status: comp.status
    });
    
    console.log(`Componente ${component.id} sincronizado com Neo4j`);
  }

  // Criar relacionamentos
  if (componentesIds.length >= 4) {
    try {
      // API Gateway -> Serviço de Autenticação
      const rel1 = await neo4jClient.createRelation(
        componentesIds[0], // API Gateway
        componentesIds[1], // Serviço de Autenticação
        'DEPENDS_ON',
        { description: 'API Gateway depende do serviço de autenticação para validar tokens' }
      );
      console.log(`Relacionamento criado: ${componentesIds[0]} -> ${componentesIds[1]}`);

      // API Gateway -> Banco de Dados Principal
      const rel2 = await neo4jClient.createRelation(
        componentesIds[0], // API Gateway
        componentesIds[2], // Banco de Dados Principal
        'COMMUNICATES_WITH',
        { description: 'API Gateway se comunica com o banco de dados' }
      );
      console.log(`Relacionamento criado: ${componentesIds[0]} -> ${componentesIds[2]}`);

      // Serviço de Autenticação -> Banco de Dados Principal
      const rel3 = await neo4jClient.createRelation(
        componentesIds[1], // Serviço de Autenticação 
        componentesIds[2], // Banco de Dados Principal
        'DEPENDS_ON',
        { description: 'Serviço de autenticação depende do banco de dados para armazenar usuários' }
      );
      console.log(`Relacionamento criado: ${componentesIds[1]} -> ${componentesIds[2]}`);

      // Serviço de Notificações -> API Gateway
      const rel4 = await neo4jClient.createRelation(
        componentesIds[3], // Serviço de Notificações
        componentesIds[0], // API Gateway
        'USES',
        { description: 'Serviço de notificações usa o API Gateway para enviar notificações' }
      );
      console.log(`Relacionamento criado: ${componentesIds[3]} -> ${componentesIds[0]}`);
    } catch (error) {
      console.error('Erro ao criar relacionamentos:', error);
    }
  }

  console.log('Criando ambientes...');
  
  // Criar ambientes
  const ambientes = [
    { name: 'development', description: 'Ambiente de desenvolvimento' },
    { name: 'homologation', description: 'Ambiente de homologação/testes' },
    { name: 'production', description: 'Ambiente de produção' }
  ];
  
  for (const amb of ambientes) {
    await prisma.environment.upsert({
      where: { name: amb.name },
      update: {},
      create: amb
    });
  }
  
  // Buscar IDs dos ambientes
  const envDev = await prisma.environment.findUnique({ where: { name: 'development' } });
  const envProd = await prisma.environment.findUnique({ where: { name: 'production' } });
  
  if (envDev && envProd) {
    console.log('Criando instâncias de componentes...');
    
    // Criar instâncias de componentes
    for (const compId of componentesIds) {
      // Instância para desenvolvimento
      await prisma.componentInstance.upsert({
        where: { 
          uniq_comp_env: {
            componentId: compId,
            environmentId: envDev.id
          }
        },
        update: {},
        create: {
          componentId: compId,
          environmentId: envDev.id,
          hostname: `comp-${compId}-dev`,
          specs: { cpu: '2', memory: '4Gi', disk: '20Gi' }
        }
      });
      
      // Instância para produção
      await prisma.componentInstance.upsert({
        where: { 
          uniq_comp_env: {
            componentId: compId,
            environmentId: envProd.id
          }
        },
        update: {},
        create: {
          componentId: compId,
          environmentId: envProd.id,
          hostname: `comp-${compId}-prod`,
          specs: { cpu: '4', memory: '8Gi', disk: '50Gi' }
        }
      });
    }
  }

  console.log('Criando ADRs...');
  
  // Criar ADRs
  const adr1 = await prisma.aDR.upsert({
    where: { id: 1 },
    update: {},
    create: {
      title: 'Adoção do Neo4j como banco de grafos',
      description: 'Decidimos usar Neo4j como nosso banco de dados de grafos para representar relações entre componentes arquiteturais devido à sua maturidade e suporte a consultas Cypher.',
      status: ADR_status.ACCEPTED,
      participants: {
        create: [
          {
            userId: admin.id,
            role: 'OWNER'
          },
          {
            userId: user.id,
            role: 'REVIEWER'
          }
        ]
      },
      components: {
        create: [
          { componentId: componentesIds[2] } // Banco de Dados Principal
        ]
      }
    }
  });

  const adr2 = await prisma.aDR.upsert({
    where: { id: 2 },
    update: {},
    create: {
      title: 'Adoção do Next.js para Frontend',
      description: 'Next.js foi escolhido para o frontend devido ao seu suporte a SSR, API routes, e ecossistema React maduro. Isso permite uma experiência de usuário mais fluida e melhor SEO.',
      status: ADR_status.DRAFT,
      participants: {
        create: [
          {
            userId: user.id,
            role: 'OWNER'
          },
          {
            userId: guest.id,
            role: 'REVIEWER'
          }
        ]
      },
      components: {
        create: componentesIds.slice(0, 2).map(id => ({ componentId: id }))
      }
    }
  });

  console.log('Criando tipos de roadmap...');
  
  // Criar tipos de roadmap
  const roadmapTypes = [
    { name: 'feature', description: 'Nova funcionalidade', colorHex: '#4ade80' },
    { name: 'bugfix', description: 'Correção de bug', colorHex: '#f87171' },
    { name: 'improvement', description: 'Melhoria em funcionalidade existente', colorHex: '#60a5fa' },
    { name: 'technical_debt', description: 'Dívida técnica', colorHex: '#fbbf24' }
  ];
  
  for (const type of roadmapTypes) {
    await prisma.roadmapType.upsert({
      where: { name: type.name },
      update: {},
      create: type
    });
  }
  
  // Buscar tipos
  const featureType = await prisma.roadmapType.findFirst({ where: { name: 'feature' } });
  const bugfixType = await prisma.roadmapType.findFirst({ where: { name: 'bugfix' } });
  
  if (featureType && bugfixType) {
    console.log('Criando itens de roadmap...');
    
    // Criar itens de roadmap
    await prisma.roadmapItem.createMany({
      skipDuplicates: true,
      data: [
        {
          title: 'Implementar autenticação SSO',
          description: 'Adicionar suporte a login via SSO',
          componentId: componentesIds[1], // Serviço de Autenticação
          typeId: featureType.id,
          status: 'TODO'
        },
        {
          title: 'Melhorar desempenho do API Gateway',
          description: 'Otimizar rotas e caching',
          componentId: componentesIds[0], // API Gateway
          typeId: featureType.id,
          status: 'IN_PROGRESS'
        },
        {
          title: 'Corrigir vazamento de memória no DB',
          description: 'Resolver problema com conexões não fechadas',
          componentId: componentesIds[2], // Banco de Dados
          typeId: bugfixType.id,
          status: 'DONE'
        }
      ]
    });
  }

  console.log('Criando logs...');
  
  // Criar logs
  await prisma.log.createMany({
    skipDuplicates: true,
    data: [
      {
        userId: admin.id,
        level: 'INFO',
        message: 'Criou componente Frontend',
        metadata: { component_id: componentesIds[0] }
      },
      {
        userId: user.id,
        level: 'INFO',
        message: 'Criou componente API BFF',
        metadata: { component_id: componentesIds[1] }
      },
      {
        userId: admin.id,
        level: 'INFO',
        message: 'Criou componente Database',
        metadata: { component_id: componentesIds[2] }
      }
    ]
  });

  console.log('Criando termos do glossário...');
  
  // Criar termos do glossário
  await prisma.glossaryTerm.createMany({
    skipDuplicates: true,
    data: [
      {
        term: 'API Gateway',
        definition: 'Componente que atua como ponto de entrada único para APIs',
        status: 'APPROVED'
      },
      {
        term: 'SSO',
        definition: 'Single Sign-On, método de autenticação que permite login único em múltiplos sistemas',
        status: 'APPROVED'
      },
      {
        term: 'TRM',
        definition: 'Technology Reference Model, modelo para estruturar e categorizar a arquitetura tecnológica',
        status: 'DRAFT'
      }
    ]
  });

  console.log('Seed concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await neo4jDriver.close();
  }); 