"use client";

import React, { useMemo } from 'react';
import { ApolloProvider } from '@apollo/client';
import { createApolloClient } from '@/lib/apollo-client';
import { ThemeProvider } from '@/components/theme-provider';
import { ErrorProvider } from '@/lib/contexts/error-context';
import { useErrorHandler } from '@/lib/hooks/use-error-handler';

export function Providers({ children }: { children: React.ReactNode }) {
  // Criar manipulador de erros
  const errorHandler = useErrorHandler();
  
  // Criar cliente Apollo configurado com o manipulador de erros
  const client = useMemo(() => {
    return createApolloClient(errorHandler.handleError);
  }, [errorHandler.handleError]);

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      <ErrorProvider>
        <ApolloProvider client={client}>
          {children}
        </ApolloProvider>
      </ErrorProvider>
    </ThemeProvider>
  );
} 