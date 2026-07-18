import { useMemo } from 'react'
import useSWR, { SWRConfiguration } from 'swr'

import { fetcher } from '@/app/(main)/lib'
import { createUrl } from '@/lib/api'

export type QueryValue = string | number | boolean | null | undefined | string[] | number[]
type QueryParams = Record<string, QueryValue>

const buildKey = (path: string | null | undefined, query?: QueryParams, enabled = true) => {
  if (!path || enabled === false) return null
  return createUrl(path, query)
}
export const useFetch = <TResponse>(
  path: string | null | undefined,
  query?: QueryParams,
  options?: SWRConfiguration<TResponse> & {
    enabled?: boolean
  }
) => {
  const { enabled = true, ...swrOptions } = options ?? {}

  const key = useMemo(() => buildKey(path, query, enabled), [path, JSON.stringify(query), enabled])

  return useSWR<TResponse>(key, fetcher, swrOptions)
}
