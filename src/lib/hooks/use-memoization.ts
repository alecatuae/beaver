import { useMemo, useCallback, useState, useEffect, useRef } from 'react';

/**
 * Funções utilitárias para memoização no Beaver v2.0
 * Estas funções ajudam a otimizar renderizações de componentes complexos
 */

/**
 * Comparador profundo para verificar se dois objetos são iguais
 * Usado para o hook useMemoDeep
 */
function isEqual(objA: any, objB: any): boolean {
  if (Object.is(objA, objB)) return true;
  
  if (
    typeof objA !== 'object' || 
    objA === null || 
    typeof objB !== 'object' || 
    objB === null
  ) {
    return false;
  }
  
  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);
  
  if (keysA.length !== keysB.length) return false;
  
  for (const key of keysA) {
    if (!keysB.includes(key)) return false;
    if (!isEqual(objA[key], objB[key])) return false;
  }
  
  return true;
}

/**
 * Hook para memoização com comparação profunda
 * Semelhante ao useMemo, mas com comparação de dependências usando deep equality
 */
export function useMemoDeep<T>(factory: () => T, dependencies: any[]): T {
  const ref = useRef<{ deps: any[]; value: T }>();
  
  if (!ref.current || !dependencies.every((dep, i) => isEqual(dep, ref.current!.deps[i]))) {
    ref.current = {
      deps: dependencies,
      value: factory(),
    };
  }
  
  return ref.current.value;
}

/**
 * Hook para memoização de callback com comparação profunda
 * Semelhante ao useCallback, mas com comparação de dependências usando deep equality
 */
export function useCallbackDeep<T extends (...args: any[]) => any>(
  callback: T,
  dependencies: any[]
): T {
  return useMemoDeep(() => callback, dependencies);
}

/**
 * Hook para debouncing de funções
 * Útil para otimizar chamadas repetitivas como evento de digitação
 */
export function useDebounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number,
  dependencies: any[] = []
): T {
  const callbackRef = useRef<T>(fn);
  
  useEffect(() => {
    callbackRef.current = fn;
  }, [fn, ...dependencies]);
  
  return useCallback(
    ((...args: any[]) => {
      const timeout = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
      
      return () => clearTimeout(timeout);
    }) as T,
    [delay]
  );
}

/**
 * Hook para throttling de funções
 * Útil para limitar operações que podem sobrecarregar o navegador, como scroll e resize
 */
export function useThrottle<T extends (...args: any[]) => any>(
  fn: T,
  limit: number,
  dependencies: any[] = []
): T {
  const callbackRef = useRef<T>(fn);
  const lastRunRef = useRef<number>(0);
  
  useEffect(() => {
    callbackRef.current = fn;
  }, [fn, ...dependencies]);
  
  return useCallback(
    ((...args: any[]) => {
      const now = Date.now();
      if (now - lastRunRef.current >= limit) {
        lastRunRef.current = now;
        return callbackRef.current(...args);
      }
    }) as T,
    [limit]
  );
}

/**
 * Hook para valores debounced
 * Útil para atrasar a atualização de um valor, como em pesquisas
 */
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  
  return debouncedValue;
}

/**
 * Hook para memoização com cache LRU (Least Recently Used)
 * Útil para funções de cálculos pesados com número limitado de entradas
 */
export function useMemoCache<T>(
  factory: (...args: any[]) => T,
  size: number = 10
): (...args: any[]) => T {
  const cacheRef = useRef<Map<string, T>>(new Map());
  const keyOrderRef = useRef<string[]>([]);
  
  return useCallback(
    (...args: any[]) => {
      const key = JSON.stringify(args);
      
      if (cacheRef.current.has(key)) {
        // Atualizar ordem LRU
        keyOrderRef.current = [
          key,
          ...keyOrderRef.current.filter(k => k !== key),
        ];
        return cacheRef.current.get(key)!;
      }
      
      const result = factory(...args);
      
      // Adicionar ao cache
      cacheRef.current.set(key, result);
      keyOrderRef.current.unshift(key);
      
      // Remover item mais antigo se necessário
      if (keyOrderRef.current.length > size) {
        const oldestKey = keyOrderRef.current.pop();
        if (oldestKey) cacheRef.current.delete(oldestKey);
      }
      
      return result;
    },
    [factory, size]
  );
}

/**
 * Hook para memoização com tempo de expiração
 * Útil para dados que devem ser recalculados após um certo tempo
 */
export function useMemoWithExpiration<T>(
  factory: () => T,
  dependencies: any[],
  expirationMs: number
): T {
  const valueRef = useRef<{ value: T; expiration: number } | null>(null);
  const [, forceRender] = useState(0);
  
  const value = useMemo(() => {
    const now = Date.now();
    
    // Se não temos valor ou as dependências mudaram ou expirou
    if (
      !valueRef.current ||
      valueRef.current.expiration < now
    ) {
      valueRef.current = {
        value: factory(),
        expiration: now + expirationMs,
      };
      
      // Configurar timer para forçar rerender quando expirar
      const timeUntilExpire = expirationMs;
      if (timeUntilExpire > 0) {
        setTimeout(() => {
          forceRender(prev => prev + 1);
        }, timeUntilExpire);
      }
    }
    
    return valueRef.current.value;
  }, [...dependencies, expirationMs]);
  
  return value;
} 