import { Request } from 'express'
import { z } from 'zod'
import { parsePagination, buildPaginationMeta } from './apiResponse.js'
import { sortOptionsParser, convertToPrismaOrderBy } from './sortOptionsParser.js'

const SORT_KEY_PATTERN = /^[a-zA-Z0-9_.]+$/

const querySchema = z.object({
  page: z.union([z.string(), z.number()]).optional(),
  per_page: z.union([z.string(), z.number()]).optional(),
  sort: z.string().regex(SORT_KEY_PATTERN).nullable().optional(),
  order: z.enum(['asc', 'desc']).optional(),
  search: z.string().optional(),
}).strip()

export interface PaginatedQuery {
  page?: string | number
  per_page?: string | number
  sort?: string | null
  order?: string | null
  search?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    currentPage: number
    perPage: number
    totalRecords: number
    totalPages: number
  }
}

export const getPaginatedQuery = (
  req: Request<{}, {}, {}, PaginatedQuery>
) => {
  const parsed = querySchema.safeParse(req.query)

  const query = parsed.success
    ? parsed.data
    : {
      page: undefined,
      per_page: undefined,
      sort: null,
      order: 'desc' as const,
      search: undefined,
    }

  const { page, perPage } = parsePagination(query)

  const sortOptions = sortOptionsParser([
    {
      key: query.sort ?? 'created_at',
      order: query.order ?? 'desc',
    },
  ])

  const orderBy = convertToPrismaOrderBy(sortOptions)

  return {
    page,
    perPage,
    sortOptions,
    orderBy,
    search: query.search,
  }
}

export const buildPaginatedResult = <T>(
  items: T[],
  page: number,
  perPage: number,
  totalCount: number
): PaginatedResponse<T> => ({
  data: items,
  meta: buildPaginationMeta(page, perPage, totalCount),
})
