import { ISalesSummaryState, Summary } from '@saleshub-tsm/types'
import { create } from 'zustand'

import { MONTH_LONG } from '@/lib/constants'

export const useDashboardStore = create<ISalesSummaryState>()((set, _get) => ({
  customerTrend: { yearly: {}, monthly: {} },
  productRevenueDistributor: [],
  productRevenueGrocery: [],
  productRevenueAll: [],
  newVsReturning: { newCustomer: 0, returningCustomer: 0 },
  summary: {} as Summary,
  CRR: 0,
  RPR: 0,
  RFM: [],
  salesSummary: {
    mom: {},
    yoy: {},
  },
  monthList: MONTH_LONG.map((label, index) => ({
    label,
    value: index + 1,
  })),
  companies: [],

  month: new Date().getMonth() + 1,
  setMonth: (val) => set({ month: val }),
  setSalesSummary: (salesSummary) => set({ salesSummary }),
  loading: false,
}))
