import { Request } from 'express'
import { z } from 'zod'
import { parsePagination, buildPaginationMeta } from './apiResponse.js'
import { sortOptionsParser, convertToPrismaOrderBy } from './sortOptionsParser.js'

const SORT_KEY_PATTERN = /^[a-zA-Z0-9_.]+$/

const sortSchema = z.string().regex(SORT_KEY_PATTERN).nullable()
const orderSchema = z.enum(['asc', 'desc'])
const searchSchema = z.string().optional()

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
  const { page, perPage } = parsePagination(req.query)

  let sort: string | null = null
  let order: 'asc' | 'desc' = 'desc'
  let search: string | undefined

  if (typeof req.query.sort === 'string') {
    sort = sortSchema.catch(null).parse(req.query.sort)
  }

  if (typeof req.query.order === 'string') {
    order = orderSchema.catch('desc').parse(req.query.order)
  }

  if (typeof req.query.search === 'string') {
    search = searchSchema.catch(undefined).parse(req.query.search)
  }

  const sortOptions = sortOptionsParser(
    sort
      ? [
        {
          key: sort,
          order,
        },
      ]
      : [
        {
          key: 'created_at',
          order: 'desc',
        },
      ]
  )

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
): PaginatedResponse<T> => ({
  data: items,
  meta: buildPaginationMeta(page, perPage, totalCount),
})
