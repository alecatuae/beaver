# Guia de Uso para Desenvolvedores - Beaver v2.0

Este guia apresenta instruções práticas sobre como utilizar os novos componentes, hooks e padrões introduzidos na versão 2.0 do Beaver. Siga estas orientações para garantir consistência e aproveitar ao máximo as novas funcionalidades de otimização.

## Sumário

1. [Otimização de Renderização](#otimização-de-renderização)
2. [Consultas GraphQL Otimizadas](#consultas-graphql-otimizadas)
3. [Estratégias de Cache](#estratégias-de-cache)
4. [Feedback Visual para Operações](#feedback-visual-para-operações)
5. [Componentes de Seleção](#componentes-de-seleção)
6. [Visualização de Grafos](#visualização-de-grafos)
7. [Tratamento de Erros](#tratamento-de-erros)
8. [Padrões de Código Recomendados](#padrões-de-código-recomendados)

## Otimização de Renderização

### Memoização de Componentes

Para evitar renderizações desnecessárias, utilize o HOC `withMemo` para componentes que:
- Recebem props complexas (objetos, arrays)
- Renderizam muitos elementos
- São renderizados frequentemente em listas

```tsx
// Exemplo: Componente de card memoizado
import { withMemo } from '@/lib/memo-hoc';

const ComponentCard = ({ component, onSelect }) => {
  // Renderização do card
  return (
    <div className="card">
      <h3>{component.name}</h3>
      <p>{component.description}</p>
      <button onClick={() => onSelect(component.id)}>Selecionar</button>
    </div>
  );
};

// Exportar versão memoizada
export default withMemo(ComponentCard, {
  name: 'ComponentCard',  // Nome para debug
  deepEqual: true,        // Comparação profunda de props
});
```

### Hooks de Memoização em Componentes Funcionais

Utilize os hooks de memoização para cálculos custosos ou formatação de dados:

```tsx
import { useMemoDeep } from '@/lib/hooks/use-memoization';

function InstancesList({ instances, environments }) {
  // Agrupar instâncias por ambiente com memoização profunda
  const instancesByEnvironment = useMemoDeep(() => {
    return instances.reduce((acc, instance) => {
      const envId = instance.environmentId;
      if (!acc[envId]) acc[envId] = [];
      acc[envId].push(instance);
      return acc;
    }, {});
  }, [instances]);
  
  // Renderizar agrupados por ambiente
  return (
    <div className="instances-list">
      {Object.entries(instancesByEnvironment).map(([envId, envInstances]) => (
        <div key={envId} className="env-group">
          <h4>{environments.find(env => env.id === Number(envId))?.name}</h4>
          <ul>
            {envInstances.map(instance => (
              <li key={instance.id}>{instance.hostname}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
```

### Debounce para Eventos Frequentes

Utilize hooks de debounce para lidar com eventos de alta frequência, como digitação:

```tsx
import { useDebounce } from '@/lib/hooks/use-memoization';

function ComponentSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Criar função de busca com debounce
  const debouncedSearch = useDebounce((term) => {
    // Esta função só será chamada 300ms após a última mudança
    performSearch(term);
  }, 300);
  
  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    debouncedSearch(value);
  };
  
  return (
    <input 
      type="text" 
      value={searchTerm} 
      onChange={handleInputChange} 
      placeholder="Buscar componentes..."
    />
  );
}
```

## Consultas GraphQL Otimizadas

### Fragmentos Modulares

Defina fragmentos reutilizáveis para otimizar o carregamento de dados:

```tsx
// src/graphql/fragments.ts
import { gql } from '@apollo/client';

export const COMPONENT_CORE_FIELDS = gql`
  fragment ComponentCoreFields on Component {
    id
    name
    status
    createdAt
  }
`;

export const COMPONENT_TEAM_FIELDS = gql`
  fragment ComponentTeamFields on Component {
    team {
      id
      name
    }
  }
`;

export const COMPONENT_INSTANCES_FIELDS = gql`
  fragment ComponentInstancesFields on Component {
    instances {
      id
      hostname
      environment {
        id
        name
      }
      specs
    }
  }
`;
```

### Consultas com Diretivas Condicionais

Use as diretivas `@include` e `@skip` para controlar quais campos são solicitados:

```tsx
// src/graphql/componentQueries.ts
import { gql } from '@apollo/client';
import { 
  COMPONENT_CORE_FIELDS, 
  COMPONENT_TEAM_FIELDS, 
  COMPONENT_INSTANCES_FIELDS 
} from './fragments';

export const GET_COMPONENT = gql`
  query GetComponent(
    $id: ID!, 
    $includeTeam: Boolean = false, 
    $includeInstances: Boolean = false
  ) {
    component(id: $id) {
      ...ComponentCoreFields
      description
      ...ComponentTeamFields @include(if: $includeTeam)
      ...ComponentInstancesFields @include(if: $includeInstances)
    }
  }
  ${COMPONENT_CORE_FIELDS}
  ${COMPONENT_TEAM_FIELDS}
  ${COMPONENT_INSTANCES_FIELDS}
`;
```

### Hooks Otimizados para Listas e Detalhes

Utilize os hooks específicos para diferentes contextos:

```tsx
// Listagem (carrega apenas dados essenciais)
import { useListQuery } from '@/lib/hooks/use-optimized-query';
import { GET_COMPONENTS } from '@/graphql/componentQueries';

function ComponentsList() {
  const { data, loading } = useListQuery(GET_COMPONENTS, {
    variables: { status: 'active' }
  });
  
  // Renderização da lista com dados mínimos
  if (loading) return <LoadingSpinner />;
  
  return (
    <ul>
      {data?.components.map(comp => (
        <li key={comp.id}>{comp.name}</li>
      ))}
    </ul>
  );
}

// Detalhes (carrega dados completos)
import { useDetailQuery } from '@/lib/hooks/use-optimized-query';
import { GET_COMPONENT } from '@/graphql/componentQueries';

function ComponentDetail({ id }) {
  const { data, loading } = useDetailQuery(GET_COMPONENT, {
    variables: { id }
  });
  
  // Renderização dos detalhes completos
  if (loading) return <LoadingSpinner />;
  
  const component = data?.component;
  if (!component) return <NotFound />;
  
  return (
    <div>
      <h2>{component.name}</h2>
      <p>{component.description}</p>
      {/* Exibe todos os detalhes, incluindo instâncias e time */}
    </div>
  );
}
```

## Estratégias de Cache

### Cache para Consultas Frequentes

Use o hook `useCachedQuery` para otimizar consultas repetidas:

```tsx
import { useCachedQuery } from '@/lib/hooks/use-cache-strategies';
import { GET_COMPONENT } from '@/graphql/componentQueries';

function ComponentPanel({ id }) {
  const { 
    data, 
    loading, 
    clearCache, 
    updateCache 
  } = useCachedQuery(
    GET_COMPONENT,
    { id },
    { notifyOnNetworkStatusChange: true },
    { 
      staleTime: 5,  // Considerar fresco por 5 minutos
      prefetch: true, // Pré-carregar quando o componente montar
      invalidateOn: ['ADR']  // Invalidar quando ADRs mudam
    }
  );
  
  // Função para forçar atualização
  const handleRefresh = () => {
    clearCache();  // Limpar cache local
  };
  
  // Atualizar parte do cache manualmente
  const updateStatus = (newStatus) => {
    updateCache((cache, cachedData) => {
      if (cachedData) {
        cache.writeFragment({
          id: `Component:${id}`,
          fragment: gql`
            fragment ComponentStatus on Component {
              status
            }
          `,
          data: { status: newStatus }
        });
      }
    });
  };
  
  // Renderização
  // ...
}
```

### Pré-carregamento Inteligente

Pré-carregue dados que serão necessários em breve:

```tsx
import { usePrefetchQueries } from '@/lib/hooks/use-cache-strategies';
import { GET_COMPONENT, GET_COMPONENT_ADRS } from '@/graphql/queries';

function ComponentListItem({ component, onSelect }) {
  const { prefetch } = usePrefetchQueries([
    { 
      query: GET_COMPONENT, 
      variables: { id: component.id, includeInstances: true } 
    },
    { 
      query: GET_COMPONENT_ADRS, 
      variables: { componentId: component.id } 
    }
  ]);
  
  return (
    <div 
      className="component-item"
      onMouseEnter={prefetch}  // Pré-carregar ao passar o mouse
      onClick={() => onSelect(component.id)}
    >
      <h3>{component.name}</h3>
      <Badge status={component.status} />
    </div>
  );
}
```

## Feedback Visual para Operações

### Gerenciamento de Operações com Loading

Utilize o hook `useLoadingOperation` para operações de longa duração:

```tsx
import { useLoadingOperation } from '@/lib/hooks/use-loading-operation';
import { updateComponent } from '@/api/components';

function ComponentForm({ component, onSaved }) {
  const [formData, setFormData] = useState({
    name: component?.name || '',
    description: component?.description || '',
    status: component?.status || 'active'
  });
  
  const { 
    loading, 
    error, 
    execute, 
    progressPercentage 
  } = useLoadingOperation({
    name: 'Atualização de componente',
    type: 'mutation',
    estimatedTime: 1500,  // 1.5 segundos estimados
    showSuccessToast: true,
    successMessage: 'Componente atualizado com sucesso!',
    showErrorToast: true
  });
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Execute lida com loading, toasts e tratamento de erros
    const result = await execute(
      updateComponent(component.id, formData)
    );
    
    if (result) {
      onSaved(result);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Campos do formulário */}
      
      {/* Mostrar progresso se estiver carregando */}
      {loading && (
        <ProgressBar 
          value={progressPercentage} 
          variant="primary"
          animation="pulse"
          showLabel
        />
      )}
      
      <Button 
        type="submit" 
        disabled={loading}
      >
        {loading ? 'Salvando...' : 'Salvar'}
      </Button>
    </form>
  );
}
```

### Componentes de Loading Reutilizáveis

Use componentes de feedback visual para diferentes cenários:

```tsx
// Spinner simples para indicadores pequenos
<Spinner size="sm" variant="primary" />

// Container com overlay de loading
<LoadingContainer 
  loading={isLoading} 
  message="Carregando componentes..." 
>
  <ComponentList data={components} />
</LoadingContainer>

// Progress circular para indicadores compactos
<CircularProgress 
  value={uploadProgress} 
  size={48} 
  showLabel 
/>
```

## Componentes de Seleção

### Seletor de Ambientes

Para selecionar ambientes, use o componente `EnvironmentSelector`:

```tsx
import { EnvironmentSelector } from '@/components/selectors/EnvironmentSelector';

function ComponentInstanceForm() {
  const [environmentId, setEnvironmentId] = useState('');
  
  return (
    <div className="form-group">
      <label>Ambiente</label>
      <EnvironmentSelector
        value={environmentId}
        onChange={setEnvironmentId}
        placeholder="Selecione o ambiente"
        onlyActive={true}  // Mostrar apenas ambientes ativos
        required
      />
    </div>
  );
}
```

### Seletor de Times

Para selecionar times, use o componente `TeamSelector`:

```tsx
import { TeamSelector } from '@/components/selectors/TeamSelector';

function ComponentForm() {
  const [teamId, setTeamId] = useState('');
  
  return (
    <div className="form-group">
      <label>Time Responsável</label>
      <TeamSelector
        value={teamId}
        onChange={setTeamId}
        placeholder="Selecione o time responsável"
        className="w-full"
      />
    </div>
  );
}
```

## Visualização de Grafos

### Configuração Básica

Para visualizar um grafo de componentes, use o `MemoizedCytoscapeGraph`:

```tsx
import { MemoizedCytoscapeGraph } from '@/components/graph/MemoizedCytoscapeGraph';

function ArchitectureGraph({ nodes, edges }) {
  const [selectedNode, setSelectedNode] = useState(null);
  
  const handleNodeClick = (node) => {
    setSelectedNode(node);
    // Abrir painel de detalhes ou navegar para página de detalhes
  };
  
  return (
    <div className="graph-container">
      <MemoizedCytoscapeGraph
        nodes={nodes}
        edges={edges}
        height="600px"
        width="100%"
        onNodeClick={handleNodeClick}
        showInstances={false}  // Inicialmente ocultar instâncias
      />
    </div>
  );
}
```

### Visualizando Instâncias

Para mostrar instâncias no grafo:

```tsx
function ArchitectureGraphWithInstances({ nodes, edges, environments }) {
  const [showInstances, setShowInstances] = useState(false);
  const [selectedEnvironment, setSelectedEnvironment] = useState(null);
  const [highlightedComponent, setHighlightedComponent] = useState(null);
  
  return (
    <div className="graph-container">
      <div className="graph-controls">
        <Switch 
          checked={showInstances}
          onChange={setShowInstances}
          label="Mostrar instâncias"
        />
        
        {showInstances && (
          <EnvironmentSelector
            value={selectedEnvironment}
            onChange={setSelectedEnvironment}
            placeholder="Filtrar por ambiente"
          />
        )}
      </div>
      
      <MemoizedCytoscapeGraph
        nodes={nodes}
        edges={edges}
        height="600px"
        width="100%"
        showInstances={showInstances}
        selectedEnvironmentId={selectedEnvironment}
        highlightInstancesOfComponent={highlightedComponent}
      />
    </div>
  );
}
```

## Tratamento de Erros

### Sistema Padronizado de Erros

Utilize o sistema padronizado de mensagens de erro para feedback consistente:

```tsx
import { useError } from '@/lib/contexts/error-context';
import { CommonErrors, createCustomError } from '@/lib/error-codes';

function ComponentForm() {
  const { handleError } = useError();
  
  const handleSubmit = async (data) => {
    try {
      // Tentativa de salvar
      await saveComponent(data);
    } catch (error) {
      // Tratamento padronizado de erro
      handleError(error, {
        title: 'Erro ao salvar componente',
        fallbackMessage: 'Não foi possível salvar o componente. Tente novamente mais tarde.'
      });
    }
  };
  
  // Validação com erro estruturado
  const validateForm = (data) => {
    if (!data.name) {
      const error = createCustomError(
        CommonErrors.VALIDATION_FAILED,
        {
          description: 'O nome do componente é obrigatório.',
          solution: 'Informe um nome válido para o componente.'
        }
      );
      
      handleError(error);
      return false;
    }
    
    return true;
  };
  
  // Resto do componente
}
```

## Padrões de Código Recomendados

### Organização de Componentes e Hooks

Recomendamos a seguinte estrutura para organizar componentes complexos:

```tsx
// Componente principal
function ComplexComponent(props) {
  // 1. Definir estados locais
  const [state, setState] = useState(initialState);
  
  // 2. Hooks personalizados para lógica específica
  const { data, loading } = useCustomDataFetching();
  
  // 3. Callbacks memoizados
  const handleAction = useCallbackDeep(() => {
    // Implementação
  }, [/* dependências */]);
  
  // 4. Valores memoizados derivados de props ou estado
  const derivedData = useMemoDeep(() => {
    return computeExpensiveValue(data);
  }, [data]);
  
  // 5. Efeitos secundários
  useEffect(() => {
    // Implementação
  }, [/* dependências */]);
  
  // 6. Renderização condicional
  if (loading) return <LoadingComponent />;
  if (!data) return <EmptyState />;
  
  // 7. Renderização principal
  return (
    <div>
      {/* JSX */}
    </div>
  );
}

// Exportar componente memoizado
export default withMemo(ComplexComponent, {
  name: 'ComplexComponent',
  deepEqual: true
});
```

### Padrão de Composição para Formulários

Para formulários complexos, use o padrão de composição:

```tsx
// Componentes de formulário especializados
function BaseForm({ children, onSubmit, loading }) {
  return (
    <form onSubmit={onSubmit}>
      {children}
      
      <div className="form-actions">
        <Button type="submit" disabled={loading}>
          {loading ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>
    </form>
  );
}

// Formulário específico
function ComponentInstanceForm({ onSubmit, initialData }) {
  const { loading, execute } = useLoadingOperation();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    // Lógica de submissão
    const formData = getFormValues();
    await execute(() => onSubmit(formData));
  };
  
  return (
    <BaseForm onSubmit={handleSubmit} loading={loading}>
      <div className="form-fields">
        {/* Campos específicos */}
        <FormField label="Hostname">
          <Input name="hostname" defaultValue={initialData?.hostname} />
        </FormField>
        
        <FormField label="Ambiente">
          <EnvironmentSelector 
            value={selectedEnv} 
            onChange={setSelectedEnv} 
          />
        </FormField>
      </div>
    </BaseForm>
  );
}
```

### Abstrações para Consultas

Crie hooks personalizados para consultas comuns:

```tsx
// hooks/useComponents.js
function useComponents(filters = {}) {
  const { status, teamId, environmentId } = filters;
  
  return useListQuery(GET_COMPONENTS, {
    variables: {
      status,
      teamId,
      environmentId
    }
  });
}

// hooks/useComponentDetails.js
function useComponentDetails(id, options = {}) {
  const { includeInstances = true, includeTeam = true } = options;
  
  return useDetailQuery(GET_COMPONENT, {
    variables: {
      id,
      includeInstances,
      includeTeam
    }
  });
}

// Uso
function ComponentPage({ id }) {
  const { data, loading } = useComponentDetails(id);
  // Renderização
}
```

Este guia cobre os principais aspectos de uso das novas APIs de componentes do Beaver v2.0. Consulte a documentação específica de cada API para detalhes adicionais ou casos de uso mais avançados. 