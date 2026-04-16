
export interface CustomerRFM {
  customerId: BigInt;
  recency: number;
  frequency: number | null;
  monetary: number | null;

  rScore: number | null;
  fScore: number | null;
  mScore: number | null;

  rfmScore: string | null;
  segment: string | null;
}

export type CustomerScoreMap = {
  lastOrder: Date
  frequencySet: Set<number>
  monetary: number
}
