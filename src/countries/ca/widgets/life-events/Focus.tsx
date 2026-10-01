'use client';
import { Check } from 'lucide-react';
import { cn } from '@/lib/cn';
import { diffDays } from '@/lib/dates/business-days';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import { PASSED_HEADLINE } from './facts';
import messages from './messages';
import { pickKeyDue, type Due, type Plan } from './model';
import { useDate } from './parts';

/**
 * What the hero says: a countdown, a deadline that has passed, a deadline that's done, something that can start
 * now, or the event's key rule. `sr` is the same thing as one sentence, for the checklist's single announcer.
 */
export type FocusView = { sr: string } & (
  | { kind: 'passed'; date: string; headline: string; sub: string | null; calm: boolean }
  | { kind: 'count'; date: string; urgent: boolean; today: boolean; value: number; unit: string; label: string }
  | { kind: 'done'; date: string; headline: string; sub: string | null }
  | { kind: 'now'; headline: string }
  | { kind: 'hint' }
  | { kind: 'rule'; headline: string; sub: string | null }
);

type FocusInput = { plan: Plan; date: string | null; today: string; intro: boolean; done: string[]; skipped: string[] };

/**
 * The hero's focal point, worked out from the list: a ticked deadline hands over to the next open one, and once
 * none is left it says so calmly.
 */
export function useFocusView({ plan, date, today, intro, done, skipped }: FocusInput): FocusView {
  const t = useMessages(messages);
  const fmtDate = useDate();
  const ev = plan.event;
  const open = plan.tasks.filter((x) => !done.includes(x.id) && !skipped.includes(x.id));
  const key = pickKeyDue(open);
  const long = (iso: string) => fmtDate(iso, { month: 'long', day: 'numeric', year: 'numeric' });
  // In the hero's small line the date stays in one piece (never "October / 19, 2026").
  const whole = (iso: string) => long(iso).replace(/\s/g, '\u00a0');

  if (key?.passed) {
    const when = t(`due.${key.rule}.passed`, { date: long(key.date) });
    if (!PASSED_HEADLINE.has(key.rule)) return { kind: 'passed', date: key.date, headline: when, sub: null, calm: ev === 'death', sr: when };
    const headline = t(`count.passed.${key.rule}`);
    // A date that moved to the next business day says so: the row's note names the original due date.
    const sub = t(key.rolledFrom ? 'hero.wasDueRolled' : 'hero.wasDue', { date: whole(key.date) });
    return { kind: 'passed', date: key.date, headline, sub, calm: ev === 'death', sr: `${headline} ${sub}` };
  }

  // Nothing due, but the event itself is ahead (moving day, due date, CPP start): count down to it.
  const anchorDays = date ? diffDays(today, date) : null;
  const target = key
    ? { days: key.days, label: key.days === 0 ? t(`due.${key.rule}`, { date: long(key.date) }) : t(`count.${key.rule}`), date: key.date, urgent: key.kind === 'by' && key.days <= 14 }
    : anchorDays != null && anchorDays >= 0 && date
      ? { days: anchorDays, label: anchorDays === 0 ? t(`count.todayLabel.${plan.dateKind}`) : t(`count.anchor.${plan.dateKind}`), date, urgent: false }
      : null;

  if (target) {
    const useMonths = target.days > 60;
    const value = useMonths ? Math.round(target.days / 30.44) : target.days;
    const isToday = target.days === 0;
    // On the day itself the big word is "Today", not a zero.
    const unit = isToday ? t('count.today') : useMonths ? t('count.months', { count: value }) : t('count.days', { count: value });
    const sr = isToday ? t('count.todaySr', { label: target.label, date: long(target.date) }) : t('count.sr', { value, unit, label: target.label, date: long(target.date) });
    return { kind: 'count', date: target.date, urgent: target.urgent, today: isToday, value, unit, label: target.label, sr };
  }

  // The deadline the person has already ticked off (the event's own key deadline first).
  const doneDues = plan.tasks.filter((x) => done.includes(x.id) && !skipped.includes(x.id)).flatMap((x): Due[] => (x.due ? [x.due] : []));
  const finished = doneDues.find((d) => d.rule === plan.keyDue?.rule) ?? doneDues[0];
  if (finished) {
    const headline = t(`count.done.${finished.rule}`);
    return { kind: 'done', date: finished.date, headline, sub: finished.kind === 'by' ? t('hero.doneDue', { date: whole(finished.date) }) : null, sr: headline };
  }

  const now = open.find((x) => x.due?.kind === 'from' && x.due.passed)?.due;
  if (now) {
    const headline = t(`due.${now.rule}.passed`, { date: long(now.date) });
    return { kind: 'now', headline, sr: headline };
  }
  // The baby is already here: "as soon as your baby is born" would read as if the date had been ignored.
  if (plan.dateKind === 'birth' && anchorDays != null && anchorDays < 0) {
    const headline = open.some((x) => x.id === 'ccb') ? t('event.baby.rulePast') : t('event.baby.rulePastDone');
    return { kind: 'rule', headline, sub: null, sr: headline };
  }
  const rule = t(`event.${ev}.rule`);
  // The event's lead line is already the headline: the hero shows nothing more (the date field asks for the
  // date), and the prompt is only spoken.
  if (intro && !date) return { kind: 'hint', sr: t('hero.addDate') };
  if (date) return { kind: 'rule', headline: rule, sub: null, sr: rule };
  // Grief comes first: after a death the headline is the gentle lead, not a request for a date.
  const headline = ev === 'death' ? t('event.death.lead') : t('hero.addDate');
  return { kind: 'rule', headline, sub: rule, sr: `${headline} ${rule}` };
}

const SENTENCE = "m-0 font-serif text-[23px] leading-[1.2] tracking-[-.015em] text-pretty [font-variation-settings:'opsz'_36] @xl:text-[27px]";

/** A sentence beside the leaf has no room on a phone: these two kinds stack there (see Focus and Hero). */
export const stacks = (view: FocusView) => view.kind === 'passed' || view.kind === 'done';

/**
 * Renders the hero's focal point, as a cell of Hero's two-column grid (row 2, beside the progress ring). Silent
 * by itself: PlanView's announcer speaks `view.sr` when it changes.
 *
 * A missed or finished deadline is a sentence, not a number. In a narrow column its wrapper dissolves
 * (`contents`), so the leaf sits on the ring's row and the sentence gets the full width underneath; from @md
 * up it is leaf and sentence side by side again.
 */
export function Focus({ view }: { view: FocusView }) {
  const { fmt } = useLocale();
  // Nothing to show: Hero puts the lead, the meta line and the ring in one block instead (see Hero).
  if (view.kind === 'hint') return null;
  if (view.kind === 'rule' || view.kind === 'now') {
    return (
      <div className="col-start-1 row-start-2 min-w-0">
        <p className={cn(SENTENCE, 'flex items-start gap-2 text-ink')}>
          {view.kind === 'now' ? <Check className="mt-1.5 size-5 shrink-0 text-pine" strokeWidth={2.4} aria-hidden /> : null}
          <span className="min-w-0">{view.headline}</span>
        </p>
        {view.kind === 'rule' && view.sub ? <p className="m-0 mt-2 text-[14.5px] leading-snug text-ink-2 text-pretty">{view.sub}</p> : null}
      </div>
    );
  }
  if (view.kind === 'passed' || view.kind === 'done') {
    const isDone = view.kind === 'done';
    return (
      <div className="col-start-1 row-start-2 contents items-center gap-4 @md:flex @xl:gap-5">
        <span className="col-start-1 row-start-2 justify-self-start @max-md:pb-1.5">
          <CalendarLeaf date={view.date} tone={isDone ? 'done' : 'urgent'} />
        </span>
        <div className="col-span-2 row-start-3 min-w-0 @max-md:mt-4">
          {/* After a death, only the leaf carries the colour: the sentence stays calm. */}
          <p className={cn(SENTENCE, 'flex items-start gap-2', isDone || view.calm ? 'text-ink' : 'text-maple-ink')}>
            {isDone ? <Check className="mt-1.5 size-5 shrink-0 text-pine" strokeWidth={2.4} aria-hidden /> : null}
            <span className="min-w-0">{view.headline}</span>
          </p>
          {view.sub ? <p className={cn('m-0 mt-1 text-[13.5px] tabular-nums text-ink-3 @max-md:mt-1.5', isDone && 'ps-7')}>{view.sub}</p> : null}
        </div>
      </div>
    );
  }
  return (
    <div className="col-start-1 row-start-2 flex min-w-0 items-center gap-4 @xl:gap-5">
      <CalendarLeaf date={view.date} tone={view.urgent ? 'urgent' : 'plain'} />
      <div className="min-w-0">
        <p className="sr-only">{view.sr}</p>
        <p aria-hidden className={cn("m-0 font-serif leading-[.95] tracking-[-.035em] [font-variation-settings:'opsz'_72]", view.urgent ? 'text-maple-ink' : 'text-ink')}>
          {view.today ? (
            <span className="text-[30px] @md:text-[42px] @xl:text-[60px]">{view.unit}</span>
          ) : (
            // The pair takes its direction from the unit's own language, so a fallback-language "53 days"
            // keeps its order inside a right-to-left page (and a right-to-left unit still leads from the right).
            <bdi className="inline-flex flex-wrap items-baseline gap-x-2">
              <span className="text-[54px] tabular-nums @xl:text-[76px]">{fmt.number(view.value)}</span>
              <span className="text-[24px] tracking-[-.015em] @xl:text-[32px]">{view.unit}</span>
            </bdi>
          )}
        </p>
        <p aria-hidden className="m-0 mt-1.5 text-[15px] font-medium leading-snug text-ink-2 text-pretty @xl:text-[16px]">
          {view.label}
        </p>
      </div>
    </div>
  );
}

/**
 * A tear-off desk calendar for the date that matters: the page on top, the next one peeking out behind it, two
 * binder holes in the band. Decorative: the countdown text says the same.
 */
function CalendarLeaf({ date, tone }: { date: string; tone: 'plain' | 'urgent' | 'done' }) {
  const { fmt } = useLocale();
  // The locale's own short month ("Oct", "oct.", "10月"), as the formatter gives it; day and year straight from the ISO date.
  const month = fmt.date(date, { month: 'short' });
  // French short months run to six glyphs ("juill.", "sept.", "févr."): the longer the month, the smaller and
  // tighter it is set, so every month keeps a gutter between the two holes.
  const glyphs = [...month].length;
  return (
    <span aria-hidden className="relative inline-block shrink-0">
      <span className="absolute inset-x-1 -bottom-1.5 top-2 rotate-[5deg] rounded-[16px] border border-hair bg-paper-2 shadow-sm motion-reduce:rotate-0" />
      <span
        className={cn(
          'relative flex w-[68px] flex-col overflow-hidden rounded-[16px] border border-hair bg-card text-center shadow-md @xl:w-[84px] @xl:rounded-[19px]',
          tone === 'done' ? 'rotate-0' : '-rotate-2 motion-reduce:rotate-0',
        )}
      >
        <b
          className={cn(
            'relative block whitespace-nowrap py-1 font-semibold uppercase leading-[16.5px] text-card @xl:py-1.5 @xl:leading-[19px]',
            glyphs > 4 && 'text-[10px] tracking-[.03em] @xl:text-[11.5px] @xl:tracking-[.06em]',
            glyphs === 4 && 'text-[10.5px] tracking-[.06em] @xl:text-[12px] @xl:tracking-[.08em]',
            glyphs < 4 && 'text-[11px] tracking-[.1em] @xl:text-[12.5px]',
            tone === 'urgent' && 'bg-maple-ink',
            tone === 'plain' && 'bg-maple',
            tone === 'done' && 'bg-pine',
          )}
        >
          <span className="absolute start-[5px] top-1/2 size-[5px] -translate-y-1/2 rounded-full bg-card/55" />
          <span className="absolute end-[5px] top-1/2 size-[5px] -translate-y-1/2 rounded-full bg-card/55" />
          {month}
        </b>
        <span className={cn("block pt-1 font-serif text-[34px] leading-none tracking-[-.03em] [font-variation-settings:'opsz'_72] @xl:text-[44px]", tone === 'done' ? 'text-ink-3' : 'text-ink')}>
          {Number(date.slice(8, 10))}
        </span>
        <span className="block pb-1.5 pt-0.5 text-[10.5px] font-medium tabular-nums text-ink-3 @xl:pb-2 @xl:text-[11.5px]">{date.slice(0, 4)}</span>
      </span>
    </span>
  );
}
