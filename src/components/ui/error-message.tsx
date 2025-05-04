'use client';

import React, { useState } from 'react';
import { AlertCircle, X } from 'lucide-react';
import { ErrorCode } from '../../lib/error-codes';
import { cn } from '@/lib/utils';

export type ErrorMessageVariant = 'global' | 'form' | 'inline';

export interface ErrorMessageProps {
  /** Código de erro no formato ERR-XXXX-YY-ZZ */
  errorCode: string;
  /** Título do erro */
  title?: string;
  /** Mensagem de erro detalhada */
  message: string;
  /** Solução sugerida para o erro */
  solution?: string;
  /** Variante do componente */
  variant?: ErrorMessageVariant;
  /** Função chamada ao fechar o erro */
  onClose?: () => void;
  /** Classe CSS adicional */
  className?: string;
}

/**
 * Componente para exibir mensagens de erro conforme o guia de estilo UI/UX
 */
export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  errorCode,
  title,
  message,
  solution,
  variant = 'inline',
  onClose,
  className = '',
}) => {
  const [visible, setVisible] = useState(true);

  if (!visible) {
    return null;
  }

  const handleClose = () => {
    setVisible(false);
    if (onClose) {
      onClose();
    }
  };

  // Classes base para todos os variantes
  const baseClasses = 'bg-red-50 border border-red-200 text-red-800 rounded p-4 relative';
  
  // Classes específicas para cada variante
  const variantClasses = {
    global: 'fixed top-4 right-4 z-50 w-96 shadow-lg',
    form: 'mb-4 w-full',
    inline: 'text-sm',
  };

  return (
    <div 
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      role="alert"
      aria-live="assertive"
    >
      {/* Cabeçalho com código de erro e botão fechar */}
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 mr-2 text-red-600" />
          <span className="font-semibold">
            {title || 'Erro'}
          </span>
        </div>
        {onClose && (
          <button 
            onClick={handleClose}
            className="text-red-500 hover:text-red-700"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      
      {/* Corpo da mensagem */}
      <div className="mb-2">
        <p>{message}</p>
      </div>
      
      {/* Solução sugerida */}
      {solution && (
        <div className="text-sm border-t border-red-200 pt-2 mt-2">
          <p><strong>Solução:</strong> {solution}</p>
        </div>
      )}
      
      {/* Código de erro */}
      <div className="text-xs text-red-500 mt-2">
        <code>{errorCode}</code>
      </div>
    </div>
  );
};

/**
 * Componente que recebe um objeto ErrorCode completo
 */
export const ErrorMessageFromCode: React.FC<{
  error: ErrorCode;
  variant?: ErrorMessageVariant;
  onClose?: () => void;
  className?: string;
}> = ({ error, variant, onClose, className }) => {
  return (
    <ErrorMessage
      errorCode={error.code}
      message={error.message}
      solution={error.solution}
      variant={variant}
      onClose={onClose}
      className={className}
    />
  );
};

export default ErrorMessage;

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