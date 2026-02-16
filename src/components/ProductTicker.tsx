import React, { useMemo } from 'react';
import { ArrowDown, ArrowUp, Minus } from 'lucide-react';

/**
 * TYPES
 */
interface PriceEntry {
  week_number: number;
  price: number | string;
}

export interface ProductWithPrices {
  id: string | number;
  name: string;
  display_order?: number;
  reference_price?: number | string;
  prices: PriceEntry[];
}

/**
 * HELPER FUNCTIONS
 */
function getLatestPriceUpToWeek(p: ProductWithPrices, week: number): number {
  if (!p.prices || p.prices.length === 0) return 0;
  
  const candidate = [...p.prices]
    .filter((x) => x.week_number <= week)
    .sort((a, b) => b.week_number - a.week_number)[0];
    
  return Number(candidate?.price ?? 0);
}

function format2(n: number): string {
  if (!Number.isFinite(n)) return '0.00';
  return n.toFixed(2);
}

export function ProductTicker({
  products,
  currentWeek,
  maxItems = 25,
}: {
  products: ProductWithPrices[];
  currentWeek: number;
  maxItems?: number;
}) {
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

  // Duplicate the array for the seamless loop
  const trackItems = [...baseItems, ...baseItems];

  if (!baseItems.length) return null;

  return (
    <div className="bg-white rounded-xl shadow-lg p-5 mb-6">
    <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 py-3 overflow-hidden shadow-sm" dir="rtl">
      {/* Viewport */}
      <div className="ticker-viewport relative">
        
        {/* Track */}
        <div className="ticker-track">
          {trackItems.map((it, idx) => {
            const above = it.hasRef && it.price > it.ref + 0.0001;
            const under = it.hasRef && it.price < it.ref - 0.0001;

            return (
              <div
                key={`${it.id}-${idx}`}
                className="inline-flex items-center gap-3 bg-white border border-gray-100 rounded-full px-4 py-1.5 mx-2 shadow-sm shrink-0"
              >
                {/* Product Name */}
                <span className="text-sm font-bold text-gray-800">
                  {it.name}
                </span>

                {/* Vertical Divider (RTL friendly) */}
                <div className="h-4 w-[1px] bg-gray-200" />

                {/* Price Display */}
                <div className="flex items-center gap-1 flex-row-reverse">
                  {above && <ArrowUp className="w-3.5 h-3.5 text-red-600 stroke-[3px]" />}
                  {under && <ArrowDown className="w-3.5 h-3.5 text-green-600 stroke-[3px]" />}
                  {!above && !under && <Minus className="w-3.5 h-3.5 text-gray-400" />}
                  
                  <span className={`text-sm font-black ${
                    above ? 'text-red-700' : under ? 'text-green-700' : 'text-gray-600'
                  }`}>
                    {format2(it.price) + "₪"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Gradient Fades flipped for RTL flow */}
        <div className="pointer-events-none absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-gray-50 to-transparent z-10" />
        <div className="pointer-events-none absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-gray-50 to-transparent z-10" />
      </div>
    </div>
    </div>
  );
}
