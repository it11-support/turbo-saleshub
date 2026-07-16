import { ICustomer, ICustomerState } from '@saleshub-tsm/types'
import { getCookie } from 'cookies-next'
import { create } from 'zustand'

import { $api, createUrl } from '@/lib/api'
import { jsonBody, withLoading } from '@/lib/storeHelper'

export const useCustomerStore = create<ICustomerState>()((set, get) => ({
  newCustomerForm: {},
  groupOptions: [],
  customer: null,
  isNewCustomer: false,
  itemCount: 0,
  customers: [],
  loading: false,
  slpCode: null,
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
  suggestedItems: { distributor: [], groceries: [] },
  totalRecords: 0,
  lastPurchase: [],
  ordersByRange: { current: 0, last3Months: 0, last6Months: 0 },
  invoiceCountByRange: { current: 0, last3Months: 0, last6Months: 0 },
  setLastPurchase: (lastPurchase: any[]) => set({ lastPurchase }),
  setInvoiceCountByRange: (invoiceCountByRange: any) => set({ invoiceCountByRange }),
  setOrdersByRange(ordersByRange) {
    set({ ordersByRange })
  },
  setNewCustomerForm(form) {
    set({ newCustomerForm: form })
  },
  setIsNewCustomer(isNewCustomer) {
    set({ isNewCustomer })
  },
  setSlpCode(slpCode) {
    set({ slpCode })
  },
  setLoyaltyLevel: (loyaltyLevel: string[]) => set({ loyaltyLevel }),
  fetchCustomers: async () => {
    try {
      await withLoading(
        set,
        async () => {
          const userCookie = getCookie('userData')
          const userData = userCookie ? JSON.parse(String(userCookie)) : null
          const loginSlpCode = userData?.sales_person?.SlpCode

          const {
            page,
            limit,
            search,
            multiSortMeta,
            groups,
            salesPersons,
            subgroups,
            itemCount,
            loyaltyLevel,
            slpCode,
            isNewCustomer,
          } = get()

          const finalSlpCode = slpCode ?? loginSlpCode

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
            ...(finalSlpCode ? { slpCode: finalSlpCode } : {}),
            ...(itemCount ? { itemCount } : {}),
            ...(loyaltyLevel ? { loyaltyLevel } : {}),
            ...(isNewCustomer ? { isNewCustomer } : {}),
          }

          const url = createUrl('customers', payload)
          const res = await $api<any>(url)
          const { data, groupNames, salesPersonNames, subGroupNames } = res
          set({ groupNames })
          set({ salesPersonNames })
          set({ subGroupNames })
          set({ customers: data.items, totalRecords: data.totalRecords })
        },
        console.log
      )
    } catch {
      // error logged via withLoading onError
    }
  },
  fetchCustomerSummary: async (id) => {
    try {
      return await withLoading(
        set,
        async () => {
          const url = createUrl(`customers/${id}`)

          const res = await $api<any>(url)

          set({ customer: res.data.customer })
          return res.data
        },
        console.error
      )
    } catch {
      return null
    }
  },
  fetchSuggestedItems: async (id) => {
    try {
      return await withLoading(
        set,
        async () => {
          const url = createUrl(`customers/${id}/suggestions`)
          const res = await $api<any>(url)
          set({ suggestedItems: res.data.suggestions ?? { distributor: [], groceries: [] } })
          return res.data
        },
        console.error
      )
    } catch {
      return null
    }
  },

  fetchPurchaseHistory: async (id) => {
    try {
      return await withLoading(
        set,
        async () => {
          const url = createUrl(`customers/${id}/purchases`)
          const res = await $api<any>(url)
          set({ invoiceCountByRange: res.data.invoiceCountByRange })
          set({ ordersByRange: res.data.ordersByRange })
          set({ lastPurchase: res.data.lastPurchase })
        },
        console.error
      )
    } catch {
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
  fetchCustomerGroupOptions: async () => {
    try {
      const url = createUrl('customers/groups')
      const res = await $api<any>(url)
      set({
        groupOptions: res.data.groups.map((g: any) => ({
          label: g.GroupName,
          value: g.GroupName,
        })),
      })
    } catch (err) {
      console.error(err)
    }
  },
  createNewCustomer: async () => {
    try {
      const { newCustomerForm } = get()
      const url = createUrl('customers')
      const res = await $api<any>(url, jsonBody(newCustomerForm))
      return res.data.newCustomer
    } catch (err) {
      console.error('Failed to create new customer:', err)
      return null
    }
  },
}))
