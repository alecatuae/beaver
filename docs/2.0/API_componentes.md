# API de Componentes - Beaver v2.0

Este documento detalha as APIs dos novos componentes e hooks introduzidos na versão 2.0 do Beaver. Estas APIs facilitam a implementação de componentes otimizados, consultas eficientes e feedback visual responsivo.

## Sumário

1. [Hooks de Memoização](#hooks-de-memoização)
2. [HOC de Memoização](#hoc-de-memoização)
3. [Hooks de Otimização de Consultas GraphQL](#hooks-de-otimização-de-consultas-graphql)
4. [Estratégias de Cache](#estratégias-de-cache)
5. [Componentes de Feedback Visual](#componentes-de-feedback-visual)
6. [Hooks de Operações de Carregamento](#hooks-de-operações-de-carregamento)
7. [API do Componente Cytoscape](#api-do-componente-cytoscape)
8. [Componentes Seletores](#componentes-seletores)

## Hooks de Memoização

Os hooks de memoização otimizam o desempenho de renderização evitando cálculos repetidos e renderizações desnecessárias.

### `useMemoDeep`

Hook para memoização com comparação profunda de dependências.

```typescript
function useMemoDeep<T>(factory: () => T, dependencies: any[]): T
```

**Parâmetros:**
- `factory`: Função que produz o valor memoizado
- `dependencies`: Array de dependências para comparação profunda

**Retorno:**
- Valor memoizado que só é recalculado quando as dependências mudam profundamente

**Exemplo:**
```tsx
const memoizedValue = useMemoDeep(() => {
  return computeExpensiveValue(a, b);
}, [complexObjectA, complexObjectB]);
```

### `useCallbackDeep`

Hook para memoização de callbacks com comparação profunda de dependências.

```typescript
function useCallbackDeep<T extends (...args: any[]) => any>(
  callback: T,
  dependencies: any[]
): T
```

**Parâmetros:**
- `callback`: Função de callback a ser memoizada
- `dependencies`: Array de dependências para comparação profunda

**Retorno:**
- Função de callback memoizada que só é recriada quando as dependências mudam profundamente

**Exemplo:**
```tsx
const handleSubmit = useCallbackDeep((values) => {
  api.submit(values, complexConfig);
}, [complexConfig]);
```

### `useDebounce`

Hook para criar uma versão debounced de uma função.

```typescript
function useDebounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number,
  dependencies: any[] = []
): T
```

**Parâmetros:**
- `fn`: Função a ser executada com debounce
- `delay`: Tempo em milissegundos para o debounce
- `dependencies`: Array de dependências adicionais (opcional)

**Retorno:**
- Função com debounce que só executa após o período de delay

**Exemplo:**
```tsx
const debouncedSearch = useDebounce((query) => {
  searchApi(query);
}, 300);
```

### `useThrottle`

Hook para criar uma versão throttled de uma função.

```typescript
function useThrottle<T extends (...args: any[]) => any>(
  fn: T,
  limit: number,
  dependencies: any[] = []
): T
```

**Parâmetros:**
- `fn`: Função a ser executada com throttle
- `limit`: Tempo mínimo em milissegundos entre execuções
- `dependencies`: Array de dependências adicionais (opcional)

**Retorno:**
- Função com throttle que executa no máximo uma vez dentro do período limite

**Exemplo:**
```tsx
const throttledScroll = useThrottle((event) => {
  updateScrollPosition(event);
}, 100);
```

### `useDebouncedValue`

Hook para debouncing de valores.

```typescript
function useDebouncedValue<T>(value: T, delay: number): T
```

**Parâmetros:**
- `value`: Valor a ser debounced
- `delay`: Tempo em milissegundos para o debounce

**Retorno:**
- Valor debounced que só muda após o período de delay

**Exemplo:**
```tsx
const debouncedSearchTerm = useDebouncedValue(searchTerm, 300);

// Usar debouncedSearchTerm para consultas
useEffect(() => {
  if (debouncedSearchTerm) {
    performSearch(debouncedSearchTerm);
  }
}, [debouncedSearchTerm]);
```

### `useMemoCache`

Hook para memoização com cache LRU (Least Recently Used).

```typescript
function useMemoCache<T>(
  factory: (...args: any[]) => T,
  size: number = 10
): (...args: any[]) => T
```

**Parâmetros:**
- `factory`: Função de fábrica para gerar valores
- `size`: Tamanho máximo do cache (padrão: 10)

**Retorno:**
- Função memoizada que armazena resultados em cache LRU

**Exemplo:**
```tsx
const getExpensiveCalculation = useMemoCache((x, y) => {
  return complexCalculation(x, y);
}, 20);

// Uso
const result1 = getExpensiveCalculation(5, 10); // Calcula e armazena
const result2 = getExpensiveCalculation(5, 10); // Recupera do cache
```

### `useMemoWithExpiration`

Hook para memoização com tempo de expiração.

```typescript
function useMemoWithExpiration<T>(
  factory: () => T,
  dependencies: any[],
  expirationMs: number
): T
```

**Parâmetros:**
- `factory`: Função que produz o valor memoizado
- `dependencies`: Array de dependências
- `expirationMs`: Tempo em milissegundos até a expiração

**Retorno:**
- Valor memoizado que expira após o tempo especificado

**Exemplo:**
```tsx
const cachedData = useMemoWithExpiration(() => {
  return fetchData();
}, [userId], 60000); // Expira após 1 minuto
```

## HOC de Memoização

### `withMemo`

HOC (Higher-Order Component) para memoizar componentes React com opções avançadas.

```typescript
function withMemo<T extends React.ComponentType<any>>(
  Component: T,
  options: MemoOptions = {}
): T
```

**Parâmetros:**
- `Component`: Componente React a ser memoizado
- `options`: Opções de configuração para memoização

**Opções:**
- `name`: Nome para identificação de debug
- `deepEqual`: Se deve usar comparação profunda
- `debug`: Se deve registrar renderizações no console
- `traceUpdates`: Se deve rastrear quais props causaram renderização
- `ignoreProps`: Props a serem ignoradas na comparação
- `areEqual`: Função de comparação personalizada

**Retorno:**
- Componente memoizado com as configurações especificadas

**Exemplo:**
```tsx
const MemoizedComponent = withMemo(ExpensiveComponent, {
  name: 'OptimizedExpensiveComponent',
  deepEqual: true,
  debug: process.env.NODE_ENV === 'development',
  ignoreProps: ['onChange']
});
```

### `memoized` (Decorator)

Decorator para memoizar classes de componentes React.

```typescript
function memoized(options: MemoOptions = {})
```

**Parâmetros:**
- `options`: Mesmas opções do `withMemo`

**Exemplo:**
```tsx
@memoized({ deepEqual: true })
class ComplexDataGrid extends React.Component {
  // Implementação
}
```

### `memoizeOn` (Decorator)

Decorator para memoizar componentes com base em props específicas.

```typescript
function memoizeOn(propNames: string[])
```

**Parâmetros:**
- `propNames`: Array com nomes de props a serem observadas para renderização

**Exemplo:**
```tsx
@memoizeOn(['data', 'columns'])
class DataTable extends React.Component {
  // Implementação
}
```

## Hooks de Otimização de Consultas GraphQL

Hooks para otimizar consultas GraphQL e reduzir o over-fetching.

### `useOptimizedQuery`

Hook para consultas GraphQL com suporte a diretivas @include e @skip.

```typescript
function useOptimizedQuery<TData = any, TVariables = OperationVariablesMissing>(
  query: DocumentNode,
  optimizeOptions: OptimizedQueryOptions = {},
  options?: QueryHookOptions<TData, TVariables>
)
```

**Parâmetros:**
- `query`: Documento GraphQL com a consulta
- `optimizeOptions`: Configurações para campos a incluir/excluir
- `options`: Opções padrão do Apollo useQuery

**Opções de Otimização:**
- `include`: Registro de campos a incluir condicionalmente
- `skip`: Registro de campos a pular condicionalmente

**Retorno:**
- Resultado da consulta Apollo com campos otimizados

**Exemplo:**
```tsx
const { data, loading } = useOptimizedQuery(
  GET_COMPONENT,
  {
    include: {
      includeInstances: true,
      includeTeam: showTeam
    },
    skip: {
      includeFullHistory: true
    }
  },
  { variables: { id } }
);
```

### `useListQuery`

Hook para carregar apenas dados essenciais em listas.

```typescript
function useListQuery<TData = any, TVariables = OperationVariablesMissing>(
  query: DocumentNode,
  options?: QueryHookOptions<TData, TVariables>
)
```

**Parâmetros:**
- `query`: Documento GraphQL com a consulta
- `options`: Opções padrão do Apollo useQuery

**Retorno:**
- Resultado da consulta otimizado para listagens

**Exemplo:**
```tsx
const { data, loading } = useListQuery(
  GET_COMPONENTS,
  { variables: { status: 'active' } }
);
```

### `useDetailQuery`

Hook para carregar dados detalhados de um item específico.

```typescript
function useDetailQuery<TData = any, TVariables = OperationVariablesMissing>(
  query: DocumentNode,
  options?: QueryHookOptions<TData, TVariables>
)
```

**Parâmetros:**
- `query`: Documento GraphQL com a consulta
- `options`: Opções padrão do Apollo useQuery

**Retorno:**
- Resultado da consulta otimizado para detalhes

**Exemplo:**
```tsx
const { data, loading } = useDetailQuery(
  GET_COMPONENT_DETAIL,
  { variables: { id } }
);
```

## Estratégias de Cache

Hooks para estratégias avançadas de cache para consultas GraphQL.

### `useCachedQuery`

Hook para consultas com estratégias de cache avançadas.

```typescript
function useCachedQuery<TData = any, TVariables = OperationVariables>(
  query: DocumentNode,
  variables?: TVariables,
  options?: QueryHookOptions<TData, TVariables>,
  cacheOptions?: CacheOptions
)
```

**Parâmetros:**
- `query`: Documento GraphQL com a consulta
- `variables`: Variáveis da consulta
- `options`: Opções padrão do Apollo useQuery
- `cacheOptions`: Opções de cache personalizadas

**Opções de Cache:**
- `staleTime`: Tempo em minutos para considerar os dados "frescos"
- `prefetch`: Se deve realizar prefetch quando o componente montar
- `invalidateOn`: Tipos de entidades que invalidam este cache

**Retorno:**
- Resultado do useQuery com métodos adicionais de gerenciamento de cache

**Exemplo:**
```tsx
const { data, loading, clearCache, updateCache, refetchOptimized } = useCachedQuery(
  GET_COMPONENT,
  { id },
  { notifyOnNetworkStatusChange: true },
  { staleTime: 5, prefetch: true, invalidateOn: ['ADR', 'RoadmapItem'] }
);
```

### `usePrefetchQueries`

Hook para prefetch de dados que serão necessários em breve.

```typescript
function usePrefetchQueries(
  queries: Array<{
    query: DocumentNode;
    variables?: any;
  }>
)
```

**Parâmetros:**
- `queries`: Lista de consultas a serem pré-carregadas

**Retorno:**
- Objeto com método `prefetch` para iniciar o pré-carregamento

**Exemplo:**
```tsx
const { prefetch } = usePrefetchQueries([
  { query: GET_COMPONENT, variables: { id: '1' } },
  { query: GET_ADRS, variables: { componentId: '1' } }
]);

// Pode ser chamado em um efeito ou evento
useEffect(() => {
  prefetch();
}, []);
```

### `useEntityCache`

Hook para gerenciar o cache de uma entidade específica.

```typescript
function useEntityCache<T = any>(
  typeName: string,
  id: string | number
)
```

**Parâmetros:**
- `typeName`: Nome do tipo da entidade (Component, ADR, etc.)
- `id`: ID da entidade

**Retorno:**
- Objeto com métodos para manipular o cache da entidade

**Exemplo:**
```tsx
const { readFromCache, writeToCache, evictFromCache } = useEntityCache(
  'Component',
  '123'
);

// Ler dados atuais do cache
const cachedComponent = readFromCache();

// Atualizar parcialmente no cache
writeToCache({ status: 'deprecated' });

// Remover do cache
evictFromCache();
```

## Componentes de Feedback Visual

Componentes para fornecer feedback visual durante operações.

### Spinner

Componente de spinner para indicar carregamento.

```tsx
<Spinner 
  size="md" 
  variant="primary" 
  className="my-2" 
/>
```

**Props:**
- `size`: Tamanho do spinner ('sm', 'md', 'lg', 'xl')
- `variant`: Variante visual ('primary', 'secondary', 'ghost')
- `className`: Classes CSS adicionais

### ProgressBar

Barra de progresso para operações com progresso mensurável.

```tsx
<ProgressBar 
  value={75} 
  max={100} 
  showLabel 
  animation="pulse" 
/>
```

**Props:**
- `value`: Valor atual do progresso
- `max`: Valor máximo (padrão: 100)
- `showLabel`: Se deve mostrar o percentual
- `animation`: Tipo de animação ('pulse', 'stripe', 'none')
- `className`: Classes CSS adicionais
- `variant`: Variante visual ('primary', 'success', 'warning', 'danger')

### LoadingContainer

Container com overlay de carregamento.

```tsx
<LoadingContainer 
  loading={isLoading} 
  message="Carregando componentes..." 
  spinnerSize="lg"
>
  <ComponentList data={components} />
</LoadingContainer>
```

**Props:**
- `loading`: Estado de carregamento
- `message`: Mensagem opcional de carregamento
- `spinnerSize`: Tamanho do spinner
- `overlay`: Se deve mostrar overlay (padrão: true)
- `children`: Conteúdo do container

### CircularProgress

Indicador de progresso circular.

```tsx
<CircularProgress 
  value={progress} 
  size={48} 
  strokeWidth={4} 
  showLabel 
/>
```

**Props:**
- `value`: Valor atual (0-100)
- `size`: Tamanho em pixels
- `strokeWidth`: Largura do traço
- `showLabel`: Se deve mostrar percentual
- `className`: Classes CSS adicionais

## Hooks de Operações de Carregamento

### `useLoadingOperation`

Hook para gerenciar operações de longa duração com feedback visual.

```typescript
function useLoadingOperation<T = any>(
  defaultOptions?: OperationOptions
): UseLoadingOperationResult<T>
```

**Parâmetros:**
- `defaultOptions`: Opções padrão para todas operações

**Opções de Operação:**
- `id`: ID único da operação
- `name`: Nome amigável da operação
- `type`: Tipo da operação (query, mutation, etc.)
- `estimatedTime`: Tempo estimado em ms
- `showSuccessToast`: Se deve mostrar toast de sucesso
- `successMessage`: Mensagem personalizada de sucesso
- `showErrorToast`: Se deve mostrar toast de erro
- `errorMessage`: Mensagem personalizada de erro
- Callbacks: `onStart`, `onSuccess`, `onError`, `onComplete`

**Retorno:**
- `loading`: Estado de carregamento
- `error`: Erro ocorrido (se houver)
- `result`: Resultado da operação
- `execute`: Função para executar operação com feedback
- `reset`: Função para resetar estado
- `elapsedTime`: Tempo decorrido em ms
- `progressPercentage`: Percentual estimado de conclusão

**Exemplo:**
```tsx
const { 
  loading, 
  error, 
  execute, 
  progressPercentage 
} = useLoadingOperation({
  name: 'Carregamento de componentes',
  type: 'query',
  estimatedTime: 2000,
  showSuccessToast: true
});

// Em um efeito ou handler de evento
const loadData = async () => {
  const result = await execute(
    fetchComponents(filters),
    { successMessage: 'Componentes carregados com sucesso!' }
  );
  
  if (result) {
    setComponents(result);
  }
};
```

## API do Componente Cytoscape

### MemoizedCytoscapeGraph

Componente otimizado para visualização de grafos arquiteturais.

```tsx
<MemoizedCytoscapeGraph
  nodes={nodes}
  edges={edges}
  height="600px"
  width="100%"
  onNodeClick={handleNodeClick}
  onEdgeClick={handleEdgeClick}
  layout={customLayout}
  showInstances={true}
  highlightInstancesOfComponent="comp-123"
  selectedEnvironmentId={2}
/>
```

**Props:**
- `nodes`: Array de nós do grafo
- `edges`: Array de arestas do grafo
- `height`: Altura do componente
- `width`: Largura do componente
- `onNodeClick`: Handler de clique em nós
- `onEdgeClick`: Handler de clique em arestas
- `layout`: Opções de layout do Cytoscape
- `showInstances`: Se deve mostrar instâncias de componentes
- `highlightInstancesOfComponent`: ID do componente para destacar instâncias
- `selectedEnvironmentId`: ID do ambiente selecionado para filtrar

**Tipos de Dados:**

```typescript
interface GraphNode {
  id: string;
  label: string;
  type?: string;
  environmentId?: number;
  componentId?: number;
  parentId?: string;
  data?: Record<string, any>;
}

interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  type?: string;
  data?: Record<string, any>;
}
```

## Componentes Seletores

### TeamSelector

Seletor de times memoizado com carregamento otimizado.

```tsx
<TeamSelector
  value={selectedTeamId}
  onChange={setSelectedTeamId}
  disabled={isLoading}
  placeholder="Selecione um time responsável"
  className="w-full"
  required
/>
```

**Props:**
- `value`: ID do time selecionado
- `onChange`: Função para atualizar a seleção
- `disabled`: Se o seletor está desabilitado
- `placeholder`: Texto de placeholder
- `className`: Classes CSS adicionais
- `required`: Se o campo é obrigatório

### EnvironmentSelector

Seletor de ambientes memoizado.

```tsx
<EnvironmentSelector
  value={selectedEnvironmentId}
  onChange={setSelectedEnvironmentId}
  disabled={isLoading}
  placeholder="Selecione um ambiente"
  className="w-full"
  onlyActive={true}
/>
```

**Props:**
- `value`: ID do ambiente selecionado
- `onChange`: Função para atualizar a seleção
- `disabled`: Se o seletor está desabilitado
- `placeholder`: Texto de placeholder
- `className`: Classes CSS adicionais
- `onlyActive`: Se deve mostrar apenas ambientes ativos 