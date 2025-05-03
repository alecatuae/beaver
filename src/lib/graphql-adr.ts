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

// Queries para ADRs
export const GET_ADRS = gql`
  query GetADRs {
    adrs {
      id
      title
      description
      status
      createdAt
      updatedAt
      participants {
        id
        role
        user {
          id
          fullName
          email
          avatarUrl
          role
        }
      }
      components {
        id
        name
        status
      }
      componentInstances {
        id
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
      tags
    }
  }
`;

export const GET_ADR = gql`
  query GetADR($id: Int!) {
    adr(id: $id) {
      id
      title
      description
      status
      createdAt
      updatedAt
      participants {
        id
        role
        user {
          id
          fullName
          email
          avatarUrl
          role
        }
      }
      components {
        id
        name
        status
      }
      componentInstances {
        id
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
      tags
    }
  }
`;

export const GET_USERS = gql`
  query GetUsers {
    users {
      id
      fullName
      email
      role
      avatarUrl
    }
  }
`;

export const GET_COMPONENTS = gql`
  query GetComponents {
    components {
      id
      name
      status
      instances {
        id
        hostname
        environmentId
        environment {
          id
          name
        }
      }
    }
  }
`;

// Mutations para ADRs
export const CREATE_ADR = gql`
  mutation CreateADR($title: String!, $description: String!, $status: String!, $participants: [ADRParticipantInput!]!, $componentsIds: [Int!], $instancesIds: [Int!], $tags: [String!]) {
    createADR(input: {
      title: $title,
      description: $description,
      status: $status,
      participants: $participants,
      componentsIds: $componentsIds,
      instancesIds: $instancesIds,
      tags: $tags
    }) {
      id
      title
      status
    }
  }
`;

export const UPDATE_ADR = gql`
  mutation UpdateADR($id: Int!, $title: String!, $description: String!, $status: String!, $participants: [ADRParticipantInput!]!, $componentsIds: [Int!], $instancesIds: [Int!], $tags: [String!]) {
    updateADR(id: $id, input: {
      title: $title,
      description: $description,
      status: $status,
      participants: $participants,
      componentsIds: $componentsIds,
      instancesIds: $instancesIds,
      tags: $tags
    }) {
      id
      title
      status
    }
  }
`;

export const DELETE_ADR = gql`
  mutation DeleteADR($id: Int!) {
    deleteADR(id: $id)
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