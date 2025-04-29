"use client";

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Upload, X, ImageIcon, AlertCircle } from 'lucide-react';
import { CategoryType, CategoryInput } from '@/lib/graphql';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
  const [imageError, setImageError] = useState<string | null>(null);
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
      // Limpar erro anterior
      setImageError(null);
      
      // Verificar tipo de arquivo (apenas PNG e SVG)
      if (!['image/png', 'image/svg+xml'].includes(file.type)) {
        setImageError('Apenas imagens PNG e SVG são permitidas');
        return;
      }

      // Verificar tamanho do arquivo (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setImageError('A imagem deve ter no máximo 2MB');
        return;
      }

      // Criar uma imagem para verificar as dimensões
      const img = new Image();
      const reader = new FileReader();
      
      reader.onload = (event) => {
        if (event.target?.result) {
          img.onload = () => {
            if (img.width > 256 || img.height > 256) {
              setImageError('A imagem deve ter no máximo 256x256 pixels');
              return;
            }
            
            // Se passou todas as validações, atualiza a imagem
            const base64 = event.target?.result as string;
            setImage(base64.split(',')[1]); // Remove o prefixo "data:image/png;base64,"
          };
          
          img.src = event.target.result as string;
        }
      };
      
      reader.readAsDataURL(file);
    }
  };

  // Remover imagem
  const handleRemoveImage = () => {
    setImage(undefined);
    setImageError(null);
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
    
    if (description.length > 256) {
      validationErrors.description = 'A descrição deve ter no máximo 256 caracteres';
    }
    
    if (imageError) {
      validationErrors.image = imageError;
    }
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    // Limpar erros e enviar dados
    setErrors({});
      
    onSubmit({
      name,
      description: description.trim() || undefined,
      image
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="name" className="text-sm font-medium flex items-center">
            Nome da Categoria
            <span className="text-destructive ml-1">*</span>
          </Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={errors.name ? 'border-destructive' : ''}
            placeholder="Digite o nome da categoria"
          />
          {errors.name && (
            <p className="text-destructive text-sm mt-1 flex items-center">
              <AlertCircle size={12} className="mr-1" />
              {errors.name}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="description" className="text-sm font-medium flex items-center justify-between">
            <span>Descrição</span>
            <span className={`text-xs ${remainingChars <= 20 ? 'text-destructive' : 'text-muted-foreground'}`}>
              {remainingChars} caracteres restantes
            </span>
          </Label>
          <Textarea
            id="description"
            value={description}
            onChange={handleDescriptionChange}
            rows={4}
            maxLength={256}
            className={errors.description ? 'border-destructive' : ''}
            placeholder="Descreva a categoria (opcional)"
          />
          {errors.description && (
            <p className="text-destructive text-sm mt-1 flex items-center">
              <AlertCircle size={12} className="mr-1" />
              {errors.description}
            </p>
          )}
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
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors"
                      >
                        <X size={16} className="text-destructive" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Remover imagem</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            ) : (
              <div className="border border-dashed rounded-md p-8 text-center flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary transition-colors"
                onClick={() => fileInputRef.current?.click()}>
                <ImageIcon size={32} className="text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Clique para fazer upload</p>
                <p className="text-xs text-muted-foreground">PNG ou SVG, máx. 2MB, 256x256px</p>
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
            {imageError && (
              <p className="text-destructive text-sm mt-1 flex items-center">
                <AlertCircle size={12} className="mr-1" />
                {imageError}
              </p>
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