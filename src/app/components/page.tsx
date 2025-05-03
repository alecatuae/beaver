"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Search, Plus, Filter, Download, Tag, Edit, Trash2, ChevronDown, ArrowUpDown, Link as LinkIcon, RefreshCw } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ComponentForm from './form-component';
import { useQuery, useMutation, useLazyQuery } from '@apollo/client';
import { 
  GET_COMPONENTS, 
  CREATE_COMPONENT, 
  UPDATE_COMPONENT, 
  DELETE_COMPONENT,
  CHECK_COMPONENT_RELATIONS,
  GET_RELATIONS,
  GET_CATEGORIES,
  GET_ENVIRONMENTS,
  ComponentStatus,
  ComponentType,
  ComponentInput,
  CategoryType,
  EnvironmentType
} from '@/lib/graphql';
import { toast } from '@/components/ui/use-toast';
import { useApolloClient } from '@apollo/client';
import { ServerIcon } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import Image from 'next/image';

export default function ComponentsPage() {
  // Estados para filtros e busca
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ComponentStatus | 'all'>('all');
  const [selectedComponent, setSelectedComponent] = useState<ComponentType | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [visibleCount, setVisibleCount] = useState(12); // Número inicial de componentes visíveis
  const [hasMore, setHasMore] = useState(true); // Indica se há mais componentes para carregar
  const observer = useRef<IntersectionObserver | null>(null);
  const lastComponentRef = useRef<HTMLDivElement | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [componentToDelete, setComponentToDelete] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'status'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Obter cliente Apollo para manipulação de cache
  const client = useApolloClient();

  // Consulta GraphQL para buscar componentes
  const { loading, error, data, refetch } = useQuery(GET_COMPONENTS, {
    variables: { status: statusFilter === 'all' ? null : statusFilter },
    fetchPolicy: 'network-only',
    onError: (error) => {
      console.error('Erro na consulta GraphQL:', error);
      console.error('Erro em detalhes:', JSON.stringify(error, null, 2));
    },
    onCompleted: (data) => {
      console.log('Consulta completada com sucesso. Dados recebidos:', data);
    }
  });
  
  // Consulta de ambientes para mostrar nomes nos badges
  const { data: environmentsData } = useQuery(GET_ENVIRONMENTS, {
    fetchPolicy: 'cache-first'
  });
  
  const environments = environmentsData?.environments || [];
  
  // Função para obter o nome do ambiente pelo ID
  const getEnvironmentName = (environmentId: number): string => {
    const environment = environments.find(
      (env: EnvironmentType) => env.id === environmentId
    );
    return environment?.name || `Env-${environmentId}`;
  };

  // Efeito para logar quando os dados mudam
  useEffect(() => {
    console.log('Dados recebidos:', data);
    console.log('Componentes:', data?.components);
  }, [data]);

  /**
   * Efeito para atualização automática da lista de componentes.
   * Detecta quando o modal de formulário é fechado (após criação/edição)
   * e atualiza a lista após um pequeno atraso para garantir que a operação
   * no banco de dados tenha sido concluída.
   */
  useEffect(() => {
    if (!isFormOpen) {
      // Atualiza a lista após fechar o modal
      setTimeout(() => refetch(), 300);
    }
  }, [isFormOpen, refetch]);

  // Mutations GraphQL
  const [createComponent] = useMutation(CREATE_COMPONENT, {
    onCompleted: () => {
      console.log("Componente criado com sucesso");
      refetch();
    },
    onError: (error) => {
      console.error("Erro ao criar componente:", error);
    }
  });

  const [updateComponent] = useMutation(UPDATE_COMPONENT, {
    onCompleted: () => {
      console.log("Componente atualizado com sucesso");
      refetch();
    },
    onError: (error) => {
      console.error("Erro ao atualizar componente:", error);
    }
  });

  const [deleteComponent] = useMutation(DELETE_COMPONENT, {
    onCompleted: () => {
      console.log("Componente excluído com sucesso");
      refetch();
    },
    onError: (error) => {
      console.error("Erro ao excluir componente:", error);
    }
  });

  // Consulta específica para verificar relacionamentos (usando a query CHECK_COMPONENT_RELATIONS)
  const [checkComponentRelations, { loading: relationsLoading }] = useLazyQuery(CHECK_COMPONENT_RELATIONS, {
    fetchPolicy: 'network-only',
    onError: (error) => {
      console.error("Erro ao verificar relacionamentos do componente:", error);
    }
  });

  // Estado para armazenar se o componente selecionado tem relacionamentos
  const [hasRelations, setHasRelations] = useState<boolean | null>(null);

  // Efeito para recarregar relacionamentos quando o modal de detalhes é aberto
  useEffect(() => {
    if (showDetails && selectedComponent) {
      // Limpar cache da consulta anterior para forçar nova requisição
      client.cache.evict({ fieldName: 'relations' });
      client.cache.gc();

      // Verificar se o componente tem relacionamentos
      checkComponentRelations({
        fetchPolicy: 'network-only',
        onCompleted: (data) => {
          if (data && data.relations) {
            // Verificar se algum relacionamento envolve este componente
            const hasComponentRelations = data.relations.some(
              (relation: any) => 
                relation.sourceId === selectedComponent.id || 
                relation.targetId === selectedComponent.id
            );
            setHasRelations(hasComponentRelations);
            console.log(`[useEffect] Componente ${selectedComponent.name} (ID: ${selectedComponent.id}) tem relacionamentos: ${hasComponentRelations}`);
          }
        }
      });
    }
  }, [showDetails, selectedComponent, checkComponentRelations]);

  // Transforma os dados da API para o formato esperado pela interface
  const components = data?.components?.map((component: any) => ({
    ...component,
    created_at: new Date(component.createdAt),
    tags: component.tags?.map((tag: any) => {
      // Verifica se a tag já é uma string ou se precisamos extrair a propriedade 'tag'
      return typeof tag === 'string' ? tag : (tag?.tag || '');
    }) || []
  })) || [];

  // Função para filtrar componentes com base na busca
  const filteredComponents = components.filter((component: ComponentType) => {
    const matchesSearch = component.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        component.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        component.tags.some((tag: string) => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch;
  });

  // Função para ordenar componentes
  const sortComponents = (components: ComponentType[]) => {
    return [...components].sort((a, b) => {
      if (sortBy === 'name') {
        return sortDirection === 'asc' 
          ? a.name.localeCompare(b.name) 
          : b.name.localeCompare(a.name);
      } else if (sortBy === 'date') {
        return sortDirection === 'asc'
          ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else if (sortBy === 'status') {
        // Ordem customizada: Active (1), Inactive (2), Deprecated (3)
        const statusOrder = {
          [ComponentStatus.ACTIVE]: 1,
          [ComponentStatus.INACTIVE]: 2,
          [ComponentStatus.DEPRECATED]: 3
        };
        return sortDirection === 'asc'
          ? statusOrder[a.status] - statusOrder[b.status]
          : statusOrder[b.status] - statusOrder[a.status];
      }
      return 0;
    });
  };

  // Aplicar ordenação aos componentes filtrados
  const sortedComponents = sortComponents(filteredComponents);

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
    if (status !== 'all') {
      refetch({ status });
    } else {
      refetch({ status: null });
    }
  };

  const handleComponentClick = (component: ComponentType) => {
    setSelectedComponent(component);
    setShowDetails(true);
    setHasRelations(false); // Definir como false por padrão (mostrará "NÃO" enquanto carrega)

    // Limpar cache da consulta anterior para forçar nova requisição
    client.cache.evict({ fieldName: 'relations' });
    client.cache.gc();

    // Verificar se o componente tem relacionamentos
    checkComponentRelations({
      fetchPolicy: 'network-only', // Garantir que busque sempre do servidor
      onCompleted: (data) => {
        if (data && data.relations) {
          // Verificar se algum relacionamento envolve este componente
          const hasComponentRelations = data.relations.some(
            (relation: any) => relation.sourceId === component.id || relation.targetId === component.id
          );
          setHasRelations(hasComponentRelations);
          console.log(`Componente ${component.name} (ID: ${component.id}) tem relacionamentos: ${hasComponentRelations}`);
        }
      }
    });
  };

  const getStatusColor = (status: ComponentStatus) => {
    switch (status) {
      case ComponentStatus.ACTIVE:
        return 'bg-success text-success-foreground';
      case ComponentStatus.INACTIVE:
        return 'bg-warning text-warning-foreground';
      case ComponentStatus.DEPRECATED:
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
  const openEditComponentForm = (component: ComponentType) => {
    setIsEditMode(true);
    setSelectedComponent(component);
    setShowDetails(false);
    setIsFormOpen(true);
  };

  // Função para salvar componente (criar ou atualizar)
  const handleSaveComponent = (componentData: ComponentInput) => {
    if (isEditMode && selectedComponent) {
      // Atualizar componente existente
      updateComponent({
        variables: {
          id: selectedComponent.id,
          input: componentData
        }
      });
    } else {
      // Criar novo componente
      createComponent({
        variables: {
          input: componentData
        }
      });
    }
    
    setIsFormOpen(false);
  };

  // Função para iniciar o processo de exclusão
  const confirmDeleteComponent = async (id: number) => {
    // Verificar se o componente tem relacionamentos antes de permitir a exclusão
    const { data } = await checkComponentRelations({ 
      variables: { id },
      fetchPolicy: 'network-only' 
    });
    
    const hasComponentRelations = data?.componentRelations?.hasRelations || false;
    
    if (hasComponentRelations) {
      toast({
        title: "Operação não permitida",
        description: "Não é possível excluir um componente que possui relacionamentos. Remova os relacionamentos primeiro.",
        variant: "destructive"
      });
      return;
    }
    
    // Prosseguir com a exclusão
    setComponentToDelete(id);
    setShowDeleteConfirm(true);
    setShowDetails(false); // Fechar o modal de detalhes
  };

  // Função para excluir componente após confirmação
  const handleConfirmedDelete = () => {
    if (componentToDelete === null) return;
    
    setIsDeleting(true);
    
    deleteComponent({
      variables: { id: componentToDelete },
      onCompleted: () => {
        console.log("Componente excluído com sucesso");
        setShowDeleteConfirm(false);
        setComponentToDelete(null);
        setIsDeleting(false);
        toast({
          title: "Componente excluído",
          description: "O componente foi excluído com sucesso.",
        });
        // Atualiza a lista após excluir
        refetch();
      },
      onError: (error) => {
        console.error("Erro ao excluir componente:", error);
        setIsDeleting(false);
        toast({
          title: "Erro ao excluir",
          description: error.message || "Ocorreu um erro ao excluir o componente.",
          variant: "destructive"
        });
      }
    });
  };

  /**
   * Manipulador de interseção para detecção de rolagem
   * Quando o último elemento se torna visível, carrega mais componentes
   */
  const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
    const [entry] = entries;
    if (entry.isIntersecting && hasMore) {
      setVisibleCount(prev => {
        const newCount = prev + 8; // Incrementa 8 componentes por vez
        if (newCount >= sortedComponents.length) {
          setHasMore(false);
        }
        return newCount;
      });
    }
  }, [hasMore, sortedComponents.length]);

  // Configuração do observador de interseção para rolagem infinita
  useEffect(() => {
    if (observer.current) {
      observer.current.disconnect();
    }

    observer.current = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: '20px',
      threshold: 0.1
    });

    if (lastComponentRef.current) {
      observer.current.observe(lastComponentRef.current);
    }

    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, [handleObserver, sortedComponents.length]);

  // Resetar visibleCount quando os filtros mudam
  useEffect(() => {
    setVisibleCount(12);
    setHasMore(true);
  }, [searchTerm, statusFilter]);

  // Função para definir a referência do último componente
  const setLastComponentRef = (el: HTMLDivElement | null, index: number) => {
    if (index === Math.min(visibleCount - 1, sortedComponents.length - 1)) {
      lastComponentRef.current = el;
    }
  };

  // Simplificar a função, mantendo retorno para não quebrar referências
  const checkRelationsForComponent = async (componentId: number) => {
    // Função simplificada que apenas retorna false
    return false;
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
            {error.message === 'Failed to fetch' 
              ? 'Erro de conexão com a API. Verifique se o servidor está em execução.' 
              : error.message}
          </p>
          <pre className="text-xs bg-muted p-4 rounded-md overflow-auto max-w-full">
            {error.networkError && JSON.stringify(error.networkError, null, 2)}
            {error.graphQLErrors?.length > 0 && JSON.stringify(error.graphQLErrors, null, 2)}
          </pre>
          <Button onClick={() => refetch()}>Tentar novamente</Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="pb-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Gerenciamento de Componentes</h1>
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
                  onClick={() => handleStatusFilterChange(ComponentStatus.ACTIVE)}
                  className={statusFilter === ComponentStatus.ACTIVE ? 'bg-muted' : ''}
                >
                  <span className="w-2 h-2 rounded-full bg-success mr-2"></span>
                  Ativos
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleStatusFilterChange(ComponentStatus.INACTIVE)}
                  className={statusFilter === ComponentStatus.INACTIVE ? 'bg-muted' : ''}
                >
                  <span className="w-2 h-2 rounded-full bg-warning mr-2"></span>
                  Inativos
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleStatusFilterChange(ComponentStatus.DEPRECATED)}
                  className={statusFilter === ComponentStatus.DEPRECATED ? 'bg-muted' : ''}
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
                    {sortBy === 'name' && (
                      sortDirection === 'asc' ? <SortAsc size={16} /> : <SortDesc size={16} />
                    )}
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => toggleSort('date')}>
                  <div className="flex items-center justify-between w-full">
                    <span>Data de criação</span>
                    {sortBy === 'date' && (
                      sortDirection === 'asc' ? <SortAsc size={16} /> : <SortDesc size={16} />
                    )}
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => toggleSort('status')}>
                  <div className="flex items-center justify-between w-full">
                    <span>Status</span>
                    {sortBy === 'status' && (
                      sortDirection === 'asc' ? <SortAsc size={16} /> : <SortDesc size={16} />
                    )}
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
          {sortedComponents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground col-span-full">
              Nenhum componente encontrado.
            </div>
          ) : (
            sortedComponents.slice(0, visibleCount).map((component: ComponentType, index: number) => (
              <div
                key={component.id}
                ref={(el) => setLastComponentRef(el, index)}
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
                        component.status === ComponentStatus.ACTIVE
                          ? 'bg-green-100 dark:bg-green-800/20 text-green-800 dark:text-green-400'
                          : component.status === ComponentStatus.INACTIVE
                          ? 'bg-gray-100 dark:bg-gray-800/40 text-gray-800 dark:text-gray-400'
                          : 'bg-amber-100 dark:bg-amber-800/20 text-amber-800 dark:text-amber-400'
                      }`}>
                        {component.status === ComponentStatus.ACTIVE
                          ? 'Ativo'
                          : component.status === ComponentStatus.INACTIVE
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
                  <div className="flex flex-wrap gap-1 mb-2">
                    {component.tags.slice(0, 3).map((tag, idx) => (
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
                  
                  {/* Instâncias por ambiente */}
                  {component.totalInstances > 0 && (
                    <div className="mt-auto">
                      <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-1">
                        <ServerIcon className="h-3.5 w-3.5 mr-1" />
                        <span>{component.totalInstances} instância{component.totalInstances !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {component.instancesByEnvironment?.map((env) => (
                          <span 
                            key={env.environmentId}
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300"
                            title={`${env.count} instância${env.count !== 1 ? 's' : ''} em ${getEnvironmentName(env.environmentId)}`}
                          >
                            {getEnvironmentName(env.environmentId)}: {env.count}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Categoria e time */}
                  <div className="flex justify-between items-center mt-auto text-xs text-gray-500 dark:text-gray-400">
                    {component.category && (
                      <div className="flex items-center">
                        <span className="text-xs bg-muted px-2 py-1 rounded-full flex items-center">
                          {component.category.image ? (
                            <img 
                              src={`/images/categories/${component.category.image}`} 
                              alt={component.category.name}
                              className="w-3 h-3 mr-1 object-contain"
                            />
                          ) : null}
                          {component.category.name}
                        </span>
                      </div>
                    )}
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {format(component.created_at, "dd/MM/yyyy")}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
          {/* Indicador de carregamento */}
          {hasMore && sortedComponents.length > 0 && (
            <div className="col-span-full flex justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          )}
        </div>

        {/* Modal de detalhes do componente */}
        {showDetails && selectedComponent && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-card rounded-lg border shadow-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-semibold">{selectedComponent.name}</h2>
                  <span className={`mt-2 inline-block px-2 py-1 text-xs rounded-full ${getStatusColor(selectedComponent.status)}`}>
                    {selectedComponent.status === ComponentStatus.ACTIVE ? 'Ativo' : 
                     selectedComponent.status === ComponentStatus.INACTIVE ? 'Inativo' : 'Depreciado'}
                  </span>
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

              <Tabs defaultValue="overview" className="mt-4">
                <TabsList>
                  <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                  <TabsTrigger value="instances">
                    Instâncias {selectedComponent?.instances?.length ? `(${selectedComponent.instances.length})` : ''}
                  </TabsTrigger>
                  <TabsTrigger value="relations">Relacionamentos</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-4">
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium">Descrição</h4>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {selectedComponent?.description || 'Sem descrição disponível.'}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium">Status</h4>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {selectedComponent?.status === ComponentStatus.ACTIVE ? 'Ativo' : 
                           selectedComponent?.status === ComponentStatus.INACTIVE ? 'Inativo' : 'Depreciado'}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium">Data de Criação</h4>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {selectedComponent?.createdAt ? format(new Date(selectedComponent.createdAt), 'dd/MM/yyyy') : '-'}
                        </p>
                      </div>
                    </div>

                    {/* Categoria */}
                    {selectedComponent?.category ? (
                      <div>
                        <h4 className="text-sm font-medium">Categoria</h4>
                        <div className="mt-1 flex items-center">
                          {selectedComponent.category.image && (
                            <div className="h-6 w-6 mr-2 bg-muted rounded flex items-center justify-center">
                              <Image 
                                src={selectedComponent.category.image} 
                                alt={selectedComponent.category.name} 
                                width={20} 
                                height={20} 
                              />
                            </div>
                          )}
                          <span className="text-sm text-muted-foreground">
                            {selectedComponent.category.name}
                          </span>
                        </div>
                      </div>
                    ) : null}

                    {/* Time responsável */}
                    {selectedComponent?.team ? (
                      <div>
                        <h4 className="text-sm font-medium">Time Responsável</h4>
                        <div className="mt-1 flex items-center">
                          <span className="text-sm text-muted-foreground">
                            {selectedComponent.team.name}
                          </span>
                        </div>
                      </div>
                    ) : null}

                    {/* Tags */}
                    {selectedComponent?.tags && selectedComponent.tags.length > 0 ? (
                      <div>
                        <h4 className="text-sm font-medium">Tags</h4>
                        <div className="mt-1 flex flex-wrap gap-2">
                          {selectedComponent.tags.map((tag, index) => (
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
                  {selectedComponent?.instances && selectedComponent.instances.length > 0 ? (
                    <div className="space-y-4">
                      {selectedComponent.instances.map((instance) => (
                        <div
                          key={instance.id}
                          className="p-3 border rounded-md bg-muted/10"
                        >
                          <div className="flex justify-between">
                            <div className="flex items-center">
                              <div className="p-1.5 bg-primary/10 rounded mr-2">
                                <ServerIcon className="h-4 w-4 text-primary" />
                              </div>
                              <div>
                                <h5 className="text-sm font-medium">
                                  {instance.hostname || `Instância ${instance.id}`}
                                </h5>
                                <p className="text-xs text-muted-foreground">
                                  {instance.environment?.name || "Ambiente desconhecido"}
                                </p>
                              </div>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {format(new Date(instance.createdAt), "dd/MM/yyyy")}
                            </div>
                          </div>
                          
                          {instance.specs && Object.keys(instance.specs).length > 0 && (
                            <div className="mt-2 border-t pt-2">
                              <h6 className="text-xs font-medium mb-1">Especificações</h6>
                              <div className="grid grid-cols-2 gap-2">
                                {Object.entries(instance.specs).map(([key, value]) => (
                                  <div key={key} className="text-xs">
                                    <span className="font-medium">{key}:</span>{" "}
                                    <span className="text-muted-foreground">{value?.toString()}</span>
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
                      <ServerIcon className="h-12 w-12 mx-auto text-muted-foreground opacity-20" />
                      <h3 className="mt-2 text-sm font-medium">Nenhuma instância</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Este componente não possui instâncias em nenhum ambiente.
                      </p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="relations" className="mt-4">
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Relacionamentos</h3>
                    {relationsLoading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                        <p className="text-sm text-muted-foreground">Verificando...</p>
                      </div>
                    ) : (
                      <p className="text-sm">
                        {hasRelations ? (
                          <span className="px-2 py-1 text-xs rounded-full bg-destructive text-destructive-foreground font-medium">
                            SIM
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs rounded-full bg-warning text-warning-foreground font-medium">
                            NÃO
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                </TabsContent>
              </Tabs>

              <div className="mt-6 pt-4 border-t flex flex-col gap-4">
                {hasRelations && (
                  <div className="text-sm text-amber-500 italic">
                    Este componente possui relacionamentos. Remova todos os relacionamentos antes de excluí-lo.
                  </div>
                )}
                <div className="flex justify-end gap-4">
                  <Button 
                    variant="outline"
                    onClick={() => openEditComponentForm(selectedComponent)}
                  >
                    Editar
                  </Button>
                  <Button 
                    variant="default"
                    onClick={() => confirmDeleteComponent(selectedComponent.id)}
                    disabled={hasRelations}
                    title={hasRelations ? "Não é possível excluir um componente com relacionamentos" : "Excluir componente"}
                  >
                    Excluir
                  </Button>
                </div>
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

        {/* Modal de confirmação de exclusão */}
        <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Confirmar Exclusão</DialogTitle>
              <DialogDescription className="pt-2">
                Tem certeza de que deseja excluir este componente? Esta ação não pode ser desfeita.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex justify-end gap-4 pt-4 mt-4 border-t">
              <Button variant="outline" onClick={() => setShowDeleteConfirm(false)} disabled={isDeleting}>
                Cancelar
              </Button>
              <Button 
                variant="default" 
                onClick={handleConfirmedDelete} 
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-r-transparent"></div>
                    Excluindo...
                  </>
                ) : "Excluir"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
} 