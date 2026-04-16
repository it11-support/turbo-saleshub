import { DataTableSortMeta } from "../common";
import { ICustomer } from "../customer";
import { IVisit } from "../visit";
import { JwtPayload } from 'jsonwebtoken'

export interface SortMeta {
  field: string;
  order: 1 | 0 | -1 | null | undefined;
}

export interface IRole {
  id: BigInt | string | number;
  role: string;
  description: string | null;
  created_at: Date | null;
  updated_at: Date | null;
}

export interface ISalesPerson {
  id: bigint | number;
  SlpCode: number;
  SlpName: string | null;
  Memo?: string | null;
  Commission?: any;
  GroupCode?: number | null;
  Locked?: string | null;
  DataSource?: string | null;
  UserSign?: number | null;
  EmpID?: number | null;
  Active?: string | null;
  created_at?: string | Date | null;
  updated_at?: string | Date | null;
  customers?: ICustomer[]
  visits?: IVisit[]
  user?: IUser
}


export interface IUser {
  id: bigint | string | number | null;
  name: string;
  username: string;
  email: string;
  password?: string;
  confirm_password?: string;
  role_id?: BigInt | number;
  roles?: IRole;
  sales_person?: ISalesPerson | null;
  sales_person_id?: BigInt | number | null;
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

export type UserRequstType = {
  search?: string;
  per_page?: number;
  roles?: string | string[];
  sort_options?: { key: string; order: 'asc' | 'desc' }[];
  page?: number;
};

export type ProfileResponseType = {
  message: string;
  data?: {
    user: IUser | null;
  };
};

export type IUserPayload = Omit<IUser, 'role'> & {
  role: string
} & JwtPayload

export type Credentials = {
  username: string
  password: string
  remember: boolean
}

