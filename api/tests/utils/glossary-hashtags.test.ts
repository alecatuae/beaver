/**
 * Testes para a funcionalidade de hashtags do glossário
 * 
 * Estes testes verificam a funcionalidade de detecção e realce de termos
 * do glossário referenciados através de hashtags (#) em textos de ADRs.
 */

import { mockDeep } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';
import { 
  extractGlossaryReferences, 
  parseTextWithGlossaryReferences,
  findGlossaryTermsInText
} from '../../src/utils/glossary';

// Mock do cliente Prisma
const mockPrisma = mockDeep<PrismaClient>();

// Mock dos termos do glossário
const mockGlossaryTerms = [
  { id: 1, term: 'API Gateway', definition: 'Um serviço de gerenciamento de APIs', created_at: new Date() },
  { id: 2, term: 'Circuit Breaker', definition: 'Padrão para evitar falhas em cascata', created_at: new Date() },
  { id: 3, term: 'Load Balancer', definition: 'Distribui tráfego entre instâncias', created_at: new Date() },
];

describe('Funcionalidades de hashtags do Glossário v2.0', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup do mock do Prisma
    mockPrisma.glossaryTerm.findMany.mockResolvedValue(mockGlossaryTerms as any);
  });
  
  describe('extractGlossaryReferences', () => {
    it('deve extrair termos referenciados por hashtags', () => {
      const text = 'Este ADR implementa #API Gateway e #Circuit Breaker para melhorar resiliência.';
      
      const result = extractGlossaryReferences(text);
      
      expect(result).toEqual(['API Gateway', 'Circuit Breaker']);
    });
    
    it('deve ignorar hashtags que não são seguidas por termos válidos', () => {
      const text = 'Hashtag simples #teste ou #123 devem ser ignoradas';
      
      const result = extractGlossaryReferences(text);
      
      expect(result).toEqual([]);
    });
    
    it('deve lidar com termos com múltiplas palavras corretamente', () => {
      const text = 'Implementação de #Load Balancer e #API Gateway';
      
      const result = extractGlossaryReferences(text);
      
      expect(result).toEqual(['Load Balancer', 'API Gateway']);
    });
    
    it('deve ignorar sinais de pontuação após os termos', () => {
      const text = 'Usando #API Gateway, #Circuit Breaker. #Load Balancer? Sim.';
      
      const result = extractGlossaryReferences(text);
      
      expect(result).toEqual(['API Gateway', 'Circuit Breaker', 'Load Balancer']);
    });
  });
  
  describe('findGlossaryTermsInText', () => {
    it('deve encontrar termos do glossário no texto utilizando o banco de dados', async () => {
      const text = 'Este ADR implementa #API Gateway e #Circuit Breaker para melhorar resiliência.';
      
      // Configurar mock para retornar apenas os termos encontrados
      mockPrisma.glossaryTerm.findMany.mockImplementation(async ({ where }) => {
        const terms = (where.term.in as string[]);
        return mockGlossaryTerms.filter(t => terms.includes(t.term)) as any;
      });
      
      const result = await findGlossaryTermsInText(mockPrisma, text);
      
      // Verificar chamada ao Prisma
      expect(mockPrisma.glossaryTerm.findMany).toHaveBeenCalledWith({
        where: {
          term: {
            in: ['API Gateway', 'Circuit Breaker']
          }
        }
      });
      
      // Verificar resultado
      expect(result).toHaveLength(2);
      expect(result[0].term).toBe('API Gateway');
      expect(result[1].term).toBe('Circuit Breaker');
    });
    
    it('deve retornar array vazio quando não há hashtags no texto', async () => {
      const text = 'Este ADR não contém nenhuma referência a termo do glossário';
      
      const result = await findGlossaryTermsInText(mockPrisma, text);
      
      // Verificar que o Prisma não foi chamado
      expect(mockPrisma.glossaryTerm.findMany).not.toHaveBeenCalled();
      
      // Verificar resultado vazio
      expect(result).toEqual([]);
    });
    
    it('deve retornar apenas termos encontrados no glossário', async () => {
      const text = 'Este ADR utiliza #API Gateway e #Termo Inexistente';
      
      // Configurar mock para retornar apenas o termo existente
      mockPrisma.glossaryTerm.findMany.mockImplementation(async ({ where }) => {
        const terms = (where.term.in as string[]);
        return mockGlossaryTerms.filter(t => terms.includes(t.term)) as any;
      });
      
      const result = await findGlossaryTermsInText(mockPrisma, text);
      
      // Verificar chamada ao Prisma
      expect(mockPrisma.glossaryTerm.findMany).toHaveBeenCalledWith({
        where: {
          term: {
            in: ['API Gateway', 'Termo Inexistente']
          }
        }
      });
      
      // Verificar resultado apenas com o termo existente
      expect(result).toHaveLength(1);
      expect(result[0].term).toBe('API Gateway');
    });
  });
  
  describe('parseTextWithGlossaryReferences', () => {
    it('deve substituir hashtags por links para o glossário', async () => {
      const text = 'Este ADR implementa #API Gateway e #Circuit Breaker.';
      
      // Mock dos termos encontrados
      const foundTerms = [
        { id: 1, term: 'API Gateway', definition: 'Um serviço de gerenciamento de APIs' },
        { id: 2, term: 'Circuit Breaker', definition: 'Padrão para evitar falhas em cascata' }
      ];
      
      // Supondo que findGlossaryTermsInText seja chamado internamente
      jest.spyOn(global, 'findGlossaryTermsInText' as any).mockResolvedValue(foundTerms);
      
      const result = await parseTextWithGlossaryReferences(mockPrisma, text);
      
      // Verificar que o texto foi transformado com os links
      expect(result).toContain('<a href="/glossary/1" class="glossary-term" title="Um serviço de gerenciamento de APIs">API Gateway</a>');
      expect(result).toContain('<a href="/glossary/2" class="glossary-term" title="Padrão para evitar falhas em cascata">Circuit Breaker</a>');
      
      // Verificar que o # foi removido
      expect(result).not.toContain('#API Gateway');
      expect(result).not.toContain('#Circuit Breaker');
    });
    
    it('deve preservar o texto original quando não há referências', async () => {
      const text = 'Este ADR não tem referências ao glossário';
      
      // Mock para nenhum termo encontrado
      jest.spyOn(global, 'findGlossaryTermsInText' as any).mockResolvedValue([]);
      
      const result = await parseTextWithGlossaryReferences(mockPrisma, text);
      
      // Verificar que o texto permanece inalterado
      expect(result).toBe(text);
    });
    
    it('deve manter hashtags de termos que não existem no glossário', async () => {
      const text = 'Usa #API Gateway e #Termo Inexistente';
      
      // Mock para apenas um termo encontrado
      jest.spyOn(global, 'findGlossaryTermsInText' as any).mockResolvedValue([
        { id: 1, term: 'API Gateway', definition: 'Um serviço de gerenciamento de APIs' }
      ]);
      
      const result = await parseTextWithGlossaryReferences(mockPrisma, text);
      
      // Verificar que o termo existente foi transformado
      expect(result).toContain('<a href="/glossary/1" class="glossary-term"');
      
      // Verificar que o termo inexistente permanece como hashtag
      expect(result).toContain('#Termo Inexistente');
    });
  });
}); 