import React, { useMemo } from 'react';
import { ArrowDown, ArrowUp, Minus } from 'lucide-react';
import { ProductWithPrices } from '../types';

// ... (getLatestPriceUpToWeek and format2 functions remain the same)

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

  const trackItems = useMemo(() => {
    if (!baseItems.length) return [];
    // We duplicate the list so that when the first half finishes, 
    // the second half is perfectly aligned to reset.
    return [...baseItems, ...baseItems];
  }, [baseItems]);

  if (!products.length || !baseItems.length) return null;

  return (
    <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 overflow-hidden">
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-black text-gray-700 uppercase tracking-wider">
          Live Prices Ticker
        </span>
      </div>

      <div className="relative overflow-hidden">
        {/* The Track: This is what moves */}
        <div className="flex whitespace-nowrap animate-marquee hover:[animation-play-state:paused]">
          {trackItems.map((it, idx) => {
            const above = it.hasRef && it.price > it.ref + 0.0001;
            const under = it.hasRef && it.price < it.ref - 0.0001;

            return (
              <div
                key={`${it.id}-${idx}`}
                className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-full px-3 py-1 shadow-sm mx-2 shrink-0"
              >
                <span className="text-xs font-bold text-gray-800 truncate max-w-[150px]">
                  {it.name}
                </span>

                {above && <ArrowUp className="w-3 h-3 text-red-600" />}
                {under && <ArrowDown className="w-3 h-3 text-green-600" />}
                {!above && !under && <Minus className="w-3 h-3 text-gray-400" />}

                <span className={`text-xs font-black ${above ? 'text-red-700' : under ? 'text-green-700' : 'text-gray-600'}`}>
                  {format2(it.price)}
                </span>
              </div>
            );
          })}
        </div>

        {/* Gradient Fades for depth */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-gray-50 to-transparent z-10" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-gray-50 to-transparent z-10" />
      </div>
    </div>
  );
}
