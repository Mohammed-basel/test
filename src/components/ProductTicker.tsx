import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  const clean = iso.split('T')[0];
  const [y, m, d] = clean.split('-');
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
      const row = p.prices?.find((x) => x.week_number === currentWeek && x.week_date);
      if (row?.week_date) return row.week_date;
    }
    return undefined;
  }, [products, currentWeek]);

  // ✅ Drag-to-scroll (stable) using Pointer Events + window listeners
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragState = useRef({
    pointerId: -1 as number,
    startX: 0,
    startScrollLeft: 0,
    moved: false,
  });

  const stopDrag = () => {
    dragState.current.pointerId = -1;
    setIsDragging(false);
  };

  useEffect(() => {
    const onWinUp = () => stopDrag();
    const onWinCancel = () => stopDrag();
    window.addEventListener('pointerup', onWinUp);
    window.addEventListener('pointercancel', onWinCancel);
    window.addEventListener('blur', onWinUp);
    return () => {
      window.removeEventListener('pointerup', onWinUp);
      window.removeEventListener('pointercancel', onWinCancel);
      window.removeEventListener('blur', onWinUp);
    };
  }, []);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = viewportRef.current;
    if (!el) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;

    setIsDragging(true);
    dragState.current.pointerId = e.pointerId;
    dragState.current.startX = e.clientX;
    dragState.current.startScrollLeft = el.scrollLeft;
    dragState.current.moved = false;

    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    e.preventDefault();
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    if (dragState.current.pointerId !== e.pointerId) return;

    const el = viewportRef.current;
    if (!el) return;

    const dx = e.clientX - dragState.current.startX;
    if (Math.abs(dx) > 3) dragState.current.moved = true;

    el.scrollLeft = dragState.current.startScrollLeft - dx;
    e.preventDefault();
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragState.current.pointerId === e.pointerId) stopDrag();
  };

  const trackItems = [...baseItems, ...baseItems];
  if (!baseItems.length) return null;

  return (
    <div className="bg-white rounded-xl shadow-lg p-5 mb-6">
      <div className="flex items-center justify-start mb-2" dir="rtl">
        <div className="text-sm font-semibold text-gray-700 bg-gray-100 border border-gray-200 rounded-lg px-3 py-1">
          متوسط الأسبوع {currentWeek}
          {weekDateIso && (
            <span className="text-gray-500 font-medium whitespace-nowrap tabular-nums" dir="ltr">
              {' '}({formatWeekDate(weekDateIso)})
            </span>
          )}
        </div>
      </div>

      <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 py-3 overflow-hidden shadow-sm" dir="rtl">
        <div className="ticker-viewport relative">
          <div
            ref={viewportRef}
            className={`overflow-x-auto overflow-y-hidden select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
            style={{
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'none',
              touchAction: 'pan-y',
            }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={stopDrag}
            onDragStart={(e) => e.preventDefault()}
            onWheel={(e) => {
              const el = viewportRef.current;
              if (!el) return;
              if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) el.scrollLeft += e.deltaY;
            }}
          >
            <div className="ticker-track">
              {trackItems.map((it, idx) => {
                const above = it.hasRef && it.price > it.ref + 0.0001;
                const under = it.hasRef && it.price < it.ref - 0.0001;

                return (
                  <div
                    key={`${it.id}-${idx}`}
                    onClick={() => {
                      if (dragState.current.moved) return;
                      onSelectProduct?.(it.id);
                    }}
                    className={`inline-flex items-center gap-3 bg-white border border-gray-100 rounded-full px-4 py-1.5 mx-2 shadow-sm shrink-0 cursor-pointer hover:bg-blue-50 hover:border-blue-200 transition ${
                      selectedId === it.id ? 'ring-2 ring-blue-500' : ''
                    }`}
                  >
                    <span className="text-sm font-bold text-gray-800">{it.name}</span>
                    <div className="h-4 w-[1px] bg-gray-200" />

                    <div className="flex items-center gap-1 flex-row-reverse">
                      {above && <ArrowUp className="w-3.5 h-3.5 text-red-600 stroke-[3px]" />}
                      {under && <ArrowDown className="w-3.5 h-3.5 text-green-600 stroke-[3px]" />}
                      {!above && !under && <Minus className="w-3.5 h-3.5 text-gray-400" />}

                      <span
                        dir="ltr"
                        className={`inline-flex items-baseline whitespace-nowrap tabular-nums font-black ${
                          above ? 'text-red-700' : under ? 'text-green-700' : 'text-gray-600'
                        }`}
                      >
                        <span className="text-sm">{format2(it.price)}</span>
                        <span className="ml-[2px] text-[11px] font-semibold">NIS</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pointer-events-none absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-gray-50 to-transparent z-10" />
          <div className="pointer-events-none absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-gray-50 to-transparent z-10" />
        </div>
      </div>

      <style>{`
        .ticker-viewport > div::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
