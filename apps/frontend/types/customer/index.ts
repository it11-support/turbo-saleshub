import { ICustomer, ISalesInvoices, SuggestedItemsGrouped } from '@saleshub-tsm/types'

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
  multiSortMeta: any[]
  groupNames: string[]
  salesPersonNames: string[]
  loyaltyLevel: string[] | []
  subGroupNames: string[] | []
  subgroupOptions: { value: number; label: string }[]
  // groupOptions: { value: number; label: string }[]
  slpCode: number | null
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
