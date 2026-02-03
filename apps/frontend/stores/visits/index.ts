import { $api, createUrl } from '@/lib/api'
import { IVisitItem } from '@saleshub-tsm/types'
import { formatDate } from 'date-fns'
import { Nullable } from 'primereact/ts-helpers'
import { create } from 'zustand'

interface VisitListState {
  data: any[]
  loading: boolean
  loadingExport: boolean
  page: number
  total: number
  totalPages: number
  limit: number
  dates: Nullable<(Date | null)[]>
  exportDates: Nullable<(Date | null)[]>
  multiSortMeta: any[]
  exportData: IVisitItem[]
  setExportData: (data: IVisitItem[]) => void
  fetchVisits: () => Promise<void>
  salesPersonId?: number
  setSalesPersonId: (salesPersonId?: number) => void
  setDates: (dates: Nullable<(Date | null)[]>) => void
  setExportDates: (exportDates: Nullable<(Date | null)[]>) => void
  setPage: (page: number) => void
  setLimit: (limit: number) => void
  setMultiSortMeta: (meta: any[]) => void
  fetchExportedData: () => Promise<void>
  reset: () => void
  setLoadingExport: (loading: boolean) => void
}

const initialState = {
  data: [],
  loading: false,
  loadingExport: false,
  page: 1,
  total: 0,
  totalPages: 0,
  limit: 20,
  dates: null,
  exportDates: null,
  multiSortMeta: [{ field: 'visit_date', order: -1 }],
  exportData: [],
}

export const useVisitsStore = create<VisitListState>((set, get) => ({
  ...initialState,
  setPage(page) {
    set({ page })
  },
  setLoadingExport(loading) {
    set({ loadingExport: loading })
  },
  setExportData(data) {
    set({ exportData: data })
  },
  setExportDates(exportDates) {
    set({ exportDates })
  },
  setLimit(limit) {
    set({ limit })
  },
  salesPersonId: undefined,
  fetchExportedData: async () => {
    const { setLoadingExport, exportDates, setExportData, exportData } = get()
    try {
      setLoadingExport(true)
      const url = createUrl('visits/export', {
        dates: exportDates
          ?.filter((d): d is Date => !!d)
          .map((d) => formatDate(d, 'yyyy-MM-dd'))
      })
      const res = await $api(url)
      const { data } = res
      setExportData(data)
      setLoadingExport(false)
    } catch (error) {
      console.error('Failed to fetch sales persons:', error)
    } finally {
      setLoadingExport(false)
    }
  },
  setSalesPersonId: (salesPersonId) => set({ salesPersonId }),
  setDates: (dates: Nullable<(Date | null)[]>) => set({ dates }),
  setMultiSortMeta: (meta: any[]) => set({ multiSortMeta: meta }),
  fetchVisits: async () => {
    set({ loading: true })
    const { page, limit, dates, multiSortMeta, salesPersonId } = get()

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
