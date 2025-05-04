import { ApolloClient, InMemoryCache, HttpLink, from, Reference, makeVar, TypePolicies } from '@apollo/client';
import { createErrorLink } from './apollo-error-link';
import { relayStylePagination } from '@apollo/client/utilities';

const API_URL = process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || 'http://localhost:4000/graphql';

// Variável reativa para rastrear IDs de entidades frequentemente acessadas
export const frequentlyAccessedIds = makeVar<Array<{ type: string; id: string | number }>>([]);

// Criar políticas de cache personalizadas para entidades principais
const typePolicies: TypePolicies = {
  Query: {
    fields: {
      // Configuração de paginação para componentes
      components: relayStylePagination(['status', 'search', 'categoryId', 'teamId', 'environmentId']),
      // Configuração de paginação para ADRs
      adrs: relayStylePagination(['filter']),
    },
  },
  Component: {
    // Chave para identificação única no cache
    keyFields: ['id'],
    fields: {
      // Manter instâncias sempre atualizadas
      instances: {
        merge(existing = [], incoming) {
          return incoming;
        },
      },
      // Política para calcular campos derivados localmente
      totalInstances: {
        read(_, { readField }) {
          const instances = readField('instances') as Reference[] | undefined;
          return instances?.length || 0;
        }
      }
    }
  },
  ADR: {
    keyFields: ['id'],
    fields: {
      participants: {
        merge(existing = [], incoming) {
          return incoming;
        }
      },
      // Campo computado para verificar se todos aprovaram
      approvedByAll: {
        read(_, { readField }) {
          const participants = readField('participants') as any[] | undefined;
          if (!participants?.length) return false;
          return participants.every(p => p.approved === true);
        }
      }
    }
  },
};

// Criar link HTTP para a API GraphQL
const httpLink = new HttpLink({
  uri: API_URL,
  credentials: 'same-origin'
});

// Configurar o cliente Apollo com cache avançado
export function createApolloClient(errorHandler?: any) {
  // Criar link de erro com o manipulador fornecido
  const errorLink = createErrorLink(errorHandler);
  
  // Configuração de cache com políticas avançadas
  const cache = new InMemoryCache({ 
    typePolicies,
    // Identificar objetos para cache mesmo sem __typename
    dataIdFromObject: (object: any) => {
      // Usar ID das entidades para identificação única
      if (object.id) {
        return `${object.__typename}:${object.id}`;
      }
      return null;
    },
  });
  
  // Criar o cliente Apollo com a configuração padronizada
  return new ApolloClient({
    link: from([errorLink, httpLink]),
    cache,
    defaultOptions: {
      watchQuery: {
        // Usar cache primeiro, mas validar com a rede após
        fetchPolicy: 'cache-and-network',
        nextFetchPolicy: 'cache-first',
        // Permitir consultas parciais do cache enquanto busca atualização
        returnPartialData: true,
      },
      query: {
        // Estratégia de fallback: buscar cache primeiro, rede se necessário
        fetchPolicy: 'cache-first',
        errorPolicy: 'all',
      },
      mutate: {
        errorPolicy: 'all',
      },
    },
    // Conectar ao Redux DevTools ou Apollo Studio para depuração (opcional)
    connectToDevTools: process.env.NODE_ENV !== 'production',
  });
}

// Exportar uma instância padrão do cliente Apollo
// O link de erro será configurado com o manipulador de erro em ApolloProvider
export const client = createApolloClient(); 