'use client';
/** Urgent card loading state, ordered like the real card for each situation (sized from the tool input). */
import { LifeBuoy, ShieldAlert, ShieldQuestion } from 'lucide-react';
import { Skeleton } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useMessages } from '@/lib/i18n/widget';
import { useLang } from '../clock';
import { SCAM_SIGNS, URGENT } from '../urgent-data';
import messages from '../messages';
import { amberPanel, WithNumbers } from '../primitives';
import { isUrgentSituation, type UrgentSituation } from '../types';
import { CafcGhost, Frame, Ghost, ShellFooter, StepsGhost } from './parts';

/** 9-1-1 or 9-8-8 set large. */
function HeroGhost({ id }: { id: '911' | '988' }) {
  const t = useMessages(messages);
  return (
    <div className={cn('rounded-card px-5 py-5', id === '911' ? 'bg-maple-wash' : 'bg-pine-wash')}>
      <p className="m-0 text-[12px] font-semibold uppercase tracking-[.08em]">
        <Ghost>{t(`line.${id}.eyebrow`)}</Ghost>
      </p>
      <p className="m-0 mt-1.5 text-[16px] font-semibold leading-snug">
        <Ghost>{t(`line.${id}.when`)}</Ghost>
      </p>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
        <span className="block h-[50px] @xl:h-[58px]">
          <Skeleton className="h-full w-40 @xl:w-48" />
        </span>
        <span className="flex @max-sm:basis-full">
          <Skeleton className={cn('h-11 rounded-full', id === '911' ? 'w-24' : 'w-44')} />
        </span>
      </div>
      <p className="m-0 mt-3 text-[13.5px] leading-snug">
        <Ghost>{t(`line.${id}.detail`)}</Ghost>
      </p>
    </div>
  );
}

/** Kids Help Phone and the Hope for Wellness Help Line, side by side on wide cards. */
function SmallGhosts() {
  const t = useMessages(messages);
  const lang = useLang();
  return (
    <div className="grid gap-3 @xl:grid-cols-2">
      {(['kids', 'hope'] as const).map((id) => {
        const text = URGENT[id].text;
        return (
          <div key={id} className="flex flex-col rounded-tile border border-hair px-4 py-4">
            <p className="m-0 text-[15px] font-semibold leading-snug">
              <Ghost>{URGENT[id].name[lang]}</Ghost>
            </p>
            <p className="m-0 mt-0.5 text-[13.5px] leading-snug">
              <Ghost>{t(`line.${id}.who`)}</Ghost>
            </p>
            <Skeleton className="mt-3 h-[22px] w-24 rounded-full" />
            <Skeleton className="mt-2 h-[26px] w-48" />
            <p className="m-0 mt-1.5 text-[13.5px] leading-snug">
              <Ghost>{text?.keyword ? t('line.textKeyword', { keyword: text.keyword[lang], to: text.to }) : t(`line.${id}.langs`)}</Ghost>
            </p>
            <div className="mt-auto flex flex-wrap gap-2 pt-3">
              <Skeleton className="h-11 w-24 rounded-full" />
              <Skeleton className={cn('h-11 rounded-full', id === 'hope' ? 'w-36' : 'w-24')} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function UrgentSkeleton({ situation }: { situation?: UrgentSituation }) {
  const t = useMessages(messages);
  const sit: UrgentSituation = isUrgentSituation(situation) ? situation : 'all';
  const fraud = sit === 'fraud';
  if (sit === 'suspected') return <SuspectedSkeleton />;
  return (
    <Frame
      icon={fraud ? ShieldAlert : LifeBuoy}
      tone={fraud ? 'amber' : 'maple'}
      title={t(fraud ? 'urgent.titleFraud' : 'urgent.title')}
      subtitle={t(`urgent.subtitle.${sit}`)}
      label={t('urgent.loading')}
    >
      <div className="grid gap-3 px-5 sm:px-6">
        {fraud ? (
          <CafcGhost hero status buttons={['w-28']} />
        ) : sit === 'crisis' ? (
          <>
            <HeroGhost id="988" />
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-tile bg-maple-wash px-4 py-3">
              <p className="m-0 text-[14.5px] font-medium leading-snug">
                <Ghost>
                  <WithNumbers text={t('line.911.compact')} />
                </Ghost>
              </p>
              <Skeleton className="h-11 w-32 rounded-full" />
            </div>
            <SmallGhosts />
          </>
        ) : (
          <>
            <HeroGhost id="911" />
            <HeroGhost id="988" />
            <SmallGhosts />
            {sit === 'all' ? <CafcGhost status buttons={['w-40', 'w-28']} /> : null}
          </>
        )}
      </div>
      {fraud ? (
        <StepsGhost
          title={t('fraud.steps.title')}
          steps={(['bank', 'police', 'report'] as const).map((k) => ({ key: k, title: t(`fraud.steps.${k}.title`), detail: t(`fraud.steps.${k}.detail`) }))}
        >
          <div className="mt-2 rounded-tile bg-amber-wash px-4 py-3.5 ps-11 text-[14.5px] leading-snug">
            <Ghost>{t('fraud.recovery.title')}</Ghost> <Ghost>{t('fraud.recovery.body')}</Ghost>
          </div>
        </StepsGhost>
      ) : (
        <p className="m-0 mt-4 px-5 text-[13.5px] leading-snug sm:px-6">
          <Ghost>{t('urgent.footer')}</Ghost>
        </p>
      )}
      <ShellFooter note={fraud ? t('fraud.handoffNote') : t('urgent.handoffNote')} />
    </Frame>
  );
}

/** Suspicious call or message: warning signs, three steps and the Anti-Fraud Centre card, as the real card lays them out. */
function SuspectedSkeleton() {
  const t = useMessages(messages);
  const routes = (
    <div className="mt-2.5 divide-y divide-hair rounded-tile border border-hair">
      <span className="flex min-h-11 items-center gap-2.5 px-3.5">
        <Skeleton className="size-4" round />
        <Skeleton className="h-3.5 w-28" />
      </span>
      <span className="flex flex-col @xl:flex-row @xl:items-center">
        <span className="flex min-h-11 items-center gap-2.5 px-3.5 @xl:flex-1">
          <Skeleton className="size-4" round />
          <Skeleton className="h-3.5 w-40" />
        </span>
        <span className="block ps-10 pe-3.5 pb-3 @xl:ps-0 @xl:pb-0">
          <Skeleton className="h-6 w-56 rounded-full" />
        </span>
      </span>
    </div>
  );
  return (
    <Frame icon={ShieldQuestion} tone="amber" title={t('urgent.titleSuspected')} subtitle={t('urgent.subtitle.suspected')} label={t('urgent.loading')}>
      <div className="px-5 sm:px-6">
        <div className={cn('rounded-card px-5 py-5', amberPanel)}>
          <p className="m-0 text-[16px] font-semibold leading-snug">
            <Ghost>{t('suspect.signs.title')}</Ghost>
          </p>
          <div className="mt-3 grid gap-x-6 gap-y-2.5 @xl:grid-cols-2">
            {SCAM_SIGNS.map((k) => (
              <div key={k} className="flex items-start gap-2.5 text-[14px] leading-snug">
                <Skeleton className="mt-px size-5 shrink-0" round />
                <span>
                  <Ghost>{t(`suspect.signs.${k}`)}</Ghost>
                </span>
              </div>
            ))}
          </div>
          <p className="m-0 mt-4 border-t border-amber/20 pt-3 text-[13.5px] leading-snug">
            <Ghost>{t('suspect.signs.note')}</Ghost>
          </p>
        </div>
      </div>
      <StepsGhost
        title={t('suspect.steps.title')}
        steps={(['verify', 'report', 'paid'] as const).map((k) => ({
          key: k,
          title: t(`suspect.steps.${k}.title`),
          detail: t(`suspect.steps.${k}.detail`),
          // The CRA routes under the first and last steps: an online link, then a call row with its status.
          extra: k === 'report' ? undefined : routes,
        }))}
      >
        <CafcGhost buttons={['w-40']} className="mt-1" />
      </StepsGhost>
      <ShellFooter note={t('fraud.handoffNote')} />
    </Frame>
  );
}
