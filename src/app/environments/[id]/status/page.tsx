/**
 * Página de Status do Ambiente
 * 
 * Exibe um dashboard com métricas e status de todas as instâncias associadas a um ambiente.
 * A página inclui indicadores de saúde, contadores de status e uma tabela detalhada 
 * com todas as instâncias que podem ser filtradas por nome.
 * 
 * @author Time de Desenvolvimento Beaver
 * @since 2.0.0
 */
"use client";

import React, { useState } from 'react';
import { useQuery } from '@apollo/client';
import { GET_ENVIRONMENT, GET_COMPONENT_INSTANCES_BY_ENVIRONMENT } from '@/lib/graphql';
import { AppLayout } from '@/components/layout/app-layout';
import { 
  ChevronLeft, 
  Server, 
  ShieldCheck,
  ShieldAlert,
  ShieldOff,
  CheckCircle,
  AlertCircle,
  Clock,
  AlertTriangle,
  BarChart3,
  User,
  Search
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useError } from '@/lib/contexts/error-context';

type EnvironmentParams = {
  params: {
    id: string;
  }
}

// Simulação de status para o dashboard
const STATUS_MAP = {
  'HEALTHY': { icon: <CheckCircle className="text-green-500 h-5 w-5" />, label: 'Saudável' },
  'WARNING': { icon: <AlertTriangle className="text-amber-500 h-5 w-5" />, label: 'Alerta' },
  'CRITICAL': { icon: <AlertCircle className="text-red-500 h-5 w-5" />, label: 'Crítico' },
  'UNKNOWN': { icon: <Clock className="text-gray-500 h-5 w-5" />, label: 'Desconhecido' }
};

const STATUS_COLORS = {
  'ACTIVE': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  'PLANNED': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  'DEPRECATED': 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300',
  'INACTIVE': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
};

export default function EnvironmentStatusPage({ params }: EnvironmentParams) {
  const environmentId = parseInt(params.id);
  const [searchQuery, setSearchQuery] = useState('');
  
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
    handleError(environmentError, { component: 'EnvironmentStatusPage' });
  }

  if (instancesError) {
    handleError(instancesError, { component: 'EnvironmentStatusPage.instances' });
  }

  const environment = environmentData?.environment;
  const instances = instancesData?.componentInstancesByEnvironment || [];

  // Filtrar instâncias pelo termo de busca
  const filteredInstances = instances.filter(instance => 
    instance.component.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (instance.hostname && instance.hostname.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Calcular estatísticas para o dashboard
  const calculateStats = () => {
    if (!instances.length) return { total: 0, statusCounts: {}, healthCounts: {} };

    const statusCounts = {
      ACTIVE: 0,
      PLANNED: 0,
      DEPRECATED: 0,
      INACTIVE: 0
    };

    const healthCounts = {
      HEALTHY: 0,
      WARNING: 0,
      CRITICAL: 0,
      UNKNOWN: 0
    };

    instances.forEach(instance => {
      // Contar por status do componente
      if (instance.component.status) {
        statusCounts[instance.component.status] = (statusCounts[instance.component.status] || 0) + 1;
      }

      // Simular status de saúde com base em um valor aleatório mas consistente por instância
      // Em uma implementação real, isso viria de dados reais
      const instanceId = parseInt(instance.id);
      const healthStatus = ['HEALTHY', 'WARNING', 'CRITICAL', 'UNKNOWN'][(instanceId % 4)];
      healthCounts[healthStatus] = (healthCounts[healthStatus] || 0) + 1;
    });

    return {
      total: instances.length,
      statusCounts,
      healthCounts
    };
  };

  const stats = calculateStats();

  const renderHeader = () => (
    <div className="flex items-center mb-6">
      <Link href={`/environments/${environmentId}`}>
        <Button variant="ghost" className="mr-4">
          <ChevronLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
      </Link>
      <div className="flex-1">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold">
            {environmentLoading ? 'Carregando...' : environment?.name} - Status Dashboard
          </h1>
        </div>
        {environment && (
          <p className="text-muted-foreground mt-1">
            Visão geral de status do ambiente
          </p>
        )}
      </div>
    </div>
  );

  const renderStatusDashboard = () => {
    if (environmentLoading || instancesLoading) {
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
      <div className="space-y-6">
        {/* Cards de estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-5">
            <div className="flex items-center">
              <div className="p-3 rounded-md bg-primary/10">
                <Server className="h-6 w-6 text-primary" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">Total de Instâncias</p>
                <h3 className="text-2xl font-bold">{stats.total}</h3>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-5">
            <div className="flex items-center">
              <div className="p-3 rounded-md bg-green-100 dark:bg-green-900">
                <ShieldCheck className="h-6 w-6 text-green-600 dark:text-green-300" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">Saudáveis</p>
                <h3 className="text-2xl font-bold">{stats.healthCounts.HEALTHY || 0}</h3>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-5">
            <div className="flex items-center">
              <div className="p-3 rounded-md bg-amber-100 dark:bg-amber-900">
                <ShieldAlert className="h-6 w-6 text-amber-600 dark:text-amber-300" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">Alertas</p>
                <h3 className="text-2xl font-bold">{stats.healthCounts.WARNING || 0}</h3>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-5">
            <div className="flex items-center">
              <div className="p-3 rounded-md bg-red-100 dark:bg-red-900">
                <ShieldOff className="h-6 w-6 text-red-600 dark:text-red-300" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">Críticos</p>
                <h3 className="text-2xl font-bold">{stats.healthCounts.CRITICAL || 0}</h3>
              </div>
            </div>
          </div>
        </div>
        
        {/* Filtro e tabela de instâncias */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Status de Instâncias</h2>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input 
                  className="pl-9" 
                  placeholder="Buscar componente..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
          
          {instances.length === 0 ? (
            <div className="p-8 text-center">
              <Server className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                Nenhuma instância
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Este ambiente ainda não possui instâncias de componentes.
              </p>
            </div>
          ) : filteredInstances.length === 0 ? (
            <div className="p-8 text-center">
              <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                Nenhum resultado
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Não foram encontradas instâncias correspondentes à sua busca.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-900 text-left">
                    <th className="px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">Componente</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">Hostname</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">Status</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">Saúde</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">Responsável</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredInstances.map((instance, index) => {
                    // Simulação de status de saúde baseado no ID da instância
                    const healthStatus = ['HEALTHY', 'WARNING', 'CRITICAL', 'UNKNOWN'][(parseInt(instance.id) % 4)];
                    const healthInfo = STATUS_MAP[healthStatus];

                    return (
                      <tr key={instance.id} className={index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900'}>
                        <td className="px-4 py-3">
                          <Link 
                            href={`/components/${instance.component.id}`}
                            className="text-sm font-medium hover:text-primary transition-colors"
                          >
                            {instance.component.name}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                          {instance.hostname || '-'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            STATUS_COLORS[instance.component.status] || 'bg-gray-100 text-gray-800'
                          }`}>
                            {instance.component.status.toLowerCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            {healthInfo.icon}
                            <span className="ml-1.5 text-sm">{healthInfo.label}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            <User className="h-4 w-4 text-gray-400 mr-1.5" />
                            <span className="text-sm">
                              {/* Simulação de responsável, em implementação real viria do banco */}
                              {['Ana Silva', 'Carlos Santos', 'Júlia Oliveira', 'Rafael Pereira'][index % 4]}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex space-x-2">
                            <Link href={`/instances/${instance.id}`}>
                              <Button variant="outline" size="sm">
                                Detalhes
                              </Button>
                            </Link>
                            <Link href={`/instances/${instance.id}/metrics`}>
                              <Button variant="ghost" size="sm">
                                <BarChart3 className="h-4 w-4" />
                              </Button>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <AppLayout>
      <div className="animate-in">
        {renderHeader()}
        {renderStatusDashboard()}
      </div>
    </AppLayout>
  );
} 