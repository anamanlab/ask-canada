'use client';
import { ArrowUpRight } from 'lucide-react';
import { ExternalLink } from '@/components/ui';

/** Official pages: a compact list of rows on phones, pills when the column is wide. */
export function OfficialPages({ links }: { links: { key: string; href: string; label: string }[] }) {
  return (
    <ul className="m-0 list-none overflow-hidden rounded-tile border border-hair p-0 @xl:flex @xl:flex-wrap @xl:gap-2 @xl:overflow-visible @xl:rounded-none @xl:border-0">
      {links.map((l) => (
        <li key={l.key} className="border-t border-hair first:border-t-0 @xl:border-t-0">
          {/* The arrow sits at the row's end on phones (not glued to the label), so the glyph is placed here. */}
          <ExternalLink
            href={l.href}
            icon={false}
            className="flex min-h-12 items-center justify-between gap-3 px-4 py-2.5 text-[15px] no-underline transition-colors hover:bg-paper-2 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ink @xl:min-h-11 @xl:justify-center @xl:gap-2 @xl:rounded-chip @xl:border @xl:border-hair-2 @xl:px-5 @xl:py-0 @xl:focus-visible:outline-offset-2"
          >
            {l.label}
            <ArrowUpRight className="size-4 shrink-0 text-ink-2 flip-rtl" strokeWidth={1.9} aria-hidden />
          </ExternalLink>
        </li>
      ))}
    </ul>
  );
}
