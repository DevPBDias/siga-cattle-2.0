export interface PriceVariation {
  absolute: number;
  percent: number;
}

export interface ArrobaQuote {
  referenceDate: string;
  price: number;
  daily?: PriceVariation;
  monthly?: PriceVariation;
  previousPrice?: number;
}

export interface MarketQuotes {
  boiGordo: ArrobaQuote;
  vacaGorda: ArrobaQuote | null;
  source: string;
  updatedAt: string;
  uf?: string;
  stale?: boolean;
  fetched_at?: string;
  status?: "ok" | "stale" | "error";
}

export interface QuoteSnapshot {
  date: string;
  referenceDate?: string;
  timestamp: number;
  boiPrice: number;
  vacaPrice: number | null;
}

export interface StoredMarketQuotes {
  fetchedOn: string;
  timestamp: number;
  data: MarketQuotes;
  uf?: string;
  previous?: QuoteSnapshot;
  history?: QuoteSnapshot[];
}
