import { Response } from 'express'

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



export const handleApiError = (
  error: unknown,
  res: Response,
  message = 'Internal server error',
  data?: unknown,
) => {
  console.error(error);
  return internalServerError(res, message, data, error);
};
