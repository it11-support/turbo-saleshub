import { ISalesInvoices } from "../sales"
import { ISubGroup } from "../subgroups"

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
  product_developments?: IProductDevelopment[]
  unitsSold?: number
  revenue?: number
}
export interface IProductDevelopment {
  subgroup_id: number
  subgroup: ISubGroup
}
export interface IProductDevelopmentList  {
  id: BigInt | number
  ItemCode: string
  ItemName: string
  subgroups: ISubGroup[]
}
export type ProductWithFrequency = IProduct & {
  boughtFrequency: number
}

