"use client";

import React, { useState } from 'react';
import { ApolloProvider } from '@apollo/client';
import { client } from '@/lib/apollo-client';
import TRMTreeView from './components/TreeView';
import NodeDetails from './components/NodeDetails';
import { Button } from '@/components/ui/button';
import { TRMLayerSelector } from '@/components/selectors';
import { useQuery } from '@apollo/client';
import { GET_TRM_LAYERS } from '@/lib/graphql-trm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ExpandIcon, MinusSquare, ServerIcon, LayersIcon, AppWindowIcon, Network } from 'lucide-react';

export default function TRMPage() {
  // Estados
  const [selectedNodeId, setSelectedNodeId] = useState<string>();
  const [selectedNodeType, setSelectedNodeType] = useState<'layer' | 'category'>();
  const [selectedLayerName, setSelectedLayerName] = useState<string>();
  const [filterLayerId, setFilterLayerId] = useState<string>('');
  const [expandAll, setExpandAll] = useState(false);
  
  // Obter camadas TRM para o filtro
  const { data } = useQuery(GET_TRM_LAYERS, {
    fetchPolicy: 'cache-first',
  });
  
  const layers = data?.trmLayers || [];
  
  // Handler para seleção de nó
  const handleNodeSelect = (node: any) => {
    setSelectedNodeId(node.id);
    setSelectedNodeType(node.type);
    setSelectedLayerName(node.name);
  };
  
  return (
    <div className="container py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Technical Reference Model (TRM)</h1>
          <p className="text-muted-foreground">
            Visualização hierárquica das camadas e categorias da arquitetura
          </p>
        </div>
      </div>
      
      <Tabs defaultValue="tree" className="w-full">
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="tree">Visualização em Árvore</TabsTrigger>
            <TabsTrigger value="grid">Visualização em Grid</TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setExpandAll(!expandAll)}
            >
              {expandAll ? (
                <>
                  <MinusSquare className="mr-2 h-4 w-4" />
                  Recolher Todos
                </>
              ) : (
                <>
                  <ExpandIcon className="mr-2 h-4 w-4" />
                  Expandir Todos
                </>
              )}
            </Button>
            
            <div className="w-[220px]">
              <TRMLayerSelector
                value={filterLayerId}
                onChange={setFilterLayerId}
                placeholder="Filtrar por camada"
              />
            </div>
          </div>
        </div>
        
        <TabsContent value="tree" className="mt-2">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <TRMTreeView
                onSelectNode={handleNodeSelect}
                expandAll={expandAll}
              />
            </div>
            <div className="md:col-span-2">
              <NodeDetails
                nodeId={selectedNodeId}
                nodeType={selectedNodeType}
                layerName={selectedLayerName}
              />
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="grid">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {layers.map((layer: any) => (
              <div
                key={layer.id}
                className="p-4 border rounded-md cursor-pointer hover:border-primary transition-colors"
                onClick={() => {
                  setSelectedNodeId(layer.id);
                  setSelectedNodeType('layer');
                  setSelectedLayerName(layer.name);
                }}
              >
                <div className="flex items-center mb-2">
                  {layer.name === 'Infrastructure' && <ServerIcon className="h-5 w-5 mr-2" />}
                  {layer.name === 'Platform' && <LayersIcon className="h-5 w-5 mr-2" />}
                  {layer.name === 'Application' && <AppWindowIcon className="h-5 w-5 mr-2" />}
                  {layer.name === 'Shared Services' && <Network className="h-5 w-5 mr-2" />}
                  <h3 className="font-medium">{layer.name}</h3>
                </div>
                <p className="text-sm text-muted-foreground truncate">
                  {layer.description || `Camada ${layer.name} do modelo TRM`}
                </p>
              </div>
            ))}
          </div>
          
          <div className="mt-6">
            <NodeDetails
              nodeId={selectedNodeId}
              nodeType={selectedNodeType}
              layerName={selectedLayerName}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Wrapper para fornecer o cliente Apollo
function TRMPageWithApolloProvider() {
  return (
    <ApolloProvider client={client}>
      <TRMPage />
    </ApolloProvider>
  );
}

export default TRMPageWithApolloProvider; 