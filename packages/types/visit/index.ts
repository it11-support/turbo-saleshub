import { ICustomer } from "../customer";
import { IProduct } from "../product";
import { ISalesPerson } from "../user";

export interface IVisit {
  id: bigint | number;
  sales_person_id: bigint | number;
  salesPerson: ISalesPerson;
  suggestedItems?: IProduct[];
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
}
