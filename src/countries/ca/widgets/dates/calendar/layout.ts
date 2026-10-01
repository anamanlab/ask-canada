/** How much the calendar shows before "show more" (shared with its skeleton, so both fold at the same point). */

/** Dates listed beside the month grid before "Show more" (keeps the agenda about as tall as the grid). */
export const AGENDA_CAP = 5;
/** Programs shown before "N more" in a narrow column (taxes and holidays always show). */
export const FILTERS_FOLDED = 4;
/** "Next for each" tiles shown in a phone-width column before "Show N more" (two rows). */
export const TILES_FOLDED = 4;

/**
 * The "next for each" tiles in the wide (two-column chat) layout: rows of four, three or two tiles that are always
 * full, so no row ends on an empty cell (8 → 4 + 4, 7 → 4 + 3, 5 → 3 + 2, 4 → one row). Returns each tile's span on
 * a 12-column grid. Narrower columns keep two tiles per row, and an odd last tile takes the whole row.
 */
export function tileSpans(count: number): (3 | 4 | 6)[] {
  const rows = Math.ceil(count / 4);
  const out: (3 | 4 | 6)[] = [];
  for (let r = 0, left = count; r < rows; r++) {
    const size = Math.ceil(left / (rows - r));
    left -= size;
    for (let i = 0; i < size; i++) out.push(size >= 4 ? 3 : size === 3 ? 4 : 6);
  }
  return out;
}
/** The spans as (static) classes, shared by the tiles and their skeleton. */
export const TILE_SPAN = { 3: '@2xl:col-span-3', 4: '@2xl:col-span-4', 6: '@2xl:col-span-6' } as const;
/** The tiles' grid, and the odd last tile of the two-per-row layout. */
export const TILE_GRID = 'grid grid-cols-2 gap-2 @2xl:grid-cols-12';
export const tileClass = (spans: (3 | 4 | 6)[], i: number) => [TILE_SPAN[spans[i]], spans.length % 2 === 1 && i === spans.length - 1 ? '@max-2xl:col-span-2' : ''];
