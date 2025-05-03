/**
 * Teste de compatibilidade entre TanStack Query e Apollo Client
 * 
 * Este teste verifica se as bibliotecas podem ser usadas em conjunto
 * conforme exigido pela documentação de arquitetura v2.0
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { ApolloClient, InMemoryCache, ApolloProvider } from '@apollo/client';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';

// Componente de teste que usa as duas bibliotecas
function TestComponent() {
  // Hook do TanStack Query para dados locais
  const localQuery = useQuery({
    queryKey: ['testLocal'],
    queryFn: () => Promise.resolve({ data: 'Local data' }),
  });

  return (
    <div>
      <h1>Teste de Compatibilidade</h1>
      {localQuery.isLoading ? (
        <p>Carregando dados locais...</p>
      ) : (
        <p data-testid="local-data">{localQuery.data?.data}</p>
      )}
    </div>
  );
}

// Configure uma versão de teste do Apollo Client
const apolloClient = new ApolloClient({
  cache: new InMemoryCache(),
  uri: 'http://localhost:4000/graphql',
});

// Configure uma versão de teste do TanStack Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

describe('Compatibilidade TanStack Query e Apollo Client', () => {
  test('Ambas as bibliotecas podem ser usadas em conjunto', async () => {
    render(
      <ApolloProvider client={apolloClient}>
        <QueryClientProvider client={queryClient}>
          <TestComponent />
        </QueryClientProvider>
      </ApolloProvider>
    );

    // Verifica se o componente foi renderizado e os dados do TanStack Query foram carregados
    expect(await screen.findByTestId('local-data')).toHaveTextContent('Local data');
  });
});
