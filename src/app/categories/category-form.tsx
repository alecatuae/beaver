"use client";

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Upload, X, ImageIcon } from 'lucide-react';
import { CategoryType, CategoryInput } from '@/lib/graphql';

// Interface para o formulário de categoria
interface CategoryFormProps {
  initialData?: Partial<CategoryType>;
  onSubmit: (data: CategoryInput) => void;
  onCancel: () => void;
}

export default function CategoryForm({ 
  initialData = { name: '', description: '' }, 
  onSubmit, 
  onCancel 
}: CategoryFormProps) {
  // Estados do formulário
  const [name, setName] = useState(initialData.name || '');
  const [description, setDescription] = useState(initialData.description?.slice(0, 256) || '');
  const [image, setImage] = useState<string | undefined>(initialData.image);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Contador de caracteres restantes
  const remainingChars = 256 - description.length;

  // Manipulador para o campo de descrição
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= 256) {
      setDescription(value);
    }
  };

  // Manipulador para upload de imagem
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Verificar tipo de arquivo (apenas PNG e SVG)
      if (!['image/png', 'image/svg+xml'].includes(file.type)) {
        setErrors({
          ...errors,
          image: 'Apenas imagens PNG e SVG são permitidas'
        });
        return;
      }

      // Verificar tamanho do arquivo (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setErrors({
          ...errors,
          image: 'A imagem deve ter no máximo 2MB'
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setImage(base64.split(',')[1]);  // Remove o prefixo "data:image/png;base64,"
        setErrors({
          ...errors,
          image: ''
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // Remover imagem
  const handleRemoveImage = () => {
    setImage(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
      
    onSubmit({
      id: initialData.id,
      name,
      description,
      image
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="name" className="text-sm font-medium">
            Nome da Categoria
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
          <Label htmlFor="image" className="text-sm font-medium">
            Imagem (PNG ou SVG, máx. 256x256px)
          </Label>
          <div className="mt-2">
            {image ? (
              <div className="relative w-full max-w-[256px] h-auto border rounded-md overflow-hidden">
                <img 
                  src={`data:image/png;base64,${image}`} 
                  alt="Imagem da categoria" 
                  className="w-full h-auto object-contain max-h-[200px]"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors"
                >
                  <X size={16} className="text-destructive" />
                </button>
              </div>
            ) : (
              <div className="border border-dashed rounded-md p-8 text-center flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary transition-colors"
                onClick={() => fileInputRef.current?.click()}>
                <ImageIcon size={32} className="text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Clique para fazer upload</p>
                <p className="text-xs text-muted-foreground">PNG ou SVG, máx. 256x256px</p>
              </div>
            )}
            <input 
              type="file" 
              id="image" 
              ref={fileInputRef}
              onChange={handleImageUpload} 
              className="hidden" 
              accept="image/png,image/svg+xml"
            />
            {errors.image && (
              <p className="text-destructive text-sm mt-1">{errors.image}</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">
          {initialData.id ? 'Salvar Alterações' : 'Criar Categoria'}
        </Button>
      </div>
    </form>
  );
} 