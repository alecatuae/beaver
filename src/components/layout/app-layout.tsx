"use client";

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';

type AppLayoutProps = {
  children: React.ReactNode;
};

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar com navegação principal */}
      <Sidebar 
        isExpanded={sidebarExpanded} 
        onToggle={() => setSidebarExpanded(!sidebarExpanded)} 
      />
      
      {/* Conteúdo principal */}
      <div className={cn(
        "flex flex-col flex-1 transition-all duration-300 ease-in-out",
        sidebarExpanded ? "md:ml-64" : "md:ml-20"
      )}>
        {/* Header com navegação contextual */}
        <Header />
        
        {/* Área de conteúdo principal */}
        <main className="flex-1 overflow-auto p-6 bg-background">
          <div className="container mx-auto max-w-6xl">
            {children}
          </div>
        </main>
        
        {/* Footer com informações e links rápidos */}
        <Footer />
      </div>
    </div>
  );
} 