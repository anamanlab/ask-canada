/** Small number helpers shared by the four money calculators. */
export const round2 = (n: number) => Math.round(n * 100) / 100;
export const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
export const num = (n: unknown, fallback: number) => (typeof n === 'number' && Number.isFinite(n) ? n : fallback);
