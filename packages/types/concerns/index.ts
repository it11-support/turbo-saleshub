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
}
