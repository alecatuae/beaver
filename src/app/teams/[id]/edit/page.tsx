/**
 * Página de Edição de Time
 * 
 * Formulário para atualizar as informações de um time existente.
 * Carrega os dados do time através do ID na URL e permite editar
 * o nome e a descrição.
 * 
 * @author Time de Desenvolvimento Beaver
 * @since 2.0.0
 */
"use client";

import React, { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { GET_TEAM, UPDATE_TEAM, TeamInput } from '@/lib/graphql';
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

type TeamParams = {
  params: {
    id: string;
  }
}

export default function EditTeamPage({ params }: TeamParams) {
  const teamId = parseInt(params.id);
  const [formData, setFormData] = useState<TeamInput>({
    name: '',
    description: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { data, loading, error } = useQuery(GET_TEAM, {
    variables: { id: teamId },
    fetchPolicy: 'network-only'
  });
  
  const [updateTeam] = useMutation(UPDATE_TEAM);
  const router = useRouter();
  const { toast } = useToast();
  const { handleError } = useError();

  useEffect(() => {
    if (data?.team) {
      setFormData({
        name: data.team.name,
        description: data.team.description || ''
      });
    }
  }, [data]);

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
        throw new Error('O nome do time é obrigatório');
      }

      await updateTeam({
        variables: {
          id: teamId,
          input: formData
        }
      });

      toast({
        title: "Time atualizado",
        description: `O time "${formData.name}" foi atualizado com sucesso.`
      });

      // Redirecionar para a página de detalhes do time
      router.push(`/teams/${teamId}`);
    } catch (err) {
      handleError(err, { component: 'EditTeamPage.handleSubmit' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <div className="bg-red-50 border border-red-200 rounded-md p-4 my-4 dark:bg-red-900/10 dark:border-red-900/30">
          <h3 className="text-sm font-medium text-red-800 dark:text-red-400">Erro ao carregar time</h3>
          <p className="text-sm text-red-700 mt-1 dark:text-red-400/80">{error.message}</p>
          <Button 
            variant="outline" 
            className="mt-2" 
            onClick={() => router.push('/teams')}
          >
            Voltar
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="animate-in">
        <div className="flex items-center mb-6">
          <Link href={`/teams/${teamId}`}>
            <Button variant="ghost" className="mr-4">
              <ChevronLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Editar Time</h1>
            <p className="text-muted-foreground mt-1">
              Atualize as informações do time
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
                  rows={4}
                />
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-4">
              <Link href={`/teams/${teamId}`}>
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