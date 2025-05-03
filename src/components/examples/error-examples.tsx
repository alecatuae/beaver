'use client';

import React, { useState } from 'react';
import { useError } from '@/lib/contexts/error-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { FormErrorMessage, InlineErrorMessage } from '@/components/ui/error-message';
import { 
  CommonErrors, 
  ComponentErrors, 
  ADRErrors, 
  EnvironmentErrors,
  createCustomError, 
  ErrorModule, 
  ErrorType, 
  ErrorSource
} from '@/lib/error-codes';

/**
 * Componente de exemplo para demonstrar o sistema de mensagens de erro
 */
export function ErrorExamples() {
  const { handleError, clearError } = useError();
  const [showFormError, setShowFormError] = useState(false);
  const [showInlineError, setShowInlineError] = useState(false);

  // Exemplos de erros
  const handleGlobalError = () => {
    handleError(CommonErrors.OPERATION_FAILED);
  };

  const handleCustomError = () => {
    const customError = createCustomError(CommonErrors.VALIDATION_FAILED, {
      description: 'Dados inválidos no formulário de cadastro.',
      solution: 'Verifique os campos de nome e e-mail antes de continuar.',
      context: {
        form: 'UserRegistration',
        fields: ['name', 'email']
      }
    });
    handleError(customError);
  };

  const handleComponentError = () => {
    handleError(ComponentErrors.COMPONENT_NOT_FOUND);
  };

  const handleADRError = () => {
    handleError(ADRErrors.INVALID_PARTICIPANTS);
  };

  const toggleFormError = () => {
    setShowFormError(!showFormError);
  };

  const toggleInlineError = () => {
    setShowInlineError(!showInlineError);
  };

  // Criar um erro personalizado com formato específico
  const customCodeError = createCustomError({
    errorCode: `ERR-${ErrorModule.TEAM}-${ErrorType.PERMISSION}-${ErrorSource.API}`,
    title: 'Erro: Permissão negada para time',
    description: 'Você não tem permissão para gerenciar este time.',
    solution: 'Solicite acesso ao administrador do time.',
    statusCode: 403
  });

  return (
    <div className="space-y-8 p-4">
      <Card>
        <CardHeader>
          <CardTitle>Sistema Padronizado de Mensagens de Erro</CardTitle>
          <CardDescription>
            Exemplos do sistema de mensagens de erro com o formato padronizado ERR-XXXX-YY-ZZ
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div>
              <h3 className="text-lg font-medium mb-2">Erros Globais</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Exibidos no topo da página com notificação persistente.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button onClick={handleGlobalError} variant="outline">
                  Erro de Operação
                </Button>
                <Button onClick={handleCustomError} variant="outline">
                  Erro de Validação
                </Button>
                <Button onClick={handleComponentError} variant="outline">
                  Erro de Componente
                </Button>
                <Button onClick={handleADRError} variant="outline">
                  Erro de ADR
                </Button>
                <Button 
                  onClick={() => handleError(customCodeError)} 
                  variant="outline"
                >
                  Erro de Time
                </Button>
                <Button 
                  onClick={() => handleError(EnvironmentErrors.ENVIRONMENT_NOT_FOUND)} 
                  variant="outline"
                >
                  Erro de Ambiente
                </Button>
                <Button 
                  onClick={clearError} 
                  variant="secondary"
                >
                  Limpar Erro
                </Button>
              </div>
            </div>
  
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-2">Erros de Formulário</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Exibidos próximos aos campos de formulário.
              </p>
              <div className="flex flex-wrap gap-3 mb-4">
                <Button onClick={toggleFormError} variant="outline">
                  {showFormError ? "Ocultar" : "Exibir"} Erro de Formulário
                </Button>
              </div>
              
              {showFormError && (
                <FormErrorMessage
                  error={createCustomError(CommonErrors.VALIDATION_FAILED, {
                    description: 'Alguns campos do formulário contêm erros.',
                    solution: 'Verifique os campos de nome, email e telefone.'
                  })}
                  onClose={() => setShowFormError(false)}
                />
              )}
            </div>
  
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-2">Erros Inline</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Versão compacta para uso dentro de componentes.
              </p>
              <div className="flex flex-wrap gap-3 mb-4">
                <Button onClick={toggleInlineError} variant="outline">
                  {showInlineError ? "Ocultar" : "Exibir"} Erro Inline
                </Button>
              </div>
              
              {showInlineError && (
                <InlineErrorMessage
                  error={{
                    title: 'Campo inválido',
                    description: 'O valor informado não é válido.',
                    errorCode: `ERR-${ErrorModule.COMPONENT}-${ErrorType.INPUT}-${ErrorSource.UI}`
                  }}
                  showCode={false}
                />
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between border-t pt-4">
          <p className="text-xs text-muted-foreground">
            O sistema padronizado de erros utiliza o formato ERR-XXXX-YY-ZZ para códigos de erro.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
} 