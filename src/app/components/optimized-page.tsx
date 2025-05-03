"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, Plus, Filter, ArrowUpDown, RefreshCw } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ComponentStatus } from '@/lib/graphql';
import ComponentForm from './form-component';
import { GET_OPTIMIZED_COMPONENTS, GET_OPTIMIZED_COMPONENT } from '@/lib/graphql-optimized';
import { useOptimizedQuery } from '@/lib/hooks/use-optimized-query';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

// Definir o tipo para os dados da query otimizada
interface OptimizedComponentsData {
  components: {
    items: Array<{
      id: number;
      name: string;
      description: string;
      status: ComponentStatus;
      createdAt: string;
      team?: {
        id: number;
        name: string;
      };
      category?: {
        id: number;
        name: string;
        image?: string;
      };
      tags?: string[];
      totalInstances?: number;
      instancesByEnvironment?: Array<{
        environmentId: number;
        count: number;
      }>;
    }>;
    pageInfo: {
      totalItems: number;
      currentPage: number;
      pageSize: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
  };
}

export default function OptimizedComponentsPage() {
  // Estados para filtros e busca
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ComponentStatus | 'all'>('all');
  const [selectedComponent, setSelectedComponent] = useState<any | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;
  const [loadingMore, setLoadingMore] = useState(false);
  const lastComponentRef = useRef<HTMLDivElement | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'status'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Consulta GraphQL otimizada para componentes
  const { loading, error, data, fetchMore, refetch } = useOptimizedQuery<OptimizedComponentsData>(
    GET_OPTIMIZED_COMPONENTS,
    {
      // Configurações de otimização específicas
      include: {
        includeTeam: true,
        includeCategory: true,
        includeTags: true,
        includeInstances: false, // Não precisamos das instâncias na listagem
      }
    },
    {
      variables: { 
        status: statusFilter === 'all' ? null : statusFilter,
        pagination: {
          page: currentPage,
          pageSize,
          sortField: sortBy,
          sortOrder: sortDirection
        },
        search: searchTerm || undefined
      },
      notifyOnNetworkStatusChange: true
    }
  );

  // Consulta otimizada para detalhes do componente selecionado
  const { data: componentDetails, loading: loadingDetails } = useOptimizedQuery(
    GET_OPTIMIZED_COMPONENT,
    {
      // Carrega todos os detalhes apenas quando necessário
      include: {
        includeInstances: true,
        includeTeam: true,
        includeCategory: true,
        includeTags: true,
        includeRelationships: true
      }
    },
    {
      variables: { id: selectedComponent?.id },
      skip: !selectedComponent || !showDetails,
      fetchPolicy: 'network-only'
    }
  );

  // Extrai os dados da resposta
  const components = data?.components?.items || [];
  const pageInfo = data?.components?.pageInfo || { 
    totalItems: 0, 
    currentPage: 1, 
    pageSize: 12, 
    totalPages: 0, 
    hasNextPage: false,
    hasPreviousPage: false 
  };

  // Função para alternar a ordenação
  const toggleSort = (field: 'name' | 'date' | 'status') => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('asc');
    }
  };

  // Manipuladores de ações
  const handleStatusFilterChange = (status: ComponentStatus | 'all') => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const handleComponentClick = (component: any) => {
    setSelectedComponent(component);
    setShowDetails(true);
  };

  // Função para obter a cor de status
  const getStatusColor = (status: ComponentStatus) => {
    switch (status) {
      case 'active':
        return 'bg-success text-success-foreground';
      case 'inactive':
        return 'bg-warning text-warning-foreground';
      case 'deprecated':
        return 'bg-destructive text-destructive-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  // Função para abrir formulário de componente (em modo de criação)
  const openNewComponentForm = () => {
    setIsEditMode(false);
    setSelectedComponent(null);
    setIsFormOpen(true);
  };

  // Função para abrir formulário de componente (em modo de edição)
  const openEditComponentForm = (component: any) => {
    setIsEditMode(true);
    setSelectedComponent(component);
    setShowDetails(false);
    setIsFormOpen(true);
  };

  // Função para salvar componente (placeholder)
  const handleSaveComponent = (componentData: any) => {
    // Implementar mutação de salvamento
    setIsFormOpen(false);
  };

  // Função para carregar mais componentes
  const loadMoreComponents = useCallback(() => {
    if (loadingMore || !pageInfo.hasNextPage) return;
    
    setLoadingMore(true);
    
    fetchMore({
      variables: {
        pagination: {
          page: currentPage + 1,
          pageSize,
          sortField: sortBy,
          sortOrder: sortDirection
        }
      }
    }).finally(() => {
      setCurrentPage(prev => prev + 1);
      setLoadingMore(false);
    });
  }, [currentPage, fetchMore, loadingMore, pageInfo.hasNextPage, pageSize, sortBy, sortDirection]);
  
  // Manipulador de interseção para detectar quando o usuário chegou ao final da lista
  const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
    const [entry] = entries;
    if (entry?.isIntersecting && pageInfo.hasNextPage && !loadingMore) {
      loadMoreComponents();
    }
  }, [loadMoreComponents, pageInfo.hasNextPage, loadingMore]);
  
  // Configuração do observador de interseção
  useEffect(() => {
    const option = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    };
    
    const observer = new IntersectionObserver(handleObserver, option);
    
    if (observer && lastComponentRef.current) {
      observer.observe(lastComponentRef.current);
    }
    
    return () => {
      if (observer) {
        observer.disconnect();
      }
    };
  }, [handleObserver, components.length]);
  
  // Reset da paginação quando os filtros mudam
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, sortBy, sortDirection]);
  
  // Função para definir a referência do último componente
  const setLastComponentRef = (el: HTMLDivElement | null) => {
    lastComponentRef.current = el;
  };

  // Renderizar mensagem de carregamento se necessário
  if (loading && !data) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center h-96">
          <p className="text-lg">Carregando componentes...</p>
        </div>
      </AppLayout>
    );
  }

  // Renderizar mensagem de erro se necessário
  if (error) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center h-96 flex-col gap-4">
          <p className="text-lg text-destructive">Erro ao carregar os componentes</p>
          <p className="text-sm text-muted-foreground">
            {error.message}
          </p>
          <Button onClick={() => refetch()}>Tentar novamente</Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="pb-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Componentes (Otimizado)</h1>
          <Button 
            className="flex items-center gap-1"
            onClick={openNewComponentForm}
          >
            <Plus size={16} className="mr-1" />
            Novo Componente
          </Button>
        </div>

        {/* Área de busca e filtros */}
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Filter size={16} />
                  Filtrar
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem 
                  onClick={() => handleStatusFilterChange('all')}
                  className={statusFilter === 'all' ? 'bg-muted' : ''}
                >
                  Todos os status
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => handleStatusFilterChange('active')}
                  className={statusFilter === 'active' ? 'bg-muted' : ''}
                >
                  <span className="w-2 h-2 rounded-full bg-success mr-2"></span>
                  Ativos
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleStatusFilterChange('inactive')}
                  className={statusFilter === 'inactive' ? 'bg-muted' : ''}
                >
                  <span className="w-2 h-2 rounded-full bg-warning mr-2"></span>
                  Inativos
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleStatusFilterChange('deprecated')}
                  className={statusFilter === 'deprecated' ? 'bg-muted' : ''}
                >
                  <span className="w-2 h-2 rounded-full bg-destructive mr-2"></span>
                  Depreciados
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <ArrowUpDown size={16} />
                  Ordenar
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => toggleSort('name')}>
                  <div className="flex items-center justify-between w-full">
                    <span>Nome</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => toggleSort('date')}>
                  <div className="flex items-center justify-between w-full">
                    <span>Data de criação</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => toggleSort('status')}>
                  <div className="flex items-center justify-between w-full">
                    <span>Status</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="outline" onClick={() => refetch()} title="Atualizar lista de componentes">
              <RefreshCw size={16} />
            </Button>
          </div>
        </div>

        {/* Grid de componentes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {components.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground col-span-full">
              Nenhum componente encontrado.
            </div>
          ) : (
            <>
              {components.map((component: any, index: number) => (
                <div
                  key={component.id}
                  ref={index === components.length - 1 ? setLastComponentRef : null}
                  className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200 ${
                    selectedComponent?.id === component.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => handleComponentClick(component)}
                >
                  <div className="p-4 flex flex-col h-[180px]">
                    {/* Header com nome e status */}
                    <div className="flex justify-between mb-2">
                      <h3 className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate flex-1">
                        {component.name}
                      </h3>
                      <div className="ml-2 flex-shrink-0">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          component.status === 'active'
                            ? 'bg-green-100 dark:bg-green-800/20 text-green-800 dark:text-green-400'
                            : component.status === 'inactive'
                            ? 'bg-gray-100 dark:bg-gray-800/40 text-gray-800 dark:text-gray-400'
                            : 'bg-amber-100 dark:bg-amber-800/20 text-amber-800 dark:text-amber-400'
                        }`}>
                          {component.status === 'active'
                            ? 'Ativo'
                            : component.status === 'inactive'
                            ? 'Inativo'
                            : 'Depreciado'}
                        </span>
                      </div>
                    </div>

                    {/* Descrição truncada */}
                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-2 flex-grow">
                      {component.description || 'Sem descrição.'}
                    </p>

                    {/* Tags */}
                    {component.tags && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {component.tags.slice(0, 3).map((tag: string, idx: number) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary/10 text-primary dark:bg-primary/20"
                          >
                            #{tag}
                          </span>
                        ))}
                        {component.tags.length > 3 && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                            +{component.tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                    
                    {/* Instâncias */}
                    {component.totalInstances > 0 && (
                      <div className="mt-auto">
                        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-1">
                          <span>{component.totalInstances} instância{component.totalInstances !== 1 ? 's' : ''}</span>
                        </div>
                      </div>
                    )}

                    {/* Categoria e time */}
                    <div className="flex justify-between items-center mt-auto text-xs text-gray-500 dark:text-gray-400">
                      {component.category && (
                        <div className="flex items-center">
                          <span className="text-xs bg-muted px-2 py-1 rounded-full flex items-center">
                            {component.category.name}
                          </span>
                        </div>
                      )}
                      {component.team && (
                        <span className="text-xs text-muted-foreground">
                          {component.team.name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Indicador de carregamento */}
              {loadingMore && (
                <div className="col-span-full flex justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Exibir estatísticas de paginação */}
        <div className="mt-6 text-sm text-muted-foreground text-center">
          {pageInfo.totalItems > 0 && (
            <>
              Mostrando {components.length} de {pageInfo.totalItems} componentes
              {pageInfo.totalPages > 1 && ` • Página ${pageInfo.currentPage} de ${pageInfo.totalPages}`}
            </>
          )}
        </div>

        {/* Modal de detalhes do componente */}
        {showDetails && selectedComponent && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-card rounded-lg border shadow-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-semibold">
                    {loadingDetails ? 'Carregando...' : componentDetails?.component.name}
                  </h2>
                  {!loadingDetails && componentDetails && (
                    <span className={`mt-2 inline-block px-2 py-1 text-xs rounded-full ${getStatusColor(componentDetails.component.status)}`}>
                      {componentDetails.component.status === 'active' ? 'Ativo' : 
                       componentDetails.component.status === 'inactive' ? 'Inativo' : 'Depreciado'}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setShowDetails(false)} 
                  >
                    ✕
                  </Button>
                </div>
              </div>

              {loadingDetails ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : componentDetails ? (
                <Tabs defaultValue="overview" className="mt-4">
                  <TabsList>
                    <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                    <TabsTrigger value="instances">
                      Instâncias {componentDetails.component.instances?.length ? `(${componentDetails.component.instances.length})` : ''}
                    </TabsTrigger>
                    <TabsTrigger value="relations">Relacionamentos</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="mt-4">
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium">Descrição</h4>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {componentDetails.component.description || 'Sem descrição disponível.'}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-sm font-medium">Status</h4>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {componentDetails.component.status === 'active' ? 'Ativo' : 
                             componentDetails.component.status === 'inactive' ? 'Inativo' : 'Depreciado'}
                          </p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium">Time Responsável</h4>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {componentDetails.component.team?.name || 'Não definido'}
                          </p>
                        </div>
                      </div>

                      {/* Tags */}
                      {componentDetails.component.tags && componentDetails.component.tags.length > 0 ? (
                        <div>
                          <h4 className="text-sm font-medium">Tags</h4>
                          <div className="mt-1 flex flex-wrap gap-2">
                            {componentDetails.component.tags.map((tag: string, index: number) => (
                              <span 
                                key={index} 
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary/10 text-primary dark:bg-primary/20"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </TabsContent>

                  <TabsContent value="instances" className="mt-4">
                    {componentDetails.component.instances && componentDetails.component.instances.length > 0 ? (
                      <div className="space-y-4">
                        {componentDetails.component.instances.map((instance: any) => (
                          <div
                            key={instance.id}
                            className="p-3 border rounded-md bg-muted/10"
                          >
                            <div className="flex justify-between">
                              <div>
                                <h5 className="text-sm font-medium">
                                  {instance.hostname || `Instância ${instance.id}`}
                                </h5>
                                <p className="text-xs text-muted-foreground">
                                  {instance.environment?.name || "Ambiente desconhecido"}
                                </p>
                              </div>
                            </div>
                            
                            {instance.specs && Object.keys(instance.specs).length > 0 && (
                              <div className="mt-2 border-t pt-2">
                                <h6 className="text-xs font-medium mb-1">Especificações</h6>
                                <div className="grid grid-cols-2 gap-2">
                                  {Object.entries(instance.specs).map(([key, value]) => (
                                    <div key={key} className="text-xs">
                                      <span className="font-medium">{key}:</span>{" "}
                                      <span className="text-muted-foreground">{String(value)}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <h3 className="mt-2 text-sm font-medium">Nenhuma instância</h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Este componente não possui instâncias em nenhum ambiente.
                        </p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="relations" className="mt-4">
                    {componentDetails.component.relationships && componentDetails.component.relationships.length > 0 ? (
                      <div className="space-y-4">
                        {componentDetails.component.relationships.map((relation: any) => (
                          <div
                            key={relation.id}
                            className="p-3 border rounded-md bg-muted/10"
                          >
                            <p className="text-sm font-medium">
                              {relation.source.name} → {relation.target.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Tipo: {relation.type}
                            </p>
                            {relation.description && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {relation.description}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <h3 className="mt-2 text-sm font-medium">Nenhum relacionamento</h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Este componente não possui relacionamentos com outros componentes.
                        </p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              ) : (
                <div className="text-center py-8 text-destructive">
                  Erro ao carregar os detalhes do componente.
                </div>
              )}

              <div className="mt-6 pt-4 border-t flex justify-end gap-4">
                <Button 
                  variant="outline"
                  onClick={() => setShowDetails(false)}
                >
                  Fechar
                </Button>
                <Button 
                  variant="default"
                  onClick={() => openEditComponentForm(componentDetails?.component)}
                  disabled={loadingDetails}
                >
                  Editar
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Modal do formulário de componente */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {isEditMode ? 'Editar Componente' : 'Novo Componente'}
              </DialogTitle>
            </DialogHeader>
            <ComponentForm
              initialData={selectedComponent || undefined}
              onSubmit={handleSaveComponent}
              onCancel={() => setIsFormOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
} 