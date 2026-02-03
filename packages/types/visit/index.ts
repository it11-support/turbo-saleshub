import { ICustomer } from "../customer";
import { IProduct } from "../product";
import { ISalesPerson } from "../user";

export interface IVisit {
  id: number;
  sales_person_id: number;
  salesPerson: ISalesPerson;
  suggestedItems?: IProduct[];
  customer_id: number;
  customer: ICustomer
  start_at: Date;
  end_at?: Date;
  status: 'planned' | 'ongoing' | 'completed' | 'cancelled' | 'pending'
  notes?: string;
  created_at: string;
  updated_at: string;
  visit_date: Date
}


export interface IVisitItem {
  id: number;
  visit_id: number;
  offered: boolean;
  purchased: boolean;
  product_id: number;
  product: IProduct;
  notes: string;
  visit?: IVisit;
  created_at: string;
  updated_at: string;
}
