import { PrismaClient } from '@prisma/client';
import type { Context } from './schema';

// Cliente Prisma compartilhado para evitar múltiplas conexões
const prisma = new PrismaClient({
  // Adicionar log para depuração durante o desenvolvimento
  log: [
    { level: 'query', emit: 'event' },
    { level: 'error', emit: 'stdout' },
  ],
});

// Log opcional para debugging
prisma.$on('query', (e: any) => {
  console.log('Prisma Query:', e.query, e.params);
});

// Função para criar o contexto da solicitação GraphQL
export function createContext(): Context {
  return {
    prisma,
  };
}

// Função para inicializar as conexões com bancos de dados
export async function initializeDbConnections(): Promise<void> {
  // Verificar se o Prisma está conectado
  try {
    await prisma.$connect();
    console.log('📦 Conexão com Prisma inicializada com sucesso');
  } catch (error) {
    console.error('❌ Erro ao conectar com o Prisma:', error);
    throw error;
  }
}

// Função para fechar as conexões com bancos de dados
export async function closeDbConnections(): Promise<void> {
  try {
    await prisma.$disconnect();
    console.log('🔒 Conexão com Prisma fechada com sucesso');
  } catch (error) {
    console.error('❌ Erro ao desconectar do Prisma:', error);
  }
} 