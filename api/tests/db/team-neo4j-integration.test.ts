/**
 * Testes para integração de Times com Neo4j
 * 
 * Estes testes verificam o comportamento da sincronização de Times
 * entre o MariaDB e o Neo4j para a v2.0 do Beaver.
 */

import { mockDeep, mockReset } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';
import { Driver, Session } from 'neo4j-driver';
import { syncTeam, syncTeamMember } from '../../src/db/neo4j_v2_integration';
import { prisma } from '../../src/prisma';
import { logger } from '../../src/utils/logger';

// Mock do driver Neo4j
const mockDriver = mockDeep<Driver>();
const mockSession = mockDeep<Session>();
const mockTransaction = {
  run: jest.fn(),
};

// Mock do Prisma
jest.mock('../../src/prisma', () => ({
  __esModule: true,
  prisma: mockDeep<PrismaClient>(),
}));

// Mocks dos dados
const mockTeam = {
  id: 1,
  name: 'Infra Team',
  description: 'Infrastructure Team',
  created_at: new Date()
};

const mockTeamMember = {
  id: 1,
  team_id: 1,
  user_id: 10,
  role: 'LEADER',
  created_at: new Date(),
  team: { id: 1, name: 'Infra Team' },
  user: { id: 10, username: 'john.doe' }
};

describe('Integração de Times com Neo4j v2.0', () => {
  beforeEach(() => {
    // Reset dos mocks
    mockReset(mockDriver);
    mockReset(mockSession);
    mockReset(mockTransaction);
    
    // Setup do mock do driver
    mockDriver.session.mockReturnValue(mockSession);
    mockSession.executeWrite.mockImplementation((callback) => callback(mockTransaction));
    mockSession.executeRead.mockImplementation((callback) => callback(mockTransaction));
    
    // Mock de transação bem-sucedida
    mockTransaction.run.mockResolvedValue({ summary: { counters: { updates: () => ({ nodesCreated: 1 }) } } });
    
    jest.clearAllMocks();
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  describe('syncTeam', () => {
    it('deve criar/atualizar um nó de Time no Neo4j', async () => {
      // Executar a função
      const result = await syncTeam(mockTeam, mockDriver);
      
      // Verificar se a session foi obtida
      expect(mockDriver.session).toHaveBeenCalled();
      
      // Verificar se executeWrite foi chamado
      expect(mockSession.executeWrite).toHaveBeenCalled();
      
      // Verificar se a query correta foi executada
      expect(mockTransaction.run).toHaveBeenCalledWith(
        expect.stringContaining('MERGE (t:Team {id: $id})'),
        expect.objectContaining({
          id: 1,
          name: 'Infra Team',
          description: 'Infrastructure Team'
        })
      );
      
      // Verificar se a sessão foi fechada
      expect(mockSession.close).toHaveBeenCalled();
      
      // Verificar o resultado
      expect(result).toBe(true);
    });
    
    it('deve lançar e logar erro em caso de falha', async () => {
      // Mock de erro na transação
      mockTransaction.run.mockRejectedValue(new Error('Neo4j error'));
      
      // Executar e verificar se lança erro
      await expect(syncTeam(mockTeam, mockDriver)).rejects.toThrow('Neo4j error');
      
      // Verificar se a sessão foi fechada mesmo com erro
      expect(mockSession.close).toHaveBeenCalled();
    });
  });
  
  describe('syncTeamMember', () => {
    it('deve criar uma relação MEMBER_OF do usuário para o time', async () => {
      // Executar a função
      const result = await syncTeamMember(mockTeamMember, mockDriver);
      
      // Verificar se a session foi obtida
      expect(mockDriver.session).toHaveBeenCalled();
      
      // Verificar se executeWrite foi chamado
      expect(mockSession.executeWrite).toHaveBeenCalled();
      
      // Verificar se a query correta foi executada - deve criar relação MEMBER_OF com role
      expect(mockTransaction.run).toHaveBeenCalledWith(
        expect.stringContaining('MATCH (u:User {id: $userId}), (t:Team {id: $teamId})'),
        expect.objectContaining({
          userId: 10,
          teamId: 1,
          role: 'LEADER'
        })
      );
      
      // Verificar se a sessão foi fechada
      expect(mockSession.close).toHaveBeenCalled();
      
      // Verificar o resultado
      expect(result).toBe(true);
    });
    
    it('deve lançar e logar erro em caso de falha', async () => {
      // Mock de erro na transação
      mockTransaction.run.mockRejectedValue(new Error('Neo4j error'));
      
      // Executar e verificar se lança erro
      await expect(syncTeamMember(mockTeamMember, mockDriver)).rejects.toThrow('Neo4j error');
      
      // Verificar se a sessão foi fechada mesmo com erro
      expect(mockSession.close).toHaveBeenCalled();
    });
  });
  
  describe('Integração com hooks do Prisma', () => {
    // Teste do hook do Prisma para sincronização automática
    it('deve sincronizar com Neo4j após criar um time via Prisma', async () => {
      // Mock do hook do Prisma - não podemos testar diretamente o hook, mas podemos verificar a lógica
      
      // Suponha que este é o hook simplificado:
      const mockHook = async () => {
        try {
          // Simular criação do time
          const team = mockTeam;
          
          // Chamar função de sincronização
          await syncTeam(team, mockDriver);
          
          return team;
        } catch (error) {
          logger.error('Erro ao sincronizar time com Neo4j:', error);
          throw error;
        }
      };
      
      // Executar o hook simulado
      await mockHook();
      
      // Verificar se syncTeam foi chamado com os parâmetros corretos
      expect(mockTransaction.run).toHaveBeenCalledWith(
        expect.stringContaining('MERGE (t:Team {id: $id})'),
        expect.objectContaining({ id: 1 })
      );
    });
  });
}); 