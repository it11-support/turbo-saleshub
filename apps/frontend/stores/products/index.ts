import { ProductStoreState } from '@saleshub-tsm/types'
import { create } from 'zustand'

import { $api, createUrl } from '@/lib/api'
import { jsonBody, withLoading } from '@/lib/storeHelper'

const initialState = {
  data: [] as any[],
  loading: false,
  page: 1,
  total: 0,
  totalPages: 0,
  limit: 20,
  search: '',
  categories: [] as { value: number; label: string }[],
  selectedCategory: undefined,
  isProductFocused: false,
  isDistributor: false,
  selectedGroup: undefined,
}

export const useProductsStore = create<ProductStoreState>((set, get) => ({
  ...initialState,

  setSearch(search) {
    set({ search, page: 1 }) // reset page saat search berubah
  },
  setSelectedGroup(selectedGroup) {
    set({ selectedGroup })
  },
  setIsProductFocused(isProductFocused) {
    set({ isProductFocused })
  },
  setIsDistributor(isDistributor) {
    set({ isDistributor })
  },

  setSelectedCategory(selectedCategory) {
    set({ selectedCategory, page: 1 }) // reset page saat filter berubah
  },

  setCategories(categories) {
    set({ categories })
  },

  setPage(page) {
    set({ page })
  },

  setLimit(limit) {
    set({ limit, page: 1 }) // reset page saat limit berubah
  },

  updateProductInfo: async (product_id, productInfo) => {
    try {
      const url = createUrl('product/info')
      await $api<any>(url, jsonBody({ product_id, productInfo }))
    } catch (error) {
      console.error('Error updating product:', error)
    }
  },

  fetchProducts: async () => {
    const {
      page,
      limit,
      search,
      selectedCategory,
      isProductFocused,
      isDistributor,
      selectedGroup,
    } = get()

    try {
      await withLoading(
        set,
        async () => {
          const url = createUrl('product', {
            page,
            limit,
            search,
            category: selectedCategory,
            productFocused: isProductFocused,
            distributor: isDistributor,
            group: selectedGroup,
          })
          const res = await $api<any>(url)

          const productCategories =
            res.data.categories?.map((cat: any) => ({
              value: cat.ItmsGrpCod,
              label: cat.ItmsGrpNam,
            })) || []

          // hitung totalPages jika backend tidak mengirim
          const totalPages =
            res.data.totalPages ?? (Math.ceil((res.data.totalRecords || 0) / limit) || 1)

          set({
            data: res.data.items || [],
            total: res.data.totalRecords || 0,
            totalPages,
            categories: productCategories,
          })
        },
        console.error
      )
    } catch {
      set({
        data: [],
        total: 0,
        totalPages: 1,
      })
    }
  },

  reset: () => set({ ...initialState }),
}))
