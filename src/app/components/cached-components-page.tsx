"use client";

import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, RefreshCw, Clock, CloudLightning } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useApolloClient } from '@apollo/client';
import { GET_OPTIMIZED_COMPONENTS } from '@/lib/graphql-optimized';
import { GET_COMPONENT } from '@/lib/graphql-component';
import { useCachedQuery } from '@/lib/hooks/use-cache-strategies';
import { useIntelligentPreloading, useHoverPreloading } from '@/lib/hooks/use-intelligent-preloading';
import { ApolloCache } from '@apollo/client';

export default function CachedComponentsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedComponent, setSelectedComponent] = useState<any | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showPerformanceStats, setShowPerformanceStats] = useState(false);
  const [perfStats, setPerfStats] = useState<{ queryTime: number; cacheHits: number; cacheMisses: number }>({
    queryTime: 0,
    cacheHits: 0,
    cacheMisses: 0
  });
  
  const apolloClient = useApolloClient();
  
  // Hook para precarregamento inteligente
  const { preloadEntity } = useIntelligentPreloading({
    enabled: true,
    interval: 10000, // Verificar a cada 10 segundos
    prefetchLimit: 5   // Precarregar até 5 entidades populares
  });
  
  // Hook de consulta otimizada com cache
  const { 
    data, 
    loading, 
    error, 
    refetch, 
    networkStatus, 
    updateCache,
    clearCache
  } = useCachedQuery(
    GET_OPTIMIZED_COMPONENTS,
    {
      pagination: { page: currentPage, pageSize: 9 },
      search: searchTerm || undefined,
      includeTeam: true,
      includeCategory: true,
      includeTags: true
    },
    {
      notifyOnNetworkStatusChange: true,
      // Monitorar tempo de execução da consulta
      onCompleted: (data) => {
        if (showPerformanceStats) {
          const queryInfo = apolloClient.getObservableQueries();
          const cacheInfo = apolloClient.cache.extract();
          const cacheSize = Object.keys(cacheInfo).length;
          
          setPerfStats(prev => ({
            ...prev,
            cacheHits: prev.cacheHits + 1
          }));
        }
      }
    },
    // Configurações personalizadas de cache
    {
      staleTime: 5, // Considerar dados "frescos" por 5 minutos
      prefetch: true // Fazer prefetch ao montar o componente
    }
  );
  
  // Hook para precarregar detalhes ao passar o mouse
  const { handleMouseEnter } = useHoverPreloading(
    GET_COMPONENT,
    (component) => ({ id: component.id })
  );

  // Extrair dados da resposta
  const components = data?.components?.items || [];
  const pageInfo = data?.components?.pageInfo || { 
    totalItems: 0, 
    currentPage: 1, 
    totalPages: 0
  };

  // Efeito para simular medição de desempenho
  useEffect(() => {
    if (showPerformanceStats) {
      const startTime = performance.now();
      
      // Cronometrar a consulta
      const timer = setTimeout(() => {
        const endTime = performance.now();
        setPerfStats(prev => ({
          ...prev,
          queryTime: endTime - startTime
        }));
      }, 0);
      
      return () => {
        clearTimeout(timer);
      };
    }
  }, [data, showPerformanceStats]);

  // Função para atualizar manualmente o total de instâncias
  const updateTotalInstances = (componentId: number, newTotal: number) => {
    updateCache((cache: ApolloCache<any>, cachedData: any) => {
      // Encontrar o componente no cache
      const component = cachedData?.items?.find((c: any) => c.id === componentId);
      if (component) {
        // Atualizar localmente o total de instâncias
        component.totalInstances = newTotal;
      }
    });
  };

  // Componente de card para estatísticas de desempenho
  const PerformanceStats = () => (
    <Card className="mb-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-md flex items-center gap-2">
          <CloudLightning size={16} />
          Estatísticas de Desempenho
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Tempo de Consulta</p>
            <p className="text-2xl font-semibold">{perfStats.queryTime.toFixed(2)}ms</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Cache Hits</p>
            <p className="text-2xl font-semibold">{perfStats.cacheHits}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Cache Misses</p>
            <p className="text-2xl font-semibold">{perfStats.cacheMisses}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <AppLayout>
      <div className="pb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-semibold">Componentes (Com Cache)</h1>
            <p className="text-sm text-muted-foreground">
              Demonstração das estratégias de cache para queries
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline"
              size="sm"
              className="flex gap-1 items-center"
              onClick={() => setShowPerformanceStats(!showPerformanceStats)}
            >
              <Clock size={16} />
              {showPerformanceStats ? 'Ocultar Estatísticas' : 'Mostrar Estatísticas'}
            </Button>
          </div>
        </div>

        {/* Estatísticas de desempenho */}
        {showPerformanceStats && <PerformanceStats />}

        {/* Área de busca e controles */}
        <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
            <Input
              type="text"
              placeholder="Buscar componentes..."
              className="w-full pl-10 pr-4 py-2 border rounded-md focus:ring-1 focus:ring-primary focus:border-primary bg-background"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              title="Limpar cache"
              onClick={() => {
                clearCache();
                setPerfStats(prev => ({
                  ...prev,
                  cacheMisses: prev.cacheMisses + 1
                }));
              }}
            >
              Limpar Cache
            </Button>
            <Button 
              variant="outline" 
              onClick={() => refetch()} 
              title="Atualizar dados"
            >
              <RefreshCw size={16} />
            </Button>
          </div>
        </div>

        {/* Abas de modos de cache */}
        <Tabs defaultValue="standard" className="mb-6">
          <TabsList>
            <TabsTrigger value="standard">Cache Padrão</TabsTrigger>
            <TabsTrigger value="prefetch">Prefetch</TabsTrigger>
            <TabsTrigger value="intelligent">Inteligente</TabsTrigger>
          </TabsList>
          
          <TabsContent value="standard" className="pt-4">
            <p className="text-sm text-muted-foreground mb-4">
              Usando políticas de cache padrão. Os dados serão buscados do cache quando disponíveis.
            </p>
          </TabsContent>
          
          <TabsContent value="prefetch" className="pt-4">
            <p className="text-sm text-muted-foreground mb-4">
              Precarregamento ao passar o mouse. Passe o mouse sobre um componente para precarregar seus detalhes.
            </p>
          </TabsContent>
          
          <TabsContent value="intelligent" className="pt-4">
            <p className="text-sm text-muted-foreground mb-4">
              Precarregamento inteligente baseado no uso. Os componentes mais acessados são automaticamente precarregados.
            </p>
            <div className="grid grid-cols-3 gap-4 mb-4">
              {components.slice(0, 3).map((component: any) => (
                <Button 
                  key={component.id}
                  variant="outline"
                  className="text-sm"
                  onClick={() => preloadEntity('Component', component.id)}
                >
                  Precarregar {component.name}
                </Button>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Grid de componentes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading && !data ? (
            // Mostrar skeleton enquanto carrega inicialmente
            Array.from({ length: 6 }).map((_, index) => (
              <div 
                key={index} 
                className="bg-muted/30 animate-pulse rounded-lg h-48"
              />
            ))
          ) : error ? (
            <div className="col-span-full">
              <p className="text-destructive">Erro ao carregar componentes</p>
              <Button onClick={() => refetch()} className="mt-2">Tentar novamente</Button>
            </div>
          ) : components.length === 0 ? (
            <div className="col-span-full text-center py-8">
              <p className="text-muted-foreground">Nenhum componente encontrado.</p>
            </div>
          ) : (
            // Mostrar componentes
            components.map((component: any) => (
              <Card 
                key={component.id}
                className={`hover:border-primary cursor-pointer transition-all ${
                  selectedComponent?.id === component.id ? 'ring-1 ring-primary' : ''
                }`}
                onClick={() => setSelectedComponent(component)}
                onMouseEnter={() => handleMouseEnter(component)}
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-md">{component.name}</CardTitle>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      component.status === 'active' 
                        ? 'bg-success/20 text-success' 
                        : 'bg-muted/50 text-muted-foreground'
                    }`}>
                      {component.status === 'active' ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {component.description || 'Sem descrição.'}
                  </p>
                  
                  {/* Tags */}
                  {component.tags && component.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {component.tags.slice(0, 3).map((tag: string, idx: number) => (
                        <span
                          key={idx}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary/10 text-primary"
                        >
                          #{tag}
                        </span>
                      ))}
                      {component.tags.length > 3 && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-muted text-muted-foreground">
                          +{component.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                  
                  {/* Footer com informações adicionais */}
                  <div className="flex justify-between text-xs text-muted-foreground mt-2 pt-2 border-t">
                    {component.team && (
                      <span>{component.team.name}</span>
                    )}
                    
                    <span>
                      {component.totalInstances || 0} instância{component.totalInstances !== 1 ? 's' : ''}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Paginação */}
        {pageInfo.totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            <Button 
              variant="outline" 
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
            >
              Anterior
            </Button>
            <div className="flex items-center mx-2">
              <span className="text-sm">
                Página {currentPage} de {pageInfo.totalPages}
              </span>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              disabled={currentPage === pageInfo.totalPages}
              onClick={() => setCurrentPage(prev => prev + 1)}
            >
              Próxima
            </Button>
          </div>
        )}

        {/* Demonstração de atualização de cache */}
        {selectedComponent && (
          <div className="mt-8 p-4 border rounded-lg">
            <h2 className="text-xl font-semibold mb-4">
              Demonstração de Atualização de Cache
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Atualizar o total de instâncias do componente <strong>{selectedComponent.name}</strong> apenas no cache, 
              sem fazer uma requisição ao servidor.
            </p>
            
            <div className="flex items-center gap-4 mb-4">
              <p className="text-sm">Total atual: <strong>{selectedComponent.totalInstances || 0}</strong></p>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateTotalInstances(
                  selectedComponent.id, 
                  (selectedComponent.totalInstances || 0) + 1
                )}
              >
                Incrementar (+1)
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateTotalInstances(
                  selectedComponent.id, 
                  Math.max(0, (selectedComponent.totalInstances || 0) - 1)
                )}
                disabled={(selectedComponent.totalInstances || 0) <= 0}
              >
                Decrementar (-1)
              </Button>
            </div>
            
            <p className="text-xs text-muted-foreground">
              Note que esta alteração é apenas no cache do cliente. Ao recarregar os dados do servidor, 
              o valor voltará ao original.
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
} 