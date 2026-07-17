import { IUser, IUserPayload } from "../user";
import { type Request } from "express";
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

export interface SortOption<K extends string = string> {
  key: K
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
  page?: number
}

export interface IResPaginated<T> extends ISwrResponse {
  data: IPaginatedData<T>;
}

export interface IResSingle<T> extends ISwrResponse {
  data?: T[];
}

export interface IResObject<T> extends ISwrResponse {
  data?: T;
}


export interface AuthenticatedRequest<
  TParams = any,
  TBody = any,
  TQuery = any
> extends Request<TParams, any, TBody, TQuery> {
  user?: IUserPayload;
}

// TActivityLogger sekarang menerima tipe generic <T> untuk Body
export type TActivityLogger<T = Record<string, unknown>> = {
  req: AuthenticatedRequest<T>
  actionType: string
  description: string
  status: 'SUCCESS' | 'FAILED'
  username?: string
};


export interface FollowUpUpdate {
  count: number
  updatedAt: Date
}

export interface EventInfo {
  title: string
  message: string
  severity?: "success" | "info" | "warn" | "error"
  action_url?: string
}
export interface FollowUpUpdateData<T> {
  followUpUpdate: FollowUpUpdate
  item: T
  info: EventInfo
}
