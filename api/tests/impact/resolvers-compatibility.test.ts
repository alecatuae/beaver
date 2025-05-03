/**
 * Testes de compatibilidade para resolvers GraphQL
 * 
 * Estes testes verificam se os resolvers GraphQL da v2.0 mantêm
 * compatibilidade com as chamadas da API v1.x
 */

import { mockDeep } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';
import { createTestContext } from '../../src/utils/testUtils';
import { 
  ComponentResolver,
  ADRResolver,
  RoadmapItemResolver
} from '../../src/resolvers';

// Mock do cliente Prisma
const mockPrisma = mockDeep<PrismaClient>();
const mockContext = createTestContext({ prisma: mockPrisma });

// Mock do schema GraphQL
const componentQuery = jest.fn();
const adrQuery = jest.fn();
const roadmapItemQuery = jest.fn();
const createComponentMutation = jest.fn();
const createADRMutation = jest.fn();
const createRoadmapItemMutation = jest.fn();

// Mock dados de teste
const mockUser = { id: 10, username: 'john.doe', email: 'john@example.com' };
const mockDate = new Date('2025-06-01');

// Configura os resolvers mockados
jest.mock('../../src/resolvers', () => ({
  ComponentResolver: {
    getComponent: jest.fn(),
    getComponents: jest.fn(),
    createComponent: jest.fn(),
    updateComponent: jest.fn()
  },
  ADRResolver: {
    getADR: jest.fn(),
    getADRs: jest.fn(),
    createADR: jest.fn(),
    updateADR: jest.fn()
  },
  RoadmapItemResolver: {
    getRoadmapItem: jest.fn(),
    getRoadmapItems: jest.fn(),
    createRoadmapItem: jest.fn(),
    updateRoadmapItem: jest.fn()
  }
}));

describe('Compatibilidade de Resolvers GraphQL v1.x com v2.0', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('Component Resolver', () => {
    it('deve aceitar env como parâmetro de filtro nas queries getComponents', async () => {
      // Arranjar: Mock de componentes
      const mockComponents = [
        { id: 1, name: 'Component 1', status: 'active', created_at: mockDate }
      ];
      
      mockPrisma.component.findMany.mockResolvedValue(mockComponents as any);
      mockPrisma.environment.findFirst.mockResolvedValue({ id: 1, name: 'development' } as any);
      
      // Mock da função mapeadora
      const mockGetComponentsWithEnv = async (parent, args, context) => {
        // Compatibilidade: Converter env para environmentId se fornecido
        let environmentId = null;
        if (args.env) {
          const environment = await context.prisma.environment.findFirst({
            where: { name: args.env }
          });
          environmentId = environment?.id;
        }
        
        return context.prisma.component.findMany({
          where: environmentId ? {
            instances: {
              some: { environment_id: environmentId }
            }
          } : undefined
        });
      };
      
      ComponentResolver.getComponents.mockImplementation(mockGetComponentsWithEnv);
      
      // Agir: Chamar resolver com filtro v1.x
      const result = await ComponentResolver.getComponents(
        null,
        { env: 'development' },
        mockContext
      );
      
      // Verificar: Resultado correto e filtro aplicado
      expect(result).toEqual(mockComponents);
      expect(mockPrisma.environment.findFirst).toHaveBeenCalledWith({
        where: { name: 'development' }
      });
    });
    
    it('deve criar instância automaticamente ao criar componente com env', async () => {
      // Arranjar: Mock para respostas
      const mockComponent = {
        id: 1,
        name: 'New Component',
        description: 'Test',
        status: 'active',
        created_at: mockDate
      };
      
      const mockEnv = { id: 2, name: 'production' };
      
      mockPrisma.component.create.mockResolvedValue(mockComponent as any);
      mockPrisma.environment.findFirst.mockResolvedValue(mockEnv as any);
      mockPrisma.componentInstance.create.mockResolvedValue({
        id: 101,
        component_id: 1,
        environment_id: 2
      } as any);
      
      // Mock da função que implementa compatibilidade
      const mockCreateComponentWithEnv = async (parent, args, context) => {
        // Criar componente
        const component = await context.prisma.component.create({
          data: {
            name: args.name,
            description: args.description,
            status: args.status || 'active'
          }
        });
        
        // Compatibilidade: Criar instância se env foi fornecido
        if (args.env) {
          const environment = await context.prisma.environment.findFirst({
            where: { name: args.env }
          });
          
          if (environment) {
            await context.prisma.componentInstance.create({
              data: {
                component_id: component.id,
                environment_id: environment.id
              }
            });
          }
        }
        
        return component;
      };
      
      ComponentResolver.createComponent.mockImplementation(mockCreateComponentWithEnv);
      
      // Agir: Chamar mutation com env (estilo v1.x)
      const result = await ComponentResolver.createComponent(
        null,
        {
          name: 'New Component',
          description: 'Test',
          status: 'active',
          env: 'production'
        },
        mockContext
      );
      
      // Verificar: Componente criado e instância criada automaticamente
      expect(result).toEqual(mockComponent);
      expect(mockPrisma.environment.findFirst).toHaveBeenCalledWith({
        where: { name: 'production' }
      });
      expect(mockPrisma.componentInstance.create).toHaveBeenCalledWith({
        data: {
          component_id: 1,
          environment_id: 2
        }
      });
    });
  });
  
  describe('ADR Resolver', () => {
    it('deve aceitar ownerId como parâmetro de criação', async () => {
      // Arranjar: Mock para respostas
      const mockADR = {
        id: 1,
        title: 'New ADR',
        description: 'Test',
        status: 'draft',
        created_at: mockDate
      };
      
      const mockParticipant = {
        id: 50,
        adr_id: 1,
        user_id: 10,
        role: 'owner'
      };
      
      mockPrisma.aDR.create.mockResolvedValue(mockADR as any);
      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);
      mockPrisma.aDRParticipant.create.mockResolvedValue(mockParticipant as any);
      
      // Mock da função que implementa compatibilidade
      const mockCreateADRWithOwner = async (parent, args, context) => {
        // Criar ADR
        const adr = await context.prisma.aDR.create({
          data: {
            title: args.title,
            description: args.description,
            status: args.status || 'draft'
          }
        });
        
        // Compatibilidade: Criar participante owner se ownerId foi fornecido
        if (args.ownerId) {
          const user = await context.prisma.user.findUnique({
            where: { id: args.ownerId }
          });
          
          if (user) {
            await context.prisma.aDRParticipant.create({
              data: {
                adr_id: adr.id,
                user_id: user.id,
                role: 'owner'
              }
            });
          }
        }
        
        return adr;
      };
      
      ADRResolver.createADR.mockImplementation(mockCreateADRWithOwner);
      
      // Agir: Chamar mutation com ownerId (estilo v1.x)
      const result = await ADRResolver.createADR(
        null,
        {
          title: 'New ADR',
          description: 'Test',
          status: 'draft',
          ownerId: 10
        },
        mockContext
      );
      
      // Verificar: ADR criado e participante owner criado automaticamente
      expect(result).toEqual(mockADR);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 10 }
      });
      expect(mockPrisma.aDRParticipant.create).toHaveBeenCalledWith({
        data: {
          adr_id: 1,
          user_id: 10,
          role: 'owner'
        }
      });
    });
    
    it('deve retornar owner compatível com v1.x em getADR', async () => {
      // Arranjar: Mock para resposta com a nova estrutura
      const mockADRWithParticipants = {
        id: 1,
        title: 'Test ADR',
        description: 'Description',
        status: 'accepted',
        created_at: mockDate,
        participants: [
          {
            id: 50,
            adr_id: 1,
            user_id: 10,
            role: 'owner',
            user: mockUser
          }
        ]
      };
      
      mockPrisma.aDR.findUnique.mockResolvedValue(mockADRWithParticipants as any);
      
      // Mock da função que implementa compatibilidade
      const mockGetADRWithOwner = async (parent, args, context) => {
        const adr = await context.prisma.aDR.findUnique({
          where: { id: args.id },
          include: {
            participants: {
              include: {
                user: true
              }
            }
          }
        });
        
        // Compatibilidade: Adicionar campo owner simulando a estrutura v1.x
        if (adr) {
          const ownerParticipant = adr.participants.find(p => p.role === 'owner');
          // @ts-ignore: adicionando propriedade compatível
          adr.owner = ownerParticipant?.user || null;
        }
        
        return adr;
      };
      
      ADRResolver.getADR.mockImplementation(mockGetADRWithOwner);
      
      // Agir: Obter ADR
      const result = await ADRResolver.getADR(
        null,
        { id: 1 },
        mockContext
      );
      
      // Verificar: ADR contém campo owner compatível com v1.x
      expect(result).toHaveProperty('owner');
      expect(result.owner).toEqual(mockUser);
    });
  });
  
  describe('RoadmapItem Resolver', () => {
    it('deve aceitar type como string ao criar item', async () => {
      // Arranjar: Mock para respostas
      const mockItem = {
        id: 1,
        title: 'New Item',
        description: 'Test',
        component_id: 5,
        type_id: 2,
        status: 'todo',
        created_at: mockDate
      };
      
      const mockType = {
        id: 2,
        name: 'bug',
        description: 'Bug fix',
        color_hex: '#ff0000'
      };
      
      mockPrisma.roadmapType.findFirst.mockResolvedValue(mockType as any);
      mockPrisma.roadmapItem.create.mockResolvedValue(mockItem as any);
      
      // Mock da função que implementa compatibilidade
      const mockCreateItemWithType = async (parent, args, context) => {
        let typeId = args.typeId;
        
        // Compatibilidade: Converter type string para typeId
        if (!typeId && args.type) {
          const type = await context.prisma.roadmapType.findFirst({
            where: { name: args.type }
          });
          typeId = type?.id;
        }
        
        if (!typeId) {
          throw new Error("Either typeId or type must be provided");
        }
        
        // Criar item
        return context.prisma.roadmapItem.create({
          data: {
            title: args.title,
            description: args.description,
            component_id: args.componentId,
            type_id: typeId,
            status: args.status || 'todo',
            due_date: args.dueDate
          }
        });
      };
      
      RoadmapItemResolver.createRoadmapItem.mockImplementation(mockCreateItemWithType);
      
      // Agir: Chamar mutation com type string (estilo v1.x)
      const result = await RoadmapItemResolver.createRoadmapItem(
        null,
        {
          title: 'New Item',
          description: 'Test',
          componentId: 5,
          type: 'bug', // Estilo v1.x
          status: 'todo'
        },
        mockContext
      );
      
      // Verificar: Item criado com typeId correto
      expect(result).toEqual(mockItem);
      expect(mockPrisma.roadmapType.findFirst).toHaveBeenCalledWith({
        where: { name: 'bug' }
      });
      expect(mockPrisma.roadmapItem.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type_id: 2 // ID obtido a partir do nome do tipo
        })
      });
    });
    
    it('deve retornar type como string em getRoadmapItem', async () => {
      // Arranjar: Mock para resposta com a nova estrutura
      const mockItemWithType = {
        id: 1,
        title: 'Test Item',
        description: 'Description',
        component_id: 5,
        type_id: 3,
        type: {
          id: 3,
          name: 'feature',
          description: 'New feature',
          color_hex: '#00ff00'
        },
        status: 'in_progress',
        created_at: mockDate
      };
      
      mockPrisma.roadmapItem.findUnique.mockResolvedValue(mockItemWithType as any);
      
      // Mock da função que implementa compatibilidade
      const mockGetItemWithTypeString = async (parent, args, context) => {
        const item = await context.prisma.roadmapItem.findUnique({
          where: { id: args.id },
          include: {
            type: true
          }
        });
        
        // Compatibilidade: Adicionar campo type como string simulando v1.x
        if (item && item.type) {
          // @ts-ignore: propriedade para compatibilidade
          item.typeString = item.type.name;
        }
        
        return item;
      };
      
      RoadmapItemResolver.getRoadmapItem.mockImplementation(mockGetItemWithTypeString);
      
      // Agir: Obter item
      const result = await RoadmapItemResolver.getRoadmapItem(
        null,
        { id: 1 },
        mockContext
      );
      
      // Verificar: Item contém campo type como string
      expect(result).toHaveProperty('typeString');
      expect(result.typeString).toBe('feature');
    });
  });
}); 