'use client';
/**
 * What each card shows before (or instead of) the tool's answer: the loading state shaped like the answer,
 * and the error with the official page to fall back on. These ship with the widget; the cards themselves are
 * loaded on demand (see ./index).
 */
import { WidgetError } from '@/components/ui';
import { useMessages } from '@/lib/i18n/widget';
import { DEPT_HOME, DOCS, OTHER_HOME } from './docs';
import { DocSkeleton, stepCount } from './DocSkeleton';
import type { ExplainInput } from './explain';
import { FormsSkeleton } from './FormsSkeleton';
import { useLang } from './local';
import messages from './messages';
import { url, type UrlKey } from './urls';

export function ExplainPending({ input }: { input?: Partial<ExplainInput> }) {
  const t = useMessages(messages);
  const verify = input?.focus === 'verify';
  const known = !!(input?.docType || input?.summary || input?.title);
  return (
    <DocSkeleton
      kind={verify ? 'verify' : known ? 'doc' : 'identify'}
      steps={stepCount(input?.docType)}
      title={t('title')}
      subtitle={verify ? t('badge.verify') : t('subtitle')}
      label={t('loading')}
    />
  );
}

export function ExplainError({ input }: { input?: Partial<ExplainInput> }) {
  const t = useMessages(messages);
  const lang = useLang();
  const page = fallbackPage(input);
  return <WidgetError title={t('error.title')} message={t('error.body')} fallback={{ href: url(page, lang), label: t(`link.${page}`) }} />;
}

/** The official page to fall back on when the tool fails: the one for this document or sender. */
function fallbackPage(input?: Partial<ExplainInput>): UrlKey {
  if (input?.focus === 'verify') return 'recognizeScam';
  const doc = input?.docType && input.docType !== 'other' && DOCS[input.docType] ? input.docType : null;
  if (doc) return DOCS[doc].links[0];
  const issuer = input?.issuer;
  if (issuer === 'cra' || issuer === 'esdc' || issuer === 'ircc') return DEPT_HOME[issuer].links[0];
  if (issuer === 'provincial' || issuer === 'other-federal') return OTHER_HOME[issuer].links[0];
  return 'noa';
}

export function FormsPending() {
  const t = useMessages(messages);
  return <FormsSkeleton title={t('forms.title')} subtitle={t('forms.subtitle')} label={t('forms.loading')} />;
}

export function FormsError() {
  const t = useMessages(messages);
  const lang = useLang();
  return <WidgetError title={t('forms.error.title')} message={t('forms.error.body')} fallback={{ href: url('craForms', lang), label: t('forms.error.fallback') }} />;
}
