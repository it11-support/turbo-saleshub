import { ICustomer, ISalesInvoices, ProductWithFrequency } from '@saleshub-tsm/types'
export interface ICustomerState {
  customer: ICustomer | null
  customers: ICustomer[]
  loading: boolean
  page: number
  limit: number
  search: string
  active: string[]
  multiSortMeta: any[]
  groupNames: string[]
  salesPersonNames: string[]
  subGroupNames: string[] | []
  setSubGroupNames: (subGroupNames: string[]) => void
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
  setActive: (active: string[]) => void
  totalRecords: number
  suggestedItems: ProductWithFrequency[]
  fetchCustomers: () => Promise<void>
  fetchCustomerSummary: (id: string) => Promise<ICustomer | null>
  fetchSuggestedItems: (id: string) => Promise<any | null>
  fetchPurchaseHistory: (id: string) => Promise<any | null>
  lastPurchase: ISalesInvoices[]
  setLastPurchase: (lastPurchase: ISalesInvoices[]) => void
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
}
