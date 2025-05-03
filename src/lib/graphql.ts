import { ApolloClient, InMemoryCache, gql, HttpLink } from '@apollo/client';

// HTTP link para a API real
// Usando o endpoint configurado na variável de ambiente ou um fallback para desenvolvimento local
const apiUrl = process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || 'http://localhost:4000/graphql';
console.log('Conectando ao endpoint GraphQL:', apiUrl);

const httpLink = new HttpLink({
  uri: apiUrl,
  credentials: 'same-origin'
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
    query: {
      fetchPolicy: 'network-only',
      errorPolicy: 'all',
    },
    mutate: {
      errorPolicy: 'all',
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
      categoryId
      createdAt
      category {
        id
        name
        image
      }
      tags {
        tag
      }
      team {
        id
        name
      }
      totalInstances
      instancesByEnvironment {
        environmentId
        count
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
      category {
        id
        name
        image
      }
      team {
        id
        name
        description
      }
      tags {
        tag
      }
      instances {
        id
        hostname
        specs
        createdAt
        environment {
          id
          name
        }
      }
      referencedGlossaryTerms {
        id
        term
        definition
        status
      }
      relatedComponents {
        id
        name
        status
      }
      lastUpdatedAt
      lastUpdatedBy {
        id
        fullName
      }
      validFrom
      validTo
    }
  }
`;

export const GET_GRAPH_DATA = gql`
  query GetGraphData($depth: Int, $environmentId: Int, $teamId: Int) {
    graphData(depth: $depth, environmentId: $environmentId, teamId: $teamId) {
      nodes {
        id
        name
        description
        type
        validFrom
        validTo
        status
        teamId
        environmentId
        componentId
        categoryId
        properties
      }
      edges {
        id
        source
        target
        label
        type
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
      categoryId
      team {
        id
        name
      }
      createdAt
      tags {
        tag
      }
      validFrom
      validTo
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
      categoryId
      team {
        id
        name
      }
      createdAt
      tags {
        tag
      }
      validFrom
      validTo
      lastUpdatedAt
    }
  }
`;

export const DELETE_COMPONENT = gql`
  mutation DeleteComponent($id: Int!) {
    deleteComponent(id: $id)
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

export const GET_RELATIONS = gql`
  query GetRelations {
    relations {
      id
      sourceId
      targetId
      type
      properties
      source {
        id
        name
        status
      }
      target {
        id
        name
        status
      }
      createdAt
      updatedAt
    }
  }
`;

export const GET_RELATION = gql`
  query GetRelation($id: String!) {
    relation(id: $id) {
      id
      sourceId
      targetId
      type
      properties
      source {
        id
        name
        status
      }
      target {
        id
        name
        status
      }
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_RELATION = gql`
  mutation UpdateRelation($id: String!, $input: RelationInput!) {
    updateRelation(id: $id, input: $input) {
      id
      type
      sourceId
      targetId
      properties
      createdAt
      updatedAt
    }
  }
`;

export const DELETE_RELATION = gql`
  mutation DeleteRelation($id: String!) {
    deleteRelation(id: $id)
  }
`;

// Query para verificar se um componente tem relacionamentos
export const CHECK_COMPONENT_RELATIONS = gql`
  query CheckComponentRelations($id: Int!) {
    componentRelations(id: $id) {
      hasRelations
      count
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
  categoryId?: number | null;
  category?: CategoryType;
  teamId?: number | null;
  team?: TeamType;
  createdAt: Date;
  tags: string[];
  hasRelations?: boolean;
  instances?: ComponentInstanceType[];
  totalInstances?: number;
  instancesByEnvironment?: {
    environmentId: number;
    count: number;
  }[];
  referencedGlossaryTerms?: {
    id: number;
    term: string;
    definition: string;
    status: string;
  }[];
  relatedComponents?: {
    id: number;
    name: string;
    status: ComponentStatus;
  }[];
  lastUpdatedAt?: string;
  lastUpdatedBy?: {
    id: number;
    fullName: string;
  };
  validFrom?: string;
  validTo?: string;
}

export interface ComponentInput {
  name: string;
  description?: string;
  status?: ComponentStatus;
  categoryId?: number | null;
  teamId?: number | null;
  tags?: string[];
  validFrom?: string;
  validTo?: string;
  referencedTerms?: string[];
}

export interface RelationInput {
  sourceId: number;
  targetId: number;
  type: string;
  properties?: Record<string, any>;
  description?: string;
}

export interface RelationType {
  id: string;
  sourceId: number;
  targetId: number;
  type: string;
  properties?: {
    description?: string;
  };
  source?: ComponentType;
  target?: ComponentType;
  createdAt: string;
  updatedAt: string;
}

export interface GraphData {
  nodes: Array<{
    id: string;
    name: string;
    description?: string;
    type: string;
    validFrom?: string;
    validTo?: string;
    status?: string;
    teamId?: number;
    environmentId?: number;
    componentId?: number;
    categoryId?: number;
    properties?: Record<string, any>;
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    label: string;
    type?: string;
    properties?: Record<string, any>;
  }>;
}

// Queries para categorias
export const GET_CATEGORIES = gql`
  query GetCategories {
    categories {
      id
      name
      description
      image
      createdAt
    }
  }
`;

export const GET_CATEGORY = gql`
  query GetCategory($id: Int!) {
    category(id: $id) {
      id
      name
      description
      image
      createdAt
    }
  }
`;

// Novas queries para ambientes
export const GET_ENVIRONMENTS = gql`
  query GetEnvironments {
    environments {
      id
      name
      description
      createdAt
      instances {
        id
        hostname
        component {
          id
          name
        }
      }
    }
  }
`;

export const GET_ENVIRONMENT = gql`
  query GetEnvironment($id: Int!) {
    environment(id: $id) {
      id
      name
      description
      createdAt
      instances {
        id
        hostname
        specs
        createdAt
        component {
          id
          name
          status
        }
      }
    }
  }
`;

export const CREATE_ENVIRONMENT = gql`
  mutation CreateEnvironment($input: EnvironmentInput!) {
    createEnvironment(input: $input) {
      id
      name
      description
      createdAt
    }
  }
`;

export const UPDATE_ENVIRONMENT = gql`
  mutation UpdateEnvironment($id: Int!, $input: EnvironmentInput!) {
    updateEnvironment(id: $id, input: $input) {
      id
      name
      description
      createdAt
    }
  }
`;

export const DELETE_ENVIRONMENT = gql`
  mutation DeleteEnvironment($id: Int!) {
    deleteEnvironment(id: $id)
  }
`;

// Query para obter instâncias de componentes em um ambiente específico
export const GET_COMPONENT_INSTANCES_BY_ENVIRONMENT = gql`
  query GetComponentInstancesByEnvironment($environmentId: Int!) {
    componentInstancesByEnvironment(environmentId: $environmentId) {
      id
      hostname
      specs
      createdAt
      component {
        id
        name
        status
        description
      }
    }
  }
`;

// Queries e mutations para instâncias de componentes
export const GET_COMPONENT_INSTANCES = gql`
  query GetComponentInstances {
    componentInstances {
      id
      hostname
      specs
      createdAt
      component {
        id
        name
        status
      }
      environment {
        id
        name
      }
    }
  }
`;

export const GET_COMPONENT_INSTANCE = gql`
  query GetComponentInstance($id: Int!) {
    componentInstance(id: $id) {
      id
      hostname
      specs
      createdAt
      component {
        id
        name
        status
        description
      }
      environment {
        id
        name
        description
      }
    }
  }
`;

export const CREATE_COMPONENT_INSTANCE = gql`
  mutation CreateComponentInstance($input: ComponentInstanceInput!) {
    createComponentInstance(input: $input) {
      id
      hostname
      specs
      createdAt
      component {
        id
        name
      }
      environment {
        id
        name
      }
    }
  }
`;

export const UPDATE_COMPONENT_INSTANCE = gql`
  mutation UpdateComponentInstance($id: Int!, $input: ComponentInstanceInput!) {
    updateComponentInstance(id: $id, input: $input) {
      id
      hostname
      specs
      createdAt
    }
  }
`;

export const DELETE_COMPONENT_INSTANCE = gql`
  mutation DeleteComponentInstance($id: Int!) {
    deleteComponentInstance(id: $id)
  }
`;

// Queries e mutations para times
export const GET_TEAMS = gql`
  query GetTeams {
    teams {
      id
      name
      description
      createdAt
      members {
        id
        user {
          id
          fullName
          email
        }
        joinDate
      }
      components {
        id
        name
        status
      }
    }
  }
`;

export const GET_TEAM = gql`
  query GetTeam($id: Int!) {
    team(id: $id) {
      id
      name
      description
      createdAt
      members {
        id
        user {
          id
          fullName
          email
          role
        }
        joinDate
      }
      components {
        id
        name
        description
        status
        instances {
          id
          hostname
          environment {
            id
            name
          }
        }
      }
    }
  }
`;

export const CREATE_TEAM = gql`
  mutation CreateTeam($input: TeamInput!) {
    createTeam(input: $input) {
      id
      name
      description
      createdAt
    }
  }
`;

export const UPDATE_TEAM = gql`
  mutation UpdateTeam($id: Int!, $input: TeamInput!) {
    updateTeam(id: $id, input: $input) {
      id
      name
      description
      createdAt
    }
  }
`;

export const DELETE_TEAM = gql`
  mutation DeleteTeam($id: Int!) {
    deleteTeam(id: $id)
  }
`;

// Queries e mutations para membros de times
export const ADD_TEAM_MEMBER = gql`
  mutation AddTeamMember($input: TeamMemberInput!) {
    addTeamMember(input: $input) {
      id
      team {
        id
        name
      }
      user {
        id
        fullName
      }
      joinDate
    }
  }
`;

export const REMOVE_TEAM_MEMBER = gql`
  mutation RemoveTeamMember($teamId: Int!, $userId: Int!) {
    removeTeamMember(teamId: $teamId, userId: $userId)
  }
`;

export const GET_USERS_NOT_IN_TEAM = gql`
  query GetUsersNotInTeam($teamId: Int!) {
    usersNotInTeam(teamId: $teamId) {
      id
      fullName
      email
      role
    }
  }
`;

// Queries para categorias
export const GET_CATEGORY_IMAGES = gql`
  query GetCategoryImages {
    categoryImages {
      name
      url
    }
  }
`;

// Tipos para trabalhar com categorias
export interface CategoryType {
  id: number;
  name: string;
  description?: string;
  image?: string;
  createdAt: Date;
}

export interface CategoryInput {
  id?: number;
  name: string;
  description?: string;
  image?: string;
}

// Interface para Environment
export interface EnvironmentType {
  id: number;
  name: string;
  description?: string;
  createdAt: Date;
  instances?: ComponentInstanceType[];
}

// Interface para EnvironmentInput
export interface EnvironmentInput {
  name: string;
  description?: string;
}

// Interface para ComponentInstance
export interface ComponentInstanceType {
  id: number;
  componentId: number;
  environmentId: number;
  hostname?: string;
  specs?: Record<string, any>;
  createdAt: Date;
  component?: ComponentType;
  environment?: EnvironmentType;
}

// Interface para ComponentInstanceInput
export interface ComponentInstanceInput {
  componentId: number;
  environmentId: number;
  hostname?: string;
  specs?: Record<string, any>;
}

// Interface para Team
export interface TeamType {
  id: number;
  name: string;
  description?: string;
  createdAt: Date;
  members?: TeamMemberType[];
  components?: ComponentType[];
}

// Interface para TeamInput
export interface TeamInput {
  name: string;
  description?: string;
  members?: TeamMemberInput[];
}

// Interface para TeamMember
export interface TeamMemberType {
  id: number;
  teamId: number;
  userId: number;
  joinDate: Date;
  user?: {
    id: number;
    fullName: string;
    email: string;
    role?: string;
  };
  team?: TeamType;
}

// Interface para TeamMemberInput
export interface TeamMemberInput {
  teamId: number;
  userId: number;
  joinDate?: Date;
} 

// Exportar todas as queries, mutations e definições relacionadas a ADRs
export * from './graphql-adr';