/**
 * Testes unitários para os componentes de instâncias
 * 
 * Este arquivo contém testes para os componentes relacionados às instâncias
 * de componentes em diferentes ambientes, uma das principais funcionalidades da v2.0
 * 
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock dos componentes UI
jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, className }: any) => <span data-testid="badge" className={className}>{children}</span>,
}));

jest.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: any) => <div data-testid="tooltip">{children}</div>,
  TooltipTrigger: ({ children }: any) => <div data-testid="tooltip-trigger">{children}</div>,
  TooltipContent: ({ children }: any) => <div data-testid="tooltip-content">{children}</div>,
  TooltipProvider: ({ children }: any) => <div data-testid="tooltip-provider">{children}</div>
}));

// Interfaces para tipos de instância e ambiente
interface EnvironmentType {
  id: string;
  name: string;
  description?: string;
}

interface ComponentInstanceType {
  id: string;
  hostname?: string;
  environment: EnvironmentType;
  specs?: any;
}

// Componente de exibição de instâncias
function InstanceBadges({ instances }: { instances: ComponentInstanceType[] }) {
  if (!instances || instances.length === 0) {
    return <span data-testid="no-instances">Sem instâncias</span>;
  }

  // Agrupar instâncias por ambiente para exibição
  const instancesByEnv: Record<string, ComponentInstanceType[]> = {};
  instances.forEach(instance => {
    const envId = instance.environment.id;
    if (!instancesByEnv[envId]) {
      instancesByEnv[envId] = [];
    }
    instancesByEnv[envId].push(instance);
  });

  return (
    <div data-testid="instance-badges-container">
      {Object.entries(instancesByEnv).map(([envId, envInstances]) => (
        <div key={envId} data-testid="env-instance-group">
          <span data-testid="env-name">{envInstances[0]?.environment.name}</span>
          <div data-testid="instance-count" className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs">
            {envInstances.length}
          </div>
          <div className="mt-1">
            {envInstances.map(instance => (
              <div key={instance.id} data-testid="instance-item">
                <span data-testid="instance-hostname">{instance.hostname || 'Sem hostname'}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// Componente para exibição detalhada de uma instância
function InstanceDetailCard({ instance }: { instance: ComponentInstanceType }) {
  return (
    <div data-testid="instance-detail-card" className="border p-4 rounded-md">
      <div data-testid="instance-detail-header" className="flex justify-between items-center mb-2">
        <h3 data-testid="instance-detail-hostname">{instance.hostname || 'Sem hostname'}</h3>
        <span data-testid="instance-detail-env">{instance.environment.name}</span>
      </div>
      <div data-testid="instance-detail-specs">
        {instance.specs ? (
          <pre>{JSON.stringify(instance.specs, null, 2)}</pre>
        ) : (
          <span>Sem especificações técnicas</span>
        )}
      </div>
    </div>
  );
}

// Dados de teste
const testEnvironments: EnvironmentType[] = [
  { id: '1', name: 'Produção', description: 'Ambiente de produção' },
  { id: '2', name: 'Homologação', description: 'Ambiente de homologação' },
  { id: '3', name: 'Desenvolvimento', description: 'Ambiente de desenvolvimento' }
];

const testInstances: ComponentInstanceType[] = [
  {
    id: '101',
    hostname: 'api-gateway-prod-01',
    environment: testEnvironments[0],
    specs: { cpu: '4', memory: '8Gi', version: '1.2.3' }
  },
  {
    id: '102',
    hostname: 'api-gateway-prod-02',
    environment: testEnvironments[0],
    specs: { cpu: '4', memory: '8Gi', version: '1.2.3' }
  },
  {
    id: '103',
    hostname: 'api-gateway-hom',
    environment: testEnvironments[1],
    specs: { cpu: '2', memory: '4Gi', version: '1.2.4-rc1' }
  },
  {
    id: '104',
    hostname: 'api-gateway-dev',
    environment: testEnvironments[2],
    specs: { cpu: '1', memory: '2Gi', version: '1.2.4-dev' }
  }
];

describe('Componentes de Instâncias - Testes de Funcionalidade', () => {
  describe('InstanceBadges - Exibição agrupada de instâncias', () => {
    test('Renderiza mensagem quando não há instâncias', () => {
      render(<InstanceBadges instances={[]} />);
      expect(screen.getByTestId('no-instances')).toBeInTheDocument();
      expect(screen.getByTestId('no-instances')).toHaveTextContent('Sem instâncias');
    });

    test('Agrupa e exibe corretamente instâncias por ambiente', () => {
      render(<InstanceBadges instances={testInstances} />);
      
      // Deve haver 3 grupos de ambiente
      const envGroups = screen.getAllByTestId('env-instance-group');
      expect(envGroups).toHaveLength(3);
      
      // Verifica os nomes dos ambientes
      const envNames = screen.getAllByTestId('env-name');
      expect(envNames[0]).toHaveTextContent('Produção');
      expect(envNames[1]).toHaveTextContent('Homologação');
      expect(envNames[2]).toHaveTextContent('Desenvolvimento');
      
      // Verifica as contagens de instâncias
      const counts = screen.getAllByTestId('instance-count');
      expect(counts[0]).toHaveTextContent('2'); // Produção tem 2 instâncias
      expect(counts[1]).toHaveTextContent('1'); // Homologação tem 1 instância
      expect(counts[2]).toHaveTextContent('1'); // Desenvolvimento tem 1 instância
      
      // Verifica os hostnames das instâncias
      const hostnames = screen.getAllByTestId('instance-hostname');
      expect(hostnames).toHaveLength(4);
      expect(hostnames[0]).toHaveTextContent('api-gateway-prod-01');
      expect(hostnames[1]).toHaveTextContent('api-gateway-prod-02');
      expect(hostnames[2]).toHaveTextContent('api-gateway-hom');
      expect(hostnames[3]).toHaveTextContent('api-gateway-dev');
    });
  });
  
  describe('InstanceDetailCard - Cartão detalhado de instância', () => {
    test('Renderiza detalhes completos da instância', () => {
      const testInstance = testInstances[0]; // api-gateway-prod-01
      render(<InstanceDetailCard instance={testInstance} />);
      
      // Verifica o hostname
      expect(screen.getByTestId('instance-detail-hostname')).toHaveTextContent('api-gateway-prod-01');
      
      // Verifica o ambiente
      expect(screen.getByTestId('instance-detail-env')).toHaveTextContent('Produção');
      
      // Verifica que as especificações são exibidas
      const specsElement = screen.getByTestId('instance-detail-specs');
      expect(specsElement).toHaveTextContent('cpu');
      expect(specsElement).toHaveTextContent('4');
      expect(specsElement).toHaveTextContent('memory');
      expect(specsElement).toHaveTextContent('8Gi');
      expect(specsElement).toHaveTextContent('version');
      expect(specsElement).toHaveTextContent('1.2.3');
    });
    
    test('Lida corretamente com instância sem hostname', () => {
      const testInstanceNoHostname: ComponentInstanceType = {
        id: '201',
        environment: testEnvironments[0],
        specs: { cpu: '4', memory: '8Gi' }
      };
      
      render(<InstanceDetailCard instance={testInstanceNoHostname} />);
      
      // Verifica o texto de fallback para hostname
      expect(screen.getByTestId('instance-detail-hostname')).toHaveTextContent('Sem hostname');
    });
    
    test('Lida corretamente com instância sem specs', () => {
      const testInstanceNoSpecs: ComponentInstanceType = {
        id: '202',
        hostname: 'test-instance',
        environment: testEnvironments[0]
      };
      
      render(<InstanceDetailCard instance={testInstanceNoSpecs} />);
      
      // Verifica o texto de fallback para specs
      expect(screen.getByTestId('instance-detail-specs')).toHaveTextContent('Sem especificações técnicas');
    });
  });
}); 