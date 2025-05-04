'use client';

import React, { createContext, useContext, useCallback, ReactNode } from 'react';
import useErrorHandler from '../hooks/use-error-handler';
import { ErrorCode, ErrorCodes } from '../error-codes';
import { ErrorMessage, ErrorMessageFromCode } from '../../components/ui/error-message';

// Interface do contexto de erro
interface ErrorContextType {
  error: ErrorCode | null;
  isLoading: boolean;
  setError: (error: ErrorCode | null) => void;
  clearError: () => void;
  handleError: (error: unknown, context?: any) => ErrorCode;
  executeWithErrorHandling: <T>(fn: () => Promise<T>, context?: any) => Promise<T | null>;
}

// Cria o contexto com valores iniciais
const ErrorContext = createContext<ErrorContextType>({
  error: null,
  isLoading: false,
  setError: () => {},
  clearError: () => {},
  handleError: () => ErrorCodes.SYSTEM_INTERNAL_ERROR,
  executeWithErrorHandling: async () => null,
});

// Interface das props do provedor
interface ErrorProviderProps {
  children: ReactNode;
  /** Se true, exibe erros globais automaticamente */
  showGlobalErrors?: boolean;
}

/**
 * Provedor de contexto de erro para a aplicação
 */
export const ErrorProvider: React.FC<ErrorProviderProps> = ({
  children,
  showGlobalErrors = true,
}) => {
  const errorHandler = useErrorHandler();
  
  return (
    <ErrorContext.Provider value={errorHandler}>
      {children}
      
      {/* Exibe mensagem de erro global quando existir e showGlobalErrors for true */}
      {showGlobalErrors && errorHandler.error && (
        <ErrorMessageFromCode
          error={errorHandler.error}
          variant="global"
          onClose={errorHandler.clearError}
        />
      )}
    </ErrorContext.Provider>
  );
};

/**
 * Hook para acessar o contexto de erro na aplicação
 */
export const useError = () => {
  const context = useContext(ErrorContext);
  
  if (!context) {
    throw new Error('useError deve ser usado dentro de um ErrorProvider');
  }
  
  return context;
};

export default ErrorContext; 