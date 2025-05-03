/**
 * Página Principal de Ambientes
 * 
 * Lista todos os ambientes cadastrados no sistema, exibindo informações básicas
 * como nome, descrição, número de instâncias e data de criação.
 * Permite acessar detalhes, status e edição de cada ambiente, além de criar novos ambientes
 * e excluir os existentes com confirmação.
 * 
 * @author Time de Desenvolvimento Beaver
 * @since 2.0.0
 */
"use client";

import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { GET_ENVIRONMENTS, DELETE_ENVIRONMENT, EnvironmentType } from '@/lib/graphql';
import { AppLayout } from '@/components/layout/app-layout';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Server, 
  Info, 
  MoreHorizontal,
  Database,
  Layers
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { useError } from '@/lib/contexts/error-context';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function EnvironmentsPage() {
  const { data, loading, error, refetch } = useQuery(GET_ENVIRONMENTS);
  const [deleteEnvironment] = useMutation(DELETE_ENVIRONMENT);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedEnvironment, setSelectedEnvironment] = useState<EnvironmentType | null>(null);
  const { toast } = useToast();
  const { handleError } = useError();

  const handleDeleteClick = (environment: EnvironmentType) => {
    setSelectedEnvironment(environment);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedEnvironment) return;

    try {
      await deleteEnvironment({
        variables: { id: selectedEnvironment.id }
      });

      toast({
        title: "Ambiente excluído",
        description: `O ambiente "${selectedEnvironment.name}" foi excluído com sucesso.`
      });

      refetch();
    } catch (err) {
      handleError(err, { component: 'EnvironmentsPage.confirmDelete' });
    } finally {
      setIsDeleteDialogOpen(false);
      setSelectedEnvironment(null);
    }
  };

  const cancelDelete = () => {
    setIsDeleteDialogOpen(false);
    setSelectedEnvironment(null);
  };

  const renderEnvironmentsList = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 my-4">
          <h3 className="text-sm font-medium text-red-800">Erro ao carregar ambientes</h3>
          <p className="text-sm text-red-700 mt-1">{error.message}</p>
          <Button 
            variant="outline" 
            className="mt-2" 
            onClick={() => refetch()}
          >
            Tentar novamente
          </Button>
        </div>
      );
    }

    const environments = data?.environments || [];

    if (environments.length === 0) {
      return (
        <div className="text-center bg-gray-50 dark:bg-gray-800 rounded-md p-8 my-4">
          <Server className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">Nenhum ambiente</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Comece criando seu primeiro ambiente para gerenciar instâncias de componentes.
          </p>
          <div className="mt-6">
            <Link href="/environments/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Criar ambiente
              </Button>
            </Link>
          </div>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {environments.map((environment) => (
          <div 
            key={environment.id} 
            className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow duration-200"
          >
            <div className="p-5">
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-primary/10 rounded-md">
                    <Server className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                    {environment.name}
                  </h3>
                </div>
                <div className="flex space-x-1">
                  <Link href={`/environments/${environment.id}/edit`}>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Edit className="h-4 w-4 text-gray-500" />
                    </Button>
                  </Link>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8" 
                    onClick={() => handleDeleteClick(environment)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
              
              {environment.description && (
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                  {environment.description}
                </p>
              )}
              
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Database className="h-4 w-4 text-gray-400" />
                  <span className="text-xs text-gray-500">
                    {environment.instances?.length || 0} instâncias
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  Criado {formatDistanceToNow(new Date(environment.createdAt), { 
                    addSuffix: true,
                    locale: ptBR 
                  })}
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                <div className="flex space-x-2">
                  <Link href={`/environments/${environment.id}`} className="flex-1">
                    <Button variant="outline" className="w-full" size="sm">
                      <Info className="h-4 w-4 mr-2" />
                      Detalhes
                    </Button>
                  </Link>
                  <Link href={`/environments/${environment.id}/status`} className="flex-1">
                    <Button variant="secondary" className="w-full" size="sm">
                      <Layers className="h-4 w-4 mr-2" />
                      Status
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <AppLayout>
      <div className="animate-in">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Gerenciamento de Ambientes</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie ambientes para organizar instâncias de componentes
            </p>
          </div>
          <Link href="/environments/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Ambiente
            </Button>
          </Link>
        </div>

        {renderEnvironmentsList()}

        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar exclusão</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p>
                Tem certeza que deseja excluir o ambiente "{selectedEnvironment?.name}"?
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Esta ação também removerá todas as instâncias de componentes associadas a este ambiente. 
                Esta operação não pode ser desfeita.
              </p>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={cancelDelete}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={confirmDelete}>
                Excluir
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
} 