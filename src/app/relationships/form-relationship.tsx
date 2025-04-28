"use client";

import React, { useState } from 'react';
import { DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RelationshipType } from './page';
import { ComponentType, RelationInput } from '@/lib/graphql';
import { toast } from '@/components/ui/use-toast';

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
  
  // Estado para erros de validação
  const [errors, setErrors] = useState<Record<string, string>>({});

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
    
    onSubmit(relationData);
  };

  // Reset do formulário quando alterado entre edição/criação
  React.useEffect(() => {
    setSourceId(initialData?.sourceId || null);
    setTargetId(initialData?.targetId || null);
    setType(initialData?.type || '');
    setErrors({});
  }, [initialData]);

  return (
    <div className="grid gap-4 py-4">
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