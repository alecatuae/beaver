import { PrismaClient } from '@prisma/client';

// Exporta uma única instância do Prisma para ser compartilhada em toda a aplicação
export const prisma = new PrismaClient(); 