'use client';
/**
 * Service notices, read live from canada.ca by the tool. We only say "no notices" when we just read the
 * page; when we couldn't, we make no claim and point to the page.
 */
import { CalendarClock, Info } from 'lucide-react';
import { ExternalLink, Notice } from '@/components/ui';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import messages from './messages';
import type { Lang, PlannerOutput } from './types';
import { cn } from '@/lib/cn';
import { isolate, isolateItem, nb, NOTICE_SLOT, WARN_DARK } from './shared';

export function ServiceStatus({ plan, lang, placeholder }: { plan: PlannerOutput; lang: Lang; /** Loading: hold the room one notice takes. */ placeholder?: boolean }) {
  const t = useMessages(messages);
  const { fmt } = useLocale();
  const feed = plan.serviceNotices[lang] ?? plan.serviceNotices.en;
  const checked = nb(fmt.date(feed.checked, { month: 'short', day: 'numeric' }));
  if (placeholder) return <div className={cn('px-5 pt-5 sm:px-6', NOTICE_SLOT[lang])} />;
  const notices = feed.live && feed.items.length > 0;
  return (
    // With a notice, the block is at least as tall as the room the loading state held for it.
    <div className={cn('px-5 pt-5 sm:px-6', notices && NOTICE_SLOT[lang])}>
      {notices ? (
        <div className="grid gap-2">
          {feed.items.map((n) => (
            <Notice key={n.title} tone={n.tone} icon={n.tone === 'warn' ? CalendarClock : Info} className={n.tone === 'warn' ? WARN_DARK : undefined} title={isolate(n.title)} live>
              {/* Notice renders its children inside a <div> (never a <p>), so a real list parses here as written. */}
              {n.body ? <span className="mt-1 block">{isolate(n.body)}</span> : null}
              {n.list?.length ? (
                <ul className="m-0 mt-1 grid list-none gap-0.5 p-0">
                  {n.list.map((li) => (
                    <li key={li} className="flex gap-2">
                      <span className="mt-[8px] size-[4px] shrink-0 rounded-full bg-ink-3" aria-hidden />
                      {isolateItem(li)}
                    </li>
                  ))}
                </ul>
              ) : null}
              <span className="mt-2 flex flex-wrap items-center gap-x-3 text-[13.5px] text-ink-2">
                <bdi>{t('status.from', { date: checked })}</bdi>
                {/* The link stays inline text (its words keep their order on a right-to-left page); the padding
                    makes it a full 44px target without changing the row's height. */}
                <bdi>
                  <ExternalLink href={n.url ?? feed.page} className="py-[14px] text-[13.5px]">
                    {t('status.read')}
                  </ExternalLink>
                </bdi>
              </span>
            </Notice>
          ))}
        </div>
      ) : feed.live ? (
        <p className="m-0 flex items-start gap-2 text-[14px] leading-[1.5] text-ink-3">
          <span className="mt-[8px] size-1.5 shrink-0 rounded-full bg-pine" aria-hidden />
          {isolateItem(t('status.none', { date: checked }))}
        </p>
      ) : (
        <p className="m-0 flex items-center gap-2 text-[14px] leading-[1.5] text-ink-3">
          <Info className="size-3.5 shrink-0" aria-hidden />
          <span>
            <ExternalLink href={feed.page} className="text-[14px] font-normal text-ink-2">
              {t('status.offline')}
            </ExternalLink>
          </span>
        </p>
      )}
    </div>
  );
}
