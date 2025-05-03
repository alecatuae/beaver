/**
 * Página de Detalhes do Time
 * 
 * Exibe informações detalhadas sobre um time específico e lista
 * tanto os membros quanto os componentes associados a ele.
 * 
 * @author Time de Desenvolvimento Beaver
 * @since 2.0.0
 */
"use client";

import React from 'react';
import { useQuery } from '@apollo/client';
import { GET_TEAM } from '@/lib/graphql';
import { AppLayout } from '@/components/layout/app-layout';
import { 
  ChevronLeft, 
  Edit, 
  Users, 
  Calendar, 
  Cube, 
  AlertCircle,
  ChevronRight,
  UserPlus,
  Server,
  Tag
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useError } from '@/lib/contexts/error-context';

type TeamParams = {
  params: {
    id: string;
  }
}

export default function TeamDetailsPage({ params }: TeamParams) {
  const teamId = parseInt(params.id);
  const { data, loading, error } = useQuery(GET_TEAM, {
    variables: { id: teamId },
    fetchPolicy: 'network-only'
  });
  
  const { handleError } = useError();

  if (loading) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    handleError(error, { component: 'TeamDetailsPage' });
    return (
      <AppLayout>
        <div className="bg-red-50 border border-red-200 rounded-md p-4 my-4 dark:bg-red-900/10 dark:border-red-900/30">
          <h3 className="text-sm font-medium text-red-800 dark:text-red-400">Erro ao carregar time</h3>
          <p className="text-sm text-red-700 mt-1 dark:text-red-400/80">{error.message}</p>
          <Button 
            variant="outline" 
            className="mt-2" 
            onClick={() => window.location.href = '/teams'}
          >
            Voltar
          </Button>
        </div>
      </AppLayout>
    );
  }

  const team = data?.team;
  if (!team) {
    return (
      <AppLayout>
        <div className="bg-amber-50 border border-amber-200 rounded-md p-4 my-4 dark:bg-amber-900/10 dark:border-amber-900/30">
          <h3 className="text-sm font-medium text-amber-800 dark:text-amber-400">Time não encontrado</h3>
          <p className="text-sm text-amber-700 mt-1 dark:text-amber-400/80">O time solicitado não existe ou foi removido.</p>
          <Button 
            variant="outline" 
            className="mt-2" 
            onClick={() => window.location.href = '/teams'}
          >
            Voltar
          </Button>
        </div>
      </AppLayout>
    );
  }

  const renderHeader = () => (
    <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
      <div className="flex items-center">
        <Link href="/teams">
          <Button variant="ghost" className="mr-4">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center">
            <Users className="mr-2 h-6 w-6 text-primary" />
            {team.name}
          </h1>
          <p className="text-muted-foreground mt-1">
            Criado {format(new Date(team.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>
      </div>
      <div className="flex space-x-2">
        <Link href={`/teams/${teamId}/members`}>
          <Button variant="outline">
            <UserPlus className="mr-2 h-4 w-4" />
            Gerenciar Membros
          </Button>
        </Link>
        <Link href={`/teams/${teamId}/edit`}>
          <Button>
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </Button>
        </Link>
      </div>
    </div>
  );

  const renderTeamInfo = () => {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Informações do Time</h2>
        
        {team.description && (
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Descrição</h3>
            <p className="text-gray-900 dark:text-gray-100">{team.description}</p>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <div className="flex items-center">
            <div className="p-2 bg-primary/10 rounded-md mr-3">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Membros</h3>
              <p className="text-gray-900 dark:text-gray-100">{team.members?.length || 0} membros</p>
            </div>
          </div>
          
          <div className="flex items-center">
            <div className="p-2 bg-primary/10 rounded-md mr-3">
              <Cube className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Componentes</h3>
              <p className="text-gray-900 dark:text-gray-100">{team.components?.length || 0} componentes</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderMembers = () => {
    const members = team.members || [];
    
    if (members.length === 0) {
      return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Membros do Time</h2>
            <Link href={`/teams/${teamId}/members`}>
              <Button variant="outline" size="sm">
                <UserPlus className="mr-2 h-4 w-4" />
                Adicionar Membros
              </Button>
            </Link>
          </div>
          
          <div className="text-center py-8">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">Nenhum membro</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Este time ainda não possui membros. Adicione membros para atribuir responsabilidades.
            </p>
          </div>
        </div>
      );
    }
    
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Membros do Time</h2>
          <Link href={`/teams/${teamId}/members`}>
            <Button variant="outline" size="sm">
              <UserPlus className="mr-2 h-4 w-4" />
              Gerenciar Membros
            </Button>
          </Link>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nome</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Email</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Função</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Desde</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {members.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{member.user.fullName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{member.user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {member.user.role}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {formatDistanceToNow(new Date(member.joinDate), { addSuffix: true, locale: ptBR })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderComponents = () => {
    const components = team.components || [];
    
    if (components.length === 0) {
      return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Componentes Responsáveis</h2>
          
          <div className="text-center py-8">
            <Cube className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">Nenhum componente</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Este time ainda não é responsável por nenhum componente.
            </p>
          </div>
        </div>
      );
    }
    
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Componentes Responsáveis</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {components.map((component) => {
            const statusColors = {
              'ACTIVE': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
              'PLANNED': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
              'DEPRECATED': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
            };
            
            const statusColor = statusColors[component.status] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
            
            return (
              <div key={component.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-sm transition-shadow">
                <div className="flex justify-between items-start">
                  <h3 className="font-medium">{component.name}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${statusColor}`}>
                    {component.status}
                  </span>
                </div>
                
                {component.description && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 line-clamp-2">
                    {component.description}
                  </p>
                )}
                
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Server className="h-4 w-4 text-gray-400" />
                    <span className="text-xs text-gray-500">
                      {component.instances?.length || 0} instâncias
                    </span>
                  </div>
                  
                  <Link href={`/components/${component.id}`}>
                    <Button variant="ghost" size="sm" className="text-xs">
                      Ver detalhes
                      <ChevronRight className="ml-1 h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <AppLayout>
      <div className="animate-in">
        {renderHeader()}
        {renderTeamInfo()}
        {renderMembers()}
        {renderComponents()}
      </div>
    </AppLayout>
  );
} 