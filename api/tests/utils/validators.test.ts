/**
 * Testes para as funções de validação do Beaver v2.0
 * 
 * Estes testes verificam os validadores para novas entidades como
 * ADRParticipant, ComponentInstance, etc.
 */

import { mockDeep } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';
import { validateADRParticipants, validateComponentInstance } from '../../src/utils/validators';

// Mock do cliente Prisma
const mockPrisma = mockDeep<PrismaClient>();

describe('Validadores v2.0', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateADRParticipants', () => {
    it('deve aprovar quando há pelo menos um owner', () => {
      const participants = [
        { userId: 1, role: 'owner' },
        { userId: 2, role: 'reviewer' },
      ];

      expect(validateADRParticipants(participants)).toBe(true);
    });

    it('deve lançar erro quando não há owner', () => {
      const participants = [
        { userId: 1, role: 'reviewer' },
        { userId: 2, role: 'consumer' },
      ];

      expect(() => validateADRParticipants(participants)).toThrow('ADR must have at least one owner');
    });

    it('deve lançar erro quando a lista de participantes está vazia', () => {
      expect(() => validateADRParticipants([])).toThrow('ADR must have at least one owner');
    });
  });

  describe('validateComponentInstance', () => {
    it('deve aprovar quando não existe instância com mesmo componente e ambiente', async () => {
      // Mock de resposta vazia (não encontrou duplicata)
      mockPrisma.componentInstance.findFirst.mockResolvedValue(null);

      await expect(
        validateComponentInstance(mockPrisma, 1, 2)
      ).resolves.toBe(true);

      // Verificar chamada correta ao Prisma
      expect(mockPrisma.componentInstance.findFirst).toHaveBeenCalledWith({
        where: {
          component_id: 1,
          environment_id: 2,
          id: undefined
        }
      });
    });

    it('deve lançar erro quando já existe uma instância com mesmo componente e ambiente', async () => {
      // Mock de resposta encontrando duplicata
      mockPrisma.componentInstance.findFirst.mockResolvedValue({
        id: 3,
        component_id: 1,
        environment_id: 2,
        hostname: 'existing-host',
        specs: null,
        created_at: new Date()
      } as any);

      await expect(
        validateComponentInstance(mockPrisma, 1, 2)
      ).rejects.toThrow('Este componente já possui uma instância no ambiente especificado');
    });

    it('deve ignorar a própria instância ao validar atualização', async () => {
      // Mock de resposta vazia para atualização
      mockPrisma.componentInstance.findFirst.mockResolvedValue(null);

      await expect(
        validateComponentInstance(mockPrisma, 1, 2, 3) // Passando ID da própria instância
      ).resolves.toBe(true);

      // Verificar chamada com cláusula de exclusão da própria instância
      expect(mockPrisma.componentInstance.findFirst).toHaveBeenCalledWith({
        where: {
          component_id: 1,
          environment_id: 2,
          id: { not: 3 }
        }
      });
    });
  });
}); 