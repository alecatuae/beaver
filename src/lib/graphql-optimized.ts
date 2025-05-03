import { gql } from '@apollo/client';

/**
 * Consulta otimizada para componentes com diretivas @include e @skip
 * Permite buscar apenas os campos necessários baseado em variáveis booleanas
 */
export const GET_OPTIMIZED_COMPONENTS = gql`
  query GetOptimizedComponents(
    $status: ComponentStatus, 
    $pagination: PaginationInput,
    $environmentId: Int,
    $search: String,
    $categoryId: Int,
    $teamId: Int,
    $includeInstances: Boolean = false,
    $includeTeam: Boolean = true,
    $includeCategory: Boolean = true,
    $includeTags: Boolean = true
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
        id
        name
        description
        status
        createdAt
        
        team @include(if: $includeTeam) {
          id
          name
        }
        
        category @include(if: $includeCategory) {
          id
          name
          image
        }
        
        tags @include(if: $includeTags)
        
        instances @include(if: $includeInstances) {
          id
          hostname
          environment {
            id
            name
          }
          specs
        }
        
        totalInstances
        instancesByEnvironment {
          environmentId
          count
        }
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
`;

/**
 * Consulta otimizada para detalhes de um componente específico com diretivas @include e @skip
 */
export const GET_OPTIMIZED_COMPONENT = gql`
  query GetOptimizedComponent(
    $id: Int!,
    $includeInstances: Boolean = true,
    $includeTeam: Boolean = true,
    $includeCategory: Boolean = true,
    $includeTags: Boolean = true,
    $includeRelationships: Boolean = true
  ) {
    component(id: $id) {
      id
      name
      description
      status
      createdAt
      
      team @include(if: $includeTeam) {
        id
        name
        description
      }
      
      category @include(if: $includeCategory) {
        id
        name
        image
        description
      }
      
      tags @include(if: $includeTags)
      
      instances @include(if: $includeInstances) {
        id
        hostname
        environment {
          id
          name
        }
        specs
        status
        version
        healthScore
        lastUpdated
      }
      
      relationships @include(if: $includeRelationships) {
        id
        source {
          id
          name
        }
        target {
          id
          name
        }
        type
        description
      }
      
      totalInstances
      instancesByEnvironment {
        environmentId
        count
      }
    }
  }
`;

/**
 * Consulta otimizada para ADRs com diretivas @include e @skip
 */
export const GET_OPTIMIZED_ADRS = gql`
  query GetOptimizedADRs(
    $pagination: PaginationInput,
    $filter: ADRFilter,
    $includeParticipants: Boolean = true,
    $includeComponents: Boolean = false,
    $includeFullReviewers: Boolean = false
  ) {
    adrs(pagination: $pagination, filter: $filter) {
      items {
        id
        title
        description
        status
        createdAt
        updatedAt
        approvedByAll
        
        participants @include(if: $includeParticipants) {
          id
          role
          approved
          user @include(if: $includeFullReviewers) {
            id
            fullName
            email
          }
        }
        
        components @include(if: $includeComponents) {
          id
          name
          status
        }
        
        owners {
          id
          user {
            id
            fullName
          }
        }
        
        tags
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
`;

/**
 * Consulta otimizada para detalhes de um ADR específico com diretivas @include e @skip
 */
export const GET_OPTIMIZED_ADR = gql`
  query GetOptimizedADR(
    $id: Int!,
    $includeParticipants: Boolean = true,
    $includeComponents: Boolean = true,
    $includeInstances: Boolean = true,
    $includeRelatedADRs: Boolean = true,
    $includeFullReviewers: Boolean = true
  ) {
    adr(id: $id) {
      id
      title
      description
      status
      createdAt
      updatedAt
      approvedByAll
      totalImpactScore
      
      participants @include(if: $includeParticipants) {
        id
        role
        approved
        approvalDate
        comments
        user @include(if: $includeFullReviewers) {
          id
          fullName
          email
          role
        }
      }
      
      owners {
        id
        user {
          id
          fullName
        }
      }
      
      reviewers @include(if: $includeFullReviewers) {
        id
        approved
        user {
          id
          fullName
        }
      }
      
      components @include(if: $includeComponents) {
        id
        name
        status
        category {
          id
          name
        }
      }
      
      componentInstances @include(if: $includeInstances) {
        id
        impactLevel
        component {
          id
          name
        }
        instance {
          id
          hostname
          environment {
            id
            name
          }
        }
      }
      
      relatedADRs @include(if: $includeRelatedADRs) {
        id
        title
        status
      }
      
      supersededBy {
        id
        title
      }
      
      supersedes {
        id
        title
      }
      
      tags
    }
  }
`; 