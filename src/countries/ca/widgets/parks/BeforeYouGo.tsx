'use client';
/**
 * "What to know before you go": the rules that apply in every national park, in plain words, each with its
 * official source. With a fire ban posted, the fires row says so and links the ban bulletin instead of
 * pointing people to the fire boxes.
 */
import { Ban, Dog, Flame, PawPrint, Phone, PlaneTakeoff, type LucideIcon } from 'lucide-react';
import { ExternalLink } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import { SAFETY } from './data';
import { SOURCE_TITLES, URLS } from './urls';
import { useLang } from './hooks';
import messages from './messages';
import type { Bulletin } from './model';

/** The park the tips are for. `remote`: no frontcountry campgrounds (or a northern park), so no fire boxes to point to. */
export type TipsPark = { name: string; url: string; remote: boolean };

export function BeforeYouGo({ park, fireBan, className }: { park?: TipsPark; fireBan?: Bulletin | null; className?: string }) {
  const t = useMessages(messages);
  const lang = useLang();
  const { fmt } = useLocale();
  const fine = fmt.money(SAFETY.maxFine, { cents: 'never' });
  const wildlife = { href: URLS.wildlife[lang], source: SOURCE_TITLES.wildlife[lang] };
  const rows: { icon: LucideIcon; title: string; body: string; href: string; source: string; alert?: boolean }[] = [
    { icon: PawPrint, title: t('know.space.title'), body: t('know.space.body', { small: SAFETY.smallAnimalsM, big: SAFETY.predatorsM }), ...wildlife },
    { icon: Ban, title: t('know.feed.title'), body: t('know.feed.body'), ...wildlife },
    { icon: Dog, title: t('know.dogs.title'), body: t('know.dogs.body'), ...wildlife },
    fireBan
      ? { icon: Ban, title: t('know.fireBan.title'), body: t('know.fireBan.body'), href: fireBan.url, source: fireBan.title, alert: true }
      : park?.remote
        ? { icon: Flame, title: t('know.firesRemote.title'), body: t('know.firesRemote.body'), href: park.url, source: park.name }
        : { icon: Flame, title: t('know.fires.title'), body: t('know.fires.body'), href: URLS.rules[lang], source: SOURCE_TITLES.rules[lang] },
    { icon: PlaneTakeoff, title: t('know.drones.title'), body: t('know.drones.body', { fine }), ...wildlife },
    { icon: Phone, title: t('know.911.title'), body: t('know.911.body'), href: URLS.emergency[lang], source: SOURCE_TITLES.emergency[lang] },
  ];
  return (
    // Two columns on wide containers; an odd last item spans both so no cell is left orphaned.
    <ul className={cn('m-0 grid list-none gap-x-5 gap-y-3.5 p-0 @xl:grid-cols-2 @xl:[&>li:last-child:nth-child(odd)]:col-span-2', className)}>
      {rows.map((r) => (
        <li key={r.title} className="flex gap-3">
          <span className={cn('mt-0.5 grid size-8 shrink-0 place-items-center rounded-[10px]', r.alert ? 'bg-maple-wash text-maple-ink' : 'bg-paper-2 text-ink-2')} aria-hidden>
            <r.icon className="size-4" strokeWidth={1.8} />
          </span>
          <div className="min-w-0">
            <p className="m-0 text-[14.5px] font-semibold leading-snug text-ink">{r.title}</p>
            <p className="m-0 mt-0.5 text-[13.5px] leading-snug text-ink-2">
              {r.body}{' '}
              <ExternalLink href={r.href} icon={false} aria-label={t('know.sourceNamed', { title: r.source })} className="-mx-1 whitespace-nowrap px-1 font-normal text-ink-3 hover:text-ink">
                {t('know.source')}
              </ExternalLink>
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
