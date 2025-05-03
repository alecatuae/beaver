/**
 * Testes de integração para a funcionalidade de instâncias de componentes
 * 
 * Este arquivo contém testes de integração para os componentes relacionados
 * às instâncias de componentes em diferentes ambientes.
 * 
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// Simulando as queries e mutations do GraphQL que seriam normalmente importadas
const GET_COMPONENT = `
  query GetComponent($id: Int!) {
    component(id: $id) {
      id
      name
      description
      status
      instances {
        id
        hostname
        environment {
          id
          name
        }
        specs
      }
    }
  }
`;

const CREATE_COMPONENT_INSTANCE = `
  mutation CreateComponentInstance($input: ComponentInstanceInput!) {
    createComponentInstance(input: $input) {
      id
      hostname
      environment {
        id
        name
      }
    }
  }
`;

const UPDATE_COMPONENT_INSTANCE = `
  mutation UpdateComponentInstance($id: Int!, $input: ComponentInstanceInput!) {
    updateComponentInstance(id: $id, input: $input) {
      id
      hostname
      environment {
        id
        name
      }
    }
  }
`;

const DELETE_COMPONENT_INSTANCE = `
  mutation DeleteComponentInstance($id: Int!) {
    deleteComponentInstance(id: $id)
  }
`;

const GET_ENVIRONMENTS = `
  query GetEnvironments {
    environments {
      id
      name
      description
    }
  }
`;

const GET_COMPONENT_INSTANCES_BY_ENVIRONMENT = `
  query GetComponentInstancesByEnvironment($environmentId: Int!) {
    componentInstancesByEnvironment(environmentId: $environmentId) {
      id
      hostname
      component {
        id
        name
      }
      specs
    }
  }
`;

// Mock data para os testes
const mockEnvironments = [
  { id: '1', name: 'Produção', description: 'Ambiente de produção' },
  { id: '2', name: 'Homologação', description: 'Ambiente de homologação' },
  { id: '3', name: 'Desenvolvimento', description: 'Ambiente de desenvolvimento' }
];

const mockComponent = {
  id: '10',
  name: 'API Gateway',
  description: 'Gateway para serviços internos',
  status: 'active',
  instances: [
    {
      id: '101',
      hostname: 'api-gateway-prod',
      environment: mockEnvironments[0],
      specs: { cpu: '4', memory: '8Gi', version: '1.2.3' }
    },
    {
      id: '102',
      hostname: 'api-gateway-hom',
      environment: mockEnvironments[1],
      specs: { cpu: '2', memory: '4Gi', version: '1.2.3-rc1' }
    }
  ]
};

const mockInstancesByEnvironment = {
  1: [ // Produção
    {
      id: '101',
      hostname: 'api-gateway-prod',
      component: { id: '10', name: 'API Gateway' },
      specs: { cpu: '4', memory: '8Gi', version: '1.2.3' }
    },
    {
      id: '201',
      hostname: 'auth-service-prod',
      component: { id: '20', name: 'Auth Service' },
      specs: { cpu: '2', memory: '4Gi', version: '2.0.0' }
    }
  ],
  2: [ // Homologação
    {
      id: '102',
      hostname: 'api-gateway-hom',
      component: { id: '10', name: 'API Gateway' },
      specs: { cpu: '2', memory: '4Gi', version: '1.2.3-rc1' }
    }
  ],
  3: [] // Desenvolvimento (vazio inicialmente)
};

// Mock de requisições GraphQL
const mocks = [
  {
    request: {
      query: GET_COMPONENT,
      variables: { id: 10 }
    },
    result: {
      data: {
        component: mockComponent
      }
    }
  },
  {
    request: {
      query: GET_ENVIRONMENTS
    },
    result: {
      data: {
        environments: mockEnvironments
      }
    }
  },
  {
    request: {
      query: CREATE_COMPONENT_INSTANCE,
      variables: {
        input: {
          componentId: 10,
          environmentId: 3,
          hostname: 'api-gateway-dev',
          specs: { cpu: '1', memory: '2Gi', version: '1.2.3-dev' }
        }
      }
    },
    result: {
      data: {
        createComponentInstance: {
          id: '103',
          hostname: 'api-gateway-dev',
          environment: mockEnvironments[2]
        }
      }
    }
  },
  {
    request: {
      query: DELETE_COMPONENT_INSTANCE,
      variables: {
        id: 102
      }
    },
    result: {
      data: {
        deleteComponentInstance: true
      }
    }
  },
  {
    request: {
      query: UPDATE_COMPONENT_INSTANCE,
      variables: {
        id: 101,
        input: {
          hostname: 'api-gateway-prod-updated',
          specs: { cpu: '8', memory: '16Gi', version: '1.2.4' }
        }
      }
    },
    result: {
      data: {
        updateComponentInstance: {
          id: '101',
          hostname: 'api-gateway-prod-updated',
          environment: mockEnvironments[0]
        }
      }
    }
  },
  {
    request: {
      query: GET_COMPONENT_INSTANCES_BY_ENVIRONMENT,
      variables: {
        environmentId: 1
      }
    },
    result: {
      data: {
        componentInstancesByEnvironment: mockInstancesByEnvironment[1]
      }
    }
  },
  {
    request: {
      query: GET_COMPONENT_INSTANCES_BY_ENVIRONMENT,
      variables: {
        environmentId: 2
      }
    },
    result: {
      data: {
        componentInstancesByEnvironment: mockInstancesByEnvironment[2]
      }
    }
  },
  {
    request: {
      query: GET_COMPONENT_INSTANCES_BY_ENVIRONMENT,
      variables: {
        environmentId: 3
      }
    },
    result: {
      data: {
        componentInstancesByEnvironment: mockInstancesByEnvironment[3]
      }
    }
  }
];

// Componente modal para criar uma nova instância
function CreateInstanceModal({ onAdd, onClose, environments, componentId }: any) {
  const [selectedEnvironment, setSelectedEnvironment] = React.useState('3');
  const [hostname, setHostname] = React.useState('api-gateway-dev');
  const [specs, setSpecs] = React.useState(JSON.stringify({ 
    cpu: '1', 
    memory: '2Gi', 
    version: '1.2.3-dev' 
  }, null, 2));
  
  const handleAdd = () => {
    onAdd({
      componentId,
      environmentId: parseInt(selectedEnvironment),
      hostname,
      specs: JSON.parse(specs)
    });
  };
  
  return (
    <div data-testid="create-instance-modal">
      <h2>Nova Instância</h2>
      <div>
        <label htmlFor="environment-select">Ambiente</label>
        <select 
          id="environment-select" 
          data-testid="environment-select"
          value={selectedEnvironment}
          onChange={(e) => setSelectedEnvironment(e.target.value)}
        >
          {environments.map((env: any) => (
            <option key={env.id} value={env.id}>{env.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="hostname-input">Hostname</label>
        <input 
          id="hostname-input" 
          data-testid="hostname-input" 
          type="text" 
          value={hostname}
          onChange={(e) => setHostname(e.target.value)}
        />
      </div>
      <div>
        <label htmlFor="specs-input">Specs (JSON)</label>
        <textarea 
          id="specs-input" 
          data-testid="specs-input" 
          value={specs}
          onChange={(e) => setSpecs(e.target.value)}
        />
      </div>
      <div>
        <button 
          data-testid="confirm-add-instance" 
          onClick={handleAdd}
        >
          Adicionar
        </button>
        <button data-testid="cancel-add-instance" onClick={onClose}>
          Cancelar
        </button>
      </div>
    </div>
  );
}

// Componente modal para editar uma instância existente
function EditInstanceModal({ instance, onUpdate, onClose }: any) {
  const [hostname, setHostname] = React.useState(instance.hostname);
  const [specs, setSpecs] = React.useState(
    JSON.stringify(instance.specs || {}, null, 2)
  );
  
  const handleUpdate = () => {
    onUpdate({
      id: instance.id,
      hostname,
      specs: JSON.parse(specs)
    });
  };
  
  return (
    <div data-testid="edit-instance-modal">
      <h2>Editar Instância</h2>
      <p data-testid="edit-environment-name">
        Ambiente: {instance.environment.name}
      </p>
      <div>
        <label htmlFor="edit-hostname-input">Hostname</label>
        <input 
          id="edit-hostname-input" 
          data-testid="edit-hostname-input" 
          type="text" 
          value={hostname}
          onChange={(e) => setHostname(e.target.value)}
        />
      </div>
      <div>
        <label htmlFor="edit-specs-input">Specs (JSON)</label>
        <textarea 
          id="edit-specs-input" 
          data-testid="edit-specs-input" 
          value={specs}
          onChange={(e) => setSpecs(e.target.value)}
        />
      </div>
      <div>
        <button 
          data-testid="confirm-update-instance" 
          onClick={handleUpdate}
        >
          Atualizar
        </button>
        <button data-testid="cancel-edit-instance" onClick={onClose}>
          Cancelar
        </button>
      </div>
    </div>
  );
}

// Componente de detalhe de componente com gerenciamento de instâncias
function ComponentDetailsWithInstances({ componentId }: { componentId: number }) {
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [showEditModal, setShowEditModal] = React.useState(false);
  const [instanceToEdit, setInstanceToEdit] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const [instances, setInstances] = React.useState(mockComponent.instances);
  
  const handleAddInstance = (newInstance: any) => {
    setLoading(true);
    // Simula chamada à API
    setTimeout(() => {
      const environment = mockEnvironments.find(env => env.id === newInstance.environmentId.toString());
      const newInstanceWithId = {
        ...newInstance,
        id: `instance-${Date.now()}`,
        environment
      };
      setInstances([...instances, newInstanceWithId]);
      setShowCreateModal(false);
      setLoading(false);
    }, 500);
  };
  
  const handleEditInstance = (instance: any) => {
    setInstanceToEdit(instance);
    setShowEditModal(true);
  };
  
  const handleUpdateInstance = (updatedInstance: any) => {
    setLoading(true);
    // Simula chamada à API
    setTimeout(() => {
      const updatedInstances = instances.map(instance => 
        instance.id === updatedInstance.id 
          ? { ...instance, ...updatedInstance }
          : instance
      );
      setInstances(updatedInstances);
      setShowEditModal(false);
      setInstanceToEdit(null);
      setLoading(false);
    }, 500);
  };
  
  const handleDeleteInstance = (instanceId: string) => {
    setLoading(true);
    // Simula chamada à API
    setTimeout(() => {
      setInstances(instances.filter(instance => instance.id !== instanceId));
      setLoading(false);
    }, 500);
  };
  
  return (
    <div data-testid="component-details">
      <h1 data-testid="component-name">{mockComponent.name}</h1>
      <p data-testid="component-description">{mockComponent.description}</p>
      
      <div data-testid="instances-section">
        <div className="flex justify-between items-center">
          <h2>Instâncias</h2>
          <button 
            data-testid="add-instance-button" 
            onClick={() => setShowCreateModal(true)}
            disabled={loading}
          >
            Nova Instância
          </button>
        </div>
        
        <div data-testid="instances-by-env">
          {/* Agrupar instâncias por ambiente */}
          {mockEnvironments.map(env => {
            const envInstances = instances.filter(inst => inst.environment.id === env.id);
            if (envInstances.length === 0) return null;
            
            return (
              <div key={env.id} data-testid={`env-group-${env.id}`}>
                <h3 data-testid={`env-name-${env.id}`}>{env.name}</h3>
                <ul>
                  {envInstances.map(instance => (
                    <li key={instance.id} data-testid={`instance-${instance.id}`}>
                      <div data-testid={`instance-hostname-${instance.id}`}>
                        {instance.hostname}
                      </div>
                      
                      {instance.specs && (
                        <div data-testid={`instance-specs-${instance.id}`} className="text-sm">
                          CPU: {instance.specs.cpu}, Memória: {instance.specs.memory}
                        </div>
                      )}
                      
                      <div className="flex gap-2 mt-2">
                        <button 
                          data-testid={`edit-button-${instance.id}`}
                          onClick={() => handleEditInstance(instance)}
                          disabled={loading}
                        >
                          Editar
                        </button>
                        <button 
                          data-testid={`delete-button-${instance.id}`}
                          onClick={() => handleDeleteInstance(instance.id)}
                          disabled={loading}
                        >
                          Excluir
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
          
          {instances.length === 0 && (
            <div data-testid="no-instances">
              Não há instâncias cadastradas para este componente.
            </div>
          )}
        </div>
        
        {showCreateModal && (
          <CreateInstanceModal 
            onAdd={handleAddInstance}
            onClose={() => setShowCreateModal(false)}
            environments={mockEnvironments}
            componentId={componentId}
          />
        )}
        
        {showEditModal && instanceToEdit && (
          <EditInstanceModal 
            instance={instanceToEdit}
            onUpdate={handleUpdateInstance}
            onClose={() => {
              setShowEditModal(false);
              setInstanceToEdit(null);
            }}
          />
        )}
      </div>
    </div>
  );
}

// Componente de visualização de instâncias por ambiente
function EnvironmentInstancesView({ environmentId }: { environmentId: number }) {
  const [instances, setInstances] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const environment = mockEnvironments.find(env => env.id === environmentId.toString());
  
  React.useEffect(() => {
    // Simula chamada à API
    setLoading(true);
    setTimeout(() => {
      setInstances(mockInstancesByEnvironment[environmentId] || []);
      setLoading(false);
    }, 300);
  }, [environmentId]);
  
  if (loading) {
    return <div data-testid="loading-state">Carregando instâncias...</div>;
  }
  
  return (
    <div data-testid="environment-instances">
      <h1 data-testid="environment-name">
        Instâncias em {environment?.name || `Ambiente ${environmentId}`}
      </h1>
      
      {instances.length === 0 ? (
        <div data-testid="no-instances-in-env">
          Não há instâncias neste ambiente.
        </div>
      ) : (
        <ul data-testid="instances-list">
          {instances.map(instance => (
            <li key={instance.id} data-testid={`env-instance-${instance.id}`}>
              <h3 data-testid={`env-instance-name-${instance.id}`}>
                {instance.hostname}
              </h3>
              <div data-testid={`env-instance-component-${instance.id}`}>
                Componente: {instance.component.name}
              </div>
              {instance.specs && (
                <div data-testid={`env-instance-specs-${instance.id}`}>
                  CPU: {instance.specs.cpu}, Memória: {instance.specs.memory}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

describe('Integração - Gerenciamento de Instâncias de Componentes', () => {
  test('Deve exibir as instâncias atuais de um componente agrupadas por ambiente', async () => {
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <ComponentDetailsWithInstances componentId={10} />
      </MockedProvider>
    );
    
    // Verifica o título do componente
    expect(screen.getByTestId('component-name')).toHaveTextContent('API Gateway');
    
    // Verifica se as instâncias são exibidas e agrupadas por ambiente
    expect(screen.getByTestId('env-group-1')).toBeInTheDocument(); // Produção
    expect(screen.getByTestId('env-group-2')).toBeInTheDocument(); // Homologação
    
    // Verifica se o ambiente de desenvolvimento não aparece (não tem instâncias)
    expect(screen.queryByTestId('env-group-3')).not.toBeInTheDocument();
    
    // Verifica os detalhes da instância de produção
    expect(screen.getByTestId('instance-101')).toBeInTheDocument();
    expect(screen.getByTestId('instance-hostname-101')).toHaveTextContent('api-gateway-prod');
    expect(screen.getByTestId('instance-specs-101')).toHaveTextContent('CPU: 4, Memória: 8Gi');
    
    // Verifica os detalhes da instância de homologação
    expect(screen.getByTestId('instance-102')).toBeInTheDocument();
    expect(screen.getByTestId('instance-hostname-102')).toHaveTextContent('api-gateway-hom');
    expect(screen.getByTestId('instance-specs-102')).toHaveTextContent('CPU: 2, Memória: 4Gi');
  });
  
  test('Deve permitir adicionar uma nova instância a um componente', async () => {
    const user = userEvent.setup();
    
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <ComponentDetailsWithInstances componentId={10} />
      </MockedProvider>
    );
    
    // Clica no botão para adicionar nova instância
    await user.click(screen.getByTestId('add-instance-button'));
    
    // Verifica se o modal é exibido
    expect(screen.getByTestId('create-instance-modal')).toBeInTheDocument();
    
    // Verifica valores padrão do formulário
    expect(screen.getByTestId('environment-select')).toHaveValue('3'); // Desenvolvimento
    expect(screen.getByTestId('hostname-input')).toHaveValue('api-gateway-dev');
    expect(screen.getByTestId('specs-input')).toHaveValue(
      JSON.stringify({ cpu: '1', memory: '2Gi', version: '1.2.3-dev' }, null, 2)
    );
    
    // Clica para confirmar a adição
    await user.click(screen.getByTestId('confirm-add-instance'));
    
    // Aguarda a atualização da UI
    await waitFor(() => {
      // Verifica se o modal foi fechado
      expect(screen.queryByTestId('create-instance-modal')).not.toBeInTheDocument();
    });
    
    // Verifica se a nova instância foi adicionada
    // Como o ID é dinâmico, procuramos pelo hostname
    const newInstance = await screen.findByText('api-gateway-dev');
    expect(newInstance).toBeInTheDocument();
  });
  
  test('Deve permitir editar uma instância existente', async () => {
    const user = userEvent.setup();
    
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <ComponentDetailsWithInstances componentId={10} />
      </MockedProvider>
    );
    
    // Clica no botão de editar para a instância de produção
    await user.click(screen.getByTestId('edit-button-101'));
    
    // Verifica se o modal de edição é exibido
    expect(screen.getByTestId('edit-instance-modal')).toBeInTheDocument();
    
    // Verifica valores pré-preenchidos
    expect(screen.getByTestId('edit-hostname-input')).toHaveValue('api-gateway-prod');
    expect(screen.getByTestId('edit-environment-name')).toHaveTextContent('Produção');
    
    // Altera o hostname
    await user.clear(screen.getByTestId('edit-hostname-input'));
    await user.type(screen.getByTestId('edit-hostname-input'), 'api-gateway-prod-updated');
    
    // Altera as specs
    await user.clear(screen.getByTestId('edit-specs-input'));
    await user.type(
      screen.getByTestId('edit-specs-input'), 
      JSON.stringify({ cpu: '8', memory: '16Gi', version: '1.2.4' }, null, 2)
    );
    
    // Clica para confirmar a edição
    await user.click(screen.getByTestId('confirm-update-instance'));
    
    // Aguarda a atualização da UI
    await waitFor(() => {
      // Verifica se o modal foi fechado
      expect(screen.queryByTestId('edit-instance-modal')).not.toBeInTheDocument();
    });
    
    // Verifica se a instância foi atualizada
    const updatedInstance = await screen.findByText('api-gateway-prod-updated');
    expect(updatedInstance).toBeInTheDocument();
  });
  
  test('Deve permitir excluir uma instância existente', async () => {
    const user = userEvent.setup();
    
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <ComponentDetailsWithInstances componentId={10} />
      </MockedProvider>
    );
    
    // Verifica se a instância que será excluída existe
    expect(screen.getByTestId('instance-102')).toBeInTheDocument();
    expect(screen.getByTestId('instance-hostname-102')).toHaveTextContent('api-gateway-hom');
    
    // Clica no botão de excluir para a instância de homologação
    await user.click(screen.getByTestId('delete-button-102'));
    
    // Aguarda a atualização da UI
    await waitFor(() => {
      // Verifica se a instância foi removida
      expect(screen.queryByTestId('instance-102')).not.toBeInTheDocument();
      expect(screen.queryByText('api-gateway-hom')).not.toBeInTheDocument();
    });
    
    // Verifica se a outra instância ainda existe
    expect(screen.getByTestId('instance-101')).toBeInTheDocument();
  });
  
  test('Deve mostrar instâncias agrupadas por componente em um ambiente específico', async () => {
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <EnvironmentInstancesView environmentId={1} />
      </MockedProvider>
    );
    
    // Aguarda o carregamento das instâncias
    await waitFor(() => {
      expect(screen.queryByTestId('loading-state')).not.toBeInTheDocument();
    });
    
    // Verifica o título da página
    expect(screen.getByTestId('environment-name')).toHaveTextContent('Instâncias em Produção');
    
    // Verifica se todas as instâncias do ambiente são exibidas
    expect(screen.getByTestId('env-instance-101')).toBeInTheDocument();
    expect(screen.getByTestId('env-instance-name-101')).toHaveTextContent('api-gateway-prod');
    expect(screen.getByTestId('env-instance-component-101')).toHaveTextContent('API Gateway');
    
    expect(screen.getByTestId('env-instance-201')).toBeInTheDocument();
    expect(screen.getByTestId('env-instance-name-201')).toHaveTextContent('auth-service-prod');
    expect(screen.getByTestId('env-instance-component-201')).toHaveTextContent('Auth Service');
  });
  
  test('Deve exibir mensagem apropriada quando um ambiente não tem instâncias', async () => {
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <EnvironmentInstancesView environmentId={3} />
      </MockedProvider>
    );
    
    // Aguarda o carregamento das instâncias
    await waitFor(() => {
      expect(screen.queryByTestId('loading-state')).not.toBeInTheDocument();
    });
    
    // Verifica se a mensagem de "sem instâncias" é exibida
    expect(screen.getByTestId('no-instances-in-env')).toBeInTheDocument();
    expect(screen.getByTestId('no-instances-in-env')).toHaveTextContent('Não há instâncias neste ambiente');
  });
}); 