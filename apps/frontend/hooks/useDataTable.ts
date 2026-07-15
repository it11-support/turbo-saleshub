import { useEffect, useState } from 'react'
import useSWR from 'swr'

import { fetcher } from '@/app/(main)/lib'
import { useDebounce } from '@/hooks/useDebounce'
import { createUrl } from '@/lib/api'

type UseDataTableOptions<T> = {
  endpoint: string
  filters: Record<string, any>
  setFilters: (
    updater: Record<string, any> | ((prev: Record<string, any>) => Record<string, any>),
    options?: any
  ) => void
  transform?: (data: any) => { items: T[]; totalRecords: number; totalPages: number }
  debounceSearch?: boolean
  debounceDelay?: number
}

type UseDataTableReturn<T> = {
  data: T[]
  totalRecords: number
  totalPages: number
  isValidating: boolean
  page: number
  limit: number
  localSearch: string
  setLocalSearch: (value: string) => void
  handlePageChange: (page: number, rows: number) => void
  handleSortChange: (sortMeta: any) => void
}

export function useDataTable<T>({
  endpoint,
  filters,
  setFilters,
  transform,
  debounceSearch = true,
  debounceDelay = 400,
}: UseDataTableOptions<T>): UseDataTableReturn<T> {
  const [localSearch, setLocalSearch] = useState(filters.search || '')
  const debouncedSearch = useDebounce(localSearch, debounceDelay)

  useEffect(() => {
    if (debounceSearch) {
      setFilters({ search: debouncedSearch, page: 1 })
    }
  }, [debouncedSearch])

  const apiUrl = createUrl(endpoint, filters)

  const { data, isValidating } = useSWR(apiUrl, fetcher)

  const defaultTransform = (raw: any) => ({
    items: raw?.data?.items ?? [],
    totalRecords: raw?.data?.totalRecords ?? 0,
    totalPages: raw?.data?.totalPages ?? 0,
  })

  const transformed = transform ? transform(data) : defaultTransform(data)

  const handlePageChange = (page: number, rows: number) => {
    setFilters({ page, limit: rows })
  }

  const handleSortChange = (sortMeta: any) => {
    const sort = sortMeta?.[0]
    if (sort) {
      setFilters(
        {
          sort: sort.field,
          order: sort.order,
        },
        { history: 'replace', shallow: true }
      )
    }
  }

  return {
    data: transformed.items,
    totalRecords: transformed.totalRecords,
    totalPages: transformed.totalPages,
    isValidating,
    page: filters.page || 1,
    limit: filters.limit || 10,
    localSearch,
    setLocalSearch,
    handlePageChange,
    handleSortChange,
  }
}
