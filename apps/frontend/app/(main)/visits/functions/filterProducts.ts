import { ProductWithFrequency } from '@saleshub-tsm/types'

export type GetFilteredProductsParams = {
  activeProductGroup: ProductWithFrequency[]
  offeredProductIds: Set<number | bigint>
  selectedCategories: string[]
  keyword: string
}

export const getFilteredProducts = ({
  activeProductGroup,
  offeredProductIds,
  selectedCategories,
  keyword,
}: GetFilteredProductsParams) => {
  const search = keyword.trim().toLowerCase()

  return activeProductGroup.filter((item) => {
    if (offeredProductIds.has(item.id)) {
      return false
    }

    const matchCategory =
      selectedCategories.length === 0 || selectedCategories.includes(item.ProductCategory ?? '')

    const matchSearch = !search || item.ItemName?.toLowerCase().includes(search)

    return matchCategory && matchSearch
  })
}
