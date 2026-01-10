import { ICustomer, IProduct, ISalesPerson } from '@saleshub-tsm/types'
export type OfferedItem = {
  product_id: number
  offered: boolean
  notes?: string
  product?: IProduct
  created_at?: Date
}
export interface IVisit {
  id: number
  sales_person_id: number
  salesPerson: ISalesPerson
  suggestedItems?: IProduct[]
  customer_id: number
  customer: ICustomer
  start_at: Date
  end_at?: Date
  status: 'planned' | 'ongoing' | 'completed' | 'cancelled' | 'pending'
  notes?: string
  visit_items?: OfferedItem[]
  created_at: string
  updated_at: string
}

export interface IVisitState {
  offeredItems: OfferedItem[]
  setOfferedItems: (items: OfferedItem[]) => void
  salesVisit: IVisit
  setSalesVisit: (salesVisit: IVisit) => void
  loading: boolean
  visitNote: string
  error: string | null
  fetchSalesVisit: (rule_id: number) => Promise<void>
  syncOfferedItems: () => Promise<void>
  endVisit: () => Promise<void>
  fetchVisitDetails: (id: number) => Promise<void>
  setVisitNote: (note: string) => void
}
