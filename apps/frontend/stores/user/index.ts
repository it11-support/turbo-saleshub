import { DataTableSortMeta } from 'primereact/datatable'
import { create } from 'zustand'

import { $api, createUrl } from '@/lib/api'
import { IUserState } from '@saleshub-tsm/types'

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
        ...(selectedRoles && selectedRoles.length > 0 ? { roles: selectedRoles } : {}),
      }

      const url = createUrl('user', payload)
      const res = await $api<any>(url)
      const { data } = res
      set({ users: data.items, totalRecords: data.totalRecords, loading: false })
    } catch (error) {
      console.log(error)
      set({ loading: false })
    }
  },
  fetchUserById: async (id) => {
    try {
      set({ loading: true })
      const res = await fetch(`/user/${id}`)
      if (res.ok) {
        const data = await res.json()
        set({ loading: false })
        return data
      } else {
        set({ loading: false })
        return null
      }
    } catch (error) {
      console.error(error)
      set({ loading: false })
      return null
    }
  },
  createUser: async (data) => {
    try {
      set({ loading: true })
      const url = createUrl('user')
      const res = await $api<any>(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (res.ok) {
        const newUser = await res.json()
        set((state) => ({
          users: [...state.users, newUser],
          totalRecords: state.totalRecords + 1,
          loading: false,
        }))
        return newUser
      } else {
        set({ loading: false })
        return null
      }
    } catch (error) {
      console.error(error)
      set({ loading: false })
      return null
    }
  },
  updateUser: async (id, data) => {
    try {
      set({ loading: true })
      const url = createUrl(`user/${id}`)

      const res = await $api<any>(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (res.ok) {
        const updatedUser = await res.json()
        set((state) => ({
          users: state.users.map((user) => (user.id === id ? updatedUser : user)),
          loading: false,
        }))
        return updatedUser
      } else {
        set({ loading: false })
        return null
      }
    } catch (error) {
      console.error(error)
      set({ loading: false })
      return null
    }
  },
  deleteUser: async (id) => {
    try {
      set({ loading: true })

      const url = createUrl(`user/${id}`)
      const res = await $api<any>(url, { method: 'DELETE' })
      if (res.ok) {
        set((state) => ({
          users: state.users.filter((user) => user.id !== id),
          totalRecords: state.totalRecords - 1,
          loading: false,
        }))
        return true
      } else {
        set({ loading: false })
        return false
      }
    } catch (error) {
      console.error(error)
      set({ loading: false })
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
