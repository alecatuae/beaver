"use client";

import React, { useState } from 'react';
import { DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RelationshipType } from './page';
import { ComponentType, RelationInput } from '@/lib/graphql';
import { toast } from '@/components/ui/use-toast';
import { EnvironmentSelector } from '@/components/selectors/EnvironmentSelector';
import { useQuery } from '@apollo/client';
import { GET_COMPONENT_INSTANCES_BY_ENVIRONMENT } from '@/lib/graphql';

interface RelationshipFormProps {
  onSubmit: (data: RelationInput) => void;
  onCancel: () => void;
  initialData?: RelationInput;
  components: ComponentType[];
  isEditMode?: boolean;
}

export default function RelationshipForm({
  onSubmit,
  onCancel,
  initialData,
  components,
  isEditMode = false
}: RelationshipFormProps) {
  // Estados para os valores do formulário
  const [sourceId, setSourceId] = useState<number | null>(initialData?.sourceId || null);
  const [targetId, setTargetId] = useState<number | null>(initialData?.targetId || null);
  const [type, setType] = useState<string>(initialData?.type || '');
  const [environmentId, setEnvironmentId] = useState<string>('');
  const [useInstances, setUseInstances] = useState<boolean>(false);
  const [sourceInstanceId, setSourceInstanceId] = useState<string>('');
  const [targetInstanceId, setTargetInstanceId] = useState<string>('');
  
  // Estado para erros de validação
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Buscar instâncias do ambiente selecionado
  const { data: instancesData, loading: loadingInstances } = useQuery(
    GET_COMPONENT_INSTANCES_BY_ENVIRONMENT, 
    {
      variables: { environmentId: parseInt(environmentId) },
      skip: !environmentId || !useInstances,
    }
  );

  const instances = instancesData?.componentInstancesByEnvironment || [];

  // Filtrar instâncias por componente
  const sourceInstances = instances.filter(
    (instance: any) => instance.component.id === sourceId?.toString()
  );
  
  const targetInstances = instances.filter(
    (instance: any) => instance.component.id === targetId?.toString()
  );

  // Função para validar o formulário
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!sourceId) {
      newErrors.sourceId = 'Selecione o componente de origem';
    }
    
    if (!targetId) {
      newErrors.targetId = 'Selecione o componente de destino';
    } else if (sourceId === targetId) {
      newErrors.targetId = 'Os componentes de origem e destino não podem ser os mesmos';
    }
    
    if (!type) {
      newErrors.type = 'Selecione o tipo de relacionamento';
    }

    if (useInstances) {
      if (!environmentId) {
        newErrors.environmentId = 'Selecione um ambiente para relacionar instâncias';
      }
      
      if (!sourceInstanceId) {
        newErrors.sourceInstanceId = 'Selecione a instância de origem';
      }
      
      if (!targetInstanceId) {
        newErrors.targetInstanceId = 'Selecione a instância de destino';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handler para submissão do formulário
  const handleSubmit = () => {
    if (!validateForm()) {
      toast({
        title: "Erro de validação",
        description: "Corrija os erros antes de continuar.",
        variant: "destructive"
      });
      return;
    }
    
    if (!sourceId || !targetId || !type) {
      return; // Extra safety check
    }
    
    const relationData: RelationInput = {
      sourceId,
      targetId,
      type,
      properties: {}
    };

    // Adicionar dados de instâncias se estiver usando relacionamento entre instâncias
    if (useInstances && sourceInstanceId && targetInstanceId) {
      relationData.sourceInstanceId = parseInt(sourceInstanceId);
      relationData.targetInstanceId = parseInt(targetInstanceId);
      relationData.environmentId = parseInt(environmentId);
    }
    
    onSubmit(relationData);
  };

  // Reset do formulário quando alterado entre edição/criação
  React.useEffect(() => {
    setSourceId(initialData?.sourceId || null);
    setTargetId(initialData?.targetId || null);
    setType(initialData?.type || '');
    setErrors({});
  }, [initialData]);

  // Limpar seleções de instâncias quando mudar os componentes
  React.useEffect(() => {
    setSourceInstanceId('');
  }, [sourceId]);

  React.useEffect(() => {
    setTargetInstanceId('');
  }, [targetId]);

  return (
    <div className="grid gap-4 py-4">
      {/* Escolha entre componentes ou instâncias */}
      <div className="grid gap-2">
        <Label htmlFor="instanceType">Tipo de Relacionamento</Label>
        <Select
          value={useInstances ? "instances" : "components"}
          onValueChange={(value) => setUseInstances(value === "instances")}
        >
          <SelectTrigger id="instanceType">
            <SelectValue placeholder="Selecione o tipo de entidades" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="components">Entre Componentes</SelectItem>
            <SelectItem value="instances">Entre Instâncias</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Ambiente (apenas quando usando instâncias) */}
      {useInstances && (
        <div className="grid gap-2">
          <Label htmlFor="environment" className={errors.environmentId ? 'text-destructive' : ''}>
            Ambiente {errors.environmentId && <span className="text-sm">({errors.environmentId})</span>}
          </Label>
          <EnvironmentSelector
            value={environmentId}
            onChange={setEnvironmentId}
            placeholder="Selecione o ambiente para as instâncias"
            className={errors.environmentId ? 'border-destructive' : ''}
          />
        </div>
      )}

      {/* Componente Origem */}
      <div className="grid gap-2">
        <Label htmlFor="source" className={errors.sourceId ? 'text-destructive' : ''}>
          Componente Origem {errors.sourceId && <span className="text-sm">({errors.sourceId})</span>}
        </Label>
        <Select
          value={sourceId?.toString() || ''}
          onValueChange={(value) => setSourceId(parseInt(value))}
        >
          <SelectTrigger id="source" className={errors.sourceId ? 'border-destructive' : ''}>
            <SelectValue placeholder="Selecione o componente de origem" />
          </SelectTrigger>
          <SelectContent>
            {components.map((component) => (
              <SelectItem key={`source-${component.id}`} value={component.id.toString()}>
                {component.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Instância Origem (quando aplicável) */}
      {useInstances && environmentId && sourceId && (
        <div className="grid gap-2">
          <Label htmlFor="sourceInstance" className={errors.sourceInstanceId ? 'text-destructive' : ''}>
            Instância Origem {errors.sourceInstanceId && <span className="text-sm">({errors.sourceInstanceId})</span>}
          </Label>
          <Select
            value={sourceInstanceId}
            onValueChange={setSourceInstanceId}
            disabled={loadingInstances || sourceInstances.length === 0}
          >
            <SelectTrigger id="sourceInstance" className={errors.sourceInstanceId ? 'border-destructive' : ''}>
              <SelectValue placeholder={
                loadingInstances 
                  ? "Carregando instâncias..." 
                  : sourceInstances.length === 0 
                    ? "Não há instâncias para este componente"
                    : "Selecione a instância de origem"
              } />
            </SelectTrigger>
            <SelectContent>
              {sourceInstances.map((instance: any) => (
                <SelectItem key={`sourceInstance-${instance.id}`} value={instance.id.toString()}>
                  {instance.hostname || `Instância ${instance.id}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Componente Destino */}
      <div className="grid gap-2">
        <Label htmlFor="target" className={errors.targetId ? 'text-destructive' : ''}>
          Componente Destino {errors.targetId && <span className="text-sm">({errors.targetId})</span>}
        </Label>
        <Select
          value={targetId?.toString() || ''}
          onValueChange={(value) => setTargetId(parseInt(value))}
        >
          <SelectTrigger id="target" className={errors.targetId ? 'border-destructive' : ''}>
            <SelectValue placeholder="Selecione o componente de destino" />
          </SelectTrigger>
          <SelectContent>
            {components.map((component) => (
              <SelectItem key={`target-${component.id}`} value={component.id.toString()}>
                {component.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Instância Destino (quando aplicável) */}
      {useInstances && environmentId && targetId && (
        <div className="grid gap-2">
          <Label htmlFor="targetInstance" className={errors.targetInstanceId ? 'text-destructive' : ''}>
            Instância Destino {errors.targetInstanceId && <span className="text-sm">({errors.targetInstanceId})</span>}
          </Label>
          <Select
            value={targetInstanceId}
            onValueChange={setTargetInstanceId}
            disabled={loadingInstances || targetInstances.length === 0}
          >
            <SelectTrigger id="targetInstance" className={errors.targetInstanceId ? 'border-destructive' : ''}>
              <SelectValue placeholder={
                loadingInstances 
                  ? "Carregando instâncias..." 
                  : targetInstances.length === 0 
                    ? "Não há instâncias para este componente"
                    : "Selecione a instância de destino"
              } />
            </SelectTrigger>
            <SelectContent>
              {targetInstances.map((instance: any) => (
                <SelectItem key={`targetInstance-${instance.id}`} value={instance.id.toString()}>
                  {instance.hostname || `Instância ${instance.id}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Tipo de Relacionamento */}
      <div className="grid gap-2">
        <Label htmlFor="type" className={errors.type ? 'text-destructive' : ''}>
          Tipo de Relacionamento {errors.type && <span className="text-sm">({errors.type})</span>}
        </Label>
        <Select
          value={type}
          onValueChange={setType}
        >
          <SelectTrigger id="type" className={errors.type ? 'border-destructive' : ''}>
            <SelectValue placeholder="Selecione o tipo de relacionamento" />
          </SelectTrigger>
          <SelectContent>
            {Object.values(RelationshipType).map((relType) => (
              <SelectItem key={relType} value={relType}>
                {relType.replace(/_/g, ' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DialogFooter className="flex justify-end gap-2 pt-4 mt-4 border-t">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" onClick={handleSubmit}>
          {isEditMode ? 'Salvar' : 'Criar'}
        </Button>
      </DialogFooter>
    </div>
  );
} 