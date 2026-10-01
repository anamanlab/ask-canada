'use client';
/**
 * Error boundary for every page under the root layout: the same calm shell as the 404, in the person's
 * language, with a retry and the way home. The root layout's own failures land in `global-error.tsx`.
 * The way home is a plain link: after an error a full page load is the safer recovery, and this boundary
 * ships with every route, so it stays free of the router's link component.
 */
import { useEffect } from 'react';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import { useT } from '@/lib/i18n/provider';
import { StatusPage, statusAction, statusActionQuiet } from './_status/StatusPage';

export default function ErrorPage({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  const t = useT();
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <StatusPage title={t('error.generic')}>
      <button type="button" onClick={retry} className={statusAction}>
        <RotateCcw className="size-4" aria-hidden />
        {t('chat.retry')}
      </button>
      <a href="/" className={statusActionQuiet}>
        <ArrowLeft className="size-4 flip-rtl" aria-hidden />
        {t('notFound.home')}
      </a>
    </StatusPage>
  );
}
