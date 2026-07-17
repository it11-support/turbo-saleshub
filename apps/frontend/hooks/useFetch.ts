import { IResObject, IResPaginated, IResSingle } from '@saleshub-tsm/types'
import { useMemo } from 'react'
import useSWR, { KeyedMutator, SWRConfiguration } from 'swr'

import { fetcher } from '@/app/(main)/lib'
import { createUrl } from '@/lib/api'

export type QueryValue = string | number | boolean | null | undefined | string[] | number[]
type QueryParams = Record<string, QueryValue>

type UseFetchOptions = SWRConfiguration & {
  enabled?: boolean
}

const buildKey = (path: string | null | undefined, query?: QueryParams, enabled = true) => {
  if (!path || enabled === false) return null
  return createUrl(path, query)
}

export const useFetch = <T = unknown>(
  path: string | null | undefined,
  query?: QueryParams,
  options: UseFetchOptions = {}
) => {
  const { enabled = true, ...swrOptions } = options
  const queryKey = query ? JSON.stringify(query) : ''
  const key = useMemo(() => buildKey(path, query, enabled), [path, queryKey, enabled])
  const { data, error, isLoading, isValidating, mutate } = useSWR<IResSingle<T>>(
    key,
    fetcher,
    swrOptions
  )

  return {
    data: data?.data,
    message: data?.message,
    error,
    isLoading,
    isValidating,
    mutate: mutate as KeyedMutator<IResSingle<T>>,
  }
}

export const useFetchObject = <T = unknown>(
  path: string | null | undefined,
  query?: QueryParams,
  options: UseFetchOptions = {}
) => {
  const { enabled = true, ...swrOptions } = options
  const queryKey = query ? JSON.stringify(query) : ''
  const key = useMemo(() => buildKey(path, query, enabled), [path, queryKey, enabled])

  const { data, error, isLoading, isValidating, mutate } = useSWR<IResObject<T>>(
    key,
    fetcher,
    swrOptions
  )

  return {
    data: data?.data,
    message: data?.message,
    error,
    isLoading,
    isValidating,
    mutate: mutate as KeyedMutator<IResObject<T>>,
  }
}

export const useFetchPaginated = <T = unknown>(
  path: string | null | undefined,
  query?: QueryParams,
  options: UseFetchOptions = {}
) => {
  const { enabled = true, ...swrOptions } = options
  const queryKey = query ? JSON.stringify(query) : ''
  const key = useMemo(() => buildKey(path, query, enabled), [path, queryKey, enabled])

  console.log(key)
  const { data, error, isLoading, isValidating, mutate } = useSWR<IResPaginated<T>>(
    key,
    fetcher,
    swrOptions
  )

  return {
    data: {
      items: data?.data?.items ?? [],
      perPage: data?.data?.perPage ?? 0,
      totalRecords: data?.data?.totalRecords ?? 0,
      totalPages: data?.data?.totalPages ?? 0,
      currentPage: data?.data?.currentPage ?? 1,
    },
    message: data?.message,
    error,
    isLoading,
    isValidating,
    mutate: mutate as KeyedMutator<IResPaginated<T>>,
  }
}
