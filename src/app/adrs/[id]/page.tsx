"use client";

import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { useRouter } from 'next/navigation';
import { 
  GET_ADR, 
  UPDATE_ADR, 
  DELETE_ADR, 
  ADRType, 
  ADRStatus, 
  ParticipantRole 
} from '@/lib/graphql-adr';
import { AppLayout } from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { toast } from '@/components/ui/use-toast';
import { 
  CalendarDays, 
  ClipboardEdit, 
  MoreHorizontal, 
  Trash2, 
  ArrowLeft, 
  Tag, 
  Component, 
  Server 
} from 'lucide-react';
import ADRForm from '../adr-form';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ADRDetailPageProps {
  params: {
    id: string;
  };
}

export default function ADRDetailPage({ params }: ADRDetailPageProps) {
  const id = parseInt(params.id);
  const router = useRouter();
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Consulta GraphQL para buscar detalhes do ADR
  const { data, loading, error, refetch } = useQuery(GET_ADR, {
    variables: { id },
    fetchPolicy: 'network-only',
  });

  // Mutations
  const [updateADR] = useMutation(UPDATE_ADR);
  const [deleteADR] = useMutation(DELETE_ADR);

  // Obter cor de fundo para cada papel de participante
  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case ParticipantRole.OWNER:
        return 'bg-primary/80 text-primary-foreground';
      case ParticipantRole.REVIEWER:
        return 'bg-amber-100 text-amber-800';
      case ParticipantRole.CONSUMER:
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Obter nome legível do papel
  const getRoleName = (role: string) => {
    switch (role) {
      case ParticipantRole.OWNER:
        return 'Responsável';
      case ParticipantRole.REVIEWER:
        return 'Revisor';
      case ParticipantRole.CONSUMER:
        return 'Consumidor';
      default:
        return role;
    }
  };

  // Obter iniciais do nome para o avatar
  const getInitials = (name: string) => {
    if (!name) return '?';
    const parts = name.split(' ').filter(part => part.length > 0);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  // Obter classe de cor com base no status
  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-amber-100 text-amber-800";
      case "accepted":
        return "bg-green-100 text-green-800";
      case "superseded":
        return "bg-blue-100 text-blue-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Obter nome legível do status
  const getStatusName = (status: string) => {
    switch (status) {
      case "draft":
        return "Rascunho";
      case "accepted":
        return "Aceito";
      case "superseded":
        return "Substituído";
      case "rejected":
        return "Rejeitado";
      default:
        return status;
    }
  };

  // Função para lidar com a atualização do ADR
  const handleUpdateADR = async (formData: any) => {
    try {
      await updateADR({
        variables: {
          id,
          ...formData
        }
      });
      setShowEditForm(false);
      refetch();
      toast({
        title: "ADR atualizado",
        description: "O ADR foi atualizado com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar ADR",
        description: error.message || "Ocorreu um erro ao atualizar o ADR.",
        variant: "destructive"
      });
    }
  };

  // Função para lidar com a exclusão do ADR
  const handleDeleteADR = async () => {
    try {
      await deleteADR({
        variables: { id }
      });
      router.push('/adrs');
      toast({
        title: "ADR excluído",
        description: "O ADR foi excluído com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao excluir ADR",
        description: error.message || "Ocorreu um erro ao excluir o ADR.",
        variant: "destructive"
      });
    }
  };

  // Renderizar conteúdo com base no status da consulta
  if (loading) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center h-96">
          <p className="text-lg">Carregando detalhes do ADR...</p>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center h-96 flex-col gap-4">
          <p className="text-lg text-destructive">Erro ao carregar os detalhes do ADR</p>
          <p className="text-sm text-muted-foreground">{error.message}</p>
          <Button onClick={() => router.push('/adrs')}>Voltar para a lista</Button>
        </div>
      </AppLayout>
    );
  }

  const adr: ADRType = data?.adr;

  if (!adr) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center h-96 flex-col gap-4">
          <p className="text-lg">ADR não encontrado</p>
          <Button onClick={() => router.push('/adrs')}>Voltar para a lista</Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container py-6">
        {/* Cabeçalho com título e ações */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => router.push('/adrs')}
              className="flex items-center gap-1"
            >
              <ArrowLeft size={16} />
              Voltar
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{adr.title}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={getStatusColor(adr.status)}>
                  {getStatusName(adr.status)}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Criado em {format(new Date(adr.createdAt), 'dd MMM yyyy', { locale: ptBR })}
                </span>
              </div>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setShowEditForm(true)}>
                <ClipboardEdit className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => setShowDeleteConfirm(true)}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Conteúdo principal em abas */}
        <Tabs defaultValue="overview">
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="participants">
              Participantes ({adr.participants?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="components">
              Componentes ({adr.components?.length || 0})
            </TabsTrigger>
          </TabsList>

          {/* Aba de Visão Geral */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {/* Descrição */}
                <Card>
                  <CardHeader>
                    <CardTitle>Descrição</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose dark:prose-invert max-w-none">
                      <p className="whitespace-pre-wrap">{adr.description}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Tags */}
                {adr.tags && adr.tags.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center">
                        <Tag className="mr-2 h-4 w-4" />
                        Tags
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {adr.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Sidebar com informações resumidas */}
              <div className="space-y-6">
                {/* Participantes em destaque */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Participantes</CardTitle>
                    <CardDescription>
                      {adr.participants?.length || 0} envolvido{adr.participants?.length !== 1 ? 's' : ''}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {adr.participants?.slice(0, 5).map((participant) => (
                        <div key={participant.id} className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            {participant.user.avatarUrl ? (
                              <AvatarImage src={participant.user.avatarUrl} alt={participant.user.fullName} />
                            ) : (
                              <AvatarFallback className={getRoleBadgeClass(participant.role)}>
                                {getInitials(participant.user.fullName)}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium leading-none">{participant.user.fullName}</p>
                            <p className="text-xs text-muted-foreground">{getRoleName(participant.role)}</p>
                          </div>
                        </div>
                      ))}
                      {adr.participants?.length > 5 && (
                        <p className="text-xs text-muted-foreground pt-2">
                          +{adr.participants.length - 5} outro{adr.participants.length - 5 !== 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Componentes em destaque */}
                {adr.components?.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center">
                        <Component className="mr-2 h-4 w-4" />
                        Componentes
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {adr.components.slice(0, 3).map((component) => (
                          <div key={component.id} className="flex items-center gap-2">
                            <Badge variant="outline" className={`${
                              component.status === 'ACTIVE' 
                                ? 'border-green-500' 
                                : component.status === 'INACTIVE' 
                                ? 'border-yellow-500' 
                                : 'border-red-500'
                            }`}>
                              {component.status.toLowerCase()}
                            </Badge>
                            <span className="text-sm">{component.name}</span>
                          </div>
                        ))}
                        {adr.components.length > 3 && (
                          <p className="text-xs text-muted-foreground pt-2">
                            +{adr.components.length - 3} outro{adr.components.length - 3 !== 1 ? 's' : ''}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Datas */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center">
                      <CalendarDays className="mr-2 h-4 w-4" />
                      Datas
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Criado em</span>
                      <span className="text-sm">
                        {format(new Date(adr.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                      </span>
                    </div>
                    {adr.updatedAt && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Atualizado em</span>
                        <span className="text-sm">
                          {format(new Date(adr.updatedAt), 'dd/MM/yyyy', { locale: ptBR })}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Aba de Participantes */}
          <TabsContent value="participants">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {adr.participants?.map((participant) => (
                <Card key={participant.id}>
                  <CardHeader className="pb-3 space-y-0 flex flex-row items-center space-x-4">
                    <Avatar className="h-10 w-10">
                      {participant.user.avatarUrl ? (
                        <AvatarImage src={participant.user.avatarUrl} alt={participant.user.fullName} />
                      ) : (
                        <AvatarFallback className={getRoleBadgeClass(participant.role)}>
                          {getInitials(participant.user.fullName)}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div>
                      <CardTitle className="text-base">{participant.user.fullName}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {participant.user.email}
                      </p>
                    </div>
                  </CardHeader>
                  <CardFooter className="border-t pt-3">
                    <Badge className={getRoleBadgeClass(participant.role)}>
                      {getRoleName(participant.role)}
                    </Badge>
                    {participant.user.role && (
                      <Badge variant="outline" className="ml-2">
                        {participant.user.role}
                      </Badge>
                    )}
                  </CardFooter>
                </Card>
              ))}
              {adr.participants?.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <p className="text-muted-foreground">Nenhum participante registrado neste ADR.</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Aba de Componentes */}
          <TabsContent value="components">
            <div className="grid grid-cols-1 gap-6">
              {/* Componentes */}
              {adr.components?.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Component className="mr-2 h-5 w-5" />
                      Componentes relacionados
                    </CardTitle>
                    <CardDescription>
                      Componentes de software impactados por esta decisão
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {adr.components.map((component) => (
                        <div key={component.id} className="p-4 border rounded-md bg-muted/10">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className={`${
                              component.status === 'ACTIVE' 
                                ? 'border-green-500' 
                                : component.status === 'INACTIVE' 
                                ? 'border-yellow-500' 
                                : 'border-red-500'
                            }`}>
                              {component.status.toLowerCase()}
                            </Badge>
                          </div>
                          <h3 className="text-sm font-medium">{component.name}</h3>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Instâncias de componentes */}
              {adr.componentInstances?.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Server className="mr-2 h-5 w-5" />
                      Instâncias relacionadas
                    </CardTitle>
                    <CardDescription>
                      Instâncias específicas de componentes impactadas por esta decisão
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {adr.componentInstances.map((ci) => (
                        <div key={ci.id} className="p-4 border rounded-md bg-muted/10">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge>
                              {ci.instance.environment.name}
                            </Badge>
                          </div>
                          <h3 className="text-sm font-medium">{ci.component.name}</h3>
                          <p className="text-xs text-muted-foreground mt-1">
                            {ci.instance.hostname || `Instância ${ci.instance.id}`}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {adr.components?.length === 0 && adr.componentInstances?.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Nenhum componente ou instância associado a este ADR.</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Modal de edição */}
        <Dialog open={showEditForm} onOpenChange={setShowEditForm}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar ADR</DialogTitle>
            </DialogHeader>
            <ADRForm 
              initialData={adr}
              onSubmit={handleUpdateADR} 
              onCancel={() => setShowEditForm(false)} 
            />
          </DialogContent>
        </Dialog>

        {/* Modal de confirmação de exclusão */}
        <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar exclusão</DialogTitle>
            </DialogHeader>
            <p className="py-4">
              Tem certeza de que deseja excluir este ADR? Esta ação não pode ser desfeita.
            </p>
            <div className="flex justify-end gap-4">
              <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleDeleteADR}>
                Excluir
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
} 