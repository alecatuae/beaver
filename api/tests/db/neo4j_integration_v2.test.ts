/**
 * Testes para Neo4jIntegrationV2
 * 
 * Estes testes verificam a funcionalidade de integração estendida com Neo4j
 * para as novas entidades da versão 2.0 do Beaver.
 */

import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';
import { Neo4jIntegrationV2 } from '../../src/db/neo4j_integration_v2';
import { prisma } from '../../src/prisma';
import { Driver, Session, Result, Record } from 'neo4j-driver';
import { logger } from '../../src/utils/logger';

// Mock para o driver Neo4j
const mockDriver = mockDeep<Driver>();
const mockSession = mockDeep<Session>();
const mockTransaction = {
  run: jest.fn(),
};

// Mock para os resultados do Neo4j
const mockResult = mockDeep<Result>();
const mockRecord = mockDeep<Record>();

describe('Neo4jIntegrationV2', () => {
  let neo4jIntegration: Neo4jIntegrationV2;
  
  beforeEach(() => {
    // Reset dos mocks
    mockReset(mockDriver);
    mockReset(mockSession);
    mockReset(mockTransaction);
    mockReset(mockResult);
    
    // Setup do mock do driver
    mockDriver.session.mockReturnValue(mockSession);
    mockSession.executeWrite.mockImplementation((callback) => callback(mockTransaction));
    mockSession.executeRead.mockImplementation((callback) => callback(mockTransaction));
    
    // Criar instância da classe a ser testada
    neo4jIntegration = new Neo4jIntegrationV2(mockDriver);
    
    // Mock do prisma
    jest.clearAllMocks();
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  describe('syncAllEntities', () => {
    it('deve chamar todos os métodos de sincronização na ordem correta', async () => {
      // Spy nos métodos de sincronização
      jest.spyOn(neo4jIntegration, 'syncEnvironments').mockResolvedValueOnce();
      jest.spyOn(neo4jIntegration, 'syncTeams').mockResolvedValueOnce();
      jest.spyOn(neo4jIntegration, 'syncComponentInstances').mockResolvedValueOnce();
      jest.spyOn(neo4jIntegration, 'syncADRParticipants').mockResolvedValueOnce();
      jest.spyOn(neo4jIntegration, 'syncADRComponentInstances').mockResolvedValueOnce();
      
      // Executar o método a ser testado
      await neo4jIntegration.syncAllEntities();
      
      // Verificar se os métodos foram chamados na ordem correta
      expect(neo4jIntegration.syncEnvironments).toHaveBeenCalledBefore(neo4jIntegration.syncTeams);
      expect(neo4jIntegration.syncTeams).toHaveBeenCalledBefore(neo4jIntegration.syncComponentInstances);
      expect(neo4jIntegration.syncComponentInstances).toHaveBeenCalledBefore(neo4jIntegration.syncADRParticipants);
      expect(neo4jIntegration.syncADRParticipants).toHaveBeenCalledBefore(neo4jIntegration.syncADRComponentInstances);
    });
    
    it('deve propagar erro se algum método de sincronização falhar', async () => {
      // Spy nos métodos de sincronização
      jest.spyOn(neo4jIntegration, 'syncEnvironments').mockResolvedValueOnce();
      jest.spyOn(neo4jIntegration, 'syncTeams').mockRejectedValueOnce(new Error('Erro na sincronização de times'));
      
      // Verificar se o método propaga o erro
      await expect(neo4jIntegration.syncAllEntities()).rejects.toThrow('Erro na sincronização de times');
      
      // Verificar se apenas os métodos até o erro foram chamados
      expect(neo4jIntegration.syncEnvironments).toHaveBeenCalled();
      expect(neo4jIntegration.syncTeams).toHaveBeenCalled();
      expect(neo4jIntegration.syncComponentInstances).not.toHaveBeenCalled();
    });
  });
  
  describe('syncEnvironments', () => {
    it('deve sincronizar ambientes do MariaDB para o Neo4j', async () => {
      // Mock dos dados de ambiente
      const mockEnvironments = [
        { id: 1, name: 'development', description: 'Dev environment', createdAt: new Date() },
        { id: 2, name: 'production', description: 'Prod environment', createdAt: new Date() },
      ];
      
      // Mock do prisma.environment.findMany
      (prisma.environment.findMany as jest.Mock).mockResolvedValue(mockEnvironments);
      
      // Executar o método a ser testado
      await neo4jIntegration.syncEnvironments();
      
      // Verificar se o prisma foi chamado corretamente
      expect(prisma.environment.findMany).toHaveBeenCalled();
      
      // Verificar se a session do Neo4j foi usada
      expect(mockDriver.session).toHaveBeenCalled();
      
      // Verificar se executeWrite foi chamado para cada ambiente
      expect(mockSession.executeWrite).toHaveBeenCalledTimes(mockEnvironments.length);
      
      // Verificar se a transação executou a query correta
      expect(mockTransaction.run).toHaveBeenCalledTimes(mockEnvironments.length);
      
      // Verificar se a sessão foi fechada
      expect(mockSession.close).toHaveBeenCalled();
    });
    
    it('deve lançar erro em caso de falha na sincronização', async () => {
      // Simular erro
      (prisma.environment.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));
      
      // Verificar se o método lança um erro
      await expect(neo4jIntegration.syncEnvironments()).rejects.toThrow();
      
      // Verificar se a sessão foi fechada mesmo com erro
      expect(mockSession.close).toHaveBeenCalled();
    });
  });
  
  describe('syncTeams', () => {
    it('deve sincronizar times e suas relações com componentes', async () => {
      // Mock dos dados de times
      const mockTeams = [
        { id: 1, name: 'Platform', description: 'Platform team', createdAt: new Date() },
        { id: 2, name: 'Network', description: 'Network team', createdAt: new Date() },
      ];
      
      // Mock dos componentes com times
      const mockComponentsWithTeams = [
        { id: 1, name: 'Component 1', teamId: 1 },
        { id: 2, name: 'Component 2', teamId: 2 },
      ];
      
      // Mock das chamadas do prisma
      (prisma.team.findMany as jest.Mock).mockResolvedValue(mockTeams);
      (prisma.component.findMany as jest.Mock).mockResolvedValue(mockComponentsWithTeams);
      
      // Executar o método a ser testado
      await neo4jIntegration.syncTeams();
      
      // Verificar se o prisma foi chamado corretamente
      expect(prisma.team.findMany).toHaveBeenCalled();
      expect(prisma.component.findMany).toHaveBeenCalledWith({
        where: {
          teamId: {
            not: null
          }
        }
      });
      
      // Verificar se a session do Neo4j foi usada
      expect(mockDriver.session).toHaveBeenCalled();
      
      // Verificar se executeWrite foi chamado para cada time e para cada relação
      const totalCalls = mockTeams.length + mockComponentsWithTeams.length;
      expect(mockTransaction.run).toHaveBeenCalledTimes(totalCalls);
      
      // Verificar se a sessão foi fechada
      expect(mockSession.close).toHaveBeenCalled();
    });
  });
  
  describe('syncComponentInstances', () => {
    it('deve sincronizar instâncias de componentes e suas relações', async () => {
      // Mock dos dados de instâncias
      const mockInstances = [
        { 
          id: 1, 
          componentId: 1, 
          environmentId: 1, 
          hostname: 'host1', 
          specs: { cpu: '2', memory: '4GB' }, 
          createdAt: new Date(),
          component: { id: 1, name: 'Component 1' },
          environment: { id: 1, name: 'development' }
        },
        { 
          id: 2, 
          componentId: 2, 
          environmentId: 2, 
          hostname: 'host2', 
          specs: { cpu: '4', memory: '8GB' }, 
          createdAt: new Date(),
          component: { id: 2, name: 'Component 2' },
          environment: { id: 2, name: 'production' }
        }
      ];
      
      // Mock das chamadas do prisma
      (prisma.componentInstance.findMany as jest.Mock).mockResolvedValue(mockInstances);
      
      // Executar o método a ser testado
      await neo4jIntegration.syncComponentInstances();
      
      // Verificar se o prisma foi chamado corretamente
      expect(prisma.componentInstance.findMany).toHaveBeenCalledWith({
        include: {
          component: true,
          environment: true
        }
      });
      
      // Verificar se executeWrite foi chamado para cada instância (3 queries por instância)
      const totalCalls = mockInstances.length * 3; // Nó + 2 relações por instância
      expect(mockTransaction.run).toHaveBeenCalledTimes(totalCalls);
    });
  });
  
  describe('syncADRParticipants', () => {
    it('deve sincronizar participantes de ADRs e criar relações PARTICIPATES_IN', async () => {
      // Mock dos dados de participantes
      const mockParticipants = [
        { 
          id: 1, 
          adrId: 10, 
          userId: 100, 
          role: 'OWNER', 
          createdAt: new Date(),
          adr: { id: 10, title: 'ADR 1' },
          user: { id: 100, username: 'user1' }
        },
        { 
          id: 2, 
          adrId: 10, 
          userId: 101, 
          role: 'REVIEWER', 
          createdAt: new Date(),
          adr: { id: 10, title: 'ADR 1' },
          user: { id: 101, username: 'user2' }
        },
        { 
          id: 3, 
          adrId: 11, 
          userId: 100, 
          role: 'CONSUMER', 
          createdAt: new Date(),
          adr: { id: 11, title: 'ADR 2' },
          user: { id: 100, username: 'user1' }
        }
      ];
      
      // Mock das chamadas do prisma
      (prisma.aDRParticipant.findMany as jest.Mock).mockResolvedValue(mockParticipants);
      
      // Executar o método a ser testado
      await neo4jIntegration.syncADRParticipants();
      
      // Verificar se o prisma foi chamado corretamente
      expect(prisma.aDRParticipant.findMany).toHaveBeenCalledWith({
        include: {
          adr: true,
          user: true
        }
      });
      
      // Verificar se executeWrite foi chamado para cada participante
      expect(mockTransaction.run).toHaveBeenCalledTimes(mockParticipants.length);
      
      // Verificar se o primeiro participante (OWNER) foi processado corretamente
      expect(mockTransaction.run).toHaveBeenCalledWith(
        expect.stringContaining('PARTICIPATES_IN'),
        expect.objectContaining({
          userId: 100,
          adrId: 10,
          role: 'OWNER'
        })
      );
      
      // Verificar se a sessão foi fechada
      expect(mockSession.close).toHaveBeenCalled();
    });
    
    it('deve lançar erro em caso de falha na sincronização de participantes', async () => {
      // Simular erro
      (prisma.aDRParticipant.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));
      
      // Verificar se o método lança um erro
      await expect(neo4jIntegration.syncADRParticipants()).rejects.toThrow();
      
      // Verificar se a sessão foi fechada mesmo com erro
      expect(mockSession.close).toHaveBeenCalled();
    });
  });
  
  describe('syncADRComponentInstances', () => {
    it('deve sincronizar relações entre ADRs e instâncias de componentes', async () => {
      // Mock dos dados de ADR-instância
      const mockADRInstances = [
        { 
          adrId: 10, 
          instanceId: 1, 
          impactLevel: 'HIGH',
          notes: 'Alto impacto',
          adr: { id: 10, title: 'ADR 1' },
          instance: { 
            id: 1, 
            componentId: 100, 
            component: { id: 100, name: 'Component 1' } 
          }
        },
        { 
          adrId: 10, 
          instanceId: 2, 
          impactLevel: 'MEDIUM',
          notes: null,
          adr: { id: 10, title: 'ADR 1' },
          instance: { 
            id: 2, 
            componentId: 101, 
            component: { id: 101, name: 'Component 2' } 
          }
        }
      ];
      
      // Mock para verificação de ADR-Component
      (prisma.aDRComponent.findFirst as jest.Mock)
        .mockResolvedValueOnce(null) // Primeira chamada: não encontra, deve criar
        .mockResolvedValueOnce({ adrId: 10, componentId: 101 }); // Segunda chamada: encontra
      
      // Mock para criação de ADR-Component
      (prisma.aDRComponent.create as jest.Mock).mockResolvedValueOnce({
        adrId: 10,
        componentId: 100
      });
      
      // Mock das chamadas do prisma
      (prisma.aDRComponentInstance.findMany as jest.Mock).mockResolvedValue(mockADRInstances);
      
      // Executar o método a ser testado
      await neo4jIntegration.syncADRComponentInstances();
      
      // Verificar se o prisma foi chamado corretamente
      expect(prisma.aDRComponentInstance.findMany).toHaveBeenCalledWith({
        include: {
          adr: true,
          instance: {
            include: {
              component: true
            }
          }
        }
      });
      
      // Verificar se executeWrite foi chamado para cada ADR-Instância (pelo menos)
      expect(mockTransaction.run).toHaveBeenCalledTimes(3); // 2 para AFFECTS_INSTANCE + 1 para ADR-Component
      
      // Verificar se o primeiro adr-instance foi processado corretamente
      expect(mockTransaction.run).toHaveBeenCalledWith(
        expect.stringContaining('AFFECTS_INSTANCE'),
        expect.objectContaining({
          adrId: 10,
          instanceId: 1,
          impactLevel: 'HIGH'
        })
      );
      
      // Verificar se a relação ADR-Component foi criada para o primeiro caso
      expect(prisma.aDRComponent.findFirst).toHaveBeenCalledWith({
        where: {
          adrId: 10,
          componentId: 100
        }
      });
      
      expect(prisma.aDRComponent.create).toHaveBeenCalledWith({
        data: {
          adrId: 10,
          componentId: 100
        }
      });
      
      // Verificar se a sessão foi fechada
      expect(mockSession.close).toHaveBeenCalled();
    });
    
    it('deve lançar erro em caso de falha na sincronização de ADR-instâncias', async () => {
      // Simular erro
      (prisma.aDRComponentInstance.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));
      
      // Verificar se o método lança um erro
      await expect(neo4jIntegration.syncADRComponentInstances()).rejects.toThrow();
      
      // Verificar se a sessão foi fechada mesmo com erro
      expect(mockSession.close).toHaveBeenCalled();
    });
  });
  
  describe('validateIntegrity', () => {
    it('deve identificar dados consistentes entre MariaDB e Neo4j', async () => {
      // Mock das contagens do MariaDB
      (prisma.environment.count as jest.Mock).mockResolvedValue(3);
      (prisma.team.count as jest.Mock).mockResolvedValue(2);
      (prisma.componentInstance.count as jest.Mock).mockResolvedValue(5);
      (prisma.aDRParticipant.count as jest.Mock).mockResolvedValue(10);
      (prisma.aDRComponentInstance.count as jest.Mock).mockResolvedValue(8);
      
      // Mock das respostas do Neo4j para contagens
      const mockCountRecords = [
        { get: jest.fn().mockReturnValue({ toNumber: jest.fn().mockReturnValue(3) }) },
        { get: jest.fn().mockReturnValue({ toNumber: jest.fn().mockReturnValue(2) }) },
        { get: jest.fn().mockReturnValue({ toNumber: jest.fn().mockReturnValue(5) }) },
        { get: jest.fn().mockReturnValue({ toNumber: jest.fn().mockReturnValue(10) }) },
        { get: jest.fn().mockReturnValue({ toNumber: jest.fn().mockReturnValue(8) }) },
        { get: jest.fn().mockReturnValue({ toNumber: jest.fn().mockReturnValue(0) }) },
      ];
      
      // Mock das respostas do Neo4j
      mockTransaction.run.mockImplementation((query) => {
        if (query.includes('Environment')) return { records: [mockCountRecords[0]] };
        if (query.includes('Team')) return { records: [mockCountRecords[1]] };
        if (query.includes('ComponentInstance') && !query.includes('WHERE')) return { records: [mockCountRecords[2]] };
        if (query.includes('PARTICIPATES_IN')) return { records: [mockCountRecords[3]] };
        if (query.includes('AFFECTS_INSTANCE')) return { records: [mockCountRecords[4]] };
        if (query.includes('WHERE NOT')) return { records: [mockCountRecords[5]] };
        return { records: [] };
      });
      
      // Executar o método a ser testado
      const result = await neo4jIntegration.validateIntegrity();
      
      // Verificar o resultado
      expect(result.valid).toBe(true);
      expect(result.discrepancies.length).toBe(0);
      expect(result.countsMariaDB).toEqual({
        environments: 3,
        teams: 2,
        componentInstances: 5,
        adrParticipants: 10,
        adrComponentInstances: 8
      });
      expect(result.countsNeo4j).toEqual({
        environments: 3,
        teams: 2,
        componentInstances: 5,
        adrParticipants: 10,
        adrComponentInstances: 8
      });
    });
    
    it('deve identificar discrepâncias entre MariaDB e Neo4j', async () => {
      // Mock das contagens do MariaDB
      (prisma.environment.count as jest.Mock).mockResolvedValue(3);
      (prisma.team.count as jest.Mock).mockResolvedValue(2);
      (prisma.componentInstance.count as jest.Mock).mockResolvedValue(5);
      (prisma.aDRParticipant.count as jest.Mock).mockResolvedValue(10);
      (prisma.aDRComponentInstance.count as jest.Mock).mockResolvedValue(8);
      
      // Mock das respostas do Neo4j para contagens (com discrepâncias)
      const mockCountRecords = [
        { get: jest.fn().mockReturnValue({ toNumber: jest.fn().mockReturnValue(2) }) }, // Discrepância
        { get: jest.fn().mockReturnValue({ toNumber: jest.fn().mockReturnValue(2) }) },
        { get: jest.fn().mockReturnValue({ toNumber: jest.fn().mockReturnValue(3) }) }, // Discrepância
        { get: jest.fn().mockReturnValue({ toNumber: jest.fn().mockReturnValue(10) }) },
        { get: jest.fn().mockReturnValue({ toNumber: jest.fn().mockReturnValue(6) }) }, // Discrepância
        { get: jest.fn().mockReturnValue({ toNumber: jest.fn().mockReturnValue(2) }) }, // Instâncias órfãs
      ];
      
      // Mock das respostas do Neo4j
      mockTransaction.run.mockImplementation((query) => {
        if (query.includes('Environment')) return { records: [mockCountRecords[0]] };
        if (query.includes('Team')) return { records: [mockCountRecords[1]] };
        if (query.includes('ComponentInstance') && !query.includes('WHERE')) return { records: [mockCountRecords[2]] };
        if (query.includes('PARTICIPATES_IN')) return { records: [mockCountRecords[3]] };
        if (query.includes('AFFECTS_INSTANCE')) return { records: [mockCountRecords[4]] };
        if (query.includes('WHERE NOT')) return { records: [mockCountRecords[5]] };
        return { records: [] };
      });
      
      // Executar o método a ser testado
      const result = await neo4jIntegration.validateIntegrity();
      
      // Verificar o resultado
      expect(result.valid).toBe(false);
      expect(result.discrepancies.length).toBe(4); // 3 discrepâncias + instâncias órfãs
      
      // Verificar as discrepâncias específicas
      expect(result.discrepancies).toContainEqual(expect.objectContaining({
        entity: 'environments',
        mariadb: 3,
        neo4j: 2,
        difference: 1
      }));
      
      expect(result.discrepancies).toContainEqual(expect.objectContaining({
        entity: 'componentInstances',
        mariadb: 5,
        neo4j: 3,
        difference: 2
      }));
      
      expect(result.discrepancies).toContainEqual(expect.objectContaining({
        entity: 'adrComponentInstances',
        mariadb: 8,
        neo4j: 6,
        difference: 2
      }));
      
      expect(result.discrepancies).toContainEqual(expect.objectContaining({
        entity: 'orphanedInstances',
        count: 2,
        description: expect.any(String)
      }));
    });
  });
  
  describe('fixIntegrityIssues', () => {
    it('deve chamar métodos de sincronização para corrigir discrepâncias', async () => {
      // Mock para validateIntegrity retornar discrepâncias
      jest.spyOn(neo4jIntegration, 'validateIntegrity').mockResolvedValueOnce({
        valid: false,
        discrepancies: [
          { entity: 'environments', mariadb: 3, neo4j: 2, difference: 1 },
          { entity: 'componentInstances', mariadb: 5, neo4j: 3, difference: 2 },
          { entity: 'orphanedInstances', count: 2, description: 'Instâncias órfãs' }
        ],
        countsMariaDB: { environments: 3, teams: 2, componentInstances: 5, adrParticipants: 10, adrComponentInstances: 8 },
        countsNeo4j: { environments: 2, teams: 2, componentInstances: 3, adrParticipants: 10, adrComponentInstances: 8 }
      });
      
      // Mock para a segunda chamada de validateIntegrity após as correções
      jest.spyOn(neo4jIntegration, 'validateIntegrity').mockResolvedValueOnce({
        valid: true,
        discrepancies: [],
        countsMariaDB: { environments: 3, teams: 2, componentInstances: 5, adrParticipants: 10, adrComponentInstances: 8 },
        countsNeo4j: { environments: 3, teams: 2, componentInstances: 5, adrParticipants: 10, adrComponentInstances: 8 }
      });
      
      // Spy nos métodos de sincronização
      jest.spyOn(neo4jIntegration, 'syncEnvironments').mockResolvedValueOnce();
      jest.spyOn(neo4jIntegration, 'syncComponentInstances').mockResolvedValueOnce();
      jest.spyOn(neo4jIntegration as any, 'fixOrphanedInstances').mockResolvedValueOnce();
      
      // Executar o método a ser testado
      const result = await neo4jIntegration.fixIntegrityIssues();
      
      // Verificar se os métodos de correção foram chamados
      expect(neo4jIntegration.syncEnvironments).toHaveBeenCalled();
      expect(neo4jIntegration.syncComponentInstances).toHaveBeenCalled();
      expect((neo4jIntegration as any).fixOrphanedInstances).toHaveBeenCalled();
      
      // Verificar o resultado
      expect(result.fixed).toBe(true);
      expect(result.corrections.length).toBe(3);
    });
    
    it('não deve fazer nada se não houver discrepâncias', async () => {
      // Mock para validateIntegrity retornar sem discrepâncias
      jest.spyOn(neo4jIntegration, 'validateIntegrity').mockResolvedValueOnce({
        valid: true,
        discrepancies: [],
        countsMariaDB: { environments: 3, teams: 2, componentInstances: 5, adrParticipants: 10, adrComponentInstances: 8 },
        countsNeo4j: { environments: 3, teams: 2, componentInstances: 5, adrParticipants: 10, adrComponentInstances: 8 }
      });
      
      // Spy nos métodos de sincronização
      jest.spyOn(neo4jIntegration, 'syncEnvironments');
      jest.spyOn(neo4jIntegration, 'syncComponentInstances');
      jest.spyOn(neo4jIntegration as any, 'fixOrphanedInstances');
      
      // Executar o método a ser testado
      const result = await neo4jIntegration.fixIntegrityIssues();
      
      // Verificar que os métodos de correção não foram chamados
      expect(neo4jIntegration.syncEnvironments).not.toHaveBeenCalled();
      expect(neo4jIntegration.syncComponentInstances).not.toHaveBeenCalled();
      expect((neo4jIntegration as any).fixOrphanedInstances).not.toHaveBeenCalled();
      
      // Verificar o resultado
      expect(result.fixed).toBe(true);
      expect(result.corrections.length).toBe(0);
    });
  });
}); 