import React, { useMemo } from 'react';
import { ArrowDown, ArrowUp, Minus } from 'lucide-react';
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
      .map((p, index) => {
        const price = getLatestPriceUpToWeek(p, currentWeek);
        const ref = Number(p.reference_price ?? 0);
        const pct = ref > 0 ? ((price - ref) / ref) * 100 : 0;
        return {
          id: p.id,
          name: p.name,
          number: index + 1,
          pct: Number(pct.toFixed(1)),
        };
      })
      .slice(0, maxItems);

    // Duplicate for seamless loop.
    return [...list, ...list];
  }, [products, currentWeek, maxItems]);

  if (!products.length) return null;

  return (
    <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 overflow-hidden">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-bold text-gray-700">مقارنة بالسعر الاسترشادي</span>
        <span className="text-[10px] text-gray-500">— يتحرك تلقائياً</span>
      </div>

      <div className="relative overflow-hidden">
        <div className="flex gap-2 whitespace-nowrap animate-ticker-scroll">
          {items.map((it, idx) => {
            const isAbove = it.pct > 0.01;
            const isBelow = it.pct < -0.01;

            return (
              <div
                key={`${it.id}-${idx}`}
                className="inline-flex items-center gap-1.5 bg-white border border-gray-200 rounded-full px-2.5 py-1 shadow-sm"
                title={`${it.name} — ${it.pct > 0 ? '+' : ''}${it.pct}%`}
              >
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-gray-700 text-white text-[10px] font-black">
                  {it.number}
                </span>

                {isAbove && <ArrowUp className="w-3.5 h-3.5 text-red-600 stroke-[2.5]" />}
                {isBelow && <ArrowDown className="w-3.5 h-3.5 text-green-600 stroke-[2.5]" />}
                {!isAbove && !isBelow && <Minus className="w-3.5 h-3.5 text-gray-400 stroke-[2.5]" />}

                <span
                  className={`text-xs font-black ${
                    isAbove ? 'text-red-700' : isBelow ? 'text-green-700' : 'text-gray-500'
                  }`}
                >
                  {it.pct > 0 ? '+' : ''}{it.pct}%
                </span>
              </div>
            );
          })}
        </div>

        {/* fade edges */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-gray-50 to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-gray-50 to-transparent" />
      </div>
    </div>
  );
}
