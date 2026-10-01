/**
 * A bill's progress through both chambers and royal assent: a thin bar for list rows (`compact`) or one
 * labelled row per chamber. Tokens only; RTL-safe.
 */
import { Crown } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { TrackStep } from './types';

export type TrackLabels = {
  house: string;
  senate: string;
  assent: string;
  /** Short label inside the royal-assent pill ("Assent"), shown on wide widths next to the crown. */
  assentShort: string;
  /** Short pill label ("1st", "Comm.", "Report"), used on narrow widths. */
  stage: (s: TrackStep) => string;
  /** Full pill label ("1st reading", "Committee", "Report stage"), used on wide widths. */
  stageLong: (s: TrackStep) => string;
  /** Tooltip: "House of Commons: committee · passed Sep 22, 2026". */
  title: (s: TrackStep) => string;
  now: string;
  /** Replaces "Now" when the bill is not moving: parked (outside the Order of Precedence) or defeated. */
  stopped: string;
  passed: (date: string) => string;
  /** Royal assent row: "Given Jun 18, 2026". */
  assented: (date: string) => string;
};

type Group = { key: TrackStep['chamber']; steps: { s: TrackStep; i: number }[] };

function groupsOf(track: TrackStep[]): Group[] {
  const groups: Group[] = [];
  track.forEach((s, i) => {
    const last = groups[groups.length - 1];
    if (last && last.key === s.chamber) last.steps.push({ s, i });
    else groups.push({ key: s.chamber, steps: [{ s, i }] });
  });
  return groups;
}

// Done pills use text-paper on pine: it flips with the theme, so the label stays AA in light and dark.
// A parked or defeated bill's current step is dashed and neutral: it's where the bill sits, not where it's moving.
const pillTone = (s: TrackStep, current: boolean, stopped?: boolean) =>
  s.done
    ? 'bg-pine text-paper'
    : current && stopped
      ? 'border border-dashed border-ink-3 bg-card text-ink-2'
      : current
        ? 'bg-maple-wash text-maple-ink ring-[1.5px] ring-maple ring-inset'
        : 'bg-paper-2 text-ink-2 ring-1 ring-hair-2 ring-inset';

/**
 * A bill's path through both chambers (1st reading, 2nd reading, committee, report stage, 3rd reading) and royal
 * assent. `compact` is a thin progress bar for list rows; the full track has one labelled row per chamber.
 * Decorative (aria-hidden): pair it with an sr-only sentence that names the current stage.
 */
export function BillTrack({ track, at, compact, stopped, labels }: { track: TrackStep[]; at: number; compact?: boolean; stopped?: boolean; labels: TrackLabels }) {
  const groups = groupsOf(track);
  if (compact) {
    return (
      <div className="flex items-start gap-1.5" aria-hidden>
        {groups.map((g) => (
          <div key={g.key} className={cn('min-w-0', g.key === 'assent' ? 'shrink-0' : 'flex-1')}>
            <div className="flex items-center gap-[3px]">
              {g.steps.map(({ s, i }) => (
                <span key={i} title={labels.title(s)} className={cn('h-2 rounded-full', g.key === 'assent' ? 'w-6' : 'flex-1', pillTone(s, i === at, stopped))} />
              ))}
            </div>
            <div className={cn('mt-1.5 truncate font-mono text-[10.5px] font-medium uppercase leading-[1.5] tracking-[.08em]', g.steps.some(({ i }) => i === at) && !stopped ? 'text-maple-ink' : 'text-ink-3')}>
              {labels[g.key]}
            </div>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3.5" aria-hidden>
      {groups.map((g) => {
        const hasNow = g.steps.some(({ i }) => i === at);
        const last = g.steps[g.steps.length - 1].s;
        const assent = g.key === 'assent';
        const status = hasNow ? (
          <span className={cn('text-[12px] font-semibold', stopped ? 'text-ink-2' : 'text-maple-ink')}>{stopped ? labels.stopped : labels.now}</span>
        ) : last.done && last.date ? (
          <span className="text-[12px] font-medium text-pine">{assent ? labels.assented(last.date) : labels.passed(last.date)}</span>
        ) : null;
        if (assent) {
          // One stage, drawn as a stage pill (same width as a reading above, aligned under 3rd reading) with a crown.
          const { s, i } = g.steps[0];
          return (
            <div key={g.key} className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-0.5">
                <span className={cn('font-mono text-[11px] font-medium uppercase tracking-[.1em]', hasNow && !stopped ? 'text-maple-ink' : 'text-ink-2')}>{labels.assent}</span>
                {status}
              </div>
              <span
                title={labels.title(s)}
                className={cn(
                  'flex h-8 w-[calc((100%-1rem)/5)] shrink-0 items-center justify-center gap-1 rounded-[calc(var(--radius-field)*0.66)] px-1 transition-colors',
                  pillTone(s, i === at, stopped),
                )}
              >
                <Crown className="size-3.5 shrink-0" strokeWidth={2.2} />
                <bdi className="hidden max-w-full truncate text-[11px] font-semibold leading-[1.5] @xl:inline">{labels.assentShort}</bdi>
              </span>
            </div>
          );
        }
        return (
          <div key={g.key}>
            <div className="mb-1.5 flex items-baseline justify-between gap-3">
              <span className={cn('font-mono text-[11px] font-medium uppercase tracking-[.1em]', hasNow && !stopped ? 'text-maple-ink' : 'text-ink-2')}>{labels[g.key]}</span>
              {status}
            </div>
            <div className="flex items-center gap-1">
              {g.steps.map(({ s, i }) => (
                <span
                  key={i}
                  title={labels.title(s)}
                  className={cn('grid h-8 min-w-0 flex-1 place-items-center rounded-[calc(var(--radius-field)*0.66)] px-1 transition-colors', pillTone(s, i === at, stopped))}
                >
                  {/* `truncate` clips at the line box: 1.5 leaves room for accented capitals ("Étape du rapport"). */}
                  <span className="max-w-full truncate text-[11px] font-semibold leading-[1.5]">
                    <bdi className="@xl:hidden">{labels.stage(s)}</bdi>
                    <bdi className="hidden @xl:inline">{labels.stageLong(s)}</bdi>
                  </span>
                </span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
