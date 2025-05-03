/**
 * Página de Edição de Ambiente
 * 
 * Formulário para atualizar as informações de um ambiente existente.
 * Carrega os dados do ambiente através do ID na URL e permite editar
 * o nome e a descrição.
 * 
 * @author Time de Desenvolvimento Beaver
 * @since 2.0.0
 */
"use client";

import React, { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { GET_ENVIRONMENT, UPDATE_ENVIRONMENT, EnvironmentInput } from '@/lib/graphql';
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

type EnvironmentParams = {
  params: {
    id: string;
  }
}

export default function EditEnvironmentPage({ params }: EnvironmentParams) {
  const environmentId = parseInt(params.id);
  const [formData, setFormData] = useState<EnvironmentInput>({
    name: '',
    description: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [updateEnvironment] = useMutation(UPDATE_ENVIRONMENT);
  const { data: environmentData, loading: environmentLoading, error: environmentError } = useQuery(
    GET_ENVIRONMENT, 
    { 
      variables: { id: environmentId },
      skip: isNaN(environmentId)
    }
  );
  const router = useRouter();
  const { toast } = useToast();
  const { handleError } = useError();

  useEffect(() => {
    if (environmentData?.environment) {
      setFormData({
        name: environmentData.environment.name,
        description: environmentData.environment.description || ''
      });
    }
  }, [environmentData]);

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

      const { data } = await updateEnvironment({
        variables: { 
          id: environmentId,
          input: formData 
        }
      });

      toast({
        title: "Ambiente atualizado",
        description: `O ambiente "${formData.name}" foi atualizado com sucesso.`
      });

      // Redirecionar para a página de detalhes do ambiente
      router.push(`/environments/${environmentId}`);
    } catch (err) {
      handleError(err, { component: 'EditEnvironmentPage.handleSubmit' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isNaN(environmentId)) {
    return (
      <AppLayout>
        <div className="bg-red-50 border border-red-200 rounded-md p-4 my-4">
          <h3 className="text-sm font-medium text-red-800">ID de ambiente inválido</h3>
          <p className="text-sm text-red-700 mt-1">O ID fornecido não é um número válido.</p>
          <Link href="/environments">
            <Button variant="outline" className="mt-2">
              Voltar para ambientes
            </Button>
          </Link>
        </div>
      </AppLayout>
    );
  }

  if (environmentError) {
    handleError(environmentError, { component: 'EditEnvironmentPage' });
  }

  return (
    <AppLayout>
      <div className="animate-in">
        <div className="flex items-center mb-6">
          <Link href={`/environments/${environmentId}`}>
            <Button variant="ghost" className="mr-4">
              <ChevronLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Editar Ambiente</h1>
            <p className="text-muted-foreground mt-1">
              Atualize as informações do ambiente
            </p>
          </div>
        </div>

        {environmentLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : !environmentData?.environment ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 my-4">
            <h3 className="text-sm font-medium text-yellow-800">Ambiente não encontrado</h3>
            <p className="text-sm text-yellow-700 mt-1">O ambiente solicitado não existe ou foi removido.</p>
            <Link href="/environments">
              <Button variant="outline" className="mt-2">
                Voltar para ambientes
              </Button>
            </Link>
          </div>
        ) : (
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
                <Link href={`/environments/${environmentId}`}>
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
        )}
      </div>
    </AppLayout>
  );
} 