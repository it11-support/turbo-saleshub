import { SummaryResult } from '../common'
import { ICustomer } from '../customer'
import { IProduct } from '../product'
import { IReturInvoices } from '../retur'

export interface ISalesInvoices {
  id: BigInt | number
  DocNum: number
  DocDate?: Date | string | null
  CardCode?: string | null
  CardName?: string | null
  ItemCode?: string | null
  Dscription?: string | null
  QtyKg?: string | number | null
  unitMsr?: string | null
  PriceBefDisc?: number | null
  DiscLine?: number | null
  DiscTotal?: number | null
  TotalSales?: number | null
  created_at?: string | null
  updated_at?: string | null
  customer?: ICustomer | null
  product: IProduct
  returs?: IReturInvoices[]
}

export interface ISalesSummary {
  month: string
  active_customers: number | null
  volume: number | null
  revenue: number | null
}

export interface IMonthlySummary {
  year: number
  month: number
  revenue: number
  orders: number
  customers: number
}

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

export type Summary = {
  [key: string] : SummaryResult
}
export interface ISalesSummaryState {
  monthlyTrend: IMonthlySummary[]
  customerTrend: {period: string, activeCustomers: number}[],
  slpRevenue: {slp: string, revenue: number}[],
  productRevenueDistributor: { ItemName: string, orders: number, revenue: number}[],
  productRevenueGrocery: { ItemName: string, orders: number, revenue: number}[],
  newVsReturning: {newCustomer: number, returningCustomer: number},
  summary: Summary
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
