import { Response } from 'express'
import { PAGINATION, PER_PAGE } from '@/constants/index.js'

export const internalServerError = <T>(
  res: Response,
  message = 'Internal server error',
  data?: T,
  error?: unknown,
) => {
  return res.status(500).json({
    message,
    ...(data !== undefined && { data }),
    ...(error !== undefined && {
      error: error instanceof Error ? error.message : error,
    }),
  })
}

export const badRequest = (
  res: Response,
  message = 'Bad request',
) => res.status(400).json({ message })

export const notFound = (
  res: Response,
  message = 'Not found',
) => res.status(404).json({ message })

export const forbidden = (
  res: Response,
  message = 'Forbidden',
) => res.status(403).json({ message })

export const success = <T>(
  res: Response,
  data: T,
  message = 'Success',
) => res.status(200).json({ message, data })

export const created = <T>(
  res: Response,
  data: T,
  message = 'Created',
) => res.status(201).json({ message, data })

export const handleApiError = (
  error: unknown,
  res: Response,
  message = 'Internal server error',
  data?: unknown,
) => {
  console.error(error);
  return internalServerError(res, message, data, error);
};

export const parsePagination = (query: any) => {
  const page = Math.max(1, Number(query.page) || PAGINATION.DEFAULT_PAGE)
  const perPage = Math.min(
    PAGINATION.MAX_PER_PAGE,
    Math.max(1, Number(query.per_page) || PER_PAGE)
  )
  return { page, perPage }
}

export const buildPaginationMeta = (page: number, perPage: number, totalCount: number) => {
  const totalPages = Math.ceil(totalCount / perPage) || 1
  return {
    currentPage: page,
    perPage,
    totalRecords: totalCount,
    totalPages,
  }
}

export const buildSuccessResponse = <T>(
  res: Response,
  items: T[],
  page: number,
  perPage: number,
  totalCount: number,
  message = 'Success'
) => {
  const meta = buildPaginationMeta(page, perPage, totalCount)
  res.status(200).json({
    message,
    data: {
      items,
      ...meta,
    },
  })
}
