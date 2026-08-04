import { IProduct, SuggestedItemsGrouped } from "../product";
import { IVisit, IVisitItem } from "../visit";
import { ISalesVisitRule } from "../visit-rules";

export type VisitScheduleStatus =
  | 'planned'
  | 'visited'
  | 'skipped'
  | 'cancelled'
  | 'missed'
  | 'completed';

export type PlannedItem = number | IProduct;


  export interface VisitSchedule {
    id: number;
    rule: ISalesVisitRule;
    sales_person_id: number;
    customer_id: number;
    visit_date: string; // YYYY-MM-DD
    status: VisitScheduleStatus;
    planned_items: PlannedItem[] | null;
    created_at: string;
    updated_at: string;
    suggestedItems?: SuggestedItemsGrouped;
    visit?: IVisit
    open_issues?: IVisitItem[]
    is_followup?: boolean
    next_follow_up_date?: string
}

export interface CreateVisitScheduleDto {
  rule_id: number;
  sales_person_id: number;
  customer_id: number;
  visit_date: string;
  status?: VisitScheduleStatus;
  planned_items?: PlannedItem[];
}

export interface UpdateVisitScheduleDto {
  status?: VisitScheduleStatus;
  visit_date?: string;
  planned_items?: PlannedItem[];
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
  createVisitSchedule: (payload: Partial<IVisit>) => Promise<IVisit | null>
}

export interface ScheduleListResponse {
  message: string
  data: {
    data: VisitSchedule[]
    total: number
    weekOfMonth: number
  }
}

export interface CreateScheduleResponse {
  message: string
  data: IVisit
}

export interface GenerateScheduleResponse {
  message: string
  data: GenerateResult
}
