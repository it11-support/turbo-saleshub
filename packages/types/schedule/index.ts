import { ICustomer } from '../customer'
import { Nullable } from '../common'

export interface FormData {
  salesPersonId: number | null
  customer: ICustomer | null
  scheduleDate: Nullable<Date> | null
}
