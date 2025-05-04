# Exemplo: Feedback Visual para Operações de Longa Duração

Este exemplo demonstra como implementar feedback visual eficaz para operações de longa duração utilizando os componentes e hooks introduzidos na versão 2.0 do Beaver.

## Cenário

Uma página de criação/edição de instâncias de componentes que envolve diversas operações assíncronas:
- Validação de dados
- Upload de configurações
- Criação/atualização no banco de dados
- Consulta de status após a operação

## Código Completo

```tsx
// src/app/examples/loading-feedback/page.tsx

'use client';

import { useState } from 'react';
import { useLoadingOperation } from '@/lib/hooks/use-loading-operation';
import { Spinner } from '@/components/ui/spinner';
import { ProgressBar } from '@/components/ui/progress-bar';
import { CircularProgress } from '@/components/ui/circular-progress';
import { LoadingContainer } from '@/components/ui/loading-container';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { EnvironmentSelector } from '@/components/selectors/EnvironmentSelector';
import { TeamSelector } from '@/components/selectors/TeamSelector';
import { useToast } from '@/components/ui/use-toast';

// Simulação de API
const api = {
  createComponentInstance: async (data, options = {}) => {
    const { simulateError, simulateProgress } = options;
    
    // Simular validação (500ms)
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (simulateError === 'validation') {
      throw new Error('ERR-4001-01-01: Hostname inválido. Use apenas caracteres alfanuméricos e hífens.');
    }
    
    // Simular envio de especificações (1-3s)
    if (simulateProgress) {
      const totalSteps = 10;
      for (let i = 1; i <= totalSteps; i++) {
        await new Promise(resolve => setTimeout(resolve, 200));
        simulateProgress(i * 10);
      }
    } else {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    if (simulateError === 'server') {
      throw new Error('ERR-5002-02-01: Erro no servidor ao processar a requisição.');
    }
    
    // Simular resposta
    return {
      id: '123',
      hostname: data.hostname,
      environment: {
        id: data.environmentId,
        name: 'Produção'
      },
      specs: data.specs,
      createdAt: new Date().toISOString()
    };
  },
  
  checkComponentStatus: async (id) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { status: 'active', lastChecked: new Date().toISOString() };
  }
};

// Componente principal
export default function LoadingFeedbackExample() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">
        Exemplo de Feedback Visual para Operações
      </h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InstanceCreationForm />
        <LoadingComponentsShowcase />
      </div>
    </div>
  );
}

// Formulário de criação de instância com feedback visual
function InstanceCreationForm() {
  const { toast } = useToast();
  
  // Estados do formulário
  const [formData, setFormData] = useState({
    componentId: '1',
    environmentId: '',
    hostname: '',
    specs: { cpu: '2', memory: '4GB', storage: '100GB' }
  });
  
  const [simulateErrorType, setSimulateErrorType] = useState(null);
  
  // Usar hook de operação com loading
  const {
    loading,
    error,
    elapsedTime,
    progressPercentage,
    execute,
    reset,
    setProgress
  } = useLoadingOperation({
    id: 'create-instance',
    name: 'Criação de Instância',
    type: 'mutation',
    estimatedTime: 3000, // 3 segundos estimados
    showSuccessToast: true,
    successMessage: 'Instância criada com sucesso!',
    showErrorToast: true
  });
  
  // Estado do processo de criação
  const [createdInstance, setCreatedInstance] = useState(null);
  const [statusCheckLoading, setStatusCheckLoading] = useState(false);
  const [instanceStatus, setInstanceStatus] = useState(null);
  
  // Handler de submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Resetar estados
    reset();
    setCreatedInstance(null);
    setInstanceStatus(null);
    
    // Validação básica
    if (!formData.hostname) {
      toast({
        title: 'Erro de validação',
        description: 'O hostname é obrigatório',
        variant: 'destructive'
      });
      return;
    }
    
    if (!formData.environmentId) {
      toast({
        title: 'Erro de validação',
        description: 'Selecione um ambiente',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      // Executar criação com feedback de loading
      const result = await execute(() => 
        api.createComponentInstance(formData, {
          simulateError: simulateErrorType,
          simulateProgress: setProgress
        })
      );
      
      if (result) {
        setCreatedInstance(result);
        
        // Verificar status após criação
        setStatusCheckLoading(true);
        const status = await api.checkComponentStatus(result.id);
        setInstanceStatus(status);
        setStatusCheckLoading(false);
      }
    } catch (err) {
      console.error('Erro capturado:', err);
    }
  };
  
  // Atualizar campo de formulário
  const updateField = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Atualizar especificação
  const updateSpec = (key, value) => {
    setFormData(prev => ({
      ...prev,
      specs: {
        ...prev.specs,
        [key]: value
      }
    }));
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Criar Nova Instância</CardTitle>
      </CardHeader>
      
      <CardContent>
        <form id="instance-form" onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Ambiente</label>
            <EnvironmentSelector
              value={formData.environmentId}
              onChange={(value) => updateField('environmentId', value)}
              placeholder="Selecione um ambiente"
              disabled={loading}
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Hostname</label>
            <Input
              value={formData.hostname}
              onChange={(e) => updateField('hostname', e.target.value)}
              placeholder="Ex: app-server-01"
              disabled={loading}
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Especificações</label>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-gray-500">CPU</label>
                <Input
                  value={formData.specs.cpu}
                  onChange={(e) => updateSpec('cpu', e.target.value)}
                  placeholder="CPU"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Memória</label>
                <Input
                  value={formData.specs.memory}
                  onChange={(e) => updateSpec('memory', e.target.value)}
                  placeholder="Memória"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Armazenamento</label>
                <Input
                  value={formData.specs.storage}
                  onChange={(e) => updateSpec('storage', e.target.value)}
                  placeholder="Armazenamento"
                  disabled={loading}
                />
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Simular Erro (para demonstração)</label>
            <div className="flex space-x-3">
              <Button
                type="button"
                variant={simulateErrorType === null ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSimulateErrorType(null)}
                disabled={loading}
              >
                Nenhum Erro
              </Button>
              <Button
                type="button"
                variant={simulateErrorType === 'validation' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSimulateErrorType('validation')}
                disabled={loading}
              >
                Erro de Validação
              </Button>
              <Button
                type="button"
                variant={simulateErrorType === 'server' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSimulateErrorType('server')}
                disabled={loading}
              >
                Erro do Servidor
              </Button>
            </div>
          </div>
        </form>
        
        {/* Feedback de progresso durante o carregamento */}
        {loading && (
          <div className="mt-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Progresso</span>
              <span className="font-medium">{progressPercentage}%</span>
            </div>
            
            <ProgressBar
              value={progressPercentage}
              max={100}
              animation="pulse"
              className="h-2"
            />
            
            <div className="flex justify-between text-xs text-gray-500">
              <span>Tempo decorrido: {Math.round(elapsedTime / 1000)}s</span>
              <span>Status: {getOperationStatusText(progressPercentage)}</span>
            </div>
          </div>
        )}
        
        {/* Mostrar resultado ou erro */}
        {!loading && createdInstance && (
          <div className="mt-4 p-3 bg-green-50 rounded border border-green-200">
            <h3 className="font-medium text-green-800 mb-1">
              Instância criada com sucesso
            </h3>
            <p className="text-sm text-green-700">
              ID: {createdInstance.id}<br />
              Hostname: {createdInstance.hostname}<br />
              Ambiente: {createdInstance.environment.name}
            </p>
            
            {/* Status check */}
            <div className="mt-2 flex items-center">
              <span className="text-sm text-green-700 mr-2">Status:</span>
              {statusCheckLoading ? (
                <span className="flex items-center">
                  <Spinner size="sm" className="mr-1" />
                  <span className="text-sm">Verificando...</span>
                </span>
              ) : instanceStatus ? (
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                  {instanceStatus.status}
                </span>
              ) : null}
            </div>
          </div>
        )}
        
        {!loading && error && (
          <div className="mt-4 p-3 bg-red-50 rounded border border-red-200">
            <h3 className="font-medium text-red-800 mb-1">
              Erro ao criar instância
            </h3>
            <p className="text-sm text-red-700">{error.message}</p>
          </div>
        )}
      </CardContent>
      
      <CardFooter>
        <Button
          type="submit"
          form="instance-form"
          disabled={loading}
          className="w-full"
        >
          {loading ? (
            <span className="flex items-center">
              <Spinner size="sm" className="mr-2" />
              Criando Instância...
            </span>
          ) : 'Criar Instância'}
        </Button>
      </CardFooter>
    </Card>
  );
}

// Componente para mostrar diferentes tipos de indicadores de loading
function LoadingComponentsShowcase() {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const startLoading = () => {
    setIsLoading(true);
    setProgress(0);
    
    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + 5;
        if (newProgress >= 100) {
          clearInterval(interval);
          setTimeout(() => setIsLoading(false), 500);
          return 100;
        }
        return newProgress;
      });
    }, 200);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Componentes de Feedback Visual</CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-lg font-medium mb-3">Spinner</h3>
          <div className="flex items-center space-x-6">
            <div className="flex flex-col items-center">
              <Spinner size="sm" />
              <span className="text-xs mt-1">sm</span>
            </div>
            <div className="flex flex-col items-center">
              <Spinner size="md" />
              <span className="text-xs mt-1">md</span>
            </div>
            <div className="flex flex-col items-center">
              <Spinner size="lg" />
              <span className="text-xs mt-1">lg</span>
            </div>
            <div className="flex flex-col items-center">
              <Spinner size="xl" variant="secondary" />
              <span className="text-xs mt-1">xl (secondary)</span>
            </div>
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-medium mb-3">Barra de Progresso</h3>
          <div className="space-y-4">
            <ProgressBar value={75} max={100} showLabel />
            <ProgressBar value={50} max={100} variant="success" animation="pulse" />
            <ProgressBar value={25} max={100} variant="warning" animation="stripe" />
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-medium mb-3">Progresso Circular</h3>
          <div className="flex justify-around">
            <CircularProgress value={25} size={60} strokeWidth={4} showLabel />
            <CircularProgress value={50} size={80} strokeWidth={6} showLabel />
            <CircularProgress value={75} size={100} strokeWidth={8} showLabel />
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-medium mb-3">Container com Loading</h3>
          <LoadingContainer 
            loading={isLoading} 
            message="Carregando conteúdo..." 
            loadingType="progress"
            progress={progress}
          >
            <div className="border rounded p-4 h-32 flex items-center justify-center">
              <div className="text-center">
                <p className="mb-3">Conteúdo carregado com sucesso!</p>
                <Button onClick={startLoading} size="sm">
                  Recarregar
                </Button>
              </div>
            </div>
          </LoadingContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// Função auxiliar para texto de status baseado no progresso
function getOperationStatusText(progress) {
  if (progress < 30) return 'Validando dados...';
  if (progress < 70) return 'Enviando especificações...';
  return 'Finalizando criação...';
}
```

## Hook `useLoadingOperation`

O hook `useLoadingOperation` facilita o gerenciamento de operações assíncronas com feedback visual:

```tsx
// src/lib/hooks/use-loading-operation.ts (versão simplificada)

import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/components/ui/use-toast';

interface OperationOptions {
  id?: string;
  name?: string;
  type?: 'query' | 'mutation' | 'upload' | 'process';
  estimatedTime?: number;
  showSuccessToast?: boolean;
  successMessage?: string;
  showErrorToast?: boolean;
  errorMessage?: string;
  onStart?: () => void;
  onSuccess?: (result: any) => void;
  onError?: (error: Error) => void;
  onComplete?: () => void;
}

export function useLoadingOperation<T = any>(defaultOptions?: OperationOptions) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [result, setResult] = useState<T | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [progress, setProgress] = useState(0);
  
  const { toast } = useToast();
  const timerRef = useRef<any>(null);
  
  // Limpar temporizador ao desmontar
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);
  
  // Atualizar tempo decorrido durante o carregamento
  useEffect(() => {
    if (loading && startTime) {
      timerRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        setElapsedTime(elapsed);
      }, 100);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [loading, startTime]);
  
  // Calcular porcentagem de progresso com base no tempo estimado
  const calculateProgressPercentage = (
    elapsed: number,
    estimated: number,
    manualProgress?: number
  ) => {
    // Usar progresso manual se disponível
    if (typeof manualProgress === 'number' && manualProgress >= 0) {
      return manualProgress;
    }
    
    // Calcular com base no tempo decorrido vs. estimado
    const percentage = Math.min(Math.round((elapsed / estimated) * 100), 99);
    return percentage;
  };
  
  // Executar operação com feedback
  const execute = async (
    operation: () => Promise<T>,
    options?: OperationOptions
  ): Promise<T | null> => {
    const mergedOptions = { ...defaultOptions, ...options };
    const {
      estimatedTime = 2000,
      showSuccessToast = false,
      successMessage = 'Operação concluída com sucesso',
      showErrorToast = true,
      errorMessage,
      onStart,
      onSuccess,
      onError,
      onComplete
    } = mergedOptions;
    
    try {
      // Iniciar operação
      setLoading(true);
      setError(null);
      setProgress(0);
      const now = Date.now();
      setStartTime(now);
      onStart?.();
      
      // Executar operação
      const operationResult = await operation();
      
      // Sucesso
      setResult(operationResult);
      setProgress(100);
      
      // Mostrar toast de sucesso se necessário
      if (showSuccessToast) {
        toast({
          title: 'Sucesso',
          description: successMessage
        });
      }
      
      onSuccess?.(operationResult);
      return operationResult;
    } catch (err) {
      // Falha
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      
      // Mostrar toast de erro se necessário
      if (showErrorToast) {
        toast({
          title: 'Erro',
          description: errorMessage || error.message,
          variant: 'destructive'
        });
      }
      
      onError?.(error);
      return null;
    } finally {
      // Finalizar operação
      setLoading(false);
      setStartTime(null);
      onComplete?.();
    }
  };
  
  // Resetar estado
  const reset = () => {
    setLoading(false);
    setError(null);
    setResult(null);
    setStartTime(null);
    setElapsedTime(0);
    setProgress(0);
  };
  
  // Calcular porcentagem de progresso
  const progressPercentage = calculateProgressPercentage(
    elapsedTime,
    defaultOptions?.estimatedTime || 2000,
    progress
  );
  
  return {
    loading,
    error,
    result,
    elapsedTime,
    progress,
    progressPercentage,
    execute,
    reset,
    setProgress
  };
}
```

## Componentes de Feedback Visual

### Spinner

Para indicar carregamento sem progresso específico:

```tsx
<Spinner 
  size="md" 
  variant="primary" 
  className="my-2" 
/>
```

### ProgressBar

Para mostrar progresso mensurável:

```tsx
<ProgressBar 
  value={75} 
  max={100} 
  showLabel 
  animation="pulse" 
/>
```

### LoadingContainer

Para encapsular conteúdo com overlay de carregamento:

```tsx
<LoadingContainer 
  loading={isLoading} 
  message="Carregando componentes..." 
  loadingType="progress"
  progress={progress}
>
  <ComponentList data={components} />
</LoadingContainer>
```

## Principais Padrões de Uso

### 1. Feedback Baseado no Progresso Real

Quando a operação fornece atualizações de progresso:

```tsx
const { loading, progressPercentage, execute, setProgress } = useLoadingOperation();

// Na submissão do formulário
const handleSubmit = async () => {
  await execute(() => 
    api.uploadFile(file, {
      onProgress: (percentage) => setProgress(percentage)
    })
  );
};
```

### 2. Feedback Baseado em Tempo Estimado

Quando não há informações de progresso disponíveis:

```tsx
const { loading, progressPercentage, execute } = useLoadingOperation({
  estimatedTime: 5000  // 5 segundos estimados
});

// Operação sem feedback de progresso real
const handleOperation = async () => {
  await execute(() => api.longRunningOperation());
};
```

### 3. Operações Múltiplas em Sequência

Para operações compostas por várias etapas:

```tsx
const handleMultiStepOperation = async () => {
  // Primeira operação (30% do fluxo)
  const step1Result = await execute(() => api.step1(), { 
    estimatedTime: 1000 
  });
  
  if (!step1Result) return;
  
  // Atualizar progresso manualmente para refletir o fluxo geral
  setProgress(30);
  
  // Segunda operação (70% restante do fluxo)
  await execute(() => api.step2(step1Result), { 
    estimatedTime: 2000 
  });
  
  // Progresso final
  setProgress(100);
};
```

## Benefícios

1. **Feedback Claro**: Os usuários recebem informações visuais sobre o progresso das operações
2. **Tratamento de Erros Consistente**: Exibição uniforme de erros com opção de toasts automáticos
3. **Separação de Responsabilidades**: A lógica de feedback é separada da lógica de negócios
4. **Flexibilidade**: Suporta tanto progresso determinístico (baseado em eventos) quanto estimado (baseado em tempo)
5. **Experiência Melhorada**: Reduz a percepção de espera e evita cliques repetidos

## Melhores Práticas

1. **Forneça Feedback Específico**: Use mensagens descritivas sobre o que está acontecendo
2. **Evite Alternar Estados de Loading**: Mantenha o estado de loading até a conclusão completa
3. **Estime Tempos Realistas**: Baseie estimativas no desempenho real em diferentes condições de rede
4. **Use Progresso Determinístico Quando Possível**: Prefira feedback baseado no progresso real
5. **Desative Controles Durante o Carregamento**: Evite cliques múltiplos e estados inconsistentes 