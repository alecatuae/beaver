'use client';

import React, { useEffect, useRef } from 'react';
import CytoscapeComponent from 'react-cytoscapejs';
import cytoscape from 'cytoscape';

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
 * Componente Cytoscape para visualização de grafos
 * Compatível com Cytoscape.js 3.29.x
 * Atualizado para suportar instâncias de componentes
 */
export function CytoscapeGraph({
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
  const cyRef = useRef<cytoscape.Core | null>(null);

  // Filtrar nós e arestas com base nas opções
  let filteredNodes = [...nodes];
  let filteredEdges = [...edges];

  // Se não estiver mostrando instâncias, filtrar nós de instância e arestas relacionadas
  if (!showInstances) {
    const instanceNodeIds = new Set(
      nodes.filter(node => node.type === 'instance').map(node => node.id)
    );
    
    filteredNodes = nodes.filter(node => node.type !== 'instance');
    
    filteredEdges = edges.filter(edge => 
      !instanceNodeIds.has(edge.source) && !instanceNodeIds.has(edge.target)
    );
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
    
    filteredNodes = nodes.filter(node => 
      node.type !== 'instance' || envInstanceNodeIds.has(node.id)
    );
    
    filteredEdges = edges.filter(edge => {
      const sourceIsInstance = nodes.find(n => n.id === edge.source)?.type === 'instance';
      const targetIsInstance = nodes.find(n => n.id === edge.target)?.type === 'instance';
      
      if (!sourceIsInstance && !targetIsInstance) return true;
      return envInstanceNodeIds.has(edge.source) || envInstanceNodeIds.has(edge.target);
    });
  }

  // Preparar elementos para o Cytoscape
  const elements = [
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
  ];

  // Efeito para destacar instâncias de um componente específico
  useEffect(() => {
    if (cyRef.current && highlightInstancesOfComponent) {
      const cy = cyRef.current;
      
      // Remover destaque anterior
      cy.elements().removeClass('highlighted faded related-instance');
      
      if (highlightInstancesOfComponent) {
        // Obter o nó do componente
        const componentNode = cy.getElementById(highlightInstancesOfComponent);
        
        if (componentNode.length > 0) {
          // Encontrar instâncias relacionadas
          const instanceNodes = cy.nodes().filter(node => 
            node.data('type') === 'instance' && 
            node.data('componentId') === parseInt(highlightInstancesOfComponent)
          );
          
          // Destacar as instâncias e o componente
          componentNode.addClass('highlighted');
          instanceNodes.addClass('related-instance');
          
          // Reduzir a opacidade de outros elementos
          cy.elements()
            .difference(componentNode)
            .difference(instanceNodes)
            .difference(componentNode.edgesWith(instanceNodes))
            .addClass('faded');
        }
      }
    }
  }, [highlightInstancesOfComponent, cyRef.current, showInstances]);

  // Configurar eventos após o carregamento do componente
  useEffect(() => {
    if (cyRef.current) {
      const cy = cyRef.current;

      // Configurar evento de clique em nós
      if (onNodeClick) {
        cy.on('tap', 'node', (event) => {
          const nodeData = event.target.data();
          const graphNode: GraphNode = {
            id: nodeData.id,
            label: nodeData.label,
            type: nodeData.type,
            environmentId: nodeData.environmentId,
            componentId: nodeData.componentId,
            parentId: nodeData.parentId,
            data: { ...nodeData }
          };
          onNodeClick(graphNode);
        });
      }

      // Configurar evento de clique em arestas
      if (onEdgeClick) {
        cy.on('tap', 'edge', (event) => {
          const edgeData = event.target.data();
          const graphEdge: GraphEdge = {
            id: edgeData.id,
            source: edgeData.source,
            target: edgeData.target,
            label: edgeData.label,
            type: edgeData.type,
            data: { ...edgeData }
          };
          onEdgeClick(graphEdge);
        });
      }

      // Limpar eventos ao desmontar
      return () => {
        cy.removeAllListeners();
      };
    }
  }, [cyRef, onNodeClick, onEdgeClick]);

  return (
    <div 
      style={{ 
        height, 
        width, 
        border: '1px solid #DDDDDD', 
        borderRadius: '8px' 
      }}
    >
      <CytoscapeComponent
        elements={elements}
        stylesheet={defaultStylesheet}
        layout={layout}
        cy={(cy) => { cyRef.current = cy; }}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}

// Exportar a versão do Cytoscape para facilitar a verificação de compatibilidade
export const cytoscapeVersion = cytoscape.version; 