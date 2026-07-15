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

const isSortOption = (value: unknown): value is SortOption => {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const sort = value as Record<string, unknown>

  return (
    typeof sort.key === 'string' &&
    (sort.order === 'asc' || sort.order === 'desc')
  )
}

export const sortOptionsParser = (
  sortOptions: readonly SortOption[]
): SortOption[] => sortOptions.filter(isSortOption)

export function convertToPrismaOrderBy<K extends string>(
  sortOptions: readonly SortOption<K>[]
): Record<string, unknown>[] {
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
