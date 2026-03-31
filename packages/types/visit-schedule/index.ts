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
