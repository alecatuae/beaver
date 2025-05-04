import { useEffect, useCallback } from 'react';
import { useApolloClient, DocumentNode, gql } from '@apollo/client';
import { frequentlyAccessedIds } from '../apollo-client';

// Limite de quantas entidades serão precarregadas automaticamente
const MAX_PRELOAD_ENTITIES = 10;

// Fragmentos básicos para cada tipo de entidade para precarregamento
const PRELOAD_FRAGMENTS = {
  Component: gql`
    fragment PreloadComponentFields on Component {
      id
      name
      description
      status
      createdAt
      team {
        id
        name
      }
      category {
        id
        name
      }
      tags
      totalInstances
    }
  `,
  ADR: gql`
    fragment PreloadADRFields on ADR {
      id
      title
      description
      status
      createdAt
      approvedByAll
      tags
    }
  `,
  Team: gql`
    fragment PreloadTeamFields on Team {
      id
      name
      description
    }
  `,
  Category: gql`
    fragment PreloadCategoryFields on Category {
      id
      name
      description
    }
  `,
};

// Consultas para precarregar entidades específicas
const PRELOAD_QUERIES = {
  Component: gql`
    query PreloadComponent($id: Int!) {
      component(id: $id) {
        ...PreloadComponentFields
      }
    }
    ${PRELOAD_FRAGMENTS.Component}
  `,
  ADR: gql`
    query PreloadADR($id: Int!) {
      adr(id: $id) {
        ...PreloadADRFields
      }
    }
    ${PRELOAD_FRAGMENTS.ADR}
  `,
  Team: gql`
    query PreloadTeam($id: Int!) {
      team(id: $id) {
        ...PreloadTeamFields
      }
    }
    ${PRELOAD_FRAGMENTS.Team}
  `,
  Category: gql`
    query PreloadCategory($id: Int!) {
      category(id: $id) {
        ...PreloadCategoryFields
      }
    }
    ${PRELOAD_FRAGMENTS.Category}
  `,
};

// Tipos suportados para precarregamento
const SUPPORTED_TYPES = ['Component', 'ADR', 'Team', 'Category'];

/**
 * Hook que monitora as entidades frequentemente acessadas e as precarrega
 * 
 * @param options Opções de configuração
 */
export function useIntelligentPreloading(options = {
  enabled: true,
  interval: 5000, // Intervalo em ms para verificar entidades frequentes
  prefetchLimit: MAX_PRELOAD_ENTITIES
}) {
  const client = useApolloClient();
  
  // Função para calcular as entidades mais frequentemente acessadas
  const calculateMostFrequentEntities = useCallback(() => {
    const entities = frequentlyAccessedIds();
    
    // Contar frequência de cada entidade por tipo e id
    const frequencyMap = new Map<string, number>();
    entities.forEach(entity => {
      const key = `${entity.type}:${entity.id}`;
      frequencyMap.set(key, (frequencyMap.get(key) || 0) + 1);
    });
    
    // Converter para array e ordenar por frequência
    const sortedEntities = [...frequencyMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, options.prefetchLimit)
      .map(([key]) => {
        const [type, id] = key.split(':');
        return { type, id: isNaN(Number(id)) ? id : Number(id) };
      })
      .filter(entity => SUPPORTED_TYPES.includes(entity.type));
    
    return sortedEntities;
  }, [options.prefetchLimit]);
  
  // Função para precarregar uma entidade específica
  const preloadEntity = useCallback(async (type: string, id: string | number) => {
    // Verificar se este tipo é suportado
    if (!SUPPORTED_TYPES.includes(type) || !PRELOAD_QUERIES[type as keyof typeof PRELOAD_QUERIES]) {
      return;
    }
    
    try {
      // Consulta correspondente ao tipo
      const query = PRELOAD_QUERIES[type as keyof typeof PRELOAD_QUERIES];
      
      // Precarregar a entidade
      await client.query({
        query,
        variables: { id },
        fetchPolicy: 'network-only',
      });
      
      console.debug(`[Preload] Precarregada entidade ${type}:${id}`);
    } catch (error) {
      console.error(`[Preload] Erro ao precarregar ${type}:${id}`, error);
    }
  }, [client]);
  
  // Efeito para iniciar o precarregamento inteligente
  useEffect(() => {
    if (!options.enabled) return;
    
    // Função que executa o precarregamento
    const executePreloading = async () => {
      const frequentEntities = calculateMostFrequentEntities();
      
      // Precarregar em sequência para não sobrecarregar
      for (const entity of frequentEntities) {
        await preloadEntity(entity.type, entity.id);
      }
    };
    
    // Executar imediatamente e depois periodicamente
    executePreloading();
    
    // Configurar intervalo para verificação periódica
    const intervalId = setInterval(executePreloading, options.interval);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [options.enabled, options.interval, calculateMostFrequentEntities, preloadEntity]);
  
  // Expor método para precarregar manualmente uma entidade
  return {
    preloadEntity,
    resetFrequentEntities: () => frequentlyAccessedIds([]),
  };
}

/**
 * Hook para precarregar dados quando o usuário está prestes a interagir com um elemento
 * Por exemplo, ao passar o mouse sobre um item de lista, precarregar seus detalhes
 */
export function useHoverPreloading<T = any>(
  preloadQuery: DocumentNode,
  getPreloadVariables: (item: T) => Record<string, any>
) {
  const client = useApolloClient();
  
  // Função para precarregar ao passar o mouse
  const handleHover = useCallback((item: T) => {
    if (!item) return;
    
    const variables = getPreloadVariables(item);
    client.query({
      query: preloadQuery,
      variables,
      fetchPolicy: 'cache-first', // Usar cache se disponível, senão buscar da rede
    }).catch(e => {
      // Silenciosamente falhar, pois é apenas precarregamento
      console.debug('Erro no precarregamento por hover:', e);
    });
  }, [client, preloadQuery, getPreloadVariables]);
  
  return {
    handleMouseEnter: handleHover,
  };
} 