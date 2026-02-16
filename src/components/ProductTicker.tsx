import React, { useEffect, useMemo, useRef } from 'react';
import { ArrowDown, ArrowUp, Minus } from 'lucide-react';

interface PriceEntry {
  week_number: number;
  price: number | string;
  week_date?: string;
}

export interface ProductWithPrices {
  id: string | number;
  name: string;
  display_order?: number;
  reference_price?: number | string;
  prices: PriceEntry[];
}

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

function formatWeekDate(iso?: string) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

export function ProductTicker({
  products,
  currentWeek,
  maxItems = 25,
  onSelectProduct,
  selectedId,
}: {
  products: ProductWithPrices[];
  currentWeek: number;
  maxItems?: number;
  onSelectProduct?: (id: string | number) => void;
  selectedId?: string | null;
}) {
  const viewportRef = useRef<HTMLDivElement | null>(null);

  const isDown = useRef(false);
  const startX = useRef(0);
  const scrollLeftStart = useRef(0);

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

  const weekDateIso = useMemo(() => {
    for (const p of products) {
      const row = p.prices?.find(
        (x) => x.week_number === currentWeek && x.week_date
      );
      if (row?.week_date) return row.week_date;
    }
    return undefined;
  }, [products, currentWeek]);

  const trackItems = [...baseItems, ...baseItems];
  if (!baseItems.length) return null;

  // ✅ Drag / swipe support for the ticker viewport
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const onMouseDown = (e: MouseEvent) => {
      isDown.current = true;
      el.classList.add('cursor-grabbing');
      startX.current = e.pageX - el.getBoundingClientRect().left;
      scrollLeftStart.current = el.scrollLeft;
    };

    const onMouseLeave = () => {
      isDown.current = false;
      el.classList.remove('cursor-grabbing');
    };

    const onMouseUp = () => {
      isDown.current = false;
      el.classList.remove('cursor-grabbing');
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDown.current) return;
      e.preventDefault();
      const x = e.pageX - el.getBoundingClientRect().left;
      const walk = (x - startX.current) * 1.2; // drag speed
      el.scrollLeft = scrollLeftStart.current - walk;
    };

    const onTouchStart = (e: TouchEvent) => {
      isDown.current = true;
      startX.current = e.touches[0].pageX - el.getBoundingClientRect().left;
      scrollLeftStart.current = el.scrollLeft;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isDown.current) return;
      const x = e.touches[0].pageX - el.getBoundingClientRect().left;
      const walk = (x - startX.current) * 1.2;
      el.scrollLeft = scrollLeftStart.current - walk;
    };

    const onTouchEnd = () => {
      isDown.current = false;
      el.classList.remove('cursor-grabbing');
    };

    el.addEventListener('mousedown', onMouseDown);
    el.addEventListener('mouseleave', onMouseLeave);
    el.addEventListener('mouseup', onMouseUp);
    el.addEventListener('mousemove', onMouseMove);

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: true });
    el.addEventListener('touchend', onTouchEnd);

    return () => {
      el.removeEventListener('mousedown', onMouseDown);
      el.removeEventListener('mouseleave', onMouseLeave);
      el.removeEventListener('mouseup', onMouseUp);
      el.removeEventListener('mousemove', onMouseMove);

      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-lg p-5 mb-6">
      {/* Week title styled like filter */}
      <div className="flex items-center justify-start mb-2" dir="rtl">
        <div className="text-sm font-semibold text-gray-700 bg-gray-100 border border-gray-200 rounded-lg px-3 py-1">
          الأسبوع {currentWeek}
          {weekDateIso && (
            <span className="text-gray-500 font-medium">
              {' '}
              ({formatWeekDate(weekDateIso)})
            </span>
          )}
        </div>
      </div>

      <div
        className="mt-3 rounded-lg border border-gray-200 bg-gray-50 py-3 overflow-hidden shadow-sm"
        dir="rtl"
      >
        {/* ✅ Viewport is now draggable */}
        <div
          ref={viewportRef}
          className="ticker-viewport relative cursor-grab overflow-x-auto scrollbar-hide"
        >
          <div className="ticker-track">
            {trackItems.map((it, idx) => {
              const above = it.hasRef && it.price > it.ref + 0.0001;
              const under = it.hasRef && it.price < it.ref - 0.0001;

              return (
                <div
                  key={`${it.id}-${idx}`}
                  onClick={() => onSelectProduct?.(it.id)}
                  className={`inline-flex items-center gap-3 bg-white border border-gray-100 rounded-full px-4 py-1.5 mx-2 shadow-sm shrink-0 cursor-pointer hover:bg-blue-50 hover:border-blue-200 transition
                    ${selectedId === it.id ? 'ring-2 ring-blue-500' : ''}
                  `}
                >
                  <span className="text-sm font-bold text-gray-800">
                    {it.name}
                  </span>
                  <div className="h-4 w-[1px] bg-gray-200" />

                  <div className="flex items-center gap-1 flex-row-reverse">
                    {above && (
                      <ArrowUp className="w-3.5 h-3.5 text-red-600 stroke-[3px]" />
                    )}
                    {under && (
                      <ArrowDown className="w-3.5 h-3.5 text-green-600 stroke-[3px]" />
                    )}
                    {!above && !under && (
                      <Minus className="w-3.5 h-3.5 text-gray-400" />
                    )}

                    <span
                      className={`text-sm font-black ${
                        above
                          ? 'text-red-700'
                          : under
                          ? 'text-green-700'
                          : 'text-gray-600'
                      }`}
                    >
                      {format2(it.price) + ' NIS'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pointer-events-none absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-gray-50 to-transparent z-10" />
          <div className="pointer-events-none absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-gray-50 to-transparent z-10" />
        </div>
      </div>
    </div>
  );
}
