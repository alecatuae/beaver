// Tipos para paginação
export interface PaginationInput {
  page?: number;
  pageSize?: number;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PageInfo {
  totalItems: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  pageInfo: PageInfo;
}

// Interface para associar uma função com o tipo paginado
export type WithPagination<T> = T & {
  fetchMore: (options: {
    variables: {
      pagination: PaginationInput;
    };
    updateQuery: (prev: any, { fetchMoreResult }: { fetchMoreResult: any }) => any;
  }) => Promise<any>;
}; 