'use client';
/**
 * TFSA / RRSP / FHSA room helper for 2026. Interactive: every figure recomputes on the device.
 */
import { useState, type ReactNode } from 'react';
import { PiggyBank } from 'lucide-react';
import { Segmented, WidgetError, WidgetShell } from '@/components/ui';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import type { WidgetProps } from '@/lib/widgets/types';
import { roomArgs } from './args';
import { buildRoom } from './build';
import { savingsRoom, type RoomInput } from './calc/room';
import { URLS, localizeSources } from './urls';
import messages from './messages';
import { FhsaPanel, RrspPanel, TfsaPanel } from './RoomPanels';
import { AnswerLang, SHELL } from './shared';
import { TaxSkeleton } from './skeleton';
import type { RoomFocus, RoomInputArgs, RoomResult } from './types';

export function SavingsRoom(props: WidgetProps<RoomInputArgs, RoomResult>) {
  return (
    <AnswerLang lang={props.part.input?.lang}>
      <SavingsRoomView {...props} />
    </AnswerLang>
  );
}

function SavingsRoomView({ part }: WidgetProps<RoomInputArgs, RoomResult>) {
  const t = useMessages(messages);
  const { locale } = useLocale();
  const lang = locale === 'fr' ? 'fr' : 'en';
  if (part.state === 'output-error') {
    return <WidgetError title={t('room.error.title')} message={t('error.body')} fallback={{ href: URLS.tfsaRoom[lang], label: t('error.fallback') }} />;
  }
  if (part.state !== 'output-available' || !part.output) {
    // The widget itself, built from the input so far and drawn as a skeleton: same layout, so nothing jumps.
    return (
      <TaxSkeleton label={t('loading')}>
        <Room initial={buildRoom(roomArgs(part.input, lang))} />
      </TaxSkeleton>
    );
  }
  return <Room initial={part.output} />;
}

function Room({ initial }: { initial: RoomResult }) {
  const t = useMessages(messages);
  const { fmt, locale } = useLocale();
  const lang = locale === 'fr' ? 'fr' : 'en';
  const [tab, setTab] = useState<RoomFocus>(initial.focus);
  // Everything the person can edit, in one object: each panel patches the fields it owns.
  const [form, setForm] = useState<RoomInput>(initial.input);
  const patch = (next: Partial<RoomInput>) => setForm((f) => ({ ...f, ...next }));
  const room = savingsRoom(form);
  const money = (n: number) => fmt.money(n, { cents: 'never' });

  // Three tabs share a phone's width: there the RRSP maximum uses its short form, so every tab keeps one line.
  const rrspMax = { amount: money(room.rrsp.limit) };
  const tabs: { value: RoomFocus; label: string; sub: ReactNode }[] = [
    { value: 'tfsa', label: t('room.tab.tfsa'), sub: room.tfsa.room != null ? money(room.tfsa.room) : t('room.tab.tfsaSub', { amount: money(room.tfsa.years[room.tfsa.years.length - 1].limit) }) },
    {
      value: 'rrsp',
      label: t('room.tab.rrsp'),
      sub:
        room.rrsp.newRoom != null ? (
          money(room.rrsp.newRoom)
        ) : (
          <>
            <span className="whitespace-nowrap @md:hidden">{t('room.tab.rrspSubNarrow', rrspMax)}</span>
            <span className="hidden @md:inline">{t('room.tab.rrspSub', rrspMax)}</span>
          </>
        ),
    },
    { value: 'fhsa', label: t('room.tab.fhsa'), sub: money(room.fhsa.room) },
  ];
  // The footer leads with the open plan's own page, whichever plan the question was about.
  const lead = URLS[{ tfsa: 'tfsaRoom', rrsp: 'rrspLimit', fhsa: 'fhsa' }[tab] as 'tfsaRoom' | 'rrspLimit' | 'fhsa'][lang];
  const all = localizeSources(initial.sources, lang);
  const sources = [...all.filter((s) => s.url === lead), ...all.filter((s) => s.url !== lead)];
  const Panel = tab === 'tfsa' ? TfsaPanel : tab === 'rrsp' ? RrspPanel : FhsaPanel;

  return (
    <WidgetShell
      icon={PiggyBank}
      tone="glacier"
      title={t('room.title')}
      subtitle={t('room.subtitle')}
      sources={sources}
      handoff={{ href: URLS.signIn[lang], label: t('room.handoff'), note: t('room.handoffNote') }}
      footnote={t('room.footnote')}
      className={SHELL}
    >
      <div className="px-5 sm:px-6">
        <Segmented label={t('room.tabs')} value={tab} onChange={setTab} options={tabs} />
      </div>
      <Panel room={room} form={form} patch={patch} />
    </WidgetShell>
  );
}
