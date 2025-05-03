/**
 * Teste de compatibilidade do Cytoscape.js 3.29.x
 * 
 * Este teste verifica se o Cytoscape.js é compatível com as outras 
 * bibliotecas conforme exigido pela documentação de arquitetura v2.0
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { ApolloClient, InMemoryCache, ApolloProvider } from '@apollo/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CytoscapeGraph, cytoscapeVersion } from '../components/graph/CytoscapeComponent';
import cytoscape from 'cytoscape';

// Dados de exemplo para o grafo
const sampleNodes = [
  { id: 'node1', label: 'Node 1' },
  { id: 'node2', label: 'Node 2' },
  { id: 'node3', label: 'Node 3' }
];

const sampleEdges = [
  { id: 'edge1', source: 'node1', target: 'node2', label: 'Connects to' },
  { id: 'edge2', source: 'node2', target: 'node3', label: 'Depends on' }
];

// Configuração para teste
const mockOnNodeClick = jest.fn();
const mockOnEdgeClick = jest.fn();

// Componente que combina todas as bibliotecas
function TestComponent() {
  return (
    <div>
      <h1>Cytoscape Compatibility Test</h1>
      <p data-testid="cytoscape-version">Version: {cytoscapeVersion}</p>
      <div style={{ width: '400px', height: '300px' }}>
        <CytoscapeGraph
          nodes={sampleNodes}
          edges={sampleEdges}
          onNodeClick={mockOnNodeClick}
          onEdgeClick={mockOnEdgeClick}
        />
      </div>
    </div>
  );
}

// Configure o ambiente para o teste
const apolloClient = new ApolloClient({
  cache: new InMemoryCache(),
  uri: 'http://localhost:4000/graphql',
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

describe('Compatibilidade Cytoscape.js', () => {
  test('Verifica a versão do Cytoscape.js', () => {
    // Verifica se a versão corresponde a 3.29.x
    expect(cytoscape.version.startsWith('3.29')).toBe(true);
  });

  test('Cytoscape.js pode ser usado com Apollo Client e TanStack Query', () => {
    render(
      <ApolloProvider client={apolloClient}>
        <QueryClientProvider client={queryClient}>
          <TestComponent />
        </QueryClientProvider>
      </ApolloProvider>
    );

    // Verifica se o componente foi renderizado corretamente
    expect(screen.getByTestId('cytoscape-version')).toHaveTextContent('Version:');
  });
}); 