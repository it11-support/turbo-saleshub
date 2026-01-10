export interface ICommonRequestType {
  page?: number
  per_page?: number
  search?: string
  sort_options?: { key: string; order: 'asc' | 'desc' }[]
}

export type PaginationResult<T> = {
  message: string
  data?: {
    items: T[]
    totalRecords: number
    currentPage: number
    perPage: number
    totalPages: number
  }
}
