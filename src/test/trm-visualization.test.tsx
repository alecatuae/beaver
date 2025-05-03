/**
 * Testes unitários para a visualização de TRM (Technical Reference Model)
 * 
 * Este arquivo contém testes para a funcionalidade de visualização do TRM
 * com estrutura hierárquica de camadas e categorias.
 * 
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock dos componentes UI
jest.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children }: any) => <div data-testid="tabs">{children}</div>,
  TabsList: ({ children }: any) => <div data-testid="tabs-list">{children}</div>,
  TabsTrigger: ({ value, children, onClick }: any) => (
    <button data-testid={`tab-${value}`} onClick={onClick}>{children}</button>
  ),
  TabsContent: ({ value, children }: any) => (
    <div data-testid={`content-${value}`}>{children}</div>
  ),
}));

// Estrutura de dados de TRM
interface TRMCategory {
  id: string;
  name: string;
  description?: string;
  parentId?: string | null;
  children?: TRMCategory[];
  components?: TRMComponent[];
}

interface TRMLayer {
  id: string;
  name: string;
  description?: string;
  order: number;
  categories: TRMCategory[];
}

interface TRMComponent {
  id: string;
  name: string;
  description?: string;
  status: string;
  categoryId: string;
}

// Componente de visualização hierárquica do TRM
function TRMHierarchyView({ layers, activeLayerId, onLayerChange }: {
  layers: TRMLayer[];
  activeLayerId: string;
  onLayerChange: (layerId: string) => void;
}) {
  const activeLayer = layers.find(layer => layer.id === activeLayerId);
  
  // Função recursiva para renderizar categorias e subcategorias
  const renderCategories = (categories: TRMCategory[], level = 0) => {
    if (!categories || categories.length === 0) {
      return <div data-testid="empty-categories">Nenhuma categoria encontrada</div>;
    }
    
    return (
      <ul data-testid="category-list" className="pl-4">
        {categories.map(category => (
          <li key={category.id} data-testid={`category-${category.id}`} className="my-2">
            <div 
              data-testid={`category-name-${category.id}`}
              className="font-medium"
              style={{ paddingLeft: `${level * 16}px` }}
            >
              {category.name}
              {category.components && category.components.length > 0 && (
                <span data-testid={`component-count-${category.id}`} className="ml-2 text-sm text-muted-foreground">
                  ({category.components.length})
                </span>
              )}
            </div>
            
            {/* Renderizar componentes da categoria */}
            {category.components && category.components.length > 0 && (
              <ul data-testid={`component-list-${category.id}`} className="pl-8 mt-1">
                {category.components.map(component => (
                  <li key={component.id} data-testid={`component-${component.id}`} className="text-sm">
                    {component.name}
                  </li>
                ))}
              </ul>
            )}
            
            {/* Renderizar subcategorias recursivamente */}
            {category.children && category.children.length > 0 && (
              renderCategories(category.children, level + 1)
            )}
          </li>
        ))}
      </ul>
    );
  };
  
  return (
    <div data-testid="trm-hierarchy-view">
      {/* Seletor de camadas */}
      <div data-testid="layer-selector" className="flex space-x-2 mb-4">
        {layers.map(layer => (
          <button
            key={layer.id}
            data-testid={`layer-button-${layer.id}`}
            className={`px-3 py-1 rounded ${activeLayerId === layer.id ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
            onClick={() => onLayerChange(layer.id)}
          >
            {layer.name}
          </button>
        ))}
      </div>
      
      {/* Exibição da camada ativa */}
      <div data-testid="active-layer-content">
        <h2 data-testid="active-layer-name" className="text-xl font-bold mb-4">
          {activeLayer?.name}
        </h2>
        
        {activeLayer ? (
          renderCategories(activeLayer.categories)
        ) : (
          <div data-testid="no-layer-selected">Nenhuma camada selecionada</div>
        )}
      </div>
    </div>
  );
}

// Dados de teste
const testComponents: TRMComponent[] = [
  { id: '1', name: 'PostgreSQL', categoryId: '11', status: 'active', description: 'Banco de dados relacional' },
  { id: '2', name: 'MongoDB', categoryId: '11', status: 'active', description: 'Banco de dados NoSQL' },
  { id: '3', name: 'Redis', categoryId: '12', status: 'active', description: 'Banco de dados em memória' },
  { id: '4', name: 'RabbitMQ', categoryId: '21', status: 'active', description: 'Message broker' },
  { id: '5', name: 'Kafka', categoryId: '21', status: 'active', description: 'Plataforma de streaming' },
  { id: '6', name: 'React', categoryId: '31', status: 'active', description: 'Biblioteca frontend' },
  { id: '7', name: 'Vue.js', categoryId: '31', status: 'active', description: 'Framework frontend' },
  { id: '8', name: 'Node.js', categoryId: '41', status: 'active', description: 'Runtime JavaScript' },
  { id: '9', name: 'Spring Boot', categoryId: '41', status: 'active', description: 'Framework backend Java' }
];

// Camadas e categorias no formato hierárquico para o TRM
const testLayers: TRMLayer[] = [
  {
    id: '1',
    name: 'Persistência',
    order: 1,
    description: 'Camada de persistência de dados',
    categories: [
      {
        id: '10',
        name: 'Bancos de Dados',
        children: [
          {
            id: '11',
            name: 'Bancos Relacionais/NoSQL',
            parentId: '10',
            components: testComponents.filter(c => c.categoryId === '11')
          },
          {
            id: '12',
            name: 'Bancos em Memória',
            parentId: '10',
            components: testComponents.filter(c => c.categoryId === '12')
          }
        ]
      }
    ]
  },
  {
    id: '2',
    name: 'Integração',
    order: 2,
    description: 'Camada de integração entre sistemas',
    categories: [
      {
        id: '20',
        name: 'Mensageria',
        children: [
          {
            id: '21',
            name: 'Message Brokers',
            parentId: '20',
            components: testComponents.filter(c => c.categoryId === '21')
          }
        ]
      }
    ]
  },
  {
    id: '3',
    name: 'Frontend',
    order: 3,
    description: 'Camada de interface com usuário',
    categories: [
      {
        id: '30',
        name: 'UI',
        children: [
          {
            id: '31',
            name: 'Frameworks JS',
            parentId: '30',
            components: testComponents.filter(c => c.categoryId === '31')
          }
        ]
      }
    ]
  },
  {
    id: '4',
    name: 'Backend',
    order: 4,
    description: 'Camada de lógica de negócio',
    categories: [
      {
        id: '40',
        name: 'Serviços',
        children: [
          {
            id: '41',
            name: 'Frameworks Backend',
            parentId: '40',
            components: testComponents.filter(c => c.categoryId === '41')
          }
        ]
      }
    ]
  }
];

describe('Visualização de TRM - Testes de Funcionalidade', () => {
  test('Renderiza a visualização do TRM com camadas e a primeira camada ativa por padrão', () => {
    const handleLayerChange = jest.fn();
    
    render(
      <TRMHierarchyView 
        layers={testLayers} 
        activeLayerId="1" 
        onLayerChange={handleLayerChange} 
      />
    );
    
    // Verifica se os botões de camada são renderizados
    expect(screen.getByTestId('layer-button-1')).toBeInTheDocument();
    expect(screen.getByTestId('layer-button-2')).toBeInTheDocument();
    expect(screen.getByTestId('layer-button-3')).toBeInTheDocument();
    expect(screen.getByTestId('layer-button-4')).toBeInTheDocument();
    
    // Verifica se a primeira camada está ativa
    expect(screen.getByTestId('active-layer-name')).toHaveTextContent('Persistência');
    
    // Verifica se as categorias da primeira camada são exibidas
    expect(screen.getByTestId('category-10')).toBeInTheDocument();
    expect(screen.getByTestId('category-name-10')).toHaveTextContent('Bancos de Dados');
    
    // Verifica se as subcategorias são exibidas
    expect(screen.getByTestId('category-11')).toBeInTheDocument();
    expect(screen.getByTestId('category-name-11')).toHaveTextContent('Bancos Relacionais/NoSQL');
    
    // Verifica se os componentes são exibidos
    expect(screen.getByTestId('component-list-11')).toBeInTheDocument();
    expect(screen.getByTestId('component-1')).toHaveTextContent('PostgreSQL');
    expect(screen.getByTestId('component-2')).toHaveTextContent('MongoDB');
  });
  
  test('Muda a camada ativa quando um botão de camada é clicado', () => {
    const handleLayerChange = jest.fn();
    
    render(
      <TRMHierarchyView 
        layers={testLayers} 
        activeLayerId="1" 
        onLayerChange={handleLayerChange} 
      />
    );
    
    // Clica no botão da camada de Frontend
    fireEvent.click(screen.getByTestId('layer-button-3'));
    
    // Verifica se o callback foi chamado com o ID correto
    expect(handleLayerChange).toHaveBeenCalledWith('3');
  });
  
  test('Exibe contagem de componentes em cada categoria', () => {
    render(
      <TRMHierarchyView 
        layers={testLayers} 
        activeLayerId="1" 
        onLayerChange={jest.fn()} 
      />
    );
    
    // Verifica as contagens de componentes nas categorias
    expect(screen.getByTestId('component-count-11')).toHaveTextContent('(2)');
    expect(screen.getByTestId('component-count-12')).toHaveTextContent('(1)');
  });
  
  test('Lida corretamente com camada sem categorias', () => {
    const emptyLayer: TRMLayer[] = [
      {
        id: '99',
        name: 'Camada Vazia',
        order: 99,
        description: 'Camada sem categorias',
        categories: []
      }
    ];
    
    render(
      <TRMHierarchyView 
        layers={emptyLayer} 
        activeLayerId="99" 
        onLayerChange={jest.fn()} 
      />
    );
    
    // Verifica se a mensagem de nenhuma categoria é exibida
    expect(screen.getByTestId('empty-categories')).toBeInTheDocument();
    expect(screen.getByTestId('empty-categories')).toHaveTextContent('Nenhuma categoria encontrada');
  });
}); 