import { ApolloClient, InMemoryCache, gql, HttpLink } from '@apollo/client';

// HTTP link para a API real
const apiUrl = process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || 'http://localhost:4000/graphql';
console.log('Usando endpoint GraphQL:', apiUrl);

const httpLink = new HttpLink({
  uri: apiUrl,
});

// Configuração do Apollo Client
export const client = new ApolloClient({
  link: httpLink,
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
      tags {
        tag
      }
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
      createdAt
      tags {
        tag
      }
    }
  }
`;

export const DELETE_COMPONENT = gql`
  mutation DeleteComponent($id: Int!) {
    deleteComponent(id: $id) {
      id
      name
      description
      status
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

// Tipos para trabalhar com componentes
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