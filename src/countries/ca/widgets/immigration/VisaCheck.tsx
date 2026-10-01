'use client';
/**
 * Visa or eTA? A boarding-pass style verdict from IRCC's official country lists, with fees, the live visitor visa
 * processing time for the person's country, and the official questions as the final word.
 */
import { useState } from 'react';
import { Clock3, TicketsPlane } from 'lucide-react';
import { WidgetError, WidgetShell } from '@/components/ui';
import { useChatActions } from '@/components/chat/actions';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import type { WidgetProps } from '@/lib/widgets/types';
import type { EntryOutput } from './build';
import { countryName } from './country-name';
import { ENTRY_COUNTRIES, URLS } from './data';
import { useShareCountry } from './earlier';
import { checkEntry, needsVisa, type EntryInput, type Travel } from './entry';
import messages from './messages';
import { AskRow, LastKnown, LiveBadge } from './Shared';
import { decodeDuration } from './times';
import { TripForm, useVisaActions, VerdictCard } from './VisaParts';
import { VisaSkeleton } from './VisaSkeleton';

export function VisaCheck({ part, locale }: WidgetProps<EntryInput, EntryOutput>) {
  const t = useMessages(messages);
  if (part.state === 'output-error') {
    return <WidgetError title={t('visa.error.title')} message={t('visa.error.body')} fallback={{ href: URLS.checkVisaEta[locale === 'fr' ? 'fr' : 'en'], label: t('visa.error.fallback') }} />;
  }
  if (part.state !== 'output-available' || !part.output) {
    return <VisaSkeleton input={part.input ?? {}} lang={locale === 'fr' ? 'fr' : 'en'} />;
  }
  return <Check data={part.output} />;
}

/** Every nationality in the picker (a Canadian citizen needs no check). */
const NATIONALITIES = ENTRY_COUNTRIES.filter((c) => c !== 'CA');

function Check({ data }: { data: EntryOutput }) {
  const t = useMessages(messages);
  const [country, setCountryState] = useState(data.input.country ?? '');
  const [travel, setTravel] = useState<Travel>(data.input.travel ?? 'air');
  const [history, setHistory] = useState(!!data.input.hasVisaHistory);
  const [greenCard, setGreenCard] = useState(!!data.input.usPermanentResident);
  const r = checkEntry({ country: country || undefined, travel, hasVisaHistory: history, usPermanentResident: greenCard });
  const actions = useVisaActions(r, data.lang);
  const { send } = useChatActions();
  const { intl } = useLocale();
  const time = r.country ? decodeDuration(data.visitorTimes[r.country]) : null;
  const askTimes = r.country && needsVisa(r.kind) ? t('visa.askTimes', { country: countryName(r.country, intl) }) : null;
  // The conversation's memory (outside React): a later processing-time question can offer this country.
  const shareCountry = useShareCountry(data.input.country, !!data.pinned);
  const setCountry = (code: string) => {
    setCountryState(code);
    shareCountry(code);
  };
  return (
    <WidgetShell
      icon={TicketsPlane}
      tone="maple"
      title={t('visa.title')}
      subtitle={t('visa.subtitle')}
      badge={data.live ? <LiveBadge /> : undefined}
      sources={data.sources}
      handoff={actions.handoff}
      secondaryAction={actions.secondary}
      footnote={actions.footnote}
      className="@container"
    >
      <VerdictCard r={r} history={history} fees={data.fees} time={time} />
      {/* Only where a processing time is on the card: without one, nothing shown comes from the feed. */}
      {time && needsVisa(r.kind) && !data.live ? <LastKnown date={data.updated} /> : null}
      {/* The follow-up with the country written in, so the processing times open on it instead of asking again. */}
      {askTimes ? (
        <AskRow icon={Clock3} onClick={() => send(askTimes)}>
          {askTimes}
        </AskRow>
      ) : null}
      <TripForm r={r} country={country} history={history} greenCard={greenCard} codes={NATIONALITIES} onCountry={setCountry} onTravel={setTravel} onHistory={setHistory} onGreenCard={setGreenCard} />
    </WidgetShell>
  );
}
