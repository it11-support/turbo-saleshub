
import { Decimal } from '@prisma/client/runtime/client.js'

export type MonthlySummary = {
  year: number
  month: number
  revenue: number
  orders: number
  customers: number
}

export type MtdValue = {
  revenue: number
  orders: number
  customers: number
  aov: number
}

export type GrowthValue = {
  revenue: number // %
  orders: number  // %
  customers: number // %
  aov: number // %
}

export type MtdResult = {
  current: MtdValue
  previous: MtdValue
  growth: GrowthValue
}

export interface ICalcNetRevParams {
  DocNum: number
  TotalSales: Decimal | null
  returs?: {
    TotalSales: Decimal | null
  }[]
}
