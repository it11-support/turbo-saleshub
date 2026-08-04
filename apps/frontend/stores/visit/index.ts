import {
  CompleteVisitResponse,
  FollowUpForm,
  FollowUpVisitResponse,
  IGeoLocation,
  IVisit,
  IVisitDetails,
  IVisitState,
  OfferedItem,
  StartVisitOptions,
  UploadVisitImageResponse,
  VisitResponse,
} from '@saleshub-tsm/types'
import { create } from 'zustand'

import { $api, createUrl } from '@/lib/api'
import { jsonBody, withLoading } from '@/lib/storeHelper'

export const useSalesVisit = create<IVisitState>()((set, get) => ({
  visitNote: '',
  location: undefined,
  setLocation: (location?: IGeoLocation) => set({ location }),
  followUpForm: {} as FollowUpForm,
  setFollowUpForm: (followUpForm: FollowUpForm) => set({ followUpForm }),
  setVisitNote: (note: string) => set({ visitNote: note }),
  offeredItems: [],
  setOfferedItems: (offeredItems: OfferedItem[]) => set({ offeredItems }),
  salesVisit: {} as IVisit,
  setSalesVisit: (salesVisit: IVisit) => set({ salesVisit }),
  loading: false,
  error: null,
  uploadVisitImage: async (file: File) => {
    try {
      await withLoading(
        set,
        async () => {
          const visitId = get().salesVisit.id

          if (!visitId) {
            throw new Error('Visit ID not found')
          }

          const formData = new FormData()

          formData.append('image', file)

          const url = createUrl(`visit/${visitId}/images`)

          await $api<UploadVisitImageResponse>(url, {
            method: 'POST',
            body: formData,
          })
        },
        console.error
      )
    } catch {
      // handled by withLoading
    }
  },
  fetchSalesVisit: async (rule_id: number) => {
    try {
      return await withLoading(
        set,
        async () => {
          const url = createUrl(`visit/${rule_id}`)
          const res = await $api<VisitResponse>(url)

          set({ salesVisit: res.data, visitNote: res.data?.notes ?? '' })
          const offeredItems =
            res.data?.visit_items?.map((item) => ({
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
          const res = await $api<VisitResponse>(url, jsonBody(payload))
          const offeredItems =
            res.data?.visit_items?.map((item) => ({
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

          const res = await $api<VisitResponse>(url, jsonBody(payload))

          const offeredItems =
            res.data?.visit_items?.map((item) => ({
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
          await $api<CompleteVisitResponse>(url, jsonBody({ notes: get().visitNote }))
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
          const res = await $api<VisitResponse>(url)
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
          await $api<FollowUpVisitResponse>(url, jsonBody(get().followUpForm))
        },
        console.error
      )
    } catch {
      // error logged via withLoading onError
    }
  },
  startVisit: async (visitId: number, mode?: StartVisitOptions['mode']) => {
    try {
      await withLoading(
        set,
        async () => {
          const { fetchSalesVisit, location } = get()
          const url = createUrl(`visit/${visitId}/start`)
          await $api<VisitResponse>(
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
