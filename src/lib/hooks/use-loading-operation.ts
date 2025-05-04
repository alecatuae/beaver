import { useState, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';

/**
 * Tipos de operação para rastreamento de desempenho
 */
export type OperationType = 
  | 'query'          // Consulta de dados
  | 'mutation'       // Operação de criação/atualização
  | 'delete'         // Operação de exclusão
  | 'import'         // Importação de dados
  | 'export'         // Exportação de dados
  | 'calculation'    // Cálculos e processamento
  | 'render'         // Renderização de componentes complexos
  | 'file'           // Operações com arquivos
  | 'network'        // Operações de rede diversas
  | 'authentication' // Processos de autenticação
  | 'other';         // Outras operações não categorizadas

export interface OperationOptions {
  /**
   * ID único da operação para referência (opcional)
   */
  id?: string;

  /**
   * Nome amigável da operação para exibição
   */
  name: string;

  /**
   * Tipo da operação para análise de desempenho e tratamento específico
   */
  type?: OperationType;

  /**
   * Tempo estimado em milissegundos para a operação completar
   * Usado para feedback visual apropriado
   */
  estimatedTime?: number;

  /**
   * Se deve mostrar toast de sucesso ao concluir
   */
  showSuccessToast?: boolean;

  /**
   * Mensagem personalizada para o toast de sucesso
   */
  successMessage?: string;

  /**
   * Se deve mostrar toast de erro ao falhar
   */
  showErrorToast?: boolean;

  /**
   * Mensagem personalizada para o toast de erro
   */
  errorMessage?: string;

  /**
   * Callback a ser chamado quando a operação iniciar
   */
  onStart?: () => void;

  /**
   * Callback a ser chamado quando a operação for bem-sucedida
   */
  onSuccess?: (result: any) => void;

  /**
   * Callback a ser chamado quando a operação falhar
   */
  onError?: (error: any) => void;

  /**
   * Callback a ser chamado quando a operação terminar (sucesso ou erro)
   */
  onComplete?: () => void;
}

export interface UseLoadingOperationResult<T = any> {
  /**
   * Se a operação está em andamento
   */
  loading: boolean;

  /**
   * Erro ocorrido, se houver
   */
  error: Error | null;

  /**
   * Resultado da operação bem-sucedida
   */
  result: T | null;

  /**
   * Função para executar a operação com feedback visual
   */
  execute: <R = T>(
    operation: (() => Promise<R>) | Promise<R>, 
    overrideOptions?: Partial<OperationOptions>
  ) => Promise<R | null>;

  /**
   * Função para redefinir o estado da operação
   */
  reset: () => void;

  /**
   * Tempo decorrido em milissegundos desde o início da operação
   * (0 se não estiver em execução)
   */
  elapsedTime: number;

  /**
   * Porcentagem estimada de conclusão com base no tempo estimado
   * (se definido, caso contrário indeterminado)
   */
  progressPercentage: number;
}

/**
 * Hook para gerenciar operações de longa duração com feedback visual
 * 
 * @param defaultOptions Opções padrão para todas as operações executadas através deste hook
 * @returns Utilitários para executar e monitorar operações de longa duração
 */
export function useLoadingOperation<T = any>(
  defaultOptions?: OperationOptions
): UseLoadingOperationResult<T> {
  // Estado local
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [result, setResult] = useState<T | null>(null);
  const [startTime, setStartTime] = useState<number>(0);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [progressPercentage, setProgressPercentage] = useState<number>(0);
  
  // Hook do toast para feedback visual
  const { toast } = useToast();
  
  // Função para atualizar o progresso durante uma operação
  const updateProgress = useCallback((estimatedTime?: number) => {
    if (!loading || !startTime) return;
    
    const current = Date.now();
    const elapsed = current - startTime;
    setElapsedTime(elapsed);
    
    if (estimatedTime && estimatedTime > 0) {
      const percentage = Math.min(Math.floor((elapsed / estimatedTime) * 100), 99);
      setProgressPercentage(percentage);
    }
    
    // Continua atualizando enquanto a operação estiver em andamento
    if (loading) {
      requestAnimationFrame(() => updateProgress(estimatedTime));
    }
  }, [loading, startTime]);
  
  // Redefinir o estado da operação
  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setResult(null);
    setStartTime(0);
    setElapsedTime(0);
    setProgressPercentage(0);
  }, []);
  
  // Executar operação com feedback
  const execute = useCallback(async <R = T>(
    operation: (() => Promise<R>) | Promise<R>,
    overrideOptions?: Partial<OperationOptions>
  ): Promise<R | null> => {
    // Mesclar opções padrão com override
    const options: OperationOptions = {
      name: 'Operação',
      type: 'other',
      showSuccessToast: false,
      showErrorToast: true,
      ...(defaultOptions || {}),
      ...(overrideOptions || {})
    };
    
    try {
      // Iniciar operação
      setLoading(true);
      setError(null);
      setStartTime(Date.now());
      options.onStart?.();
      
      // Iniciar monitoramento de progresso
      if (options.estimatedTime && options.estimatedTime > 0) {
        updateProgress(options.estimatedTime);
      }
      
      // Executar a operação
      const operationPromise = typeof operation === 'function' 
        ? operation() 
        : operation;
      
      const operationResult = await operationPromise;
      
      // Registrar sucesso
      setResult(operationResult as unknown as T);
      
      // Feedback visual de sucesso
      if (options.showSuccessToast) {
        toast({
          title: "Operação concluída",
          description: options.successMessage || `${options.name} foi concluída com sucesso.`,
          variant: "default",
        });
      }
      
      // Callback de sucesso
      options.onSuccess?.(operationResult);
      
      return operationResult;
    } catch (err) {
      // Registrar erro
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      
      // Feedback visual de erro
      if (options.showErrorToast) {
        toast({
          title: "Erro na operação",
          description: options.errorMessage || `Ocorreu um erro ao executar ${options.name}: ${error.message}`,
          variant: "destructive",
        });
      }
      
      // Callback de erro
      options.onError?.(error);
      
      return null;
    } finally {
      // Finalizar operação
      setLoading(false);
      setElapsedTime(Date.now() - startTime);
      setProgressPercentage(100);
      
      // Callback de conclusão
      options.onComplete?.();
    }
  }, [defaultOptions, toast, updateProgress, startTime]);
  
  return {
    loading,
    error,
    result,
    execute,
    reset,
    elapsedTime,
    progressPercentage,
  };
} 