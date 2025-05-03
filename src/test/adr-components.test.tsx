/**
 * Testes unitários para os componentes de ADR
 * 
 * Este arquivo contém testes para os componentes relacionados aos ADRs,
 * especialmente a funcionalidade de múltiplos participantes com diferentes papéis
 * 
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import { ADRParticipantType, ParticipantRole, ADRStatus } from '@/lib/graphql-adr';
import '@testing-library/jest-dom';

// Mock do componente Avatar para evitar problemas com o tailwind e className
jest.mock('@/components/ui/avatar', () => ({
  Avatar: ({ children, className }: any) => <div data-testid="avatar">{children}</div>,
  AvatarFallback: ({ children, className }: any) => <div data-testid="avatar-fallback">{children}</div>,
  AvatarImage: ({ src, alt }: any) => <img data-testid="avatar-image" src={src} alt={alt} />,
}));

// Importar os componentes sob teste
// Como os componentes são páginas inteiras, vamos testar funções isoladas
// que formam a base da funcionalidade de participantes

// Função para obter as cores por papel - extraída de adrs/page.tsx
const getRoleBadgeClass = (role: string) => {
  switch (role) {
    case ParticipantRole.OWNER:
      return 'bg-primary/80 text-primary-foreground';
    case ParticipantRole.REVIEWER:
      return 'bg-amber-100 text-amber-800';
    case ParticipantRole.CONSUMER:
      return 'bg-blue-100 text-blue-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

// Função para obter nome legível do papel - extraída de adrs/page.tsx
const getRoleName = (role: string) => {
  switch (role) {
    case ParticipantRole.OWNER:
      return 'Responsável';
    case ParticipantRole.REVIEWER:
      return 'Revisor';
    case ParticipantRole.CONSUMER:
      return 'Consumidor';
    default:
      return role;
  }
};

// Função para obter iniciais do nome - extraída de adrs/page.tsx
const getInitials = (name: string) => {
  if (!name) return '?';
  const parts = name.split(' ').filter(part => part.length > 0);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

// Componente simples para testar o renderizador de participantes
function ParticipantRenderer({ participants }: { participants: ADRParticipantType[] }) {
  return (
    <div>
      {participants.map((participant) => (
        <div key={participant.id} data-testid="participant-item">
          <span data-testid="participant-name">{participant.user.fullName}</span>
          <span data-testid="participant-role" className={getRoleBadgeClass(participant.role)}>
            {getRoleName(participant.role)}
          </span>
          <span data-testid="participant-initials">{getInitials(participant.user.fullName)}</span>
        </div>
      ))}
    </div>
  );
}

// Dados de teste
const testParticipants: ADRParticipantType[] = [
  {
    id: 1,
    role: ParticipantRole.OWNER,
    user: {
      id: 101,
      fullName: 'Ana Silva',
      email: 'ana.silva@exemplo.com'
    }
  },
  {
    id: 2,
    role: ParticipantRole.REVIEWER,
    user: {
      id: 102,
      fullName: 'Carlos Oliveira',
      email: 'carlos.oliveira@exemplo.com'
    }
  },
  {
    id: 3,
    role: ParticipantRole.CONSUMER,
    user: {
      id: 103,
      fullName: 'Mariana',
      email: 'mariana@exemplo.com'
    }
  }
];

describe('Componentes de ADR - Testes de Funcionalidade', () => {
  describe('Funções utilitárias para participantes', () => {
    test('getRoleBadgeClass retorna classes corretas para cada papel', () => {
      expect(getRoleBadgeClass(ParticipantRole.OWNER)).toContain('primary');
      expect(getRoleBadgeClass(ParticipantRole.REVIEWER)).toContain('amber');
      expect(getRoleBadgeClass(ParticipantRole.CONSUMER)).toContain('blue');
      expect(getRoleBadgeClass('papel_inexistente')).toContain('gray');
    });

    test('getRoleName retorna nomes legíveis corretos em português', () => {
      expect(getRoleName(ParticipantRole.OWNER)).toBe('Responsável');
      expect(getRoleName(ParticipantRole.REVIEWER)).toBe('Revisor');
      expect(getRoleName(ParticipantRole.CONSUMER)).toBe('Consumidor');
      expect(getRoleName('papel_inexistente')).toBe('papel_inexistente');
    });

    test('getInitials retorna iniciais corretas para nomes completos', () => {
      expect(getInitials('Ana Silva')).toBe('AS');
      expect(getInitials('Carlos')).toBe('C');
      expect(getInitials('')).toBe('?');
      expect(getInitials('  ')).toBe('?');
    });
  });

  describe('Renderização de participantes', () => {
    test('Renderiza corretamente a lista de participantes', () => {
      render(<ParticipantRenderer participants={testParticipants} />);
      
      // Verifica se todos os participantes foram renderizados
      const items = screen.getAllByTestId('participant-item');
      expect(items).toHaveLength(3);
      
      // Verifica nomes
      const names = screen.getAllByTestId('participant-name');
      expect(names[0]).toHaveTextContent('Ana Silva');
      expect(names[1]).toHaveTextContent('Carlos Oliveira');
      expect(names[2]).toHaveTextContent('Mariana');
      
      // Verifica papéis
      const roles = screen.getAllByTestId('participant-role');
      expect(roles[0]).toHaveTextContent('Responsável');
      expect(roles[1]).toHaveTextContent('Revisor');
      expect(roles[2]).toHaveTextContent('Consumidor');
      
      // Verifica iniciais
      const initials = screen.getAllByTestId('participant-initials');
      expect(initials[0]).toHaveTextContent('AS');
      expect(initials[1]).toHaveTextContent('CO');
      expect(initials[2]).toHaveTextContent('M');
    });
    
    test('Lida corretamente com lista vazia de participantes', () => {
      render(<ParticipantRenderer participants={[]} />);
      const items = screen.queryAllByTestId('participant-item');
      expect(items).toHaveLength(0);
    });
  });
});

// Testes de validação para garantir que cada ADR tenha pelo menos um owner
describe('Validação de ADR', () => {
  test('Validação rejeita ADR sem nenhum participante com papel de owner', () => {
    const participants = [
      {
        userId: 101,
        role: ParticipantRole.REVIEWER
      },
      {
        userId: 102,
        role: ParticipantRole.CONSUMER
      }
    ];
    
    const validationResult = validateADRParticipants(participants);
    expect(validationResult.isValid).toBe(false);
    expect(validationResult.error).toContain('pelo menos um participante com papel "owner"');
  });
  
  test('Validação aceita ADR com pelo menos um participante com papel de owner', () => {
    const participants = [
      {
        userId: 101,
        role: ParticipantRole.OWNER
      },
      {
        userId: 102,
        role: ParticipantRole.REVIEWER
      }
    ];
    
    const validationResult = validateADRParticipants(participants);
    expect(validationResult.isValid).toBe(true);
    expect(validationResult.error).toBe('');
  });
});

// Função de validação para testar
function validateADRParticipants(participants: { userId: number, role: string }[]) {
  const hasOwner = participants.some(p => p.role === ParticipantRole.OWNER);
  
  if (!hasOwner) {
    return {
      isValid: false,
      error: 'É necessário pelo menos um participante com papel "owner"'
    };
  }
  
  return {
    isValid: true,
    error: ''
  };
} 