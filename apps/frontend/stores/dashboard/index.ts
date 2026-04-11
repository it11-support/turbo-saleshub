import { getCookie } from 'cookies-next'
import { create } from 'zustand'

import { $api, createUrl } from '@/lib/api'
import { ISalesSummaryState, Summary, TRevenueSummary } from '@/types'

export const useDashboardStore = create<ISalesSummaryState>()((set, get) => ({
  monthlyTrend: [],
  customerTrend: [],
  productRevenueDistributor: [],
  productRevenueGrocery: [],
  aovTrend: [],
  slpRevenue:[],
  newVsReturning: {newCustomer: 0, returningCustomer: 0},
  summary: {} as Summary,
  CRR: 0,
  RPR: 0,
  RFM: [],
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
        customerTrend: res.data.customerTrend,
        slpRevenue: res.data.slpRevenue,
        productRevenueDistributor: res.data.productRevenueDistributor,
        productRevenueGrocery: res.data.productRevenueGrocery,
        newVsReturning: res.data.newVsReturning,
        CRR: res.data.CRR,
        RPR: res.data.RPR,
        RFM: res.data.RFM,
        monthlyTrend: res.data.monthlyTrend,
        summary: res.data.summary,
      })
    } catch (error) {
      console.error(error)
    } finally {
      set({ loading: false })
    }
  },
}))
