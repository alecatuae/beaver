"use client";

import React, { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
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
import { PlusCircle, PencilIcon, Trash2Icon, TagIcon } from 'lucide-react';
import CategoryForm from './category-form';
import { Input } from '@/components/ui/input';

export default function CategoriesPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<Partial<CategoryType> | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Consulta para buscar categorias
  const { loading, error, data, refetch } = useQuery(GET_CATEGORIES, {
    fetchPolicy: 'network-only',
    onError: (error) => {
      console.error('Erro na consulta GraphQL:', error);
    }
  });

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
  const handleOpenEditDialog = (category: CategoryType) => {
    setCurrentCategory(category);
    setIsEditDialogOpen(true);
  };

  // Manipulador para abrir o diálogo de exclusão
  const handleOpenDeleteDialog = (category: CategoryType) => {
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

  // Formatação das categorias para exibição
  const categories = data?.categories?.map((category: any) => ({
    ...category,
    createdAt: new Date(category.createdAt)
  })) || [];

  // Filtragem de categorias pelo termo de busca
  const filteredCategories = categories.filter((category: CategoryType) => {
    return category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           category.description?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gerenciamento de Categorias</h1>
        <Button onClick={handleOpenCreateDialog}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Nova Categoria
        </Button>
      </div>

      <div className="mb-6">
        <Input
          placeholder="Pesquisar categorias..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
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
      ) : filteredCategories.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          <p>Nenhuma categoria encontrada.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCategories.map((category: CategoryType) => (
            <div
              key={category.id}
              className="bg-card rounded-lg border shadow-sm p-4 h-[180px] flex flex-col"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-medium truncate max-w-[70%]">
                  {category.name}
                </h3>
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenEditDialog(category)}
                  >
                    <PencilIcon size={16} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenDeleteDialog(category)}
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
                <div className="flex items-center text-xs text-muted-foreground">
                  <TagIcon size={12} className="mr-1" />
                  {category.components?.length || 0} componentes
                </div>
                <div className="text-xs text-muted-foreground">
                  Criado em {new Date(category.createdAt).toLocaleDateString('pt-BR')}
                </div>
              </div>
            </div>
          ))}
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
            <DialogDescription className="pt-2">
              Tem certeza de que deseja excluir a categoria &quot;{currentCategory?.name}&quot;? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end gap-4 pt-4 mt-4 border-t">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="default" onClick={handleDeleteConfirm}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 