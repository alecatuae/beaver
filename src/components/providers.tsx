"use client";

import React from 'react';
import { ApolloProvider } from '@apollo/client';
import { client } from '@/lib/graphql';
import { ThemeProvider } from '@/components/theme-provider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      <ApolloProvider client={client}>
        {children}
      </ApolloProvider>
    </ThemeProvider>
  );
} 