'use client';
/**
 * Citizenship ceremony and oath (citizenshipCeremony): the oath in English and French with a
 * line-by-line practice mode, the day itself (in person or virtual), a what-to-bring checklist saved on
 * the device, and what comes after (certificate, passport, voting).
 */
import { useState } from 'react';
import { Award, Landmark, Plane, SearchCheck, Vote } from 'lucide-react';
import { Checklist, ExternalLink, LinkButton, Segmented, Stepper, WidgetError, WidgetSection, WidgetShell, useChecklist } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useMessages } from '@/lib/i18n/widget';
import type { WidgetProps } from '@/lib/widgets/types';
import messages from './messages';
import { URLS } from './data';
import { Oath } from './Oath';
import { buildCeremony, type BringId, type CeremonyFormat, type CeremonyOutput } from './steps';
import { useLang } from './shared';
import { CzSkeleton } from './Skeletons';

type Input = { format?: CeremonyFormat };

export function CitizenshipCeremony({ part }: WidgetProps<Input, CeremonyOutput>) {
  const t = useMessages(messages);
  const lang = useLang();
  if (part.state === 'output-error') {
    return <WidgetError title={t('error.title')} message={t('error.body')} fallback={{ href: URLS.expect[lang], label: t('error.fallback') }} />;
  }
  if (part.state !== 'output-available' || !part.output) {
    return <CzSkeleton kind="ceremony" title={t('ceremony.title')} subtitle={t('ceremony.subtitle')} icon={Landmark} tone="amber" label={t('ceremony.loading')} />;
  }
  // Links and sources follow the reader's language, even if it changed after the answer was written.
  const data = part.output.lang === lang ? part.output : buildCeremony({ format: part.output.format ?? undefined, lang });
  return <Guide data={data} />;
}

function Guide({ data }: { data: CeremonyOutput }) {
  const t = useMessages(messages);
  const lang = useLang();
  const [format, setFormat] = useState<CeremonyFormat>(data.format ?? 'in-person');
  const day = (format === 'in-person' ? ['ip.1', 'ip.2', 'ip.3'] : ['v.1', 'v.2', 'v.3']).map((k) => ({
    title: t(`ceremony.day.${k}.title`),
    detail: t(`ceremony.day.${k}.detail`),
    state: 'upcoming' as const,
  }));

  return (
    <WidgetShell
      icon={Landmark}
      tone="amber"
      title={t('ceremony.title')}
      subtitle={t('ceremony.subtitle')}
      sources={data.sources}
      handoff={{
        href: URLS.ceremony[lang],
        label: t('ceremony.handoff'),
      }}
      footnote={t('ceremony.handoffNote')}
      secondaryAction={
        <LinkButton href={data.links.status} external variant="secondary" size="lg" icon={SearchCheck} className="max-sm:w-full">
          {t('ceremony.status')}
        </LinkButton>
      }
      className="@container"
    >
      <Oath data={data} initial={lang} />

      <WidgetSection title={t('ceremony.day.title')} className="mt-6 border-t border-hair">
        <Segmented
          label={t('ceremony.day.format')}
          value={format}
          onChange={(v) => setFormat(v)}
          options={[
            { value: 'in-person', label: t('ceremony.day.inPerson') },
            { value: 'virtual', label: t('ceremony.day.virtual') },
          ]}
        />
        <Stepper className="mt-5" steps={day} />
        <p className="m-0 mt-4 text-[13.5px] text-ink-3">{t('ceremony.day.length')}</p>
      </WidgetSection>

      {/* Each ceremony type has its own saved list. */}
      <Bring key={format} format={format} ids={data.bring[format]} />

      <WidgetSection title={t('ceremony.after.title')}>
        <ul className="m-0 grid list-none gap-2.5 p-0 @xl:grid-cols-3">
          {(
            [
              ['cert', Award],
              ['passport', Plane],
              ['vote', Vote],
            ] as const
          ).map(([k, Icon]) => (
            <li key={k} className="flex flex-col rounded-tile border border-hair bg-paper-2 px-4 py-3.5">
              <span className="grid size-9 place-items-center rounded-field bg-card text-ink-2 shadow-sm" aria-hidden>
                <Icon className={cn('size-[18px]', k === 'passport' && 'flip-rtl')} strokeWidth={1.8} />
              </span>
              <p className="m-0 mt-3 text-[15px] font-semibold leading-snug text-ink">{t(`ceremony.after.${k}.title`)}</p>
              <p className="m-0 mt-1 text-[13.5px] leading-snug text-ink-2">{t(`ceremony.after.${k}.detail`)}</p>
              {k !== 'cert' ? (
                <p className="m-0 mt-auto pt-2 text-[13.5px]">
                  <ExternalLink href={k === 'passport' ? data.links.newPassport : data.links.vote}>
                    {t(k === 'passport' ? 'ceremony.after.passportLink' : 'ceremony.after.voteLink')}
                  </ExternalLink>
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      </WidgetSection>
    </WidgetShell>
  );
}

/** What to bring: a checklist saved on this device, with its count in the section heading. */
function Bring({ format, ids }: { format: CeremonyFormat; ids: BringId[] }) {
  const t = useMessages(messages);
  const label = t('ceremony.bring.listLabel');
  const list = useChecklist(`citizenship:bring:${format}`, label, ids.length);
  // The consent form is only "if applicable" for a virtual ceremony, so its detail says so.
  const items = ids.map((id) => ({
    id,
    title: t(`ceremony.bring.${id}.title`),
    detail: t(id === 'form' && format === 'virtual' ? 'ceremony.bring.form.detailVirtual' : `ceremony.bring.${id}.detail`),
  }));
  return (
    <WidgetSection
      title={t('ceremony.bring.title')}
      aside={
        <span className="font-mono text-[12px] text-pine" aria-live="polite">
          {/* Isolated, so the leading number keeps its place in right-to-left text. */}
          <bdi>{t('ceremony.bring.progress', { done: ids.filter((id) => list.value.includes(id)).length, total: ids.length })}</bdi>
        </span>
      }
    >
      <Checklist label={label} items={items} value={list.value} onChange={list.onChange} />
    </WidgetSection>
  );
}
