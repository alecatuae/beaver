/**
 * Página Principal de Times
 * 
 * Lista todos os times cadastrados no sistema, exibindo informações básicas
 * como nome, descrição, número de membros e componentes associados.
 * Permite acessar detalhes, membros e edição de cada time, além de criar novos times
 * e excluir os existentes com confirmação.
 * 
 * @author Time de Desenvolvimento Beaver
 * @since 2.0.0
 */
"use client";

import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { GET_TEAMS, DELETE_TEAM, TeamType } from '@/lib/graphql';
import { AppLayout } from '@/components/layout/app-layout';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Users, 
  Info, 
  Cube,
  UserPlus,
  Tag
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { useError } from '@/lib/contexts/error-context';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function TeamsPage() {
  const { data, loading, error, refetch } = useQuery(GET_TEAMS);
  const [deleteTeam] = useMutation(DELETE_TEAM);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<TeamType | null>(null);
  const { toast } = useToast();
  const { handleError } = useError();

  const handleDeleteClick = (team: TeamType) => {
    setSelectedTeam(team);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedTeam) return;

    try {
      await deleteTeam({
        variables: { id: selectedTeam.id }
      });

      toast({
        title: "Time excluído",
        description: `O time "${selectedTeam.name}" foi excluído com sucesso.`
      });

      refetch();
    } catch (err) {
      handleError(err, { component: 'TeamsPage.confirmDelete' });
    } finally {
      setIsDeleteDialogOpen(false);
      setSelectedTeam(null);
    }
  };

  const cancelDelete = () => {
    setIsDeleteDialogOpen(false);
    setSelectedTeam(null);
  };

  const renderTeamsList = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 my-4 dark:bg-red-900/10 dark:border-red-900/30">
          <h3 className="text-sm font-medium text-red-800 dark:text-red-400">Erro ao carregar times</h3>
          <p className="text-sm text-red-700 mt-1 dark:text-red-400/80">{error.message}</p>
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

    const teams = data?.teams || [];

    if (teams.length === 0) {
      return (
        <div className="text-center bg-gray-50 dark:bg-gray-800 rounded-md p-8 my-4">
          <Users className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">Nenhum time</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Comece criando seu primeiro time para gerenciar responsabilidades por componentes.
          </p>
          <div className="mt-6">
            <Link href="/teams/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Criar time
              </Button>
            </Link>
          </div>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.map((team) => (
          <div 
            key={team.id} 
            className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow duration-200"
          >
            <div className="p-5">
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-primary/10 rounded-md">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                    {team.name}
                  </h3>
                </div>
                <div className="flex space-x-1">
                  <Link href={`/teams/${team.id}/edit`}>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Edit className="h-4 w-4 text-gray-500" />
                    </Button>
                  </Link>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8" 
                    onClick={() => handleDeleteClick(team)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
              
              {team.description && (
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                  {team.description}
                </p>
              )}
              
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <UserPlus className="h-4 w-4 text-gray-400" />
                  <span className="text-xs text-gray-500">
                    {team.members?.length || 0} membros
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Cube className="h-4 w-4 text-gray-400" />
                  <span className="text-xs text-gray-500">
                    {team.components?.length || 0} componentes
                  </span>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                <div className="flex space-x-2">
                  <Link href={`/teams/${team.id}`} className="flex-1">
                    <Button variant="outline" className="w-full" size="sm">
                      <Info className="h-4 w-4 mr-2" />
                      Detalhes
                    </Button>
                  </Link>
                  <Link href={`/teams/${team.id}/members`} className="flex-1">
                    <Button variant="secondary" className="w-full" size="sm">
                      <Users className="h-4 w-4 mr-2" />
                      Membros
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
            <h1 className="text-2xl font-bold">Gerenciamento de Times</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie times e suas responsabilidades por componentes
            </p>
          </div>
          <Link href="/teams/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Time
            </Button>
          </Link>
        </div>

        {renderTeamsList()}

        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar exclusão</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p>
                Tem certeza que deseja excluir o time "{selectedTeam?.name}"?
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Esta ação irá remover todos os membros do time e desassociar todos os componentes relacionados.
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