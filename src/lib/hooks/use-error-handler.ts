import { useCallback, useState } from 'react';
import { ErrorCode, ErrorCodes, ErrorModule, ErrorSource, ErrorType, createError, customizeError } from '../error-codes';

/**
 * Log level para o sistema de logs
 */
export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

/**
 * Interface para os dados de contexto de erro
 */
interface ErrorContext {
  component?: string;
  action?: string;
  inputs?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

/**
 * Hook para gerenciamento centralizado de erros
 */
export function useErrorHandler() {
  const [error, setError] = useState<ErrorCode | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Função para registrar um erro nos logs
   */
  const logError = useCallback((
    level: LogLevel,
    errorObject: Error | ErrorCode | unknown,
    context?: ErrorContext
  ) => {
    // Remove dados sensíveis do contexto antes de logar
    const sanitizedContext = context ? JSON.parse(JSON.stringify(context)) : {};
    
    // Se existe um campo 'password', 'senha', 'secret', etc., substitui por string mascarada
    if (sanitizedContext.inputs) {
      Object.keys(sanitizedContext.inputs).forEach(key => {
        if (/pass|senha|secret|token|key/i.test(key)) {
          sanitizedContext.inputs[key] = '***********';
        }
      });
    }

    // Formato do log será diferente em produção e desenvolvimento
    if (process.env.NODE_ENV === 'production') {
      // Em produção, utiliza formato estruturado para facilitar a análise
      const logData = {
        level,
        timestamp: new Date().toISOString(),
        errorCode: errorObject instanceof Error 
          ? 'UNCAUGHT_ERROR' 
          : (errorObject as ErrorCode)?.code || 'UNKNOWN_ERROR',
        message: errorObject instanceof Error 
          ? errorObject.message 
          : (errorObject as ErrorCode)?.message || String(errorObject),
        stack: errorObject instanceof Error ? errorObject.stack : undefined,
        context: sanitizedContext
      };
      
      console[level](JSON.stringify(logData));
    } else {
      // Em desenvolvimento, formato mais legível
      console.group(`[${level.toUpperCase()}] ${new Date().toISOString()}`);
      
      if (errorObject instanceof Error) {
        console[level]('Error:', errorObject.message);
        console[level]('Stack:', errorObject.stack);
      } else if ((errorObject as ErrorCode)?.code) {
        const errorCode = errorObject as ErrorCode;
        console[level](`${errorCode.code}: ${errorCode.message}`);
        if (errorCode.solution) {
          console[level]('Solução sugerida:', errorCode.solution);
        }
      } else {
        console[level]('Error:', errorObject);
      }
      
      if (Object.keys(sanitizedContext).length > 0) {
        console[level]('Contexto:', sanitizedContext);
      }
      
      console.groupEnd();
    }
  }, []);

  /**
   * Manipula um erro GraphQL
   */
  const handleGraphQLError = useCallback((
    graphQLError: any,
    context?: ErrorContext
  ): ErrorCode => {
    // Tenta extrair código de erro do formato ERR-XXXX-YY-ZZ
    const errorCodeMatch = graphQLError.message?.match(/ERR-\d{4}-\d{2}-\d{2}/);
    const errorCode = errorCodeMatch ? errorCodeMatch[0] : null;
    
    // Se encontrou código no formato correto, usa a mensagem original
    if (errorCode) {
      const customError = createError(
        parseInt(errorCode.substring(4, 8)),
        parseInt(errorCode.substring(9, 11)),
        parseInt(errorCode.substring(12, 14)),
        graphQLError.message.replace(errorCode, '').trim()
      );
      
      logError('error', customError, context);
      return customError;
    }
    
    // Se não encontrou código, gera um erro genérico
    const defaultError = customizeError(
      ErrorCodes.SYSTEM_INTERNAL_ERROR,
      graphQLError.message || 'Erro na comunicação com o servidor',
      'Tente novamente mais tarde. Se o problema persistir, contate o suporte técnico.'
    );
    
    logError('error', defaultError, {
      ...context,
      originalError: graphQLError
    });
    
    return defaultError;
  }, [logError]);

  /**
   * Manipula um erro de validação
   */
  const handleValidationError = useCallback((
    fieldErrors: Record<string, string>,
    context?: ErrorContext
  ): ErrorCode => {
    // Cria mensagem de erro combinada com todos os erros de validação
    const errorMessage = Object.entries(fieldErrors)
      .map(([field, error]) => `${field}: ${error}`)
      .join('; ');
    
    const validationError = createError(
      ErrorModule.SYSTEM,
      ErrorType.VALIDATION,
      ErrorSource.CLIENT,
      `Falha na validação: ${errorMessage}`,
      'Verifique os campos destacados e corrija os erros indicados.'
    );
    
    logError('warn', validationError, context);
    return validationError;
  }, [logError]);

  /**
   * Manipula qualquer tipo de erro e retorna um ErrorCode padronizado
   */
  const handleError = useCallback((
    error: unknown,
    context?: ErrorContext
  ): ErrorCode => {
    if (!error) {
      const unknownError = customizeError(
        ErrorCodes.SYSTEM_INTERNAL_ERROR,
        'Ocorreu um erro desconhecido',
        'Tente novamente mais tarde ou contate o suporte técnico.'
      );
      
      logError('error', unknownError, context);
      return unknownError;
    }
    
    // Se já é um ErrorCode, apenas loga e retorna
    if ((error as ErrorCode).code && (error as ErrorCode).message) {
      logError('error', error as ErrorCode, context);
      return error as ErrorCode;
    }
    
    // Se é um erro GraphQL (com estrutura específica)
    if ((error as any).graphQLErrors || (error as any).networkError) {
      return handleGraphQLError(error, context);
    }
    
    // Se é um Error padrão do JavaScript
    if (error instanceof Error) {
      const systemError = createError(
        ErrorModule.SYSTEM,
        ErrorType.INTERNAL,
        ErrorSource.PROCESS,
        error.message,
        'Tente novamente mais tarde. Se o problema persistir, contate o suporte técnico.'
      );
      
      logError('error', error, {
        ...context,
        stack: error.stack
      });
      
      return systemError;
    }
    
    // Caso genérico
    const genericError = customizeError(
      ErrorCodes.SYSTEM_INTERNAL_ERROR,
      typeof error === 'string' ? error : 'Ocorreu um erro no sistema',
      'Tente novamente mais tarde. Se o problema persistir, contate o suporte técnico.'
    );
    
    logError('error', genericError, {
      ...context,
      originalError: error
    });
    
    return genericError;
  }, [logError, handleGraphQLError]);

  /**
   * Executa uma função assíncrona com tratamento de erro e estados de loading
   */
  const executeWithErrorHandling = useCallback(async <T>(
    fn: () => Promise<T>,
    context?: ErrorContext
  ): Promise<T | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await fn();
      setIsLoading(false);
      return result;
    } catch (caughtError) {
      const handledError = handleError(caughtError, context);
      setError(handledError);
      setIsLoading(false);
      return null;
    }
  }, [handleError]);

  /**
   * Limpa o estado de erro atual
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    error,
    isLoading,
    setError,
    clearError,
    handleError,
    handleGraphQLError,
    handleValidationError,
    logError,
    executeWithErrorHandling
  };
}

export default useErrorHandler; 