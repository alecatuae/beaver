/**
 * Página de Detalhes do Ambiente
 * 
 * Exibe informações detalhadas sobre um ambiente específico e lista
 * todas as instâncias de componentes associadas a ele.
 * 
 * @author Time de Desenvolvimento Beaver
 * @since 2.0.0
 */
"use client";

import React from 'react';
import { useQuery } from '@apollo/client';
import { GET_ENVIRONMENT, GET_COMPONENT_INSTANCES_BY_ENVIRONMENT } from '@/lib/graphql';
import { AppLayout } from '@/components/layout/app-layout';
import { 
  ChevronLeft, 
  Edit, 
  Server, 
  Database, 
  Calendar, 
  Box, 
  Tag, 
  AlertCircle,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useError } from '@/lib/contexts/error-context';

type EnvironmentParams = {
  params: {
    id: string;
  }
}

export default function EnvironmentDetailsPage({ params }: EnvironmentParams) {
  const environmentId = parseInt(params.id);
  
  const { data: environmentData, loading: environmentLoading, error: environmentError } = useQuery(
    GET_ENVIRONMENT, 
    { 
      variables: { id: environmentId },
      skip: isNaN(environmentId)
    }
  );

  const { data: instancesData, loading: instancesLoading, error: instancesError } = useQuery(
    GET_COMPONENT_INSTANCES_BY_ENVIRONMENT,
    {
      variables: { environmentId },
      skip: isNaN(environmentId)
    }
  );

  const { handleError } = useError();

  if (isNaN(environmentId)) {
    return (
      <AppLayout>
        <div className="bg-red-50 border border-red-200 rounded-md p-4 my-4">
          <h3 className="text-sm font-medium text-red-800">ID de ambiente inválido</h3>
          <p className="text-sm text-red-700 mt-1">O ID fornecido não é um número válido.</p>
          <Link href="/environments">
            <Button variant="outline" className="mt-2">
              Voltar para ambientes
            </Button>
          </Link>
        </div>
      </AppLayout>
    );
  }

  if (environmentError) {
    handleError(environmentError, { component: 'EnvironmentDetailsPage' });
  }

  if (instancesError) {
    handleError(instancesError, { component: 'EnvironmentDetailsPage.instances' });
  }

  const environment = environmentData?.environment;
  const instances = instancesData?.componentInstancesByEnvironment || [];

  const renderHeader = () => (
    <div className="flex items-center mb-6">
      <Link href="/environments">
        <Button variant="ghost" className="mr-4">
          <ChevronLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
      </Link>
      <div className="flex-1">
        <h1 className="text-2xl font-bold flex items-center">
          {environmentLoading ? 'Carregando...' : environment?.name}
        </h1>
        {environment && (
          <p className="text-muted-foreground mt-1">
            {environment.description || 'Sem descrição'}
          </p>
        )}
      </div>
      {environment && (
        <Link href={`/environments/${environmentId}/edit`}>
          <Button variant="outline">
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
        </Link>
      )}
    </div>
  );

  const renderEnvironmentInfo = () => {
    if (environmentLoading) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      );
    }

    if (!environment) {
      return (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 my-4">
          <h3 className="text-sm font-medium text-yellow-800">Ambiente não encontrado</h3>
          <p className="text-sm text-yellow-700 mt-1">O ambiente solicitado não existe ou foi removido.</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-5">
              <h2 className="text-lg font-semibold mb-4 pb-2 border-b dark:border-gray-700">
                Informações do Ambiente
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="bg-primary/10 rounded-md p-2 mr-3">
                    <Server className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Nome
                    </p>
                    <p className="text-base font-medium">
                      {environment.name}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-primary/10 rounded-md p-2 mr-3">
                    <Database className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Instâncias
                    </p>
                    <p className="text-base font-medium">
                      {environment.instances?.length || 0} instâncias de componentes
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-primary/10 rounded-md p-2 mr-3">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Data de Criação
                    </p>
                    <p className="text-base font-medium">
                      {format(new Date(environment.createdAt), 'PPP', { locale: ptBR })}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(environment.createdAt), { 
                        addSuffix: true, 
                        locale: ptBR 
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-5">
              <div className="flex justify-between items-center mb-4 pb-2 border-b dark:border-gray-700">
                <h2 className="text-lg font-semibold">
                  Instâncias de Componentes
                </h2>
                <Link href={`/instances/new?environmentId=${environmentId}`}>
                  <Button variant="outline" size="sm">
                    Nova Instância
                  </Button>
                </Link>
              </div>
              
              {instancesLoading ? (
                <div className="flex justify-center items-center h-40">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : instances.length === 0 ? (
                <div className="text-center p-8">
                  <Server className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                    Nenhuma instância
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Este ambiente ainda não possui instâncias de componentes.
                  </p>
                </div>
              ) : (
                <div className="divide-y dark:divide-gray-700">
                  {instances.map(instance => (
                    <div key={instance.id} className="py-4 first:pt-0 last:pb-0">
                      <div className="flex justify-between items-start">
                        <div className="flex items-start">
                          <div className="bg-gray-100 dark:bg-gray-700 rounded-md p-2 mr-3">
                            <Box className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                          </div>
                          <div>
                            <div className="flex items-center">
                              <Link 
                                href={`/components/${instance.component.id}`}
                                className="text-base font-medium hover:text-primary transition-colors"
                              >
                                {instance.component.name}
                              </Link>
                              <div className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                                instance.component.status === 'ACTIVE' 
                                  ? 'bg-green-100 text-green-800' 
                                  : instance.component.status === 'DEPRECATED'
                                    ? 'bg-orange-100 text-orange-800'
                                    : 'bg-gray-100 text-gray-800'
                              }`}>
                                {instance.component.status.toLowerCase()}
                              </div>
                            </div>
                            
                            {instance.hostname && (
                              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                                Hostname: {instance.hostname}
                              </p>
                            )}
                            
                            {instance.component.description && (
                              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                                {instance.component.description}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <Link href={`/instances/${instance.id}`}>
                          <Button variant="ghost" size="sm">
                            Detalhes
                            <ChevronRight className="ml-2 h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                      
                      {instance.specs && Object.keys(instance.specs).length > 0 && (
                        <div className="mt-3 pl-10">
                          <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-md">
                            <p className="text-xs font-medium text-gray-500 mb-2">Especificações:</p>
                            <div className="grid grid-cols-2 gap-2">
                              {Object.entries(instance.specs).map(([key, value]) => (
                                <div key={key} className="flex items-center">
                                  <Tag className="h-3 w-3 text-gray-400 mr-1" />
                                  <span className="text-xs">
                                    <span className="font-medium">{key}:</span> {value}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <AppLayout>
      <div className="animate-in">
        {renderHeader()}
        {renderEnvironmentInfo()}
      </div>
    </AppLayout>
  );
} 