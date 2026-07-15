import { Request } from 'express'
import { z } from 'zod'
import { parsePagination, buildPaginationMeta } from './apiResponse.js'
import { sortOptionsParser, convertToPrismaOrderBy } from './sortOptionsParser.js'

const SORT_KEY_PATTERN = /^[a-zA-Z0-9_.]+$/

const paginationQuerySchema = z.object({
  sort: z.string().regex(SORT_KEY_PATTERN).nullable().optional(),
  order: z.enum(['asc', 'desc']).nullable().optional(),
  search: z.string().optional(),
})

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

export const getPaginatedQuery = (req: Request<{}, {}, {}, PaginatedQuery>) => {
  const q = req.query
  const { page, perPage } = parsePagination(q)

  const { sort, order, search } = paginationQuerySchema
    .catch({ sort: null, order: 'desc', search: undefined })
    .parse({
      sort: typeof q.sort === 'string' ? q.sort : null,
      order: typeof q.order === 'string' ? q.order : null,
      search: typeof q.search === 'string' ? q.search : undefined,
    })

  const sort_options: { key: string; order: 'asc' | 'desc' }[] = sort
    ? [{ key: sort, order: order ?? 'desc' }]
    : [{ key: 'created_at', order: 'desc' }]

  const sortOptions = sortOptionsParser(sort_options)
  const orderBy = convertToPrismaOrderBy(sortOptions)

  return {
    page,
    perPage,
    sortOptions,
    orderBy,
    search,
  }
}

export const buildPaginatedResult = <T>(
  items: T[],
  page: number,
  perPage: number,
  totalCount: number
): PaginatedResponse<T> => {
  const meta = buildPaginationMeta(page, perPage, totalCount)
  return {
    data: items,
    meta,
  }
}
