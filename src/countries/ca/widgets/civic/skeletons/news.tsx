'use client';
/** Loading state of civicNews: the filter rail and six news rows. */
import { Newspaper } from 'lucide-react';
import { Skeleton, SkeletonText } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useMessages } from '@/lib/i18n/widget';
import messages from '../messages';
import { Frame } from './frame';

export function NewsSkeleton({ topic }: { topic?: string }) {
  const t = useMessages(messages);
  return (
    <Frame icon={Newspaper} tone="amber" title={t('news.title')} subtitle={topic ? t('news.subtitleTopic', { topic }) : t('news.subtitle')} label={t('news.loading')}>
      <div aria-hidden>
        <div className="flex gap-1.5 overflow-hidden px-5 py-1 sm:px-6">
          {['w-16', 'w-32', 'w-28', 'w-36'].map((w) => (
            <Skeleton key={w} className={cn('h-11 shrink-0 rounded-chip', w)} />
          ))}
        </div>
        <ol className="m-0 mt-2 list-none p-0">
          {Array.from({ length: 6 }, (_, i) => (
            <li key={i} className={cn('px-5 py-[18px] sm:px-6', i > 0 && 'border-t border-hair')}>
              <Skeleton className="h-3 w-40" />
              <Skeleton className="mt-3 h-4 w-11/12" />
              <Skeleton className={cn('mt-2 h-4 w-1/2', i % 2 ? '' : '@xl:hidden')} />
              <SkeletonText lines={2} className="mt-3" />
              <Skeleton className="mt-3 h-3 w-48" />
            </li>
          ))}
        </ol>
      </div>
    </Frame>
  );
}
