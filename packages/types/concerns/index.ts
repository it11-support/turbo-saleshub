export interface IConcernCategory {
  id?: BigInt | number | null
  name: string
  description?: string
}

export interface IConcernStatus {
  id?: BigInt | number | null
  status: string
  labelColor: string
}
export interface IConcernState {
  loading: boolean
  concernCategory: IConcernCategory | null
  concernStatus: IConcernStatus | null
  concernCategories: IConcernCategory[]
  concernStatuses: IConcernStatus[]
  fetchConcernCategories: () => Promise<IConcernCategory[]>
  fetchConcernStatuses: () => Promise<IConcernStatus[]>
  createStatus: (data: Partial<IConcernStatus>) => Promise<IConcernStatus | null>
  updateStatus: (id: number, data: Partial<IConcernStatus>) => Promise<IConcernStatus | null>
  deleteStatus: (id: number) => Promise<boolean>
  createCategory: (data: Partial<IConcernCategory>) => Promise<IConcernCategory | null>
  updateCategory: (id: number, data: Partial<IConcernCategory>) => Promise<IConcernCategory | null>
  deleteCategory: (id: number) => Promise<boolean>
}
