/**
 * The House of Commons as a hemicycle: one dot per seat, vacant seats as open rings. The dots fade in with a
 * left-to-right sweep (one shared CSS keyframe with a per-dot delay; no animation with reduced motion).
 */
import { cn } from '@/lib/cn';

type SeatDot = { x: number; y: number; a: number; row: number };

function hemicycle(total: number, rows = 8, w = 320): { dots: SeatDot[]; r: number; h: number } {
  const outer = w / 2 - 6;
  const inner = outer * 0.48;
  const radii = Array.from({ length: rows }, (_, i) => inner + ((outer - inner) * i) / (rows - 1));
  const sum = radii.reduce((a, b) => a + b, 0);
  const counts = radii.map((r) => Math.round((total * r) / sum));
  counts[rows - 1] += total - counts.reduce((a, b) => a + b, 0);
  const dots: SeatDot[] = [];
  radii.forEach((r, row) => {
    const n = counts[row];
    for (let j = 0; j < n; j++) {
      const a = Math.PI - (j * Math.PI) / Math.max(1, n - 1);
      dots.push({ x: w / 2 + r * Math.cos(a), y: outer + 6 - r * Math.sin(a), a, row });
    }
  });
  // Fill like a real chamber chart: sweep from left to right across all rows.
  dots.sort((p, q) => q.a - p.a || p.row - q.row);
  const spacing = (Math.PI * outer) / counts[rows - 1];
  return { dots, r: Math.min(4.4, spacing * 0.4), h: outer + 12 };
}

/** Vacant seats: the right-hand end of each row, outer rows first, so they read as one group along the floor. */
function vacantSeats(dots: SeatDot[], vacant: number): Set<number> {
  const byRow = new Map<number, number[]>();
  dots.forEach((d, i) => byRow.set(d.row, [...(byRow.get(d.row) ?? []), i]));
  const rows = [...byRow.entries()].sort(([a], [b]) => b - a).map(([, seats]) => seats.sort((a, b) => dots[a].a - dots[b].a));
  const picked = new Set<number>();
  for (let k = 0; picked.size < vacant && k < 50; k++) {
    for (const seats of rows) if (picked.size < vacant && seats[k] != null) picked.add(seats[k]);
  }
  return picked;
}

const SWEEP_MS = 900;
const dot = 'motion-safe:[animation:fade-in_.35s_ease-out_both]';

export function SeatChart({ seats, vacant = 0, label, className }: { seats: number; vacant?: number; label: string; className?: string }) {
  const { dots, r, h } = hemicycle(seats);
  const empties = vacantSeats(dots, vacant);
  const delay = (i: number) => ({ animationDelay: `${Math.round((i / seats) * SWEEP_MS)}ms` });
  return (
    <svg viewBox={`0 0 320 ${h}`} role="img" aria-label={label} className={cn('block w-full', className)}>
      <g className="fill-ink-2 opacity-[.82]">
        {dots.map((d, i) => (empties.has(i) ? null : <circle key={i} cx={d.x} cy={d.y} r={r} className={dot} style={delay(i)} />))}
      </g>
      <g className="fill-card stroke-maple" strokeWidth={1.3}>
        {dots.map((d, i) => (empties.has(i) ? <circle key={i} cx={d.x} cy={d.y} r={r} className={dot} style={delay(i)} /> : null))}
      </g>
    </svg>
  );
}
