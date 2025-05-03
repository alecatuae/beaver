"use client";

import { useState } from 'react';
import { PlusCircle, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMutation, useQuery } from '@apollo/client';
import { GET_ADRS, CREATE_ADR, ADRParticipantType, ParticipantRole } from '@/lib/graphql-adr';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import ADRForm from './adr-form';

export default function ADRsPage() {
  const [open, setOpen] = useState(false);
  const { data, loading, error, refetch } = useQuery(GET_ADRS);
  const [createADR, { loading: creating }] = useMutation(CREATE_ADR);

  const handleCreateADR = async (formData: any) => {
    try {
      await createADR({
        variables: formData
      });
      setOpen(false);
      refetch();
    } catch (error) {
      console.error("Erro ao criar ADR:", error);
      // Implementar tratamento de erro
    }
  };

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

  // Obter cor de fundo por papel do participante
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

  // Renderizar avatares de participantes
  const renderParticipants = (participants: ADRParticipantType[]) => {
    if (!participants || participants.length === 0) {
      return (
        <div className="flex items-center text-xs text-gray-500">
          <User size={14} className="mr-1" />
          <span>Sem participantes</span>
        </div>
      );
    }

    // Mostrar até 3 avatares e +X para os demais
    const visibleParticipants = participants.slice(0, 3);
    const remainingCount = participants.length - visibleParticipants.length;

    return (
      <div className="flex items-center">
        <div className="flex -space-x-2 mr-2">
          {visibleParticipants.map((participant) => (
            <TooltipProvider key={participant.id}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Avatar className="h-6 w-6 border-2 border-white">
                    {participant.user.avatarUrl ? (
                      <AvatarImage src={participant.user.avatarUrl} alt={participant.user.fullName} />
                    ) : (
                      <AvatarFallback className={getRoleBadgeClass(participant.role)}>
                        {getInitials(participant.user.fullName)}
                      </AvatarFallback>
                    )}
                  </Avatar>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <div className="text-xs">
                    <p className="font-medium">{participant.user.fullName}</p>
                    <p className="text-muted-foreground">{getRoleName(participant.role)}</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
          {remainingCount > 0 && (
            <Avatar className="h-6 w-6 border-2 border-white">
              <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                +{remainingCount}
              </AvatarFallback>
            </Avatar>
          )}
        </div>
        <span className="text-xs text-gray-500">
          {participants.length} participante{participants.length !== 1 ? 's' : ''}
        </span>
      </div>
    );
  };

  return (
    <div className="container py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">ADRs (Architecture Decision Records)</h1>
        <Button onClick={() => setOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Novo ADR
        </Button>
      </div>

      <Tabs defaultValue="all">
        <TabsList className="mb-6">
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="draft">Rascunhos</TabsTrigger>
          <TabsTrigger value="accepted">Aceitos</TabsTrigger>
          <TabsTrigger value="superseded">Substituídos</TabsTrigger>
          <TabsTrigger value="rejected">Rejeitados</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {loading ? (
            <p>Carregando ADRs...</p>
          ) : error ? (
            <p className="text-red-500">Erro ao carregar ADRs: {error.message}</p>
          ) : data?.adrs.length === 0 ? (
            <p>Nenhum ADR encontrado. Crie um novo para começar.</p>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data?.adrs.map((adr: any) => (
                <Card key={adr.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{adr.title}</CardTitle>
                      <Badge className={getStatusColor(adr.status)}>
                        {adr.status === "draft" ? "Rascunho" :
                         adr.status === "accepted" ? "Aceito" :
                         adr.status === "superseded" ? "Substituído" : "Rejeitado"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <p className="text-sm text-gray-600 line-clamp-3">
                      {adr.description}
                    </p>
                  </CardContent>
                  <CardFooter className="pt-2 flex flex-col items-start space-y-2 border-t">
                    <div className="w-full">
                      {renderParticipants(adr.participants)}
                    </div>
                    <div className="flex justify-between w-full text-xs text-gray-500">
                      <div>
                        {adr.components?.length > 0 && (
                          <span className="text-xs bg-muted px-2 py-1 rounded-full">
                            {adr.components.length} componente{adr.components.length !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                      <div>
                        {new Date(adr.createdAt).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Repetir para outras abas com filtragem */}
      </Tabs>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo ADR</DialogTitle>
          </DialogHeader>
          <ADRForm 
            onSubmit={handleCreateADR} 
            onCancel={() => setOpen(false)} 
          />
        </DialogContent>
      </Dialog>
    </div>
  );
} 