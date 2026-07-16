import { IProduct, IProductDevelopmentList, ProductDevelopmentState } from '@saleshub-tsm/types'
import { create } from 'zustand'

import { $api, createUrl } from '@/lib/api'
import {
  addItemToArray,
  jsonBody,
  removeItemFromArray,
  updateItemInArray,
  withLoading,
} from '@/lib/storeHelper'

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
    try {
      await withLoading(
        set,
        async () => {
          const url = createUrl('product/product-development')
          const payload = { productId: activeProduct.id, subgroupIds }
          const res = await $api(url, jsonBody(payload))

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
                ? updateItemInArray(state.devProducts, activeProduct.id, updatedDevProduct)
                : addItemToArray(state.devProducts, updatedDevProduct),
            }
          })
        },
        console.error
      )
    } catch {
      // error logged via withLoading onError
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
      await withLoading(
        set,
        async () => {
          const url = createUrl(`product/development/remove`)
          await $api(url, jsonBody(payloads))

          set((state) => ({
            devProducts: removeItemFromArray(state.devProducts, activeProduct.id),
          }))

          get().clearActive()
        },
        console.error
      )
    } catch {
      // error logged via withLoading onError
    }
  },
  reset: () =>
    set({
      activeProduct: null,
      subgroupIds: [],
    }),
}))
