import { useCallback, useEffect } from 'react';
import { 
  ApolloClient, 
  ApolloCache, 
  DocumentNode, 
  OperationVariables,
  useApolloClient, 
  useQuery, 
  QueryHookOptions
} from '@apollo/client';
import { frequentlyAccessedIds } from '../apollo-client';

interface CacheOptions {
  /**
   * Tempo em minutos para considerar os dados "frescos"
   * Após esse tempo, uma nova requisição será feita
   */
  staleTime?: number;
  
  /**
   * Se deve realizar prefetch quando o componente montar
   */
  prefetch?: boolean;
  
  /**
   * Tipos de entidades que devem invalidar este cache quando modificadas
   */
  invalidateOn?: string[];
}

/**
 * Hook para consultas com estratégias de cache avançadas
 * 
 * @param query Documento GraphQL com a consulta
 * @param variables Variáveis da consulta
 * @param options Opções padrão do Apollo useQuery
 * @param cacheOptions Opções de cache personalizadas
 */
export function useCachedQuery<TData = any, TVariables = OperationVariables>(
  query: DocumentNode,
  variables?: TVariables,
  options?: QueryHookOptions<TData, TVariables>,
  cacheOptions?: CacheOptions
) {
  const client = useApolloClient();
  
  // Aplicar tempo de expiração personalizado
  useEffect(() => {
    if (cacheOptions?.staleTime) {
      const queryInfo = client.getObservableQueries();
      const staleTimeMs = cacheOptions.staleTime * 60 * 1000;
      
      // Configurar tempo de expiração personalizado para esta consulta
      setTimeout(() => {
        client.refetchQueries({
          include: [query],
        });
      }, staleTimeMs);
    }
  }, [client, query, cacheOptions?.staleTime]);

  // Prefetch de dados quando necessário
  useEffect(() => {
    if (cacheOptions?.prefetch) {
      client.query({
        query,
        variables,
        fetchPolicy: 'network-only',
      }).catch(e => {
        console.error('Erro no prefetch:', e);
      });
    }
  }, [client, query, variables, cacheOptions?.prefetch]);

  // Rastrear entidades frequentemente acessadas
  const trackFrequentAccess = useCallback((data: TData | undefined) => {
    if (!data) return;
    
    // Extrair IDs de entidades da resposta
    const entities = extractEntitiesFromResponse(data);
    
    if (entities.length > 0) {
      // Atualizar a lista de entidades frequentemente acessadas
      const currentFrequent = frequentlyAccessedIds();
      frequentlyAccessedIds([...currentFrequent, ...entities]);
    }
  }, []);

  // Executar a consulta com o hook padrão do Apollo
  const result = useQuery<TData, TVariables>(query, {
    variables,
    ...options,
    onCompleted: data => {
      // Rastrear acesso frequente
      trackFrequentAccess(data);
      
      // Chamar o callback original se existir
      options?.onCompleted?.(data);
    }
  });

  // Função para limpar manualmente o cache desta consulta
  const clearCache = useCallback(() => {
    client.cache.evict({ fieldName: query.definitions[0].name?.value || '' });
    client.cache.gc();
  }, [client, query]);

  // Função para atualizar manualmente o cache com novos dados
  const updateCache = useCallback((
    updateFn: (cache: ApolloCache<any>, data: TData | null) => void
  ) => {
    client.cache.modify({
      id: 'ROOT_QUERY',
      fields: {
        [query.definitions[0].name?.value || '']: (cachedData) => {
          updateFn(client.cache, cachedData);
          return cachedData;
        }
      }
    });
  }, [client, query]);

  return {
    ...result,
    clearCache,
    updateCache,
    refetchOptimized: () => {
      return result.refetch({
        ...variables,
        _optimizeForCache: true
      });
    }
  };
}

/**
 * Hook para prefetch de dados que serão necessários em breve
 * 
 * @param queries Lista de consultas a serem pré-carregadas
 */
export function usePrefetchQueries(
  queries: Array<{
    query: DocumentNode;
    variables?: any;
  }>
) {
  const client = useApolloClient();

  const prefetch = useCallback(() => {
    queries.forEach(({ query, variables }) => {
      client.query({
        query,
        variables,
        fetchPolicy: 'network-only',
      }).catch(e => {
        console.error('Erro no prefetch:', e);
      });
    });
  }, [client, queries]);

  return { prefetch };
}

/**
 * Hook para gerenciar o cache de uma entidade específica
 * 
 * @param typeName Nome do tipo da entidade (Component, ADR, etc.)
 * @param id ID da entidade
 */
export function useEntityCache<T = any>(
  typeName: string,
  id: string | number
) {
  const client = useApolloClient();
  
  // Ler dados atuais do cache
  const readFromCache = useCallback(() => {
    return client.cache.readFragment<T>({
      id: `${typeName}:${id}`,
      fragment: buildFragmentForType(typeName),
    });
  }, [client, typeName, id]);
  
  // Atualizar dados no cache
  const writeToCache = useCallback((data: Partial<T>) => {
    return client.cache.writeFragment({
      id: `${typeName}:${id}`,
      fragment: buildFragmentForType(typeName),
      data,
    });
  }, [client, typeName, id]);
  
  // Limpar entidade do cache
  const evictFromCache = useCallback(() => {
    client.cache.evict({ id: `${typeName}:${id}` });
    client.cache.gc();
  }, [client, typeName, id]);
  
  return {
    readFromCache,
    writeToCache,
    evictFromCache,
  };
}

/**
 * Utilitário para extrair entidades de uma resposta GraphQL
 */
function extractEntitiesFromResponse(data: any) {
  const entities: Array<{ type: string; id: string | number }> = [];
  
  const processObject = (obj: any, path: string[] = []) => {
    if (!obj || typeof obj !== 'object') return;
    
    // Se tem __typename e id, é uma entidade que podemos rastrear
    if (obj.__typename && obj.id) {
      entities.push({
        type: obj.__typename,
        id: obj.id,
      });
    }
    
    // Processar arrays e objetos aninhados
    Object.entries(obj).forEach(([key, value]) => {
      if (key === '__typename' || key === 'id') return;
      
      if (Array.isArray(value)) {
        value.forEach(item => processObject(item, [...path, key]));
      } else if (value && typeof value === 'object') {
        processObject(value, [...path, key]);
      }
    });
  };
  
  processObject(data);
  return entities;
}

/**
 * Utilitário para construir fragmentos básicos para cada tipo
 */
function buildFragmentForType(typeName: string): DocumentNode {
  // Fragmentos básicos para os tipos principais
  switch (typeName) {
    case 'Component':
      return {
        kind: 'Document',
        definitions: [{
          kind: 'FragmentDefinition',
          name: { kind: 'Name', value: 'ComponentBasicFragment' },
          typeCondition: { 
            kind: 'NamedType', 
            name: { kind: 'Name', value: 'Component' } 
          },
          selectionSet: {
            kind: 'SelectionSet',
            selections: [
              { kind: 'Field', name: { kind: 'Name', value: 'id' } },
              { kind: 'Field', name: { kind: 'Name', value: 'name' } },
              { kind: 'Field', name: { kind: 'Name', value: 'description' } },
              { kind: 'Field', name: { kind: 'Name', value: 'status' } },
            ],
          },
        }],
      } as unknown as DocumentNode;
    
    case 'ADR':
      return {
        kind: 'Document',
        definitions: [{
          kind: 'FragmentDefinition',
          name: { kind: 'Name', value: 'ADRBasicFragment' },
          typeCondition: { 
            kind: 'NamedType', 
            name: { kind: 'Name', value: 'ADR' } 
          },
          selectionSet: {
            kind: 'SelectionSet',
            selections: [
              { kind: 'Field', name: { kind: 'Name', value: 'id' } },
              { kind: 'Field', name: { kind: 'Name', value: 'title' } },
              { kind: 'Field', name: { kind: 'Name', value: 'description' } },
              { kind: 'Field', name: { kind: 'Name', value: 'status' } },
            ],
          },
        }],
      } as unknown as DocumentNode;
    
    default:
      // Fragmento genérico para outros tipos
      return {
        kind: 'Document',
        definitions: [{
          kind: 'FragmentDefinition',
          name: { kind: 'Name', value: 'GenericFragment' },
          typeCondition: { 
            kind: 'NamedType', 
            name: { kind: 'Name', value: typeName } 
          },
          selectionSet: {
            kind: 'SelectionSet',
            selections: [
              { kind: 'Field', name: { kind: 'Name', value: 'id' } },
            ],
          },
        }],
      } as unknown as DocumentNode;
  }
} 