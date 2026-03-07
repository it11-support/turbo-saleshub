export interface IConcernCategory {
  id?: BigInt | number | null
  name: string
  description?: string
}


export interface IConcernState {
  loading: boolean
  concernCategory: IConcernCategory | null
  concernCategories: IConcernCategory[]
  fetchConcernCategories: () => Promise<IConcernCategory[]>
  createCategory: (data: Partial<IConcernCategory>) => Promise<IConcernCategory | null>
  updateCategory: (id: number, data: Partial<IConcernCategory>) => Promise<IConcernCategory | null>
  deleteCategory: (id: number) => Promise<boolean>
}
