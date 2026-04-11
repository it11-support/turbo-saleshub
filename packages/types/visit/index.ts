import { IConcernCategory, IConcernStatus } from "../concerns";
import { ICustomer } from "../customer";
import { IInquiry, IProduct, SuggestedItemsGrouped } from "../product";
import { ISalesPerson } from "../user";

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
  open_issues?: IVisitItem[]
  inquiries?: IInquiry[]
}

export interface IVisitItemConcern {
  category: IConcernCategory
  status: IConcernStatus
  id: bigint | number
  notes: string | null
  status_id: bigint | number
  visit_item_id: bigint | number,
  follow_ups?: IVisitConcernFollowUp[]
}

export interface IVisitItem {
  id: bigint | number;
  visit_id: bigint | number;
  offered: boolean;
  purchased: boolean;
  product_id: bigint | number;
  product: IProduct;
  notes: string | null;
  visit?: IVisit;
  created_at: Date;
  updated_at: Date;
  visit_item_concerns?: IVisitItemConcern[],
  visit_date?: Date
  follow_ups?: IVisitConcernFollowUp[]
}

export interface IVisitConcernFollowUp {
  id: bigint | number;
  visit_item_concern_id: bigint | number;
  status: IConcernStatus
  type: EFollowUpType
  notes: string | null;
  next_follow_up_date: Date | null;
  created_at: Date;
  updated_at: Date;
  concern_status: IConcernStatus
  visit_item_concern: IVisitItemConcern
  visit_item_concerns?: IVisitItemConcern
}

export enum EFollowUpStatus {
  Pending = 'Pending',
  FollowUp = 'Follow Up',
  Done = 'Done',
  Closed = 'Closed'
}

export const VisitStatus = {
  Planned: 'Planned',
  Ongoing: 'Ongoing',
  Completed: 'Completed',
  Cancelled: 'Cancelled',
  Pending: 'Pending',
  Missed: 'Missed',
  Closed: 'Closed'
} as const

export type TVisitStatus = (typeof VisitStatus)[keyof typeof VisitStatus]

export type TFollowUpStatus =
  (typeof EFollowUpStatus)[keyof typeof EFollowUpStatus]

export enum EFollowUpType {
  Call = 'Call',
  Visit = 'Visit',
  WhatsApp = 'WhatsApp',
  Email = 'Email',
  Override = 'Override'
}
