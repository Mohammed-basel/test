import { ProductWithPrices } from '../types';

export type Language = 'ar' | 'en';

type ProductLabels = Record<string, { ar: string; en: string }>;
type ProductMeta = Record<string, { icon: string; color: string }>;

/**
 * IMPORTANT:
 * - Product IDs in runtime are normalized (leading zeros removed), e.g. "11100103".
 * - The default icon file convention is: src/assets/icons/<PRODUCT_ID>.svg (or .png)
 *   You can drop your SVG/PNG there and it will automatically be used (even if the CSV icon column is empty).
 */

// Short display names by product code.
// The CSV `name` can be longer (brand/packaging). The UI uses these labels when present.
export const PRODUCT_LABELS: ProductLabels = {
  '11100103': { ar: 'أرز حبة قصيرة', en: 'Short-grain rice' },
  '11100107': { ar: 'أرز حبة طويلة', en: 'Long-grain rice' },
  '11100301': { ar: 'خبز كماج', en: 'Ka’maj bread' },
  '11210102': { ar: 'لحم عجل طازج', en: 'Fresh veal' },
  '11210201': { ar: 'لحم عجل مجمد', en: 'Frozen veal' },
  '11220102': { ar: 'دجاج منظف', en: 'Cleaned chicken' },
  '11420303': { ar: 'جبنة غنم بيضاء', en: 'White sheep cheese' },
  '11420308': { ar: 'جبنة بقرية (تصنيع آلي)', en: 'Cow cheese (industrial)' },
  '11430001': { ar: 'بيض دجاج', en: 'Chicken eggs' },
  '11510203': { ar: 'زيت الذرة', en: 'Corn oil' },
  '11510204': { ar: 'زيت عباد الشمس', en: 'Sunflower oil' },
  '11520101': { ar: 'سمنة نباتية', en: 'Vegetable ghee' },
  '11800105': { ar: 'سكر', en: 'Sugar' },
  '11800202': { ar: 'حلاوة', en: 'Halawa' },
  '11930206': { ar: 'طحينية', en: 'Tahini' },
  '11100604': { ar: 'قطايف', en: 'Qatayef' },
  '11101301': { ar: 'فريكة', en: 'Freekeh' },
  '11740201': { ar: 'عدس مجروش', en: 'Cracked lentils' },
  '11740302': { ar: 'حمص حب', en: 'Dried chickpeas' },
  '11210107': { ar: 'لحم خروف طازج', en: 'Fresh lamb' },
  '11210203': { ar: 'لحم خروف مجمد', en: 'Frozen lamb' },
  '11420105': { ar: 'لبن رايب', en: 'Laban (raib)' },
  '11101101': { ar: 'سميد نوع "أ"', en: 'Semolina (Type A)' },
  '11620302': { ar: 'تمر مجهول (حبة طويلة)', en: 'Medjool dates (long)' },
  '11620303': { ar: 'عجوة', en: 'Ajwa' },
};

// Icons and unique colors by product code. (Font Awesome 6 free icons)
// Colors are intentionally unique across the 25 products.
export const PRODUCT_META: ProductMeta = {
  '11100103': { icon: 'fa-bowl-rice', color: '#2E7D32' },
  '11100107': { icon: 'fa-bowl-rice', color: '#1565C0' },
  '11100301': { icon: 'fa-bread-slice', color: '#C62828' },
  '11210102': { icon: 'fa-cow', color: '#EF6C00' },
  '11210201': { icon: 'fa-snowflake', color: '#6D4C41' },
  '11220102': { icon: 'fa-drumstick-bite', color: '#6A1B9A' },
  '11420303': { icon: 'fa-cheese', color: '#00897B' },
  '11420308': { icon: 'fa-cheese', color: '#AD1457' },
  '11430001': { icon: 'fa-egg', color: '#0277BD' },
  '11510203': { icon: 'fa-oil-can', color: '#5D4037' },
  '11510204': { icon: 'fa-sun', color: '#F9A825' },
  '11520101': { icon: 'fa-droplet', color: '#455A64' },
  '11800105': { icon: 'fa-cubes', color: '#00838F' },
  '11800202': { icon: 'fa-candy-cane', color: '#D81B60' },
  '11930206': { icon: 'fa-bowl-food', color: '#8D6E63' },
  '11100604': { icon: 'fa-cookie-bite', color: '#fec627' },
  '11101301': { icon: 'fa-seedling', color: '#558B2F' },
  '11740201': { icon: 'fa-leaf', color: '#1B5E20' },
  '11740302': { icon: 'fa-seedling', color: '#33691E' },
  '11210107': { icon: 'fa-sheep', color: '#3949AB' },
  '11210203': { icon: 'fa-snowflake', color: '#7B1FA2' },
  '11420105': { icon: 'fa-mug-hot', color: '#00ACC1' },
  '11101101': { icon: 'fa-wheat-awn', color: '#7CB342' },
  '11620302': { icon: 'fa-calendar-days', color: '#8E24AA' },
  '11620303': { icon: 'fa-star', color: '#F4511E' },
};


export function getProductDisplayName(product: ProductWithPrices, language: Language): string {
  const labels = PRODUCT_LABELS[product.id];
  if (labels) return labels[language] || labels.ar;
  return product.name;
}

export function getProductIcon(product: ProductWithPrices): string {
  const meta = PRODUCT_META[product.id];
  // If CSV provides an explicit icon, respect it.
  if (product.icon && product.icon.trim() && product.icon.trim() !== 'fa-box') return product.icon.trim();
  return meta?.icon || 'fa-circle-info';
}

export function getProductColor(product: ProductWithPrices): string {
  const meta = PRODUCT_META[product.id];
  const defaultBlue = '#0056b3';
  if (product.color && product.color.trim() && product.color.trim().toLowerCase() !== defaultBlue) return product.color.trim();
  return meta?.color || '#0EA5E9';
}

export function normalizeForSearch(s: string): string {
  return (s || '')
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    .trim();
}
