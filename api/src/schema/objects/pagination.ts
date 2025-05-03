import builder from '../../schema';

// Tipo de informações de paginação (para resposta)
export const PageInfo = builder.objectType('PageInfo', {
  fields: (t) => ({
    totalItems: t.int(),
    currentPage: t.int(),
    pageSize: t.int(),
    totalPages: t.int(),
    hasNextPage: t.boolean(),
    hasPreviousPage: t.boolean(),
  })
});

// Input para paginação (para queries)
export const PaginationInputType = builder.inputType('PaginationInput', {
  fields: (t) => ({
    page: t.int({ required: false, defaultValue: 1 }),
    pageSize: t.int({ required: false, defaultValue: 20 }),
    sortField: t.string({ required: false }),
    sortOrder: t.string({ required: false, defaultValue: 'desc' }),
  })
});

// Enum para direção de ordenação
export const SortOrder = builder.enumType('SortOrder', {
  values: ['asc', 'desc'] as const,
});

// Exporta função auxiliar para criar tipos de resposta paginados
export function createPaginatedResponse<T>(
  name: string, 
  itemType: ReturnType<typeof builder.objectType>
) {
  return builder.objectType(`Paginated${name}Response`, {
    fields: (t) => ({
      items: t.field({ type: [itemType] }),
      pageInfo: t.field({ type: PageInfo }),
    }),
  });
} 