/**
 * Testes para as funções de compatibilidade do Beaver v2.0
 * 
 * Estes testes verificam funções que garantem a compatibilidade com
 * o código da versão 1.x durante a transição para a v2.0
 */

import { mockDeep } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';
import { 
  getEnvironmentIdFromLegacyEnum, 
  getRoadmapTypeIdFromLegacyEnum 
} from '../../src/utils/compatibility';

// Mock do cliente Prisma
const mockPrisma = mockDeep<PrismaClient>();

describe('Funções de Compatibilidade v2.0', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getEnvironmentIdFromLegacyEnum', () => {
    it('deve retornar o ID do ambiente correspondente ao valor do enum legado', async () => {
      // Mock da resposta do Prisma
      mockPrisma.environment.findFirst.mockResolvedValue({
        id: 1,
        name: 'development',
        description: 'Ambiente de desenvolvimento',
        created_at: new Date()
      } as any);

      // Testar a função
      const result = await getEnvironmentIdFromLegacyEnum(mockPrisma, 'development');
      
      // Verificar o resultado
      expect(result).toBe(1);
      
      // Verificar se Prisma foi chamado corretamente
      expect(mockPrisma.environment.findFirst).toHaveBeenCalledWith({
        where: { name: 'development' }
      });
    });

    it('deve lançar erro quando o ambiente não é encontrado', async () => {
      // Mock para ambiente não encontrado
      mockPrisma.environment.findFirst.mockResolvedValue(null);

      // Verificar que a função lança erro
      await expect(
        getEnvironmentIdFromLegacyEnum(mockPrisma, 'non-existent')
      ).rejects.toThrow('Environment not found for legacy value: non-existent');
    });
  });

  describe('getRoadmapTypeIdFromLegacyEnum', () => {
    it('deve retornar o ID do tipo de roadmap correspondente ao valor do enum legado', async () => {
      // Mock da resposta do Prisma
      mockPrisma.roadmapType.findFirst.mockResolvedValue({
        id: 2,
        name: 'technical',
        description: 'Roadmap técnico',
        created_at: new Date()
      } as any);

      // Testar a função
      const result = await getRoadmapTypeIdFromLegacyEnum(mockPrisma, 'technical');
      
      // Verificar o resultado
      expect(result).toBe(2);
      
      // Verificar se Prisma foi chamado corretamente
      expect(mockPrisma.roadmapType.findFirst).toHaveBeenCalledWith({
        where: { name: 'technical' }
      });
    });

    it('deve lançar erro quando o tipo de roadmap não é encontrado', async () => {
      // Mock para tipo não encontrado
      mockPrisma.roadmapType.findFirst.mockResolvedValue(null);

      // Verificar que a função lança erro
      await expect(
        getRoadmapTypeIdFromLegacyEnum(mockPrisma, 'unknown-type')
      ).rejects.toThrow('RoadmapType not found for legacy value: unknown-type');
    });
  });
}); 