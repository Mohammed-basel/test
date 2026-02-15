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
        const diff = price - ref;
        return {
          id: p.id,
          name: p.name,
          number: index + 1,
          price: price,
          referencePrice: ref,
          pct: Number(pct.toFixed(2)),
          diff: Number(diff.toFixed(2)),
        };
      })
      .slice(0, maxItems);

    // Duplicate for seamless loop.
    return [...list, ...list];
  }, [products, currentWeek, maxItems]);

  if (!products.length) return null;

  return (
    <div className="mt-4 rounded-lg border border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100 px-4 py-3 overflow-hidden shadow-md">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-sm font-black text-gray-800">مؤشر الأسعار المتحرك</span>
        <span className="text-xs text-gray-600">مقارنة بالسعر الاسترشادي</span>
        <span className="mr-auto text-[11px] text-gray-500 italic">— يتحرك تلقائياً</span>
      </div>

      <div className="relative overflow-hidden py-1">
        <div className="flex gap-4 whitespace-nowrap animate-ticker-scroll">
          {items.map((it, idx) => {
            const isAbove = it.pct > 0.0001;
            const isBelow = it.pct < -0.0001;
            const isEqual = !isAbove && !isBelow;

            return (
              <div
                key={`${it.id}-${idx}`}
                className={`inline-flex flex-col bg-white border-2 rounded-xl px-4 py-3 shadow-lg hover:shadow-xl transition-all duration-300 min-w-[200px] ${
                  isAbove 
                    ? 'border-red-300 bg-red-50/30' 
                    : isBelow 
                    ? 'border-green-300 bg-green-50/30' 
                    : 'border-gray-300'
                }`}
                title={`${it.name} — ${it.pct > 0 ? '+' : ''}${it.pct}%`}
              >
                {/* Header with number and arrow */}
                <div className="flex items-center justify-between mb-2">
                  <div className={`flex items-center justify-center w-7 h-7 rounded-full font-black text-xs ${
                    isAbove 
                      ? 'bg-red-600 text-white' 
                      : isBelow 
                      ? 'bg-green-600 text-white' 
                      : 'bg-gray-500 text-white'
                  }`}>
                    {it.number}
                  </div>
                  
                  <div className={`p-1.5 rounded-lg ${
                    isAbove 
                      ? 'bg-red-100' 
                      : isBelow 
                      ? 'bg-green-100' 
                      : 'bg-gray-100'
                  }`}>
                    {isAbove && <ArrowUp className="w-5 h-5 text-red-700 stroke-[3]" />}
                    {isBelow && <ArrowDown className="w-5 h-5 text-green-700 stroke-[3]" />}
                    {isEqual && <Minus className="w-5 h-5 text-gray-500 stroke-[3]" />}
                  </div>
                </div>

                {/* Product name */}
                <div className="text-sm font-bold text-gray-900 mb-2 leading-tight min-h-[40px]">
                  {it.name}
                </div>

                {/* Price info */}
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-600 font-semibold">السعر الحالي:</span>
                  <span className="text-base font-black text-gray-900">₪{it.price.toFixed(2)}</span>
                </div>

                <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-200">
                  <span className="text-xs text-gray-600 font-semibold">الاسترشادي:</span>
                  <span className="text-sm font-bold text-gray-700">₪{it.referencePrice.toFixed(2)}</span>
                </div>

                {/* Percentage badge */}
                <div className={`flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg font-black text-sm ${
                  isAbove 
                    ? 'bg-red-600 text-white' 
                    : isBelow 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-500 text-white'
                }`}>
                  <span>{isAbove ? '+' : ''}{it.pct.toFixed(1)}%</span>
                  <span className="text-xs font-semibold">
                    ({isAbove || isEqual ? '+' : ''}{it.diff.toFixed(2)} ₪)
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* fade edges */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-gray-50 via-gray-50/80 to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-gray-100 via-gray-100/80 to-transparent" />
      </div>
    </div>
  );
}
