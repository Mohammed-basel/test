import React, { useMemo } from 'react';
import { ArrowUp, TrendingUp } from 'lucide-react';
import { ProductWithPrices } from '../types';

function getLatestPriceUpToWeek(p: ProductWithPrices, week: number) {
  const candidate = [...p.prices]
    .filter((x) => x.week_number <= week)
    .sort((a, b) => b.week_number - a.week_number)[0];
  return Number(candidate?.price ?? 0);
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
  const items = useMemo(() => {
    const list = products
      .map((p) => {
        const price = getLatestPriceUpToWeek(p, currentWeek);
        const ref = Number(p.reference_price ?? 0);
        const pct = ref > 0 ? ((price - ref) / ref) * 100 : 0;
        return {
          id: p.id,
          name: p.name,
          price: price,
          pct: Number(pct.toFixed(2)),
          isAbove: pct > 0.01,
        };
      })
      .slice(0, maxItems);

    // Duplicate for seamless loop.
    return [...list, ...list];
  }, [products, currentWeek, maxItems]);

  if (!products.length) return null;

  return (
    <div className="mt-4 bg-white border-t-2 border-b-2 border-gray-200 py-2 overflow-hidden">
      <div className="relative overflow-hidden">
        <div className="flex gap-6 whitespace-nowrap animate-ticker-scroll">
          {items.map((it, idx) => {
            return (
              <div
                key={`${it.id}-${idx}`}
                className="inline-flex items-center gap-2"
                title={`${it.name} — ₪${it.price.toFixed(2)}`}
              >
                <span className="text-sm font-bold text-gray-800">
                  {it.name}
                </span>

                <span className={`text-base font-black ${
                  it.isAbove ? 'text-red-600' : 'text-gray-700'
                }`}>
                  {it.price.toFixed(2)}
                </span>

                {it.isAbove && <TrendingUp className="w-4 h-4 text-red-600 stroke-[2.5]" />}
              </div>
            );
          })}
        </div>

        {/* fade edges */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-white to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-white to-transparent" />
      </div>
    </div>
  );
}
