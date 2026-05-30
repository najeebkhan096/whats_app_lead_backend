/**
 * Paginate array or query results
 */
export function paginate<T>(
  items: T[],
  page: number = 1,
  limit: number = 10,
): { data: T[]; pagination: { page: number; limit: number; total: number } } {
  const total = items.length;
  const start = (page - 1) * limit;
  const end = start + limit;
  const data = items.slice(start, end);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
    },
  };
}

/**
 * Build pagination query for Prisma
 */
export function buildPaginationQuery(page: number = 1, limit: number = 10) {
  return {
    skip: (page - 1) * limit,
    take: limit,
  };
}

/**
 * Format pagination response
 */
export function formatPaginationResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
) {
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
}
