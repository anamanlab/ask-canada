'use client';
/** "What would raise your score": ideas the person can try with one tap, and undo. */
import { useId, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { ArrowRight, Check, ChevronDown, ChevronUp, Undo2 } from 'lucide-react';
import { Button } from '@/components/ui';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import type { Profile } from './crs';
import type { Boost } from './crs-insights';
import messages from './messages';
import { Fold, Section } from './Shared';

/**
 * Each idea is one big tap target: it applies the change so the score ticks up. The applied idea leaves the list,
 * so focus moves to the confirmation above the cards ("Added: … Your score is now 494") and its Undo; undoing
 * brings the card back and focus with it.
 *
 * With `ahead` (the score is already above the cut-off it is compared with), nothing more is needed: the ideas
 * fold into one quiet row that says so, and a nomination is never among them.
 */
export function Tips({ tips: all, profile, total, ahead, onChange }: { tips: Boost[]; profile: Profile; total: number; ahead?: boolean; onChange: (p: Profile) => void }) {
  const t = useMessages(messages);
  const { fmt } = useLocale();
  const [more, setMore] = useState(false);
  const [open, setOpen] = useState(false);
  const [tried, setTried] = useState<{ boost: Boost; before: Profile; after: Profile; score: number } | null>(null);
  const undoRef = useRef<HTMLButtonElement>(null);
  const triedId = useId();
  const cards = useRef(new Map<Boost['key'], HTMLButtonElement>());
  // Only while the answers are still the ones the idea produced: any other edit makes the line stale.
  const active = tried && tried.after === profile ? tried : null;
  const tips = ahead ? all.filter((b) => b.key !== 'nomination') : all;
  const shown = ahead || more ? tips : tips.slice(0, 2);
  const label = (b: Boost) => t(`boost.${b.key}`, { to: b.to ?? '' });

  const apply = (b: Boost) => {
    const after = { ...profile, ...b.patch };
    // Commit first, so the confirmation and its Undo exist when focus moves to them.
    flushSync(() => {
      setTried({ boost: b, before: profile, after, score: total + b.gain });
      onChange(after);
    });
    undoRef.current?.focus();
  };
  const undo = () => {
    if (!active) return;
    const key = active.boost.key;
    flushSync(() => {
      onChange(active.before);
      setTried(null);
    });
    cards.current.get(key)?.focus();
  };

  // Not a live region: focus moves to Undo, which is described by this line, so it is read out once.
  const confirmation = active ? (
    <div className="flex items-center gap-3 rounded-tile bg-pine-wash py-1 ps-4 pe-1 max-sm:flex-wrap max-sm:pe-4 max-sm:pb-1">
      <Check className="size-4 shrink-0 text-pine max-sm:hidden" strokeWidth={2.6} aria-hidden />
      <p id={triedId} className="m-0 min-w-0 flex-1 py-2 text-[13.5px] leading-snug text-ink max-sm:basis-full max-sm:pb-0">
        <bdi>{t('crs.tips.tried', { change: label(active.boost), gain: fmt.number(active.boost.gain), score: fmt.number(active.score) })}</bdi>
      </p>
      <Button ref={undoRef} size="md" variant="quiet" icon={Undo2} className="shrink-0 px-3.5 max-sm:-ms-3.5" aria-describedby={triedId} onClick={undo}>
        {t('crs.tips.undo')}
      </Button>
    </div>
  ) : null;
  const ideas = (
    <ul className="m-0 grid list-none gap-2.5 p-0 @xl:grid-cols-2">
      {shown.map((b) => (
        <li key={b.key}>
          <button
            ref={(el) => {
              if (el) cards.current.set(b.key, el);
              else cards.current.delete(b.key);
            }}
            type="button"
            onClick={() => apply(b)}
            className="group flex min-h-[68px] w-full items-center gap-3.5 rounded-tile @max-sm:gap-3 @max-sm:px-3.5 border border-hair bg-card px-4 py-3 text-start shadow-sm transition-[transform,box-shadow,border-color] duration-200 ease-spring hover:-translate-y-px hover:border-pine/35 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink active:translate-y-0 active:scale-[.985] motion-reduce:transition-none motion-reduce:hover:translate-y-0"
          >
            <span className="min-w-[3ch] font-serif text-[28px] leading-none tracking-[-.02em] text-pine @max-sm:min-w-0 @max-sm:text-[25px]">
              <bdi dir="ltr">+{fmt.number(b.gain)}</bdi>
            </span>
            <span className="min-w-0 flex-1 text-[14.5px] leading-snug text-ink">{label(b)}</span>
            {/* On a phone the pill is just the arrow, so the idea keeps the width; the word stays for screen readers. */}
            <span className="inline-flex shrink-0 items-center gap-1 rounded-chip bg-pine-wash px-3 py-1.5 text-[13px] font-semibold text-pine transition-colors duration-200 group-hover:bg-pine group-hover:text-card @max-sm:size-8 @max-sm:justify-center @max-sm:p-0">
              <span className="@max-sm:sr-only">{t('crs.tips.try')}</span>
              <ArrowRight className="size-3.5 flip-rtl" strokeWidth={2.4} aria-hidden />
            </span>
          </button>
        </li>
      ))}
    </ul>
  );

  if (ahead) {
    if (!tips.length && !confirmation) return null;
    return (
      <>
        {confirmation ? <div className="px-5 pt-6 sm:px-6">{confirmation}</div> : null}
        {tips.length ? (
          <Fold title={t('crs.tips.title')} summary={t('crs.tips.ahead')} open={open} onOpenChange={setOpen}>
            {ideas}
          </Fold>
        ) : null}
      </>
    );
  }
  return (
    <Section title={t('crs.tips.title')}>
      {confirmation ? <div className="mb-3">{confirmation}</div> : null}
      {ideas}
      {tips.length > 2 ? (
        <Button size="md" variant="quiet" className="-ms-3 mt-1.5 px-3" iconEnd={more ? ChevronUp : ChevronDown} onClick={() => setMore((v) => !v)} aria-expanded={more}>
          {more ? t('crs.tips.less') : t('crs.tips.more', { count: tips.length - 2 })}
        </Button>
      ) : null}
    </Section>
  );
}
