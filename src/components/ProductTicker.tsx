import React, { useEffect, useMemo, useRef, useState } from 'react';
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
        const diff = price - ref;
        const pct = ref > 0 ? (diff / ref) * 100 : 0;

        return {
          id: p.id,
          name: p.name,
          price,
          ref,
          diff,
          pct,
        };
      })
      .slice(0, maxItems);
  }, [products, currentWeek, maxItems]);

  // --- Smooth, true loop ---
  // We measure one full "cycle" width (baseItems rendered once), then repeat it
  // enough times so the track is always longer than the viewport.
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const cycleRef = useRef<HTMLDivElement | null>(null);
  const [repeatCount, setRepeatCount] = useState(2);
  const [cycleWidth, setCycleWidth] = useState(0);
  const [viewportWidth, setViewportWidth] = useState(0);

  useEffect(() => {
    if (!viewportRef.current || !cycleRef.current) return;

    const update = () => {
      const vw = viewportRef.current?.clientWidth ?? 0;
      const cw = cycleRef.current?.scrollWidth ?? 0;
      setViewportWidth(vw);
      setCycleWidth(cw);

      if (vw <= 0 || cw <= 0) {
        setRepeatCount(2);
        return;
      }

      // Ensure the total track width is at least ~2x viewport (so you don't
      // see obvious duplicates on large/small screens).
      const needed = Math.ceil((vw * 2) / cw) + 1;
      setRepeatCount(Math.max(2, needed));
    };

    update();

    const ro = new ResizeObserver(() => update());
    ro.observe(viewportRef.current);
    ro.observe(cycleRef.current);
    return () => ro.disconnect();
  }, [baseItems]);

  const items = useMemo(() => {
    const reps = Array.from({ length: repeatCount }, () => baseItems).flat();
    return reps;
  }, [baseItems, repeatCount]);

  if (!products.length) return null;
  if (!baseItems.length) return null;

  // Animation timing: keep it readable and consistent.
  // Speed ~ 80px/sec (tweak as you like).
  const distance = cycleWidth || 600; // fallback
  const durationSec = Math.max(18, Math.min(80, distance / 80));

  return (
    <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 overflow-hidden">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-black text-gray-700">
          شريط الأسعار (مقارنة بالسعر الاسترشادي)
        </span>
        <span className="text-[11px] text-gray-500">— يتحرك تلقائياً</span>
      </div>

      <div ref={viewportRef} className="relative overflow-hidden">
        {/* One cycle for measuring width (invisible but still measurable) */}
        <div className="absolute -z-10 opacity-0 pointer-events-none">
          <div ref={cycleRef} className="inline-flex gap-3 whitespace-nowrap">
            {baseItems.map((it) => (
              <div
                key={`measure-${it.id}`}
                className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-full px-3 py-1 shadow-sm"
              >
                <span className="text-xs font-bold max-w-[180px] truncate">{it.name}</span>
                <span className="text-xs font-black">{format2(it.price)}</span>
              </div>
            ))}
          </div>
        </div>

        <div
          className="inline-flex gap-3 whitespace-nowrap animate-ticker-scroll"
          style={
            {
              // Move exactly one cycle, then loop.
              // This makes the loop truly seamless.
              '--ticker-distance': `${Math.max(1, distance)}px`,
              '--ticker-duration': `${durationSec}s`,
            } as React.CSSProperties
          }
        >
          {items.map((it, idx) => {
            const hasRef = Number.isFinite(it.ref) && it.ref > 0;
            const above = hasRef && it.price > it.ref + 0.0001; // أعلى من الاسترشادي (أحمر)
            const under = hasRef && it.price < it.ref - 0.0001; // أقل من الاسترشادي (أخضر)

            return (
              <div
                key={`${it.id}-${idx}`}
                className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-full px-3 py-1 shadow-sm"
                title={
                  hasRef
                    ? `${it.name} — السعر الحالي ${format2(it.price)} | الاسترشادي ${format2(
                        it.ref
                      )} | الفرق ${it.diff >= 0 ? '+' : ''}${format2(it.diff)} (${
                        it.pct >= 0 ? '+' : ''
                      }${it.pct.toFixed(2)}%)`
                    : `${it.name} — السعر الحالي ${format2(it.price)} (لا يوجد سعر استرشادي)`
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
