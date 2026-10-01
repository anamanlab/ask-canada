'use client';
/** The programs that were checked and don't fit right now, each with the reason and its official page. */
import { Disclosure, ExternalLink } from '@/components/ui';
import { useMessages } from '@/lib/i18n/widget';
import type { FinderOutput } from '../build';
import type { Match } from '../calc';
import messages from '../messages';
import { PROGRAM_LOOK } from './look';
import { useReason } from './ProgramCard';

export function Others({ others, links }: { others: Match[]; links: FinderOutput['links'] }) {
  const t = useMessages(messages);
  return (
    <Disclosure title={<bdi>{t('others.title')}</bdi>} summary={<bdi>{t('others.summary', { count: others.length })}</bdi>} lazy className="mx-5 mt-5 @xl:mx-6">
      <OthersList others={others} links={links} />
    </Disclosure>
  );
}

function OthersList({ others, links }: { others: Match[]; links: FinderOutput['links'] }) {
  const t = useMessages(messages);
  const reason = useReason();
  return (
    <ul className="m-0 mb-2 grid list-none gap-0 rounded-tile border border-hair bg-paper-2 p-0">
      {others.map((m) => {
        const Icon = PROGRAM_LOOK[m.id].icon;
        return (
          <li key={m.id} className="flex items-start gap-3 border-t border-hair px-4 pb-3 pt-1 first:border-t-0">
            <Icon className="mt-[13px] size-[18px] shrink-0 text-ink-3" strokeWidth={1.8} aria-hidden />
            <div className="min-w-0 flex-1">
              <ExternalLink href={links[m.id].info} standalone icon={false} className="text-[14.5px]">
                <bdi>{t(`program.${m.id}`)}</bdi>
              </ExternalLink>
              <p className="m-0 -mt-1.5 text-[13.5px] leading-snug text-ink-3">
                <bdi>{reason(m)}</bdi>
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
