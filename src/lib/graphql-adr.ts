import { gql } from '@apollo/client';

// Enums para ADR
export enum ADRStatus {
  DRAFT = 'draft',
  ACCEPTED = 'accepted',
  SUPERSEDED = 'superseded',
  REJECTED = 'rejected'
}

export enum ParticipantRole {
  OWNER = 'owner',
  REVIEWER = 'reviewer',
  CONSUMER = 'consumer'
}

// Fragmentos modulares para ADRs
export const ADR_CORE_FIELDS = gql`
  fragment ADRCoreFields on ADR {
    id
    title
    description
    status
    createdAt
    updatedAt
  }
`;

export const ADR_PARTICIPANTS_FIELDS = gql`
  fragment ADRParticipantsFields on ADR {
    participants {
      id
      role
      approved
      approvalDate
      user {
        id
        fullName
        email
      }
    }
  }
`;

export const ADR_COMPONENTS_FIELDS = gql`
  fragment ADRComponentsFields on ADR {
    components {
      id
      name
      status
    }
  }
`;

export const ADR_COMPONENT_INSTANCES_FIELDS = gql`
  fragment ADRComponentInstancesFields on ADR {
    componentInstances {
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
  }
`;

export const ADR_TAGS_FIELDS = gql`
  fragment ADRTagsFields on ADR {
    tags
  }
`;

// Fragmento para listagem (com campos mínimos necessários)
export const ADR_LIST_FIELDS = gql`
  fragment ADRListFields on ADR {
    ...ADRCoreFields
    ...ADRTagsFields
    approvedByAll
    owners {
      id
      user {
        id
        fullName
      }
    }
  }
  ${ADR_CORE_FIELDS}
  ${ADR_TAGS_FIELDS}
`;

// Fragmento completo para detalhes
export const ADR_FULL_FIELDS = gql`
  fragment ADRFullFields on ADR {
    ...ADRCoreFields
    ...ADRParticipantsFields
    ...ADRComponentsFields
    ...ADRComponentInstancesFields
    ...ADRTagsFields
    approvedByAll
    relatedADRs {
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
    totalImpactScore
  }
  ${ADR_CORE_FIELDS}
  ${ADR_PARTICIPANTS_FIELDS}
  ${ADR_COMPONENTS_FIELDS}
  ${ADR_COMPONENT_INSTANCES_FIELDS}
  ${ADR_TAGS_FIELDS}
`;

// Queries otimizadas para ADRs
export const GET_ADRS = gql`
  query GetADRs($pagination: PaginationInput, $filter: ADRFilter) {
    adrs(pagination: $pagination, filter: $filter) {
      items {
        ...ADRListFields
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
  ${ADR_LIST_FIELDS}
`;

export const GET_ADR = gql`
  query GetADR($id: Int!) {
    adr(id: $id) {
      ...ADRFullFields
    }
  }
  ${ADR_FULL_FIELDS}
`;

// Query para buscar apenas os participantes de um ADR
export const GET_ADR_PARTICIPANTS = gql`
  query GetADRParticipants($id: Int!) {
    adr(id: $id) {
      id
      title
      ...ADRParticipantsFields
      approvedByAll
    }
  }
  ${ADR_PARTICIPANTS_FIELDS}
`;

// Query otimizada para buscar ADRs por componente
export const GET_ADRS_BY_COMPONENT = gql`
  query GetADRsByComponent($componentId: Int!, $pagination: PaginationInput) {
    adrs(filter: { componentId: $componentId }, pagination: $pagination) {
      items {
        ...ADRListFields
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
  ${ADR_LIST_FIELDS}
`;

// Query para buscar usuários (para seleção de participantes)
export const GET_USERS = gql`
  query GetUsers {
    users {
      id
      fullName
      email
      role
    }
  }
`;

// Mutations para ADRs
export const CREATE_ADR = gql`
  mutation CreateADR($input: ADRInput!) {
    createADR(input: $input) {
      ...ADRCoreFields
    }
  }
  ${ADR_CORE_FIELDS}
`;

export const UPDATE_ADR = gql`
  mutation UpdateADR($id: Int!, $input: ADRInput!) {
    updateADR(id: $id, input: $input) {
      ...ADRCoreFields
    }
  }
  ${ADR_CORE_FIELDS}
`;

export const DELETE_ADR = gql`
  mutation DeleteADR($id: Int!) {
    deleteADR(id: $id)
  }
`;

// Mutations para participantes
export const ADD_ADR_PARTICIPANT = gql`
  mutation AddADRParticipant($adrId: Int!, $userId: Int!, $role: ParticipantRole!) {
    addParticipant(adrId: $adrId, input: { userId: $userId, role: $role }) {
      id
      role
      user {
        id
        fullName
      }
    }
  }
`;

export const REMOVE_ADR_PARTICIPANT = gql`
  mutation RemoveADRParticipant($adrId: Int!, $participantId: Int!) {
    removeParticipant(adrId: $adrId, participantId: $participantId)
  }
`;

export const APPROVE_ADR = gql`
  mutation ApproveADR($adrId: Int!, $participantId: Int!) {
    approveADR(adrId: $adrId, participantId: $participantId) {
      id
      approved
      approvalDate
    }
  }
`;

// Interfaces para ADRs
export interface ADRType {
  id: number;
  title: string;
  description: string;
  status: ADRStatus;
  createdAt: string;
  updatedAt: string;
  participants: ADRParticipantType[];
  components: {
    id: string;
    name: string;
    status: string;
  }[];
  componentInstances: {
    id: string;
    component: {
      id: string;
      name: string;
    };
    instance: {
      id: string;
      hostname: string;
      environment: {
        id: string;
        name: string;
      };
    };
  }[];
  tags: string[];
}

export interface ADRParticipantType {
  id: number;
  role: string;
  user: {
    id: number;
    fullName: string;
    email: string;
    avatarUrl?: string;
    role?: string;
  };
}

export interface ADRParticipantInput {
  userId: number;
  role: ParticipantRole;
}

export interface ADRInput {
  title: string;
  description: string;
  status: ADRStatus;
  participants: ADRParticipantInput[];
  componentsIds?: number[];
  instancesIds?: number[];
  tags?: string[];
} 