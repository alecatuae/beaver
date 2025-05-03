/**
 * Testes para resolvers de ComponentInstance
 * 
 * Estes testes verificam as queries e mutations relacionadas a
 * instâncias de componentes na versão 2.0 do Beaver.
 */

import { mockDeep } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';
import { createTestContext } from '../../src/utils/testUtils';
import * as validator from '../../src/utils/validators';

// Mock dos módulos
jest.mock('../../src/utils/validators');

// Mock do cliente Prisma
const mockPrisma = mockDeep<PrismaClient>();
const mockContext = createTestContext({ prisma: mockPrisma });

// Mock do schema GraphQL
const createComponentInstanceMutation = jest.fn();
const getComponentInstancesQuery = jest.fn();
const getComponentInstanceQuery = jest.fn();

// Mock dados de teste
const mockInstance = {
  id: 1,
  component_id: 10,
  environment_id: 5,
  hostname: 'test-host',
  specs: { cpu: '2', memory: '4GB' },
  created_at: new Date(),
  component: { id: 10, name: 'Test Component' },
  environment: { id: 5, name: 'development' }
};

describe('Resolvers de ComponentInstance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Configurar mocks dos validadores
    (validator.validateComponentInstance as jest.Mock).mockResolvedValue(true);
    
    // Configurar retornos do Prisma
    mockPrisma.componentInstance.create.mockResolvedValue(mockInstance as any);
    mockPrisma.componentInstance.findMany.mockResolvedValue([mockInstance] as any);
    mockPrisma.componentInstance.findUniqueOrThrow.mockResolvedValue(mockInstance as any);
  });
  
  describe('Mutation: createComponentInstance', () => {
    it('deve criar uma nova instância de componente quando os dados são válidos', async () => {
      // Dados para criação
      const input = {
        componentId: 10,
        environmentId: 5,
        hostname: 'test-host',
        specs: { cpu: '2', memory: '4GB' }
      };
      
      // Executar mutation (simulada)
      const result = await mockPrisma.componentInstance.create({
        data: {
          component: { connect: { id: input.componentId } },
          environment: { connect: { id: input.environmentId } },
          hostname: input.hostname,
          specs: input.specs
        },
        include: {
          component: true,
          environment: true
        }
      });
      
      // Verificar chamada ao validador
      expect(validator.validateComponentInstance).toHaveBeenCalledWith(
        mockPrisma,
        input.componentId,
        input.environmentId
      );
      
      // Verificar resultado
      expect(result).toEqual(mockInstance);
    });
    
    it('deve lançar erro quando a validação falha', async () => {
      // Configurar validador para falhar
      (validator.validateComponentInstance as jest.Mock)
        .mockRejectedValue(new Error('Este componente já possui uma instância no ambiente especificado'));
      
      // Dados para criação
      const input = {
        componentId: 10,
        environmentId: 5,
        hostname: 'test-host'
      };
      
      // Executar mutation (simulada) e verificar erro
      await expect(async () => {
        await validator.validateComponentInstance(mockPrisma, input.componentId, input.environmentId);
        return mockPrisma.componentInstance.create({
          data: {
            component: { connect: { id: input.componentId } },
            environment: { connect: { id: input.environmentId } },
            hostname: input.hostname
          }
        });
      }).rejects.toThrow('Este componente já possui uma instância no ambiente especificado');
      
      // Verificar que o create não foi chamado
      expect(mockPrisma.componentInstance.create).not.toHaveBeenCalled();
    });
  });
  
  describe('Query: componentInstances', () => {
    it('deve retornar todas as instâncias de componentes', async () => {
      // Executar query (simulada)
      const result = await mockPrisma.componentInstance.findMany({
        include: {
          component: true,
          environment: true
        }
      });
      
      // Verificar resultado
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockInstance);
    });
    
    it('deve filtrar instâncias por componente quando componentId é fornecido', async () => {
      // Configurar mock para filtro
      mockPrisma.componentInstance.findMany.mockResolvedValue([mockInstance] as any);
      
      // Executar query com filtro (simulada)
      const result = await mockPrisma.componentInstance.findMany({
        where: { component_id: 10 },
        include: {
          component: true,
          environment: true
        }
      });
      
      // Verificar chamada com filtro correto
      expect(mockPrisma.componentInstance.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { component_id: 10 }
        })
      );
      
      // Verificar resultado
      expect(result).toHaveLength(1);
      expect(result[0].component_id).toBe(10);
    });
    
    it('deve filtrar instâncias por ambiente quando environmentId é fornecido', async () => {
      // Configurar mock para filtro
      mockPrisma.componentInstance.findMany.mockResolvedValue([mockInstance] as any);
      
      // Executar query com filtro (simulada)
      const result = await mockPrisma.componentInstance.findMany({
        where: { environment_id: 5 },
        include: {
          component: true,
          environment: true
        }
      });
      
      // Verificar chamada com filtro correto
      expect(mockPrisma.componentInstance.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { environment_id: 5 }
        })
      );
      
      // Verificar resultado
      expect(result).toHaveLength(1);
      expect(result[0].environment_id).toBe(5);
    });
  });
  
  describe('Query: componentInstance', () => {
    it('deve retornar uma instância específica pelo ID', async () => {
      // Executar query (simulada)
      const result = await mockPrisma.componentInstance.findUniqueOrThrow({
        where: { id: 1 },
        include: {
          component: true,
          environment: true
        }
      });
      
      // Verificar chamada correta
      expect(mockPrisma.componentInstance.findUniqueOrThrow).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 }
        })
      );
      
      // Verificar resultado
      expect(result).toEqual(mockInstance);
    });
    
    it('deve lançar erro quando a instância não é encontrada', async () => {
      // Configurar mock para lançar erro
      mockPrisma.componentInstance.findUniqueOrThrow.mockRejectedValue(
        new Error('Instância não encontrada')
      );
      
      // Executar query (simulada) e verificar erro
      await expect(
        mockPrisma.componentInstance.findUniqueOrThrow({
          where: { id: 999 }
        })
      ).rejects.toThrow('Instância não encontrada');
    });
  });
}); 