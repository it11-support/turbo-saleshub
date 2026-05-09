export interface Competitor {
  id: number | string;
  name: string;
}

export interface CompetitorProduct {
  id?: string;
  product_name: string;
  brand?: string;
  price?: number;
  monthly_usage?: number;
  is_promo: boolean;
  notes?: string;
  stock_status:  'AVAILABLE' | 'LOW' | 'OUT_OF_STOCK';
  unit?: string;
}

export interface VisitCompetitor {
  competitor_id?: number | string;
  name: string;
  products: CompetitorProduct[];
}

export interface RawVisitCompetitor {
  competitor_id?: number | string
  competitor_products: CompetitorProduct[]
  competitors: Competitor
  id: number | string | bigint
  visit_id: number | string | bigint
}

export interface VisitCompetitorState  {
  masterCompetitors: Competitor[];

  // Current Transaction State
  currentVisitId: string | null;
  selectedCompetitors: VisitCompetitor[];
  setSelectedCompetitor: (competitor: VisitCompetitor) => void
  setCompetitors: (competitors: VisitCompetitor[]) => void,

  fetchMasterCompetitors: () => Promise<void>;
  addCompetitorToVisit: (competitor: Competitor | string) => void;
  removeCompetitorFromVisit: (index: number) => void;
  updateProduct: (compIndex: number, prodIndex: number, data: Partial<CompetitorProduct>) => void;
  addProductToCompetitor: (compIndex: number) => void;
  removeProductFromCompetitor: (compIndex: number, prodIndex: number) => void;
  resetForm: () => void;
  syncCompetitors: (visitId: string | number) => Promise<void>;
}
