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
import { ComponentType, RelationType, RelationInput } from '@/lib/graphql';
import { RelationshipType } from './page';

// Interface para o formulário de relacionamento
interface RelationshipFormProps {
  initialData?: Partial<RelationType>;
  components: ComponentType[];
  onSubmit: (data: RelationInput) => void;
  onCancel: () => void;
}

export default function RelationshipForm({ 
  initialData = { sourceId: 0, targetId: 0, type: RelationshipType.CONNECTS_TO, properties: {} }, 
  components,
  onSubmit, 
  onCancel 
}: RelationshipFormProps) {
  // Estados do formulário
  const [sourceId, setSourceId] = useState<number>(initialData.sourceId || 0);
  const [targetId, setTargetId] = useState<number>(initialData.targetId || 0);
  const [type, setType] = useState<string>(initialData.type || RelationshipType.CONNECTS_TO);
  const [description, setDescription] = useState<string>(initialData.properties?.description || '');
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  // Contador de caracteres restantes
  const remainingChars = 256 - description.length;

  // Manipulador para o campo de descrição
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= 256) {
      setDescription(value);
    }
  };

  // Manipulador de submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação
    const validationErrors: {[key: string]: string} = {};
    
    if (!sourceId) {
      validationErrors.sourceId = 'O componente de origem é obrigatório';
    }
    
    if (!targetId) {
      validationErrors.targetId = 'O componente de destino é obrigatório';
    }

    if (sourceId === targetId && sourceId !== 0) {
      validationErrors.targetId = 'O componente de destino não pode ser o mesmo que o de origem';
    }
    
    if (!type) {
      validationErrors.type = 'O tipo de relacionamento é obrigatório';
    }
    
    if (description.length > 256) {
      validationErrors.description = 'A descrição deve ter no máximo 256 caracteres';
    }
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    // Limpar erros e enviar dados
    setErrors({});
    
    // Prepare properties object with description
    const properties = description ? { description } : {};
      
    onSubmit({
      sourceId,
      targetId,
      type,
      properties
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="sourceId" className="text-sm font-medium">
            Componente de Origem
          </Label>
          <Select
            value={sourceId ? sourceId.toString() : ''}
            onValueChange={(value) => setSourceId(parseInt(value))}
          >
            <SelectTrigger className={errors.sourceId ? 'border-destructive' : ''}>
              <SelectValue placeholder="Selecione o componente de origem" />
            </SelectTrigger>
            <SelectContent>
              {components.map(component => (
                <SelectItem key={component.id} value={component.id.toString()}>
                  {component.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.sourceId && (
            <p className="text-destructive text-sm mt-1">{errors.sourceId}</p>
          )}
        </div>

        <div>
          <Label htmlFor="targetId" className="text-sm font-medium">
            Componente de Destino
          </Label>
          <Select
            value={targetId ? targetId.toString() : ''}
            onValueChange={(value) => setTargetId(parseInt(value))}
          >
            <SelectTrigger className={errors.targetId ? 'border-destructive' : ''}>
              <SelectValue placeholder="Selecione o componente de destino" />
            </SelectTrigger>
            <SelectContent>
              {components.map(component => (
                <SelectItem key={component.id} value={component.id.toString()}>
                  {component.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.targetId && (
            <p className="text-destructive text-sm mt-1">{errors.targetId}</p>
          )}
        </div>

        <div>
          <Label htmlFor="type" className="text-sm font-medium">
            Tipo de Relacionamento
          </Label>
          <Select
            value={type}
            onValueChange={(value) => setType(value)}
          >
            <SelectTrigger className={errors.type ? 'border-destructive' : ''}>
              <SelectValue placeholder="Selecione o tipo de relacionamento" />
            </SelectTrigger>
            <SelectContent>
              {Object.values(RelationshipType).map(relationshipType => (
                <SelectItem key={relationshipType} value={relationshipType}>
                  {relationshipType.replace(/_/g, ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.type && (
            <p className="text-destructive text-sm mt-1">{errors.type}</p>
          )}
        </div>

        <div>
          <Label htmlFor="description" className="text-sm font-medium">
            Descrição (opcional)
          </Label>
          <Textarea
            id="description"
            value={description}
            onChange={handleDescriptionChange}
            rows={4}
            maxLength={256}
            className={errors.description ? 'border-destructive' : ''}
          />
          <div className="flex justify-end items-center mt-1">
            <p className={`text-xs ${remainingChars <= 20 ? 'text-destructive' : 'text-muted-foreground'}`}>
              {remainingChars} caracteres restantes
            </p>
          </div>
          {errors.description && (
            <p className="text-destructive text-sm mt-1">{errors.description}</p>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">
          {initialData.id ? 'Salvar Alterações' : 'Criar Relacionamento'}
        </Button>
      </div>
    </form>
  );
} 