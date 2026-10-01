'use client';
/**
 * One recall in the list: date and first sentence, opening to the issue, the risk, the fix and the notice.
 * A local accordion rather than the shared `Disclosure`: the toggle is a whole card on the timeline rail (dot, "New"
 * chip, date, system and a wrapping headline), where Disclosure's header is one title line on a ruled section. The
 * plain "show more" cases around it (the older recalls in RecallLookup) do use Disclosure.
 */
import { useCallback, useId, useState, type RefCallback } from 'react';
import { AlertTriangle, ChevronDown, ShieldAlert, Wrench } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { cn } from '@/lib/cn';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import { PageLink } from './links';
import messages from './messages';
import { displayNumber, isRecent, type Recall } from './recalls';
import { ordinals, useDay } from './shared';

export function RecallCard({ r, defaultOpen, today }: { r: Recall; defaultOpen: boolean; today: string }) {
  const t = useMessages(messages);
  const { fmt } = useLocale();
  const day = useDay();
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  // The tool sends the headline (the issue's first sentence) and what the opened card adds to it. An answer saved
  // before it did carries only the full issue, which then is the headline.
  const lead = r.lead ?? r.issue;
  const rest = r.rest ?? '';
  const fresh = isRecent(r.date, today);
  return (
    <li className="relative">
      <span
        className={cn('absolute -start-6 top-[19px] size-[11px] rounded-full border-2 border-card', fresh ? 'bg-maple' : open ? 'bg-ink-3' : 'bg-hair-2')}
        aria-hidden
      />
      <div className={cn('overflow-hidden rounded-[16px] border bg-card transition-[border-color,box-shadow]', open ? 'border-hair-2 shadow-sm' : 'border-hair')}>
        <button type="button" aria-expanded={open} aria-controls={id} onClick={() => setOpen((v) => !v)} className="flex w-full items-start gap-3 px-4 py-3.5 text-start">
          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
              {fresh ? (
                <span className="shrink-0 whitespace-nowrap rounded-full bg-maple-wash px-2 py-px text-[11.5px] font-semibold uppercase tracking-[.06em] text-maple-ink">{t('recalls.card.new')}</span>
              ) : null}
              <span className="whitespace-nowrap text-[13px] font-semibold tabular-nums text-ink-2">{ordinals(day(r.date, { month: 'short', day: 'numeric', year: 'numeric' }))}</span>
              {r.system ? <span className="text-[13px] text-ink-3">{r.system}</span> : null}
            </span>
            <span className="mt-1.5 block text-[15px] font-medium leading-snug text-ink">{lead || t('recalls.card.noSummary', { number: displayNumber(r.id) })}</span>
          </span>
          <ChevronDown className={cn('mt-1 size-5 shrink-0 text-ink-3 transition-transform duration-200', open && 'rotate-180')} aria-hidden />
        </button>
        {open ? (
          <motion.div
            id={id}
            initial={reduce ? false : { opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="grid gap-3.5 border-t border-hair px-4 pb-4 pt-3.5"
          >
            {rest ? <Part icon={AlertTriangle} label={t('recalls.card.issue')} text={rest} /> : null}
            {r.risk ? <Part icon={ShieldAlert} label={t('recalls.card.risk')} text={r.risk} /> : null}
            {r.action ? <Part icon={Wrench} label={t('recalls.card.fix')} text={r.action} /> : null}
            {r.note ? <Note text={r.note} /> : null}
            <dl className="m-0 flex flex-wrap gap-x-5 gap-y-1.5 text-[12.5px] text-ink-3">
              <div className="flex gap-1.5">
                <dt>{t('recalls.card.number')}</dt>
                <dd className="m-0 font-mono text-ink-2">
                  <bdi dir="ltr">{displayNumber(r.id)}</bdi>
                </dd>
              </div>
              {r.units ? (
                <div className="flex gap-1.5">
                  <dt>{t('recalls.card.units')}</dt>
                  <dd className="m-0 tabular-nums text-ink-2">{fmt.number(r.units)}</dd>
                </div>
              ) : null}
              {r.models.length > 1 ? (
                <div className="flex gap-1.5">
                  <dt>{t('recalls.card.models')}</dt>
                  <dd className="m-0 text-ink-2">{r.models.join(', ')}</dd>
                </div>
              ) : null}
            </dl>
            {/* No padding of its own: the gap above and the card's bottom padding already leave the 44px target its room. */}
            <PageLink href={r.url} className="py-0 text-[13.5px]">
              {t('recalls.card.notice')}
            </PageLink>
          </motion.div>
        ) : null}
      </div>
    </li>
  );
}

/**
 * The database's extra note, clamped to two lines when it's a long list (e.g. dozens of part numbers). The toggle
 * appears only while the clamp really hides text at this width, so pressing it always reveals something.
 */
function Note({ text }: { text: string }) {
  const t = useMessages(messages);
  const [open, setOpen] = useState(false);
  // A guess for the first paint (two lines hold roughly 80 characters each on a phone); the measurement below corrects it.
  const [clamped, setClamped] = useState(text.length > 240);
  const id = useId();
  const measure: RefCallback<HTMLParagraphElement> = useCallback((el) => {
    if (!el) return;
    // Only a clamped paragraph can tell whether it overflows; while expanded, the last answer stands.
    const check = () => el.dataset.clamp === 'on' && setClamped(el.scrollHeight > el.clientHeight + 1);
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div>
      <p ref={measure} id={id} data-clamp={open ? 'off' : 'on'} className={cn('m-0 break-words text-[13.5px] leading-snug text-ink-2', !open && 'line-clamp-2')}>
        {text}
      </p>
      {clamped || open ? (
        <button
          type="button"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen((v) => !v)}
          className="-my-2 min-h-11 text-[13px] font-medium text-ink underline decoration-hair-2 underline-offset-[3px] hover:decoration-ink-2"
        >
          {open ? t('recalls.card.noteLess') : t('recalls.card.noteMore')}
        </button>
      ) : null}
    </div>
  );
}

/** Issue / Risk / Fix. Monochrome on purpose: colour in the list is kept for what's new. */
function Part({ icon: Icon, label, text }: { icon: typeof Wrench; label: string; text: string }) {
  const cls = 'text-ink-2 bg-paper-2';
  return (
    <div className="flex gap-3">
      <span className={cn('mt-0.5 grid size-7 shrink-0 place-items-center rounded-[9px]', cls)} aria-hidden>
        <Icon className="size-[15px]" strokeWidth={2} />
      </span>
      <div className="min-w-0">
        <p className="m-0 text-[12px] font-semibold uppercase tracking-[.06em] text-ink-2">{label}</p>
        {text
          .split(/\n+/)
          .filter(Boolean)
          .map((para, i) => (
            <p key={i} className={cn('m-0 text-[14.5px] leading-[1.5] text-ink', i === 0 ? 'mt-0.5' : 'mt-2')}>
              {para}
            </p>
          ))}
      </div>
    </div>
  );
}
