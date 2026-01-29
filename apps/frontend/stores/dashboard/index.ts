import { getCookie } from 'cookies-next'
import { create } from 'zustand'

import { $api, createUrl } from '@/lib/api'
import { ISalesSummaryState, TMonthTodateSummary } from '@/types'

export const useDashboardStore = create<ISalesSummaryState>()((set, get) => ({
  monthToDateSummary: {} as TMonthTodateSummary,
  revenueTrend: [],
  orderTrend: [],
  customerTrend: [],
  productRevenue: [],
  aovTrend: [],
  slpRevenue:[],
  salesSummary: {
    mom: {},
    yoy: {},
  },
  monthList: [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ].map((label, index) => ({
    label,
    value: index + 1,
  })),
  companies: [],

  month: new Date().getMonth() + 1,
  setMonth: (val) => set({ month: val }),
  setSalesSummary: (salesSummary) => set({ salesSummary }),
  loading: false,
  fetchSalesSummary: async () => {
    try {
      set({ loading: true })

      const userCookie = getCookie('userData')
      const userData = userCookie ? JSON.parse(String(userCookie)) : null

      const salesPersonId = userData?.sales_person?.id

      const payload = {
        ...(salesPersonId ? { salesPersonId } : {}),
      }

      const url = createUrl('summary', payload)
      const res = await $api<any>(url)
      set({
        monthToDateSummary: {
          revenue: res.data.revenue,
          orders: res.data.orders,
          customers: res.data.customers,
          aov: res.data.aov,
        },
      })

      set({
        revenueTrend: res.data.revenueTrend,
        orderTrend: res.data.orderTrend,
        customerTrend: res.data.customerTrend,
        aovTrend: res.data.aovTrend,
        slpRevenue: res.data.slpRevenue,
        productRevenue: res.data.productRevenue,
      })
    } catch (error) {
      console.error(error)
    } finally {
      set({ loading: false })
    }
  },
}))
