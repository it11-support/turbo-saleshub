import { $api, createUrl } from "@/lib/api"
import { create } from "zustand"

interface ProductStoreState {
  data: any[]
  loading: boolean
  page: number
  total: number
  totalPages: number
  limit: number
  search: string
  isProductFocused: boolean
  categories: { value: number; label: string }[]
  selectedCategory?: number
  setSelectedCategory: (selectedCategory?: number) => void
  setPage: (page: number) => void
  setCategories: (categories: { value: number; label: string }[]) => void
  setLimit: (limit: number) => void
  setSearch: (search: string) => void
  setIsProductFocused: (isProductFocused: boolean) => void
  fetchProducts: () => Promise<void>
  reset: () => void
}

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
  isProductFocused: true
}

export const useProductsStore = create<ProductStoreState>((set, get) => ({
  ...initialState,

  setSearch(search) {
    set({ search, page: 1 }) // reset page saat search berubah
  },
  setIsProductFocused(isProductFocused) {
    set({ isProductFocused })
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

  fetchProducts: async () => {
    set({ loading: true })
    const { page, limit, search, selectedCategory, isProductFocused } = get()

    try {
      const url = createUrl('product', {
        page,
        limit,
        search,
        category: selectedCategory,
        productFocused: isProductFocused
      })
      const res = await $api<any>(url)

      const productCategories = res.data.categories?.map((cat: any) => ({
        value: cat.ItmsGrpCod,
        label: cat.ItmsGrpNam,
      })) || []

      // hitung totalPages jika backend tidak mengirim
      const totalPages = res.data.totalPages ?? (Math.ceil((res.data.totalRecords || 0) / limit) || 1)


      set({
        data: res.data.items || [],
        total: res.data.totalRecords || 0,
        totalPages,
        categories: productCategories,
      })
    } catch (error) {
      console.error('Error fetching products:', error)
      set({
        data: [],
        total: 0,
        totalPages: 1,
      })
    } finally {
      set({ loading: false })
    }
  },

  reset: () => set({ ...initialState }),
}))
