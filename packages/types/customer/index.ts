import { ISalesPerson } from "../user"
import { ISalesInvoices } from '../sales'
import { ISubGroup } from "../subgroups";

export interface ICustomer {
  id: bigint;
  CardCode: string;
  CardName?: string | null;
  GroupName?: string | null;
  CntctPrsn?: string | null;
  Phone1?: string | null;
  Cellular?: string | null;
  SlpCode?: number | null;
  SalesName?: string | null;
  Territory?: number | null;
  Address?: string | null;
  Block?: string | null;
  City?: string | null;
  ZipCode?: string | null;
  Country?: string | null;
  PaymentTerm?: string | null;
  PriceList?: string | null;
  JoinDate?: Date | null;
  NonActive?: string | 'Y' | 'N' | null;
  subgroup?: ISubGroup | null;
  created_at?: Date | null;
  updated_at?: Date | null;
  sales_invoices?: ISalesInvoices[] | null;
  // Relasi (dari sales_persons)
  sales_person?: ISalesPerson | null;
}
