import { Nullable } from "../common";
import { RawVisitCompetitor } from "../competitor";
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
  visit_competitors?: RawVisitCompetitor[]
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
  Feedback = 'Feedback'
}


export type ExportVisit = IVisit & {
  visit_items: (IVisitItem & {
    visit_item_concerns: (IVisitItemConcern & {
      follow_ups: IVisitConcernFollowUp[]
    })[]
  })[]
}

export interface VisitListState {
  data: IVisit[],
  loading: boolean
  loadingExport: boolean
  page: number
  total: number
  totalPages: number
  limit: number
  dates: Nullable<(Date | null)[]>
  exportDates: Nullable<(Date | null)[]>
  multiSortMeta: any[]
  exportData: ExportVisit[]
  setExportData: (data: ExportVisit[]) => void
  fetchVisits: () => Promise<void>
  salesPersonId?: number
  needFollowUp: boolean
  setNeedFollowUp: (needFollowUp: boolean) => void
  status?: string | TVisitStatus
  setStatus: (status?: string | TVisitStatus) => void
  salesPersonFilter?: number | null
  setSalesPersonId: (salesPersonId?: number) => void
  setSalesPersonFilter: (salesPersonFilter?: number | null) => void
  setDates: (dates: Nullable<(Date | null)[]>) => void
  setExportDates: (exportDates: Nullable<(Date | null)[]>) => void
  setPage: (page: number) => void
  setLimit: (limit: number) => void
  setMultiSortMeta: (meta: any[]) => void
  fetchExportedData: () => Promise<void>
  reset: () => void
  setLoadingExport: (loading: boolean) => void
}

export interface FollowUpForm {
  visit_item_concern_id: BigInt | number
  status: string
  type: EFollowUpType | null
  notes: string
  action_required: boolean
  next_follow_up_date: Date | null
}

export type OfferedItem = {
  product_id: number
  offered: boolean
  notes?: string
  product?: IProduct
  created_at?: Date
}

export interface IVisitDetails {
  [key: number]: {
    [key: number]: {
      notes: string;
      statusId: number | null;
    };
  };
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
  startVisit: (visitId: number) => Promise<void>
  processItems: (data: Record<number, { notes: string; statusId: number | null }>, productIds: number[]) => Promise<void>
}
