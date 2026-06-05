import { SortOption } from "@saleshub-tsm/types"

const FORBIDDEN_KEYS = new Set([
  '__proto__',
  'prototype',
  'constructor'
])

const isSafePath = (path: string): boolean => {
  return path
    .split('.')
    .every(
      (part) =>
        part.length > 0 &&
        /^[a-zA-Z0-9_]+$/.test(part) &&
        !FORBIDDEN_KEYS.has(part)
    )
}

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

export const sortOptionsParser = (sort_options: unknown): SortOption[] => {
  let parsed: unknown[] = []

  if (Array.isArray(sort_options)) {
    parsed = sort_options
  } else if (typeof sort_options === 'object' && sort_options !== null) {
    parsed = Object.values(sort_options)
  } else if (typeof sort_options === 'string') {
    try {
      parsed = JSON.parse(sort_options)
    } catch {
      parsed = []
    }
  }
  return parsed.filter(isSortOption)
}

export function convertToPrismaOrderBy(sortOptions: SortOption[]): Record<string, unknown>[] {
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
