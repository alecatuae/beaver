// Interfaces explícitas dos modelos do Prisma para uso com Pothos
// Estas interfaces auxiliam na tipagem estática

export enum UserRole {
  ADMIN = 'ADMIN',
  ARCHITECT = 'ARCHITECT',
  CONTRIBUTOR = 'CONTRIBUTOR',
  VIEWER = 'VIEWER',
}

export enum ComponentStatus {
  PLANNED = 'PLANNED',
  ACTIVE = 'ACTIVE',
  DEPRECATED = 'DEPRECATED',
}

export interface User {
  id: number;
  email: string;
  username: string;
  role: UserRole;
  createdAt: Date;
}

export interface Component {
  id: number;
  name: string;
  description: string | null;
  status: ComponentStatus;
  createdAt: Date;
}

// Interface para tipos de resolvers
export interface ResolverContext {
  prisma: any;
}

// Interface para objetos de resposta comuns
export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  hasNextPage: boolean;
}

// Interface para filtros comuns
export interface CommonFilters {
  search?: string;
  skip?: number;
  take?: number;
} 