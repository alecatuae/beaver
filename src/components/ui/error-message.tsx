'use client';

import React from 'react';
import { XCircle, X } from 'lucide-react';
import { ErrorDetails } from '@/lib/error-codes';
import { cn } from '@/lib/utils';

interface ErrorMessageProps {
  error: ErrorDetails;
  className?: string;
  onClose?: () => void;
  showCode?: boolean;
  variant?: 'global' | 'form' | 'inline';
}

/**
 * Componente ErrorMessage
 * 
 * Exibe uma mensagem de erro formatada de acordo com o guia de estilo.
 * 
 * @param error - Detalhes do erro a ser exibido
 * @param className - Classes adicionais para o componente
 * @param onClose - Função para fechar a mensagem
 * @param showCode - Se deve mostrar o código de erro
 * @param variant - Variante visual da mensagem ('global', 'form', 'inline')
 */
export function ErrorMessage({
  error,
  className,
  onClose,
  showCode = true,
  variant = 'global'
}: ErrorMessageProps) {
  if (!error) return null;

  return (
    <div
      className={cn(
        'relative bg-red-50 border border-red-400 rounded-md overflow-hidden',
        {
          'p-4 mb-4 mt-4': variant === 'global',
          'p-3 mb-2': variant === 'form',
          'p-2 my-1': variant === 'inline'
        },
        className
      )}
      role="alert"
      aria-live="assertive"
    >
      {/* Botão de fechar */}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 transition-colors"
          aria-label="Fechar mensagem de erro"
        >
          <X size={18} />
        </button>
      )}

      {/* Cabeçalho e ícone */}
      <div className="flex">
        <div className="flex-shrink-0">
          <XCircle className="h-5 w-5 text-red-600" aria-hidden="true" />
        </div>
        <div className="ml-3">
          {/* Título */}
          {error.title && (
            <h3 className="text-sm font-medium text-gray-900">
              {error.title}
            </h3>
          )}
          
          {/* Descrição */}
          <div className="mt-1">
            <p className="text-sm text-gray-700">
              {error.description}
            </p>
          </div>
          
          {/* Solução */}
          {error.solution && (
            <div className="mt-2">
              <p className="text-sm text-gray-600">
                {error.solution}
              </p>
            </div>
          )}
          
          {/* Código de erro */}
          {showCode && error.errorCode && (
            <div className="mt-2 text-right">
              <span className="text-xs text-gray-500">
                {error.errorCode}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Componente FormErrorMessage
 * 
 * Versão especializada de ErrorMessage para uso em formulários
 */
export function FormErrorMessage(props: Omit<ErrorMessageProps, 'variant'>) {
  return <ErrorMessage {...props} variant="form" />;
}

/**
 * Componente InlineErrorMessage
 * 
 * Versão compacta de ErrorMessage para uso inline
 */
export function InlineErrorMessage(props: Omit<ErrorMessageProps, 'variant'>) {
  return <ErrorMessage {...props} variant="inline" />;
} 