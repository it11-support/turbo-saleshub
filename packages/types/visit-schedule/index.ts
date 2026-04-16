import { SuggestedItemsGrouped } from "../product";
import { IVisit, IVisitItem } from "../visit";
import { ISalesVisitRule } from "../visit-rules";

export type VisitScheduleStatus =
  | 'planned'
  | 'visited'
  | 'skipped'
  | 'cancelled'
  | 'missed'
  | 'completed';


  export interface VisitSchedule {
    id: number;
    rule: ISalesVisitRule;
    sales_person_id: number;
    customer_id: number;
    visit_date: string; // YYYY-MM-DD
    status: VisitScheduleStatus;
    planned_items: any[] | null; // array of items
    created_at: string;
    updated_at: string;
    suggestedItems?: SuggestedItemsGrouped;
    visit?: IVisit
    open_issues?: IVisitItem[]
}

export interface CreateVisitScheduleDto {
  rule_id: number;
  sales_person_id: number;
  customer_id: number;
  visit_date: string;
  status?: VisitScheduleStatus;
  planned_items?: any[]; // recommended array of item ids or objects
}

export interface UpdateVisitScheduleDto {
  status?: VisitScheduleStatus;
  visit_date?: string;
  planned_items?: any[];
}


export interface GenerateResult {
  success: boolean;
  rules_count: number;
  schedules_generated: number;
  schedules_inserted: number;
}


export interface ScheduleState {
  currentDate: string
  setCurrentDate: (date: string) => void
  fetchScheduleByDate: (sales_person_id: number, date: string) => Promise<void>
  schedules: VisitSchedule[]
  loading: boolean
  error: string | null
  pageSize: number
  total: number
  totalPages: number
  page: number
  setPage: (page: number) => void
  setTotal: (total: number) => void
  setTotalPages: (totalPages: number) => void
  // actions
  fetchBySalesPerson: (sales_person_id: number) => Promise<void>
  generateByRules: (sales_person_id: number, year: number, month: number) => Promise<GenerateResult>
  updateStatus: (id: number, status: string) => Promise<void>
  deleteSchedule: (id: number) => Promise<void>
  createVisitSchedule: (payload: Partial<IVisit>) => Promise<IVisit>
}
