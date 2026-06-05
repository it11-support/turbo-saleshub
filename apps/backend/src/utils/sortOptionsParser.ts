import { SortOption } from "@saleshub-tsm/types"

export function sortOptionsParser(sort_options: any): SortOption[] {
  let parsed: SortOption[] = []

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

  return parsed.filter((s): s is SortOption => !!s.key && !!s.order)
}

export function convertToPrismaOrderBy(sortOptions: SortOption[]): any[] {
  return sortOptions.map((sort) => {
    const keys = sort.key.split('.')
    const order = keys.reduceRight((acc: any, key: string, idx: number) => {
      if (idx === keys.length - 1) return { [key]: sort.order }
      return { [key]: acc }
    }, {})

    return order
  })
}
