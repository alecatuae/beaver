import React from 'react';
import { useQuery } from '@apollo/client';
import { GET_ENVIRONMENTS } from '../../lib/graphql';
import * as SelectPrimitive from '@radix-ui/react-select';
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

interface EnvironmentSelectorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  required?: boolean;
}

export const EnvironmentSelector: React.FC<EnvironmentSelectorProps> = ({
  value,
  onChange,
  disabled = false,
  placeholder = "Selecione um ambiente",
  className,
  required = false,
}) => {
  const { data, loading, error } = useQuery(GET_ENVIRONMENTS, {
    fetchPolicy: 'cache-first', // Usa cache para melhorar performance
  });

  const environments = data?.environments || [];
  const isDisabled = disabled || loading || !!error || environments.length === 0;

  return (
    <SelectPrimitive.Root
      value={value}
      onValueChange={onChange}
      disabled={isDisabled}
    >
      <SelectPrimitive.Trigger
        className={cn(
          "flex h-10 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 w-full",
          className
        )}
        aria-required={required}
      >
        <SelectPrimitive.Value placeholder={placeholder} />
        <SelectPrimitive.Icon asChild>
          <ChevronDownIcon className="h-4 w-4 opacity-50" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      
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
              <SelectPrimitive.Item
                value="loading"
                disabled
                className="relative flex items-center h-9 rounded-sm pl-8 pr-2 text-sm outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
              >
                <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                  <span className="h-2 w-2 rounded-full bg-gray-300 animate-pulse"></span>
                </span>
                <SelectPrimitive.ItemText>Carregando...</SelectPrimitive.ItemText>
              </SelectPrimitive.Item>
            ) : error ? (
              <SelectPrimitive.Item
                value="error"
                disabled
                className="relative flex items-center h-9 rounded-sm pl-8 pr-2 text-sm outline-none text-red-500"
              >
                <SelectPrimitive.ItemText>Erro ao carregar ambientes</SelectPrimitive.ItemText>
              </SelectPrimitive.Item>
            ) : environments.length === 0 ? (
              <SelectPrimitive.Item
                value="empty"
                disabled
                className="relative flex items-center h-9 rounded-sm pl-8 pr-2 text-sm outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
              >
                <SelectPrimitive.ItemText>Nenhum ambiente encontrado</SelectPrimitive.ItemText>
              </SelectPrimitive.Item>
            ) : (
              environments.map((env) => (
                <SelectPrimitive.Item
                  key={env.id}
                  value={env.id.toString()}
                  className="relative flex items-center h-9 rounded-sm pl-8 pr-2 text-sm outline-none cursor-pointer hover:bg-accent hover:text-accent-foreground data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                >
                  <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                    <SelectPrimitive.ItemIndicator>
                      <CheckIcon className="h-4 w-4" />
                    </SelectPrimitive.ItemIndicator>
                  </span>
                  <SelectPrimitive.ItemText>{env.name}</SelectPrimitive.ItemText>
                </SelectPrimitive.Item>
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
};

export default EnvironmentSelector; 