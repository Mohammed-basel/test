import React, { useMemo } from 'react';
import { ArrowDown, ArrowUp, Minus } from 'lucide-react';

/** * TYPES 
 */
interface PriceEntry {
  week_number: number;
  price: number | string;
}

interface ProductWithPrices {
  id: string | number;
  name: string;
  display_order?: number;
  reference_price?: number | string;
  prices: PriceEntry[];
}

/** * HELPERS 
 */

/**
 * Finds the most recent price record that is less than or equal to the target week.
 */
function getLatestPriceUpToWeek(p: ProductWithPrices, week: number): number {
  if (!p.prices || p.prices.length === 0) return 0;

  const candidate = [...p.prices]
    .filter((x) => x.week_number <= week)
    .sort((a, b) => b.week_number - a.week_number)[0];

  return Number(candidate?.price ?? 0);
}

/**
 * Standardizes decimal formatting for currency/prices.
 */
function format2(n: number): string {
  if (!Number.isFinite(n)) return '0.00';
  return n.toFixed(2);
}

/**
 * MAIN COMPONENT
 */
export function ProductTicker({
  products,
  currentWeek,
  maxItems = 25,
}: {
  products: ProductWithPrices[];
  currentWeek: number;
  maxItems?: number;
}) {
  // 1. Process and sort the base list of items
  const baseItems = useMemo(() => {
    return [...products]
      .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
      .map((p) => {
        const price = getLatestPriceUpToWeek(p, currentWeek);
        const ref = Number(p.reference_price ?? 0);
        const hasRef = Number.isFinite(ref) && ref > 0;
        const diff = hasRef ? price - ref : 0;
        const pct = hasRef ? (diff / ref) * 100 : 0;

        return { id: p.id, name: p.name, price, ref, hasRef, diff, pct };
      })
      .slice(0, maxItems);
  }, [products, currentWeek, maxItems]);

  // 2. Double the list for a seamless loop.
  // The CSS moves the track by -50%, so the second half takes the place of the first half instantly.
  const trackItems = useMemo(() => {
    if (baseItems.length === 0) return [];
    return [...baseItems, ...baseItems];
  }, [baseItems]);

  if (!products.length || !baseItems.length) return null;

  return (
    <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 overflow-hidden">
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-black text-gray-700 uppercase tracking-tight">
          Market Prices Ticker
        </span>
      </div>

      {/* The Viewport: Masks the overflow and adds the gradient fades */}
      <div className="ticker-viewport relative overflow-hidden">
        {/* The Track: This uses your CSS .ticker-track which handles the animation */}
        <div className="ticker-track">
          {trackItems.map((it, idx) => {
            const above = it.hasRef && it.price > it.ref + 0.0001;
            const under = it.hasRef && it.price < it.ref - 0.0001;

            return (
              <div
                key={`${it.id}-${idx}`}
                className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-full px-3 py-1 shadow-sm mx-2 shrink-0"
                title={
                  it.hasRef
                    ? `${it.name} | Ref: ${format2(it.ref)} | Change: ${it.pct.toFixed(2)}%`
                    : it.name
                }
              >
                <span className="text-xs font-bold text-gray-800 max-w-[150px] truncate">
                  {it.name}
                </span>

                {/* Status Icon */}
                {above && <ArrowUp className="w-3.5 h-3.5 text-red-600" />}
                {under && <ArrowDown className="w-3.5 h-3.5 text-green-600" />}
                {!above && !under && <Minus className="w-3.5 h-3.5 text-gray-400" />}

                {/* Price Display */}
                <span
                  className={`text-xs font-black ${
                    above ? 'text-red-700' : under ? 'text-green-700' : 'text-gray-600'
                  }`}
                >
                  {format2(it.price)}
                </span>
              </div>
            );
          })}
        </div>

        {/* Fade Edges: Matches the bg-gray-50 of the parent */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-gray-50 to-transparent z-10" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-gray-50 to-transparent z-10" />
      </div>
    </div>
  );
}
