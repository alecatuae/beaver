"use client";

import React, { useState } from 'react';
import { useGraphData } from '@/lib/hooks/use-graph-data';
import { CytoscapeGraph } from '@/components/graph/CytoscapeComponent';
import { EnvironmentSelector } from '@/components/selectors';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { RefreshCw, ZoomIn, ZoomOut, List, Grid3X3, NetworkIcon, CircleIcon, BoxIcon, ServerIcon, LayersIcon } from 'lucide-react';
import { GraphNode, GraphEdge } from '@/types/graph';

export default function ArchOverviewPage() {
  // Estados para controles de filtro e visualização
  const [depth, setDepth] = useState(2);
  const [environmentId, setEnvironmentId] = useState<number>();
  const [showInstances, setShowInstances] = useState(false);
  const [selectedComponentId, setSelectedComponentId] = useState<string>();
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<GraphEdge | null>(null);

  // Layout atual do grafo
  const [currentLayout, setCurrentLayout] = useState<'cola' | 'breadthfirst' | 'concentric'>('cola');

  // Buscar dados do grafo
  const { graphData, loading, error, refetch } = useGraphData({
    depth,
    environmentId,
    includeInstances: showInstances
  });

  // Handlers para eventos do grafo
  const handleNodeClick = (node: GraphNode) => {
    setSelectedNode(node);
    setSelectedEdge(null);
    
    if (node.type === 'component') {
      setSelectedComponentId(node.id);
    } else {
      setSelectedComponentId(undefined);
    }
  };

  const handleEdgeClick = (edge: GraphEdge) => {
    setSelectedEdge(edge);
    setSelectedNode(null);
    setSelectedComponentId(undefined);
  };

  // Layouts disponíveis para o grafo
  const layouts = {
    cola: {
      name: 'cola',
      animate: true,
      nodeSpacing: 120,
      edgeLength: 180,
      randomize: false
    },
    breadthfirst: {
      name: 'breadthfirst',
      animate: true,
      directed: true,
      spacingFactor: 1.5
    },
    concentric: {
      name: 'concentric',
      animate: true,
      minNodeSpacing: 80,
      concentric: (node: any) => {
        return node.data('type') === 'component' ? 2 : 
               node.data('type') === 'instance' ? 1 : 
               node.data('type') === 'environment' ? 3 : 0;
      }
    }
  };

  // Renderizar detalhes do nó selecionado
  const renderNodeDetails = () => {
    if (!selectedNode) return null;

    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">{selectedNode.label}</CardTitle>
              <CardDescription>
                {selectedNode.type === 'component' ? 'Componente' : 
                 selectedNode.type === 'instance' ? 'Instância' : 
                 selectedNode.type === 'environment' ? 'Ambiente' : 'Nó'}
              </CardDescription>
            </div>
            <Badge variant="outline">
              {selectedNode.type === 'component' ? <BoxIcon className="h-4 w-4 mr-1" /> : 
               selectedNode.type === 'instance' ? <ServerIcon className="h-4 w-4 mr-1" /> : 
               selectedNode.type === 'environment' ? <LayersIcon className="h-4 w-4 mr-1" /> : 
               <CircleIcon className="h-4 w-4 mr-1" />}
              {selectedNode.type}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {selectedNode.data?.description && (
              <div>
                <p className="text-sm text-muted-foreground">{selectedNode.data.description}</p>
              </div>
            )}
            
            <Separator />
            
            {selectedNode.type === 'instance' && (
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="font-medium">ID do Componente:</div>
                <div>{selectedNode.componentId}</div>
                
                <div className="font-medium">Ambiente:</div>
                <div>{selectedNode.data?.environmentName || 'N/A'}</div>
                
                <div className="font-medium">Hostname:</div>
                <div>{selectedNode.data?.hostname || 'N/A'}</div>
                
                {selectedNode.data?.specs && (
                  <>
                    <div className="font-medium">Especificações:</div>
                    <div>
                      {Object.entries(selectedNode.data.specs).map(([key, value]) => (
                        <div key={key}>
                          <span className="text-muted-foreground">{key}:</span> {String(value)}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
            
            {selectedNode.type === 'component' && (
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="font-medium">Status:</div>
                <div>{selectedNode.data?.status || 'N/A'}</div>
                
                <div className="font-medium">Categoria:</div>
                <div>{selectedNode.data?.categoryName || 'N/A'}</div>
                
                <div className="font-medium">Time:</div>
                <div>{selectedNode.data?.teamName || 'N/A'}</div>
                
                {showInstances && (
                  <>
                    <div className="font-medium">Instâncias:</div>
                    <div>{selectedNode.data?.totalInstances || 0}</div>
                  </>
                )}
              </div>
            )}
            
            {selectedNode.type === 'environment' && (
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="font-medium">Descrição:</div>
                <div>{selectedNode.data?.description || 'N/A'}</div>
                
                <div className="font-medium">Total Instâncias:</div>
                <div>{selectedNode.data?.totalInstances || 0}</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  // Renderizar detalhes da aresta selecionada
  const renderEdgeDetails = () => {
    if (!selectedEdge) return null;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {selectedEdge.label || selectedEdge.type || 'Relacionamento'}
          </CardTitle>
          <CardDescription>
            {selectedEdge.source} → {selectedEdge.target}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {selectedEdge.type && (
              <div className="flex items-center">
                <Badge variant="outline">{selectedEdge.type}</Badge>
              </div>
            )}
            
            {selectedEdge.data?.description && (
              <p className="text-sm text-muted-foreground">{selectedEdge.data.description}</p>
            )}
            
            {selectedEdge.data?.properties && (
              <div className="grid grid-cols-2 gap-2 text-sm">
                {Object.entries(selectedEdge.data.properties).map(([key, value]) => (
                  <React.Fragment key={key}>
                    <div className="font-medium">{key}:</div>
                    <div>{String(value)}</div>
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  // Renderizar controles do grafo
  const renderControls = () => {
    return (
      <div className="mb-4 flex flex-col gap-4">
        <div className="flex flex-wrap gap-2 justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="show-instances"
                checked={showInstances}
                onCheckedChange={setShowInstances}
              />
              <Label htmlFor="show-instances">Exibir Instâncias</Label>
            </div>
            
            <div className="w-[250px]">
              <EnvironmentSelector
                value={environmentId?.toString() || ''}
                onChange={(value) => setEnvironmentId(value ? parseInt(value) : undefined)}
                placeholder="Selecionar ambiente"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => refetch()}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
            
            <Tabs 
              defaultValue="cola" 
              value={currentLayout}
              onValueChange={(value) => setCurrentLayout(value as any)}
              className="hidden sm:flex"
            >
              <TabsList>
                <TabsTrigger value="cola">
                  <NetworkIcon className="h-4 w-4 mr-2" />
                  Cola
                </TabsTrigger>
                <TabsTrigger value="breadthfirst">
                  <List className="h-4 w-4 mr-2" />
                  Largura
                </TabsTrigger>
                <TabsTrigger value="concentric">
                  <Grid3X3 className="h-4 w-4 mr-2" />
                  Concêntrico
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-semibold mb-2">Visão Geral da Arquitetura</h1>
      <p className="text-muted-foreground mb-6">
        Visualização interativa dos componentes, instâncias e suas relações
      </p>
      
      {renderControls()}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {loading ? (
            <div className="w-full h-[600px] border rounded-md flex items-center justify-center">
              <Skeleton className="h-[90%] w-[90%]" />
            </div>
          ) : error ? (
            <div className="w-full h-[600px] border rounded-md flex items-center justify-center bg-destructive/5">
              <div className="text-center p-4">
                <p className="text-destructive font-medium mb-2">Erro ao carregar dados do grafo</p>
                <p className="text-sm text-muted-foreground">{error.message}</p>
              </div>
            </div>
          ) : graphData ? (
            <CytoscapeGraph
              nodes={graphData.nodes}
              edges={graphData.edges}
              height="600px"
              onNodeClick={handleNodeClick}
              onEdgeClick={handleEdgeClick}
              layout={layouts[currentLayout] as any}
              showInstances={showInstances}
              highlightInstancesOfComponent={selectedComponentId}
              selectedEnvironmentId={environmentId}
            />
          ) : (
            <div className="w-full h-[600px] border rounded-md flex items-center justify-center">
              <p className="text-muted-foreground">Nenhum dado de grafo disponível</p>
            </div>
          )}
        </div>
        
        <div>
          {selectedNode ? (
            renderNodeDetails()
          ) : selectedEdge ? (
            renderEdgeDetails()
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Detalhes</CardTitle>
                <CardDescription>
                  Selecione um nó ou aresta no grafo para ver seus detalhes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 rounded-sm bg-[#7839EE]"></div>
                    <span className="text-sm">Componente</span>
                  </div>
                  
                  {showInstances && (
                    <>
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 rounded-sm bg-[#4CAF50]"></div>
                        <span className="text-sm">Instância</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 rotate-45 bg-[#03A9F4]"></div>
                        <span className="text-sm">Ambiente</span>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
} 