import { $api, createUrl } from "@/lib/api";
import { IConcernState } from "@saleshub-tsm/types";
import { create } from "zustand";

export const useConcernStore = create<IConcernState>()((set, get) => ({
  concernCategory: null,
  concernStatus: null,
  loading: false,
  concernCategories: [],
  concernStatuses: [],
  name: '',
  description: '',
  fetchConcernCategories: async () => {
    try {
      set({ loading: true })
      const url = createUrl('concern-categories')
      const res = await $api<any>(url)
      set({ loading: false })
      const payload = res?.data ?? res
      const concernCategories = payload?.concernCategories ?? payload?.data?.concernCategories ?? []
      set({ concernCategories })
      return concernCategories
    } catch (error) {
      console.error(error)
      set({ loading: false })
      return []
    }
  },

  fetchConcernStatuses: async () => {
    try {
      set({ loading: true })
      const url = createUrl('concern-categories/statuses')
      const res = await $api<any>(url)
      set({ loading: false })
      const payload = res?.data ?? res
      const concernStatuses = payload?.concernStatuses ?? payload?.data?.concernStatuses ?? []

      console.log('concernStatuses', concernStatuses)
      set({ concernStatuses })
      return concernStatuses
    } catch (error) {
      console.error(error)
      set({ loading: false })
      return []
    }
  },
  createCategory: async (data) => {
    try {
      const { concernCategories } = get()
      set({ loading: true })
      const url = createUrl('concern-categories')
      const res = await $api<any>(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      set({ loading: false })
      const payload = res?.data ?? res
      const newCategory = payload?.data ?? payload?.category ?? payload
      if (!newCategory) return null

      const newCategories = [...concernCategories, newCategory]
      set({ concernCategories: newCategories })
      return newCategory
    } catch (error) {
      console.error(error)
      set({ loading: false })
      return null
    }
  },
  createStatus: async (data) => {
    try {
      set({ loading: true })

      const url = createUrl('concern-categories/statuses')

      const res = await $api<any>(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      set({ loading: false })

      const payload = res?.data ?? res
      const newStatus = payload
      console.log('newStatus', payload)
      if (!newStatus) return null

      set((state) => ({
        concernStatuses: [...state.concernStatuses, newStatus],
      }))

      return newStatus
    } catch (error) {
      console.error(error)
      set({ loading: false })
      return null
    }
  },
  updateStatus: async (id, data) => {
    try {
      set({ loading: true })
      const url = createUrl(`concern-categories/statuses/${id}`)
      const res = await $api<any>(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      set({ loading: false })

      const payload = res?.data ?? res
      const updatedStatus = payload

      console.log('updatedStatus', updatedStatus)
      if (!updatedStatus) return null

      set({
        concernStatuses: get().concernStatuses.map((status) =>
          Number(status?.id) === id ? updatedStatus : status
        ),
      })

      return updatedStatus
    } catch (error) {
      console.error(error)
      set({ loading: false })
      return null
    }
  },
  deleteStatus: async (id) => {
    try {
      set({ loading: true })
      const url = createUrl(`concern-categories/statuses/${id}`)
      $api<any>(url, {
        method: 'DELETE',
      })
      set({ loading: false })
      set({
        concernStatuses: get().concernStatuses.filter((status) => Number(status?.id) !== id),
      })
      return true
    } catch (error) {
      console.error(error)
      set({ loading: false })
      return false
    }
  },

  updateCategory: async (id, data) => {
    try {
      set({ loading: true })
      const url = createUrl(`concern-categories/${id}`)
      const res = await $api<any>(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      set({ loading: false })

      const payload = res?.data ?? res
      const updatedCategory = payload?.data ?? payload?.category ?? payload
      if (!updatedCategory) return null

      set({
        concernCategories: get().concernCategories.map((category) =>
          Number(category?.id) === id ? updatedCategory : category
        ),
      })

      return updatedCategory
    } catch (error) {
      console.error(error)
      set({ loading: false })
      return null
    }
  },
  deleteCategory: async (id) => {
    try {
      set({ loading: true })
      const url = createUrl(`concern-categories/${id}`)
      await $api<any>(url, {
        method: 'DELETE',
      })
      set({ loading: false })

      set({
        concernCategories: get().concernCategories.filter((category) => Number(category?.id) !== id),
      })

      return true
    } catch (error) {
      console.error(error)
      set({ loading: false })
      return false
    }
  },
}))
