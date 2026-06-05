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
export function sortOptionsParser(sort_options: unknown): SortOption[] {
  let parsed: unknown[] = []

  if (Array.isArray(sort_options)) {
    parsed = sort_options
  } else if (
    typeof sort_options === 'object' &&
    sort_options !== null
  ) {
    parsed = Object.values(sort_options)
  } else if (typeof sort_options === 'string') {
    try {
      const result = JSON.parse(sort_options)
      parsed = Array.isArray(result) ? result : []
    } catch {
      parsed = []
    }
  }

  return parsed.filter(
    (s): s is SortOption =>
      typeof s === 'object' &&
      s !== null &&
      typeof (s as SortOption).key === 'string' &&
      ((s as SortOption).order === 'asc' ||
        (s as SortOption).order === 'desc')
  )
}

export function convertToPrismaOrderBy(sortOptions: SortOption[]): any[] {
  return sortOptions
    .filter((sort) => isSafePath(sort.key))
    .map((sort) => {
      const keys = sort.key.split('.')

      return keys.reduceRight((acc: any, key: string, idx: number) => {
        if (idx === keys.length - 1) {
          return { [key]: sort.order }
        }
        return { [key]: acc }
      }, {})
    })
}
