'use client';
/**
 * Loading state of the visa / eTA check: the answer the input already implies (same rules as the result), laid
 * out with the result's own parts as placeholders. Nothing is measured by hand, so the page doesn't move when
 * the output lands, in any language or at any width.
 */
import { Clock3, TicketsPlane } from 'lucide-react';
import { Skeleton } from '@/components/ui';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import type { Lang } from './data';
import { countryName } from './country-name';
import { checkEntry, needsVisa, type EntryInput } from './entry';
import messages from './messages';
import { AskRow } from './Shared';
import { Ghost, ShellSkeleton, Sized, SkActions } from './Skeletons';
import { TripForm, useVisaActions, VerdictCard } from './VisaParts';

const noop = () => {};

export function VisaSkeleton({ input, lang }: { input: Partial<EntryInput>; lang: Lang }) {
  const t = useMessages(messages);
  const r = checkEntry(input);
  const history = !!input.hasVisaHistory;
  const actions = useVisaActions(r, lang);
  const { intl } = useLocale();
  return (
    <ShellSkeleton
      title={t('visa.title')}
      subtitle={t('visa.subtitle')}
      icon={TicketsPlane}
      tone="maple"
      label={t('visa.loading')}
      sourceBar="h-[83px]"
      actionBar={
        <SkActions
          primary={actions.handoff.label}
          secondary={actions.note ? null : <Ghost shape="rounded-chip" className="max-sm:w-full">{actions.secondary}</Ghost>}
          note={actions.note}
          footnote={actions.footnote}
        />
      }
    >
      <VerdictCard r={r} history={history} ghost />
      {r.country && needsVisa(r.kind) ? (
        <Sized real={<AskRow icon={Clock3}>{t('visa.askTimes', { country: countryName(r.country, intl) })}</AskRow>}>
          <div className="h-full px-5 pt-4 sm:px-6">
            <Skeleton className="h-full w-full rounded-field" />
          </div>
        </Sized>
      ) : null}
      <div aria-hidden inert>
        <TripForm r={r} country="" history={history} greenCard={!!input.usPermanentResident} codes={[]} onCountry={noop} onTravel={noop} onHistory={noop} onGreenCard={noop} ghost />
      </div>
    </ShellSkeleton>
  );
}
