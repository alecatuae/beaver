import { ApolloClient, InMemoryCache, HttpLink, from } from '@apollo/client';
import { createErrorLink } from './apollo-error-link';

const API_URL = process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || 'http://localhost:4000/graphql';

// Criar link HTTP para a API GraphQL
const httpLink = new HttpLink({
  uri: API_URL,
  credentials: 'same-origin'
});

// Configurar o cliente Apollo com detecção de erros
export function createApolloClient(errorHandler?: any) {
  // Criar link de erro com o manipulador fornecido
  const errorLink = createErrorLink(errorHandler);
  
  // Criar o cliente Apollo com a configuração padronizada
  return new ApolloClient({
    link: from([errorLink, httpLink]),
    cache: new InMemoryCache(),
    defaultOptions: {
      watchQuery: {
        fetchPolicy: 'network-only',
        nextFetchPolicy: 'cache-first',
      },
      query: {
        fetchPolicy: 'network-only',
        errorPolicy: 'all',
      },
      mutate: {
        errorPolicy: 'all',
      },
    },
  });
}

// Exportar uma instância padrão do cliente Apollo
// O link de erro será configurado com o manipulador de erro em ApolloProvider
export const client = createApolloClient(); 