/**
 * ExternalLink: a link to another site (an official page), opened in a new tab.
 * <ExternalLink href={source.url}>Passport fees</ExternalLink>                  // inline, in a sentence
 * <ExternalLink href={url} standalone>Check processing times</ExternalLink>    // alone on its line: 44px target
 * <ExternalLink href={url} icon={false} className="text-ink-2">canada.ca</ExternalLink>
 *
 * Adds the ↗ glyph (mirrored in RTL) glued to the last word, so a long label wraps as text and the arrow never
 * sits alone on a line, plus an sr-only "(opens in a new tab)" in the interface language. Inline links get a
 * ~44px hit area from vertical padding without changing the line height.
 */
'use client';
import type { AnchorHTMLAttributes, ReactNode } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useT } from '@/lib/i18n/provider';

type Props = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'target' | 'rel' | 'children'> & {
  href: string;
  children: ReactNode;
  /** Alone on its line: a 44px-tall flex target. */
  standalone?: boolean;
  /** Show the ↗ glyph (default true). */
  icon?: boolean;
};

export function ExternalLink({ href, children, standalone, icon = true, className, ...rest }: Props) {
  const t = useT();
  let head: ReactNode = children;
  let tail: ReactNode = null;
  if (icon && typeof children === 'string') {
    const text = children.trimEnd();
    const cut = text.lastIndexOf(' ') + 1;
    head = text.slice(0, cut);
    tail = text.slice(cut);
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'font-medium text-ink underline decoration-hair-2 underline-offset-[3px] [box-decoration-break:clone] hover:decoration-ink',
        standalone ? 'relative inline-flex min-h-11 items-center' : 'inline py-[13px]',
        className,
      )}
      {...rest}
    >
      {head}
      {icon ? (
        <span className="whitespace-nowrap">
          {tail}
          <ArrowUpRight className="flip-rtl ms-1 inline-block size-3.5 align-[-0.125em]" strokeWidth={2} aria-hidden />
        </span>
      ) : null}
      <span className="sr-only"> {t('a11y.newTab')}</span>
    </a>
  );
}
