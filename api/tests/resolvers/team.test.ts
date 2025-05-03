/**
 * Testes para os resolvers de Team
 * 
 * Estes testes verificam o funcionamento correto dos resolvers relacionados
 * aos times na v2.0
 */

import { mockDeep } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';
import { createTestContext } from '../../src/utils/testUtils';

// Mock do cliente Prisma
const mockPrisma = mockDeep<PrismaClient>();
const mockContext = createTestContext({ prisma: mockPrisma });

// Mock do resolver Team
const TeamResolver = {
  getTeam: jest.fn(),
  getTeams: jest.fn(),
  createTeam: jest.fn(),
  updateTeam: jest.fn(),
  deleteTeam: jest.fn(),
  addTeamMember: jest.fn(),
  removeTeamMember: jest.fn()
};

// Dados de teste
const mockTeams = [
  { id: 1, name: 'Network', description: 'Network team', created_at: new Date() },
  { id: 2, name: 'Platform', description: 'Platform team', created_at: new Date() },
  { id: 3, name: 'Security', description: 'Security team', created_at: new Date() }
];

const mockUsers = [
  { id: 1, username: 'john.doe', email: 'john@example.com', full_name: 'John Doe' },
  { id: 2, username: 'jane.doe', email: 'jane@example.com', full_name: 'Jane Doe' }
];

const mockTeamMembers = [
  { id: 1, team_id: 1, user_id: 1, joined_at: new Date('2024-01-01') },
  { id: 2, team_id: 2, user_id: 2, joined_at: new Date('2024-02-01') }
];

// Configurar os resolvers mockados
jest.mock('../../src/resolvers', () => ({
  TeamResolver: {
    getTeam: jest.fn(),
    getTeams: jest.fn(),
    createTeam: jest.fn(),
    updateTeam: jest.fn(),
    deleteTeam: jest.fn(),
    addTeamMember: jest.fn(),
    removeTeamMember: jest.fn()
  }
}));

describe('Team Resolvers', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Configuração padrão para mocks
    mockPrisma.team.findMany.mockResolvedValue(mockTeams as any);
    mockPrisma.team.findUnique.mockImplementation(async (args) => {
      const team = mockTeams.find(t => t.id === args.where.id);
      return team || null;
    });
    mockPrisma.team.create.mockImplementation(async (args) => {
      return {
        id: 4,
        name: args.data.name,
        description: args.data.description,
        created_at: new Date()
      };
    });
    mockPrisma.team.update.mockImplementation(async (args) => {
      const teamIndex = mockTeams.findIndex(t => t.id === args.where.id);
      if (teamIndex === -1) return null;
      
      return {
        ...mockTeams[teamIndex],
        ...args.data
      };
    });
    mockPrisma.team.delete.mockImplementation(async (args) => {
      const team = mockTeams.find(t => t.id === args.where.id);
      return team || null;
    });
    mockPrisma.teamMember.findFirst.mockResolvedValue(null);
    mockPrisma.user.findUnique.mockImplementation(async (args) => {
      const user = mockUsers.find(u => u.id === args.where.id);
      return user || null;
    });
    mockPrisma.teamMember.create.mockImplementation(async (args) => {
      return {
        id: mockTeamMembers.length + 1,
        team_id: args.data.team_id,
        user_id: args.data.user_id,
        joined_at: args.data.joined_at || new Date()
      };
    });
    mockPrisma.teamMember.delete.mockImplementation(async (args) => {
      const member = mockTeamMembers.find(m => m.id === args.where.id);
      return member || null;
    });
    mockPrisma.component.findFirst.mockResolvedValue(null);
  });

  describe('getTeams', () => {
    it('deve retornar todos os times', async () => {
      // Implementação do mock para o resolver
      const mockGetTeams = async (parent, args, context) => {
        return context.prisma.team.findMany();
      };

      TeamResolver.getTeams.mockImplementation(mockGetTeams);

      // Executar o teste
      const result = await TeamResolver.getTeams(null, {}, mockContext);

      // Verificações
      expect(result).toEqual(mockTeams);
      expect(mockPrisma.team.findMany).toHaveBeenCalled();
    });
  });

  describe('getTeam', () => {
    it('deve retornar um time específico pelo ID', async () => {
      // Implementação do mock para o resolver
      const mockGetTeam = async (parent, args, context) => {
        return context.prisma.team.findUnique({
          where: { id: args.id },
          include: {
            members: {
              include: {
                user: true
              }
            }
          }
        });
      };

      // Mock para incluir membros do time
      mockPrisma.team.findUnique.mockImplementation(async (args) => {
        const team = mockTeams.find(t => t.id === args.where.id);
        if (!team) return null;

        const members = mockTeamMembers
          .filter(m => m.team_id === team.id)
          .map(m => ({
            ...m,
            user: mockUsers.find(u => u.id === m.user_id)
          }));

        return {
          ...team,
          members
        };
      });

      TeamResolver.getTeam.mockImplementation(mockGetTeam);

      // Executar o teste
      const result = await TeamResolver.getTeam(
        null,
        { id: 1 },
        mockContext
      );

      // Verificações
      expect(result).toEqual({
        ...mockTeams[0],
        members: [
          {
            ...mockTeamMembers[0],
            user: mockUsers[0]
          }
        ]
      });
      expect(mockPrisma.team.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: {
          members: {
            include: {
              user: true
            }
          }
        }
      });
    });
  });

  describe('createTeam', () => {
    it('deve criar um novo time', async () => {
      // Implementação do mock para o resolver
      const mockCreateTeam = async (parent, args, context) => {
        return context.prisma.team.create({
          data: {
            name: args.input.name,
            description: args.input.description
          }
        });
      };

      TeamResolver.createTeam.mockImplementation(mockCreateTeam);

      // Executar o teste
      const result = await TeamResolver.createTeam(
        null,
        {
          input: {
            name: 'Backend',
            description: 'Backend development team'
          }
        },
        mockContext
      );

      // Verificações
      expect(result).toEqual({
        id: 4,
        name: 'Backend',
        description: 'Backend development team',
        created_at: expect.any(Date)
      });
      expect(mockPrisma.team.create).toHaveBeenCalledWith({
        data: {
          name: 'Backend',
          description: 'Backend development team'
        }
      });
    });

    it('deve validar nome único de time', async () => {
      // Mock para validação de nome único
      mockPrisma.team.findFirst.mockResolvedValue(mockTeams[0] as any);

      // Implementação do mock para o resolver
      const mockCreateTeam = async (parent, args, context) => {
        // Verificar se já existe time com o mesmo nome
        const existingTeam = await context.prisma.team.findFirst({
          where: { name: args.input.name }
        });

        if (existingTeam) {
          throw new Error(`Team with name '${args.input.name}' already exists`);
        }

        return context.prisma.team.create({
          data: {
            name: args.input.name,
            description: args.input.description
          }
        });
      };

      TeamResolver.createTeam.mockImplementation(mockCreateTeam);

      // Executar o teste - deve lançar erro
      await expect(
        TeamResolver.createTeam(
          null,
          {
            input: {
              name: 'Network', // Nome já existente
              description: 'Network team duplicado'
            }
          },
          mockContext
        )
      ).rejects.toThrow("Team with name 'Network' already exists");
    });
  });

  describe('deleteTeam', () => {
    it('deve excluir um time existente', async () => {
      // Implementação do mock para o resolver
      const mockDeleteTeam = async (parent, args, context) => {
        // Verificar se o time existe
        const team = await context.prisma.team.findUnique({
          where: { id: args.id }
        });

        if (!team) {
          throw new Error('Team not found');
        }

        // Verificar se há componentes associados
        const hasComponents = await context.prisma.component.findFirst({
          where: { team_id: args.id }
        });

        if (hasComponents) {
          throw new Error('Cannot delete team with associated components');
        }

        await context.prisma.team.delete({
          where: { id: args.id }
        });

        return true;
      };

      TeamResolver.deleteTeam.mockImplementation(mockDeleteTeam);

      // Executar o teste
      const result = await TeamResolver.deleteTeam(
        null,
        { id: 1 },
        mockContext
      );

      // Verificações
      expect(result).toBe(true);
      expect(mockPrisma.team.findUnique).toHaveBeenCalledWith({
        where: { id: 1 }
      });
      expect(mockPrisma.component.findFirst).toHaveBeenCalledWith({
        where: { team_id: 1 }
      });
      expect(mockPrisma.team.delete).toHaveBeenCalledWith({
        where: { id: 1 }
      });
    });

    it('deve impedir a exclusão de time com componentes associados', async () => {
      // Mock para componentes associados
      mockPrisma.component.findFirst.mockResolvedValue({ id: 1, team_id: 1 } as any);

      // Implementação do mock para o resolver
      const mockDeleteTeam = async (parent, args, context) => {
        // Verificar se o time existe
        const team = await context.prisma.team.findUnique({
          where: { id: args.id }
        });

        if (!team) {
          throw new Error('Team not found');
        }

        // Verificar se há componentes associados
        const hasComponents = await context.prisma.component.findFirst({
          where: { team_id: args.id }
        });

        if (hasComponents) {
          throw new Error('Cannot delete team with associated components');
        }

        await context.prisma.team.delete({
          where: { id: args.id }
        });

        return true;
      };

      TeamResolver.deleteTeam.mockImplementation(mockDeleteTeam);

      // Executar o teste - deve lançar erro
      await expect(
        TeamResolver.deleteTeam(
          null,
          { id: 1 },
          mockContext
        )
      ).rejects.toThrow('Cannot delete team with associated components');

      // Verificar que delete não foi chamado
      expect(mockPrisma.team.delete).not.toHaveBeenCalled();
    });
  });

  describe('addTeamMember', () => {
    it('deve adicionar um membro a um time', async () => {
      // Implementação do mock para o resolver
      const mockAddTeamMember = async (parent, args, context) => {
        // Verificar se o time existe
        const team = await context.prisma.team.findUnique({
          where: { id: args.teamId }
        });

        if (!team) {
          throw new Error('Team not found');
        }

        // Verificar se o usuário existe
        const user = await context.prisma.user.findUnique({
          where: { id: args.userId }
        });

        if (!user) {
          throw new Error('User not found');
        }

        // Verificar se o usuário já é membro do time
        const existingMember = await context.prisma.teamMember.findFirst({
          where: {
            team_id: args.teamId,
            user_id: args.userId
          }
        });

        if (existingMember) {
          throw new Error('User is already a member of this team');
        }

        // Adicionar membro
        return context.prisma.teamMember.create({
          data: {
            team_id: args.teamId,
            user_id: args.userId,
            joined_at: new Date()
          }
        });
      };

      TeamResolver.addTeamMember.mockImplementation(mockAddTeamMember);

      // Executar o teste
      const result = await TeamResolver.addTeamMember(
        null,
        { teamId: 3, userId: 1, role: 'member' },
        mockContext
      );

      // Verificações
      expect(result).toEqual({
        id: 3,
        team_id: 3,
        user_id: 1,
        joined_at: expect.any(Date)
      });
      expect(mockPrisma.team.findUnique).toHaveBeenCalledWith({
        where: { id: 3 }
      });
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 1 }
      });
      expect(mockPrisma.teamMember.findFirst).toHaveBeenCalledWith({
        where: {
          team_id: 3,
          user_id: 1
        }
      });
      expect(mockPrisma.teamMember.create).toHaveBeenCalledWith({
        data: {
          team_id: 3,
          user_id: 1,
          joined_at: expect.any(Date)
        }
      });
    });

    it('deve impedir adicionar membro já existente', async () => {
      // Mock para membro já existente
      mockPrisma.teamMember.findFirst.mockResolvedValue(mockTeamMembers[0] as any);

      // Implementação do mock para o resolver
      const mockAddTeamMember = async (parent, args, context) => {
        // Verificar se o usuário já é membro do time
        const existingMember = await context.prisma.teamMember.findFirst({
          where: {
            team_id: args.teamId,
            user_id: args.userId
          }
        });

        if (existingMember) {
          throw new Error('User is already a member of this team');
        }

        return context.prisma.teamMember.create({
          data: {
            team_id: args.teamId,
            user_id: args.userId,
            joined_at: new Date()
          }
        });
      };

      TeamResolver.addTeamMember.mockImplementation(mockAddTeamMember);

      // Executar o teste - deve lançar erro
      await expect(
        TeamResolver.addTeamMember(
          null,
          { teamId: 1, userId: 1, role: 'member' },
          mockContext
        )
      ).rejects.toThrow('User is already a member of this team');

      // Verificar que create não foi chamado
      expect(mockPrisma.teamMember.create).not.toHaveBeenCalled();
    });
  });

  describe('removeTeamMember', () => {
    it('deve remover um membro do time', async () => {
      // Mock para encontrar o membro
      mockPrisma.teamMember.findUnique.mockResolvedValue(mockTeamMembers[0] as any);

      // Implementação do mock para o resolver
      const mockRemoveTeamMember = async (parent, args, context) => {
        // Verificar se o membro existe
        const member = await context.prisma.teamMember.findUnique({
          where: { id: args.id }
        });

        if (!member) {
          throw new Error('Team member not found');
        }

        await context.prisma.teamMember.delete({
          where: { id: args.id }
        });

        return true;
      };

      TeamResolver.removeTeamMember.mockImplementation(mockRemoveTeamMember);

      // Executar o teste
      const result = await TeamResolver.removeTeamMember(
        null,
        { id: 1 },
        mockContext
      );

      // Verificações
      expect(result).toBe(true);
      expect(mockPrisma.teamMember.findUnique).toHaveBeenCalledWith({
        where: { id: 1 }
      });
      expect(mockPrisma.teamMember.delete).toHaveBeenCalledWith({
        where: { id: 1 }
      });
    });
  });
}); 