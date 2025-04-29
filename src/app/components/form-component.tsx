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
import { Tag, X, Plus } from 'lucide-react';
import { ComponentStatus, ComponentType, ComponentInput, CategoryType, GET_CATEGORIES } from '@/lib/graphql';
import { useQuery } from '@apollo/client';

// Interface para o formulário de componente
interface ComponentFormProps {
  initialData?: Partial<ComponentType>;
  onSubmit: (data: ComponentInput) => void;
  onCancel: () => void;
}

export default function ComponentForm({ 
  initialData = { name: '', description: '', status: ComponentStatus.ACTIVE, tags: [] }, 
  onSubmit, 
  onCancel 
}: ComponentFormProps) {
  // Estados do formulário
  const [name, setName] = useState(initialData.name || '');
  const [description, setDescription] = useState(initialData.description?.slice(0, 256) || '');
  const [status, setStatus] = useState<ComponentStatus>(initialData.status || ComponentStatus.ACTIVE);
  const [categoryId, setCategoryId] = useState<number | null>(initialData.categoryId || null);
  const [tags, setTags] = useState<string[]>(initialData.tags || []);
  const [newTag, setNewTag] = useState('');
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  // Buscar categorias
  const { data: categoriesData } = useQuery(GET_CATEGORIES);
  const categories = categoriesData?.categories || [];

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
    
    if (!name.trim()) {
      validationErrors.name = 'O nome é obrigatório';
    }
    
    if (!description.trim()) {
      validationErrors.description = 'A descrição é obrigatória';
    } else if (description.length > 256) {
      validationErrors.description = 'A descrição deve ter no máximo 256 caracteres';
    }
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    // Limpar erros e enviar dados
    setErrors({});
    
    // Garantir que o status é enviado como o enum correto
    const validStatus = Object.values(ComponentStatus).includes(status as ComponentStatus) 
      ? status 
      : ComponentStatus.ACTIVE;
      
    onSubmit({
      name,
      description,
      status: validStatus,
      categoryId: categoryId,
      tags
    });
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="name" className="text-sm font-medium">
            Nome do Componente
          </Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={errors.name ? 'border-destructive' : ''}
          />
          {errors.name && (
            <p className="text-destructive text-sm mt-1">{errors.name}</p>
          )}
        </div>

        <div>
          <Label htmlFor="description" className="text-sm font-medium">
            Descrição
          </Label>
          <Textarea
            id="description"
            value={description}
            onChange={handleDescriptionChange}
            rows={4}
            maxLength={256}
            className={errors.description ? 'border-destructive' : ''}
          />
          <div className="flex justify-between items-center mt-1">
            <div>
              {errors.description && (
                <p className="text-destructive text-sm">{errors.description}</p>
              )}
            </div>
            <p className={`text-xs ${remainingChars <= 20 ? 'text-destructive' : 'text-muted-foreground'}`}>
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
            onValueChange={(value) => setStatus(value as ComponentStatus)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ComponentStatus.ACTIVE}>Ativo</SelectItem>
              <SelectItem value={ComponentStatus.INACTIVE}>Inativo</SelectItem>
              <SelectItem value={ComponentStatus.DEPRECATED}>Depreciado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="category" className="text-sm font-medium">
            Categoria
          </Label>
          <Select
            value={categoryId?.toString() || "null"}
            onValueChange={(value) => setCategoryId(value === "null" ? null : parseInt(value))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma categoria (opcional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="null">Sem categoria</SelectItem>
              {categories.map((category: CategoryType) => (
                <SelectItem key={category.id} value={category.id.toString()}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
          {initialData.id ? 'Salvar Alterações' : 'Criar Componente'}
        </Button>
      </div>
    </form>
  );
} 