/**
 * Icon registry for local SVG/PNG icons.
 *
 * How to add/override an icon:
 * 1) Put a file in: src/assets/icons/
 * 2) Name it by product id: 11100103.svg  (or .png)
 * 3) Leave products.csv icon column empty (or set icon to "11100103.svg") — both work.
 */

const ICONS = import.meta.glob('../assets/icons/*.{svg,png}', {
  eager: true,
  as: 'url',
}) as Record<string, string>;

function normalizeFileName(name: string): string {
  return (name || '').trim().replace(/^\//, '');
}

export function getLocalIconUrlByFileName(fileName: string): string | null {
  const clean = normalizeFileName(fileName);
  if (!clean) return null;

  // Match by ending of the path
  const hit = Object.entries(ICONS).find(([k]) => k.endsWith('/' + clean));
  return hit?.[1] || null;
}

export function getLocalIconUrlByProductId(productId: string): string | null {
  const id = (productId || '').trim();
  if (!id) return null;

  // Prefer svg then png
  const svg = getLocalIconUrlByFileName(`${id}.svg`);
  if (svg) return svg;
  const png = getLocalIconUrlByFileName(`${id}.png`);
  if (png) return png;

  return null;
}
