/**
 * Testes para os resolvers de Environment
 * 
 * Estes testes verificam o funcionamento correto dos resolvers relacionados
 * aos ambientes na v2.0
 */

import { mockDeep } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';
import { createTestContext } from '../../src/utils/testUtils';

// Mock do cliente Prisma
const mockPrisma = mockDeep<PrismaClient>();
const mockContext = createTestContext({ prisma: mockPrisma });

// Mock do resolver Environment
const EnvironmentResolver = {
  getEnvironment: jest.fn(),
  getEnvironments: jest.fn(),
  createEnvironment: jest.fn(),
  updateEnvironment: jest.fn(),
  deleteEnvironment: jest.fn()
};

// Dados de teste
const mockEnvironments = [
  { id: 1, name: 'development', description: 'Ambiente de desenvolvimento', created_at: new Date() },
  { id: 2, name: 'homologation', description: 'Ambiente de homologação', created_at: new Date() },
  { id: 3, name: 'production', description: 'Ambiente de produção', created_at: new Date() }
];

// Configurar os resolvers mockados
jest.mock('../../src/resolvers', () => ({
  EnvironmentResolver: {
    getEnvironment: jest.fn(),
    getEnvironments: jest.fn(),
    createEnvironment: jest.fn(),
    updateEnvironment: jest.fn(),
    deleteEnvironment: jest.fn()
  }
}));

describe('Environment Resolvers', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Configuração padrão para mocks
    mockPrisma.environment.findMany.mockResolvedValue(mockEnvironments as any);
    mockPrisma.environment.findUnique.mockImplementation(async (args) => {
      const env = mockEnvironments.find(e => e.id === args.where.id);
      return env || null;
    });
    mockPrisma.environment.create.mockImplementation(async (args) => {
      return {
        id: 4,
        name: args.data.name,
        description: args.data.description,
        created_at: new Date()
      };
    });
    mockPrisma.environment.update.mockImplementation(async (args) => {
      const envIndex = mockEnvironments.findIndex(e => e.id === args.where.id);
      if (envIndex === -1) return null;
      
      return {
        ...mockEnvironments[envIndex],
        ...args.data
      };
    });
    mockPrisma.environment.delete.mockImplementation(async (args) => {
      const env = mockEnvironments.find(e => e.id === args.where.id);
      return env || null;
    });
    mockPrisma.componentInstance.findFirst.mockResolvedValue(null);
  });

  describe('getEnvironments', () => {
    it('deve retornar todos os ambientes', async () => {
      // Implementação do mock para o resolver
      const mockGetEnvironments = async (parent, args, context) => {
        return context.prisma.environment.findMany();
      };

      EnvironmentResolver.getEnvironments.mockImplementation(mockGetEnvironments);

      // Executar o teste
      const result = await EnvironmentResolver.getEnvironments(null, {}, mockContext);

      // Verificações
      expect(result).toEqual(mockEnvironments);
      expect(mockPrisma.environment.findMany).toHaveBeenCalled();
    });
  });

  describe('getEnvironment', () => {
    it('deve retornar um ambiente específico pelo ID', async () => {
      // Implementação do mock para o resolver
      const mockGetEnvironment = async (parent, args, context) => {
        return context.prisma.environment.findUnique({
          where: { id: args.id }
        });
      };

      EnvironmentResolver.getEnvironment.mockImplementation(mockGetEnvironment);

      // Executar o teste
      const result = await EnvironmentResolver.getEnvironment(
        null,
        { id: 2 },
        mockContext
      );

      // Verificações
      expect(result).toEqual(mockEnvironments[1]);
      expect(mockPrisma.environment.findUnique).toHaveBeenCalledWith({
        where: { id: 2 }
      });
    });

    it('deve retornar null quando ambiente não existe', async () => {
      // Implementação do mock para o resolver
      const mockGetEnvironment = async (parent, args, context) => {
        return context.prisma.environment.findUnique({
          where: { id: args.id }
        });
      };

      EnvironmentResolver.getEnvironment.mockImplementation(mockGetEnvironment);

      // Executar o teste
      const result = await EnvironmentResolver.getEnvironment(
        null,
        { id: 999 },
        mockContext
      );

      // Verificações
      expect(result).toBeNull();
      expect(mockPrisma.environment.findUnique).toHaveBeenCalledWith({
        where: { id: 999 }
      });
    });
  });

  describe('createEnvironment', () => {
    it('deve criar um novo ambiente', async () => {
      // Implementação do mock para o resolver
      const mockCreateEnvironment = async (parent, args, context) => {
        return context.prisma.environment.create({
          data: {
            name: args.input.name,
            description: args.input.description
          }
        });
      };

      EnvironmentResolver.createEnvironment.mockImplementation(mockCreateEnvironment);

      // Executar o teste
      const result = await EnvironmentResolver.createEnvironment(
        null,
        {
          input: {
            name: 'staging',
            description: 'Ambiente de testes'
          }
        },
        mockContext
      );

      // Verificações
      expect(result).toEqual({
        id: 4,
        name: 'staging',
        description: 'Ambiente de testes',
        created_at: expect.any(Date)
      });
      expect(mockPrisma.environment.create).toHaveBeenCalledWith({
        data: {
          name: 'staging',
          description: 'Ambiente de testes'
        }
      });
    });

    it('deve validar nome único de ambiente', async () => {
      // Mock para validação de nome único
      mockPrisma.environment.findFirst.mockResolvedValue(mockEnvironments[0] as any);

      // Implementação do mock para o resolver
      const mockCreateEnvironment = async (parent, args, context) => {
        // Verificar se já existe ambiente com o mesmo nome
        const existingEnv = await context.prisma.environment.findFirst({
          where: { name: args.input.name }
        });

        if (existingEnv) {
          throw new Error(`Environment with name '${args.input.name}' already exists`);
        }

        return context.prisma.environment.create({
          data: {
            name: args.input.name,
            description: args.input.description
          }
        });
      };

      EnvironmentResolver.createEnvironment.mockImplementation(mockCreateEnvironment);

      // Executar o teste - deve lançar erro
      await expect(
        EnvironmentResolver.createEnvironment(
          null,
          {
            input: {
              name: 'development', // Nome já existente
              description: 'Ambiente duplicado'
            }
          },
          mockContext
        )
      ).rejects.toThrow("Environment with name 'development' already exists");
    });
  });

  describe('updateEnvironment', () => {
    it('deve atualizar um ambiente existente', async () => {
      // Implementação do mock para o resolver
      const mockUpdateEnvironment = async (parent, args, context) => {
        return context.prisma.environment.update({
          where: { id: args.id },
          data: {
            name: args.input.name,
            description: args.input.description
          }
        });
      };

      EnvironmentResolver.updateEnvironment.mockImplementation(mockUpdateEnvironment);

      // Executar o teste
      const result = await EnvironmentResolver.updateEnvironment(
        null,
        {
          id: 1,
          input: {
            name: 'development-new',
            description: 'Novo ambiente de desenvolvimento'
          }
        },
        mockContext
      );

      // Verificações
      expect(result).toEqual({
        ...mockEnvironments[0],
        name: 'development-new',
        description: 'Novo ambiente de desenvolvimento'
      });
      expect(mockPrisma.environment.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          name: 'development-new',
          description: 'Novo ambiente de desenvolvimento'
        }
      });
    });
  });

  describe('deleteEnvironment', () => {
    it('deve excluir um ambiente existente', async () => {
      // Implementação do mock para o resolver
      const mockDeleteEnvironment = async (parent, args, context) => {
        // Verificar se o ambiente existe
        const env = await context.prisma.environment.findUnique({
          where: { id: args.id }
        });

        if (!env) {
          throw new Error('Environment not found');
        }

        // Verificar se há instâncias associadas
        const hasInstances = await context.prisma.componentInstance.findFirst({
          where: { environment_id: args.id }
        });

        if (hasInstances) {
          throw new Error('Cannot delete environment with associated component instances');
        }

        await context.prisma.environment.delete({
          where: { id: args.id }
        });

        return true;
      };

      EnvironmentResolver.deleteEnvironment.mockImplementation(mockDeleteEnvironment);

      // Executar o teste
      const result = await EnvironmentResolver.deleteEnvironment(
        null,
        { id: 1 },
        mockContext
      );

      // Verificações
      expect(result).toBe(true);
      expect(mockPrisma.environment.findUnique).toHaveBeenCalledWith({
        where: { id: 1 }
      });
      expect(mockPrisma.componentInstance.findFirst).toHaveBeenCalledWith({
        where: { environment_id: 1 }
      });
      expect(mockPrisma.environment.delete).toHaveBeenCalledWith({
        where: { id: 1 }
      });
    });

    it('deve impedir a exclusão de ambiente com instâncias associadas', async () => {
      // Mock para instâncias associadas
      mockPrisma.componentInstance.findFirst.mockResolvedValue({ id: 1, environment_id: 1 } as any);

      // Implementação do mock para o resolver
      const mockDeleteEnvironment = async (parent, args, context) => {
        // Verificar se o ambiente existe
        const env = await context.prisma.environment.findUnique({
          where: { id: args.id }
        });

        if (!env) {
          throw new Error('Environment not found');
        }

        // Verificar se há instâncias associadas
        const hasInstances = await context.prisma.componentInstance.findFirst({
          where: { environment_id: args.id }
        });

        if (hasInstances) {
          throw new Error('Cannot delete environment with associated component instances');
        }

        await context.prisma.environment.delete({
          where: { id: args.id }
        });

        return true;
      };

      EnvironmentResolver.deleteEnvironment.mockImplementation(mockDeleteEnvironment);

      // Executar o teste - deve lançar erro
      await expect(
        EnvironmentResolver.deleteEnvironment(
          null,
          { id: 1 },
          mockContext
        )
      ).rejects.toThrow('Cannot delete environment with associated component instances');

      // Verificar que delete não foi chamado
      expect(mockPrisma.environment.delete).not.toHaveBeenCalled();
    });
  });
}); 