'use client';
/** One matched occupation: score, why it matched (in the person's own words), median pay and next steps. */
import { Coins } from 'lucide-react';
import { Button, LinkButton } from '@/components/ui';
import { useChatActions } from '@/components/chat/actions';
import { cn } from '@/lib/cn';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import { inProvince, type Lang, type Province } from './data';
import messages from './messages';
import { displayTerm, lcFirst } from './text';
import type { OccupationMatch } from './types';

/** A skill or title chip: its folded key and the words the person used. */
export type ChipWords = { key: string; label: string };

/** Reasons shown on a card ("Because of retail, Excel…"). */
const MAX_REASONS = 5;

/**
 * Why a card matched, in the person's own words: each hit maps back to the chip that contains it
 * ("retail" → "retail sales associate", "merchandising" → "visual merchandising"), titles first, with
 * repeats and phrases inside another one dropped.
 */
function reasons(m: OccupationMatch, chips: ChipWords[], text: string): string[] {
  const labels = new Map<string, string>();
  for (const k of [...m.matchedTitles, ...m.matchedSkills]) {
    const chip = chips.find((c) => c.key === k) ?? chips.find((c) => ` ${c.key} `.includes(` ${k} `));
    const key = chip?.key ?? k;
    if (!labels.has(key)) labels.set(key, chip?.label ?? displayTerm(text, k));
  }
  const keys = [...labels.keys()];
  return keys
    .filter((k) => !keys.some((x) => x !== k && ` ${x} `.includes(` ${k} `)))
    .slice(0, MAX_REASONS)
    .flatMap((k) => labels.get(k) ?? []);
}

export function MatchCard({ m, rank, text, chips, lang, province }: { m: OccupationMatch; rank: number; text: string; chips: ChipWords[]; lang: Lang; province?: Province }) {
  const t = useMessages(messages);
  const { fmt } = useLocale();
  const { send } = useChatActions();
  const top = rank === 1;
  const evidence = reasons(m, chips, text);
  const askPay = () =>
    send(
      t('wages.askIn', {
        title: lcFirst(m.title),
        vowel: /^[aeiou]/i.test(m.title) ? 'yes' : 'no',
        inPlace: province ? inProvince(lang, province) : '',
      }).replace(/\s+\?/, '?'),
    );
  return (
    <article className={cn('rounded-tile border px-4 py-4', top ? 'border-maple/25 bg-[linear-gradient(135deg,color-mix(in_oklab,var(--maple)_7%,var(--card)),var(--card))] shadow-md' : 'border-hair bg-card shadow-sm')}>
      <div className="flex items-start gap-3.5">
        <ScoreRing score={m.score} top={top} />
        <div className="min-w-0 flex-1">
          <p className="m-0 font-mono text-[11px] font-medium uppercase tracking-[.1em] text-ink-3">
            {top ? t('match.best') : t('match.rank', { rank })} · {t('match.noc', { noc: m.noc })}
          </p>
          <h5 className="m-0 mt-0.5 text-[16px] font-semibold leading-snug text-ink">{m.title}</h5>
          {evidence.length ? <p className="m-0 mt-1 text-[13.5px] leading-snug text-ink-2">{t('match.because', { list: evidence.join(t('match.listSep')) })}</p> : null}
        </div>
      </div>
      {/* Laid out by the card's width, never by its words: every card in a list breaks the same way, in English and French. */}
      <div className="mt-3 grid grid-cols-[minmax(0,1fr)] items-center gap-2 ps-0 @sm:ps-[62px] @2xl:grid-cols-[minmax(0,1fr)_auto] @2xl:gap-x-4">
        <span className="text-[13.5px] leading-snug text-balance text-ink-2">
          <b className="font-semibold text-ink">{fmt.money(m.median, { cents: 'always' })}</b> {t('match.medianShort')}
        </span>
        <span className="-ms-0.5 flex flex-wrap items-center gap-1">
          <LinkButton href={m.searchUrl} external size="md" variant={top ? 'accent' : 'secondary'} className="px-4 text-[13.5px]">
            {t('match.searchJobs')}
          </LinkButton>
          <Button size="md" variant="quiet" icon={Coins} className="px-2.5 text-[13.5px] text-ink-2 hover:text-ink" onClick={askPay}>
            {t('match.seePay')}
          </Button>
        </span>
      </div>
    </article>
  );
}

function ScoreRing({ score, top }: { score: number; top: boolean }) {
  const t = useMessages(messages);
  return (
    <span
      className="relative grid size-12 shrink-0 place-items-center rounded-full"
      style={{ background: `conic-gradient(var(${top ? '--maple' : '--pine'}) ${score * 3.6}deg, var(--paper-2) 0)` }}
      role="img"
      aria-label={t('match.scoreAria', { score })}
    >
      <span className="grid size-[38px] place-items-center rounded-full bg-card font-mono text-[13px] font-semibold tabular-nums text-ink">{score}</span>
    </span>
  );
}
