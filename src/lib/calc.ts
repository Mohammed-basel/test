import { ProductWithPrices, PriceChange } from '../types';

export function calculatePriceChange(product: ProductWithPrices, week: number): PriceChange {
  const weekPrice = product.prices.find(p => p.week_number === week)?.price ?? 0;

  const ref = product.reference_price ?? 0;
  const change = weekPrice - ref;
  const percent = ref > 0 ? (change / ref) * 100 : 0;

  return { product, percent, change };
}

// Categorize change for filtering (increase / decrease / stable)
export type ChangeCategory = 'increase' | 'decrease' | 'stable';

export function getChangeCategory(pct: number, threshold = 0.0001): ChangeCategory {
  if (pct > threshold) return 'increase';
  if (pct < -threshold) return 'decrease';
  return 'stable';
}
