'use client';
/**
 * Loading state of the processing times widget, shaped for the program asked about. The application types, the
 * notice for a paused program, the notes and the actions are the result's own parts, laid out invisibly under
 * their placeholders, so their height follows the copy in every language. Only the hero (the time itself, still
 * to come) keeps a measured height.
 */
import { ChevronDown, Clock3 } from 'lucide-react';
import { Button, Skeleton } from '@/components/ui';
import { useMessages } from '@/lib/i18n/widget';
import type { Lang } from './data';
import messages from './messages';
import { Section, useDuration } from './Shared';
import { Ghost, ShellSkeleton, Sized, SkActions, SkHeroFrame, SkText } from './Skeletons';
import { PausedNotice, StatusLink, TIME_ROW, TimeRowContent, useTimeRowText } from './TimesParts';
import { QUEBEC_SPLIT, TIME_KEYS, TIME_META, type Duration, type TimeKey } from './times';

/**
 * Typical published times, to give each row's value its usual width ("About 12 months"; in Quebec "About 30 months").
 * The real ones are live data: a row can still differ by a line on a phone.
 */
const TYPICAL: Duration = { n: 12, unit: 'month', q: 'about' };
/** Cards, extensions and visits are published in days or weeks: a shorter value ("30 days"). */
const TYPICAL_SHORT: Duration = { n: 30, unit: 'day' };
const typical = (k: TimeKey) => (TIME_META[k].basis === 'forward' && k !== 'pr-card' && !k.endsWith('extension') ? TYPICAL : TYPICAL_SHORT);
const TYPICAL_QUEBEC: Duration = { n: 30, unit: 'month', q: 'about' };

export function ProcessingTimesSkeleton({ program, lang }: { program?: TimeKey; lang: Lang }) {
  const t = useMessages(messages);
  const dur = useDuration();
  const rowText = useTimeRowText();
  const fr = lang === 'fr';
  const focus = program && TIME_META[program] ? program : 'cec';
  const paused = focus === 'parents';
  const keys = TIME_KEYS.filter((k) => TIME_META[k].group === TIME_META[focus].group);
  return (
    <ShellSkeleton
      title={t('pt.title')}
      subtitle={t('pt.subtitle')}
      icon={Clock3}
      tone="glacier"
      label={t('pt.loading')}
      sourceBar={fr ? 'h-[83px]' : undefined}
      actionBar={<SkActions primary={t('pt.handoff')} note={t('pt.handoffNote')} />}
    >
      <SkHeroFrame className={paused ? 'h-[189px] max-sm:h-[203px]' : fr ? 'h-[166px] max-sm:h-[199px]' : 'h-[166px] max-sm:h-[179px]'}>
        <Skeleton className="h-3.5 w-40" />
        <Skeleton className="mt-3 h-10 w-44" />
        <Skeleton className="mt-4 h-3.5 w-4/5" />
        <Skeleton className="mt-2 h-3.5 w-1/2" />
      </SkHeroFrame>
      {paused ? (
        <Sized real={<PausedNotice program={focus} lang={lang} />}>
          <div className="h-full px-5 pt-4 sm:px-6">
            <Skeleton className="h-full w-full rounded-tile" />
          </div>
        </Sized>
      ) : null}
      <Sized real={<StatusLink lang={lang} />}>
        <div className="h-full px-5 pt-4 sm:px-6">
          <Skeleton className="h-full w-full rounded-field" />
        </div>
      </Sized>
      <div aria-hidden inert>
        <Section title={<SkText>{t(`pt.group.${TIME_META[focus].group}`)}</SkText>}>
          <div className="grid gap-0.5">
            {keys.map((k) => (
              <div key={k} className={TIME_ROW}>
                <TimeRowContent
                  label={<SkText>{rowText.label(k)}</SkText>}
                  value={<SkText>{TIME_META[k].byCountry ? t('pt.byCountry') : dur(typical(k))}</SkText>}
                  known
                  paused={k === 'parents'}
                  quebec={QUEBEC_SPLIT.includes(k) ? <SkText>{rowText.quebec(k, TYPICAL_QUEBEC)}</SkText> : undefined}
                  meter={TIME_META[k].byCountry ? undefined : { value: 0, max: 1, on: false }}
                />
              </div>
            ))}
          </div>
        </Section>
        <div className="px-5 pt-3 sm:px-6">
          <Ghost shape="rounded-chip" className="-ms-3 w-fit">
            <Button size="md" variant="quiet" className="px-3" iconEnd={ChevronDown}>
              {t('pt.showAll', { count: TIME_KEYS.length })}
            </Button>
          </Ghost>
        </div>
        <p className="m-0 px-5 pt-4 text-[12.5px] leading-snug sm:px-6">
          <SkText>{t('pt.note')}</SkText>
        </p>
      </div>
    </ShellSkeleton>
  );
}
