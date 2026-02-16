import React, { useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, Minus, Search, CornerUpLeft } from 'lucide-react';

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

  const [dragging, setDragging] = useState(false);
  const dragState = useRef({
    isDown: false,
    startX: 0,
    startScrollLeft: 0,
    moved: 0,
  });

  const [jumpId, setJumpId] = useState<string>('');

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

  // Duplicate for "long track" feeling
  const trackItems = useMemo(() => [...baseItems, ...baseItems], [baseItems]);

  const idToName = useMemo(() => {
    const m = new Map<string, string>();
    baseItems.forEach((x) => m.set(String(x.id), x.name));
    return m;
  }, [baseItems]);

  function scrollToProduct(id: string | number) {
    const vp = viewportRef.current;
    if (!vp) return;

    // find first occurrence
    const el = vp.querySelector(`[data-prod-id="${String(id)}"]`) as HTMLElement | null;
    if (!el) return;

    // center it in viewport
    const vpRect = vp.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    const delta = (elRect.left - vpRect.left) - (vpRect.width / 2 - elRect.width / 2);

    vp.scrollTo({ left: vp.scrollLeft + delta, behavior: 'smooth' });
  }

  // ---- Drag handlers ----
  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    const vp = viewportRef.current;
    if (!vp) return;

    dragState.current.isDown = true;
    dragState.current.startX = e.clientX;
    dragState.current.startScrollLeft = vp.scrollLeft;
    dragState.current.moved = 0;
    setDragging(false);

    // capture pointer so move works even if leaving element
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const vp = viewportRef.current;
    if (!vp) return;
    if (!dragState.current.isDown) return;

    const dx = e.clientX - dragState.current.startX;
    dragState.current.moved = Math.max(dragState.current.moved, Math.abs(dx));

    // If moved enough, consider it a drag (prevents accidental click)
    if (dragState.current.moved > 6) setDragging(true);

    vp.scrollLeft = dragState.current.startScrollLeft - dx;
  }

  function endDrag() {
    dragState.current.isDown = false;
    // small timeout keeps click from firing in some browsers
    setTimeout(() => setDragging(false), 0);
  }

  if (!baseItems.length) return null;

  return (
    <div className="bg-white rounded-xl shadow-lg p-5 mb-6">
      {/* Header tools */}
      <div className="flex flex-col md:flex-row md:items-center gap-3 justify-between mb-3" dir="rtl">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-gray-500" />
          <input
            value={jumpId}
            onChange={(e) => setJumpId(e.target.value)}
            placeholder="ابحث عن سلعة أو اكتب رقمها..."
            className="w-full md:w-72 px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm outline-none focus:ring-2 focus:ring-blue-200"
            list="ticker-products"
          />
          <datalist id="ticker-products">
            {baseItems.map((x) => (
              <option key={String(x.id)} value={String(x.id)}>
                {x.name}
              </option>
            ))}
          </datalist>

          <button
            type="button"
            onClick={() => {
              const v = jumpId.trim();
              if (!v) return;

              // allow typing id OR exact name
              const byId = idToName.has(v) ? v : '';
              const byName = !byId
                ? [...idToName.entries()].find(([, name]) => name === v)?.[0] ?? ''
                : '';

              const target = byId || byName;
              if (target) scrollToProduct(target);
            }}
            className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold"
          >
            اذهب
          </button>
        </div>

        {selectedId != null && selectedId !== '' && (
          <button
            type="button"
            onClick={() => scrollToProduct(selectedId)}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-sm font-bold text-gray-700"
          >
            <CornerUpLeft className="w-4 h-4" />
            العودة للمنتج المحدد
          </button>
        )}
      </div>

      <div className="rounded-lg border border-gray-200 bg-gray-50 py-3 overflow-hidden shadow-sm" dir="rtl">
        {/* Viewport (drag-scroll) */}
        <div className="relative">
          <div
            ref={viewportRef}
            className="overflow-x-auto whitespace-nowrap px-2 select-none cursor-grab active:cursor-grabbing"
            style={{
              WebkitOverflowScrolling: 'touch',
              touchAction: 'pan-x', // allow horizontal swipe
            }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onPointerLeave={endDrag}
          >
            {/* Track */}
            <div className="inline-flex items-center">
              {trackItems.map((it, idx) => {
                const above = it.hasRef && it.price > it.ref + 0.0001;
                const under = it.hasRef && it.price < it.ref - 0.0001;

                return (
                  <div
                    key={`${it.id}-${idx}`}
                    data-prod-id={String(it.id)}
                    onClick={() => {
                      // prevent click when user was dragging
                      if (dragState.current.moved > 6) return;
                      onSelectProduct?.(it.id);
                    }}
                    className={`inline-flex items-center gap-3 bg-white border border-gray-100 rounded-full px-4 py-1.5 mx-2 shadow-sm shrink-0 cursor-pointer hover:bg-blue-50 hover:border-blue-200 transition
                      ${selectedId === it.id ? 'ring-2 ring-blue-500' : ''}
                    `}
                  >
                    <span className="text-sm font-bold text-gray-800">{it.name}</span>

                    <div className="h-4 w-[1px] bg-gray-200" />

                    <div className="flex items-center gap-1 flex-row-reverse">
                      {above && <ArrowUp className="w-3.5 h-3.5 text-red-600 stroke-[3px]" />}
                      {under && <ArrowDown className="w-3.5 h-3.5 text-green-600 stroke-[3px]" />}
                      {!above && !under && <Minus className="w-3.5 h-3.5 text-gray-400" />}

                      <span
                        className={`text-sm font-black ${
                          above ? 'text-red-700' : under ? 'text-green-700' : 'text-gray-600'
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

          {/* Gradient Fades */}
          <div className="pointer-events-none absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-gray-50 to-transparent z-10" />
          <div className="pointer-events-none absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-gray-50 to-transparent z-10" />
        </div>
      </div>
    </div>
  );
}
