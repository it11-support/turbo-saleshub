import { IConcernState, IConcernStatus } from '@saleshub-tsm/types'
import { create } from 'zustand'

import { $api, createUrl } from '@/lib/api'
import { withLoading } from '@/lib/storeHelper'

export const useConcernStore = create<IConcernState>()((set, get) => ({
  concernCategory: null,
  concernStatus: null,
  loading: false,
  concernCategories: [],
  concernStatuses: [],
  name: '',
  description: '',
  setConcernStatus: (status: IConcernStatus) => set({ concernStatus: status }),
  createCategory: async (data) => {
    return withLoading(
      set,
      async () => {
        const { concernCategories } = get()

        const url = createUrl('concern-categories')
        const res = await $api<any>(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })

        console.log(res.data)

        const payload = res?.data ?? res
        const newCategory = payload?.data ?? payload?.category ?? payload

        if (!newCategory) return null

        set({
          concernCategories: [...concernCategories, newCategory],
        })

        return newCategory
      },
      (error) => {
        console.error(error)
      }
    )
  },
  createStatus: async (data) => {
    try {
      return withLoading(
        set,
        async () => {
          const url = createUrl('concern-categories/statuses')

          const res = await $api<any>(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          })

          const payload = res?.data ?? res
          const newStatus = payload

          if (!newStatus) return null

          set((state) => ({
            concernStatuses: [...state.concernStatuses, newStatus],
          }))

          return newStatus
        },
        (error) => {
          console.error(error)
        }
      )
    } catch {
      return null
    }
  },
  updateStatus: async (id, data) => {
    try {
      return withLoading(
        set,
        async () => {
          const url = createUrl(`concern-categories/statuses/${id}`)

          const res = await $api<any>(url, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          })

          const updatedStatus = res?.data ?? res

          if (!updatedStatus) return null

          set((state) => ({
            concernStatuses: state.concernStatuses.map((status) =>
              Number(status.id) === id ? updatedStatus : status
            ),
          }))

          return updatedStatus
        },
        console.error
      )
    } catch {
      return null
    }
  },
  deleteStatus: async (id) => {
    try {
      return await withLoading(
        set,
        async () => {
          const url = createUrl(`concern-categories/statuses/${id}`)

          await $api(url, {
            method: 'DELETE',
          })

          set((state) => ({
            concernStatuses: state.concernStatuses.filter((status) => Number(status.id) !== id),
          }))

          return true
        },
        console.error
      )
    } catch {
      return false
    }
  },

  updateCategory: async (id, data) => {
    try {
      return await withLoading(
        set,
        async () => {
          const url = createUrl(`concern-categories/${id}`)

          const res = await $api<any>(url, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          })

          const payload = res?.data ?? res
          const updatedCategory = payload?.data ?? payload?.category ?? payload

          if (!updatedCategory) return null

          set((state) => ({
            concernCategories: state.concernCategories.map((category) =>
              Number(category.id) === id ? updatedCategory : category
            ),
          }))

          return updatedCategory
        },
        console.error
      )
    } catch {
      return null
    }
  },
  deleteCategory: async (id) => {
    try {
      return await withLoading(
        set,
        async () => {
          const url = createUrl(`concern-categories/${id}`)

          await $api(url, {
            method: 'DELETE',
          })

          set((state) => ({
            concernCategories: state.concernCategories.filter(
              (category) => Number(category.id) !== id
            ),
          }))

          return true
        },
        console.error
      )
    } catch {
      return false
    }
  },
}))
