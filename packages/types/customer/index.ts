import { ISalesPerson } from "../user"
import { ISalesInvoices } from '../sales'
import { ISubGroup } from "../subgroups";
import { CustomerRFM } from "../rfm";
import { SuggestedItemsGrouped } from "../product";
import { Decimal } from "@prisma/client/runtime/client";

export interface ICustomer {
  id: bigint;
  CardCode: string | null;
  LocalCode: string | null;
  isLocal?: boolean;
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
  rfm?: CustomerRFM | null
  lat?: Decimal | null
  lng?: Decimal | null
  accuracy?: Decimal | null
}
export interface CustomerSummary {
  ItemCode: string
  ItemName: string
  QtyKg: number
  TotalSales: number
  count: number
  lastInvDate: Date | string
}

export interface ICustomerSummary {
  month: string
  totalSales: number
  activeItems: number
}
export interface ILastPurchase extends ISalesInvoices {
  hasRetur: boolean
}

export type INewCustomerForm = Partial<ICustomer>

export interface ICustomerState {
  newCustomerForm: INewCustomerForm
  customer: ICustomer | null
  itemCount: number
  customers: ICustomer[]
  loading: boolean
  page: number
  limit: number
  search: string
  isNewCustomer: boolean
  multiSortMeta: any[]
  groupNames: string[]
  salesPersonNames: string[]
  loyaltyLevel: string[] | []
  subGroupNames: string[] | []
  subgroupOptions: { value: number; label: string }[]
  // groupOptions: { value: number; label: string }[]
  slpCode: number | null
  setIsNewCustomer: (isNewCustomer: boolean) => void
  setNewCustomerForm: (form: INewCustomerForm) => void
  setSlpCode: (slpCode: number | null) => void
  setSubgroupOptions: (subgroupOptions: { value: number; label: string }[]) => void
  setSubGroupNames: (subGroupNames: string[]) => void
  setItemCount: (itemCount: number) => void
  setLoyaltyLevel: (loyaltyLevel: string[]) => void
  groups: string[] | []
  setSalesPersonNames: (salesPersons: string[]) => void
  salesPersons: string[] | []
  setSalesPersons: (salesPerson: string[]) => void
  setGroups: (groups: string[]) => void
  setGroupNames: (groupNames: string[]) => void
  subgroups: string[]
  setSubgroups: (subgroups: string[]) => void
  setCustomer: (customer: ICustomer) => void
  setCustomers: (customers: ICustomer[]) => void
  setLoading: (loading: boolean) => void
  setPage: (page: number) => void
  setLimit: (limit: number) => void
  setSearch: (value: string) => void
  setMultiSortMeta: (meta: any[]) => void
  totalRecords: number
  suggestedItems: SuggestedItemsGrouped
  groupOptions: { value: number; label: string }[]
  fetchCustomers: () => Promise<void>
  fetchCustomerSummary: (id: string) => Promise<ICustomer | null>
  fetchCustomerGroupOptions: () => Promise<void>
  fetchSuggestedItems: (id: string) => Promise<any | null>
  fetchPurchaseHistory: (id: string) => Promise<any | null>
  fetchSubgroupOptions: () => Promise<void>
  lastPurchase: ILastPurchase[]
  setLastPurchase: (lastPurchase: ILastPurchase[]) => void
  invoiceCountByRange: { current: number; last3Months: number; last6Months: number }
  setInvoiceCountByRange: (invoiceCountByRange: {
    current: number
    last3Months: number
    last6Months: number
  }) => void
  ordersByRange: { current: number; last3Months: number; last6Months: number }
  setOrdersByRange: (ordersByRange: {
    current: number
    last3Months: number
    last6Months: number
  }) => void

  createNewCustomer: () => Promise<ICustomer | null>
}

export type CustomerInsightPeriod = 1 | 2 | 3 | 6 | 9 | 12
