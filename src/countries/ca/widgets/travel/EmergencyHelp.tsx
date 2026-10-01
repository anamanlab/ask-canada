'use client';
/**
 * Emergency help for Canadians abroad (tool `travelEmergencyHelp`). This file handles the tool's states;
 * the card (EmergencyCard) loads as its own chunk.
 */
import { Suspense, use } from 'react';
import { LifeBuoy, Mail, Phone } from 'lucide-react';
import { WidgetError } from '@/components/ui';
import { useMessages } from '@/lib/i18n/widget';
import type { WidgetProps } from '@/lib/widgets/types';
import { EWRC, URLS } from './data';
import { frIn } from './fr';
import { lazyPart } from './lazy';
import messages from './messages';
import { useUiLang } from './shared';
import { EmergencySkeleton } from './skeletons';
import type { EmergencyOutput } from './types';

const card = lazyPart(() => import('./EmergencyCard').then((m) => m.EmergencyCard));

// The destination table (230 names and their spellings) stays out of the first chunk: it loads only to name
// the place in the skeleton. If it can't load, the subtitle stays generic.
let table: Promise<typeof import('./countries') | null> | undefined;
const countries = () => (table ??= import('./countries').catch(() => null));

/**
 * The skeleton's subtitle with the destination as the card will name it: in the page's language whatever
 * language the tool was asked in ("Mexico" on a French page reads « au Mexique »), so the line doesn't change
 * when the result arrives. A place we can't recognise keeps the generic line, as the card does.
 */
function PlaceSubtitle({ dest }: { dest: string }) {
  const t = useMessages(messages);
  const L = useUiLang();
  const row = use(countries())?.findCountry(dest);
  if (!row) return t('sos.subtitle');
  const name = row[L === 'fr' ? 2 : 1];
  return t('sos.subtitleIn', { country: name, inCountry: frIn(name) });
}

export function EmergencyHelp({ part }: WidgetProps<{ destination?: string }, EmergencyOutput>) {
  const t = useMessages(messages);
  const L = useUiLang();
  if (part.state === 'output-error') {
    // In an emergency the number must be one tap: the call and the email are links, the web page comes second.
    const contact = 'inline-flex min-h-11 items-center gap-2 font-semibold text-ink underline decoration-hair-2 underline-offset-[3px] hover:decoration-ink';
    return (
      <WidgetError
        title={t('error.title')}
        message={
          <>
            {t('error.help')}
            <span className="mt-1 flex flex-col items-start">
              <span className="flex flex-wrap items-center gap-x-2">
                <a href={EWRC.collect.href} className={contact}>
                  <Phone className="size-4 shrink-0" aria-hidden strokeWidth={2} />
                  <bdi>{t('error.helpCall', { number: EWRC.collect.label.replace(/ /g, '\u00a0') })}</bdi>
                </a>
                <span className="text-[13px] text-ink-3">{t('error.helpCollect')}</span>
              </span>
              <a href={EWRC.email.href} className={contact}>
                <Mail className="size-4 shrink-0" aria-hidden strokeWidth={2} />
                <bdi>{t('error.helpEmail', { address: EWRC.email.label })}</bdi>
              </a>
            </span>
          </>
        }
        fallback={{ href: URLS.emergency[L], label: t('error.helpLink') }}
      />
    );
  }
  if (part.state !== 'output-available' || !part.output) {
    // The card's chunk loads while the tool is still working.
    card.preload();
    const withPlace = part.state === 'input-available' && !!part.input?.destination?.trim();
    const dest = withPlace && typeof part.input?.destination === 'string' && part.input.destination.length < 40 ? part.input.destination.trim() : '';
    const subtitle = dest ? (
      <Suspense fallback={t('sos.subtitle')}>
        <PlaceSubtitle dest={dest} />
      </Suspense>
    ) : (
      t('sos.subtitle')
    );
    return <EmergencySkeleton icon={LifeBuoy} title={t('sos.title')} subtitle={subtitle} label={t('sos.loading')} withPlace={withPlace} />;
  }
  const out = part.output;
  return (
    <Suspense fallback={<EmergencySkeleton icon={LifeBuoy} title={t('sos.title')} subtitle={t('sos.subtitle')} label={t('sos.loading')} withPlace={!!out.country} />}>
      <card.Part out={out} />
    </Suspense>
  );
}
