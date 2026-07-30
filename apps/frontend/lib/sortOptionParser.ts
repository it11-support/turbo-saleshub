import { DataTableSortMeta } from '@saleshub-tsm/types'
import { createParser } from 'nuqs'

export const parseAsSortMeta = createParser<DataTableSortMeta[]>({
  parse(value) {
    if (!value) return []

    return value.split(',').map((item) => {
      const [field, order] = item.split(':')

      return {
        field,
        order: order === 'desc' ? -1 : 1,
      }
    })
  },

  serialize(value) {
    if (!value.length) return ''

    return value.map((item) => `${item.field}:${item.order}`).join(',')
  },
})
