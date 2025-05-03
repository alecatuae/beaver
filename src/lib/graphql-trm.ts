import { gql } from '@apollo/client';

// Tipos para TRM
export enum TRMLayerType {
  INFRASTRUCTURE = 'INFRASTRUCTURE',
  PLATFORM = 'PLATFORM',
  APPLICATION = 'APPLICATION',
  SHARED_SERVICES = 'SHARED_SERVICES'
}

export interface TRMLayerType {
  id: string;
  name: string;
  description?: string;
}

export interface CategoryType {
  id: string;
  name: string;
  description?: string;
  layerId: string;
  layer: TRMLayerType;
  parentId?: string;
  parent?: CategoryType;
  children?: CategoryType[];
  imageUrl?: string;
  components?: any[];
}

// Queries
export const GET_TRM_LAYERS = gql`
  query GetTRMLayers {
    trmLayers {
      id
      name
      description
    }
  }
`;

export const GET_CATEGORIES_BY_LAYER = gql`
  query GetCategoriesByLayer($layerId: ID!) {
    categoriesByLayer(layerId: $layerId) {
      id
      name
      description
      imageUrl
      parentId
    }
  }
`;

export const GET_CATEGORY_DETAILS = gql`
  query GetCategoryDetails($id: ID!) {
    category(id: $id) {
      id
      name
      description
      imageUrl
      parentId
      layer {
        id
        name
      }
      components {
        id
        name
        status
      }
    }
  }
`;

export const GET_ALL_CATEGORIES = gql`
  query GetAllCategories {
    categories {
      id
      name
      description
      imageUrl
      parentId
      layer {
        id
        name
      }
    }
  }
`; 