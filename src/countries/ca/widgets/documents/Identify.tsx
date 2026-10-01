'use client';
/** "Which document do you have?": the picker shown when no details of the document reached the tool. */
import { useId } from 'react';
import type { LucideIcon } from 'lucide-react';
import { ArrowRight, EyeOff, FileSearch, FileText, ShieldAlert } from 'lucide-react';
import { Notice, WidgetSection, WidgetShell } from '@/components/ui';
import { useChatActions } from '@/components/chat/actions';
import { cn } from '@/lib/cn';
import { useMessages } from '@/lib/i18n/widget';
import { DOC_IDS, type Dept, type DocId } from './data';
import { DOCS } from './docs';
import type { ExplainOutput } from './explain';
import { pickSources, useLang } from './local';
import messages from './messages';

const GROUPS: Dept[] = ['cra', 'esdc', 'ircc'];

export function Identify({ data }: { data: ExplainOutput }) {
  const t = useMessages(messages);
  const lang = useLang();
  const { send } = useChatActions();
  const ask = (id: DocId) => send(t('identify.ask', { name: t(`doc.${id}.name`), title: t(`doc.${id}.title`) }));
  // Each list is named by its section heading; ids are per card (the picker can appear more than once).
  const uid = useId();
  return (
    <WidgetShell icon={FileText} tone="glacier" title={t('title')} subtitle={t('subtitle')} sources={pickSources(data, lang)} className="@container">
      <div className="px-5 sm:px-6">
        <p className="m-0 font-serif text-[26px] leading-[1.15] tracking-[-.02em] text-ink [font-variation-settings:'opsz'_36]">{t('identify.title')}</p>
        <p className="m-0 mt-1.5 text-[15px] text-ink-2">{t('identify.sub')}</p>
      </div>
      {GROUPS.map((g) => (
        <WidgetSection key={g} id={`${uid}-g-${g}`} title={t(`dept.${g}`)}>
          <ul className="m-0 grid list-none gap-2 p-0 @xl:grid-cols-2" aria-labelledby={`${uid}-g-${g}`}>
            {DOC_IDS.filter((id) => DOCS[id].dept === g).map((id) => (
              // An odd tile left alone on the last row takes the whole row (no empty cell beside it).
              <li key={id} className="@xl:last:odd:col-span-2">
                <button
                  type="button"
                  onClick={() => ask(id)}
                  className="group flex h-full min-h-[64px] w-full items-center gap-3 rounded-tile border border-hair bg-card px-4 py-3 text-start shadow-sm transition-[transform,box-shadow,border-color] duration-200 ease-spring hover:-translate-y-px hover:border-hair-2 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-semibold leading-snug text-ink">{t(`doc.${id}.title`)}</span>
                    <span className="mt-0.5 block text-[13px] leading-snug text-ink-3">{t(`doc.${id}.hint`)}</span>
                  </span>
                  <ArrowRight className="size-4 shrink-0 text-ink-3 transition-transform duration-200 group-hover:translate-x-0.5 flip-rtl rtl:group-hover:-translate-x-0.5" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        </WidgetSection>
      ))}
      <div className="grid gap-2.5 px-5 pt-5 sm:px-6 @xl:grid-cols-2">
        <SpecialTile icon={ShieldAlert} tone="amber" title={t('identify.scam.title')} hint={t('identify.scam.hint')} onClick={() => send(t('identify.scam.ask'))} />
        <SpecialTile icon={FileSearch} tone="pine" title={t('identify.forms.title')} hint={t('identify.forms.hint')} onClick={() => send(t('identify.forms.ask'))} />
      </div>
      <div className="px-5 pb-5 pt-4 sm:px-6">
        <Notice tone="info" icon={EyeOff}>
          {t('identify.tip')}
        </Notice>
      </div>
    </WidgetShell>
  );
}

function SpecialTile({ icon: Icon, tone, title, hint, onClick }: { icon: LucideIcon; tone: 'amber' | 'pine'; title: string; hint: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group flex min-h-[64px] w-full items-center gap-3.5 rounded-tile px-4 py-3.5 text-start transition-transform duration-200 ease-spring hover:-translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink',
        tone === 'amber' ? 'bg-amber-wash' : 'bg-pine-wash',
      )}
    >
      <span className={cn('grid size-10 shrink-0 place-items-center rounded-field bg-card shadow-sm', tone === 'amber' ? 'text-amber' : 'text-pine')}>
        <Icon className="size-5" strokeWidth={1.8} aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-semibold leading-snug text-ink">{title}</span>
        <span className="mt-0.5 block text-[13px] leading-snug text-ink-2">{hint}</span>
      </span>
      <ArrowRight className="size-4 shrink-0 text-ink-2 flip-rtl" aria-hidden />
    </button>
  );
}
