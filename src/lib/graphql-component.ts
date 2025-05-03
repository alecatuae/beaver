import { gql } from '@apollo/client';

// Fragmentos modulares para reutilização específica por contexto
export const COMPONENT_CORE_FIELDS = gql`
  fragment ComponentCoreFields on Component {
    id
    name
    description
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

export const COMPONENT_CATEGORY_FIELDS = gql`
  fragment ComponentCategoryFields on Component {
    category {
      id
      name
      image
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

export const COMPONENT_TAGS_FIELDS = gql`
  fragment ComponentTagsFields on Component {
    tags
  }
`;

// Fragmento completo para casos específicos que necessitam de todos os dados
export const COMPONENT_FULL_FIELDS = gql`
  fragment ComponentFullFields on Component {
    ...ComponentCoreFields
    ...ComponentTeamFields
    ...ComponentCategoryFields
    ...ComponentInstancesFields
    ...ComponentTagsFields
  }
  ${COMPONENT_CORE_FIELDS}
  ${COMPONENT_TEAM_FIELDS}
  ${COMPONENT_CATEGORY_FIELDS}
  ${COMPONENT_INSTANCES_FIELDS}
  ${COMPONENT_TAGS_FIELDS}
`;

// Fragmento otimizado para listagem (menos dados)
export const COMPONENT_LIST_FIELDS = gql`
  fragment ComponentListFields on Component {
    ...ComponentCoreFields
    ...ComponentTagsFields
    category {
      id
      name
    }
    totalInstances
    instancesByEnvironment {
      environmentId
      count
    }
  }
  ${COMPONENT_CORE_FIELDS}
  ${COMPONENT_TAGS_FIELDS}
`;

// Consulta paginada de componentes (otimizada para listagem)
export const GET_PAGINATED_COMPONENTS = gql`
  query GetPaginatedComponents(
    $status: ComponentStatus, 
    $pagination: PaginationInput,
    $environmentId: Int,
    $search: String,
    $categoryId: Int,
    $teamId: Int
  ) {
    components(
      status: $status,
      pagination: $pagination,
      environmentId: $environmentId,
      search: $search,
      categoryId: $categoryId,
      teamId: $teamId
    ) {
      items {
        ...ComponentListFields
      }
      pageInfo {
        totalItems
        currentPage
        pageSize
        totalPages
        hasNextPage
        hasPreviousPage
      }
    }
  }
  ${COMPONENT_LIST_FIELDS}
`;

// Consulta para um componente específico (detalhes completos)
export const GET_COMPONENT = gql`
  query GetComponent($id: Int!) {
    component(id: $id) {
      ...ComponentFullFields
    }
  }
  ${COMPONENT_FULL_FIELDS}
`;

// Consulta para componentes em um ambiente específico (otimizada)
export const GET_COMPONENTS_BY_ENVIRONMENT = gql`
  query GetComponentsByEnvironment($environmentId: Int!, $pagination: PaginationInput) {
    components(environmentId: $environmentId, pagination: $pagination) {
      items {
        ...ComponentListFields
      }
      pageInfo {
        totalItems
        currentPage
        pageSize
        totalPages
        hasNextPage
        hasPreviousPage
      }
    }
  }
  ${COMPONENT_LIST_FIELDS}
`;

// Consulta para componentes de uma categoria específica (otimizada)
export const GET_COMPONENTS_BY_CATEGORY = gql`
  query GetComponentsByCategory($categoryId: Int!, $pagination: PaginationInput) {
    components(categoryId: $categoryId, pagination: $pagination) {
      items {
        ...ComponentListFields
      }
      pageInfo {
        totalItems
        currentPage
        pageSize
        totalPages
        hasNextPage
        hasPreviousPage
      }
    }
  }
  ${COMPONENT_LIST_FIELDS}
`;

// Consulta para componentes de um time específico (otimizada)
export const GET_COMPONENTS_BY_TEAM = gql`
  query GetComponentsByTeam($teamId: Int!, $pagination: PaginationInput) {
    components(teamId: $teamId, pagination: $pagination) {
      items {
        ...ComponentListFields
      }
      pageInfo {
        totalItems
        currentPage
        pageSize
        totalPages
        hasNextPage
        hasPreviousPage
      }
    }
  }
  ${COMPONENT_LIST_FIELDS}
`;

// Mutation para criar componente
export const CREATE_COMPONENT = gql`
  mutation CreateComponent($input: ComponentInput!) {
    createComponent(input: $input) {
      ...ComponentCoreFields
      ...ComponentCategoryFields
      ...ComponentTeamFields
    }
  }
  ${COMPONENT_CORE_FIELDS}
  ${COMPONENT_CATEGORY_FIELDS}
  ${COMPONENT_TEAM_FIELDS}
`;

// Mutation para atualizar componente
export const UPDATE_COMPONENT = gql`
  mutation UpdateComponent($id: Int!, $input: ComponentInput!) {
    updateComponent(id: $id, input: $input) {
      ...ComponentCoreFields
      ...ComponentCategoryFields
      ...ComponentTeamFields
    }
  }
  ${COMPONENT_CORE_FIELDS}
  ${COMPONENT_CATEGORY_FIELDS}
  ${COMPONENT_TEAM_FIELDS}
`;

// Mutation para excluir componente
export const DELETE_COMPONENT = gql`
  mutation DeleteComponent($id: Int!) {
    deleteComponent(id: $id)
  }
`; 