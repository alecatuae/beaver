"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tag, X, Plus, UserPlus, UserMinus } from 'lucide-react';
import { 
  ADRStatus, 
  ADRType, 
  ADRInput, 
  ParticipantRole,
  ADRParticipantInput,
  GET_USERS,
  GET_COMPONENTS,
} from '@/lib/graphql-adr';
import { useQuery } from '@apollo/client';
import { EnvironmentSelector } from '@/components/selectors/EnvironmentSelector';
import { cn } from '@/lib/utils';

// Interface para o formulário de ADR
interface ADRFormProps {
  initialData?: Partial<ADRType>;
  onSubmit: (data: ADRInput) => void;
  onCancel: () => void;
}

export default function ADRForm({
  initialData = {
    title: '',
    description: '',
    status: ADRStatus.DRAFT,
    participants: [],
    components: [],
    componentInstances: [],
    tags: [],
  },
  onSubmit,
  onCancel,
}: ADRFormProps) {
  // Estados do formulário
  const [title, setTitle] = useState(initialData.title || '');
  const [description, setDescription] = useState(initialData.description?.slice(0, 5000) || '');
  const [status, setStatus] = useState<ADRStatus>(initialData.status || ADRStatus.DRAFT);
  const [participants, setParticipants] = useState<ADRParticipantInput[]>(
    initialData.participants?.map(p => ({
      userId: p.user.id,
      role: p.role as ParticipantRole,
    })) || []
  );
  const [componentsIds, setComponentsIds] = useState<number[]>(
    initialData.components?.map(c => parseInt(c.id)) || []
  );
  const [selectedInstanceIds, setSelectedInstanceIds] = useState<number[]>(
    initialData.componentInstances?.map(ci => parseInt(ci.instance.id)) || []
  );
  const [environmentId, setEnvironmentId] = useState<string>('');
  const [tags, setTags] = useState<string[]>(initialData.tags || []);
  const [newTag, setNewTag] = useState('');
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  // Estados para participantes
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<ParticipantRole>(ParticipantRole.REVIEWER);

  // Buscar dados necessários
  const { data: usersData, loading: loadingUsers } = useQuery(GET_USERS);
  const { data: componentsData, loading: loadingComponents } = useQuery(GET_COMPONENTS);

  const users = usersData?.users || [];
  const components = componentsData?.components || [];

  // Contador de caracteres restantes
  const remainingChars = 5000 - description.length;

  // Manipulador para o campo de descrição
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= 5000) {
      setDescription(value);
    }
  };

  // Manipulador de submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação
    const validationErrors: {[key: string]: string} = {};
    
    if (!title.trim()) {
      validationErrors.title = 'O título é obrigatório';
    }
    
    if (!description.trim()) {
      validationErrors.description = 'A descrição é obrigatória';
    }

    // Verificar se há pelo menos um participante com papel de owner
    const hasOwner = participants.some(p => p.role === ParticipantRole.OWNER);
    if (!hasOwner) {
      validationErrors.participants = 'É necessário pelo menos um participante com papel "owner"';
    }
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    // Limpar erros e enviar dados
    setErrors({});
    
    // Garantir que o status é enviado como o enum correto
    const validStatus = Object.values(ADRStatus).includes(status as ADRStatus) 
      ? status 
      : ADRStatus.DRAFT;
      
    onSubmit({
      title,
      description,
      status: validStatus,
      participants,
      componentsIds,
      instancesIds: selectedInstanceIds,
      tags
    });
  };

  // Adicionar participante
  const addParticipant = () => {
    if (selectedUserId && selectedRole) {
      // Verificar se o participante já existe
      const exists = participants.some(p => p.userId === parseInt(selectedUserId));
      if (!exists) {
        setParticipants([
          ...participants,
          { 
            userId: parseInt(selectedUserId), 
            role: selectedRole 
          }
        ]);
        setSelectedUserId('');
      }
    }
  };

  // Remover participante
  const removeParticipant = (userId: number) => {
    setParticipants(participants.filter(p => p.userId !== userId));
  };

  // Adicionar nova tag
  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  // Remover tag
  const removeTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  // Adicionar tag ao pressionar Enter
  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  // Obter nome do usuário pelo ID
  const getUserName = (userId: number) => {
    const user = users.find(u => parseInt(u.id) === userId);
    return user ? user.fullName : `Usuário ${userId}`;
  };

  // Obter cor de fundo por papel do participante
  const getRoleBadgeClass = (role: ParticipantRole) => {
    switch (role) {
      case ParticipantRole.OWNER:
        return 'bg-primary text-primary-foreground';
      case ParticipantRole.REVIEWER:
        return 'bg-amber-100 text-amber-800';
      case ParticipantRole.CONSUMER:
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="title" className="text-sm font-medium">
            Título da Decisão
          </Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={errors.title ? 'border-destructive' : ''}
          />
          {errors.title && (
            <p className="text-destructive text-sm mt-1">{errors.title}</p>
          )}
        </div>

        <div>
          <Label htmlFor="description" className="text-sm font-medium">
            Descrição e Conteúdo
          </Label>
          <Textarea
            id="description"
            value={description}
            onChange={handleDescriptionChange}
            rows={8}
            maxLength={5000}
            className={errors.description ? 'border-destructive' : ''}
          />
          <div className="flex justify-between items-center mt-1">
            <div>
              {errors.description && (
                <p className="text-destructive text-sm">{errors.description}</p>
              )}
            </div>
            <p className={`text-xs ${remainingChars <= 100 ? 'text-amber-500' : 'text-muted-foreground'}`}>
              {remainingChars} caracteres restantes
            </p>
          </div>
        </div>

        <div>
          <Label htmlFor="status" className="text-sm font-medium">
            Status
          </Label>
          <Select
            value={status}
            onValueChange={(value) => setStatus(value as ADRStatus)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ADRStatus.DRAFT}>Rascunho</SelectItem>
              <SelectItem value={ADRStatus.ACCEPTED}>Aceito</SelectItem>
              <SelectItem value={ADRStatus.SUPERSEDED}>Substituído</SelectItem>
              <SelectItem value={ADRStatus.REJECTED}>Rejeitado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-sm font-medium">
            Participantes
          </Label>
          {errors.participants && (
            <p className="text-destructive text-sm mt-1">{errors.participants}</p>
          )}
          <div className="grid md:grid-cols-3 gap-3 mt-2">
            <div>
              <Select
                value={selectedUserId}
                onValueChange={setSelectedUserId}
                disabled={loadingUsers}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Usuário" />
                </SelectTrigger>
                <SelectContent>
                  {users
                    .filter(u => !participants.some(p => p.userId === parseInt(u.id)))
                    .map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.fullName}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select
                value={selectedRole}
                onValueChange={(value) => setSelectedRole(value as ParticipantRole)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Papel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ParticipantRole.OWNER}>Owner</SelectItem>
                  <SelectItem value={ParticipantRole.REVIEWER}>Revisor</SelectItem>
                  <SelectItem value={ParticipantRole.CONSUMER}>Consumidor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Button 
                type="button" 
                onClick={addParticipant}
                disabled={!selectedUserId || loadingUsers}
                className="w-full"
                variant="outline"
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Adicionar
              </Button>
            </div>
          </div>

          <div className="space-y-2 mt-3">
            {participants.length === 0 && (
              <p className="text-sm text-muted-foreground py-2">Nenhum participante adicionado</p>
            )}
            
            {participants.map((participant) => (
              <div 
                key={participant.userId}
                className="flex items-center justify-between p-2 rounded-md border"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{getUserName(participant.userId)}</span>
                  <span className={cn("text-xs px-2 py-1 rounded-full", getRoleBadgeClass(participant.role))}>
                    {participant.role === ParticipantRole.OWNER ? 'Owner' : 
                      participant.role === ParticipantRole.REVIEWER ? 'Revisor' : 'Consumidor'}
                  </span>
                </div>
                <Button
                  type="button"
                  onClick={() => removeParticipant(participant.userId)}
                  variant="ghost"
                  size="sm"
                >
                  <UserMinus className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <Label htmlFor="environment" className="text-sm font-medium">
            Ambiente para Análise de Impacto
          </Label>
          <EnvironmentSelector
            value={environmentId}
            onChange={setEnvironmentId}
            placeholder="Selecione um ambiente para análise de impacto"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Selecione um ambiente para visualizar instâncias de componentes específicas
          </p>
        </div>

        <div>
          <Label htmlFor="components" className="text-sm font-medium">
            Componentes Afetados
          </Label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Selecionar componentes..." />
            </SelectTrigger>
            <SelectContent>
              {loadingComponents ? (
                <SelectItem value="loading" disabled>
                  Carregando componentes...
                </SelectItem>
              ) : (
                components.map(component => (
                  <SelectItem key={component.id} value={component.id.toString()}>
                    {component.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          <div className="mt-2">
            {componentsIds.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum componente selecionado
              </p>
            ) : (
              <div className="space-y-1">
                {componentsIds.map(id => {
                  const component = components.find(c => parseInt(c.id) === id);
                  return (
                    <div key={id} className="flex items-center justify-between p-2 rounded-md border">
                      <span>{component?.name || `Componente ${id}`}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setComponentsIds(componentsIds.filter(cid => cid !== id))}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="tags" className="text-sm font-medium">
            Tags
          </Label>
          <div className="flex gap-2 mt-1 mb-2">
            <Input
              id="tags"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={handleTagKeyDown}
              placeholder="Adicionar tag..."
              className="flex-1"
            />
            <Button 
              type="button" 
              onClick={addTag}
              variant="outline"
              size="sm"
            >
              <Plus size={16} />
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-2 mt-2">
            {tags.map((tag, index) => (
              <div 
                key={index} 
                className="flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary text-sm"
              >
                <Tag size={14} />
                <span>{tag}</span>
                <button
                  type="button"
                  onClick={() => removeTag(index)}
                  className="ml-1 text-primary hover:text-primary/70 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
            {tags.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhuma tag adicionada</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">
          {initialData.id ? 'Salvar Alterações' : 'Criar ADR'}
        </Button>
      </div>
    </form>
  );
} 