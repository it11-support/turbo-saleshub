import { ISalesInvoices } from "../sales"
import { ISubGroup } from "../subgroups"

export enum EProductCategory {
  "GROCERIES" = "GROCERIES",
  "DAIRY" = "DAIRY",
  "TISSUE" = "TISSUE",
  "CHEMICAL" = "CHEMICAL",
  "SAUCE" = "SAUCE",
  "BEVERAGE" = "BEVERAGE",
}
export interface IProduct {
  id: bigint | number; // ✅

  ItemCode: string;

  ItemName?: string | null;
  ItmsGrpNam?: string | null;
  frozenFor?: string | null;
  Distributor?: string | null;
  ProductCategory?: EProductCategory | null;
  LaunchDate?: Date | null;
  SalUnitMsr?: string | null;

  AvgPrice?: number | null;
  HargaBeli?: number | null;
  HargaJualNormal?: number | null;
  MinPrice?: number | null;
  MaxPrice?: number | null;
  ItmsGrpCod?: number | null; // ✅ fixed name

  RevenuesAc?: string | null;
  AcctName?: string | null;

  image?: string | null; // ✅ tambah

  created_at?: string | Date | null;
  updated_at?: string | Date | null;

  sales_invoices?: ISalesInvoices[];
  product_developments?: IProductDevelopment[];

  // Report fields
  unitsSold?: number;
  revenue?: number;
  ProductInfo?: string | null;
}
export interface IProductDevelopment {
  subgroup_id: number
  subgroup: ISubGroup
}
export interface IProductDevelopmentList {
  id: BigInt | number
  ItemCode: string
  ItemName?: string | null
  subgroups: ISubGroup[]
}
export type ProductWithFrequency = IProduct & {
  boughtFrequency: number
}

export type SuggestedItemsGrouped = {
  distributor: ProductWithFrequency[];
  groceries: ProductWithFrequency[];
}


export interface IInquiry {
  id?: BigInt | number
  visit_id?: BigInt | number

  product_id?: BigInt | number | null
  product_name?: string | null

  notes?: string

  created_at?: string
  updated_at?: string
}


export interface IInquiryForm {
  product_id: BigInt | number | null
  product_name: string
  notes?: string
}

export interface IProductInquiryState {
  loading: boolean
  inquiries: IInquiry[]
  addInquiry: () => void
  removeInquiry: (index: number) => void
  updateInquiry: (
    index: number,
    field: keyof IInquiry,
    value: any
  ) => void
  setLoading: (loading: boolean) => void
  setInquiries: (inquiries: IInquiry[]) => void
  fetchInquiries: (id: number) => Promise<void>
  syncInquiries: (id: number) => Promise<void>
}

export interface ProductDevelopmentState {
  loading: boolean
  products: IProduct[]
  devProducts: IProductDevelopmentList[]

  activeProduct: IProduct | null
  subgroupIds: number[]
  // setters
  setProducts: (products: IProduct[]) => void
  setDevProducts: (products: IProductDevelopmentList[]) => void
  setActiveProduct: (product: IProduct) => void
  setSubgroups: (ids: number[]) => void
  clearActive: () => void

  // actions
  sync: () => Promise<void>
  removeActiveProduct: () => Promise<void>
  reset: () => void
}

export interface ProductStoreState {
  data: any[]
  loading: boolean
  page: number
  total: number
  totalPages: number
  limit: number
  search: string
  isProductFocused: boolean
  isDistributor: boolean
  categories: { value: number; label: string }[]
  selectedCategory?: number
  selectedGroup?: EProductCategory
  setSelectedGroup: (selectedGroup?: EProductCategory) => void
  setSelectedCategory: (selectedCategory?: number) => void
  setPage: (page: number) => void
  setCategories: (categories: { value: number; label: string }[]) => void
  setLimit: (limit: number) => void
  setSearch: (search: string) => void
  setIsProductFocused: (isProductFocused: boolean) => void
  setIsDistributor: (isDistributor: boolean) => void
  fetchProducts: () => Promise<void>
  reset: () => void
  updateProductInfo: (product_id: number, productInfo: string) => Promise<void>
}
