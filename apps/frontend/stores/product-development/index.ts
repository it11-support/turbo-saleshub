import { IProduct, IProductDevelopmentList, ProductDevelopmentState } from '@saleshub-tsm/types'
import { create } from 'zustand'

import { $api, createUrl } from '@/lib/api'

export const useProductDevelopmentStore = create<ProductDevelopmentState>((set, get) => ({
  loading: false,
  products: [],
  devProducts: [],
  activeProduct: null,
  subgroupIds: [],

  setProducts: (products) => set({ products }),
  setDevProducts: (products) => set({ devProducts: products }),

  setActiveProduct: (product: IProduct) =>
    set({
      activeProduct: product,
      subgroupIds: product.product_developments?.map((d) => d.subgroup_id) || [],
    }),

  setSubgroups: (ids) => set({ subgroupIds: ids }),

  clearActive: () => set({ activeProduct: null, subgroupIds: [] }),

  // sync active product → backend
  sync: async () => {
    const { activeProduct, subgroupIds } = get()
    if (!activeProduct) return
    set({ loading: true })

    try {
      const url = createUrl('product/product-development')
      const payload = { productId: activeProduct.id, subgroupIds }
      const res = await $api(url, {
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
        body: JSON.stringify(payload),
      })

      set({
        subgroupIds: (res.subgroups || []).map((sg: { IndCode: number }) => sg.IndCode),
      })
      // update devProducts store
      set((state) => {
        const serverSubgroups = res.subgroups || []

        const updatedDevProduct: IProductDevelopmentList = {
          id: activeProduct.id,
          ItemCode: activeProduct.ItemCode,
          ItemName: activeProduct.ItemName,
          subgroups: serverSubgroups,
        }

        const exists = state.devProducts.find((p) => p.id === activeProduct.id)

        return {
          devProducts: exists
            ? state.devProducts.map((p) => (p.id === activeProduct.id ? updatedDevProduct : p))
            : [...state.devProducts, updatedDevProduct],
        }
      })
    } catch (err) {
      console.error(err)
    } finally {
      set({ loading: false })
    }
  },

  // remove product dari development
  removeActiveProduct: async () => {
    const { activeProduct } = get()
    if (!activeProduct) return

    const payloads = {
      productId: activeProduct.id,
      subgroupIds: get().subgroupIds,
    }
    try {
      const url = createUrl(`product/development/remove`)
      await $api(url, {
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
        body: JSON.stringify(payloads),
      })

      set((state) => ({
        devProducts: state.devProducts.filter((p) => p.id !== activeProduct.id),
      }))

      get().clearActive()
    } catch (err) {
      console.error(err)
    }
  },
  reset: () =>
    set({
      activeProduct: null,
      subgroupIds: [],
    }),
}))
