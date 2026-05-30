import { GenerateResult, IVisit, ScheduleState, VisitScheduleStatus } from '@saleshub-tsm/types'
import { create } from 'zustand'

import { $api, createUrl } from '@/lib/api'

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
    set({ loading: true, error: null })
    const { page, pageSize } = get()

    try {
      const url = createUrl('schedule', { salesPersonId: sales_person_id, page, pageSize })
      const res = await $api<any>(url)

      set({ schedules: res.data, loading: false })
      set({ total: res.total, totalPages: res.totalPages })
    } catch (err: any) {
      set({ error: err.message, loading: false })
    }
  },
  createVisitSchedule: async (data: Partial<IVisit>) => {
    try {
      set({ loading: true })
      const url = createUrl('schedule/create')
      const res = await $api<any>(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const date = new Date(data.visit_date as string)
      await get().fetchScheduleByDate(Number(data.sales_person_id), date.toISOString().slice(0, 10))

      set({ loading: false })
      return res.data
    } catch (error) {
      console.error(error)
      set({ loading: false })
    }
  },
  generateByRules: async (sales_person_id: number, year: number, month: number) => {
    set({ loading: true, error: null })

    try {
      const url = createUrl('schedule/generate')
      const payload = {
        sales_person_id,
        year,
        month,
      }
      const res = await $api<any>(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      // refresh after generating
      await get().fetchBySalesPerson(sales_person_id)

      set({ loading: false })
      return res.data as GenerateResult
    } catch (err: any) {
      set({ error: err.message, loading: false })
      throw err
    }
  },
  updateStatus: async (id: number, status: string) => {
    set({ loading: true })

    try {
      const url = createUrl(`schedule/${id}`)

      const payload = { status }

      await $api<any>(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const schedules = get().schedules.map((item) =>
        item.id === id ? { ...item, status: status as VisitScheduleStatus } : item
      )

      set({ schedules, loading: false })
    } catch (err: any) {
      set({ error: err.message, loading: false })
    }
  },
  deleteSchedule: async (id: number) => {
    set({ loading: true })

    try {
      const url = createUrl(`/schedule/${id}`)
      await $api<any>(url, {
        method: 'DELETE',
      })

      const schedules = get().schedules.filter((s) => s.id !== id)

      set({ schedules, loading: false })
    } catch (err: any) {
      set({ error: err.message, loading: false })
    }
  },
  async fetchScheduleByDate(sales_person_id: number, date: string) {
    set({ loading: true, error: null })
    const { page, pageSize, currentDate } = get()
    const selectedDate = date ?? currentDate

    try {
      const payload: Record<string, any> = {
        salesPersonId: sales_person_id,
        date: selectedDate,
        page,
        pageSize,
      }
      const url = createUrl('schedule', payload)

      const res = await $api<any>(url)

      set({
        schedules: res.data.data,
        loading: false,
        total: res.total,
        totalPages: res.totalPages,
      })
    } catch (err: any) {
      set({ error: err, loading: false })
    }
  },
}))
