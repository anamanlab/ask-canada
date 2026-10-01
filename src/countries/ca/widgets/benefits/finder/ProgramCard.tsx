'use client';
/**
 * One matched program: what it is and why it fits, the estimated amount (or a quiet ceiling), how to get it,
 * the next payment date, a follow-up to its estimator and the official page.
 */
import { motion, useReducedMotion } from 'motion/react';
import { ArrowUpRight, Calculator } from 'lucide-react';
import { Badge, ExternalLink } from '@/components/ui';
import { useChatActions } from '@/components/chat/actions';
import { cn } from '@/lib/cn';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import type { FinderOutput } from '../build';
import type { Match, Profile, Status } from '../calc';
import messages from '../messages';
import { CENTS, WHOLE } from '../parts';
import { PROGRAM_LOOK, type Known } from './look';

const STATUS_TONE: Record<Status, 'ok' | 'info' | 'warn' | 'neutral'> = { likely: 'ok', apply: 'info', check: 'warn', no: 'neutral' };
/** Badge labels clip to a 1em line box, which cuts the accent off a capital À or É: give it room (same pill height). */
const BADGE_ACCENTS = 'py-0.5 [&_.truncate]:py-px [&_.truncate]:leading-[1.2]';

function Amount({ m }: { m: Match }) {
  const t = useMessages(messages);
  const { fmt } = useLocale();
  const money = (n: number) => fmt.money(n, WHOLE);
  // Estimates of what this person gets are set large in serif; ceilings ("up to", "typically") stay quiet so a
  // maximum never reads like their amount.
  let main: string | null = null;
  let sub: string | null = null;
  let ceiling = false;
  if (m.cadence === 'coverage') main = t('amount.coverage');
  else if (m.weekly != null) {
    main = t('amount.week', { amount: money(m.weekly) });
    sub = t('amount.weekSub');
  } else if (m.annual != null) {
    main = t('amount.year', { amount: money(m.annual) });
    sub = m.cadence === 'quarterly' ? t('amount.quarterSub', { amount: money(m.annual / 4) }) : m.cadence === 'monthly' ? t('amount.monthSub', { amount: money(m.annual / 12) }) : null;
  } else {
    ceiling = true;
    if (m.id === 'ei' && m.upTo != null) {
      main = t('amount.upToWeek', { amount: money(m.upTo) });
      sub = t('amount.weekSub');
    } else if (m.id === 'cpp' && m.money?.average) main = t('amount.typical', { amount: money(m.money.average) });
    else if (m.id === 'gis' && m.money?.monthly) main = t('amount.upToMonth', { amount: fmt.money(m.money.monthly, CENTS) });
    else if (m.upTo != null) main = t('amount.upTo', { amount: money(m.upTo) });
  }
  if (!main) return null;
  return (
    <div className="text-start @md:text-end">
      <p
        className={cn(
          'm-0 whitespace-nowrap tabular-nums',
          ceiling ? 'text-[14.5px] font-medium leading-snug text-ink-2' : 'font-serif text-[20px] leading-tight tracking-[-.015em] text-ink',
        )}
      >
        <bdi>{main}</bdi>
      </p>
      {sub ? (
        <p className="m-0 mt-0.5 whitespace-nowrap text-[12.5px] text-ink-3">
          <bdi>{sub}</bdi>
        </p>
      ) : null}
    </div>
  );
}

export function useReason() {
  const t = useMessages(messages);
  const { fmt } = useLocale();
  return (m: Match) => {
    const vals: Record<string, string | number> = { ...(m.nums ?? {}) };
    for (const [k, v] of Object.entries(m.money ?? {})) vals[k] = fmt.money(v);
    const main = t(`program.${m.id}.${m.reason}`, vals);
    return m.note ? `${main} ${t(`program.${m.id}.note.${m.note}`, vals)}` : main;
  };
}

/** The follow-up question for a card's estimator, carrying the finder's answers so both show the same numbers. */
function useAsk(profile: Profile, known: Known, agesUnknown: boolean) {
  const t = useMessages(messages);
  const { fmt } = useLocale();
  const money = (n: number) => fmt.money(n, WHOLE);
  return (e: NonNullable<Match['estimator']>) => {
    if (e === 'ccb' && known.income && known.kids) {
      const count = profile.childrenUnder6 + profile.children6to17;
      // Ages not given yet: ask for the children without ages, so the estimator asks how many are under 6 too
      // (the 6-to-17 rate used meanwhile is our assumption, never something they said).
      if (agesUnknown && count > 0) {
        const all = t('ask.kidsAny', { count });
        const dis = Math.min(profile.childDisability, count);
        return t('ask.ccbWith', { kids: dis > 0 ? t('ask.kidsDis', { kids: all, count: dis }) : all, income: money(profile.income) });
      }
      const parts = [
        profile.childrenUnder6 ? t('ask.kidsU6', { count: profile.childrenUnder6 }) : '',
        profile.children6to17 ? t('ask.kids6', { count: profile.children6to17 }) : '',
      ].filter(Boolean);
      let kids = parts.length === 2 ? t('ask.and', { a: parts[0], b: parts[1] }) : parts[0];
      if (profile.childDisability > 0) kids = t('ask.kidsDis', { kids, count: profile.childDisability });
      return t('ask.ccbWith', { kids, income: money(profile.income) });
    }
    if (e === 'ei') {
      const own = profile.household === 'couple' ? profile.jobEarnings : known.income ? profile.workIncome : undefined;
      return own ? t('ask.eiWith', { amount: money(own) }) : t('ask.ei');
    }
    if (e === 'oas' && known.income) {
      const years = String(Math.min(profile.yearsInCanada, 40));
      const age75 = profile.age === '75-plus' ? 'yes' : 'no';
      // The recovery tax is on their own net income. A couple gave the family's: the estimator asks for theirs.
      if (profile.household === 'couple') return t('ask.oasYears', { years, age75 });
      return t('ask.oasWith', { years, income: money(profile.income), age75 });
    }
    return t(`ask.${e}`);
  };
}

export function ProgramCard({
  m,
  i,
  links,
  payments,
  profile,
  known,
  agesUnknown,
}: {
  m: Match;
  i: number;
  links: FinderOutput['links'];
  payments: FinderOutput['payments']['next'];
  profile: Profile;
  known: Known;
  /** They said how many children but not how old, and haven't answered the ages question yet. */
  agesUnknown: boolean;
}) {
  const t = useMessages(messages);
  const ask = useAsk(profile, known, agesUnknown);
  const { fmt } = useLocale();
  const { send } = useChatActions();
  const reduce = useReducedMotion();
  const reason = useReason();
  const look = PROGRAM_LOOK[m.id];
  const Icon = look.icon;
  const link = links[m.id];
  const next = m.pay ? payments[m.pay]?.[0] : undefined;
  const estimator = m.estimator;
  const details = m.status === 'check' && m.how !== 'already';
  const title = t(`program.${m.id}`);
  return (
    <motion.li
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(i, 6) * 0.04, type: 'spring', stiffness: 300, damping: 30 }}
      aria-label={title}
      // Without an Estimate button the footer holds only a text link in a 44px target: less padding under it, so
      // the space below the link matches the space above.
      className={cn('rounded-tile border border-hair bg-card px-4 pt-4 shadow-sm', estimator ? 'pb-4' : 'pb-2')}
    >
      {/* Phones: icon + title on one row, then body, amount and actions all from the icon's edge.
          Wider: body beside the icon and the amount in its own column; the footer lines up under the text. */}
      <div className="grid grid-cols-[2.5rem_minmax(0,1fr)] items-start gap-x-3.5 gap-y-2 @md:grid-cols-[2.5rem_minmax(0,1fr)_auto] @md:gap-y-0">
        <span className={cn('col-start-1 row-start-1 grid size-10 place-items-center rounded-field @md:row-span-2', look.tile)} aria-hidden>
          <Icon className="size-5" strokeWidth={1.8} />
        </span>
        {/* The badge follows the title in the text flow as one unit: beside it when there is room, and on the next
            line (flush with the title, the gap is a space that collapses there) when there isn't. A title that fits
            on one line is never broken in two just to keep the badge company. */}
        <div className="col-start-2 row-start-1 flex min-h-10 items-center @md:min-h-0">
          <h5 className="m-0 min-w-0 text-[15.5px] font-semibold leading-snug text-ink">
            <bdi>
              {title}
              <span className="tracking-[.3em]"> </span>
              {/* The label's line box must be tall enough for the accents on capitals (À demander, À vérifier). */}
              <Badge tone={STATUS_TONE[m.status]} className={cn(BADGE_ACCENTS, 'align-[.08em]')}>
                {t(`status.${m.status}`)}
              </Badge>
            </bdi>
          </h5>
        </div>
        <p className="col-span-2 col-start-1 row-start-2 m-0 text-[14px] leading-snug text-ink-2 @md:col-span-1 @md:col-start-2 @md:mt-1">
          <bdi>{reason(m)}</bdi>
        </p>
        <div className="col-span-2 col-start-1 row-start-3 @md:col-span-1 @md:col-start-3 @md:row-span-2 @md:row-start-1 @md:ps-3">
          <Amount m={m} />
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-hair pt-2 @md:ps-[3.375rem]">
        <span className="text-[12.5px] font-medium text-ink-3">
          <bdi>{m.how ? t(`how.${m.how}`) : t(`how.${link.how}`)}</bdi>
        </span>
        {next ? (
          <span className="inline-flex items-center gap-1.5 font-mono text-[12px] font-medium text-pine">
            <span className="size-1.5 rounded-full bg-pine" aria-hidden />
            <bdi>{t('card.next', { date: fmt.date(next, { month: 'short', day: 'numeric' }) })}</bdi>
          </span>
        ) : null}
        <span className="flex flex-wrap items-center gap-1.5 @max-md:w-full @max-md:justify-between @md:ms-auto @md:-me-2">
          {estimator ? (
            <button type="button" onClick={() => send(ask(estimator))} className="group inline-flex min-h-11 items-center rounded-chip text-[13.5px] font-medium text-ink">
              <span className="inline-flex items-center gap-1.5 rounded-chip border border-hair bg-paper-2 px-3 py-2 transition group-hover:bg-hair">
                <Calculator className="size-4" strokeWidth={1.8} aria-hidden />
                <bdi>{t('card.estimate')}</bdi>
                <span className="sr-only"> {t(`program.${m.id}`)}</span>
              </span>
            </button>
          ) : null}
          <ExternalLink
            href={details ? link.info : link.action}
            standalone
            icon={false}
            className="gap-1 rounded-chip px-3 text-[13.5px] no-underline transition hover:bg-paper-2 @max-md:first:-ms-3"
          >
            <bdi>{details ? t('card.details') : t('card.apply')}</bdi>
            <span className="sr-only"> {t(`program.${m.id}`)}</span>
            <ArrowUpRight className="size-4 flip-rtl" strokeWidth={1.8} aria-hidden />
          </ExternalLink>
        </span>
      </div>
    </motion.li>
  );
}
