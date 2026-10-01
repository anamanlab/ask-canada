'use client';
/**
 * Small local building blocks for the taxes widgets (built on the design tokens only).
 *   <Verdict tone="ok|danger|info|neutral" icon={Check} title="…" sub="…" />   the answer band; announces itself once settled
 *   <Ring value={0.42} label="…" />                     progress ring with a text alternative
 *   useDateFmt()                                         dates with the French "1er"
 *   useShortDate()                                       "Apr 30" / "30 avr" for compact labels
 *   <AnswerLang lang={part.input?.lang}>…</AnswerLang>   render in the answer's language (EN/FR)
 * Fields live in ./fields, loading states in ./skeleton.
 */
import { useSyncExternalStore, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { LiveRegion } from '@/components/ui';
import { cn } from '@/lib/cn';
import { dateFormat, parseISODate, type Messages } from '@/lib/i18n/format';
import { I18nProvider, useI18nContext, useLocale } from '@/lib/i18n/provider';

type VerdictTone = 'ok' | 'danger' | 'info' | 'neutral';

const band: Record<VerdictTone, string> = {
  ok: 'border-pine/15 bg-[linear-gradient(135deg,color-mix(in_oklab,var(--pine)_16%,transparent),color-mix(in_oklab,var(--glacier)_12%,transparent)_50%,color-mix(in_oklab,var(--a-violet)_10%,transparent))]',
  danger: 'border-maple/20 bg-[linear-gradient(135deg,color-mix(in_oklab,var(--maple)_10%,transparent),color-mix(in_oklab,var(--a-rose)_14%,transparent))]',
  info: 'border-glacier/15 bg-[linear-gradient(135deg,color-mix(in_oklab,var(--glacier)_14%,transparent),color-mix(in_oklab,var(--a-teal)_10%,transparent)_55%,color-mix(in_oklab,var(--a-violet)_10%,transparent))]',
  neutral: 'border-hair bg-paper-2',
};
const dot: Record<VerdictTone, string> = {
  ok: 'bg-pine shadow-[0_0_0_6px_var(--pine-wash)]',
  danger: 'bg-maple shadow-[0_0_0_6px_var(--maple-wash)]',
  info: 'bg-glacier shadow-[0_0_0_6px_var(--glacier-wash)]',
  neutral: 'bg-ink !text-paper shadow-[0_0_0_6px_var(--hair)]',
};

export function Verdict({ tone, icon: Icon, title, sub }: { tone: VerdictTone; icon: LucideIcon; title: string; sub?: string }) {
  return (
    <div className={cn('relative mx-3 overflow-hidden rounded-[22px] border px-5 py-5 sm:mx-4', band[tone])}>
      <div className="flex items-start gap-3.5">
        <span className={cn('grid size-9 shrink-0 place-items-center rounded-full text-paper', dot[tone])} aria-hidden>
          <Icon className="size-[18px]" strokeWidth={2.4} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="m-0 text-balance font-serif text-[23px] leading-[1.18] tracking-[-.02em] text-ink [font-variation-settings:'opsz'_36]">
            {/* Each sentence takes its direction from its own words (a count or a date may come first). */}
            <bdi>{title}</bdi>
          </p>
          {sub ? (
            <p className="m-0 mt-1 text-[15px] leading-snug text-ink-2">
              <bdi>{sub}</bdi>
            </p>
          ) : null}
        </div>
      </div>
      {/* The verdict changes as the person types: one announcement once it settles, none on load. */}
      <LiveRegion text={sub ? `${title} ${sub}` : title} />
    </div>
  );
}

/** Progress ring (0–1). Decorative; pass the text alternative as `label`. */
export function Ring({ value, size = 92, stroke = 9, tone = 'maple', label, children }: { value: number; size?: number; stroke?: number; tone?: 'maple' | 'pine' | 'glacier'; label: string; children?: ReactNode }) {
  const reduce = useReducedMotion();
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, value));
  const color = { maple: 'text-maple', pine: 'text-pine', glacier: 'text-glacier' }[tone];
  return (
    <span className="relative inline-grid shrink-0 place-items-center" style={{ width: size, height: size }} role="img" aria-label={label}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--hair)" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          className={color}
          strokeDasharray={c}
          initial={reduce ? false : { strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - v) }}
          transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 60, damping: 18 }}
        />
      </svg>
      {children ? <span className="absolute inset-0 grid place-items-center text-center">{children}</span> : null}
    </span>
  );
}

/**
 * Date formatting with Canada.ca French style for the first of the month ("1er mars", not "1 mars").
 * Returns `(iso, options) => string` bound to the active locale.
 */
export function useDateFmt() {
  const { fmt, intl } = useLocale();
  const fr = intl.startsWith('fr');
  return (iso: string, o: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric', year: 'numeric' }) => {
    const out = fmt.date(iso, o);
    return fr && o.day ? out.replace(/(^|\s)1(\s)(?=\p{L})/u, '$11er$2') : out;
  };
}

/**
 * Short month and day for a compact label ("Apr 30", "30 avr"): built from the formatter's own parts, so the
 * period French puts after an abbreviated month is dropped from the month itself, whatever the ICU version.
 */
export function useShortDate() {
  const { intl } = useLocale();
  return (iso: string) =>
    dateFormat(intl, { month: 'short', day: 'numeric' })
      .formatToParts(parseISODate(iso))
      .map((part) => (part.type === 'month' ? part.value.replace(/\.$/, '') : part.value))
      .join('');
}

/*
 * The interface's own strings (source footer, "opens in a new tab") in the other official language. Fetched
 * only when an answer's language differs from the interface, once, and shared by every widget that needs it,
 * so neither catalog sits in the widget's bundle.
 */
type Official = 'en' | 'fr';
const catalogs: Record<Official, { load: () => Promise<{ default: Messages }>; messages?: Messages; asked?: boolean }> = {
  en: { load: () => import('@/lib/i18n/messages/en.json') },
  fr: { load: () => import('@/lib/i18n/messages/fr.json') },
};
const waiting = new Set<() => void>();
const watch = (lang: Official) => (onChange: () => void) => {
  const catalog = catalogs[lang];
  if (!catalog.asked) {
    catalog.asked = true;
    catalog.load().then(
      (m) => {
        catalog.messages = m.default;
        waiting.forEach((cb) => cb());
      },
      // Offline or a failed chunk: keep the interface's strings and try again with the next widget.
      () => {
        catalog.asked = false;
      },
    );
  }
  waiting.add(onChange);
  return () => {
    waiting.delete(onChange);
  };
};
const subscribe: Record<Official, ReturnType<typeof watch>> = { en: watch('en'), fr: watch('fr') };
const subscribeNone = () => () => {};
const none = () => undefined;

/**
 * Every taxes card: a container for `@xl:` layouts. In the wide message column the source footer stays on one line
 * (a long page title shortens with an ellipsis instead of pushing "Checked …" onto a second line), so cards with
 * long and short sources end the same way; on a phone the footer wraps as the shell intends.
 */
export const SHELL = '@container @xl:[&_footer]:flex-nowrap';

/**
 * Renders a widget in the language of the answer it belongs to. The model (or a scripted answer) passes
 * `lang` to the tool: a French question in an English interface gets a French answer, so its widget, dates,
 * amounts and sources must be French too (and the other way around). Only EN ⇄ FR is switched here; other
 * interface languages keep the chat's own fallback rules. The widget's own strings switch at once (both
 * languages ship with it); the few interface strings follow as soon as their catalog has loaded.
 */
export function AnswerLang({ lang, children }: { lang?: string | null; children: ReactNode }) {
  const ctx = useI18nContext();
  const target = lang === 'fr' || lang === 'en' ? lang : null;
  const switchTo = target && target !== ctx.locale && (ctx.locale === 'en' || ctx.locale === 'fr') ? target : null;
  const core = useSyncExternalStore(switchTo ? subscribe[switchTo] : subscribeNone, switchTo ? () => catalogs[switchTo].messages : none, none);
  const messages = core ? { ...ctx.messages, ...core } : ctx.messages;
  if (!switchTo) return <>{children}</>;
  return (
    <I18nProvider locale={switchTo} messages={messages} translated region={ctx.region} currency={ctx.currency} fallback={ctx.fallback}>
      <div lang={switchTo}>{children}</div>
    </I18nProvider>
  );
}
