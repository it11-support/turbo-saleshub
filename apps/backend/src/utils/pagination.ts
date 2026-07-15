import { Request } from 'express'
import { z } from 'zod'
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

export const getPaginatedQuery = (
  req: Request<{}, {}, {}, PaginatedQuery>,
  allowedSortFields: readonly string[],
  defaultSort = 'created_at'
) => {
  const q = req.query
  const { page, perPage } = parsePagination(q)

  const rawSort = typeof q.sort === 'string' ? q.sort : null
  const rawOrder = typeof q.order === 'string' ? q.order : 'desc'
  const rawSearch = typeof q.search === 'string' ? q.search : undefined

  const order = z.enum(['asc', 'desc']).catch('desc').parse(rawOrder)
  const search = z.string().optional().catch(undefined).parse(rawSearch)

  const sort =
    rawSort && allowedSortFields.includes(rawSort)
      ? rawSort
      : defaultSort

  const sortOptions = sortOptionsParser([
    {
      key: sort,
      order,
    },
  ])

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
  return {
    data: items,
    meta: buildPaginationMeta(page, perPage, totalCount),
  }
}
