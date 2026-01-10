import { $api, createUrl } from '@/lib/api'
import { formatDate } from 'date-fns'
import { Nullable } from 'primereact/ts-helpers'
import { create } from 'zustand'

interface VisitListState {
  data: any[]
  loading: boolean
  page: number
  total: number
  totalPages: number
  limit: number
  dates: Nullable<(Date | null)[]>
  multiSortMeta: any[]

  fetchVisits: () => Promise<void>
  salesPersonId?: number
  setSalesPersonId: (salesPersonId?: number) => void
  setDates: (dates: Nullable<(Date | null)[]>) => void
  setPage: (page: number) => void
  setLimit: (limit: number) => void
  setMultiSortMeta: (meta: any[]) => void

  reset: () => void
}

const initialState = {
  data: [],
  loading: false,
  page: 1,
  total: 0,
  totalPages: 0,
  limit: 20,
  dates: null,
  multiSortMeta: [{ field: 'visit_date', order: -1 }],
}

export const useVisitsStore = create<VisitListState>((set, get) => ({
  ...initialState,
  setPage(page) {
    set({ page })
  },

  setLimit(limit) {
    set({ limit })
  },
  salesPersonId: undefined,
  setSalesPersonId: (salesPersonId) => set({ salesPersonId }),
  setDates: (dates: Nullable<(Date | null)[]>) => set({ dates }),
  setMultiSortMeta: (meta: any[]) => set({ multiSortMeta: meta }),
  fetchVisits: async () => {
    set({ loading: true })
    const { page, limit, dates, multiSortMeta, salesPersonId } = get()

    console.log(page)
    try {
      const sort_options = JSON.stringify(
        (multiSortMeta || []).map((meta) => ({
          key: meta.field,
          order: meta.order === 1 ? 'asc' : 'desc',
        }))
      )
      const url = createUrl('visits', {
        salesPersonId,
        page,
        limit,
        dates: dates
          ?.map((date) => (date ? formatDate(date, 'yyyy-MM-dd') : null))
          .filter((date): date is string => date !== null),
        sort_options,
      })
      const res = await $api<any>(url)

      set({
        data: res.data.data,
        total: res.data.total,
        totalPages: res.data.totalPages,
        page,
        limit,
        loading: false,
      })
    } catch (err) {
      console.error('fetchVisits error', err)
      set({ loading: false })
    }
  },

  reset: () => set({ ...initialState }),
}))
