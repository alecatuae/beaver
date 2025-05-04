# Exemplo: Consultas GraphQL Otimizadas

Este exemplo demonstra como implementar consultas GraphQL otimizadas utilizando fragmentos modulares e diretivas condicionais, reduzindo significativamente o problema de over-fetching.

## Cenário

Uma página de detalhes de componente que precisa carregar diferentes níveis de informação com base na visualização e permissões do usuário.

## Código Completo

```tsx
// src/app/examples/graphql-optimization/page.tsx

'use client';

import { useState } from 'react';
import { gql } from '@apollo/client';
import { useOptimizedQuery } from '@/lib/hooks/use-optimized-query';
import { LoadingContainer } from '@/components/ui/loading-container';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { EnvironmentSelector } from '@/components/selectors/EnvironmentSelector';
import { TeamSelector } from '@/components/selectors/TeamSelector';

// Definições de fragmentos
const COMPONENT_CORE_FIELDS = gql`
  fragment ComponentCoreFields on Component {
    id
    name
    description
    status
    createdAt
  }
`;

const COMPONENT_TEAM_FIELDS = gql`
  fragment ComponentTeamFields on Component {
    team {
      id
      name
      description
    }
  }
`;

const COMPONENT_INSTANCES_FIELDS = gql`
  fragment ComponentInstancesFields on Component {
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
`;

const COMPONENT_RELATED_ITEMS_FIELDS = gql`
  fragment ComponentRelatedItemsFields on Component {
    adrs {
      id
      title
      status
    }
    roadmapItems {
      id
      title
      status
      dueDate
    }
  }
`;

// Consulta otimizada com diretivas condicionais
const GET_COMPONENT = gql`
  query GetComponent(
    $id: ID!,
    $includeTeam: Boolean = false,
    $includeInstances: Boolean = false,
    $includeRelatedItems: Boolean = false,
    $filterEnvironmentId: ID
  ) {
    component(id: $id) {
      ...ComponentCoreFields
      ...ComponentTeamFields @include(if: $includeTeam)
      instances @include(if: $includeInstances) {
        id
        hostname
        environment {
          id
          name
        }
        specs
        # Filtro condicional no lado do cliente usando @include
        _filter @include(if: $filterEnvironmentId)
      }
      ...ComponentRelatedItemsFields @include(if: $includeRelatedItems)
    }
  }
  ${COMPONENT_CORE_FIELDS}
  ${COMPONENT_TEAM_FIELDS}
  ${COMPONENT_INSTANCES_FIELDS}
  ${COMPONENT_RELATED_ITEMS_FIELDS}
`;

// Componente de página
export default function GraphQLOptimizationExample() {
  // ID de exemplo do componente a ser carregado
  const componentId = '1';
  
  // Estados para controlar quais dados incluir
  const [includeTeam, setIncludeTeam] = useState(false);
  const [includeInstances, setIncludeInstances] = useState(false);
  const [includeRelatedItems, setIncludeRelatedItems] = useState(false);
  const [selectedEnvironmentId, setSelectedEnvironmentId] = useState(null);
  
  // Usar o hook de consulta otimizada
  const { data, loading, error, refetch } = useOptimizedQuery(
    GET_COMPONENT,
    {
      include: {
        includeTeam,
        includeInstances,
        includeRelatedItems
      }
    },
    {
      variables: {
        id: componentId,
        filterEnvironmentId: selectedEnvironmentId,
      },
      notifyOnNetworkStatusChange: true
    }
  );
  
  // Filtrar instâncias pelo ambiente no lado do cliente
  const filteredInstances = selectedEnvironmentId && data?.component?.instances
    ? data.component.instances.filter(
        instance => instance.environment.id === selectedEnvironmentId
      )
    : data?.component?.instances;
  
  // Função para resetar todas as opções
  const handleReset = () => {
    setIncludeTeam(false);
    setIncludeInstances(false);
    setIncludeRelatedItems(false);
    setSelectedEnvironmentId(null);
    refetch();
  };
  
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">
        Exemplo de Consulta GraphQL Otimizada
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Opções de Carregamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <label htmlFor="include-team" className="text-sm font-medium">
                Incluir Dados do Time
              </label>
              <Switch
                id="include-team"
                checked={includeTeam}
                onCheckedChange={setIncludeTeam}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <label htmlFor="include-instances" className="text-sm font-medium">
                Incluir Instâncias
              </label>
              <Switch
                id="include-instances"
                checked={includeInstances}
                onCheckedChange={setIncludeInstances}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <label htmlFor="include-related" className="text-sm font-medium">
                Incluir Itens Relacionados
              </label>
              <Switch
                id="include-related"
                checked={includeRelatedItems}
                onCheckedChange={setIncludeRelatedItems}
              />
            </div>
            
            {includeInstances && (
              <div className="pt-2">
                <label className="text-sm font-medium block mb-2">
                  Filtrar por Ambiente
                </label>
                <EnvironmentSelector
                  value={selectedEnvironmentId || ''}
                  onChange={setSelectedEnvironmentId}
                  placeholder="Todos os ambientes"
                />
              </div>
            )}
            
            <Button 
              variant="outline" 
              onClick={handleReset}
              className="w-full mt-2"
            >
              Resetar Opções
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Métricas da Consulta</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Status:</span>
                <span>{loading ? 'Carregando...' : 'Pronto'}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-500">Campos Carregados:</span>
                <span>
                  {[
                    'Dados Básicos',
                    includeTeam && 'Time',
                    includeInstances && 'Instâncias',
                    includeRelatedItems && 'Itens Relacionados'
                  ].filter(Boolean).join(', ')}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-500">Tamanho do Payload:</span>
                <span>
                  ~{calculatePayloadSize(
                    includeTeam,
                    includeInstances,
                    includeRelatedItems
                  )} KB
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-500">Redução de Tamanho:</span>
                <span>
                  {calculateReduction(
                    includeTeam,
                    includeInstances,
                    includeRelatedItems
                  )}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <LoadingContainer loading={loading} message="Carregando componente...">
        {error ? (
          <div className="p-4 bg-red-50 text-red-800 rounded">
            Erro ao carregar dados: {error.message}
          </div>
        ) : data?.component ? (
          <ComponentDetails
            component={data.component}
            instances={filteredInstances}
            includeTeam={includeTeam}
            includeInstances={includeInstances}
            includeRelatedItems={includeRelatedItems}
          />
        ) : (
          <div className="p-4 bg-yellow-50 text-yellow-800 rounded">
            Componente não encontrado
          </div>
        )}
      </LoadingContainer>
    </div>
  );
}

// Componente para exibir os detalhes
function ComponentDetails({
  component,
  instances,
  includeTeam,
  includeInstances,
  includeRelatedItems
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>{component.name}</CardTitle>
          <span className={`px-3 py-1 rounded-full text-xs ${
            component.status === 'active' ? 'bg-green-100 text-green-800' :
            component.status === 'deprecated' ? 'bg-red-100 text-red-800' :
            'bg-yellow-100 text-yellow-800'
          }`}>
            {component.status}
          </span>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-lg font-medium mb-2">Descrição</h3>
          <p className="text-gray-700">{component.description || 'Sem descrição'}</p>
        </div>
        
        {includeTeam && component.team && (
          <div>
            <h3 className="text-lg font-medium mb-2">Time Responsável</h3>
            <div className="bg-gray-50 p-3 rounded">
              <p className="font-medium">{component.team.name}</p>
              <p className="text-sm text-gray-600">
                {component.team.description || 'Sem descrição'}
              </p>
            </div>
          </div>
        )}
        
        {includeInstances && instances && (
          <div>
            <h3 className="text-lg font-medium mb-2">
              Instâncias ({instances.length})
            </h3>
            
            {instances.length === 0 ? (
              <p className="text-gray-500 italic">Nenhuma instância encontrada</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {instances.map(instance => (
                  <div 
                    key={instance.id}
                    className="border rounded p-3"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">{instance.hostname}</span>
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                        {instance.environment.name}
                      </span>
                    </div>
                    
                    <div className="text-xs text-gray-500">
                      {Object.entries(instance.specs || {}).map(([key, value]) => (
                        <div key={key} className="flex justify-between mb-1">
                          <span>{key}:</span>
                          <span>{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {includeRelatedItems && (
          <div>
            <h3 className="text-lg font-medium mb-2">Itens Relacionados</h3>
            
            <Tabs defaultValue="adrs">
              <TabsList className="mb-2">
                <TabsTrigger value="adrs">
                  ADRs ({component.adrs?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="roadmap">
                  Roadmap ({component.roadmapItems?.length || 0})
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="adrs">
                {!component.adrs || component.adrs.length === 0 ? (
                  <p className="text-gray-500 italic">Nenhum ADR encontrado</p>
                ) : (
                  <div className="space-y-2">
                    {component.adrs.map(adr => (
                      <div 
                        key={adr.id}
                        className="border-l-4 border-purple-500 pl-3 py-1"
                      >
                        <p className="font-medium">{adr.title}</p>
                        <p className="text-xs text-gray-500">{adr.status}</p>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="roadmap">
                {!component.roadmapItems || component.roadmapItems.length === 0 ? (
                  <p className="text-gray-500 italic">Nenhum item de roadmap encontrado</p>
                ) : (
                  <div className="space-y-2">
                    {component.roadmapItems.map(item => (
                      <div 
                        key={item.id}
                        className="border-l-4 border-blue-500 pl-3 py-1"
                      >
                        <p className="font-medium">{item.title}</p>
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>{item.status}</span>
                          <span>
                            {item.dueDate 
                              ? new Date(item.dueDate).toLocaleDateString() 
                              : 'Sem data'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}
        
        <div className="text-xs text-gray-400">
          Criado em: {new Date(component.createdAt).toLocaleString()}
        </div>
      </CardContent>
    </Card>
  );
}

// Funções auxiliares para cálculos de métricas
function calculatePayloadSize(includeTeam, includeInstances, includeRelatedItems) {
  // Valores aproximados em KB
  let size = 1; // Dados básicos
  if (includeTeam) size += 0.5;
  if (includeInstances) size += 2.5;
  if (includeRelatedItems) size += 3;
  return size;
}

function calculateReduction(includeTeam, includeInstances, includeRelatedItems) {
  const totalSize = 7; // Tamanho aproximado se todos os dados fossem carregados
  const currentSize = calculatePayloadSize(includeTeam, includeInstances, includeRelatedItems);
  return Math.round(((totalSize - currentSize) / totalSize) * 100);
} 