import { VisitListState } from '@saleshub-tsm/types'
import { formatDate } from 'date-fns'
import { Nullable } from 'primereact/ts-helpers'
import { create } from 'zustand'

import { $api, createUrl } from '@/lib/api'
import { withLoading } from '@/lib/storeHelper'

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
  salesPersonFilter: null,
  status: undefined,
  needFollowUp: false,
}

export const useVisitsStore = create<VisitListState>((set, get) => ({
  ...initialState,
  setPage(page) {
    set({ page })
  },
  setNeedFollowUp(needFollowUp) {
    set({ needFollowUp })
  },
  setStatus(status) {
    set({ status })
  },
  setSalesPersonFilter(salesPersonFilter) {
    set({ salesPersonFilter })
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
    const { setLoadingExport, exportDates, setExportData, salesPersonFilter } = get()
    try {
      setLoadingExport(true)
      const url = createUrl('visits/export', {
        dates: exportDates?.filter((d): d is Date => !!d).map((d) => formatDate(d, 'yyyy-MM-dd')),
        salesPersonId: salesPersonFilter,
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
    const { page, limit, dates, multiSortMeta, salesPersonId, status, needFollowUp } = get()

    try {
      await withLoading(
        set,
        async () => {
          const sort_options = JSON.stringify(
            (multiSortMeta || []).map((meta) => ({
              key: meta.field,
              order: meta.order === 1 ? 'asc' : 'desc',
            }))
          )
          const url = createUrl('visits', {
            salesPersonId,
            page,
            needFollowUp,
            status,
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
          })
        },
        console.error
      )
    } catch {
      // error logged via withLoading onError
    }
  },

  reset: () => set({ ...initialState }),
}))
