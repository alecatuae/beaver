"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { X, ImageIcon, AlertCircle, Check, Trash2 } from 'lucide-react';
import { CategoryType, CategoryInput, GET_CATEGORY_IMAGES } from '@/lib/graphql';
import { useQuery } from '@apollo/client';
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
  onDelete?: () => void;
  hasComponents?: boolean;
}

export default function CategoryForm({ 
  initialData = { name: '', description: '' }, 
  onSubmit, 
  onCancel,
  onDelete,
  hasComponents = false
}: CategoryFormProps) {
  // Estados do formulário
  const [name, setName] = useState(initialData.name || '');
  const [description, setDescription] = useState(initialData.description?.slice(0, 256) || '');
  const [image, setImage] = useState<string | undefined>(initialData.image);
  const [showImageGrid, setShowImageGrid] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  // Buscar imagens disponíveis
  const { data: imageData } = useQuery(GET_CATEGORY_IMAGES);
  const availableImages = imageData?.categoryImages || [];

  // Contador de caracteres restantes
  const remainingChars = 256 - description.length;

  // Manipulador para o campo de descrição
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= 256) {
      setDescription(value);
    }
  };

  // Manipulador para selecionar uma imagem do catálogo
  const handleSelectImage = (imageName: string) => {
    setImage(imageName);
    setShowImageGrid(false);
  };

  // Remover imagem
  const handleRemoveImage = () => {
    setImage(undefined);
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
            placeholder="Descreva a categoria (opcional)"
          />
          <div className="text-right">
            <span className={`text-xs ${remainingChars <= 20 ? 'text-destructive' : 'text-muted-foreground'}`}>
              {remainingChars} caracteres restantes
            </span>
          </div>
          {errors.description && (
            <p className="text-destructive text-sm mt-1 flex items-center">
              <AlertCircle size={12} className="mr-1" />
              {errors.description}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="image" className="text-sm font-medium">
            Imagem da categoria
          </Label>
          <div className="mt-2">
            {image ? (
              <div className="relative w-full max-w-[256px] h-auto border rounded-md overflow-hidden flex items-center justify-center bg-background p-4">
                <img 
                  src={`/images/categories/${image}`} 
                  alt="Imagem da categoria" 
                  className="w-16 h-16 object-contain"
                />
                <p className="ml-3 text-sm hidden">{image}</p>
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
              <div className="relative">
                <Button
                  type="button"
                  variant="outline"
                  className="mt-2"
                  onClick={() => setShowImageGrid(!showImageGrid)}
                >
                  <ImageIcon className="mr-2 h-4 w-4" />
                  Selecionar Imagem
                </Button>

                {/* Grid de seleção de imagem */}
                {showImageGrid && (
                  <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50">
                    <div className="relative bg-background rounded-md p-4 shadow-md w-[400px] max-h-[80vh] overflow-hidden">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-sm font-medium">Selecione uma imagem</h3>
                        <Button 
                          type="button" 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => setShowImageGrid(false)}
                        >
                          <X size={16} />
                        </Button>
                      </div>
                      <div className="grid grid-cols-4 gap-3 overflow-y-auto max-h-[calc(80vh-80px)] p-1">
                        {availableImages.map((imageName: string) => (
                          <div 
                            key={imageName}
                            onClick={() => handleSelectImage(imageName)}
                            className={`
                              p-2 border rounded-md cursor-pointer flex flex-col items-center 
                              hover:border-primary transition-colors
                              ${image === imageName ? 'border-primary bg-primary/10' : ''}
                            `}
                          >
                            <div className="relative w-full h-16 flex items-center justify-center">
                              <img 
                                src={`/images/categories/${imageName}`}
                                alt={imageName}
                                className="h-12 w-12 object-contain" 
                              />
                              {image === imageName && (
                                <div className="absolute top-0 right-0 bg-primary text-white rounded-full">
                                  <Check size={16} />
                                </div>
                              )}
                            </div>
                            <p className="text-xs text-center mt-1 truncate w-full">
                              {imageName}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-4 border-t">
        {initialData.id && onDelete && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={onDelete} 
                    className="flex items-center gap-1"
                    disabled={hasComponents}
                  >
                    <Trash2 size={16} />
                    Excluir
                  </Button>
                </div>
              </TooltipTrigger>
              {hasComponents && (
                <TooltipContent>
                  <p>Não é possível excluir uma categoria com componentes associados</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        )}
        <div className="flex-grow"></div>
        <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">
          Salvar Alterações
        </Button>
      </div>
    </form>
  );
} 