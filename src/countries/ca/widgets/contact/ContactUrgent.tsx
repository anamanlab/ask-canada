'use client';
/**
 * Urgent help: 911 and 9-8-8 up front, youth and Indigenous help lines, and the Canadian Anti-Fraud
 * Centre with its live hours. Scams come in two shapes: `suspected` (a call or message that may be a scam:
 * the CRA's warning signs, verify, report even with no loss) and `fraud` (money or details lost: bank,
 * police, report). Order follows the situation.
 */
import { LifeBuoy, ShieldAlert } from 'lucide-react';
import { Notice, Stepper, WidgetSection, WidgetShell } from '@/components/ui';
import { useMessages } from '@/lib/i18n/widget';
import type { WidgetProps } from '@/lib/widgets/types';
import { useClock, useLang } from './clock';
import { type UrgentId } from './urgent-data';
import { URLS } from './urls';
import messages from './messages';
import type { Viewer } from './pick';
import { UrgentSkeleton } from './skeletons/UrgentSkeleton';
import { sourcesForUrgent } from './sources';
import { Suspected } from './Suspected';
import type { UrgentInput, UrgentOutput } from './types';
import { BigLine, CafcCard, SmallLine } from './UrgentLines';

export function ContactUrgent({ part }: WidgetProps<UrgentInput, UrgentOutput>) {
  if (part.state === 'output-error') return <UrgentFallback />;
  if (part.state !== 'output-available' || !part.output) return <UrgentSkeleton situation={part.input?.situation} />;
  return <Urgent data={part.output} />;
}

/**
 * Error state. The tool failed, but 911 and 9-8-8 don't depend on it: both stay one tap away, built from
 * static data, with the canada.ca help page as the fallback.
 */
function UrgentFallback() {
  const t = useMessages(messages);
  const lang = useLang();
  return (
    <WidgetShell
      icon={LifeBuoy}
      tone="maple"
      title={t('urgent.errorTitle')}
      subtitle={t('urgent.errorBody')}
      handoff={{ href: URLS.mentalHealth[lang], label: t('urgent.errorFallback'), note: t('urgent.handoffNote') }}
      className="@container"
    >
      <div className="grid gap-3 px-5 sm:px-6" role="alert">
        <BigLine id="911" compact />
        <BigLine id="988" compact />
      </div>
    </WidgetShell>
  );
}

const isSmall = (id: UrgentId) => id === 'kids' || id === 'hope';

function Urgent({ data }: { data: UrgentOutput }) {
  const t = useMessages(messages);
  const lang = useLang();
  const { now, tz } = useClock(data);
  const viewer: Viewer = { now, tz, holidays: data.holidays, lang };
  // Rebuilt for the interface language, so the footer matches the card even if the language changed after the tool ran.
  const sources = sourcesForUrgent(data.situation, lang);
  if (data.situation === 'suspected') return <Suspected viewer={viewer} sources={sources} />;

  const [hero, ...rest] = data.order;
  const fraud = data.situation === 'fraud';
  return (
    <WidgetShell
      icon={fraud ? ShieldAlert : LifeBuoy}
      tone={fraud ? 'amber' : 'maple'}
      title={t(fraud ? 'urgent.titleFraud' : 'urgent.title')}
      subtitle={t(`urgent.subtitle.${data.situation}`)}
      sources={sources}
      handoff={
        fraud
          ? { href: URLS.cafcReport[lang], label: t('fraud.handoff'), note: t('fraud.handoffNote') }
          : { href: URLS.mentalHealth[lang], label: t('urgent.handoff'), note: t('urgent.handoffNote') }
      }
      className="@container"
    >
      <div className="grid gap-3 px-5 sm:px-6">
        {hero === 'cafc' ? <CafcCard viewer={viewer} hero /> : hero === '911' || hero === '988' ? <BigLine id={hero} /> : null}
        {/* Under the Anti-Fraud Centre a scam is rarely a 9-1-1 matter: the steps below say when to call the police. */}
        {rest.includes('911') && hero !== 'cafc' ? <BigLine id="911" compact /> : null}
        {rest.includes('988') ? <BigLine id="988" /> : null}
        {data.order.some(isSmall) ? (
          <div className="grid gap-3 @xl:grid-cols-2">
            {data.order.map((id) => (id === 'kids' || id === 'hope' ? <SmallLine key={id} id={id} /> : null))}
          </div>
        ) : null}
        {rest.includes('cafc') ? <CafcCard viewer={viewer} /> : null}
      </div>

      {fraud ? (
        <WidgetSection title={t('fraud.steps.title')} className="mt-5">
          <Stepper
            steps={(['bank', 'police', 'report'] as const).map((k, i) => ({
              title: t(`fraud.steps.${k}.title`),
              detail: t(`fraud.steps.${k}.detail`),
              state: i === 0 ? 'current' : 'upcoming',
            }))}
          />
          <Notice tone="warn" className="mt-4" title={t('fraud.recovery.title')}>
            {t('fraud.recovery.body')}
          </Notice>
        </WidgetSection>
      ) : (
        <p className="m-0 mt-4 px-5 text-[13.5px] leading-snug text-ink-3 sm:px-6">
          <bdi>{t('urgent.footer')}</bdi>
        </p>
      )}
    </WidgetShell>
  );
}
