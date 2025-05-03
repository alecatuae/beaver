import { useQuery, QueryHookOptions, DocumentNode, OperationVariablesMissing } from '@apollo/client';

/**
 * Opções para configuração de campos a serem incluídos ou excluídos na consulta
 */
export interface OptimizedQueryOptions {
  /**
   * Define quais campos devem ser incluídos na consulta
   * As chaves representam os campos e os valores booleanos indicam se devem ser incluídos
   */
  include?: Record<string, boolean>;
  
  /**
   * Define quais campos devem ser excluídos da consulta
   * As chaves representam os campos e os valores booleanos indicam se devem ser excluídos
   */
  skip?: Record<string, boolean>;
}

/**
 * Hook personalizado que estende o useQuery do Apollo Client para suportar
 * otimização de consultas através das diretivas @include e @skip
 * 
 * @param query Documento GraphQL com a consulta
 * @param optimizeOptions Configurações de campos a incluir ou excluir
 * @param options Opções padrão do Apollo useQuery
 * @returns O mesmo resultado que o hook useQuery do Apollo
 */
export function useOptimizedQuery<TData = any, TVariables = OperationVariablesMissing>(
  query: DocumentNode,
  optimizeOptions: OptimizedQueryOptions = {},
  options?: QueryHookOptions<TData, TVariables>
) {
  // Mescla as variáveis padrão com as variáveis de otimização (include/skip)
  const mergedVariables = {
    ...(options?.variables || {}),
    // Adiciona as variáveis de inclusão
    ...(optimizeOptions.include || {}),
    // Adiciona as variáveis de exclusão
    ...(optimizeOptions.skip || {}),
  } as TVariables;

  // Retorna o resultado da consulta com as variáveis mescladas
  return useQuery<TData, TVariables>(query, {
    ...options,
    variables: mergedVariables,
  });
}

/**
 * Hook otimizado para carregar apenas dados essenciais em uma lista
 * 
 * @param query Documento GraphQL com a consulta
 * @param options Opções padrão do Apollo useQuery
 * @returns O mesmo resultado que o hook useQuery do Apollo
 */
export function useListQuery<TData = any, TVariables = OperationVariablesMissing>(
  query: DocumentNode,
  options?: QueryHookOptions<TData, TVariables>
) {
  // Define otimizações específicas para listas
  const optimizeOptions: OptimizedQueryOptions = {
    // Nas listas, não carrega detalhes completos
    skip: {
      includeInstances: true,
      includeRelationships: true,
      includeFullComponents: true,
      includeFullReviewers: true
    }
  };
  
  return useOptimizedQuery<TData, TVariables>(query, optimizeOptions, options);
}

/**
 * Hook otimizado para carregar dados detalhados de um item específico
 * 
 * @param query Documento GraphQL com a consulta
 * @param options Opções padrão do Apollo useQuery
 * @returns O mesmo resultado que o hook useQuery do Apollo
 */
export function useDetailQuery<TData = any, TVariables = OperationVariablesMissing>(
  query: DocumentNode,
  options?: QueryHookOptions<TData, TVariables>
) {
  // Define otimizações específicas para detalhes
  const optimizeOptions: OptimizedQueryOptions = {
    // Em detalhes, carrega tudo
    include: {
      includeInstances: true,
      includeRelationships: true,
      includeFullComponents: true,
      includeFullReviewers: true
    }
  };
  
  return useOptimizedQuery<TData, TVariables>(query, optimizeOptions, options);
} 