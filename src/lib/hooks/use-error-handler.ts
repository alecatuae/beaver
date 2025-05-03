import { useState, useCallback } from 'react';
import { ErrorDetails, CommonErrors, createCustomError } from '@/lib/error-codes';

interface ErrorHandlerOptions {
  logToConsole?: boolean;
  logToServer?: boolean;
  includeContext?: boolean;
}

const defaultOptions: ErrorHandlerOptions = {
  logToConsole: true,
  logToServer: process.env.NODE_ENV === 'production',
  includeContext: process.env.NODE_ENV === 'development'
};

/**
 * Hook useErrorHandler
 * 
 * Hook personalizado para gerenciar erros e exibição de mensagens.
 * Implementa o sistema padronizado de mensagens de erro conforme guia de estilo.
 * 
 * @param options - Opções de configuração do tratamento de erros
 */
export function useErrorHandler(options: ErrorHandlerOptions = {}) {
  const [error, setError] = useState<ErrorDetails | null>(null);
  const config = { ...defaultOptions, ...options };

  /**
   * Função para log de erros no console e/ou servidor
   */
  const logError = useCallback((errorDetails: ErrorDetails, originalError?: any) => {
    if (config.logToConsole) {
      const timestamp = new Date().toISOString();
      
      // Criar estrutura do log conforme especificado no guia de estilo
      const logData = {
        timestamp,
        level: 'error',
        errorCode: errorDetails.errorCode,
        component: errorDetails.context?.component || 'unknown',
        context: config.includeContext ? errorDetails.context : { origin: 'error handler' },
        message: `${errorDetails.title}: ${errorDetails.description}`,
        statusCode: errorDetails.statusCode,
        source: errorDetails.errorCode.split('-')[3] || 'unknown'
      };
      
      // Log estruturado para depuração
      console.error('Error:', logData);
      
      // Se tiver erro original, logar stack trace
      if (originalError && originalError.stack) {
        console.error('Original error:', originalError);
      }
    }
    
    // Enviar para o servidor em produção se configurado
    if (config.logToServer) {
      // Implementação de envio para API de logs ou ferramentas como Sentry
      // Remoção de dados sensíveis conforme recomendado
      try {
        // Sanitizar dados sensíveis
        const safeContext = errorDetails.context 
          ? Object.fromEntries(
              Object.entries(errorDetails.context).filter(
                ([key]) => !['password', 'token', 'secret'].includes(key.toLowerCase())
              )
            )
          : {};
        
        // Mock da implementação do envio para servidor
        // fetch('/api/logs', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify({
        //     errorCode: errorDetails.errorCode,
        //     message: errorDetails.description,
        //     context: safeContext,
        //     timestamp: new Date().toISOString()
        //   })
        // });
      } catch (e) {
        // Falha silenciosa para não interromper a UI
        console.error('Failed to send error log to server', e);
      }
    }
  }, [config]);

  /**
   * Função para lidar com erros da API GraphQL
   */
  const handleGraphQLError = useCallback((graphQLError: any) => {
    // Tentar extrair o código de erro do formato padrão
    let errorCode = 'ERR-9500-99-API'; // Código padrão se não for possível identificar
    let errorMessage = 'Ocorreu um erro desconhecido';
    let solution = 'Tente novamente ou contate o suporte técnico.';
    let statusCode = 500;
    
    // Verificar se há extensions com código de erro
    if (graphQLError.extensions?.code) {
      // Verificar se o código segue o padrão ERR-XXXX-YY-ZZ
      const codeMatch = graphQLError.extensions.code.match(/ERR-\d{4}-\d{2}-[A-Z]{2,3}/);
      if (codeMatch) {
        errorCode = codeMatch[0];
      }
      
      // Obter status code se disponível
      statusCode = graphQLError.extensions.statusCode || 500;
    }
    
    // Extrair mensagem significativa
    if (graphQLError.message) {
      // Remover o prefixo de código de erro se presente
      errorMessage = graphQLError.message.replace(/^ERR-\d{4}-\d{2}-[A-Z]{2,3}:\s*/, '');
    }
    
    // Criar detalhes de erro padronizados
    const errorDetails: ErrorDetails = {
      errorCode,
      title: 'Erro: Falha na operação',
      description: errorMessage,
      solution,
      statusCode,
      context: {
        component: 'GraphQL',
        originalError: graphQLError
      }
    };
    
    // Registrar e definir o erro
    logError(errorDetails, graphQLError);
    setError(errorDetails);
    
    return errorDetails;
  }, [logError]);

  /**
   * Função para lidar com erros de validação
   */
  const handleValidationError = useCallback((
    fieldErrors: Record<string, string>,
    formName: string = 'formulário'
  ) => {
    // Criar mensagem com os erros de campo
    const fieldsWithErrors = Object.keys(fieldErrors).join(', ');
    
    const errorDetails = createCustomError(CommonErrors.VALIDATION_FAILED, {
      description: `Alguns campos no ${formName} contêm erros.`,
      solution: `Verifique os seguintes campos: ${fieldsWithErrors}.`,
      context: {
        component: formName,
        fieldErrors
      }
    });
    
    logError(errorDetails);
    setError(errorDetails);
    
    return errorDetails;
  }, [logError]);

  /**
   * Função genérica para tratar qualquer erro
   */
  const handleError = useCallback((
    errorOrDetails: Error | ErrorDetails | string,
    contextInfo: Record<string, any> = {}
  ) => {
    let errorDetails: ErrorDetails;
    
    // Determinar tipo do erro e formatar adequadamente
    if (typeof errorOrDetails === 'string') {
      // String simples de mensagem de erro
      errorDetails = createCustomError(CommonErrors.OPERATION_FAILED, {
        description: errorOrDetails,
        context: contextInfo
      });
    } else if ('errorCode' in errorOrDetails) {
      // Já é um ErrorDetails
      errorDetails = {
        ...errorOrDetails,
        context: { ...errorOrDetails.context, ...contextInfo }
      };
    } else {
      // Erro JavaScript padrão
      errorDetails = createCustomError(CommonErrors.OPERATION_FAILED, {
        description: errorOrDetails.message,
        context: {
          ...contextInfo,
          error: errorOrDetails
        }
      });
    }
    
    logError(errorDetails, errorOrDetails instanceof Error ? errorOrDetails : undefined);
    setError(errorDetails);
    
    return errorDetails;
  }, [logError]);

  /**
   * Limpar o erro atual
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    error,
    setError,
    clearError,
    handleError,
    handleGraphQLError,
    handleValidationError
  };
} 