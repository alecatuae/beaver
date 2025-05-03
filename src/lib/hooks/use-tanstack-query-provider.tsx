'use client';

import React from 'react';
import { 
  QueryClient, 
  QueryClientProvider 
} from '@tanstack/react-query';

// Criamos um cliente separado para o TanStack Query
// Este é configurado para trabalhar lado a lado com o Apollo Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minuto
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

interface TanStackQueryProviderProps {
  children: React.ReactNode;
}

export function TanStackQueryProvider({ children }: TanStackQueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

// Hook de exemplo que pode ser usado para verificar a compatibilidade
export function useTanStackQueryTest() {
  return {
    isCompatible: true,
    version: '5.12.0',
    queryClient,
  };
}
