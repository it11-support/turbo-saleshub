import { IMonthlySummary, ISalesSummary } from '@saleshub-tsm/types'

export type TRevenueSummary = {
  current: number
  last: number
  diff: number
  growthPercent: number
}
export type TMonthTodateSummary = {
  [key: string]: TRevenueSummary
}
export type ISalesSummaryResponse = Record<string, ISalesSummary[]>

export interface ISalesSummaryState {
  monthlyTrend: IMonthlySummary[]
  customerTrend: {period: string, activeCustomers: number}[],
  slpRevenue: {slp: string, revenue: number}[],
  productRevenueDistributor: { ItemName: string, orders: number, revenue: number}[],
  productRevenueGrocery: { ItemName: string, orders: number, revenue: number}[],
  newVsReturning: {newCustomer: number, returningCustomer: number},
  CRR: number,
  RPR: number,
  RFM: {segment: string, count: number}[],
  monthList: { value: number; label: string }[]
  month: number
  salesSummary: {
    mom: Record<string, Partial<ISalesSummary>[]>
    yoy: Record<string, Partial<ISalesSummary>[]>
  }
  setSalesSummary: (salesSummary: {
    mom: Record<string, Partial<ISalesSummary>[]>
    yoy: Record<string, Partial<ISalesSummary>[]>
  }) => void
  loading: boolean
  companies: { label: string; value: string }[]
  fetchSalesSummary: () => void
  setMonth: (val: number) => void
}
