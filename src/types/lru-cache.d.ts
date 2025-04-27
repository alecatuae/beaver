declare module 'lru-cache' {
  class LRUCache<K, V> {
    constructor(options?: any);
    set(key: K, value: V, maxAge?: number): boolean;
    get(key: K): V | undefined;
    has(key: K): boolean;
    delete(key: K): boolean;
    clear(): void;
    forEach(callbackFn: (value: V, key: K, cache: this) => void, thisArg?: any): void;
    keys(): IterableIterator<K>;
    values(): IterableIterator<V>;
    entries(): IterableIterator<[K, V]>;
    remap(callbackFn: (value: V, key: K, cache: this) => [K, V], thisArg?: any): void;
    [Symbol.iterator](): IterableIterator<[K, V]>;
    readonly size: number;
  }
  export = LRUCache;
} 