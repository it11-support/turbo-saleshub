import { IUserState } from '@saleshub-tsm/types'
import { DataTableSortMeta } from 'primereact/datatable'
import { create } from 'zustand'

import { $api, createUrl } from '@/lib/api'
import {
  addItemToArray,
  jsonBody,
  removeItemFromArray,
  updateItemInArray,
  withLoading,
} from '@/lib/storeHelper'

export const useUserStore = create<IUserState>()((set, get) => ({
  user: null,
  users: [],
  loading: false,
  totalRecords: 0,
  selectedRoles: [],
  setSelectedRoles: (roles) => set({ selectedRoles: roles }),
  page: 1,
  limit: 10,
  search: '',
  multiSortMeta: [] as DataTableSortMeta[],
  setPage: (page) => set({ page }),
  setLimit: (limit) => set({ limit }),
  setSearch: (value) => set({ search: value }),
  setMultiSortMeta: (meta) =>
    set((state) => ({
      multiSortMeta: meta ?? state.multiSortMeta,
    })),
  salesPersons: [],
  salesPerson: null,
  setSalesPersons: (salesPersons) => set({ salesPersons }),
  setSalesPerson: (salesPerson) => set({ salesPerson }),
  roles: [],
  setRoles: (roles) => set({ roles }),
  setUsers: (users) => set({ users }),
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  fetchUsers: async () => {
    try {
      const { page, limit, search, multiSortMeta, selectedRoles } = get()

      await withLoading(
        set,
        async () => {
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
            ...(selectedRoles && selectedRoles.length > 0 ? { roles: selectedRoles } : {}),
          }

          const url = createUrl('user', payload)
          const res = await $api<any>(url)
          const { data } = res
          set({ users: data.items, totalRecords: data.totalRecords })
        },
        console.log
      )
    } catch {
      // error logged via withLoading onError
    }
  },
  fetchUserById: async (id) => {
    try {
      return await withLoading(
        set,
        async () => {
          const url = createUrl(`user/${id}`)
          const res = await $api<any>(url)

          set({ user: res.data })
          return res.data
        },
        console.error
      )
    } catch {
      return null
    }
  },
  createUser: async (data) => {
    try {
      return await withLoading(
        set,
        async () => {
          const url = createUrl('user')
          const res = await $api<any>(url, jsonBody(data))

          const newUser = res.data
          if (!newUser) return null

          set((state) => ({
            users: addItemToArray(state.users, newUser),
            totalRecords: state.totalRecords + 1,
          }))

          return newUser
        },
        console.error
      )
    } catch {
      return null
    }
  },
  updateUser: async (id, data) => {
    try {
      return await withLoading(
        set,
        async () => {
          const url = createUrl(`user/${id}`)

          const res = await $api<any>(url, jsonBody(data, 'PUT'))

          const updatedUser = res.data
          if (!updatedUser) return null

          set((state) => ({
            users: updateItemInArray(state.users, id, updatedUser),
          }))

          return updatedUser
        },
        console.error
      )
    } catch {
      return null
    }
  },
  deleteUser: async (id) => {
    try {
      return await withLoading(
        set,
        async () => {
          const url = createUrl(`user/${id}`)
          await $api<any>(url, { method: 'DELETE' })

          set((state) => ({
            users: removeItemFromArray(state.users, id),
            totalRecords: state.totalRecords - 1,
          }))

          return true
        },
        console.error
      )
    } catch {
      return false
    }
  },
  fetchRoles: async () => {
    try {
      const url = createUrl('roles')
      const res = await $api<any>(url)
      const { data } = res
      set({ roles: data.roles })
    } catch (error) {
      console.error(error)
    }
  },
  fetchSalesPersons: async (withFilterUser = true) => {
    try {
      const url = createUrl('sales-persons', { withFilterUser })
      const res = await $api<any>(url)
      const { data } = res
      set({ salesPersons: data.salesPersons })
    } catch (error) {
      console.error(error)
    }
  },
}))
