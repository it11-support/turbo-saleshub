import { SortOption } from "@saleshub-tsm/types"

const FORBIDDEN_KEYS = new Set([
  '__proto__',
  'prototype',
  'constructor'
])

const assertSafeKey = (key: string): void => {
  if (FORBIDDEN_KEYS.has(key)) {
    throw new Error(`Forbidden sort key: ${key}`)
  }
}

const isOrder = (value: unknown): value is 'asc' | 'desc' =>
  value === 'asc' || value === 'desc'

const toSortOption = (value: unknown): SortOption | null => {
  if (typeof value !== 'object' || value === null) {
    return null
  }

  const item = value as {
    key?: unknown
    order?: unknown
  }

  if (typeof item.key !== 'string') {
    return null
  }

  if (!isOrder(item.order)) {
    return null
  }

  return {
    key: item.key,
    order: item.order,
  }
}

export const sortOptionsParser = (
  sortOptions: unknown
): SortOption[] => {
  if (!Array.isArray(sortOptions)) {
    return []
  }

  return sortOptions
    .map(toSortOption)
    .filter((item): item is SortOption => item !== null)
}

export const convertToPrismaOrderBy = <K extends string>(
  sortOptions: readonly SortOption<K>[]
): Record<string, unknown>[] => {
  return sortOptions.map((sort) => {
    const keys = sort.key.split('.')

    return keys.reduceRight<Record<string, unknown>>(
      (acc, key, index) => {
        assertSafeKey(key)

        const obj = Object.create(null) as Record<string, unknown>

        obj[key] =
          index === keys.length - 1
            ? sort.order
            : acc

        return obj
      },
      Object.create(null) as Record<string, unknown>
    )
  })
}
