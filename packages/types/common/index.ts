export interface ICommonRequestType {
  page?: number
  per_page?: number
  search?: string
  sort_options?: { key: string; order: 'asc' | 'desc' }[]
}

export type PaginationResult<T> = {
  message: string
  data?: {
    items: T[]
    totalRecords: number
    currentPage: number
    perPage: number
    totalPages: number
  }
}

export type Role = 'admin' | 'sales'

type BaseMenuItem = {
  label: string
  icon?: string
  badge?: string
  roles?: Role[]
}

// 🔥 Route item
export type RouteMenuItem = BaseMenuItem & {
  to: string
  type?: 'route'
}

// 🔥 Action item (dialog, dll)
export type ActionMenuItem = BaseMenuItem & {
  type: 'action'
  commandKey: string
}

// 🔥 Union
export type MenuItem = RouteMenuItem | ActionMenuItem

export type MenuSection = {
  label: string
  roles?: Role[]
  items: MenuItem[]
}

export type SummaryValue = {
  revenue: number
  orders: number
  customers: number
}

export type SummaryResult = {
  current: SummaryValue
  previous: SummaryValue
  growth: SummaryValue
}

export type SortOption = {
  key: string
  order: 'asc' | 'desc'
}


export type Nullable<T = void> = T | null | undefined;

export interface DataTableSortMeta {
    field: string;
    order: 1 | 0 | -1 | null | undefined;
}

export interface ISwrResponse {
  message?: string
}

export interface IPaginatedData<T> {
  items: T[]
  currentPage?: number
  perPage?: number
  totalPages?: number
  totalRecords?: number
}

export interface IResPaginated<T> extends ISwrResponse {
  data: IPaginatedData<T>;
}

export interface IResSingle<T> extends ISwrResponse {
  data?: T[];
}
