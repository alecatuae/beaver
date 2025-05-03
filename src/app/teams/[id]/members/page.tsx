/**
 * Página de Gerenciamento de Membros do Time
 * 
 * Permite adicionar e remover membros de um time específico.
 * Exibe a lista atual de membros e fornece interface para selecionar
 * novos usuários para adicionar ao time.
 * 
 * @author Time de Desenvolvimento Beaver
 * @since 2.0.0
 */
"use client";

import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { GET_TEAM, GET_USERS_NOT_IN_TEAM, ADD_TEAM_MEMBER, REMOVE_TEAM_MEMBER } from '@/lib/graphql';
import { AppLayout } from '@/components/layout/app-layout';
import { useRouter } from 'next/navigation';
import { 
  ChevronLeft, 
  Users, 
  Plus, 
  Trash2, 
  Search,
  Check,
  CalendarDays
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { useError } from '@/lib/contexts/error-context';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { 
  Select,
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';

type TeamParams = {
  params: {
    id: string;
  }
}

interface UserType {
  id: string;
  fullName: string;
  email: string;
  role?: string;
}

interface TeamMemberType {
  id: string;
  user: UserType;
  joinDate: string;
}

export default function TeamMembersPage({ params }: TeamParams) {
  const teamId = parseInt(params.id);
  
  // Estado para filtro de pesquisa
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estado para diálogo de adicionar membro
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [isAddingMember, setIsAddingMember] = useState(false);
  
  // Estado para diálogo de confirmação de remoção
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<TeamMemberType | null>(null);
  const [isRemovingMember, setIsRemovingMember] = useState(false);
  
  // Queries e mutations
  const { data: teamData, loading: teamLoading, error: teamError, refetch: refetchTeam } = useQuery(GET_TEAM, {
    variables: { id: teamId },
    fetchPolicy: 'network-only'
  });
  
  const { data: usersData, loading: usersLoading, refetch: refetchUsers } = useQuery(GET_USERS_NOT_IN_TEAM, {
    variables: { teamId },
    fetchPolicy: 'network-only',
    skip: !isAddDialogOpen // Só carrega quando o diálogo estiver aberto
  });
  
  const [addTeamMember] = useMutation(ADD_TEAM_MEMBER);
  const [removeTeamMember] = useMutation(REMOVE_TEAM_MEMBER);
  
  const router = useRouter();
  const { toast } = useToast();
  const { handleError } = useError();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleAddMemberClick = () => {
    setSelectedUserId('');
    setIsAddDialogOpen(true);
  };

  const handleConfirmAddMember = async () => {
    if (!selectedUserId) {
      toast({
        title: "Seleção necessária",
        description: "Selecione um usuário para adicionar ao time.",
        variant: "destructive"
      });
      return;
    }

    setIsAddingMember(true);
    
    try {
      await addTeamMember({
        variables: {
          input: {
            teamId,
            userId: parseInt(selectedUserId),
            joinDate: new Date().toISOString()
          }
        }
      });
      
      toast({
        title: "Membro adicionado",
        description: "O usuário foi adicionado ao time com sucesso."
      });
      
      refetchTeam();
      setIsAddDialogOpen(false);
    } catch (err) {
      handleError(err, { component: 'TeamMembersPage.handleConfirmAddMember' });
    } finally {
      setIsAddingMember(false);
    }
  };

  const handleRemoveMemberClick = (member: TeamMemberType) => {
    setMemberToRemove(member);
    setIsRemoveDialogOpen(true);
  };

  const handleConfirmRemoveMember = async () => {
    if (!memberToRemove) return;

    setIsRemovingMember(true);
    
    try {
      await removeTeamMember({
        variables: {
          teamId,
          userId: parseInt(memberToRemove.user.id)
        }
      });
      
      toast({
        title: "Membro removido",
        description: "O usuário foi removido do time com sucesso."
      });
      
      refetchTeam();
      setIsRemoveDialogOpen(false);
    } catch (err) {
      handleError(err, { component: 'TeamMembersPage.handleConfirmRemoveMember' });
    } finally {
      setIsRemovingMember(false);
    }
  };

  if (teamLoading) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    );
  }

  if (teamError) {
    handleError(teamError, { component: 'TeamMembersPage' });
    return (
      <AppLayout>
        <div className="bg-red-50 border border-red-200 rounded-md p-4 my-4 dark:bg-red-900/10 dark:border-red-900/30">
          <h3 className="text-sm font-medium text-red-800 dark:text-red-400">Erro ao carregar dados do time</h3>
          <p className="text-sm text-red-700 mt-1 dark:text-red-400/80">{teamError.message}</p>
          <Button 
            variant="outline" 
            className="mt-2" 
            onClick={() => router.push('/teams')}
          >
            Voltar
          </Button>
        </div>
      </AppLayout>
    );
  }

  const team = teamData?.team;
  if (!team) {
    return (
      <AppLayout>
        <div className="bg-amber-50 border border-amber-200 rounded-md p-4 my-4 dark:bg-amber-900/10 dark:border-amber-900/30">
          <h3 className="text-sm font-medium text-amber-800 dark:text-amber-400">Time não encontrado</h3>
          <p className="text-sm text-amber-700 mt-1 dark:text-amber-400/80">O time solicitado não existe ou foi removido.</p>
          <Button 
            variant="outline" 
            className="mt-2" 
            onClick={() => router.push('/teams')}
          >
            Voltar
          </Button>
        </div>
      </AppLayout>
    );
  }

  const members = team.members || [];
  const filteredMembers = searchTerm 
    ? members.filter(member => 
        member.user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.user.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : members;

  const availableUsers = usersData?.usersNotInTeam || [];

  return (
    <AppLayout>
      <div className="animate-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div className="flex items-center">
            <Link href={`/teams/${teamId}`}>
              <Button variant="ghost" className="mr-4">
                <ChevronLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold flex items-center">
                <Users className="mr-2 h-6 w-6 text-primary" />
                Membros: {team.name}
              </h1>
              <p className="text-muted-foreground mt-1">
                Gerencie os membros do time
              </p>
            </div>
          </div>
          <Button onClick={handleAddMemberClick}>
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Membro
          </Button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nome ou email..."
                className="pl-9"
                value={searchTerm}
                onChange={handleSearchChange}
              />
            </div>
          </div>

          {filteredMembers.length === 0 ? (
            <div className="text-center py-12">
              {searchTerm ? (
                <>
                  <Search className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">Nenhum resultado encontrado</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Nenhum membro corresponde ao termo de busca "{searchTerm}".
                  </p>
                </>
              ) : (
                <>
                  <Users className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">Nenhum membro</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Este time ainda não possui membros. Clique em "Adicionar Membro" para começar.
                  </p>
                </>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nome</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Email</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Função</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Desde</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredMembers.map((member) => (
                    <tr key={member.id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{member.user.fullName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{member.user.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        <span className="px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-700">
                          {member.user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center">
                          <CalendarDays className="h-4 w-4 mr-1 text-gray-400" />
                          {formatDistanceToNow(new Date(member.joinDate), { addSuffix: true, locale: ptBR })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveMemberClick(member)}
                          className="text-red-500 hover:bg-red-100 hover:text-red-700 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        {/* Diálogo para adicionar membro */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Membro ao Time</DialogTitle>
            </DialogHeader>
            
            <div className="py-4">
              <p className="text-sm text-muted-foreground mb-4">
                Selecione um usuário para adicionar ao time "{team.name}".
              </p>
              
              {usersLoading ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : availableUsers.length === 0 ? (
                <div className="text-center py-4">
                  <Users className="mx-auto h-8 w-8 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    Não há usuários disponíveis para adicionar.
                  </p>
                </div>
              ) : (
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um usuário" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        <div className="flex flex-col">
                          <span>{user.fullName}</span>
                          <span className="text-xs text-gray-500">{user.email}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleConfirmAddMember} 
                disabled={!selectedUserId || isAddingMember || availableUsers.length === 0}
              >
                {isAddingMember ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Adicionando...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Adicionar
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Diálogo de confirmação para remover membro */}
        <Dialog open={isRemoveDialogOpen} onOpenChange={setIsRemoveDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar remoção</DialogTitle>
            </DialogHeader>
            
            <div className="py-4">
              <p>
                Tem certeza que deseja remover <strong>{memberToRemove?.user.fullName}</strong> do time?
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Esta ação não pode ser desfeita.
              </p>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsRemoveDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleConfirmRemoveMember}
                disabled={isRemovingMember}
              >
                {isRemovingMember ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Removendo...
                  </>
                ) : (
                  "Remover"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
} 