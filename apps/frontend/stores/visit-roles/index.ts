import { ISalesVisitRule, IVisitRulesState } from '@saleshub-tsm/types'
import { create } from 'zustand'

import { $api, createUrl } from '@/lib/api'
import {
  addItemToArray,
  jsonBody,
  removeItemFromArray,
  updateItemInArray,
  withLoading,
} from '@/lib/storeHelper'

export const useVisitRulesStore = create<IVisitRulesState>()((set, get) => ({
  loading: false,

  setLoading: (loading: boolean) => set({ loading }),

  salesVisitRules: [],
  salesVisitRule: null,

  setSalesVisitRules: (salesVisitRules: ISalesVisitRule[]) => set({ salesVisitRules }),

  setSalesVisitRule: (salesVisitRule: ISalesVisitRule | null) => set({ salesVisitRule }),

  fetchSalesVisitRules: async (sales_person_id?: number) => {
    try {
      return await withLoading(
        set,
        async () => {
          const url = createUrl('visit-rules', { sales_person_id })
          const res = await $api<any>(url)
          set({
            salesVisitRules: res.data.visit_rules || [],
          })

          return res.data.visit_rules || []
        },
        console.log
      )
    } catch {
      return []
    }
  },

  createSalesVisitRule: async (data: Partial<ISalesVisitRule>) => {
    try {
      return await withLoading(
        set,
        async () => {
          const url = createUrl('visit-rules/create')

          const res = await $api<any>(url, jsonBody(data))

          const newRule = res.data.salesVisitRule

          set({
            salesVisitRules: addItemToArray(get().salesVisitRules, newRule),
          })

          return newRule
        },
        console.error
      )
    } catch {
      return null
    }
  },

  // 🟡 Update rule
  updateSalesVisitRule: async (id: number, data: Partial<ISalesVisitRule>) => {
    try {
      return await withLoading(
        set,
        async () => {
          const url = createUrl(`visit-rules/${id}/update`)

          const res = await $api<any>(url, jsonBody(data, 'PUT'))

          const updatedRule = res.data.salesVisitRule

          set({
            salesVisitRules: updateItemInArray(get().salesVisitRules, id, updatedRule),
          })

          return updatedRule
        },
        console.error
      )
    } catch {
      return null
    }
  },

  // 🔴 Delete rule
  deleteSalesVisitRule: async (id: number) => {
    try {
      return await withLoading(
        set,
        async () => {
          const url = createUrl(`visit-rules/${id}/delete`)

          await $api<any>(url, {
            method: 'DELETE',
          })

          set({
            salesVisitRules: removeItemFromArray(get().salesVisitRules, id),
          })

          return true
        },
        console.error
      )
    } catch {
      return false
    }
  },
}))
