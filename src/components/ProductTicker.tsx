import React, { useMemo } from 'react';
import { ArrowDown, ArrowUp, Minus } from 'lucide-react';
import { ProductWithPrices } from '../types';

function getLatestPriceUpToWeek(p: ProductWithPrices, week: number) {
  const candidate = [...p.prices]
    .filter((x) => x.week_number <= week)
    .sort((a, b) => b.week_number - a.week_number)[0];
  return Number(candidate?.price ?? 0);
}

function format2(n: number) {
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

  const cycleItems = useMemo(() => {
    if (!baseItems.length) return [];
    const minCount = Math.max(12, Math.min(30, baseItems.length * 3));
    const out = [...baseItems];
    while (out.length < minCount) out.push(...baseItems);
    return out.slice(0, minCount);
  }, [baseItems]);

  const trackItems = useMemo(() => {
    // Two identical sequences for seamless looping
    return [...cycleItems, ...cycleItems];
  }, [cycleItems]);

  if (!products.length) return null;
  if (!baseItems.length) return null;

  return (
    <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 overflow-hidden">
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-black text-gray-700">
          Prices ticker (vs. reference price)
        </span>
        {/* removed: “— moves automatically” */}
      </div>

      {/* IMPORTANT: relative for fade overlays */}
      <div className="ticker-viewport relative overflow-hidden">
        <div className="ticker-track">
          {trackItems.map((it, idx) => {
            const above = it.hasRef && it.price > it.ref + 0.0001;
            const under = it.hasRef && it.price < it.ref - 0.0001;

            return (
              <div
                key={`${it.id}-${idx}`}
                className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-full px-3 py-1 shadow-sm mr-2"
                title={
                  it.hasRef
                    ? `${it.name} — Current ${format2(it.price)} | Ref ${format2(
                        it.ref
                      )} | Diff ${it.diff >= 0 ? '+' : ''}${format2(it.diff)} (${
                        it.pct >= 0 ? '+' : ''
                      }${it.pct.toFixed(2)}%)`
                    : `${it.name} — Current ${format2(it.price)} (no reference price)`
                }
              >
                <span className="text-xs font-bold text-gray-800 max-w-[180px] truncate">
                  {it.name}
                </span>

                {above && <ArrowUp className="w-4 h-4 text-red-600" />}
                {under && <ArrowDown className="w-4 h-4 text-green-600" />}
                {!above && !under && <Minus className="w-4 h-4 text-gray-400" />}

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

        {/* fade edges */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-gray-50 to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-gray-50 to-transparent" />
      </div>
    </div>
  );
}
