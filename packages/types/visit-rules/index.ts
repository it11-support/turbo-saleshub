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
