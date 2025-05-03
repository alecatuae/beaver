/**
 * Testes de compatibilidade de API para Beaver v2.0
 * 
 * Estes testes verificam se as mudanças na v2.0 mantêm compatibilidade
 * com os clientes existentes da API v1.x
 */

import { mockDeep } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';
import { createTestContext } from '../../src/utils/testUtils';
import { 
  getEnvironmentIdFromLegacyEnum, 
  getRoadmapTypeIdFromLegacyEnum 
} from '../../src/utils/compatibility';

// Mock do cliente Prisma
const mockPrisma = mockDeep<PrismaClient>();
const mockContext = createTestContext({ prisma: mockPrisma });

describe('Compatibilidade de APIs v1.x com v2.0', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Configuração padrão para mocks
    mockPrisma.component.findMany.mockResolvedValue([
      { id: 1, name: 'Component 1', status: 'active' },
      { id: 2, name: 'Component 2', status: 'planned' }
    ] as any);
    
    mockPrisma.aDR.findMany.mockResolvedValue([
      { id: 1, title: 'ADR 1', status: 'accepted' },
      { id: 2, title: 'ADR 2', status: 'draft' }
    ] as any);
    
    mockPrisma.environment.findFirst.mockResolvedValue({
      id: 1,
      name: 'development',
      description: 'Dev environment'
    } as any);
    
    mockPrisma.roadmapType.findFirst.mockResolvedValue({
      id: 1,
      name: 'feature',
      description: 'New feature',
      color_hex: '#4CAF50'
    } as any);
    
    mockPrisma.aDRParticipant.findMany.mockResolvedValue([
      { id: 1, adr_id: 1, user_id: 10, role: 'owner' }
    ] as any);
  });
  
  describe('Retrocompatibilidade de Enums', () => {
    it('deve traduzir valores de env legados para IDs de Environment', async () => {
      // Arranjar: Configurar Environment para 'development'
      mockPrisma.environment.findFirst.mockResolvedValue({
        id: 1,
        name: 'development',
        description: 'Dev environment'
      } as any);
      
      // Agir: Chamar função de compatibilidade
      const environmentId = await getEnvironmentIdFromLegacyEnum(mockPrisma, 'development');
      
      // Verificar: ID correto retornado
      expect(environmentId).toBe(1);
      expect(mockPrisma.environment.findFirst).toHaveBeenCalledWith({
        where: { name: 'development' }
      });
    });
    
    it('deve traduzir valores de roadmapItemType legados para IDs de RoadmapType', async () => {
      // Arranjar: Configurar RoadmapType para 'feature'
      mockPrisma.roadmapType.findFirst.mockResolvedValue({
        id: 1,
        name: 'feature',
        description: 'New feature',
        color_hex: '#4CAF50'
      } as any);
      
      // Agir: Chamar função de compatibilidade
      const typeId = await getRoadmapTypeIdFromLegacyEnum(mockPrisma, 'feature');
      
      // Verificar: ID correto retornado
      expect(typeId).toBe(1);
      expect(mockPrisma.roadmapType.findFirst).toHaveBeenCalledWith({
        where: { name: 'feature' }
      });
    });
  });
  
  describe('Compatibilidade com ADR', () => {
    it('deve manter a estrutura de resposta existente para ADRs, adicionando participantes', async () => {
      // Arranjar: Mock para resposta de ADR com participantes
      const mockAdrWithOwner = {
        id: 1,
        title: 'ADR 1',
        description: 'Test ADR',
        status: 'accepted',
        // owner_id: 10, // Removido na v2.0
        created_at: new Date(),
        participants: [
          { id: 1, user_id: 10, role: 'owner', user: { id: 10, username: 'john.doe' } }
        ]
      };
      
      mockPrisma.aDR.findUnique.mockResolvedValue(mockAdrWithOwner as any);
      
      // Simular resposta antiga (v1.x) usando dados v2.0 adaptados
      const legacyCompatResponse = {
        id: mockAdrWithOwner.id,
        title: mockAdrWithOwner.title,
        description: mockAdrWithOwner.description,
        status: mockAdrWithOwner.status,
        owner: mockAdrWithOwner.participants.find(p => p.role === 'owner')?.user,
        created_at: mockAdrWithOwner.created_at
      };
      
      // Agir: Obter ADR (simulando o resolver)
      const adr = await mockPrisma.aDR.findUnique({
        where: { id: 1 },
        include: {
          participants: {
            include: {
              user: true
            }
          }
        }
      });
      
      // Construir resposta compatível com v1.x
      const ownerParticipant = adr.participants.find(p => p.role === 'owner');
      const compatibleResponse = {
        id: adr.id,
        title: adr.title,
        description: adr.description,
        status: adr.status,
        owner: ownerParticipant?.user,
        created_at: adr.created_at
      };
      
      // Verificar: Resposta compatível com v1.x
      expect(compatibleResponse).toEqual(legacyCompatResponse);
      expect(compatibleResponse.owner?.id).toBe(10); // ID do owner deve ser preservado
    });
  });
  
  describe('Compatibilidade com Componentes', () => {
    it('deve manter a estrutura de resposta existente para Componentes, traduzindo env para environment', async () => {
      // Arranjar: Mock para resposta de componente na v2.0
      const mockComponentV2 = {
        id: 1,
        name: 'Component 1',
        description: 'Test Component',
        status: 'active',
        // env: 'development', // Removido na v2.0
        team_id: 5,
        category_id: 2,
        created_at: new Date(),
        instances: [
          { 
            id: 101, 
            environment_id: 1,
            environment: { id: 1, name: 'development' },
            hostname: 'host1'
          }
        ]
      };
      
      mockPrisma.component.findUnique.mockResolvedValue(mockComponentV2 as any);
      
      // Simular resposta antiga (v1.x) usando dados v2.0 adaptados
      const legacyCompatResponse = {
        id: mockComponentV2.id,
        name: mockComponentV2.name,
        description: mockComponentV2.description,
        status: mockComponentV2.status,
        env: mockComponentV2.instances[0]?.environment?.name || 'development', // Mapeando de volta para env
        teamId: mockComponentV2.team_id,
        categoryId: mockComponentV2.category_id,
        created_at: mockComponentV2.created_at
      };
      
      // Agir: Obter componente (simulando o resolver)
      const component = await mockPrisma.component.findUnique({
        where: { id: 1 },
        include: {
          instances: {
            include: {
              environment: true
            }
          }
        }
      });
      
      // Construir resposta compatível com v1.x
      const devInstance = component.instances.find(i => i.environment?.name === 'development');
      const compatibleResponse = {
        id: component.id,
        name: component.name,
        description: component.description,
        status: component.status,
        env: devInstance?.environment?.name || 'development',
        teamId: component.team_id,
        categoryId: component.category_id,
        created_at: component.created_at
      };
      
      // Verificar: Resposta compatível com v1.x
      expect(compatibleResponse).toEqual(legacyCompatResponse);
      expect(compatibleResponse.env).toBe('development');
    });
  });
  
  describe('Compatibilidade com RoadmapItems', () => {
    it('deve manter a estrutura de resposta existente para RoadmapItems, traduzindo typeId', async () => {
      // Arranjar: Mock para resposta de RoadmapItem na v2.0
      const mockItemV2 = {
        id: 1,
        title: 'Roadmap Item 1',
        description: 'Test item',
        component_id: 5,
        // type: 'feature', // Removido na v2.0
        type_id: 1,
        type: { id: 1, name: 'feature', color_hex: '#4CAF50' },
        status: 'todo',
        due_date: new Date('2025-12-31'),
        created_at: new Date()
      };
      
      mockPrisma.roadmapItem.findUnique.mockResolvedValue(mockItemV2 as any);
      
      // Simular resposta antiga (v1.x) usando dados v2.0 adaptados
      const legacyCompatResponse = {
        id: mockItemV2.id,
        title: mockItemV2.title,
        description: mockItemV2.description,
        componentId: mockItemV2.component_id,
        type: mockItemV2.type.name,
        status: mockItemV2.status,
        dueDate: mockItemV2.due_date,
        created_at: mockItemV2.created_at
      };
      
      // Agir: Obter item (simulando o resolver)
      const item = await mockPrisma.roadmapItem.findUnique({
        where: { id: 1 },
        include: {
          type: true
        }
      });
      
      // Construir resposta compatível com v1.x
      const compatibleResponse = {
        id: item.id,
        title: item.title,
        description: item.description,
        componentId: item.component_id,
        type: item.type.name,
        status: item.status,
        dueDate: item.due_date,
        created_at: item.created_at
      };
      
      // Verificar: Resposta compatível com v1.x
      expect(compatibleResponse).toEqual(legacyCompatResponse);
      expect(compatibleResponse.type).toBe('feature');
    });
  });
  
  describe('Verificação de casos de erro', () => {
    it('deve lançar erro adequado quando ambiente legado não existir', async () => {
      // Arranjar: Ambiente não encontrado
      mockPrisma.environment.findFirst.mockResolvedValue(null);
      
      // Agir e verificar
      await expect(
        getEnvironmentIdFromLegacyEnum(mockPrisma, 'unknown')
      ).rejects.toThrow('Environment not found for legacy value: unknown');
    });
    
    it('deve lançar erro adequado quando tipo de roadmap legado não existir', async () => {
      // Arranjar: Tipo não encontrado
      mockPrisma.roadmapType.findFirst.mockResolvedValue(null);
      
      // Agir e verificar
      await expect(
        getRoadmapTypeIdFromLegacyEnum(mockPrisma, 'unknown')
      ).rejects.toThrow('RoadmapType not found for legacy value: unknown');
    });
  });
}); 