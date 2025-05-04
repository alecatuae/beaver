'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { cva, VariantProps } from 'class-variance-authority';

const progressBarVariants = cva(
  "relative w-full overflow-hidden rounded-full bg-secondary",
  {
    variants: {
      size: {
        sm: "h-1",
        md: "h-2",
        lg: "h-3",
        xl: "h-4",
      },
      variant: {
        default: "bg-secondary",
        primary: "bg-primary/20",
        success: "bg-success/20",
        info: "bg-info/20",
        warning: "bg-warning/20",
        destructive: "bg-destructive/20",
      },
    },
    defaultVariants: {
      size: "md",
      variant: "default",
    },
  }
);

const progressBarIndicatorVariants = cva(
  "h-full transition-all",
  {
    variants: {
      variant: {
        default: "bg-primary",
        primary: "bg-primary",
        success: "bg-success",
        info: "bg-info",
        warning: "bg-warning",
        destructive: "bg-destructive",
      },
      animation: {
        default: "transition-all",
        smooth: "transition-all ease-in-out duration-500",
        pulse: "animate-pulse",
        indeterminate: "animate-progress-indeterminate",
      }
    },
    defaultVariants: {
      variant: "default",
      animation: "default",
    },
  }
);

export interface ProgressBarProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof progressBarVariants> {
  /**
   * Valor atual do progresso (0-100)
   */
  value?: number;
  
  /**
   * Valor máximo (geralmente 100)
   */
  max?: number;
  
  /**
   * Se a barra deve mostrar um indicador indeterminado
   */
  indeterminate?: boolean;
  
  /**
   * Estilo de animação
   */
  animation?: VariantProps<typeof progressBarIndicatorVariants>["animation"];
  
  /**
   * Se deve mostrar o rótulo de porcentagem
   */
  showLabel?: boolean;
  
  /**
   * Se o rótulo deve ser mostrado dentro ou fora da barra
   */
  labelPosition?: 'inside' | 'outside' | 'right';
  
  /**
   * Se deve mostrar o indicador de tempo
   */
  showTime?: boolean;
  
  /**
   * Tempo decorrido em milissegundos
   */
  elapsedTime?: number;
}

export function ProgressBar({
  className,
  value = 0,
  max = 100,
  indeterminate = false,
  size,
  variant,
  animation = "default",
  showLabel = false,
  labelPosition = 'outside',
  showTime = false,
  elapsedTime = 0,
  ...props
}: ProgressBarProps) {
  // Calcular a porcentagem correta
  const percentage = Math.min(Math.max(0, (value / max) * 100), 100);
  
  // Selecionar animação apropriada
  const actualAnimation = indeterminate ? "indeterminate" : animation;
  
  // Formatar o tempo decorrido
  const formatElapsedTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };
  
  return (
    <div className="flex items-center space-x-2 w-full">
      <div 
        className={cn(progressBarVariants({ size, variant }), className)}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={indeterminate ? undefined : value}
        aria-valuetext={indeterminate ? "Carregando..." : `${percentage.toFixed(0)}%`}
        {...props}
      >
        {/* Indicador de progresso */}
        <div
          className={cn(
            progressBarIndicatorVariants({ variant, animation: actualAnimation }),
            "relative"
          )}
          style={indeterminate ? undefined : { width: `${percentage}%` }}
        >
          {/* Rótulo dentro da barra */}
          {showLabel && labelPosition === 'inside' && percentage > 15 && (
            <span className="absolute right-2 text-xs font-semibold text-white">
              {percentage.toFixed(0)}%
            </span>
          )}
        </div>
      </div>
      
      {/* Rótulo fora da barra */}
      {showLabel && labelPosition === 'outside' && (
        <span className="text-xs font-medium text-muted-foreground -ml-1">
          {percentage.toFixed(0)}%
        </span>
      )}
      
      {/* Rótulo à direita da barra */}
      {(showLabel && labelPosition === 'right') || showTime ? (
        <div className="flex items-center space-x-2 text-xs font-medium text-muted-foreground">
          {showLabel && labelPosition === 'right' && (
            <span>{percentage.toFixed(0)}%</span>
          )}
          {showTime && elapsedTime > 0 && (
            <span>{formatElapsedTime(elapsedTime)}</span>
          )}
        </div>
      ) : null}
    </div>
  );
}

/**
 * Componente de indicador de progresso circular
 */
export function CircularProgress({
  value = 0,
  max = 100,
  size = 40,
  strokeWidth = 4,
  variant = "primary",
  showLabel = false,
  className,
  ...props
}: {
  value?: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  variant?: "default" | "primary" | "success" | "info" | "warning" | "destructive";
  showLabel?: boolean;
} & React.SVGAttributes<SVGSVGElement>) {
  // Calcular a porcentagem e valores do círculo
  const percentage = Math.min(Math.max(0, (value / max) * 100), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = (percentage * circumference) / 100;
  
  // Mapear variantes para cores
  const variantToColor = {
    default: "var(--primary)",
    primary: "var(--primary)",
    success: "var(--success)",
    info: "var(--info)",
    warning: "var(--warning)",
    destructive: "var(--destructive)",
  };
  
  const color = variantToColor[variant] || variantToColor.default;
  
  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        {...props}
      >
        {/* Círculo de fundo */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          className="text-secondary"
          stroke="currentColor"
        />
        
        {/* Círculo de progresso */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          stroke={color}
          strokeDasharray={circumference}
          strokeDashoffset={circumference - dash}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{
            transition: "stroke-dashoffset 0.5s ease-in-out",
          }}
        />
      </svg>
      
      {/* Rótulo de percentual */}
      {showLabel && (
        <span 
          className="absolute text-xs font-semibold"
          style={{ color }}
        >
          {Math.round(percentage)}%
        </span>
      )}
    </div>
  );
} 