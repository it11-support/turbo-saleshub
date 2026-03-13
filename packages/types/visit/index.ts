import { IConcernCategory, IConcernStatus } from "../concerns";
import { ICustomer } from "../customer";
import { IProduct, SuggestedItemsGrouped } from "../product";
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
  status: 'Planned' | 'Ongoing' | 'Completed' | 'Cancelled' | 'Pending' | 'Missed';
  notes?: string | null;
  created_at: string | Date | null;
  updated_at: string | Date | null;
  visit_date: string | Date | null
  visit_items?: IVisitItem[]
}

export interface IVisitItemConcern {
  category: IConcernCategory
  status: IConcernStatus
  id: bigint | number
  notes: string | null
  status_id: bigint | number
  visit_item_id: bigint | number
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
  visit_item_concerns?: IVisitItemConcern[]
}
