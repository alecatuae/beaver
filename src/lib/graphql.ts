import { ApolloClient, InMemoryCache, gql, ApolloLink, HttpLink } from '@apollo/client';

// Dados mockados para quando a API não está disponível
const mockComponents = [
  {
    id: 1,
    name: "Header",
    description: "Componente de cabeçalho principal da aplicação",
    status: "ACTIVE",
    createdAt: "2023-06-15T00:00:00.000Z",
    tags: [{ tag: "UI" }, { tag: "Navigation" }]
  },
  {
    id: 2,
    name: "Footer",
    description: "Rodapé com links e informações de contato",
    status: "ACTIVE",
    createdAt: "2023-06-16T00:00:00.000Z",
    tags: [{ tag: "UI" }]
  },
  {
    id: 3,
    name: "Sidebar",
    description: "Barra lateral para navegação secundária",
    status: "ACTIVE",
    createdAt: "2023-07-01T00:00:00.000Z",
    tags: [{ tag: "UI" }, { tag: "Navigation" }, { tag: "Layout" }]
  },
  {
    id: 4,
    name: "OldButton",
    description: "Implementação antiga de botões",
    status: "DEPRECATED",
    createdAt: "2023-04-10T00:00:00.000Z",
    tags: [{ tag: "UI" }, { tag: "Input" }]
  },
  {
    id: 5,
    name: "Card",
    description: "Componente de card para exibição de informações",
    status: "ACTIVE",
    createdAt: "2023-08-05T00:00:00.000Z",
    tags: [{ tag: "UI" }, { tag: "Display" }]
  },
  {
    id: 6,
    name: "Modal",
    description: "Componente de modal para diálogos",
    status: "INACTIVE",
    createdAt: "2023-05-20T00:00:00.000Z",
    tags: [{ tag: "UI" }, { tag: "Interaction" }]
  }
];

// Implementação simplificada de um observable
class SimpleObservable {
  constructor(private subscriber: (observer: any) => void) {}

  subscribe(observer: any) {
    const subscription = this.subscriber(observer);
    return {
      unsubscribe: subscription || (() => {})
    };
  }
}

// Link personalizado que simula as respostas da API com dados mockados
const mockLink = new ApolloLink((operation, forward) => {
  return new SimpleObservable(observer => {
    // Simular um atraso de rede
    setTimeout(() => {
      const operationName = operation.operationName;
      const variables = operation.variables;

      // Processar operações baseadas no nome
      if (operationName === 'GetComponents') {
        const status = variables?.status;
        let filteredComponents = [...mockComponents];
        
        if (status) {
          filteredComponents = mockComponents.filter(comp => comp.status === status);
        }
        
        // Retornar os componentes mockados
        observer.next({
          data: {
            components: filteredComponents
          }
        });
        observer.complete();
      } 
      else if (operationName === 'CreateComponent') {
        const input = variables.input;
        // Garante que o status seja enviado sem aspas (como enum literal)
        const formattedInput = {
          ...input,
          // Garante que o status seja sempre em maiúsculas
          status: input.status ? input.status.toUpperCase() : 'ACTIVE'
        };
        
        const newComponent = {
          id: mockComponents.length + 1,
          ...formattedInput,
          createdAt: new Date().toISOString(),
          tags: (formattedInput.tags || []).map((tag: string) => ({ tag }))
        };
        
        mockComponents.push(newComponent);
        
        observer.next({
          data: {
            createComponent: newComponent
          }
        });
        observer.complete();
      } 
      else if (operationName === 'UpdateComponent') {
        const { id, input } = variables;
        const index = mockComponents.findIndex(c => c.id === id);
        
        if (index !== -1) {
          const updatedComponent = {
            ...mockComponents[index],
            ...input,
            tags: (input.tags || mockComponents[index].tags.map((t: any) => t.tag)).map((tag: string) => ({ tag }))
          };
          
          mockComponents[index] = updatedComponent;
          
          observer.next({
            data: {
              updateComponent: updatedComponent
            }
          });
        }
        observer.complete();
      } 
      else if (operationName === 'DeleteComponent') {
        const { id } = variables;
        const index = mockComponents.findIndex(c => c.id === id);
        
        if (index !== -1) {
          const deletedComponent = mockComponents[index];
          mockComponents.splice(index, 1);
          
          observer.next({
            data: {
              deleteComponent: {
                id: deletedComponent.id,
                name: deletedComponent.name
              }
            }
          });
        }
        observer.complete();
      } 
      else {
        // Se não tiver implementação para a operação, retornar erro
        observer.error(new Error(`Operação não suportada: ${operationName}`));
      }
    }, 500); // 500ms de atraso para simular rede
    
    // Retornar função para desinscrever (não é necessário no nosso caso)
    return () => {};
  });
});

// HTTP link para a API real (que usaríamos em produção)
const apiUrl = process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || 'http://localhost:4000/graphql';
console.log('Usando endpoint GraphQL:', apiUrl);

const httpLink = new HttpLink({
  uri: apiUrl,
});

// Link com fallback - tenta httpLink primeiro, se falhar usa mockLink
const fallbackLink = ApolloLink.from([
  new ApolloLink((operation, forward) => {
    return new SimpleObservable(observer => {
      // Tentar com httpLink
      let hasResponded = false;
      
      // Definir timeout para caso a API demore muito para responder
      const timeout = setTimeout(() => {
        if (!hasResponded) {
          console.log('Timeout da API, usando dados mockados');
          hasResponded = true;
          mockLink.request(operation)?.subscribe(observer);
        }
      }, 3000); // 3 segundos de timeout
      
      httpLink.request(operation)?.subscribe({
        next: (result) => {
          if (!hasResponded) {
            hasResponded = true;
            clearTimeout(timeout);
            
            // Verificar se o resultado contém dados vazios
            if (result.data && result.data.components && result.data.components.length === 0 && operation.operationName === 'GetComponents') {
              console.log('API retornou array vazio, usando dados mockados');
              mockLink.request(operation)?.subscribe(observer);
            } else {
              observer.next(result);
              observer.complete();
            }
          }
        },
        error: (error) => {
          if (!hasResponded) {
            hasResponded = true;
            clearTimeout(timeout);
            console.log('Erro na API, usando dados mockados:', error);
            mockLink.request(operation)?.subscribe(observer);
          }
        },
        complete: () => {
          if (!hasResponded) {
            clearTimeout(timeout);
            hasResponded = true;
            observer.complete();
          }
        },
      });
      
      return () => {
        clearTimeout(timeout);
      };
    });
  })
]);

// Configuração do Apollo Client - usamos fallback para ter o melhor dos dois mundos
export const client = new ApolloClient({
  link: fallbackLink, // Usa um link que tenta httpLink primeiro e fallback para mockLink
  //link: mockLink, // Use apenas mockLink para desenvolvimento
  //link: httpLink, // Use apenas httpLink para produção
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'network-only',
      nextFetchPolicy: 'cache-first',
    },
  },
});

// Queries para componentes
export const GET_COMPONENTS = gql`
  query GetComponents($status: String) {
    components(status: $status) {
      id
      name
      description
      status
      createdAt
      tags {
        tag
      }
    }
  }
`;

export const GET_COMPONENT = gql`
  query GetComponent($id: Int!) {
    component(id: $id) {
      id
      name
      description
      status
      createdAt
      tags {
        tag
      }
    }
  }
`;

export const GET_GRAPH_DATA = gql`
  query GetGraphData($depth: Int) {
    graphData(depth: $depth) {
      nodes {
        id
        name
        description
        type
        validFrom
        validTo
      }
      edges {
        id
        source
        target
        label
        properties
      }
    }
  }
`;

// Mutations para componentes
export const CREATE_COMPONENT = gql`
  mutation CreateComponent($input: ComponentInput!) {
    createComponent(input: $input) {
      id
      name
      description
      status
      createdAt
    }
  }
`;

export const UPDATE_COMPONENT = gql`
  mutation UpdateComponent($id: Int!, $input: ComponentInput!) {
    updateComponent(id: $id, input: $input) {
      id
      name
      description
      status
    }
  }
`;

export const DELETE_COMPONENT = gql`
  mutation DeleteComponent($id: Int!) {
    deleteComponent(id: $id) {
      id
      name
    }
  }
`;

export const CREATE_RELATION = gql`
  mutation CreateRelation($input: RelationInput!) {
    createRelation(input: $input) {
      id
      sourceId
      targetId
      type
      properties
    }
  }
`;

// Tipos GraphQL
export enum ComponentStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  DEPRECATED = 'DEPRECATED'
}

export interface ComponentType {
  id: number;
  name: string;
  description: string;
  status: ComponentStatus;
  createdAt: Date;
  tags: string[];
}

export interface ComponentInput {
  name: string;
  description?: string;
  status?: ComponentStatus;
  tags?: string[];
}

export interface RelationInput {
  sourceId: number;
  targetId: number;
  type: string;
  properties?: Record<string, any>;
}

export interface GraphData {
  nodes: Array<{
    id: string;
    name: string;
    description?: string;
    type: string;
    validFrom?: string;
    validTo?: string;
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    label: string;
    properties?: Record<string, any>;
  }>;
} 