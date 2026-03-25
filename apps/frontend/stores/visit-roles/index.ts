import { ISalesVisitRule } from '@saleshub-tsm/types'
import { create } from 'zustand'

import { $api, createUrl } from '@/lib/api'
import { IVisitRulesState } from '@/types/visit-rules'

export const useVisitRulesStore = create<IVisitRulesState>()((set, get) => ({
  loading: false,

  setLoading: (loading: boolean) => set({ loading }),

  salesVisitRules: [],
  salesVisitRule: null,

  setSalesVisitRules: (salesVisitRules: ISalesVisitRule[]) => set({ salesVisitRules }),

  setSalesVisitRule: (salesVisitRule: ISalesVisitRule | null) => set({ salesVisitRule }),

  fetchSalesVisitRules: async (sales_person_id?: number) => {
    try {
      set({ loading: true })

      const url = createUrl('visit-rules', { sales_person_id })
      const res = await $api<any>(url)
      set({
        salesVisitRules: res.data.visit_rules || [],
        loading: false,
      })
    } catch (error) {
      console.log('Error fetchSalesVisitRules:', error)
      set({ loading: false })
    }
  },

  createSalesVisitRule: async (data: Partial<ISalesVisitRule>) => {
    try {
      set({ loading: true })

      const url = createUrl('visit-rules/create')

      const res = await $api<any>(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const newRule = res.data.salesVisitRule

      set({
        salesVisitRules: [...get().salesVisitRules, newRule],
        loading: false,
      })

      return newRule
    } catch (error) {
      console.error('Error createSalesVisitRule:', error)
      set({ loading: false })
      return null
    }
  },

  // 🟡 Update rule
  updateSalesVisitRule: async (id: number, data: Partial<ISalesVisitRule>) => {
    try {
      set({ loading: true })

      const url = createUrl(`visit-rules/${id}/update`)

      const res = await $api<any>(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const updatedRule = res.data.salesVisitRule

      set({
        salesVisitRules: get().salesVisitRules.map((rule) =>
          Number(rule.id) === id ? updatedRule : rule
        ),
        loading: false,
      })

      return updatedRule
    } catch (error) {
      console.error('Error updateSalesVisitRule:', error)
      set({ loading: false })
      return null
    }
  },

  // 🔴 Delete rule
  deleteSalesVisitRule: async (id: number) => {
    try {
      set({ loading: true })

      const url = createUrl(`visit-rules/${id}/delete`)

      await $api<any>(url, {
        method: 'DELETE',
      })

      set({
        salesVisitRules: get().salesVisitRules.filter((rule) => Number(rule.id) !== id),
        loading: false,
      })

      return true
    } catch (error) {
      console.error('Error deleteSalesVisitRule:', error)
      set({ loading: false })
      return false
    }
  },
}))
