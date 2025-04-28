"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { AppLayout } from '@/components/layout/app-layout';
import {
  GET_CATEGORIES,
  CREATE_CATEGORY,
  UPDATE_CATEGORY,
  DELETE_CATEGORY,
  CategoryType,
  CategoryInput
} from '@/lib/graphql';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  PlusCircle, 
  PencilIcon, 
  Trash2Icon, 
  TagIcon, 
  RefreshCw, 
  Search, 
  ArrowUpDown,
  SortAsc,
  SortDesc,
  Plus
} from 'lucide-react';
import CategoryForm from './category-form';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import DeleteCategoryDialog from './delete-category-dialog';

export default function CategoriesPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<Partial<CategoryType> | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'date'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [visibleCount, setVisibleCount] = useState(12);
  const [hasMore, setHasMore] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  
  const lastCategoryRef = useRef<HTMLDivElement | null>(null);

  // Consulta para buscar categorias
  const { loading, error, data, refetch } = useQuery(GET_CATEGORIES, {
    fetchPolicy: 'network-only',
    onError: (error) => {
      console.error('Erro na consulta GraphQL:', error);
    }
  });

  // Formatação das categorias para exibição
  const categories = data?.categories?.map((category: any) => ({
    ...category,
    createdAt: new Date(category.createdAt),
    componentCount: category.components?.length || 0
  })) || [];

  // Filtragem de categorias pelo termo de busca
  const filteredCategories = categories.filter((category: CategoryType) => {
    return category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           category.description?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Função para ordenar categorias
  const sortCategories = (categories: CategoryType[]) => {
    return [...categories].sort((a, b) => {
      if (sortBy === 'name') {
        return sortDirection === 'asc' 
          ? a.name.localeCompare(b.name) 
          : b.name.localeCompare(a.name);
      } else if (sortBy === 'date') {
        return sortDirection === 'asc'
          ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return 0;
    });
  };

  // Aplicar ordenação às categorias filtradas
  const sortedCategories = sortCategories(filteredCategories);

  // Configurar um observer para carregamento contínuo
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setVisibleCount(prev => prev + 8);
        }
      },
      { threshold: 0.5 }
    );

    if (lastCategoryRef.current) {
      observer.observe(lastCategoryRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, sortedCategories.length]);

  // Verificar se há mais categorias para carregar
  useEffect(() => {
    setHasMore(visibleCount < sortedCategories.length);
  }, [visibleCount, sortedCategories.length]);

  // Mutation para criar categoria
  const [createCategory, { loading: createLoading }] = useMutation(CREATE_CATEGORY, {
    onCompleted: (data) => {
      console.log('Categoria criada com sucesso:', data);
      setIsCreateDialogOpen(false);
      refetch();
    },
    onError: (error) => {
      console.error('Erro ao criar categoria:', error);
      console.error('Mensagem de erro:', error.message);
      if (error.graphQLErrors) {
        console.error('GraphQL errors:', error.graphQLErrors);
      }
      if (error.networkError) {
        console.error('Network error:', error.networkError);
      }
      alert(`Erro ao criar categoria: ${error.message}`);
    }
  });

  // Mutation para atualizar categoria
  const [updateCategory, { loading: updateLoading }] = useMutation(UPDATE_CATEGORY, {
    onCompleted: (data) => {
      console.log('Categoria atualizada com sucesso:', data);
      setIsEditDialogOpen(false);
      refetch();
    },
    onError: (error) => {
      console.error('Erro ao atualizar categoria:', error);
      console.error('Mensagem de erro:', error.message);
      if (error.graphQLErrors) {
        console.error('GraphQL errors:', error.graphQLErrors);
      }
      if (error.networkError) {
        console.error('Network error:', error.networkError);
      }
      alert(`Erro ao atualizar categoria: ${error.message}`);
    }
  });

  // Mutation para excluir categoria
  const [deleteCategory, { loading: deleteLoading }] = useMutation(DELETE_CATEGORY, {
    onCompleted: () => {
      setIsDeleteDialogOpen(false);
      refetch();
    },
    onError: (error) => {
      console.error('Erro ao excluir categoria:', error);
      console.error('Mensagem de erro:', error.message);
      if (error.graphQLErrors) {
        console.error('GraphQL errors:', error.graphQLErrors);
      }
      if (error.networkError) {
        console.error('Network error:', error.networkError);
      }
      alert(`Erro ao excluir categoria: ${error.message}`);
    }
  });

  // Manipulador para abrir o diálogo de criação
  const handleOpenCreateDialog = () => {
    setIsCreateDialogOpen(true);
  };

  // Manipulador para abrir o diálogo de detalhes
  const handleCategoryClick = (category: CategoryType) => {
    setCurrentCategory(category);
    setShowDetails(true);
  };

  // Manipulador para abrir o diálogo de edição
  const handleOpenEditDialog = (event?: React.MouseEvent) => {
    event?.stopPropagation();
    setShowDetails(false);
    setIsEditDialogOpen(true);
  };

  // Manipulador para abrir o diálogo de exclusão
  const handleOpenDeleteDialog = (event?: React.MouseEvent) => {
    event?.stopPropagation();
    setShowDetails(false);
    setIsDeleteDialogOpen(true);
  };

  // Manipulador para submeter o formulário de criação
  const handleCreateSubmit = (formData: CategoryInput, onFormSubmitted: () => void) => {
    console.log('Enviando dados para criação:', formData);
    createCategory({
      variables: { input: formData },
      onCompleted: () => {
        onFormSubmitted();
      },
      onError: () => {
        onFormSubmitted();
      }
    });
  };

  // Manipulador para submeter o formulário de edição
  const handleUpdateSubmit = (formData: CategoryInput, onFormSubmitted: () => void) => {
    if (currentCategory?.id) {
      console.log('Enviando dados para atualização:', formData, 'ID:', currentCategory.id);
      updateCategory({
        variables: {
          id: currentCategory.id,
          input: formData
        },
        onCompleted: () => {
          onFormSubmitted();
        },
        onError: () => {
          onFormSubmitted();
        }
      });
    }
  };

  // Manipulador para confirmar exclusão
  const handleDeleteConfirm = () => {
    if (currentCategory?.id) {
      console.log('Enviando solicitação para excluir categoria com ID:', currentCategory.id);
      deleteCategory({
        variables: { id: currentCategory.id }
      });
    }
  };

  // Função para alternar a ordenação
  const toggleSort = (field: 'name' | 'date') => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('asc');
    }
  };

  // Função para configurar referência para carregamento infinito
  const setLastCategoryRef = (el: HTMLDivElement | null, index: number) => {
    if (index === Math.min(visibleCount - 1, sortedCategories.length - 1)) {
      lastCategoryRef.current = el;
    }
  };

  // Renderizar mensagem de carregamento se necessário
  if (loading && !data) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center h-96">
          <p className="text-lg">Carregando categorias...</p>
        </div>
      </AppLayout>
    );
  }

  // Renderizar mensagem de erro se necessário
  if (error) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center h-96 flex-col gap-4">
          <p className="text-lg text-destructive">Erro ao carregar as categorias</p>
          <p className="text-sm text-muted-foreground">
            {error.message === 'Failed to fetch' 
              ? 'Erro de conexão com a API. Verifique se o servidor está em execução.' 
              : error.message}
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
          <h1 className="text-2xl font-bold">Gerenciamento de Categorias</h1>
          <Button onClick={handleOpenCreateDialog}>
            <Plus size={16} className="mr-2 h-4 w-4" />
            Nova Categoria
          </Button>
        </div>

        {/* Área de busca e filtros */}
        <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
            <Input
              placeholder="Pesquisar categorias..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-md focus:ring-1 focus:ring-primary focus:border-primary bg-background"
            />
          </div>

          <div className="flex gap-2">
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
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="outline" onClick={() => refetch()} title="Atualizar lista de categorias">
              <RefreshCw size={16} />
            </Button>
          </div>
        </div>

        {sortedCategories.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <p>Nenhuma categoria encontrada.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedCategories.slice(0, visibleCount).map((category: any, index: number) => (
              <div
                key={category.id}
                ref={(el) => setLastCategoryRef(el, index)}
                className="bg-card rounded-lg border shadow-sm p-4 h-[180px] flex flex-col hover:border-primary transition-colors cursor-pointer"
                onClick={() => handleCategoryClick(category)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2 max-w-[100%]">
                    {category.image ? (
                      <div className="w-8 h-8 rounded overflow-hidden flex-shrink-0">
                        <img 
                          src={`data:image/png;base64,${category.image}`} 
                          alt={category.name} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded bg-muted flex items-center justify-center flex-shrink-0">
                        <TagIcon size={16} className="text-muted-foreground" />
                      </div>
                    )}
                    <h3 className="text-lg font-medium truncate">
                      {category.name}
                    </h3>
                  </div>
                </div>
                
                <div className="flex-grow overflow-hidden">
                  <p className="text-muted-foreground text-sm line-clamp-2">
                    {category.description || 'Sem descrição'}
                  </p>
                </div>
                
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
                  <div className="flex items-center text-xs text-muted-foreground">
                    <TagIcon size={12} className="mr-1" />
                    {category.componentCount} componente{category.componentCount !== 1 ? 's' : ''}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(category.createdAt), 'dd/MM/yyyy')}
                  </div>
                </div>
              </div>
            ))}
            
            {/* Indicador de carregamento */}
            {hasMore && sortedCategories.length > 0 && (
              <div className="col-span-full flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal de detalhes da categoria */}
      {showDetails && currentCategory && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-card rounded-lg border shadow-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                {currentCategory.image ? (
                  <div className="w-12 h-12 rounded overflow-hidden">
                    <img 
                      src={`data:image/png;base64,${currentCategory.image}`} 
                      alt={currentCategory.name} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
                    <TagIcon size={24} className="text-muted-foreground" />
                  </div>
                )}
                <h2 className="text-2xl font-semibold">{currentCategory.name}</h2>
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
                <p className="text-foreground">{currentCategory.description || 'Sem descrição'}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Detalhes</h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  <div className="text-sm text-muted-foreground">ID:</div>
                  <div className="text-sm">{currentCategory.id}</div>
                  <div className="text-sm text-muted-foreground">Data de Criação:</div>
                  <div className="text-sm">{format(new Date(currentCategory.createdAt), "dd/MM/yyyy")}</div>
                  <div className="text-sm text-muted-foreground">Componentes Associados:</div>
                  <div className="text-sm">{currentCategory.componentCount || 0}</div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t flex justify-end gap-4">
              <Button 
                variant="outline"
                onClick={handleOpenEditDialog}
              >
                Editar
              </Button>
              <Button 
                variant="destructive"
                onClick={handleOpenDeleteDialog}
                disabled={currentCategory.componentCount > 0}
                title={currentCategory.componentCount > 0 ? "Não é possível excluir uma categoria com componentes associados" : "Excluir categoria"}
              >
                Excluir
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Diálogo de criação de categoria */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Categoria</DialogTitle>
            <DialogDescription>
              Preencha os campos abaixo para criar uma nova categoria.
            </DialogDescription>
          </DialogHeader>
          <CategoryForm 
            onSubmit={handleCreateSubmit}
            onCancel={() => setIsCreateDialogOpen(false)} 
          />
        </DialogContent>
      </Dialog>

      {/* Diálogo de edição de categoria */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Categoria</DialogTitle>
            <DialogDescription>
              Atualize os dados da categoria.
            </DialogDescription>
          </DialogHeader>
          {currentCategory && (
            <CategoryForm 
              initialData={currentCategory} 
              onSubmit={handleUpdateSubmit}
              onCancel={() => setIsEditDialogOpen(false)} 
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmação de exclusão */}
      <DeleteCategoryDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        category={currentCategory as CategoryType}
        onConfirm={handleDeleteConfirm}
        isLoading={deleteLoading}
      />
    </AppLayout>
  );
} 