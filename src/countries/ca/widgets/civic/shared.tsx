'use client';
/**
 * Local pieces for the civic widget: a card that is one link to an official page, a link on its own line and
 * the MP portrait. Choice groups and filters use core `Segmented` and `Chip`. Tokens only; RTL-safe.
 */
import type { ReactNode } from 'react';
import Image from 'next/image';
import { ArrowUpRight } from 'lucide-react';
import { ExternalLink } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useLocale } from '@/lib/i18n/provider';

/** "45th" / "45e", "1st" / "1re". */
export function ordinal(n: number, intl: string) {
  if (intl.startsWith('fr')) return n === 1 ? '1re' : `${n}e`;
  const rule = new Intl.PluralRules('en', { type: 'ordinal' }).select(n);
  return `${n}${{ one: 'st', two: 'nd', few: 'rd' }[rule as 'one' | 'two' | 'few'] ?? 'th'}`;
}

/**
 * A sentence for a string-only prop (a handoff note), wrapped in Unicode isolates (the plain-text <bdi>): English
 * fallback text on a right-to-left page keeps its full stop at the end of the sentence.
 */
export const isolate = (sentence: string) => `\u2068${sentence}\u2069`;

/* ───────────────────────── Links ───────────────────────── */

/**
 * A whole card, row or tile that is one link. Off-site links (the default) open in a new tab and say so to
 * screen readers; pair them with <CardArrow /> so sighted people see it too. `external={false}` is for
 * mailto: and tel: links, which stay in place.
 */
export function CardLink({ href, external = true, className, children }: { href: string; external?: boolean; className?: string; children: ReactNode }) {
  const { t } = useLocale();
  return (
    <a href={href} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})} className={cn('group no-underline', className)}>
      {children}
      {external ? <span className="sr-only"> {t('a11y.newTab')}</span> : null}
    </a>
  );
}

/** The ↗ of a <CardLink>: mirrored in RTL, nudged on hover. */
export function CardArrow({ className }: { className?: string }) {
  return (
    <ArrowUpRight
      aria-hidden
      className={cn(
        'flip-rtl size-4 shrink-0 text-ink-3 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5',
        className,
      )}
    />
  );
}

/**
 * An official link alone on its line, in a 44px-tall row. The label stays one run of inline text inside the row
 * (so the space before its last word and the ↗ survive wrapping), which `ExternalLink standalone` doesn't do
 * for plain-string labels: there the two halves of the label become separate flex items.
 */
export function LinkRow({ href, children }: { href: string; children: string }) {
  return (
    <span className="inline-flex min-h-11 items-center">
      <span>
        <ExternalLink href={href}>{children}</ExternalLink>
      </span>
    </span>
  );
}

/* ───────────────────────── Portrait ───────────────────────── */

const PORTRAIT = { width: 100, height: 128 };

/** The official portrait (a small data: URI from the tool, see live/portrait.ts), or a monogram. */
export function Portrait({ src, name, alt }: { src?: string; name: string; alt: string }) {
  const box = 'h-[128px] w-[100px] shrink-0 rounded-tile ring-1 ring-hair';
  if (src) return <Image src={src} alt={alt} {...PORTRAIT} unoptimized className={cn(box, 'bg-paper-2 object-cover object-top shadow-md')} />;
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join('');
  return (
    <span role="img" aria-label={alt} className={cn(box, 'grid place-items-center bg-[linear-gradient(160deg,var(--maple-wash),var(--glacier-wash))] font-serif text-[34px] tracking-[-.02em] text-ink-2')}>
      {initials}
    </span>
  );
}
