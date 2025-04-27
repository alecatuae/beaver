import { PrismaClient, Role, ComponentStatus, ADRStatus, RoadmapType } from '@prisma/client';
import { hashPassword } from '../src/utils/auth';

const prisma = new PrismaClient();

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

  console.log('Criando componentes...');
  // Cria componentes iniciais
  const frontend = await prisma.component.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: 'Frontend',
      description: 'Interface do usuário construída com Next.js e React',
      status: ComponentStatus.ACTIVE,
    },
  });

  const api = await prisma.component.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2,
      name: 'API BFF',
      description: 'Backend-for-Frontend com Apollo Server e GraphQL',
      status: ComponentStatus.ACTIVE,
    },
  });

  const database = await prisma.component.upsert({
    where: { id: 3 },
    update: {},
    create: {
      id: 3,
      name: 'Database',
      description: 'Camada de armazenamento com MariaDB e Neo4j',
      status: ComponentStatus.ACTIVE,
    },
  });

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
    console.error('Erro durante o seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 