import { ExportVisitResponse, VisitListResponse, VisitListState } from '@saleshub-tsm/types'
import { DataTableSortMeta } from '@saleshub-tsm/types'
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
  multiSortMeta: [{ field: 'visit_date', order: -1 }] as DataTableSortMeta[],
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
    const { exportDates, salesPersonFilter } = get()

    // Validasi tanggal yang dipilih
    const dates = exportDates?.filter(
      (d): d is Date => d instanceof Date && !Number.isNaN(d.getTime())
    )

    // Wajib ada rentang tanggal lengkap
    if (!dates || dates.length !== 2) {
      set({
        exportData: [],
      })
      return
    }

    try {
      set({
        loadingExport: true,
        exportData: [],
      })

      const url = createUrl('visits/export', {
        dates: dates.map((d) => formatDate(d, 'yyyy-MM-dd')),
        salesPersonId: salesPersonFilter || undefined,
      })

      const res = await $api<ExportVisitResponse>(url)

      set({
        exportData: res.data ?? [],
      })
    } catch (error) {
      console.error('Failed to fetch export data:', error)

      set({
        exportData: [],
      })
    } finally {
      set({
        loadingExport: false,
      })
    }
  },
  setSalesPersonId: (salesPersonId) => set({ salesPersonId }),
  setDates: (dates: Nullable<(Date | null)[]>) => set({ dates }),
  setMultiSortMeta: (meta: DataTableSortMeta[]) => set({ multiSortMeta: meta }),
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
          const res = await $api<VisitListResponse>(url)

          set({
            data: res.data.items.map((item) => item.visits),
            total: res.data.totalRecords,
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
