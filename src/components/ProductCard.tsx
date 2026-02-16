// src/components/ProductCard.tsx
import React, { useEffect, useMemo, useState } from "react";
import type { ProductWithPrices } from "../types";

/**
 * If your IDs on disk include a leading zero (e.g. 011100103.png)
 * but your data sends 11100103, you can normalize here.
 *
 * Set EXPECTED_ID_LEN to 9 if your filenames are always 9 digits.
 * Set to 0 to disable normalization.
 */
const EXPECTED_ID_LEN = 0; // e.g. 9 to pad with leading zeros, or 0 to disable

function normalizeId(id: string) {
  if (!EXPECTED_ID_LEN) return id;
  const s = String(id ?? "");
  return s.padStart(EXPECTED_ID_LEN, "0");
}

type Props = {
  product: ProductWithPrices;
  selected?: boolean;
  onSelect?: (id: string) => void;

  // Optional: if you have a “current week” or “latest price” you show
  currentWeek?: number;

  // Optional: language/dir if you’re using bilingual UI
  lang?: "ar" | "en";
};

export function ProductCard({
  product,
  selected = false,
  onSelect,
  currentWeek,
  lang = "ar",
}: Props) {
  const dir = lang === "ar" ? "rtl" : "ltr";

  const baseUrl = import.meta.env.BASE_URL; // e.g. "/ramadan2026/"
  const productId = useMemo(() => normalizeId(product.id), [product.id]);

  /**
   * Decide if this product should try a FILE icon at all.
   * -----------------------------------------------
   * If you already have a flag in your data, plug it here.
   *
   * Examples you might have:
   * - product.iconType === "file"
   * - product.hasIconFile === true
   * - product.iconName exists
   *
   * Current safe behavior:
   * - If any of these optional flags exist and say "use default", we skip file icons.
   * - Otherwise we try file icons (png->svg->stop).
   */
  const shouldTryFileIcon = useMemo(() => {
    const anyProduct = product as any;

    // If you have explicit "use default <i>" flags, respect them
    if (anyProduct.useDefaultIcon === true) return false;
    if (anyProduct.iconType && anyProduct.iconType !== "file") return false;
    if (anyProduct.iconSource && anyProduct.iconSource !== "file") return false;

    // Otherwise: try file icon by default
    return true;
  }, [product]);

  // Icon src state:
  // - string => <img src=...>
  // - null => show default <i> and STOP network requests
  const [iconSrc, setIconSrc] = useState<string | null>(() => {
    if (!shouldTryFileIcon) return null;
    return `${baseUrl}icons/${productId}.png`;
  });

  // Reset icon when product changes
  useEffect(() => {
    if (!shouldTryFileIcon) {
      setIconSrc(null);
      return;
    }
    setIconSrc(`${baseUrl}icons/${productId}.png`);
  }, [baseUrl, productId, shouldTryFileIcon]);

  const handleIconError = () => {
    // If already stopped, do nothing
    if (!iconSrc) return;

    // PNG failed -> try SVG
    if (iconSrc.endsWith(".png")) {
      setIconSrc(`${baseUrl}icons/${productId}.svg`);
      return;
    }

    // SVG failed too -> STOP and show default <i>
    setIconSrc(null);
  };

  // ----- Example values (adapt to your types/UI) -----
  const name = (product as any).nameAr ?? (product as any).name ?? productId;

  // If you store current/last price in your structure, keep it consistent:
  const latestPrice = useMemo(() => {
    const prices = (product as any).prices as Array<any> | undefined;
    if (!prices?.length) return null;

    if (typeof currentWeek === "number") {
      const found = prices.find((p) => p.week_number === currentWeek || p.week === currentWeek);
      if (found?.price != null) return found.price;
    }

    // fallback: last item
    const last = prices[prices.length - 1];
    return last?.price ?? null;
  }, [product, currentWeek]);

  const referencePrice = (product as any).reference_price ?? (product as any).referencePrice ?? null;

  // Simple comparison (optional)
  const priceDiff = useMemo(() => {
    if (latestPrice == null || referencePrice == null) return null;
    return Number(latestPrice) - Number(referencePrice);
  }, [latestPrice, referencePrice]);

  const diffColorClass =
    priceDiff == null
      ? "text-slate-600"
      : priceDiff > 0
      ? "text-red-600"
      : priceDiff < 0
      ? "text-green-600"
      : "text-slate-600";

  // ---------------------------------------------------

  return (
    <button
      dir={dir}
      type="button"
      onClick={() => onSelect?.(product.id)}
      className={[
        "w-full text-start rounded-xl border p-3 transition",
        selected ? "border-blue-500 ring-2 ring-blue-200" : "border-slate-200 hover:border-slate-300",
      ].join(" ")}
    >
      <div className="flex items-center gap-3">
        {/* ICON */}
        <div className="shrink-0 w-12 h-12 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden">
          {iconSrc ? (
            <img
              src={iconSrc}
              alt=""
              className="w-9 h-9 object-contain"
              onError={handleIconError}
              loading="lazy"
            />
          ) : (
            // Default icon (FontAwesome example)
            <i className="fa-solid fa-basket-shopping text-slate-600 text-xl" />
          )}
        </div>

        {/* TEXT */}
        <div className="min-w-0 flex-1">
          <div className="font-bold text-slate-800 truncate">{name}</div>

          <div className="mt-1 flex items-center gap-3 text-sm">
            <div className="text-slate-600">
              {lang === "ar" ? "السعر" : "Price"}:{" "}
              <span className="font-semibold">
                {latestPrice == null ? "—" : Number(latestPrice).toFixed(2)}
              </span>
            </div>

            <div className="text-slate-600">
              {lang === "ar" ? "الاسترشادي" : "Ref"}:{" "}
              <span className="font-semibold">
                {referencePrice == null ? "—" : Number(referencePrice).toFixed(2)}
              </span>
            </div>

            {priceDiff != null && (
              <div className={["font-semibold", diffColorClass].join(" ")}>
                {priceDiff > 0 ? "+" : ""}
                {priceDiff.toFixed(2)}
              </div>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}
