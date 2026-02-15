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

/** * MAIN COMPONENT 
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

  // Render the list twice for seamless looping.
  const trackItems = [...baseItems, ...baseItems];

  if (!baseItems.length) return null;

  return (
    <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 py-3 overflow-hidden shadow-sm">
      <div className="ticker-viewport relative">
        <div 
          className="ticker-track"
          style={{ 
            // 25 items need more time than 30s to look "fast-marquee" like.
            // Adjust '60s' to be higher if it's too fast, lower if too slow.
            animationDuration: '60s' 
          }}
        >
          {trackItems.map((it, idx) => {
            const above = it.hasRef && it.price > it.ref + 0.0001;
            const under = it.hasRef && it.price < it.ref - 0.0001;

            return (
              <div
                key={`${it.id}-${idx}`}
                className="inline-flex items-center gap-3 bg-white border border-gray-100 rounded-full px-4 py-1.5 mx-2 shadow-sm shrink-0"
              >
                <span className="text-sm font-bold text-gray-800 whitespace-nowrap">
                  {it.name}
                </span>

                <div className="flex items-center gap-1 border-l pl-2 border-gray-100">
                  {above && <ArrowUp className="w-4 h-4 text-red-600" />}
                  {under && <ArrowDown className="w-4 h-4 text-green-600" />}
                  {!above && !under && <Minus className="w-4 h-4 text-gray-400" />}
                  
                  <span className={`text-sm font-black ${
                    above ? 'text-red-700' : under ? 'text-green-700' : 'text-gray-600'
                  }`}>
                    {format2(it.price)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Gradient Fades to hide the "entry/exit" of items */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-gray-50 to-transparent z-10" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-gray-50 to-transparent z-10" />
      </div>
    </div>
  );
}
