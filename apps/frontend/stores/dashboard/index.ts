import { getCookie } from 'cookies-next'
import { create } from 'zustand'

import { $api, createUrl } from '@/lib/api'
import { ISalesSummaryState, Summary } from '@saleshub-tsm/types'

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
  loading: false
}))
