import { Request } from 'express'
import { z } from 'zod'
import { parsePagination, buildPaginationMeta } from './apiResponse.js'
import { sortOptionsParser, convertToPrismaOrderBy } from './sortOptionsParser.js'

const SORT_KEY_PATTERN = /^[a-zA-Z0-9_.]+$/

const sortSchema = z.string().regex(SORT_KEY_PATTERN).nullable()
const orderSchema = z.enum(['asc', 'desc'])
const searchSchema = z.string().optional()

const getString = (value: unknown): string | undefined =>
  typeof value === 'string' ? value : undefined

const getNullableString = (value: unknown): string | null =>
  typeof value === 'string' ? value : null

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

  const rawSort = getNullableString(req.query.sort)
  const rawOrder = getString(req.query.order)
  const rawSearch = getString(req.query.search)

  const sort =
    rawSort === null
      ? null
      : sortSchema.catch(null).parse(rawSort)

  const order =
    rawOrder === undefined
      ? 'desc'
      : orderSchema.catch('desc').parse(rawOrder)

  const search =
    rawSearch === undefined
      ? undefined
      : searchSchema.catch(undefined).parse(rawSearch)

  const sortOptions = sortOptionsParser([
    {
      key: sort ?? 'created_at',
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
): PaginatedResponse<T> => ({
  data: items,
  meta: buildPaginationMeta(page, perPage, totalCount),
})
