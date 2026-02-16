import React, { useMemo, useRef } from 'react';
import { ArrowDown, ArrowUp, Minus, ChevronLeft, ChevronRight } from 'lucide-react';

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
 * HELPERS
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

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
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

  // Drag state (kept in refs to avoid re-rendering)
  const dragRef = useRef({
    isDown: false,
    startX: 0,
    startScrollLeft: 0,
    moved: 0,
  });

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

  // Keep your slider loop behavior
  const trackItems = useMemo(() => [...baseItems, ...baseItems], [baseItems]);

  function scrollByAmount(amount: number) {
    const vp = viewportRef.current;
    if (!vp) return;
    vp.scrollBy({ left: amount, behavior: 'smooth' });
  }

  // --- Drag handlers ---
  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    const vp = viewportRef.current;
    if (!vp) return;

    dragRef.current.isDown = true;
    dragRef.current.startX = e.clientX;
    dragRef.current.startScrollLeft = vp.scrollLeft;
    dragRef.current.moved = 0;

    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const vp = viewportRef.current;
    if (!vp) return;
    if (!dragRef.current.isDown) return;

    const dx = e.clientX - dragRef.current.startX;
    dragRef.current.moved = Math.max(dragRef.current.moved, Math.abs(dx));

    // Drag to scroll
    vp.scrollLeft = dragRef.current.startScrollLeft - dx;
  }

  function onPointerUp() {
    dragRef.current.isDown = false;
    // keep moved value for click prevention
    setTimeout(() => {
      dragRef.current.moved = 0;
    }, 0);
  }

  if (!baseItems.length) return null;

  return (
    <div className="bg-white rounded-xl shadow-lg p-5 mb-6">
      <div
        className="mt-2 rounded-lg border border-gray-200 bg-gray-50 py-3 overflow-hidden shadow-sm"
        dir="rtl"
      >
        <div className="relative">
          {/* Left/Right arrows (small) */}
          <button
            type="button"
            onClick={() => scrollByAmount(-260)}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-white/90 hover:bg-white border border-gray-200 shadow-sm rounded-full p-1.5"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-5 h-5 text-gray-700" />
          </button>

          <button
            type="button"
            onClick={() => scrollByAmount(260)}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-white/90 hover:bg-white border border-gray-200 shadow-sm rounded-full p-1.5"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-5 h-5 text-gray-700" />
          </button>

          {/* Viewport (drag) */}
          <div
            ref={viewportRef}
            className="overflow-x-auto whitespace-nowrap px-10 select-none cursor-grab active:cursor-grabbing"
            style={{
              WebkitOverflowScrolling: 'touch',
              touchAction: 'pan-x',
              scrollbarWidth: 'none' as any, // Firefox
            }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onPointerLeave={onPointerUp}
          >
            {/* Hide scrollbar (WebKit) */}
            <style>{`
              .ticker-hide-scrollbar::-webkit-scrollbar { display: none; }
            `}</style>

            <div className="inline-flex items-center ticker-hide-scrollbar">
              {trackItems.map((it, idx) => {
                const above = it.hasRef && it.price > it.ref + 0.0001;
                const under = it.hasRef && it.price < it.ref - 0.0001;

                return (
                  <div
                    key={`${it.id}-${idx}`}
                    onClick={() => {
                      // prevent click if this was a drag
                      if (dragRef.current.moved > 6) return;
                      onSelectProduct?.(it.id);
                    }}
                    className={`inline-flex items-center gap-3 bg-white border border-gray-100 rounded-full px-4 py-1.5 mx-2 shadow-sm shrink-0 cursor-pointer hover:bg-blue-50 hover:border-blue-200 transition
                      ${selectedId === it.id ? 'ring-2 ring-blue-500' : ''}
                    `}
                  >
                    {/* Product Name */}
                    <span className="text-sm font-bold text-gray-800">
                      {it.name}
                    </span>

                    {/* Divider */}
                    <div className="h-4 w-[1px] bg-gray-200" />

                    {/* Price */}
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
                        {format2(it.price)} NIS
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Gradient fades */}
          <div className="pointer-events-none absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-gray-50 to-transparent z-10" />
          <div className="pointer-events-none absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-gray-50 to-transparent z-10" />
        </div>
      </div>
    </div>
  );
}
