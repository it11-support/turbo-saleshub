export interface IConcernCategory {
  id?: BigInt | number | null
  name: string
  description?: string
}

export enum EBadgeVariant {
  INFO = 'info',
  WARNING = 'warning',
  SUCCESS = 'success',
  DANGER = 'danger',
  SECONDARY = 'secondary',
}

export interface IConcernStatus {
  id?: BigInt | number | null
  status: string
  level?: EBadgeVariant | null
  icon?: string
  requires_action?: boolean
}
export interface IConcernState {
  loading: boolean
  concernCategory: IConcernCategory | null
  concernStatus: IConcernStatus | null
  concernCategories: IConcernCategory[]
  concernStatuses: IConcernStatus[]
  createStatus: (data: Partial<IConcernStatus>) => Promise<IConcernStatus | null>
  updateStatus: (id: number, data: Partial<IConcernStatus>) => Promise<IConcernStatus | null>
  deleteStatus: (id: number) => Promise<boolean>
  createCategory: (data: Partial<IConcernCategory>) => Promise<IConcernCategory | null>
  updateCategory: (id: number, data: Partial<IConcernCategory>) => Promise<IConcernCategory | null>
  deleteCategory: (id: number) => Promise<boolean>
}
