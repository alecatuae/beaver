import React, { memo, useRef, useEffect } from 'react';
import { isEqual } from 'lodash';

/**
 * Opções para o HOC de memoização
 */
export interface MemoOptions {
  /**
   * Nome do componente para identificação de debug
   */
  name?: string;

  /**
   * Se deve usar comparação profunda (deep equality check)
   */
  deepEqual?: boolean;

  /**
   * Opção para registrar renderizações no console (apenas em desenvolvimento)
   */
  debug?: boolean;

  /**
   * Modo de depuração avançado que registra quais props causaram a renderização
   */
  traceUpdates?: boolean;

  /**
   * Props que devem ser ignoradas na comparação para memoização
   */
  ignoreProps?: string[];

  /**
   * Função de comparação personalizada
   */
  areEqual?: (prevProps: any, nextProps: any) => boolean;
}

/**
 * HOC para memoizar componentes complexos
 * 
 * @param Component Componente a ser memoizado
 * @param options Opções para memoização
 * @returns Componente memoizado
 */
export function withMemo<T extends React.ComponentType<any>>(
  Component: T,
  options: MemoOptions = {}
): T {
  const {
    name = Component.displayName || Component.name || 'Component',
    deepEqual = false,
    debug = false,
    traceUpdates = false,
    ignoreProps = [],
    areEqual
  } = options;

  // Função de comparação personalizada ou padrão
  const compareProps = areEqual || (deepEqual 
    ? (prevProps: any, nextProps: any) => {
        // Filtrar propriedades ignoradas
        const prevFiltered = { ...prevProps };
        const nextFiltered = { ...nextProps };
        
        ignoreProps.forEach(prop => {
          delete prevFiltered[prop];
          delete nextFiltered[prop];
        });
        
        return isEqual(prevFiltered, nextFiltered);
      }
    : undefined);

  // Criar componente memoizado com wrapper para debug
  const MemoizedComponent = memo(
    ({ ...props }) => {
      const renderCount = useRef(0);
      
      useEffect(() => {
        renderCount.current += 1;
        
        if (debug) {
          console.log(`[Memo] ${name} renderizou ${renderCount.current} vezes`, props);
        }
      });
      
      return <Component {...props} />;
    },
    compareProps
  ) as unknown as T;

  // Configurar nome para DevTools
  MemoizedComponent.displayName = `Memo(${name})`;

  if (traceUpdates && process.env.NODE_ENV === 'development') {
    // Adicionar log de rastreamento de atualizações para props que causaram renderização
    return ((props: any) => {
      const prevPropsRef = useRef<any>(null);
      
      useEffect(() => {
        if (prevPropsRef.current) {
          const changedProps: Record<string, { prev: any, next: any }> = {};
          let hasChanges = false;
          
          // Verificar quais props mudaram
          Object.keys(props).forEach(key => {
            if (ignoreProps.includes(key)) return;
            
            if (!isEqual(prevPropsRef.current[key], props[key])) {
              changedProps[key] = {
                prev: prevPropsRef.current[key],
                next: props[key]
              };
              hasChanges = true;
            }
          });
          
          // Verificar props que foram removidas
          Object.keys(prevPropsRef.current).forEach(key => {
            if (ignoreProps.includes(key)) return;
            
            if (props[key] === undefined) {
              changedProps[key] = {
                prev: prevPropsRef.current[key],
                next: undefined
              };
              hasChanges = true;
            }
          });
          
          if (hasChanges) {
            console.log(`[Memo] ${name} atualizou devido a alterações em:`, changedProps);
          }
        }
        
        prevPropsRef.current = { ...props };
      });
      
      return <MemoizedComponent {...props} />;
    }) as unknown as T;
  }

  return MemoizedComponent;
}

/**
 * Decorator para usar com classes de componentes
 * Exemplo: @memoized({ deepEqual: true })
 */
export function memoized(options: MemoOptions = {}) {
  return function<T extends React.ComponentType<any>>(Component: T) {
    return withMemo(Component, options);
  };
}

/**
 * Decorator para definir quais props devem causar renderização
 * Exemplo: @memoizeOn(['value', 'onChange'])
 */
export function memoizeOn(propNames: string[]) {
  return function<T extends React.ComponentType<any>>(Component: T) {
    const allPropNames = new Set<string>();
    
    // Determinar todos os nomes de props possíveis analisando o componente ou propTypes
    const areEqual = (prevProps: any, nextProps: any) => {
      // Combinar todas as chaves tanto de prev quanto de next props
      Object.keys(prevProps).forEach(key => allPropNames.add(key));
      Object.keys(nextProps).forEach(key => allPropNames.add(key));
      
      // Verificar apenas props especificadas para mudanças
      return propNames.every(prop => isEqual(prevProps[prop], nextProps[prop]));
    };
    
    return withMemo(Component, { areEqual });
  };
}

export default withMemo; 