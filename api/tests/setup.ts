/**
 * Setup para os testes do Beaver v2.0
 * 
 * Este arquivo configura o ambiente de testes, incluindo:
 * - Mock das dependências externas
 * - Conexão com bancos de dados de teste
 * - Limpeza entre testes
 */

import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset } from 'jest-mock-extended';
import { Driver } from 'neo4j-driver';

// Mock do cliente Prisma
jest.mock('../src/prisma', () => ({
  __esModule: true,
  prisma: mockDeep<PrismaClient>(),
  default: mockDeep<PrismaClient>(),
}));

// Mock do driver Neo4j
jest.mock('../src/neo4j', () => ({
  __esModule: true,
  driver: mockDeep<Driver>(),
}));

// Mock do logger para não poluir a saída dos testes
jest.mock('../src/utils/logger', () => ({
  __esModule: true,
  logger: {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

// Configurações globais para todos os testes
beforeAll(() => {
  // Configurações iniciais antes de todos os testes
  process.env.NODE_ENV = 'test';
});

// Reset de mocks antes de cada teste
beforeEach(() => {
  // Resetar todos os mocks
  jest.clearAllMocks();
  mockReset(jest.requireMock('../src/prisma').prisma);
  mockReset(jest.requireMock('../src/neo4j').driver);
});

// Limpeza após todos os testes
afterAll(async () => {
  // Encerrar conexões ou limpar recursos
}); 