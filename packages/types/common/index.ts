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
  aov: number
}

export type SummaryResult = {
  current: SummaryValue
  previous: SummaryValue
  growth: SummaryValue
}
