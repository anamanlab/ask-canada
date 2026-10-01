'use client';
import { ArrowRight } from 'lucide-react';
import { useMessages } from '@/lib/i18n/widget';
import messages from './messages';

/**
 * What the letter itself says: its summary in the letter's own terms, what this kind of document is, and
 * what it asks for. Shown open on a short card, or inside the "What it says" row of a longer one (which
 * keeps only what the letter asks for in the open, as <Asks>).
 */
export function Says({ summary, about, actions = [] }: { summary?: string; about?: string; actions?: string[] }) {
  const t = useMessages(messages);
  return (
    <>
      {summary ? <blockquote className="m-0 max-w-[64ch] border-s-2 border-glacier/60 ps-4 text-[16px] leading-relaxed text-ink">{summary}</blockquote> : null}
      {about ? (
        <p className={summary ? 'm-0 mt-4 max-w-[64ch] text-[15px] leading-relaxed text-ink-2' : 'm-0 max-w-[64ch] text-[15.5px] leading-relaxed text-ink-2'}>
          {summary ? <span className="font-medium text-ink">{t('sec.about')}</span> : null}
          {about}
        </p>
      ) : null}
      {actions.length ? (
        <>
          <p className="m-0 mb-2 mt-4 text-[15px] font-semibold text-ink">{t('sec.asks')}</p>
          <Asks actions={actions} />
        </>
      ) : null}
    </>
  );
}

/** What the letter asks the person to do, in its own words. */
export function Asks({ actions }: { actions: string[] }) {
  return (
    <ul className="m-0 grid list-none gap-2 p-0">
      {actions.map((a, i) => (
        // The letter's own words, extracted: two identical lines must not share a key.
        <li key={`${i}:${a}`} className="flex gap-2.5 text-[16px] leading-snug text-ink">
          <ArrowRight className="mt-[3px] size-4 shrink-0 text-ink-3 flip-rtl" aria-hidden />
          {a}
        </li>
      ))}
    </ul>
  );
}
