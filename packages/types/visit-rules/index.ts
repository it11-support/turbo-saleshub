import { ICustomer } from "../customer"
import { ISalesPerson } from "../user"

export interface ISalesVisitRule {
  id: BigInt
  sales_person_id: BigInt
  customer_id: BigInt
  day_of_week: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday"
  visit_weeks: number[]
  max_items_per_visit: number
  active?: boolean
  sales_person?: ISalesPerson
  customer?: ICustomer
  created_at?: Date
  updated_at?: Date
}

export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';

export type VisitRuleRequestType = {
  sales_person_id: number;
  customer_id: number;
  day_of_week: DayOfWeek;
  visit_weeks: number[];
  max_items_per_visit: number;
};

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
