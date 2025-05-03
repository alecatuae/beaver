/**
 * Página de Criação de Time
 * 
 * Formulário para adicionar um novo time ao sistema.
 * Permite inserir nome e descrição com validação básica.
 * 
 * @author Time de Desenvolvimento Beaver
 * @since 2.0.0
 */
"use client";

import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import { CREATE_TEAM, TeamInput } from '@/lib/graphql';
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

export default function NewTeamPage() {
  const [formData, setFormData] = useState<TeamInput>({
    name: '',
    description: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createTeam] = useMutation(CREATE_TEAM);
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
        throw new Error('O nome do time é obrigatório');
      }

      const { data } = await createTeam({
        variables: { input: formData }
      });

      toast({
        title: "Time criado",
        description: `O time "${formData.name}" foi criado com sucesso.`
      });

      // Redirecionar para a página de detalhes do time
      router.push(`/teams/${data.createTeam.id}`);
    } catch (err) {
      handleError(err, { component: 'NewTeamPage.handleSubmit' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <div className="animate-in">
        <div className="flex items-center mb-6">
          <Link href="/teams">
            <Button variant="ghost" className="mr-4">
              <ChevronLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Novo Time</h1>
            <p className="text-muted-foreground mt-1">
              Crie um novo time para atribuir responsabilidades por componentes
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
                  placeholder="Ex: Platform Team, Network Team, UX Team"
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
                  placeholder="Descreva o propósito deste time"
                  rows={4}
                />
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-4">
              <Link href="/teams">
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