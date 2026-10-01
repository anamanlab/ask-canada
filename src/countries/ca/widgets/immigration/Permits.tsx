'use client';
/**
 * Study and work permits at a glance: fees, money you need (by family size), live processing time from the
 * country you apply from, working while studying, the PGWP, and IRCC's self-service tools as the next step.
 */
import { useState } from 'react';
import { BriefcaseBusiness, GraduationCap } from 'lucide-react';
import { WidgetError, WidgetShell } from '@/components/ui';
import { useMessages } from '@/lib/i18n/widget';
import type { WidgetProps } from '@/lib/widgets/types';
import type { PermitFocus, PermitsOutput } from './build';
import { URLS, type Lang } from './data';
import messages from './messages';
import { PermitsBody } from './PermitsBody';
import { HandoffHint, LastKnown, LiveBadge } from './Shared';
import { ShellSkeleton, SkActions } from './Skeletons';
import { decodeDuration } from './times';

export function Permits({ part, locale }: WidgetProps<{ focus?: PermitFocus; country?: string }, PermitsOutput>) {
  const t = useMessages(messages);
  const focus = part.output?.focus ?? part.input?.focus ?? 'study';
  if (part.state === 'output-error') {
    const lang = locale === 'fr' ? 'fr' : 'en';
    return (
      <WidgetError
        title={t('permits.error.title')}
        message={t('permits.error.body')}
        fallback={{ href: focus === 'work' ? URLS.workCanada[lang] : URLS.studyPermit[lang], label: t('permits.error.fallback') }}
      />
    );
  }
  if (part.state !== 'output-available' || !part.output) {
    return <PermitsSkeleton focus={focus} country={part.input?.country} lang={locale === 'fr' ? 'fr' : 'en'} />;
  }
  return <Overview data={part.output} />;
}

/**
 * Loading state: the same body as the result, as placeholders over the real copy and controls, so its height
 * follows the layout in every language and at every width.
 */
function PermitsSkeleton({ focus, country, lang }: { focus: PermitFocus; country?: string; lang: Lang }) {
  const t = useMessages(messages);
  const handoff = usePermitsHandoff(focus, lang);
  return (
    <ShellSkeleton
      title={t(`permits.title.${focus}`)}
      subtitle={t('permits.subtitle')}
      icon={focus === 'work' ? BriefcaseBusiness : GraduationCap}
      tone={focus === 'work' ? 'amber' : 'pine'}
      label={t('permits.loading')}
      actionBar={<SkActions primary={handoff.label} note={handoff.note} footnote={t('permits.footnote')} />}
    >
      <div aria-hidden inert>
        <PermitsBody focus={focus} country={country && /^[A-Z]{2}$/.test(country) ? country : ''} family={1} ghost />
      </div>
    </ShellSkeleton>
  );
}

function usePermitsHandoff(focus: PermitFocus, lang: Lang) {
  const t = useMessages(messages);
  return focus === 'study'
    ? { href: URLS.studyTool[lang], label: t('permits.handoff.study'), note: t('permits.handoff.studyNote') }
    : { href: URLS.needWorkPermit[lang], label: t('permits.handoff.work'), note: t('permits.handoff.workNote') };
}

function Overview({ data }: { data: PermitsOutput }) {
  const t = useMessages(messages);
  const [focus, setFocus] = useState<PermitFocus>(data.focus);
  const [country, setCountry] = useState(data.country ?? '');
  const [family, setFamily] = useState(data.familySize);
  const handoff = usePermitsHandoff(focus, data.lang);
  const map = data.countryTimes[focus] ?? {};
  const study = focus === 'study';
  return (
    <WidgetShell
      icon={study ? GraduationCap : BriefcaseBusiness}
      tone={study ? 'pine' : 'amber'}
      title={t(`permits.title.${focus}`)}
      subtitle={t('permits.subtitle')}
      badge={data.live ? <LiveBadge /> : undefined}
      sources={data.sources}
      handoff={{ href: handoff.href, label: handoff.label }}
      secondaryAction={<HandoffHint>{handoff.note}</HandoffHint>}
      footnote={t('permits.footnote')}
      className="@container"
    >
      <PermitsBody
        focus={focus}
        onFocus={setFocus}
        country={country}
        onCountry={setCountry}
        family={family}
        onFamily={setFamily}
        fees={data.fees}
        studyFunds={data.studyFunds}
        study={data.study}
        times={map}
        extension={decodeDuration(study ? data.times.studyExtension : data.times.workExtension)}
        notice={data.live ? null : <LastKnown date={data.updated} />}
      />
    </WidgetShell>
  );
}
