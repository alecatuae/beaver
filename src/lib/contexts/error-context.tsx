'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useErrorHandler } from '@/lib/hooks/use-error-handler';
import { ErrorDetails } from '@/lib/error-codes';
import { ErrorMessage } from '@/components/ui/error-message';

interface ErrorContextType {
  error: ErrorDetails | null;
  setError: (error: ErrorDetails | null) => void;
  clearError: () => void;
  handleError: (errorOrDetails: Error | ErrorDetails | string, contextInfo?: Record<string, any>) => ErrorDetails;
  handleGraphQLError: (graphQLError: any) => ErrorDetails;
  handleValidationError: (fieldErrors: Record<string, string>, formName?: string) => ErrorDetails;
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

interface ErrorProviderProps {
  children: ReactNode;
}

/**
 * Provedor de contexto de erros
 * 
 * Gerencia os erros de forma global na aplicação.
 */
export function ErrorProvider({ children }: ErrorProviderProps) {
  const errorHandler = useErrorHandler();

  return (
    <ErrorContext.Provider value={errorHandler}>
      {/* Exibir erro global se existir */}
      {errorHandler.error && (
        <ErrorMessage 
          error={errorHandler.error} 
          onClose={errorHandler.clearError} 
          className="fixed top-4 right-4 z-50 max-w-md shadow-lg"
        />
      )}
      {children}
    </ErrorContext.Provider>
  );
}

/**
 * Hook useError
 * 
 * Fornece acesso ao contexto de erros da aplicação.
 */
export function useError(): ErrorContextType {
  const context = useContext(ErrorContext);
  
  if (context === undefined) {
    throw new Error('useError must be used within an ErrorProvider');
  }
  
  return context;
} 