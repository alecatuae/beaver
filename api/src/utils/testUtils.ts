import { PrismaClient } from '@prisma/client';

/**
 * Cria um contexto para testes dos resolvers GraphQL
 * @param options Opções de configuração do contexto de teste
 * @returns Um objeto de contexto de teste para uso nos resolvers
 */
export function createTestContext(options: { 
  prisma: PrismaClient,
  user?: { id: number, role: string }
}) {
  // Contexto básico com cliente Prisma
  const context = {
    prisma: options.prisma,
    user: options.user || { id: 1, role: 'admin' }
  };

  return context;
} 