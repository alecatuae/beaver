'use client';

import React, { useEffect, useRef } from 'react';
import CytoscapeComponent from 'react-cytoscapejs';
import cytoscape from 'cytoscape';

// Tipos para as propriedades do componente
interface GraphNode {
  id: string;
  label: string;
  type?: string;
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
    selector: ':selected',
    style: {
      'background-color': '#9A6CF4',
      'line-color': '#9A6CF4',
      'target-arrow-color': '#9A6CF4',
      'border-width': 2,
      'border-color': '#FFFFFF'
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
 */
export function CytoscapeGraph({
  nodes,
  edges,
  height = '600px',
  width = '100%',
  onNodeClick,
  onEdgeClick,
  layout = defaultLayout
}: CytoscapeGraphProps) {
  const cyRef = useRef<cytoscape.Core | null>(null);

  // Preparar elementos para o Cytoscape
  const elements = [
    ...nodes.map(node => ({
      data: {
        id: node.id,
        label: node.label,
        type: node.type,
        ...node.data
      }
    })),
    ...edges.map(edge => ({
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