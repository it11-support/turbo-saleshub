import { ICustomer } from '../customer'
import { IProduct } from '../product'
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
}

export interface ISalesSummary {
  month: string
  active_customers: number | null
  volume: number | null
  revenue: number | null
}
