/**
 * Página de Fluxo de Deployment
 * 
 * Exibe o pipeline de deployment e o histórico de deployments para um ambiente específico.
 * Essa implementação contém dados simulados que podem ser substituídos por dados reais em uma
 * implementação futura conectada a um sistema CI/CD.
 * 
 * @author Time de Desenvolvimento Beaver
 * @since 2.0.0
 */
"use client";

import React from 'react';
import { useQuery } from '@apollo/client';
import { GET_ENVIRONMENT } from '@/lib/graphql';
import { AppLayout } from '@/components/layout/app-layout';
import { 
  ChevronLeft, 
  Server, 
  ArrowRight,
  Check,
  AlertTriangle,
  X,
  Clock,
  RefreshCw,
  GitBranch,
  Package,
  Upload,
  CheckCircle
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useError } from '@/lib/contexts/error-context';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type EnvironmentParams = {
  params: {
    id: string;
  }
}

// Simulação de dados de deployment
const MOCK_DEPLOYMENTS = [
  {
    id: 1,
    component: 'API de Usuários',
    version: 'v1.2.3',
    date: new Date(2023, 5, 15, 14, 30),
    status: 'success',
    steps: [
      { name: 'Build', status: 'success', time: '2m 10s' },
      { name: 'Testes', status: 'success', time: '4m 32s' },
      { name: 'Deploy', status: 'success', time: '1m 45s' },
      { name: 'Verificação', status: 'success', time: '30s' }
    ],
    author: 'Maria Oliveira'
  },
  {
    id: 2,
    component: 'Frontend Dashboard',
    version: 'v2.0.1',
    date: new Date(2023, 5, 14, 11, 15),
    status: 'warning',
    steps: [
      { name: 'Build', status: 'success', time: '1m 50s' },
      { name: 'Testes', status: 'warning', time: '3m 10s' },
      { name: 'Deploy', status: 'success', time: '1m 20s' },
      { name: 'Verificação', status: 'success', time: '25s' }
    ],
    author: 'Lucas Pereira'
  },
  {
    id: 3,
    component: 'Serviço de Autenticação',
    version: 'v1.1.0',
    date: new Date(2023, 5, 13, 16, 45),
    status: 'failed',
    steps: [
      { name: 'Build', status: 'success', time: '1m 20s' },
      { name: 'Testes', status: 'success', time: '2m 45s' },
      { name: 'Deploy', status: 'failed', time: '0m 40s' },
      { name: 'Verificação', status: 'pending', time: '-' }
    ],
    author: 'Carlos Santos'
  },
  {
    id: 4,
    component: 'API de Pagamentos',
    version: 'v1.5.2',
    date: new Date(2023, 5, 12, 9, 30),
    status: 'success',
    steps: [
      { name: 'Build', status: 'success', time: '1m 55s' },
      { name: 'Testes', status: 'success', time: '3m 20s' },
      { name: 'Deploy', status: 'success', time: '1m 15s' },
      { name: 'Verificação', status: 'success', time: '40s' }
    ],
    author: 'Ana Silva'
  },
  {
    id: 5,
    component: 'Microserviço de Notificações',
    version: 'v1.0.1',
    date: new Date(2023, 5, 11, 14, 20),
    status: 'running',
    steps: [
      { name: 'Build', status: 'success', time: '1m 40s' },
      { name: 'Testes', status: 'success', time: '2m 50s' },
      { name: 'Deploy', status: 'running', time: '0m 30s...' },
      { name: 'Verificação', status: 'pending', time: '-' }
    ],
    author: 'Júlia Oliveira'
  }
];

// Status de cada etapa
const STEP_STATUS_MAP = {
  'success': { 
    icon: <Check className="h-4 w-4 text-white" />,
    bgColor: 'bg-green-500'
  },
  'warning': { 
    icon: <AlertTriangle className="h-4 w-4 text-white" />,
    bgColor: 'bg-yellow-500'
  },
  'failed': { 
    icon: <X className="h-4 w-4 text-white" />,
    bgColor: 'bg-red-500'
  },
  'running': { 
    icon: <RefreshCw className="h-4 w-4 text-white animate-spin" />,
    bgColor: 'bg-blue-500'
  },
  'pending': { 
    icon: <Clock className="h-4 w-4 text-white" />,
    bgColor: 'bg-gray-400'
  }
};

// Status do deployment
const DEPLOYMENT_STATUS_MAP = {
  'success': { 
    icon: <CheckCircle className="h-5 w-5 text-green-500" />,
    text: 'Sucesso',
    bgColor: 'bg-green-100',
    textColor: 'text-green-800'
  },
  'warning': { 
    icon: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
    text: 'Alerta',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-800'
  },
  'failed': { 
    icon: <X className="h-5 w-5 text-red-500" />,
    text: 'Falha',
    bgColor: 'bg-red-100',
    textColor: 'text-red-800'
  },
  'running': { 
    icon: <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />,
    text: 'Em andamento',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-800'
  }
};

export default function EnvironmentDeploymentPage({ params }: EnvironmentParams) {
  const environmentId = parseInt(params.id);
  
  const { data: environmentData, loading: environmentLoading, error: environmentError } = useQuery(
    GET_ENVIRONMENT, 
    { 
      variables: { id: environmentId },
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
    handleError(environmentError, { component: 'EnvironmentDeploymentPage' });
  }

  const environment = environmentData?.environment;

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
            {environmentLoading ? 'Carregando...' : environment?.name} - Fluxo de Deployment
          </h1>
        </div>
        {environment && (
          <p className="text-muted-foreground mt-1">
            Histórico e status de deployments neste ambiente
          </p>
        )}
      </div>
    </div>
  );

  const renderDeploymentFlow = () => {
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
      <div className="space-y-6">
        {/* Pipeline visualization */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-5">
          <h2 className="text-lg font-semibold mb-4">Pipeline de Deployment</h2>
          
          <div className="flex items-center justify-between mb-8">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-2">
                <GitBranch className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-sm font-medium">Código</span>
            </div>
            
            <ArrowRight className="h-5 w-5 text-gray-400" />
            
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center mb-2">
                <Package className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
              </div>
              <span className="text-sm font-medium">Build</span>
            </div>
            
            <ArrowRight className="h-5 w-5 text-gray-400" />
            
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mb-2">
                <Check className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
              <span className="text-sm font-medium">Testes</span>
            </div>
            
            <ArrowRight className="h-5 w-5 text-gray-400" />
            
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-2">
                <Upload className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-sm font-medium">Deploy</span>
            </div>
            
            <ArrowRight className="h-5 w-5 text-gray-400" />
            
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-2">
                <Server className="h-8 w-8 text-primary" />
              </div>
              <span className="text-sm font-medium">{environment.name}</span>
            </div>
          </div>
        </div>
        
        {/* Histórico de deployments */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-5 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold">Histórico de Deployments</h2>
          </div>
          
          <div className="p-0">
            {MOCK_DEPLOYMENTS.map((deployment, index) => {
              const statusInfo = DEPLOYMENT_STATUS_MAP[deployment.status];
              
              return (
                <div key={deployment.id} className={`p-5 ${
                  index < MOCK_DEPLOYMENTS.length - 1 ? 'border-b border-gray-200 dark:border-gray-700' : ''
                }`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center">
                        <h3 className="text-base font-medium">{deployment.component}</h3>
                        <span className="ml-2 text-sm text-gray-500">{deployment.version}</span>
                        <div className={`ml-3 px-2.5 py-0.5 rounded-full text-xs font-medium flex items-center ${
                          statusInfo.bgColor
                        } ${statusInfo.textColor}`}>
                          {statusInfo.icon}
                          <span className="ml-1">{statusInfo.text}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center mt-1 text-sm text-gray-500">
                        <span className="mr-3">
                          {format(deployment.date, "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                        </span>
                        <span>por {deployment.author}</span>
                      </div>
                    </div>
                    
                    <Button variant="outline" size="sm">
                      Ver detalhes
                    </Button>
                  </div>
                  
                  <div className="mt-4 grid grid-cols-4 gap-4">
                    {deployment.steps.map((step, stepIndex) => {
                      const stepStatus = STEP_STATUS_MAP[step.status];
                      
                      return (
                        <div key={`${deployment.id}-${stepIndex}`} className="flex items-center">
                          <div className={`flex-shrink-0 w-6 h-6 rounded-full ${stepStatus.bgColor} flex items-center justify-center`}>
                            {stepStatus.icon}
                          </div>
                          <div className="ml-2">
                            <div className="text-sm font-medium">{step.name}</div>
                            <div className="text-xs text-gray-500">{step.time}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <AppLayout>
      <div className="animate-in">
        {renderHeader()}
        {renderDeploymentFlow()}
      </div>
    </AppLayout>
  );
} 