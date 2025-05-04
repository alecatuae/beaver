"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner, LoadingContainer } from '@/components/ui/spinner';
import { ProgressBar, CircularProgress } from '@/components/ui/progress-bar';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLoadingOperation } from '@/lib/hooks/use-loading-operation';
import { ArrowDownIcon, RefreshCwIcon, StopCircleIcon, PlayIcon, DatabaseIcon, FileIcon, ListIcon } from 'lucide-react';

export default function LoadingFeedbackExamplePage() {
  // Exemplo 1: Operação com barra de progresso
  const fileOperation = useLoadingOperation({
    name: "Importação de arquivo",
    type: "import",
    estimatedTime: 6000, // 6 segundos estimados
    showSuccessToast: true,
    successMessage: "Arquivo importado com sucesso!",
  });

  // Exemplo 2: Operação sem tempo determinado
  const dataOperation = useLoadingOperation({
    name: "Carregamento de dados",
    type: "query",
    showErrorToast: true,
  });

  // Exemplo 3: Contador para demonstrar loading container
  const [count, setCount] = useState(0);
  const counterOperation = useLoadingOperation({
    name: "Atualização de contador",
    type: "calculation",
  });

  // Simular operação de arquivo
  const handleFileOperation = useCallback(async () => {
    await fileOperation.execute(async () => {
      // Simular operação demorada
      await new Promise(resolve => setTimeout(resolve, 5000));
      return { success: true, fileCount: 42 };
    });
  }, [fileOperation]);

  // Simular busca de dados
  const handleDataOperation = useCallback(async () => {
    try {
      await dataOperation.execute(async () => {
        // Simular operação demorada que pode falhar
        await new Promise((resolve, reject) => {
          const shouldFail = Math.random() > 0.7;
          setTimeout(() => {
            if (shouldFail) {
              reject(new Error("Falha na conexão com o servidor"));
            } else {
              resolve({ records: 128, timestamp: new Date() });
            }
          }, 3000);
        });
      });
    } catch (error) {
      console.error("Operação falhou:", error);
    }
  }, [dataOperation]);

  // Simular atualização de contador
  const handleCounter = useCallback(async () => {
    await counterOperation.execute(async () => {
      // Atualizar contador a cada 500ms por 3 segundos
      for (let i = 0; i < 6; i++) {
        await new Promise(resolve => setTimeout(resolve, 500));
        setCount(prev => prev + 1);
      }
      return count + 6;
    });
  }, [counterOperation, count]);

  // Simulação de múltiplas operações em sequência
  const allOperations = useLoadingOperation({
    name: "Todas operações",
    type: "other",
    showSuccessToast: true,
    successMessage: "Todas as operações foram concluídas!",
  });

  const handleAllOperations = useCallback(async () => {
    await allOperations.execute(async () => {
      // Executar operações em sequência
      await handleFileOperation();
      await handleDataOperation();
      await handleCounter();
      return { completed: true };
    });
  }, [allOperations, handleFileOperation, handleDataOperation, handleCounter]);

  // Exibir diferentes tipos de spinners
  const spinnerTypes = [
    { size: 'xs', variant: 'default', text: 'Carregando...' },
    { size: 'sm', variant: 'primary', text: 'Processando' },
    { size: 'md', variant: 'success', text: 'Sucesso' },
    { size: 'lg', variant: 'destructive', text: 'Erro' },
    { size: 'xl', variant: 'primary', text: 'Aguarde' },
  ];

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto pb-20">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Feedback Visual para Operações</h1>
          <p className="text-muted-foreground">
            Demonstração de componentes e estratégias para fornecer feedback visual 
            durante operações de longa duração
          </p>
        </div>

        <Tabs defaultValue="spinners">
          <TabsList className="mb-4">
            <TabsTrigger value="spinners">Spinners</TabsTrigger>
            <TabsTrigger value="progress">Barras de Progresso</TabsTrigger>
            <TabsTrigger value="operations">Operações Reais</TabsTrigger>
            <TabsTrigger value="containers">Containers de Loading</TabsTrigger>
          </TabsList>

          {/* Exemplo de Spinners */}
          <TabsContent value="spinners">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Indicadores de Carregamento</CardTitle>
                  <CardDescription>
                    Diferentes tamanhos e variantes de spinners
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {spinnerTypes.map((spinner, index) => (
                    <div key={index} className="flex items-center space-x-4">
                      <Spinner 
                        size={spinner.size as any} 
                        variant={spinner.variant as any} 
                        text={spinner.text}
                      />
                      <span className="text-sm text-muted-foreground">
                        {`size="${spinner.size}" variant="${spinner.variant}"`}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Posicionamento de Texto</CardTitle>
                  <CardDescription>
                    Diferentes posições para o texto do spinner
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center space-x-4">
                    <Spinner text="À direita" textPosition="right" size="md" variant="primary" />
                    <span className="text-sm text-muted-foreground">textPosition="right" (padrão)</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Spinner text="À esquerda" textPosition="left" size="md" variant="primary" />
                    <span className="text-sm text-muted-foreground">textPosition="left"</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Spinner text="Acima" textPosition="top" size="md" variant="primary" />
                    <span className="text-sm text-muted-foreground">textPosition="top"</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Spinner text="Abaixo" textPosition="bottom" size="md" variant="primary" />
                    <span className="text-sm text-muted-foreground">textPosition="bottom"</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Exemplo de Barras de Progresso */}
          <TabsContent value="progress">
            <div className="grid grid-cols-1 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Barras de Progresso</CardTitle>
                  <CardDescription>
                    Diferentes estilos e configurações
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Progresso Padrão</div>
                    <ProgressBar value={30} showLabel />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Com Tempo Decorrido</div>
                    <ProgressBar 
                      value={50} 
                      showLabel 
                      labelPosition="right" 
                      showTime 
                      elapsedTime={12500}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Variantes de Cor</div>
                    <div className="space-y-1">
                      <ProgressBar value={60} variant="primary" showLabel labelPosition="right" />
                      <ProgressBar value={70} variant="success" showLabel labelPosition="right" />
                      <ProgressBar value={40} variant="info" showLabel labelPosition="right" />
                      <ProgressBar value={80} variant="warning" showLabel labelPosition="right" />
                      <ProgressBar value={30} variant="destructive" showLabel labelPosition="right" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Tamanhos</div>
                    <div className="space-y-3">
                      <ProgressBar value={40} size="sm" showLabel labelPosition="right" />
                      <ProgressBar value={60} size="md" showLabel labelPosition="right" />
                      <ProgressBar value={80} size="lg" showLabel labelPosition="right" />
                      <ProgressBar value={90} size="xl" showLabel labelPosition="right" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Indeterminado</div>
                    <ProgressBar indeterminate variant="primary" />
                  </div>
                </CardContent>
              </Card>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Progresso Circular</CardTitle>
                    <CardDescription>
                      Indicador de progresso em formato circular
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-8 items-center justify-center py-8">
                    <CircularProgress value={25} size={60} showLabel />
                    <CircularProgress value={50} size={80} variant="success" showLabel />
                    <CircularProgress value={75} size={100} variant="warning" showLabel />
                    <CircularProgress value={90} size={120} variant="info" showLabel />
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Animações de Progresso</CardTitle>
                    <CardDescription>
                      Diferentes tipos de animação
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Transição Padrão</div>
                      <ProgressBar value={40} animation="default" showLabel />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Transição Suave</div>
                      <ProgressBar value={60} animation="smooth" showLabel />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Pulsar</div>
                      <ProgressBar value={80} animation="pulse" showLabel />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Exemplo de Operações Reais */}
          <TabsContent value="operations">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Operação com Tempo Estimado</CardTitle>
                  <CardDescription>
                    Importação de arquivo simulada (5 segundos)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {fileOperation.loading ? (
                    <div className="space-y-4">
                      <ProgressBar 
                        value={fileOperation.progressPercentage} 
                        variant="primary" 
                        showLabel 
                        showTime 
                        elapsedTime={fileOperation.elapsedTime}
                      />
                      <div className="flex items-center justify-center py-4">
                        <Spinner text="Importando arquivo..." variant="primary" />
                      </div>
                    </div>
                  ) : (
                    <div className="h-20 flex items-center justify-center">
                      {fileOperation.result ? (
                        <div className="text-center text-success">
                          <FileIcon className="h-10 w-10 mx-auto mb-2" />
                          <p>Arquivo importado com sucesso!</p>
                        </div>
                      ) : (
                        <div className="text-center text-muted-foreground">
                          <FileIcon className="h-10 w-10 mx-auto mb-2" />
                          <p>Clique para iniciar a importação</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button 
                    onClick={handleFileOperation} 
                    disabled={fileOperation.loading}
                  >
                    {fileOperation.loading ? (
                      <>Processando...</>
                    ) : (
                      <>Importar Arquivo</>
                    )}
                  </Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Operação Indeterminada</CardTitle>
                  <CardDescription>
                    Busca de dados com duração variável e possibilidade de erro
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {dataOperation.loading ? (
                    <div className="space-y-4">
                      <ProgressBar 
                        indeterminate 
                        variant="primary" 
                        showTime 
                        elapsedTime={dataOperation.elapsedTime}
                      />
                      <div className="flex items-center justify-center py-4">
                        <Spinner text="Carregando dados..." variant="primary" />
                      </div>
                    </div>
                  ) : (
                    <div className="h-20 flex items-center justify-center">
                      {dataOperation.error ? (
                        <div className="text-center text-destructive">
                          <DatabaseIcon className="h-10 w-10 mx-auto mb-2" />
                          <p>Erro: {dataOperation.error.message}</p>
                        </div>
                      ) : dataOperation.result ? (
                        <div className="text-center text-success">
                          <DatabaseIcon className="h-10 w-10 mx-auto mb-2" />
                          <p>Dados carregados: {dataOperation.result.records} registros</p>
                        </div>
                      ) : (
                        <div className="text-center text-muted-foreground">
                          <DatabaseIcon className="h-10 w-10 mx-auto mb-2" />
                          <p>Clique para carregar dados</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button 
                    onClick={handleDataOperation}
                    disabled={dataOperation.loading}
                    variant={dataOperation.error ? "destructive" : "default"}
                  >
                    {dataOperation.loading ? (
                      <>Buscando dados...</>
                    ) : dataOperation.error ? (
                      <>Tentar novamente</>
                    ) : (
                      <>Carregar Dados</>
                    )}
                  </Button>
                </CardFooter>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Operações Combinadas</CardTitle>
                  <CardDescription>
                    Execução de múltiplas operações em sequência
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {allOperations.loading ? (
                      <>
                        <ProgressBar 
                          indeterminate
                          variant="primary"
                          showTime
                          elapsedTime={allOperations.elapsedTime}
                        />
                        <div className="flex justify-center">
                          <Spinner 
                            text="Executando todas as operações..." 
                            size="lg" 
                            variant="primary" 
                          />
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-4">
                        <Button
                          size="lg"
                          onClick={handleAllOperations}
                          className="mx-auto"
                        >
                          Executar Todas as Operações
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Containers de Loading */}
          <TabsContent value="containers">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Loading Container</CardTitle>
                  <CardDescription>
                    Componente com overlay de carregamento
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <LoadingContainer 
                    loading={counterOperation.loading}
                    spinnerProps={{ text: "Processando...", variant: "primary" }}
                    className="min-h-[200px] border rounded-md p-4"
                  >
                    <div className="h-full flex flex-col items-center justify-center">
                      <h3 className="text-3xl font-bold mb-4">{count}</h3>
                      <p className="text-muted-foreground mb-6">
                        Valor atual do contador
                      </p>
                      <Button 
                        onClick={handleCounter}
                        disabled={counterOperation.loading}
                      >
                        Incrementar Contador
                      </Button>
                    </div>
                  </LoadingContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Spinners Contextuais</CardTitle>
                  <CardDescription>
                    Spinners com overlay em diferentes contextos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative p-4 border rounded-md min-h-[100px] flex items-center justify-center">
                      <ListIcon className="h-10 w-10 text-muted-foreground" />
                      {allOperations.loading && (
                        <div className="absolute inset-0 bg-background/70 flex items-center justify-center rounded-md">
                          <Spinner size="sm" variant="primary" />
                        </div>
                      )}
                    </div>
                    
                    <div className="relative p-4 border rounded-md min-h-[100px] flex items-center justify-center">
                      <DatabaseIcon className="h-10 w-10 text-muted-foreground" />
                      {dataOperation.loading && (
                        <div className="absolute inset-0 bg-background/70 flex items-center justify-center rounded-md">
                          <Spinner size="sm" variant="primary" />
                        </div>
                      )}
                    </div>
                    
                    <div className="relative p-4 border rounded-md min-h-[100px] flex items-center justify-center">
                      <FileIcon className="h-10 w-10 text-muted-foreground" />
                      {fileOperation.loading && (
                        <div className="absolute inset-0 bg-background/70 flex items-center justify-center rounded-md">
                          <Spinner size="sm" variant="primary" />
                        </div>
                      )}
                    </div>
                    
                    <div className="relative p-4 border rounded-md min-h-[100px] flex items-center justify-center">
                      <div className="text-3xl font-bold">{count}</div>
                      {counterOperation.loading && (
                        <div className="absolute inset-0 bg-background/70 flex items-center justify-center rounded-md">
                          <Spinner size="sm" variant="primary" />
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <div className="w-full flex justify-between">
                    <Button variant="outline" onClick={handleAllOperations} disabled={allOperations.loading}>
                      Iniciar Todos
                    </Button>
                    <Button variant="outline" onClick={() => {
                      fileOperation.reset();
                      dataOperation.reset();
                      counterOperation.reset();
                      allOperations.reset();
                    }}>
                      Redefinir
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
} 