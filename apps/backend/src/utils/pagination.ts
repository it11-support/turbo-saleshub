import { Request } from 'express'
import { parsePagination, buildPaginationMeta } from './apiResponse.js'
import { sortOptionsParser, convertToPrismaOrderBy } from './sortOptionsParser.js'

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
  const rawSort = typeof q.sort === 'string' ? q.sort : null
  const sort = rawSort && /^[a-zA-Z0-9_.]+$/.test(rawSort) ? rawSort : null
  const order: 'asc' | 'desc' =
    typeof q.order === 'string' && q.order === 'asc' ? 'asc' : 'desc'
  const search = typeof q.search === 'string' ? q.search : undefined

  const sort_options: { key: string; order: 'asc' | 'desc' }[] = sort
    ? [{ key: sort, order }]
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
