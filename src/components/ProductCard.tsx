import { useEffect, useState } from 'react';
import { AlertTriangle, TrendingDown, TrendingUp } from 'lucide-react';
import { ProductWithPrices } from '../types';
import { getProductColor, getProductIcon } from '../lib/productMeta';

interface ProductCardProps {
  product: ProductWithPrices;
  isSelected: boolean;
  isDimmed?: boolean;
  onToggle: () => void;
  isHighestIncrease?: boolean;
  isLowestDecrease?: boolean;
  currentWeek: number;
}

function formatSignedPercent(v: number, decimals = 1) {
  const sign = v > 0 ? '+' : v < 0 ? '−' : '';
  return `${sign}${Math.abs(v).toFixed(decimals)}%`;
}

function badgeStyle(percent: number) {
  if (percent > 0.5) return { text: 'text-red-700', bg: 'bg-red-50', border: 'border-red-300' };
  if (percent < -0.5) return { text: 'text-green-700', bg: 'bg-green-50', border: 'border-green-300' };
  return { text: 'text-gray-700', bg: 'bg-gray-50', border: 'border-gray-200' };
}

export function ProductCard({
  product,
  isSelected,
  isDimmed,
  onToggle,
  isHighestIncrease,
  isLowestDecrease,
  currentWeek
}: ProductCardProps) {
  const weekPrice = product.prices.find(p => p.week_number === currentWeek)?.price ?? 0;
  const prevPrice = currentWeek > 1 ? (product.prices.find(p => p.week_number === currentWeek - 1)?.price ?? 0) : 0;

  // vs reference
  const diffRef = weekPrice - product.reference_price;
  const pctRef = product.reference_price ? (diffRef / product.reference_price) * 100 : 0;

  // vs previous week
  const diffPrev = weekPrice - prevPrice;
  const pctPrev = prevPrice ? (diffPrev / prevPrice) * 100 : 0;

  const isLargeChange = Math.abs(pctRef) > 5;

  const iconValue = getProductIcon(product);
  const colorValue = getProductColor(product);

  const baseUrl = import.meta.env.BASE_URL || '/';

  // Icons after build (no rebuild needed):
  // Put files in /public/icons/ (copied to dist/icons/):
  // - /icons/<productId>.png  (preferred)
  // - /icons/<productId>.svg  (fallback)
  const [iconSrc, setIconSrc] = useState<string>(`${baseUrl}${baseUrl.endsWith('/') ? '' : '/'}icons/${product.id}.png`);
  const [iconBroken, setIconBroken] = useState(false);

  useEffect(() => {
    setIconSrc(`${baseUrl}${baseUrl.endsWith('/') ? '' : '/'}icons/${product.id}.png`);
    setIconBroken(false);
  }, [product.id]);

  const handleIconError = () => {
    // Try SVG only if PNG is missing, then fallback to FontAwesome.
    if (iconSrc.endsWith('.png')) {
      setIconSrc(`${baseUrl}${baseUrl.endsWith('/') ? '' : '/'}icons/${product.id}.svg`);
      return;
    }
    setIconBroken(true);
  };

const refBadge = badgeStyle(pctRef);
const prevBadge = badgeStyle(pctPrev);

  return (
    <button
      onClick={onToggle}
      className={`bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-5 text-left w-full border-2 ${
        isSelected ? 'border-blue-600 shadow-2xl' : 'border-transparent hover:border-gray-200'
      } ${isLargeChange ? 'relative overflow-hidden' : ''} ${
        isDimmed && !isSelected ? 'opacity-40 grayscale' : ''
      }`}
    >
      {isLargeChange && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20 animate-pulse-glow pointer-events-none"></div>
      )}

      <div className="flex items-center gap-4 mb-4 relative">
        <div className="relative">
{!iconBroken ? (
  <img
    src={iconSrc}
    alt=""
    className={`w-14 h-14 object-contain transition-transform duration-300 ${isSelected ? 'scale-110' : ''}`}
    // If you want the icon to inherit the card color, export your SVG with fill="currentColor"
    // and use that color in the SVG itself. PNG/SVG-as-image won't auto-recolor.
  onError={handleIconError}
  />
) : (
  <i
    className={`fa-solid ${iconValue} text-5xl transition-transform duration-300 ${
      isSelected ? 'scale-110' : ''
    }`}
    style={{ color: colorValue }}
  />
)}

          {isHighestIncrease && (
            <div className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1.5 shadow-lg animate-pulse">
              <AlertTriangle className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
          )}
          {isLowestDecrease && (
            <div className="absolute -top-2 -right-2 bg-green-500 rounded-full p-1.5 shadow-lg animate-pulse">
              <TrendingDown className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
          )}
        </div>

        <div className="flex-1">
          <h3 className="text-2xl font-bold text-gray-800">{product.name}</h3>
          {product.weight && (
            <p className="text-sm font-semibold mt-1" style={{ color: colorValue }}>
              {product.weight}
            </p>
          )}
        </div>
      </div>

      <div className="text-center mb-3">
        <div
          className={`text-4xl font-black mb-2 transition-all duration-300 ${isSelected ? 'scale-110' : ''}`}
          style={{ color: colorValue }}
        >
          ₪{weekPrice.toFixed(2)}
        </div>

        {/* ✅ Excel-like badges */}
        <div className="flex flex-wrap justify-center gap-2">
          <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg font-bold text-sm border ${refBadge.bg} ${refBadge.border}`}>
            {pctRef > 0.5 ? (
              <TrendingUp className={`w-4 h-4 ${refBadge.text}`} />
            ) : pctRef < -0.5 ? (
              <TrendingDown className={`w-4 h-4 ${refBadge.text}`} />
            ) : (
              <span className={`${refBadge.text}`}>→</span>
            )}
            <span className={`${refBadge.text}`}>عن الاسترشادي: {formatSignedPercent(pctRef, 1)}</span>
            <span className="text-gray-500 font-semibold">({formatSignedPercent(diffRef, 2).replace('%','')} ₪)</span>
          </div>

          <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg font-bold text-sm border ${prevBadge.bg} ${prevBadge.border}`}>
            {currentWeek === 1 ? (
              <span className="text-gray-600">—</span>
            ) : pctPrev > 0.5 ? (
              <TrendingUp className={`w-4 h-4 ${prevBadge.text}`} />
            ) : pctPrev < -0.5 ? (
              <TrendingDown className={`w-4 h-4 ${prevBadge.text}`} />
            ) : (
              <span className={`${prevBadge.text}`}>→</span>
            )}
            <span className={`${prevBadge.text}`}>
              عن الأسبوع السابق: {currentWeek === 1 ? '—' : formatSignedPercent(pctPrev, 1)}
            </span>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center text-sm text-gray-600 pt-3 border-t border-gray-100 text-right">
        <div>
          <span className="font-semibold">السعر الاسترشادي: </span>
          <span className="font-bold">₪{product.reference_price.toFixed(2)}</span>
        </div>
        <div className="text-gray-500">الأسبوع {currentWeek}</div>
      </div>
    </button>
  );
}
