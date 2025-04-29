"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Search, Plus, Filter, Download, Tag, Edit, Trash2, ChevronDown, ArrowUpDown, SortAsc, SortDesc, Link as LinkIcon, RefreshCw } from 'lucide-react';
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
  ComponentStatus,
  ComponentType,
  ComponentInput,
  CategoryType
} from '@/lib/graphql';
import { toast } from '@/components/ui/use-toast';
import { useApolloClient } from '@apollo/client';

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

  const [checkComponentRelations, { loading: relationsLoading }] = useLazyQuery(GET_RELATIONS, {
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
    if (hasRelations) {
      toast({
        title: "Operação não permitida",
        description: "Não é possível excluir um componente que possui relacionamentos. Remova os relacionamentos primeiro.",
        variant: "destructive"
      });
      return;
    }
    
    // Versão simplificada sem verificação de relacionamentos
    setComponentToDelete(id);
    setShowDeleteConfirm(true);
    setShowDetails(false); // Fechar o modal de detalhes
  };

  // Função para excluir componente após confirmação
  const handleConfirmedDelete = () => {
    if (componentToDelete === null) return;
    
    deleteComponent({
      variables: { id: componentToDelete },
      onCompleted: () => {
        console.log("Componente excluído com sucesso");
        setShowDeleteConfirm(false);
        setComponentToDelete(null);
        // Atualiza a lista após excluir
        setTimeout(() => refetch(), 300);
      },
      onError: (error) => {
        console.error("Erro ao excluir componente:", error);
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedComponents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground col-span-full">
              Nenhum componente encontrado.
            </div>
          ) : (
            sortedComponents.slice(0, visibleCount).map((component: ComponentType, index: number) => (
              <div 
                key={component.id}
                ref={(el) => setLastComponentRef(el, index)}
                className="bg-card rounded-lg border shadow-sm p-4 cursor-pointer hover:border-primary transition-colors h-[180px] flex flex-col"
                onClick={() => handleComponentClick(component)}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-medium truncate max-w-[70%]">
                    {component.name}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(component.status)}`}>
                      {component.status === ComponentStatus.ACTIVE ? 'Ativo' : 
                       component.status === ComponentStatus.INACTIVE ? 'Inativo' : 'Depreciado'}
                    </span>
                  </div>
                </div>
                <p className="text-muted-foreground text-sm mb-2 line-clamp-2 flex-grow">{component.description}</p>
                {component.category && (
                  <div className="flex items-center mb-2">
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
                <div className="flex flex-wrap items-center justify-between mt-auto">
                  <div className="flex flex-wrap gap-2 max-w-[70%]">
                    {component.tags.slice(0, 3).map((tag, index) => (
                      <span key={index} className="inline-flex items-center px-2 py-1 rounded-full bg-primary/10 text-primary text-xs truncate max-w-[100px]">
                        <Tag size={12} className="mr-1 flex-shrink-0" />
                        <span className="truncate">{tag}</span>
                      </span>
                    ))}
                    {component.tags.length > 3 && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full bg-muted text-muted-foreground text-xs">
                        +{component.tags.length - 3}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {format(component.created_at, "dd/MM/yyyy")}
                  </span>
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

              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Descrição</h3>
                  <p className="text-foreground">{selectedComponent.description}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedComponent.tags.map((tag, index) => (
                      <span key={index} className="inline-flex items-center px-2 py-1 rounded-full bg-primary/10 text-primary text-sm">
                        <Tag size={14} className="mr-1" />
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Detalhes</h3>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    <div className="text-sm text-muted-foreground">ID:</div>
                    <div className="text-sm">{selectedComponent.id}</div>
                    
                    <div className="text-sm text-muted-foreground">Categoria:</div>
                    <div className="text-sm">
                      {selectedComponent.category ? selectedComponent.category.name : 'Sem categoria'}
                    </div>
                    
                    <div className="text-sm text-muted-foreground">Data de Criação:</div>
                    <div className="text-sm">{format(selectedComponent.created_at, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</div>
                  </div>
                </div>

                <div>
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
              </div>

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
              <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                Cancelar
              </Button>
              <Button variant="default" onClick={handleConfirmedDelete}>
                Excluir
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
} 