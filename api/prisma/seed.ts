import { PrismaClient, Role, ComponentStatus, ADRStatus, RoadmapType } from '@prisma/client';
import { hashPassword } from '../src/utils/auth';
import * as neo4j from 'neo4j-driver';
import { Neo4jClient } from '../src/db/neo4j';

const prisma = new PrismaClient();

// Cliente Neo4j para sincronizar componentes
const neo4jDriver = neo4j.driver(
  process.env.NEO4J_URI || 'bolt://neo4j:7687',
  neo4j.auth.basic(
    process.env.NEO4J_USERNAME || 'neo4j',
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
      role: Role.ADMIN,
    },
  });

  const user = await prisma.user.upsert({
    where: { email: 'user@beaver.com' },
    update: {},
    create: {
      email: 'user@beaver.com',
      username: 'user',
      passwordHash: userPassword,
      role: Role.USER,
    },
  });

  const guest = await prisma.user.upsert({
    where: { email: 'guest@beaver.com' },
    update: {},
    create: {
      email: 'guest@beaver.com',
      username: 'guest',
      passwordHash: guestPassword,
      role: Role.GUEST,
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
      status: ComponentStatus.ACTIVE,
      categoryId: appCategory?.id || defaultCategory?.id
    },
    { 
      name: 'Serviço de Autenticação', 
      description: 'Serviço responsável pela autenticação de usuários', 
      status: ComponentStatus.ACTIVE,
      categoryId: appCategory?.id || defaultCategory?.id
    },
    { 
      name: 'Banco de Dados Principal', 
      description: 'Banco de dados relacional principal', 
      status: ComponentStatus.ACTIVE,
      categoryId: databaseCategory?.id || defaultCategory?.id
    },
    { 
      name: 'Serviço de Notificações', 
      description: 'Serviço de notificações push e email', 
      status: ComponentStatus.INACTIVE,
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
        'COMMUNICATES_WITH',
        { description: 'Serviço de notificações se comunica com o API Gateway' }
      );
      console.log(`Relacionamento criado: ${componentesIds[3]} -> ${componentesIds[0]}`);
    } catch (error) {
      console.error('Erro ao criar relacionamentos:', error);
    }
  }

  console.log('Criando ADRs...');
  // Cria ADRs iniciais
  const adrGraphDb = await prisma.aDR.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      title: 'Uso de Neo4j como banco de grafos',
      decision: 'Decidimos usar Neo4j como nosso banco de dados de grafos para representar relações entre componentes arquiteturais devido à sua maturidade e suporte a consultas Cypher.',
      status: ADRStatus.ACCEPTED,
    },
  });

  const adrNextjs = await prisma.aDR.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2,
      title: 'Escolha do Next.js como framework frontend',
      decision: 'Next.js foi escolhido para o frontend devido ao seu suporte a SSR, API routes, e ecossistema React maduro. Isso permite uma experiência de usuário mais fluida e melhor SEO.',
      status: ADRStatus.ACCEPTED,
    },
  });

  console.log('Criando termos do glossário...');
  // Cria termos do glossário iniciais
  const termAdr = await prisma.glossaryTerm.upsert({
    where: { term: 'ADR' },
    update: {},
    create: {
      term: 'ADR',
      definition: 'Architectural Decision Record - Documento que registra uma decisão de arquitetura significativa junto com seu contexto e consequências.',
    },
  });

  const termGraphDb = await prisma.glossaryTerm.upsert({
    where: { term: 'Graph Database' },
    update: {},
    create: {
      term: 'Graph Database',
      definition: 'Banco de dados que usa estruturas de grafos para representar e armazenar dados, com nós (entidades), relacionamentos e propriedades.',
    },
  });

  const termBFF = await prisma.glossaryTerm.upsert({
    where: { term: 'BFF' },
    update: {},
    create: {
      term: 'BFF',
      definition: 'Backend-For-Frontend - Padrão arquitetural onde um serviço backend é especificamente projetado para atender às necessidades de um frontend específico.',
    },
  });

  console.log('Criando tags de componentes...');
  // Cria tags para componentes
  await prisma.componentTag.createMany({
    skipDuplicates: true,
    data: [
      { componentId: 1, tag: 'nextjs' },
      { componentId: 1, tag: 'react' },
      { componentId: 1, tag: 'tailwind' },
      { componentId: 2, tag: 'graphql' },
      { componentId: 2, tag: 'apollo' },
      { componentId: 3, tag: 'mariadb' },
      { componentId: 3, tag: 'neo4j' },
    ],
  });

  console.log('Criando itens de roadmap...');
  // Cria itens de roadmap
  await prisma.roadmapItem.createMany({
    skipDuplicates: true,
    data: [
      { 
        title: 'Implementar visualização de grafo com Cytoscape',
        description: 'Adicionar visualização interativa dos componentes da arquitetura usando a biblioteca Cytoscape.js',
        type: RoadmapType.FEATURE,
      },
      {
        title: 'Adicionar suporte a versionamento de ADRs',
        description: 'Implementar histórico e controle de versão para Architectural Decision Records',
        type: RoadmapType.FEATURE,
      },
      {
        title: 'Corrigir filtros de busca no glossário',
        description: 'Resolver problemas na busca case-insensitive no glossário de termos',
        type: RoadmapType.BUGFIX,
      },
    ],
  });

  console.log('Logs iniciais...');
  // Cria alguns logs iniciais
  await prisma.log.createMany({
    skipDuplicates: true,
    data: [
      {
        userId: admin.id,
        action: 'Criou componente Frontend',
      },
      {
        userId: admin.id,
        action: 'Criou componente API BFF',
      },
      {
        userId: admin.id,
        action: 'Criou componente Database',
      },
    ],
  });

  console.log('Seed concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    // Encerrar conexões
    await prisma.$disconnect();
    await neo4jClient.close();
  }); 