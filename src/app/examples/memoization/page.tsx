"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MemoizedTeamSelector } from '@/components/selectors/MemoizedTeamSelector';
import TeamSelector from '@/components/selectors/TeamSelector';
import { MemoizedCytoscapeGraph } from '@/components/graph/MemoizedCytoscapeGraph';

export default function MemoizationExamplePage() {
  // Estado para forçar renderizações
  const [renderCount, setRenderCount] = useState(0);
  
  // Estados para os seletores
  const [team1, setTeam1] = useState('');
  const [team2, setTeam2] = useState('');
  
  // Contadores de renderização para comparação
  const [standardRenders, setStandardRenders] = useState(0);
  const [memoizedRenders, setMemoizedRenders] = useState(0);
  
  // Dados simulados para o grafo
  const [graphData, setGraphData] = useState({
    nodes: [
      { id: '1', label: 'Componente A', type: 'component' },
      { id: '2', label: 'Componente B', type: 'component' },
      { id: '3', label: 'Componente C', type: 'component' },
      { id: '4', label: 'Instância A1', type: 'instance', componentId: 1 },
      { id: '5', label: 'Instância A2', type: 'instance', componentId: 1 },
      { id: '6', label: 'Instância B1', type: 'instance', componentId: 2 },
    ],
    edges: [
      { id: 'e1', source: '1', target: '2', label: 'Depende de' },
      { id: 'e2', source: '2', target: '3', label: 'Conecta com' },
      { id: 'e3', source: '4', target: '1', label: 'Instância de', type: 'INSTANTIATES' },
      { id: 'e4', source: '5', target: '1', label: 'Instância de', type: 'INSTANTIATES' },
      { id: 'e5', source: '6', target: '2', label: 'Instância de', type: 'INSTANTIATES' },
    ]
  });
  
  // Forçar renderização do componente pai
  const forceRender = useCallback(() => {
    setRenderCount(prev => prev + 1);
  }, []);

  // Registrar renderizações do componente padrão
  const handleStandardRender = useCallback(() => {
    setStandardRenders(prev => prev + 1);
  }, []);

  // Registrar renderizações do componente memoizado
  const handleMemoizedRender = useCallback(() => {
    setMemoizedRenders(prev => prev + 1);
  }, []);
  
  // Adicionar um contador para exibição
  useEffect(() => {
    // Este efeito é executado a cada renderização do componente pai
    const timer = setTimeout(() => {
      // Delay para garantir que os contadores de renderização tenham atualizado
    }, 100);
    
    return () => clearTimeout(timer);
  });

  // Adicionar novo nó ao grafo para testar re-renderizações
  const addRandomNode = useCallback(() => {
    const newNodeId = String(Math.floor(Math.random() * 1000) + 10);
    const componentIds = graphData.nodes
      .filter(node => node.type === 'component')
      .map(node => node.id);
    
    const randomComponentId = componentIds[Math.floor(Math.random() * componentIds.length)];
    
    setGraphData(prev => ({
      nodes: [
        ...prev.nodes,
        { 
          id: newNodeId, 
          label: `Nova Instância ${newNodeId}`, 
          type: 'instance',
          componentId: parseInt(randomComponentId)
        }
      ],
      edges: [
        ...prev.edges,
        { 
          id: `e${prev.edges.length + 1}`, 
          source: newNodeId, 
          target: randomComponentId, 
          label: 'Instância de',
          type: 'INSTANTIATES'
        }
      ]
    }));
  }, [graphData]);

  return (
    <AppLayout>
      <div className="container py-8 max-w-6xl mx-auto">
        <div className="mb-10">
          <h1 className="text-3xl font-bold mb-2">Otimização com Memoização</h1>
          <p className="text-muted-foreground mb-6">
            Demonstração da diferença de performance entre componentes padrão e componentes memoizados
          </p>
          
          <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-md mb-6">
            <p className="text-sm text-blue-800 dark:text-blue-300 mb-2">
              <strong>Renderização do componente pai:</strong> {renderCount} vezes
            </p>
            <Button onClick={forceRender} size="sm">Forçar Renderização</Button>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Componente Padrão</CardTitle>
                <CardDescription>
                  Sem otimização de memoização
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="mb-4">
                  {/* Este componente vai renderizar a cada mudança no componente pai */}
                  <TeamSelector
                    value={team1}
                    onChange={setTeam1}
                    placeholder="Selecione um time (padrão)"
                  />
                  
                  {/* Este useEffect é apenas para demonstração, na prática usaríamos uma abordagem diferente */}
                  <EffectCounter 
                    onRender={handleStandardRender} 
                    label="Renderizações do componente padrão:"
                    count={standardRenders}
                  />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Componente Memoizado</CardTitle>
                <CardDescription>
                  Com otimização de memoização
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="mb-4">
                  {/* Este componente não renderiza novamente quando o pai renderiza */}
                  <MemoizedTeamSelector
                    value={team2}
                    onChange={setTeam2}
                    placeholder="Selecione um time (memoizado)"
                  />
                  
                  {/* Este useEffect é apenas para demonstração, na prática usaríamos uma abordagem diferente */}
                  <EffectCounter 
                    onRender={handleMemoizedRender} 
                    label="Renderizações do componente memoizado:"
                    count={memoizedRenders}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        <Tabs defaultValue="graph" className="mb-10">
          <TabsList className="mb-4">
            <TabsTrigger value="graph">Visualização de Grafo</TabsTrigger>
            <TabsTrigger value="advanced">Técnicas Avançadas</TabsTrigger>
          </TabsList>
          
          <TabsContent value="graph">
            <Card>
              <CardHeader>
                <CardTitle>Visualização de Grafo Memoizada</CardTitle>
                <CardDescription>
                  Componente de grafo complexo otimizado com memoização profunda
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px] border rounded-md p-1 mb-4">
                  <MemoizedCytoscapeGraph
                    nodes={graphData.nodes}
                    edges={graphData.edges}
                    height="100%"
                    showInstances={true}
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button onClick={addRandomNode} variant="outline">
                  Adicionar Nó Aleatório
                </Button>
                <Button onClick={forceRender} variant="default">
                  Forçar Renderização do Pai
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="advanced">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Dicas de Memoização</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc pl-5 space-y-2 text-sm">
                    <li>Use <code>React.memo</code> para componentes que renderizam frequentemente com as mesmas props</li>
                    <li>Envolva funções de callback com <code>useCallback</code> para evitar recriá-las a cada renderização</li>
                    <li>Utilize <code>useMemo</code> para cálculos pesados que não precisam ser refeitos a cada renderização</li>
                    <li>Memoize apenas componentes que têm custo de renderização significativo</li>
                    <li>Considere o uso de <code>useCallback</code> para event handlers passados para componentes filhos memoizados</li>
                  </ul>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Quando não usar memoização</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc pl-5 space-y-2 text-sm">
                    <li>Em componentes simples onde o custo da comparação pode ser maior que o da re-renderização</li>
                    <li>Em componentes que mudam frequentemente suas props</li>
                    <li>Quando as props são difíceis de comparar (objetos complexos, funções, etc.)</li>
                    <li>Para otimizações prematuras - primeiro identifique gargalos reais</li>
                    <li>Para componentes que renderizam raramente</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

// Componente auxiliar para contar renderizações via useEffect
function EffectCounter({ onRender, label, count }: { 
  onRender: () => void; 
  label: string;
  count: number;
}) {
  useEffect(() => {
    onRender();
  });
  
  return (
    <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded-md">
      <p className="text-sm font-medium">{label} <span className="text-primary font-bold">{count}</span></p>
    </div>
  );
} 