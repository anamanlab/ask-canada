'use client';
import type { LucideIcon } from 'lucide-react';
import { Disclosure, ExternalLink } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useLocale } from '@/lib/i18n/provider';
import type { HolidayItem } from '../data';
import { LINK_LINE, useDate, Ord } from '../parts';
import { dayOff } from '../select';

/**
 * Days off that aren't statutory holidays here (federal ones, or the provincial government's own): closed by default,
 * built on first open, with its own source. `dated={false}` lists the days by name only, when their dates for the year
 * aren't published by the official source yet.
 */
export function MoreDays({
  icon: Icon,
  title,
  body,
  days,
  dated = true,
  source,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
  days: HolidayItem[];
  dated?: boolean;
  source?: { href: string; label: string };
}) {
  const { locale } = useLocale();
  const fmtDate = useDate();
  const lang = locale === 'fr' ? 'fr' : 'en';
  return (
    <Disclosure
      lazy
      className="mt-3 rounded-[16px] border border-hair bg-paper-2 px-4 first-of-type:mt-4"
      title={
        <>
          <Icon className="size-[18px] shrink-0 text-ink-2" aria-hidden strokeWidth={1.8} />
          {/* <bdi>: "2 federal holidays not observed here" keeps its order in right-to-left text. */}
          <bdi className="font-medium">{title}</bdi>
        </>
      }
    >
      <div className="pb-2">
        <p className="m-0 text-[13.5px] leading-snug text-ink-2">{body}</p>
        <ul className="m-0 mt-3 list-none p-0">
          {days.map((h) => (
            <li key={h.date + h.name.en} className="flex items-baseline justify-between gap-3 border-t border-hair py-2 text-[14px] first:border-t-0">
              <span className="text-ink">{h.name[lang]}</span>
              {dated ? (
                <span className="shrink-0 text-ink-2">
                  <Ord>{fmtDate(dayOff(h), { weekday: 'short', month: 'short', day: 'numeric' })}</Ord>
                </span>
              ) : null}
            </li>
          ))}
        </ul>
        {source ? (
          <ExternalLink href={source.href} className={cn(LINK_LINE, 'mt-2 text-[13.5px]')}>
            {source.label}
          </ExternalLink>
        ) : null}
      </div>
    </Disclosure>
  );
}

/**
 * The province's official holiday page (opens in a new tab). It may wrap: «Liste officielle de Terre-Neuve-et-Labrador»
 * is wider than a 320px page's column (ExternalLink keeps the last word and the arrow together).
 */
export function OfficialLink({ href, label, className }: { href: string; label: string; className?: string }) {
  return (
    <ExternalLink href={href} className={cn(LINK_LINE, 'text-[13.5px] text-ink-2 hover:text-ink', className)}>
      {label}
    </ExternalLink>
  );
}
