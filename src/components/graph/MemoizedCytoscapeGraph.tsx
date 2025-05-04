/**
 * Versão otimizada do componente CytoscapeGraph
 * Utiliza técnicas de memoização para melhorar o desempenho
 */
'use client';

import React, { useMemo, useCallback, useRef, useEffect } from 'react';
import CytoscapeComponent from 'react-cytoscapejs';
import cytoscape from 'cytoscape';
import { withMemo } from '@/lib/memo-hoc';
import { useMemoDeep } from '@/lib/hooks/use-memoization';

// Tipos para as propriedades do componente
interface GraphNode {
  id: string;
  label: string;
  type?: string;
  environmentId?: number;
  componentId?: number;
  parentId?: string;
  data?: Record<string, any>;
}

interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  type?: string;
  data?: Record<string, any>;
}

interface CytoscapeGraphProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  height?: string | number;
  width?: string | number;
  onNodeClick?: (node: GraphNode) => void;
  onEdgeClick?: (edge: GraphEdge) => void;
  layout?: cytoscape.LayoutOptions;
  showInstances?: boolean;
  highlightInstancesOfComponent?: string;
  selectedEnvironmentId?: number;
}

// Estilos padrão do Cytoscape
const defaultStylesheet: cytoscape.Stylesheet[] = [
  {
    selector: 'node',
    style: {
      'background-color': '#7839EE', // Cor primária conforme guia de estilo
      'label': 'data(label)',
      'width': 40,
      'height': 40,
      'text-valign': 'center',
      'text-halign': 'center',
      'color': '#FFFFFF',
      'font-size': '12px',
      'text-outline-width': 1,
      'text-outline-color': '#7839EE',
      'border-width': 1,
      'border-color': '#5B20C2'
    }
  },
  {
    selector: 'node[type = "component"]',
    style: {
      'background-color': '#7839EE',
      'shape': 'roundrectangle'
    }
  },
  {
    selector: 'node[type = "instance"]',
    style: {
      'background-color': '#4CAF50',
      'shape': 'round-rectangle',
      'width': 35,
      'height': 35,
      'border-color': '#2E7D32',
      'border-width': 1,
      'text-outline-color': '#4CAF50'
    }
  },
  {
    selector: 'node[type = "environment"]',
    style: {
      'background-color': '#03A9F4',
      'shape': 'diamond',
      'width': 35,
      'height': 35,
      'border-color': '#0288D1',
      'text-outline-color': '#03A9F4'
    }
  },
  {
    selector: 'edge',
    style: {
      'width': 2,
      'line-color': '#DDDDDD',
      'target-arrow-color': '#DDDDDD',
      'target-arrow-shape': 'triangle',
      'curve-style': 'bezier',
      'label': 'data(label)',
      'font-size': '10px',
      'color': '#666666',
      'text-rotation': 'autorotate'
    }
  },
  {
    selector: 'edge[type = "INSTANTIATES"]',
    style: {
      'line-color': '#4CAF50',
      'target-arrow-color': '#4CAF50',
      'line-style': 'dashed'
    }
  },
  {
    selector: 'edge[type = "DEPLOYED_IN"]',
    style: {
      'line-color': '#03A9F4',
      'target-arrow-color': '#03A9F4',
      'line-style': 'dotted'
    }
  },
  {
    selector: ':selected',
    style: {
      'background-color': '#9A6CF4',
      'line-color': '#9A6CF4',
      'target-arrow-color': '#9A6CF4',
      'border-width': 2,
      'border-color': '#FFFFFF'
    }
  },
  {
    selector: '.highlighted',
    style: {
      'background-color': '#F44336',
      'line-color': '#F44336',
      'target-arrow-color': '#F44336'
    }
  },
  {
    selector: '.faded',
    style: {
      'opacity': 0.3
    }
  },
  {
    selector: '.related-instance',
    style: {
      'border-width': 3,
      'border-color': '#F44336',
      'border-style': 'dashed'
    }
  }
];

// Layout padrão
const defaultLayout: cytoscape.LayoutOptions = {
  name: 'cola',
  animate: true,
  nodeSpacing: 40,
  edgeLength: 150,
  randomize: false
};

/**
 * Componente Cytoscape para visualização de grafos - Versão otimizada
 * Usa técnicas de memoização para evitar renderizações desnecessárias
 */
function CytoscapeGraphBase({
  nodes,
  edges,
  height = '600px',
  width = '100%',
  onNodeClick,
  onEdgeClick,
  layout = defaultLayout,
  showInstances = false,
  highlightInstancesOfComponent,
  selectedEnvironmentId
}: CytoscapeGraphProps) {
  // Ref para acessar a instância do Cytoscape
  const cyRef = useRef<cytoscape.Core | null>(null);

  // Memoizar a filtragem dos nós e arestas para evitar recálculos desnecessários
  const { filteredNodes, filteredEdges } = useMemoDeep(() => {
    // Se não estiver mostrando instâncias, filtrar nós de instância e arestas relacionadas
    if (!showInstances) {
      const instanceNodeIds = new Set(
        nodes.filter(node => node.type === 'instance').map(node => node.id)
      );
      
      return {
        filteredNodes: nodes.filter(node => node.type !== 'instance'),
        filteredEdges: edges.filter(edge => 
          !instanceNodeIds.has(edge.source) && !instanceNodeIds.has(edge.target)
        )
      };
    } else if (selectedEnvironmentId) {
      // Se estiver filtrando por ambiente, manter apenas as instâncias desse ambiente
      const envInstanceNodeIds = new Set(
        nodes
          .filter(node => 
            node.type === 'instance' && 
            node.data?.environmentId === selectedEnvironmentId
          )
          .map(node => node.id)
      );
      
      return {
        filteredNodes: nodes.filter(node => 
          node.type !== 'instance' || envInstanceNodeIds.has(node.id)
        ),
        filteredEdges: edges.filter(edge => {
          const sourceIsInstance = nodes.find(n => n.id === edge.source)?.type === 'instance';
          const targetIsInstance = nodes.find(n => n.id === edge.target)?.type === 'instance';
          
          if (!sourceIsInstance && !targetIsInstance) return true;
          return envInstanceNodeIds.has(edge.source) || envInstanceNodeIds.has(edge.target);
        })
      };
    }
    
    // Caso contrário, usar todos os nós e arestas
    return { filteredNodes: [...nodes], filteredEdges: [...edges] };
  }, [nodes, edges, showInstances, selectedEnvironmentId]);

  // Memoizar os elementos para o Cytoscape
  const elements = useMemo(() => [
    ...filteredNodes.map(node => ({
      data: {
        id: node.id,
        label: node.label,
        type: node.type,
        environmentId: node.environmentId,
        componentId: node.componentId,
        parentId: node.parentId,
        ...node.data
      }
    })),
    ...filteredEdges.map(edge => ({
      data: {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: edge.label,
        type: edge.type,
        ...edge.data
      }
    }))
  ], [filteredNodes, filteredEdges]);

  // Memoizar os eventos de clique para evitar recriação a cada renderização
  const handleNodeClick = useCallback((event: any) => {
    if (onNodeClick) {
      const nodeData = event.target.data();
      const originalNode = nodes.find(node => node.id === nodeData.id);
      if (originalNode) {
        onNodeClick(originalNode);
      }
    }
  }, [onNodeClick, nodes]);

  const handleEdgeClick = useCallback((event: any) => {
    if (onEdgeClick) {
      const edgeData = event.target.data();
      const originalEdge = edges.find(edge => edge.id === edgeData.id);
      if (originalEdge) {
        onEdgeClick(originalEdge);
      }
    }
  }, [onEdgeClick, edges]);

  // Configurar eventos quando o componente montar
  const setupEvents = useCallback((cy: cytoscape.Core) => {
    cy.on('tap', 'node', handleNodeClick);
    cy.on('tap', 'edge', handleEdgeClick);
    
    return () => {
      cy.removeListener('tap', 'node', handleNodeClick);
      cy.removeListener('tap', 'edge', handleEdgeClick);
    };
  }, [handleNodeClick, handleEdgeClick]);

  // Efeito para destacar instâncias de um componente específico
  useEffect(() => {
    if (cyRef.current && highlightInstancesOfComponent) {
      const cy = cyRef.current;
      
      // Remover destaque anterior
      cy.elements().removeClass('highlighted faded related-instance');
      
      if (highlightInstancesOfComponent) {
        // Encontrar o componente selecionado
        const componentNode = cy.getElementById(highlightInstancesOfComponent);
        
        if (componentNode.length > 0) {
          // Destacar o componente selecionado
          componentNode.addClass('highlighted');
          
          // Encontrar todas as instâncias relacionadas
          const relatedInstances = cy.nodes().filter(node => {
            const data = node.data();
            return data.type === 'instance' && data.componentId?.toString() === highlightInstancesOfComponent;
          });
          
          // Destacar as instâncias relacionadas
          relatedInstances.addClass('related-instance');
          
          // Aplicar efeito de fade nos outros elementos
          cy.elements()
            .difference(componentNode)
            .difference(relatedInstances)
            .difference(cy.elements().edgesWith(componentNode))
            .difference(cy.elements().edgesWith(relatedInstances))
            .addClass('faded');
        }
      }
    }
  }, [highlightInstancesOfComponent]);

  return (
    <CytoscapeComponent
      elements={elements}
      style={{ width, height }}
      stylesheet={defaultStylesheet}
      layout={layout}
      cy={(cy) => {
        cyRef.current = cy;
        setupEvents(cy);
      }}
    />
  );
}

// Exportar uma versão memoizada do componente
// Usar deep equality para comparar as props complexas
export const MemoizedCytoscapeGraph = withMemo(CytoscapeGraphBase, {
  name: 'CytoscapeGraph',
  deepEqual: true,
  debug: process.env.NODE_ENV === 'development',
  // Ignorar a função de callback do cy pois sempre é diferente
  ignoreProps: ['cy']
});

export default MemoizedCytoscapeGraph; 