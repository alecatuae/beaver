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
  Plus,
  Filter
} from 'lucide-react';
import CategoryForm from './category-form';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';

export default function CategoriesPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<Partial<CategoryType> | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'components'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [visibleCount, setVisibleCount] = useState(12);
  const [hasMore, setHasMore] = useState(true);
  const [componentFilter, setComponentFilter] = useState<'all' | 'with' | 'without'>('all');
  
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

  // Filtragem de categorias pelo termo de busca e filtro de componentes
  const filteredCategories = categories.filter((category: CategoryType) => {
    // Filtro de pesquisa por texto
    const matchesSearch = 
      category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (category.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    
    // Filtro por componentes associados
    if (componentFilter === 'all') {
      return matchesSearch;
    } else if (componentFilter === 'with') {
      return matchesSearch && category.componentCount > 0;
    } else {
      return matchesSearch && category.componentCount === 0;
    }
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
      } else if (sortBy === 'components') {
        return sortDirection === 'asc'
          ? a.componentCount - b.componentCount
          : b.componentCount - a.componentCount;
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
  const [createCategory] = useMutation(CREATE_CATEGORY, {
    onCompleted: () => {
      setIsCreateDialogOpen(false);
      refetch();
    },
    onError: (error) => {
      console.error('Erro ao criar categoria:', error);
    }
  });

  // Mutation para atualizar categoria
  const [updateCategory] = useMutation(UPDATE_CATEGORY, {
    onCompleted: () => {
      setIsEditDialogOpen(false);
      refetch();
    },
    onError: (error) => {
      console.error('Erro ao atualizar categoria:', error);
    }
  });

  // Mutation para excluir categoria
  const [deleteCategory] = useMutation(DELETE_CATEGORY, {
    onCompleted: () => {
      setIsDeleteDialogOpen(false);
      refetch();
    },
    onError: (error) => {
      console.error('Erro ao excluir categoria:', error);
    }
  });

  // Manipulador para abrir o diálogo de criação
  const handleOpenCreateDialog = () => {
    setIsCreateDialogOpen(true);
  };

  // Manipulador para abrir o diálogo de edição
  const handleOpenEditDialog = (category: CategoryType, event?: React.MouseEvent) => {
    event?.stopPropagation();
    setCurrentCategory(category);
    setIsEditDialogOpen(true);
  };

  // Manipulador para abrir o diálogo de exclusão
  const handleOpenDeleteDialog = (category: CategoryType, event?: React.MouseEvent) => {
    event?.stopPropagation();
    setCurrentCategory(category);
    setIsDeleteDialogOpen(true);
  };

  // Manipulador para submeter o formulário de criação
  const handleCreateSubmit = (formData: CategoryInput) => {
    createCategory({
      variables: { input: formData }
    });
  };

  // Manipulador para submeter o formulário de edição
  const handleUpdateSubmit = (formData: CategoryInput) => {
    if (currentCategory?.id) {
      updateCategory({
        variables: {
          id: currentCategory.id,
          input: formData
        }
      });
    }
  };

  // Manipulador para confirmar exclusão
  const handleDeleteConfirm = () => {
    if (currentCategory?.id) {
      deleteCategory({
        variables: { id: currentCategory.id }
      });
    }
  };

  // Função para alternar a ordenação
  const toggleSort = (field: 'name' | 'date' | 'components') => {
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

  return (
    <AppLayout>
      <div className="container mx-auto py-8">
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
                  <Filter size={16} />
                  Filtrar
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setComponentFilter('all')}>
                  <div className="flex items-center justify-between w-full">
                    <span>Todas as categorias</span>
                    {componentFilter === 'all' && <span className="ml-2">✓</span>}
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setComponentFilter('with')}>
                  <div className="flex items-center justify-between w-full">
                    <span>Com componentes</span>
                    {componentFilter === 'with' && <span className="ml-2">✓</span>}
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setComponentFilter('without')}>
                  <div className="flex items-center justify-between w-full">
                    <span>Sem componentes</span>
                    {componentFilter === 'without' && <span className="ml-2">✓</span>}
                  </div>
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
                <DropdownMenuItem onClick={() => toggleSort('components')}>
                  <div className="flex items-center justify-between w-full">
                    <span>Número de componentes</span>
                    {sortBy === 'components' && (
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

        {loading ? (
          <div className="text-center py-10">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
            <p className="mt-2 text-muted-foreground">Carregando categorias...</p>
          </div>
        ) : error ? (
          <div className="text-center py-10 text-destructive">
            <p>Erro ao carregar categorias.</p>
            <p className="text-sm">{error.message}</p>
          </div>
        ) : sortedCategories.length === 0 ? (
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
                onClick={() => handleOpenEditDialog(category)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2 max-w-[70%]">
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
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleOpenEditDialog(category, e)}
                    >
                      <PencilIcon size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleOpenDeleteDialog(category, e)}
                      disabled={category.componentCount > 0}
                    >
                      <Trash2Icon size={16} />
                    </Button>
                  </div>
                </div>
                
                <div className="flex-grow overflow-hidden">
                  <p className="text-muted-foreground text-sm line-clamp-2">
                    {category.description || 'Sem descrição'}
                  </p>
                </div>
                
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
                  <div className="flex items-center">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                      category.componentCount > 0 
                        ? 'bg-primary/10 text-primary' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      <TagIcon size={12} className="mr-1" />
                      {category.componentCount} componente{category.componentCount !== 1 ? 's' : ''}
                    </span>
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
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Confirmar Exclusão</DialogTitle>
              <DialogDescription>
                Você está prestes a excluir a categoria "{currentCategory?.name}".
                Esta ação não pode ser desfeita.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              {currentCategory && (currentCategory as any).componentCount > 0 ? (
                <p className="text-sm font-medium text-destructive">
                  Esta categoria possui {(currentCategory as any).componentCount} componente(s) associado(s).
                  Por favor, remova ou reatribua os componentes antes de excluir a categoria.
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Se esta categoria possuir componentes associados, a exclusão será rejeitada.
                  Você precisará remover ou reassociar todos os componentes primeiro.
                </p>
              )}
            </div>
            <DialogFooter className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleDeleteConfirm}
                disabled={currentCategory && (currentCategory as any).componentCount > 0}
              >
                Excluir
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
} 