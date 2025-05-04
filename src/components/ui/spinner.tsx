'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2, RefreshCw } from 'lucide-react';
import { cva, VariantProps } from 'class-variance-authority';

const spinnerVariants = cva(
  "animate-spin text-muted-foreground",
  {
    variants: {
      size: {
        xs: "h-3 w-3",
        sm: "h-4 w-4",
        md: "h-6 w-6",
        lg: "h-8 w-8",
        xl: "h-12 w-12",
      },
      variant: {
        default: "text-muted-foreground",
        primary: "text-primary",
        secondary: "text-secondary",
        success: "text-success",
        destructive: "text-destructive",
      },
    },
    defaultVariants: {
      size: "md",
      variant: "default",
    },
  }
);

export interface SpinnerProps extends 
  React.HTMLAttributes<HTMLDivElement>,
  VariantProps<typeof spinnerVariants> {
  /**
   * Se o spinner deve ser exibido
   */
  loading?: boolean;
  
  /**
   * Ícone personalizado a ser usado (padrão: Loader2)
   */
  icon?: 'loader' | 'refresh';
  
  /**
   * Texto a ser exibido junto com o spinner
   */
  text?: string;
  
  /**
   * Posição do texto em relação ao spinner
   */
  textPosition?: 'left' | 'right' | 'top' | 'bottom' | 'none';
  
  /**
   * Se deve centralizar o spinner em seu contêiner
   */
  centered?: boolean;
  
  /**
   * Adicionar fundo semitransparente 
   */
  overlay?: boolean;
}

/**
 * Spinner para indicar operações em progresso
 */
export function Spinner({
  className,
  size,
  variant,
  loading = true,
  icon = 'loader',
  text,
  textPosition = 'right',
  centered = false,
  overlay = false,
  ...props
}: SpinnerProps) {
  // Não renderizar nada se não estiver carregando
  if (!loading) return null;
  
  // Escolher o ícone adequado
  const SpinnerIcon = icon === 'loader' ? Loader2 : RefreshCw;
  
  // Determinar a direção do flex baseado na posição do texto
  const flexDirection = textPosition === 'top' ? 'flex-col' : 
                       textPosition === 'bottom' ? 'flex-col-reverse' : 
                       textPosition === 'left' ? 'flex-row-reverse' : 
                       'flex-row';
  
  // Componente principal
  const spinner = (
    <div 
      className={cn(
        "flex items-center justify-center gap-2",
        flexDirection,
        centered && "absolute inset-0 m-auto",
        overlay && "fixed inset-0 z-50 bg-background/80 backdrop-blur-sm",
        className
      )}
      {...props}
    >
      <SpinnerIcon className={cn(spinnerVariants({ size, variant }))} />
      
      {/* Exibir texto se fornecido e a posição não for 'none' */}
      {text && textPosition !== 'none' && (
        <span className={cn(
          "text-sm font-medium",
          size === 'xs' && "text-xs",
          size === 'sm' && "text-xs",
          size === 'lg' && "text-base",
          size === 'xl' && "text-lg",
          `text-${variant}`,
        )}>
          {text}
        </span>
      )}
    </div>
  );
  
  return spinner;
}

/**
 * Componente que exibe conteúdo com um spinner de sobreposição durante operações de carregamento
 */
export function LoadingContainer({
  children,
  loading,
  spinnerProps,
  className,
  ...props
}: {
  children: React.ReactNode;
  loading: boolean;
  spinnerProps?: Partial<SpinnerProps>;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("relative", className)} {...props}>
      {children}
      
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-[1px] z-10 rounded-md">
          <Spinner 
            size="md" 
            variant="primary"
            text={spinnerProps?.text || "Carregando..."}
            {...spinnerProps}
          />
        </div>
      )}
    </div>
  );
} 