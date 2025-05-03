import { onError } from '@apollo/client/link/error';
import { ErrorDetails, CommonErrors, createCustomError } from './error-codes';

/**
 * Função para analisar o erro GraphQL e extrair os detalhes formatados
 * 
 * @param graphQLError Erro da API GraphQL
 * @returns Detalhes do erro formatados
 */
export function parseGraphQLError(graphQLError: any): ErrorDetails {
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
  return {
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
}

/**
 * Link de erro para o Apollo Client que integra com o sistema de mensagens de erro
 * 
 * @param errorHandler Função para lidar com os erros (normalmente do hook useError)
 */
export const createErrorLink = (errorHandler?: (error: ErrorDetails) => void) => {
  return onError(({ graphQLErrors, networkError }) => {
    // Lidar com erros GraphQL
    if (graphQLErrors && graphQLErrors.length > 0) {
      const firstError = graphQLErrors[0];
      const errorDetails = parseGraphQLError(firstError);
      
      // Se tiver um manipulador de erro, usar ele
      if (errorHandler) {
        errorHandler(errorDetails);
      }
      
      // Sempre logar no console
      console.error('GraphQL Error:', errorDetails);
    }

    // Lidar com erros de rede
    if (networkError) {
      const errorDetails = createCustomError(CommonErrors.CONNECTION_FAILED, {
        description: 'Não foi possível conectar à API.',
        solution: 'Verifique sua conexão de rede ou tente novamente mais tarde.',
        context: {
          networkError
        }
      });
      
      // Se tiver um manipulador de erro, usar ele
      if (errorHandler) {
        errorHandler(errorDetails);
      }
      
      // Sempre logar no console
      console.error('Network Error:', errorDetails);
    }
  });
}; 