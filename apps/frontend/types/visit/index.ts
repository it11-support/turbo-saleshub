import { EFollowUpType, ICustomer, IProduct, ISalesPerson, IVisitItem, SuggestedItemsGrouped, TVisitStatus } from '@saleshub-tsm/types'
export type OfferedItem = {
  product_id: number
  offered: boolean
  notes?: string
  product?: IProduct
  created_at?: Date
}
export interface IVisit {
  id: bigint | number;
  sales_person_id: bigint | number;
  salesPerson: ISalesPerson;
  suggestedItems?: SuggestedItemsGrouped;
  customer_id: bigint | number;
  customer: ICustomer
  start_at: Date;
  end_at?: Date | null;
  status: TVisitStatus;
  notes?: string | null;
  created_at: string | Date | null;
  updated_at: string | Date | null;
  visit_date: string | Date | null
  visit_items?: IVisitItem[]
}

export interface IVisitDetails {
  [key: number]: {
    [key: number]: {
      notes: string;
      statusId: number | null;
    };
  };
}

export interface FollowUpForm {
  visit_item_concern_id: BigInt | number
  status: string
  type: EFollowUpType | null
  notes: string
  action_required: boolean
  next_follow_up_date: Date | null
}

export interface IVisitState {
  followUpForm: FollowUpForm
  setFollowUpForm: (folloUpForm: FollowUpForm) => void
  offeredItems: OfferedItem[]
  setOfferedItems: (items: OfferedItem[]) => void
  salesVisit: IVisit
  setSalesVisit: (salesVisit: IVisit) => void
  loading: boolean
  visitNote: string
  error: string | null
  fetchSalesVisit: (rule_id: number, type?: string) => Promise<void>
  syncOfferedItems: (data: IVisitDetails) => Promise<void>
  endVisit: () => Promise<void>
  fetchVisitDetails: (id: number) => Promise<void>
  setVisitNote: (note: string) => void
  addFollowUp: () => Promise<void>
}
