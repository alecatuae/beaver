/**
 * Versão otimizada do TeamSelector com memoização
 */
import React, { useCallback } from 'react';
import { useQuery } from '@apollo/client';
import { GET_TEAMS } from '../../lib/graphql';
import * as SelectPrimitive from '@radix-ui/react-select';
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from 'lucide-react';
import { cn } from '../../lib/utils';
import { withMemo } from '@/lib/memo-hoc';

interface TeamSelectorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  required?: boolean;
}

// Componentes memoizados para partes internas do seletor
const MemoizedSelectItem = withMemo(
  ({ value, children, className, disabled = false }: {
    value: string;
    children: React.ReactNode;
    className?: string;
    disabled?: boolean;
  }) => (
    <SelectPrimitive.Item
      value={value}
      disabled={disabled}
      className={cn(
        "relative flex items-center h-9 rounded-sm pl-8 pr-2 text-sm outline-none cursor-pointer hover:bg-accent hover:text-accent-foreground data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <CheckIcon className="h-4 w-4" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  ),
  { name: 'SelectItem' }
);

const MemoizedTrigger = withMemo(
  ({ placeholder, className, disabled, required }: {
    placeholder: string;
    className?: string;
    disabled?: boolean;
    required?: boolean;
  }) => (
    <SelectPrimitive.Trigger
      className={cn(
        "flex h-10 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 w-full",
        className
      )}
      aria-required={required}
      disabled={disabled}
    >
      <SelectPrimitive.Value placeholder={placeholder} />
      <SelectPrimitive.Icon asChild>
        <ChevronDownIcon className="h-4 w-4 opacity-50" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  ),
  { name: 'SelectTrigger' }
);

// Função base para o seletor de equipe
function TeamSelectorBase({
  value,
  onChange,
  disabled = false,
  placeholder = "Selecione um time",
  className,
  required = false,
}: TeamSelectorProps) {
  // Cache de primeira consulta para equipes
  const { data, loading, error } = useQuery(GET_TEAMS, {
    fetchPolicy: 'cache-first', // Usa cache para melhorar performance
  });

  // Memoizar o callback de mudança para evitar renderizações desnecessárias
  const handleValueChange = useCallback((newValue: string) => {
    onChange(newValue);
  }, [onChange]);

  const teams = data?.teams || [];
  const isDisabled = disabled || loading || !!error || teams.length === 0;

  return (
    <SelectPrimitive.Root
      value={value}
      onValueChange={handleValueChange}
      disabled={isDisabled}
    >
      <MemoizedTrigger 
        placeholder={placeholder}
        className={className}
        disabled={isDisabled}
        required={required}
      />
      
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          className="relative z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md animate-in fade-in-80"
          position="popper"
          sideOffset={5}
        >
          <SelectPrimitive.ScrollUpButton className="flex items-center justify-center h-[25px] bg-popover text-muted-foreground cursor-default">
            <ChevronUpIcon className="h-4 w-4" />
          </SelectPrimitive.ScrollUpButton>
          
          <SelectPrimitive.Viewport className="p-1">
            {loading ? (
              <MemoizedSelectItem
                value="loading"
                disabled
                className="relative flex items-center h-9 rounded-sm pl-8 pr-2 text-sm outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
              >
                <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                  <span className="h-2 w-2 rounded-full bg-gray-300 animate-pulse"></span>
                </span>
                Carregando...
              </MemoizedSelectItem>
            ) : error ? (
              <MemoizedSelectItem
                value="error"
                disabled
                className="relative flex items-center h-9 rounded-sm pl-8 pr-2 text-sm outline-none text-red-500"
              >
                Erro ao carregar times
              </MemoizedSelectItem>
            ) : teams.length === 0 ? (
              <MemoizedSelectItem
                value="empty"
                disabled
                className="relative flex items-center h-9 rounded-sm pl-8 pr-2 text-sm outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
              >
                Nenhum time encontrado
              </MemoizedSelectItem>
            ) : (
              teams.map((team) => (
                <MemoizedSelectItem
                  key={team.id}
                  value={team.id.toString()}
                >
                  {team.name}
                </MemoizedSelectItem>
              ))
            )}
          </SelectPrimitive.Viewport>
          
          <SelectPrimitive.ScrollDownButton className="flex items-center justify-center h-[25px] bg-popover text-muted-foreground cursor-default">
            <ChevronDownIcon className="h-4 w-4" />
          </SelectPrimitive.ScrollDownButton>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}

// Exportar versão memoizada do componente com verificação de igualdade personalizada
export const MemoizedTeamSelector = withMemo(TeamSelectorBase, {
  name: 'TeamSelector',
  // Comparar manualmente apenas as props que realmente importam para renderização
  areEqual: (prevProps, nextProps) => {
    return (
      prevProps.value === nextProps.value &&
      prevProps.disabled === nextProps.disabled &&
      prevProps.placeholder === nextProps.placeholder &&
      prevProps.required === nextProps.required &&
      prevProps.className === nextProps.className &&
      // Para onChange, verificamos apenas se a referência mudou, mas não o conteúdo
      // já que é difícil comparar funções
      prevProps.onChange === nextProps.onChange
    );
  }
});

export default MemoizedTeamSelector; 