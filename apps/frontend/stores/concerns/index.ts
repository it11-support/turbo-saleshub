import { IConcernCategory, IConcernState, IConcernStatus } from '@saleshub-tsm/types'
import { create } from 'zustand'

import { $api, createUrl } from '@/lib/api'
import {
  addItemToArray,
  jsonBody,
  removeItemFromArray,
  unwrapData,
  updateItemInArray,
  withLoading,
} from '@/lib/storeHelper'

export const useConcernStore = create<IConcernState>()((set, get) => ({
  concernCategory: null,
  concernStatus: null,
  loading: false,
  concernCategories: [],
  concernStatuses: [],
  name: '',
  description: '',
  setConcernStatus: (status: IConcernStatus) => set({ concernStatus: status }),
  createCategory: async (data: Partial<IConcernCategory>) => {
    try {
      return await withLoading(
        set,
        async () => {
          const { concernCategories } = get()

          const url = createUrl('concern-categories')
          const res = await $api<IConcernCategory>(url, jsonBody(data))

          const newCategory = unwrapData<IConcernCategory>(res)

          if (!newCategory) return null

          set({
            concernCategories: addItemToArray(concernCategories, newCategory),
          })

          return newCategory
        },
        console.error
      )
    } catch {
      return null
    }
  },
  createStatus: async (data: Partial<IConcernStatus>) => {
    try {
      return await withLoading(
        set,
        async () => {
          const url = createUrl('concern-categories/statuses')

          const res = await $api<IConcernStatus>(url, jsonBody(data))

          const newStatus = unwrapData<IConcernStatus>(res)

          if (!newStatus) return null

          set((state) => ({
            concernStatuses: addItemToArray(state.concernStatuses, newStatus),
          }))

          return newStatus
        },
        console.error
      )
    } catch {
      return null
    }
  },
  updateStatus: async (id: number, data: Partial<IConcernStatus>) => {
    try {
      return await withLoading(
        set,
        async () => {
          const url = createUrl(`concern-categories/statuses/${id}`)

          const res = await $api<IConcernStatus>(url, jsonBody(data, 'PUT'))

          const updatedStatus = unwrapData<IConcernStatus>(res)

          if (!updatedStatus) return null

          set((state) => ({
            concernStatuses: updateItemInArray(state.concernStatuses, id, updatedStatus),
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
            concernStatuses: removeItemFromArray(state.concernStatuses, id),
          }))

          return true
        },
        console.error
      )
    } catch {
      return false
    }
  },

  updateCategory: async (id: number, data: Partial<IConcernCategory>) => {
    try {
      return await withLoading(
        set,
        async () => {
          const url = createUrl(`concern-categories/${id}`)

          const res = await $api<IConcernCategory>(url, jsonBody(data, 'PUT'))

          const updatedCategory = unwrapData<IConcernCategory>(res)

          if (!updatedCategory) return null

          set((state) => ({
            concernCategories: updateItemInArray(state.concernCategories, id, updatedCategory),
          }))

          return updatedCategory
        },
        console.error
      )
    } catch {
      return null
    }
  },
  deleteCategory: async (id: number) => {
    try {
      return await withLoading(
        set,
        async () => {
          const url = createUrl(`concern-categories/${id}`)

          await $api(url, {
            method: 'DELETE',
          })

          set((state) => ({
            concernCategories: removeItemFromArray(state.concernCategories, id),
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
