import React from 'react';
import { useQuery } from '@apollo/client';
import { GET_CATEGORY_DETAILS } from '@/lib/graphql-trm';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import { ServerIcon, LayersIcon, AppWindowIcon, Network, Package2 } from 'lucide-react';

interface NodeDetailsProps {
  nodeId?: string;
  nodeType?: 'layer' | 'category';
  layerName?: string;
}

const getTRMLayerIcon = (layerName: string) => {
  switch (layerName?.toUpperCase()) {
    case 'INFRASTRUCTURE':
      return <ServerIcon className="h-5 w-5" />;
    case 'PLATFORM':
      return <LayersIcon className="h-5 w-5" />;
    case 'APPLICATION':
      return <AppWindowIcon className="h-5 w-5" />;
    case 'SHARED SERVICES':
      return <Network className="h-5 w-5" />;
    default:
      return <Package2 className="h-5 w-5" />;
  }
};

export const NodeDetails: React.FC<NodeDetailsProps> = ({ nodeId, nodeType, layerName }) => {
  // Se for um nó do tipo layer, mostrar detalhes da layer
  if (nodeType === 'layer') {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          {getTRMLayerIcon(layerName || '')}
          <div>
            <CardTitle>{layerName}</CardTitle>
            <CardDescription>
              Camada TRM
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {layerName === 'Infrastructure' && (
            <p className="text-sm text-muted-foreground">
              Infraestrutura inclui componentes físicos e virtuais que fornecem os recursos 
              básicos sobre os quais a plataforma e as aplicações são executadas.
            </p>
          )}
          {layerName === 'Platform' && (
            <p className="text-sm text-muted-foreground">
              Plataforma inclui middleware, bancos de dados e outros serviços de software 
              que fornecem capacidades para execução de aplicações.
            </p>
          )}
          {layerName === 'Application' && (
            <p className="text-sm text-muted-foreground">
              Aplicações incluem software específico do negócio, microserviços e interfaces 
              que atendem às necessidades dos usuários finais.
            </p>
          )}
          {layerName === 'Shared Services' && (
            <p className="text-sm text-muted-foreground">
              Serviços Compartilhados incluem componentes e serviços que são utilizados 
              por múltiplas aplicações ou plataformas.
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  // Se for um nó do tipo categoria, buscar detalhes da categoria
  const { data, loading, error } = useQuery(GET_CATEGORY_DETAILS, {
    variables: { id: nodeId },
    skip: !nodeId || nodeType !== 'category'
  });

  if (!nodeId || !nodeType) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Detalhes</CardTitle>
          <CardDescription>
            Selecione um item no TRM para ver detalhes
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-[200px]" />
          <Skeleton className="h-4 w-[150px] mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-[80%]" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Erro</CardTitle>
          <CardDescription>
            Ocorreu um erro ao carregar os detalhes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">
            {error.message}
          </p>
        </CardContent>
      </Card>
    );
  }

  const category = data?.category;

  if (!category) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Nenhum dado encontrado</CardTitle>
          <CardDescription>
            Não foi possível encontrar detalhes para o item selecionado
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Mostrar detalhes da categoria selecionada
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{category.name}</CardTitle>
            <CardDescription>
              Categoria na camada {category.layer?.name}
            </CardDescription>
          </div>
          {category.imageUrl && (
            <div className="h-12 w-12 relative">
              <Image
                src={category.imageUrl}
                alt={category.name}
                fill
                className="object-contain"
              />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="details">
          <TabsList className="mb-4">
            <TabsTrigger value="details">Detalhes</TabsTrigger>
            <TabsTrigger value="components">
              Componentes <Badge variant="outline" className="ml-2">{category.components?.length || 0}</Badge>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="details">
            <div className="space-y-4">
              {category.description && (
                <div>
                  <h4 className="text-sm font-medium mb-1">Descrição</h4>
                  <p className="text-sm text-muted-foreground">
                    {category.description}
                  </p>
                </div>
              )}
              
              <div>
                <h4 className="text-sm font-medium mb-1">Camada TRM</h4>
                <div className="flex items-center">
                  {getTRMLayerIcon(category.layer?.name || '')}
                  <span className="ml-2 text-sm">{category.layer?.name}</span>
                </div>
              </div>
              
              {category.parentId && (
                <div>
                  <h4 className="text-sm font-medium mb-1">Categoria Pai</h4>
                  <p className="text-sm text-muted-foreground">
                    {category.parent?.name || 'N/A'}
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="components">
            {category.components?.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">
                Nenhum componente associado a esta categoria
              </p>
            ) : (
              <div className="space-y-2">
                {category.components?.map((component: any) => (
                  <div 
                    key={component.id}
                    className="flex items-center justify-between p-3 border rounded-md"
                  >
                    <div className="flex items-center gap-2">
                      <Package2 className="h-4 w-4 text-muted-foreground" />
                      <span>{component.name}</span>
                    </div>
                    <Badge variant={
                      component.status === 'ACTIVE' ? 'default' :
                      component.status === 'INACTIVE' ? 'secondary' :
                      'destructive'
                    }>
                      {component.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default NodeDetails; 