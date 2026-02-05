import { ISalesInvoices } from "../sales"
import { ISubGroup } from "../subgroups"

export interface IProduct {
  id: bigint | number; // ✅

  ItemCode: string;

  ItemName?: string | null;
  ItmsGrpNam?: string | null;
  frozenFor?: string | null;

  LaunchDate?: Date | null;
  SalUnitMsr?: string | null;

  AvgPrice?: number | string | null;
  HargaBeli?: number | string | null;
  HargaJualNormal?: number | string | null;

  ItmsGrpCod?: number | null; // ✅ fixed name

  RevenuesAc?: string | null;
  AcctName?: string | null;

  image?: string | null; // ✅ tambah

  created_at?: Date | null;
  updated_at?: Date | null;

  sales_invoices?: ISalesInvoices[];
  product_developments?: IProductDevelopment[];

  // Report fields
  unitsSold?: number;
  revenue?: number;
}
export interface IProductDevelopment {
  subgroup_id: number
  subgroup: ISubGroup
}
export interface IProductDevelopmentList  {
  id: BigInt | number
  ItemCode: string
  ItemName?: string | null
  subgroups: ISubGroup[]
}
export type ProductWithFrequency = IProduct & {
  boughtFrequency: number
}

