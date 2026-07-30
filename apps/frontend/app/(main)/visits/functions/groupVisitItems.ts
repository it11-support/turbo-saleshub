import { IVisitItem } from '@saleshub-tsm/types'

export interface GroupedVisitItems {
  distributor: Array<{
    category: string
    items: IVisitItem[]
  }>
  groceries: IVisitItem[]
}

export const groupVisitItems = (visitItems: IVisitItem[] = []): GroupedVisitItems => {
  return visitItems.reduce<GroupedVisitItems>(
    (acc, item) => {
      const product = item.product

      if (!product) {
        return acc
      }

      if (product.Distributor === 'Y') {
        const category = product.ProductCategory || 'Uncategorized'

        let group = acc.distributor.find((g) => g.category === category)

        if (!group) {
          group = {
            category,
            items: [],
          }

          acc.distributor.push(group)
        }

        group.items.push(item)
      } else {
        acc.groceries.push(item)
      }

      return acc
    },
    {
      distributor: [],
      groceries: [],
    }
  )
}
