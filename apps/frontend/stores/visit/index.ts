import { create } from 'zustand'

import { $api, createUrl } from '@/lib/api'
import { FollowUpForm, IVisitDetails, IVisitState, OfferedItem } from '@/types'
import { IVisit } from '@saleshub-tsm/types'

export const useSalesVisit = create<IVisitState>()((set, get) => ({
  visitNote: '',
  followUpForm: {} as FollowUpForm,
  setFollowUpForm: (followUpForm: FollowUpForm) => set({ followUpForm }),
  setVisitNote: (note: string) => set({ visitNote: note }),
  offeredItems: [],
  setOfferedItems: (offeredItems: OfferedItem[]) => set({ offeredItems }),
  salesVisit: {} as IVisit,
  setSalesVisit: (salesVisit: IVisit) => set({ salesVisit }),
  loading: false,
  error: null,
  fetchSalesVisit: async (rule_id: number) => {
    try {
      set({ loading: true })
      const url = createUrl(`visit/${rule_id}`)
      const res = await $api<any>(url)

      set({ loading: false, salesVisit: res.data, visitNote: res.data.notes ?? '' })
      const offeredItems =
        res.data.visit_items?.map((item: any) => ({
          product_id: item.product_id,
          offered: Boolean(item.offered),
          notes: item.notes || '',
        })) || []

      set({ offeredItems })

      return res.data
    } catch (error) {
      console.error(error)
      set({ loading: false })
      return null
    }
  },
  syncOfferedItems: async (data: IVisitDetails) => {
    try {
      set({ loading: true })
      const payload = {
        visit_items: Object.entries(data).flatMap(([productId, categories]) => ({
          product_id: Number(productId),
          visitNote: get().visitNote,
          concerns: Object.entries(categories as Record<string, { notes: string; statusId: number }>).map(([categoryId, detail]) => ({
            concern_id: Number(categoryId),
            note: detail.notes,
            status_id: detail.statusId
          }))
        }))
      };

      const url = createUrl(`visit/${get().salesVisit.id}`)
      const res = await $api<any>(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const offeredItems =
        res.data.visit_items?.map((item: any) => ({
          product_id: item.product_id,
          offered: Boolean(item.offered),
          notes: item.notes || '',
        })) || []

      set({ offeredItems, loading: false })
    } catch (error) {
      console.error(error)
      set({ loading: false })
    }
  },
  closeItems: async (data: Record<number, { notes: string; statusId: number | null }>, productIds: number[]) => {
    try {
      set({ loading: true })

      const payload = {
        visit_items: [
          {
            product_ids: productIds,
            visitNote: get().visitNote,
            concerns: Object.entries(data).map(([concernId, detail]) => ({
              concernId: Number(concernId),
              notes: detail.notes,
              statusId: detail.statusId,
            })),
          },
        ],
      }

      const url = createUrl(`visit/${get().salesVisit.id}/close-items`)

      const res = await $api<any>(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const offeredItems =
        res.data.visit_items?.map((item: any) => ({
          product_id: item.product_id,
          offered: Boolean(item.offered),
          notes: item.notes || '',
        })) || []

      set({ offeredItems, loading: false })
    } catch (error) {
      console.error(error)
      set({ loading: false })
    }
  },
  endVisit: async () => {
    try {
      set({ loading: true })

      const url = createUrl(`visit/${get().salesVisit.id}/complete`)
      await $api<any>(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: get().visitNote }),
      })
      set({ loading: false })
    } catch (error) {
      console.error(error)
      set({ loading: false })
    }
  },
  fetchVisitDetails: async (id: number) => {
    try {
      set({ loading: true })
      const url = createUrl(`visit/${id}/details`)
      const res = await $api<any>(url)
      set({ loading: false, salesVisit: res.data })
      return res.data
    } catch (error) {
      console.error(error)
      set({ loading: false })
      return null
    }
  },
  addFollowUp: async () => {
    try {
      set({ loading: true })
      const url = createUrl('visit/follow-up')
      await $api<any>(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(get().followUpForm),
      })
      set({ loading: false })
    } catch (error) {
      set({ loading: false })
      console.error(error)
    }
  },
  startVisit: async (visitId: number) => {
    try {
      const { fetchSalesVisit } = get()
      set({ loading: true })
      const url = createUrl(`visit/${visitId}/start`)
      await $api<any>(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      fetchSalesVisit(visitId)
      set({ loading: false })
    } catch (error) {
      set({ loading: false })
      console.error(error)
    }
  }
}))
