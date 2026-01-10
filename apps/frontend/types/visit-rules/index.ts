import { ISalesVisitRule } from '@saleshub-tsm/types'

export interface IVisitRulesState {
  loading: boolean
  setLoading: (loading: boolean) => void

  salesVisitRules: ISalesVisitRule[]
  setSalesVisitRules: (salesVisitRules: ISalesVisitRule[]) => void

  salesVisitRule: ISalesVisitRule | null
  setSalesVisitRule: (salesVisitRule: ISalesVisitRule | null) => void

  fetchSalesVisitRules: (sales_person_id?: number) => Promise<void>

  createSalesVisitRule: (data: Partial<ISalesVisitRule>) => Promise<ISalesVisitRule | null>

  updateSalesVisitRule: (
    id: number,
    data: Partial<ISalesVisitRule>
  ) => Promise<ISalesVisitRule | null>

  deleteSalesVisitRule: (id: number) => Promise<boolean>
}
