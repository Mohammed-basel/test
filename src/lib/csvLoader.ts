// src/lib/csvLoader.ts
// Replaces Supabase - reads CSV/JSON files served by the same PCBS server

import { ProductWithPrices } from '../types';

/**
 * Loads data from files served from the public site.
 *
 * For Vite/React:
 * - Put source files in: /public/data/
 * - After build + deploy, they are accessible at runtime from: /data/
 *
 * Required files:
 * - /data/products.csv
 * - /data/weekly_prices.csv
 */

interface CSVProduct {
  id: string;
  name: string;
  icon: string;
  color: string;
  reference_price: number;
  display_order: number;
  weight?: string;
}

interface CSVPrice {
  id: string;
  product_id: string;
  week_number: number;
  price: number;
  week_date?: string;
}

const NAME_OVERRIDES: Record<string, string> = {
  '11100103': 'أرز حبة قصيرة',
  '11100107': 'أرز حبة طويلة',
  '11100301': 'خبز كماج',
  '11210102': 'لحم عجل طازج',
  '11210201': 'لحم عجل مجمد',
  '11220102': 'دجاج منظف',
  '11420303': 'جبة غنم بيضاء',
  '11430001': 'بيض دجاج',
  '11510203': 'زيت الذرة',
  '11510204': 'زيت عباد الشمس',
  '11520101': 'سمنة نباتية',
  '11800105': 'سكر',
  '11800202': 'حلاوة',
  '11930206': 'طحينية',
  '11100604': 'قطايف',
  '11101301': 'فريكة',
  '11740201': 'عدس مجروش',
  '11740302': 'حمص حب',
  '11210107': 'لحم خروف طازج',
  '11210203': 'لحم خروف مجمد',
  '11420105': 'لبن رايب',
};

function normalizeId(v: any): string {
  return String(v ?? '').replace(/^0+/, '');
}
// Parse CSV text to array of objects (supports quoted values and commas)
function parseCSV<T>(csvText: string): T[] {
  const text = (csvText || '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .trim();

  if (!text) return [];

  // Parse into rows/fields (RFC4180-ish)
  const rows: string[][] = [];
  let curRow: string[] = [];
  let field = '';
  let inQuotes = false;

  const pushField = () => {
    curRow.push(field);
    field = '';
  };

  const pushRow = () => {
    if (curRow.some(v => v.trim() !== '')) rows.push(curRow);
    curRow = [];
  };

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (ch === '"') {
      // Escaped quote inside quotes: ""
      if (inQuotes && next === '"') {
        field += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (ch === ',' && !inQuotes) {
      pushField();
      continue;
    }

    if (ch === '\n' && !inQuotes) {
      pushField();
      pushRow();
      continue;
    }

    field += ch;
  }

  pushField();
  pushRow();

  if (rows.length === 0) return [];

  const headers = rows[0].map(h => h.trim());
  const data: T[] = [];

  for (let r = 1; r < rows.length; r++) {
    const values = rows[r];
    const obj: any = {};

    headers.forEach((header, index) => {
      let value: any = (values[index] ?? '').trim();

      if (value === '') {
        obj[header] = '';
        return;
      }

      // Convert numbers, but keep leading-zero codes (e.g., 011100103) as strings
      const looksLikeCode = /^0\d+$/.test(value);
      const looksNumeric = /^-?\d+(\.\d+)?$/.test(value);

      if (!looksLikeCode && looksNumeric) {
        obj[header] = Number(value);
        return;
      }

      obj[header] = value;
    });

    data.push(obj as T);
  }

  return data;
}

/**
 * Load products and weekly prices from CSV files
 *
 * Runtime URLs (after deployment):
 * - /data/products.csv
 * - /data/weekly_prices.csv
 *
 * Optional env:
 * - VITE_DATA_PATH=/some/path/   (must end with /)
 */
export async function loadDataFromCSV(): Promise<ProductWithPrices[]> {
  try {
    const baseUrl = import.meta.env.BASE_URL || '/';
    const dataPath = import.meta.env.VITE_DATA_PATH || `${baseUrl}${baseUrl.endsWith('/') ? '' : '/'}data/`;

    // Fetch both CSV files
    const [productsResponse, pricesResponse] = await Promise.all([
      fetch(`${dataPath}products.csv`, { cache: 'no-store' }),
      fetch(`${dataPath}weekly_prices.csv`, { cache: 'no-store' }),
    ]);

    if (!productsResponse.ok || !pricesResponse.ok) {
      throw new Error(
        `Failed to load CSV files. products=${productsResponse.status}, prices=${pricesResponse.status}`
      );
    }

    const productsText = await productsResponse.text();
    const pricesText = await pricesResponse.text();

    const productsRaw = parseCSV<CSVProduct>(productsText);
    const pricesRaw = parseCSV<CSVPrice>(pricesText);

    const products = productsRaw.map((p: any) => {
      const id = normalizeId(p.id);
      return {
        ...p,
        id,
        name: NAME_OVERRIDES[id] ?? String(p.name ?? ''),
        icon: String(p.icon ?? ''),
        color: String(p.color ?? ''),
        weight: p.weight ? String(p.weight) : undefined,
        reference_price: Number(p.reference_price) || 0,
        display_order: Number(p.display_order) || 0,
      };
    });

    const prices = pricesRaw.map((pr: any) => ({
      ...pr,
      id: String(pr.id ?? ''),
      product_id: normalizeId(pr.product_id),
      week_number: Number(pr.week_number) || 0,
      price: Number(pr.price) || 0,
      week_date: pr.week_date ? String(pr.week_date) : undefined,
    }));

    // Combine products with their prices
    const productsSorted = [...products].sort((a, b) => (Number(a.display_order) || 0) - (Number(b.display_order) || 0));

    const productsWithPrices: ProductWithPrices[] = productsSorted.map(product => ({
      ...product,
      prices: prices.filter(p => p.product_id === product.id),
    }));

    return productsWithPrices;
  } catch (error) {
    console.error('Error loading CSV data:', error);
    throw error;
  }
}

/**
 * Alternative: Load from JSON file (if you prefer)
 * Runtime URL:
 * - /data/ramadan-data.json
 */
export async function loadDataFromJSON(): Promise<ProductWithPrices[]> {
  try {
    const baseUrl = import.meta.env.BASE_URL || '/';
    const dataPath = import.meta.env.VITE_DATA_PATH || `${baseUrl}${baseUrl.endsWith('/') ? '' : '/'}data/`;
    const response = await fetch(`${dataPath}ramadan-data.json`, { cache: 'no-store' });

    if (!response.ok) {
      throw new Error(`Failed to load JSON data. status=${response.status}`);
    }

    const data = await response.json();
    return data.products || [];
  } catch (error) {
    console.error('Error loading JSON data:', error);
    throw error;
  }
}
