/**
 * Página de Criação de Ambiente
 * 
 * Formulário para adicionar um novo ambiente ao sistema.
 * Permite inserir nome e descrição com validação básica.
 * 
 * @author Time de Desenvolvimento Beaver
 * @since 2.0.0
 */
"use client";

import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import { CREATE_ENVIRONMENT, EnvironmentInput } from '@/lib/graphql';
import { AppLayout } from '@/components/layout/app-layout';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { useError } from '@/lib/contexts/error-context';

export default function NewEnvironmentPage() {
  const [formData, setFormData] = useState<EnvironmentInput>({
    name: '',
    description: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createEnvironment] = useMutation(CREATE_ENVIRONMENT);
  const router = useRouter();
  const { toast } = useToast();
  const { handleError } = useError();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validação básica
      if (!formData.name.trim()) {
        throw new Error('O nome do ambiente é obrigatório');
      }

      const { data } = await createEnvironment({
        variables: { input: formData }
      });

      toast({
        title: "Ambiente criado",
        description: `O ambiente "${formData.name}" foi criado com sucesso.`
      });

      // Redirecionar para a página de detalhes do ambiente
      router.push(`/environments/${data.createEnvironment.id}`);
    } catch (err) {
      handleError(err, { component: 'NewEnvironmentPage.handleSubmit' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <div className="animate-in">
        <div className="flex items-center mb-6">
          <Link href="/environments">
            <Button variant="ghost" className="mr-4">
              <ChevronLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Novo Ambiente</h1>
            <p className="text-muted-foreground mt-1">
              Crie um novo ambiente para organizar instâncias de componentes
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-base">
                  Nome <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="mt-1"
                  placeholder="Ex: Desenvolvimento, Homologação, Produção"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description" className="text-base">
                  Descrição
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description || ''}
                  onChange={handleInputChange}
                  className="mt-1"
                  placeholder="Descreva o propósito deste ambiente"
                  rows={4}
                />
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-4">
              <Link href="/environments">
                <Button variant="outline" type="button">
                  Cancelar
                </Button>
              </Link>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Salvar
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </AppLayout>
  );
} 