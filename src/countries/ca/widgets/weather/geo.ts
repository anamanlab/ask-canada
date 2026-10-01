/** Small geography helpers (pure, isomorphic): accent folding, great-circle distance, postal-code areas. */

/** "Saint-Jérôme", "St. Jerome" and "st jerome" all fold to the same key. */
export const fold = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[’'`]/g, '')
    .replace(/\bste?\b\.?/g, (m) => (m.startsWith('ste') ? 'sainte' : 'saint'))
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

export function distanceKm(aLat: number, aLon: number, bLat: number, bLon: number) {
  const r = Math.PI / 180;
  const dLat = (bLat - aLat) * r;
  const dLon = (bLon - aLon) * r;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(aLat * r) * Math.cos(bLat * r) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** A Canadian postal code or forward sortation area (only the first 3 characters are ever used). */
export function fsaOf(q: string): string | null {
  const m = q.toUpperCase().match(/\b([ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z])(?:\s?\d[ABCEGHJ-NPRSTV-Z]\d)?\b/);
  return m ? m[1] : null;
}
