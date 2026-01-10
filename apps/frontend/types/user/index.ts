import { ISalesPerson, IUser } from '@saleshub-tsm/types'
import { DataTableSortMeta } from 'primereact/datatable'

export interface IRole {
  id: string | bigint
  role: string
  description: string
  created_at: Date
  updated_at: Date
}

export interface IUserState {
  user: IUser | null
  users: IUser[] | []
  selectedRoles: string[] | []
  setSelectedRoles: (roles: string[]) => void
  loading: boolean
  page: number
  limit: number
  search: string
  multiSortMeta: DataTableSortMeta[]
  salesPersons: ISalesPerson[]
  setSalesPersons: (salesPersons: ISalesPerson[]) => void
  salesPerson: ISalesPerson | null
  setSalesPerson: (salesPerson: ISalesPerson | null) => void
  setPage: (page: number) => void
  setLimit: (limit: number) => void
  setSearch: (value: string) => void
  setMultiSortMeta: (meta: DataTableSortMeta[]) => void

  setUsers: (users: IUser[]) => void
  setUser: (user: IUser | null) => void
  setRoles: (roles: IRole[]) => void
  setLoading: (loading: boolean) => void
  totalRecords: number
  roles: IRole[] | []
  fetchUsers: () => Promise<void>
  fetchUserById: (id: number) => Promise<IUser | null>
  createUser: (data: Partial<IUser>) => Promise<IUser | null>
  updateUser: (id: number, data: Partial<IUser>) => Promise<IUser | null>
  deleteUser: (id: number) => Promise<boolean>
  fetchRoles: () => Promise<void>
  fetchSalesPersons: (withFilterUser?: boolean) => Promise<void>
}
