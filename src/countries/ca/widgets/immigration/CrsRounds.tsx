'use client';
/** Express Entry rounds of invitations: the latest round as a hero and the table of recent rounds. */
import { useState } from 'react';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useToday } from '@/lib/hooks';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import { NAMED_KINDS, type Draw, type DrawKind } from './draws';
import messages from './messages';
import { Eyebrow, Hero, useDate } from './Shared';

const KIND_TONE: Partial<Record<DrawKind, string>> = { cec: 'bg-pine', pnp: 'bg-glacier', general: 'bg-ink', fsw: 'bg-ink', fst: 'bg-ink' };
const kindTone = (k: DrawKind) => KIND_TONE[k] ?? 'bg-amber';

/** Official round name in the reader's language: standard types from our messages, category rounds from the feed. */
export function useRoundName() {
  const t = useMessages(messages);
  const { locale } = useLocale();
  return (d: Draw) => (NAMED_KINDS.includes(d.kind) ? t(`round.${d.kind}`) : ((locale === 'fr' ? d.names?.fr : d.names?.en) ?? d.name));
}

/**
 * A round's date in a list or a sentence: the year is added when it isn't this year's ("Dec 16, 2026" in a
 * January table). Until the reader's clock is known (server render), "this year" is the latest round's year.
 */
export function useRoundDate(latest: string | undefined) {
  const fdate = useDate();
  const year = useToday(latest ?? '').slice(0, 4);
  return (iso: string, month: 'short' | 'long') => fdate(iso, { month, day: 'numeric', ...(iso.slice(0, 4) === year ? {} : { year: 'numeric' }) });
}

/** Rounds mode hero: the latest round's cut-off, how many were invited and which kind of round it was. */
export function LatestRound({ draw, live = true }: { draw: Draw; live?: boolean }) {
  const t = useMessages(messages);
  const { fmt } = useLocale();
  const roundName = useRoundName();
  const fdate = useDate();
  return (
    <Hero tone="glacier">
      <Eyebrow>{t(live ? 'crs.latest.eyebrow' : 'crs.latest.eyebrowOff', { date: fdate(draw.date, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) })}</Eyebrow>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
        <div>
          <p className="m-0 font-serif text-[64px] leading-[.9] tracking-[-.04em] text-ink [font-variation-settings:'opsz'_96]">
            <bdi dir="ltr">{fmt.number(draw.crs)}</bdi>
          </p>
          <p className="m-0 mt-1.5 text-[13.5px] text-ink-2">{t('crs.latest.cutoff')}</p>
        </div>
        <div className="text-end max-sm:text-start">
          <p className="m-0 font-serif text-[30px] leading-none tracking-[-.02em] text-ink">
            <bdi dir="ltr">{fmt.number(draw.size)}</bdi>
          </p>
          <p className="m-0 mt-1 text-[12.5px] text-ink-2">{t('crs.latest.invited')}</p>
        </div>
      </div>
      <p className="m-0 mt-4 flex items-start gap-2 text-[15px] font-medium leading-snug text-ink">
        <i className={cn('mt-[6px] inline-block size-2.5 shrink-0 rounded-full', kindTone(draw.kind))} aria-hidden />
        <span>{roundName(draw)}</span>
      </p>
      <p className="m-0 mt-1 text-[13px] leading-snug text-ink-3">{t('crs.latest.note')}</p>
    </Hero>
  );
}

/** Every recent round with its exact cut-off (the text equivalent of the cut-off track); ticks the ones the score clears. */
export function Rounds({ draws, score }: { draws: Draw[]; score: number | null }) {
  const t = useMessages(messages);
  const { fmt } = useLocale();
  const roundName = useRoundName();
  const [all, setAll] = useState(false);
  const rdate = useRoundDate(draws[0]?.date);
  const shown = all ? draws : draws.slice(0, 6);
  return (
    <>
      <table className="w-full border-collapse text-start text-[13.5px]">
        <caption className="sr-only">{t('crs.rounds.caption')}</caption>
        <thead>
          <tr className="border-b border-hair text-[12.5px] text-ink-2">
            <th scope="col" className="whitespace-nowrap py-2 pe-3 text-start font-medium">
              {t('crs.rounds.date')}
            </th>
            <th scope="col" className="py-2 pe-3 text-start font-medium">
              {t('crs.rounds.type')}
            </th>
            <th scope="col" className="hidden whitespace-nowrap py-2 pe-3 text-end font-medium @xl:table-cell">
              {t('crs.rounds.invited')}
            </th>
            <th scope="col" className="whitespace-nowrap py-2 text-end font-medium">
              {t('crs.rounds.cutoff')}
            </th>
          </tr>
        </thead>
        <tbody>
          {shown.map((x) => {
            const ok = score != null && score >= x.crs;
            return (
              <tr key={x.number} className="border-b border-hair last:border-b-0">
                <td className="whitespace-nowrap py-2.5 pe-3 align-top tabular-nums text-ink-2">{rdate(x.date, 'short')}</td>
                <td className="py-2.5 pe-3 align-top text-ink">
                  <span className="inline-flex items-start gap-2">
                    <i className={cn('mt-[6px] inline-block size-2 shrink-0 rounded-full', kindTone(x.kind))} aria-hidden />
                    <span>
                      {roundName(x)}
                      {/* Narrow columns drop the "Invited" column: the number moves under the round's name. */}
                      <bdi className="block text-[12.5px] tabular-nums text-ink-3 @xl:hidden">{t('crs.rounds.invitedCount', { count: x.size })}</bdi>
                    </span>
                  </span>
                </td>
                <td className="hidden py-2.5 pe-3 text-end align-top tabular-nums text-ink-2 @xl:table-cell">{fmt.number(x.size)}</td>
                <td className="whitespace-nowrap py-2.5 text-end align-top">
                  <span className={cn('inline-flex items-center gap-1.5 text-[14px] font-semibold tabular-nums', ok ? 'text-pine' : 'text-ink')}>
                    {ok ? <Check className="size-3.5" strokeWidth={3} aria-hidden /> : null}
                    {fmt.number(x.crs)}
                    {ok ? <span className="sr-only">{t('crs.rounds.youClear')}</span> : null}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="m-0 mt-2 max-w-[60ch] text-[13px] leading-snug text-ink-2">{t('crs.rounds.note')}</p>
      {draws.length > 6 ? (
        <Button size="md" variant="quiet" className="-ms-3 mt-1 px-3" iconEnd={all ? ChevronUp : ChevronDown} onClick={() => setAll((v) => !v)} aria-expanded={all}>
          {all ? t('crs.rounds.less') : t('crs.rounds.more', { count: draws.length })}
        </Button>
      ) : null}
    </>
  );
}
