import {
  FollowUpForm,
  IGeoLocation,
  IVisit,
  IVisitDetails,
  IVisitState,
  OfferedItem,
} from '@saleshub-tsm/types'
import { create } from 'zustand'

import { $api, createUrl } from '@/lib/api'
import { jsonBody, withLoading } from '@/lib/storeHelper'

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
      return await withLoading(
        set,
        async () => {
          const url = createUrl(`visit/${rule_id}`)
          const res = await $api<any>(url)

          set({ salesVisit: res.data, visitNote: res.data.notes ?? '' })
          const offeredItems =
            res.data.visit_items?.map((item: any) => ({
              product_id: item.product_id,
              offered: Boolean(item.offered),
              notes: item.notes || '',
            })) || []

          set({ offeredItems })

          return res.data
        },
        console.error
      )
    } catch {
      return null
    }
  },
  syncOfferedItems: async (data: IVisitDetails) => {
    try {
      await withLoading(
        set,
        async () => {
          const payload = {
            visit_items: Object.entries(data).flatMap(([productId, categories]) => ({
              product_id: Number(productId),
              visitNote: get().visitNote,
              concerns: Object.entries(
                categories as Record<string, { notes: string; statusId: number }>
              ).map(([categoryId, detail]) => ({
                concern_id: Number(categoryId),
                note: detail.notes,
                status_id: detail.statusId,
              })),
            })),
          }

          const url = createUrl(`visit/${get().salesVisit.id}`)
          const res = await $api<any>(url, jsonBody(payload))
          const offeredItems =
            res.data.visit_items?.map((item: any) => ({
              product_id: item.product_id,
              offered: Boolean(item.offered),
              notes: item.notes || '',
            })) || []

          set({ offeredItems })
        },
        console.error
      )
    } catch {
      // error logged via withLoading onError
    }
  },
  processItems: async (
    data: Record<number, { notes: string; statusId: number | null }>,
    productIds: number[]
  ) => {
    try {
      await withLoading(
        set,
        async () => {
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

          const res = await $api<any>(url, jsonBody(payload))

          const offeredItems =
            res.data.visit_items?.map((item: any) => ({
              product_id: item.product_id,
              offered: Boolean(item.offered),
              notes: item.notes || '',
            })) || []

          set({ offeredItems })
        },
        console.error
      )
    } catch {
      // error logged via withLoading onError
    }
  },
  endVisit: async () => {
    try {
      await withLoading(
        set,
        async () => {
          const url = createUrl(`visit/${get().salesVisit.id}/complete`)
          await $api<any>(url, jsonBody({ notes: get().visitNote }))
        },
        console.error
      )
    } catch {
      // error logged via withLoading onError
    }
  },
  fetchVisitDetails: async (id: number) => {
    try {
      return await withLoading(
        set,
        async () => {
          const url = createUrl(`visit/${id}/details`)
          const res = await $api<any>(url)
          set({ salesVisit: res.data })
          return res.data
        },
        console.error
      )
    } catch {
      return null
    }
  },
  addFollowUp: async () => {
    try {
      await withLoading(
        set,
        async () => {
          const url = createUrl('visit/follow-up')
          await $api<any>(url, jsonBody(get().followUpForm))
        },
        console.error
      )
    } catch {
      // error logged via withLoading onError
    }
  },
  startVisit: async (
    visitId: number,
    location?: IGeoLocation,
    mode?: 'NO_LOCATION' | 'DISTANCE_TOO_FAR' | 'LOW_ACCURACY'
  ) => {
    try {
      await withLoading(
        set,
        async () => {
          const { fetchSalesVisit } = get()
          const url = createUrl(`visit/${visitId}/start`)
          await $api(
            url,
            jsonBody(
              {
                location,
                mode,
              },
              'POST'
            )
          )
          fetchSalesVisit(visitId)
        },
        console.error
      )
    } catch {
      // error logged via withLoading onError
    }
  },
}))
