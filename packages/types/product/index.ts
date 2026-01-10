import { ISalesInvoices } from "../sales"

export interface IProduct {
  id: BigInt | number
  ItemCode: string
  ItemName: string
  ItmsGrpNam?: String
  frozenFor?: string
  LaunchDate?: Date
  SalUnitMsr?: String
  AvgPrice?: number
  HargaBeli?: number
  HargaJualNormal?: number
  ItmsGrpCode?: number
  RevenuesAc?: String
  AcctName?: String
  sales_invoices?: ISalesInvoices[]
  created_at?: Date
  updated_at?: Date
}


export type ProductWithFrequency = IProduct & {
  boughtFrequency: number
}

