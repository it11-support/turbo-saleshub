import {
  CreateScheduleResponse,
  GenerateScheduleResponse,
  IVisit,
  ScheduleListResponse,
  ScheduleState,
  VisitScheduleStatus,
} from '@saleshub-tsm/types'
import { create } from 'zustand'

import { $api, createUrl } from '@/lib/api'
import { jsonBody, removeItemFromArray, updateItemInArray, withLoading } from '@/lib/storeHelper'

export const useScheduleStore = create<ScheduleState>((set, get) => ({
  currentDate: new Date().toISOString().slice(0, 10),
  setCurrentDate: (date: string) => set({ currentDate: date }),
  schedules: [],
  loading: false,
  error: null,
  pageSize: 25,
  page: 1,
  total: 0,
  totalPages: 0,
  setTotal: (total: number) => set({ total }),
  setTotalPages: (totalPages: number) => set({ totalPages }),
  setPage: (page: number) => set({ page }),

  fetchBySalesPerson: async (sales_person_id: number) => {
    const { page, pageSize } = get()

    try {
      await withLoading(
        set,
        async () => {
          const url = createUrl('schedule', { salesPersonId: sales_person_id, page, pageSize })
          const res = await $api<ScheduleListResponse>(url)

          set({ schedules: res.data.data })
          set({ total: res.data.total })
        },
        (err) => set({ error: err instanceof Error ? err.message : null })
      )
    } catch {
      // error logged via withLoading onError
    }
  },
  createVisitSchedule: async (data: Partial<IVisit>) => {
    try {
      return await withLoading(
        set,
        async () => {
          const url = createUrl('schedule/create')
          const res = await $api<CreateScheduleResponse>(url, jsonBody(data))

          const date = new Date(data.visit_date as string)
          await get().fetchScheduleByDate(
            Number(data.sales_person_id),
            date.toISOString().slice(0, 10)
          )

          return res.data
        },
        console.error
      )
    } catch {
      return null
    }
  },
  generateByRules: async (sales_person_id: number, year: number, month: number) => {
    return withLoading(
      set,
      async () => {
        const url = createUrl('schedule/generate')
        const payload = {
          sales_person_id,
          year,
          month,
        }
        const res = await $api<GenerateScheduleResponse>(url, jsonBody(payload))

        // refresh after generating
        await get().fetchBySalesPerson(sales_person_id)

        return res.data
      },
      (err) => set({ error: err instanceof Error ? err.message : null })
    )
  },
  updateStatus: async (id: number, status: string) => {
    try {
      await withLoading(
        set,
        async () => {
          const url = createUrl(`schedule/${id}`)

          const payload = { status }

          await $api<CreateScheduleResponse>(url, jsonBody(payload, 'PUT'))

          set((state) => ({
            schedules: updateItemInArray(state.schedules, id, {
              ...state.schedules.find((item) => item.id === id),
              status: status as VisitScheduleStatus,
            } as any),
          }))
        },
        (err) => set({ error: err instanceof Error ? err.message : null })
      )
    } catch {
      // error logged via withLoading onError
    }
  },
  deleteSchedule: async (id: number) => {
    try {
      await withLoading(
        set,
        async () => {
          const url = createUrl(`/schedule/${id}`)
          await $api<CreateScheduleResponse>(url, {
            method: 'DELETE',
          })

          set((state) => ({
            schedules: removeItemFromArray(state.schedules, id),
          }))
        },
        (err) => set({ error: err instanceof Error ? err.message : null })
      )
    } catch {
      // error logged via withLoading onError
    }
  },
  fetchScheduleByDate: async (sales_person_id: number, date: string) => {
    const { page, pageSize, currentDate } = get()
    const selectedDate = date ?? currentDate

    try {
      await withLoading(
        set,
        async () => {
          const payload: Record<string, any> = {
            salesPersonId: sales_person_id,
            date: selectedDate,
            page,
            pageSize,
          }
          const url = createUrl('schedule', payload)

          const res = await $api<ScheduleListResponse>(url)

          set({
            schedules: res.data.data,
            total: res.data.total,
          })
        },
        (err) => set({ error: err instanceof Error ? err.message : null })
      )
    } catch {
      // error logged via withLoading onError
    }
  },
}))
