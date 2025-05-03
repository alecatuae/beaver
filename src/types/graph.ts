/**
 * Tipos para elementos de grafo
 */

// Tipos básicos para nós
export interface GraphNode {
  id: string;
  label: string;
  type?: string;
  environmentId?: number;
  componentId?: number;
  categoryId?: number;
  teamId?: number;
  parentId?: string;
  status?: string;
  validFrom?: string;
  validTo?: string;
  data?: {
    description?: string;
    status?: string;
    categoryName?: string;
    teamName?: string;
    environmentName?: string;
    hostname?: string;
    specs?: Record<string, any>;
    totalInstances?: number;
    [key: string]: any;
  };
}

// Tipos para arestas
export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  type?: string;
  data?: {
    description?: string;
    properties?: Record<string, any>;
    [key: string]: any;
  };
}

// Estrutura completa de dados do grafo
export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

// Tipos de nós
export enum NodeType {
  COMPONENT = 'component',
  INSTANCE = 'instance',
  ENVIRONMENT = 'environment',
  CATEGORY = 'category',
  TEAM = 'team'
}

// Tipos de arestas
export enum EdgeType {
  RELATES_TO = 'RELATES_TO',
  INSTANTIATES = 'INSTANTIATES',
  DEPLOYED_IN = 'DEPLOYED_IN',
  BELONGS_TO = 'BELONGS_TO',
  RESPONSIBLE_FOR = 'RESPONSIBLE_FOR'
} 