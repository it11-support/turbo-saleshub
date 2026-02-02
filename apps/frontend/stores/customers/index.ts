import { ICustomer, ISubGroup } from '@saleshub-tsm/types'
import { getCookie } from 'cookies-next'
import { create } from 'zustand'

import { $api, createUrl } from '@/lib/api'
import { ICustomerState } from '@/types/customer'

export const useCustomerStore = create<ICustomerState>()((set, get) => ({
  customer: null,
  itemCount: 0,
  customers: [],
  loading: false,
  page: 1,
  loyaltyLevel: [],
  limit: 20,
  search: '',
  groupNames: [],
  subGroupNames: [],
  setSubGroupNames: (subGroupNames: string[]) => set({ subGroupNames }),
  salesPersonNames: [],
  setSalesPersonNames: (salesPersonNames: string[]) => set({ salesPersonNames }),
  salesPersons: [],
  setSalesPersons: (salesPersons: string[]) => set({ salesPersons }),
  groups: [],
  subgroups: [],
  subgroupOptions: [],
  setSubgroupOptions: (subgroupOptions: { value: number; label: string }[]) =>
    set({ subgroupOptions }),
  setSubgroups: (subgroups: string[]) => set({ subgroups }),
  setGroups: (groups: string[]) => set({ groups }),
  setGroupNames: (groupNames: string[]) => set({ groupNames }),
  multiSortMeta: [] as any[],
  setCustomer: (customer: ICustomer) => set({ customer }),
  setCustomers: (customers: ICustomer[]) => set({ customers }),
  setLoading: (loading: boolean) => set({ loading }),
  setPage: (page: number) => set({ page }),
  setLimit: (limit: number) => set({ limit }),
  setSearch: (value: string) => set({ search: value }),
  setMultiSortMeta: (meta: any[]) => set({ multiSortMeta: meta }),
  setItemCount: (itemCount: number) => set({ itemCount }),
  suggestedItems: [],
  totalRecords: 0,
  lastPurchase: [],
  ordersByRange: { current: 0, last3Months: 0, last6Months: 0 },
  invoiceCountByRange: { current: 0, last3Months: 0, last6Months: 0 },
  setLastPurchase: (lastPurchase: any[]) => set({ lastPurchase }),
  setInvoiceCountByRange: (invoiceCountByRange: any) => set({ invoiceCountByRange }),
  setOrdersByRange(ordersByRange) {
    set({ ordersByRange })
  },
  setLoyaltyLevel: (loyaltyLevel: string[]) => set({ loyaltyLevel }),
  fetchCustomers: async () => {
    try {
      const userCookie = getCookie('userData')
      const userData = userCookie ? JSON.parse(String(userCookie)) : null
      const slpCode = userData?.sales_person?.SlpCode

      const { page, limit, search, multiSortMeta, groups, salesPersons, subgroups, itemCount, loyaltyLevel } = get()

      set({ loading: true })

      const payload = {
        page,
        per_page: limit,
        sort_options: JSON.stringify(
          (multiSortMeta || []).map((meta) => ({
            key: meta.field,
            order: meta.order === 1 ? 'asc' : 'desc',
          }))
        ),
        ...(search ? { search } : {}),
        ...(groups && groups.length > 0 ? { groups } : {}),
        ...(subgroups && subgroups.length > 0 ? { subgroups } : {}),
        ...(salesPersons && salesPersons.length > 0 ? { salesPersons } : {}),
        ...(slpCode ? { slpCode } : {}),
        ...(itemCount ? { itemCount } : {}),
        ...(loyaltyLevel ? { loyaltyLevel } : {}),
      }

      const url = createUrl('customers', payload)
      const res = await $api<any>(url)
      const { data, groupNames, salesPersonNames, subGroupNames } = res
      set({ groupNames })
      set({ salesPersonNames })
      set({ subGroupNames })
      set({ customers: data.items, totalRecords: data.totalRecords, loading: false })
    } catch (error) {
      console.log(error)
      set({ loading: false })
    }
  },
  fetchCustomerSummary: async (id) => {
    try {
      set({ loading: true })
      const url = createUrl(`customers/${id}`)

      const res = await $api<any>(url)

      set({ customer: res.data.customer })
      return res.data
    } catch (error) {
      console.error(error)
      set({ loading: false })
      return null
    }
  },
  fetchSuggestedItems: async (id) => {
    try {
      set({ loading: true })
      const url = createUrl(`customers/${id}/suggestions`)
      const res = await $api<any>(url)
      set({ loading: false })
      set({ suggestedItems: res.data.suggestions })
      return res.data
    } catch (error) {
      console.error(error)
      set({ loading: false })
      return null
    }
  },

  fetchPurchaseHistory: async (id) => {
    try {
      set({ loading: true })
      const url = createUrl(`customers/${id}/purchases`)
      const res = await $api<any>(url)
      set({ loading: false })
      set({ invoiceCountByRange: res.data.invoiceCountByRange })
      set({ ordersByRange: res.data.ordersByRange })
      set({ lastPurchase: res.data.lastPurchase })
    } catch (error) {
      console.error(error)
      set({ loading: false })
      return null
    }
  },
  fetchSubgroupOptions: async () => {
    try {
      const url = createUrl('customers/subgroups')
      const res = await $api<any>(url)
      set({
        subgroupOptions: res.data.subgroups.map((sg: any) => ({
          label: sg.IndName,
          value: sg.IndCode,
        })),
      })
    } catch (err) {
      console.error(err)
    }
  },
}))
