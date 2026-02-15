export interface Product {
  id: string;
  name: string;
  icon: string;
  color: string;
  weight?: string;
  reference_price: number;
  display_order: number;
}

export interface WeeklyPrice {
  id: string;
  product_id: string;
  week_number: number;
  price: number;
  /** Optional ISO date for the week label (YYYY-MM-DD) */
  week_date?: string;
}

export interface ProductWithPrices extends Product {
  prices: WeeklyPrice[];
}

export interface PriceChange {
  product: ProductWithPrices;
  percent: number;
  change: number;
}
