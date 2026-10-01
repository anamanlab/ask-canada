'use client';
/**
 * Interactive scam check: the things the CRA says it will never do, as toggles, and what to do next.
 * Nothing is saved.
 *  - <ScamCheck on onToggle>: the explainer owns the ticked signs (`useScamSigns`), so its verdict above is the
 *    single live verdict and no banner is shown here
 *  - <CompactScamCheck>: owns its signs and its live status line; used inside "Is it really from the CRA?"
 */
import { useState } from 'react';
import { Check, OctagonAlert, ShieldCheck, ShieldQuestion } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useMessages } from '@/lib/i18n/widget';
import { PHONES, SIGNALS, scamLevel, type Lang, type Signal } from './data';
import messages from './messages';
import { WithPhones } from './Phones';

type Level = ReturnType<typeof scamLevel>;

/** The ticked signs and the verdict they add up to. */
export function useScamSigns(initial: Signal[]) {
  const [on, setOn] = useState<Signal[]>(initial);
  const [touched, setTouched] = useState(initial.length > 0);
  const toggle = (s: Signal) => {
    setTouched(true);
    setOn((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]));
  };
  return { on, touched, toggle, level: scamLevel(on.length, touched) };
}

export function CompactScamCheck({ lang }: { lang: Lang }) {
  const own = useScamSigns([]);
  return <ScamCheck on={own.on} onToggle={own.toggle} lang={lang} compact status={own.level} />;
}

export function ScamCheck({
  on,
  onToggle,
  lang,
  compact,
  status,
}: {
  on: Signal[];
  onToggle: (s: Signal) => void;
  lang: Lang;
  /** Only the signs, and what to do once one is ticked. */
  compact?: boolean;
  /** Show a live status line for this verdict (when no verdict above the check follows the signs). */
  status?: Level;
}) {
  const t = useMessages(messages);
  const level = status ?? scamLevel(on.length, true);
  const Icon = level === 'high' ? OctagonAlert : level === 'check' ? ShieldCheck : ShieldQuestion;
  return (
    <div>
      {status ? (
        <div
          role="status"
          aria-live="polite"
          className={cn(
            'flex items-start gap-3 rounded-tile px-4 py-3.5 text-[15px] leading-snug transition-colors duration-300',
            level === 'high' ? 'bg-maple-wash text-ink' : level === 'check' ? 'bg-pine-wash text-ink' : 'bg-paper-2 text-ink-2',
          )}
        >
          <Icon className={cn('mt-px size-[19px] shrink-0', level === 'high' ? 'text-maple' : level === 'check' ? 'text-pine' : 'text-ink-3')} strokeWidth={1.9} aria-hidden />
          <p className="m-0 font-medium">{level === 'high' ? t('scam.high', { count: on.length }) : level === 'check' ? t('scam.check') : t('scam.idle')}</p>
        </div>
      ) : null}
      <p className={cn('m-0 text-[13.5px] text-ink-3', status && 'mt-3')}>{t('scam.never')}</p>
      <ul className="m-0 mt-2 grid list-none gap-1.5 p-0 @xl:grid-cols-2" aria-label={t('scam.listLabel')}>
        {SIGNALS.map((s) => {
          const checked = on.includes(s);
          return (
            <li key={s}>
              <button
                type="button"
                role="checkbox"
                aria-checked={checked}
                onClick={() => onToggle(s)}
                className={cn(
                  'flex h-full min-h-[52px] w-full items-center gap-3 rounded-field border px-3.5 py-2.5 text-start text-[14px] leading-snug transition-colors',
                  checked ? 'border-maple/35 bg-maple-wash text-ink' : 'border-hair bg-card text-ink hover:border-hair-2',
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    'grid size-[22px] shrink-0 place-items-center rounded-md border-[1.5px] transition-colors',
                    checked ? 'border-maple bg-maple text-paper' : 'border-hair-2 text-transparent',
                  )}
                >
                  <Check className="size-3.5" strokeWidth={3} />
                </span>
                <span>{t(`sig.${s}`)}</span>
              </button>
            </li>
          );
        })}
      </ul>
      {!compact || on.length > 0 ? (
        <div className={cn('mt-4 grid gap-3', !compact && '@xl:grid-cols-2')}>
          <Advice title={t('scam.do.title')} tone="maple" items={[t('scam.do.1'), t('scam.do.2', { phone: PHONES.craScam[lang] }), t('scam.do.3', { phone: PHONES.cafc[lang] })]} phones={[PHONES.craScam[lang], PHONES.cafc[lang]]} />
          {/* Compact: "How to check it's real" is already listed right above the check. */}
          {compact ? null : (
            <Advice title={t('scam.real.title')} tone="pine" items={[t('scam.real.1'), t('scam.real.2', { phone: PHONES.craIndividuals[lang] }), t('scam.real.3')]} phones={[PHONES.craIndividuals[lang]]} />
          )}
        </div>
      ) : null}
    </div>
  );
}

/** A short numbered advice card; phone numbers inside the text become tap-to-call links. */
function Advice({ title, items, phones, tone }: { title: string; items: string[]; phones: string[]; tone: 'maple' | 'pine' }) {
  return (
    <div className="rounded-tile border border-hair bg-card p-4">
      <p className="m-0 flex items-center gap-2 text-[14.5px] font-semibold text-ink">
        <span className={cn('size-2 rounded-full', tone === 'maple' ? 'bg-maple' : 'bg-pine')} aria-hidden />
        {title}
      </p>
      <ol className="m-0 mt-2.5 grid list-none gap-2 p-0">
        {items.map((it, i) => (
          <li key={it} className="flex gap-2.5 text-[14px] leading-snug text-ink-2">
            <span className="mt-px font-mono text-[12px] text-ink-3" aria-hidden>
              {i + 1}
            </span>
            <span>
              <WithPhones text={it} phones={phones} />
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
