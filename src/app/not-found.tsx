import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getT } from '@/lib/i18n/server-t';
import { StatusPage, statusAction } from './_status/StatusPage';

/** 404: calm, bilingual-aware, and points back to asking a question. */
export default async function NotFound() {
  const { t } = await getT();
  return (
    <StatusPage code="404" title={t('notFound.title')} body={t('notFound.body')}>
      <Link href="/" className={statusAction}>
        <ArrowLeft className="size-4 flip-rtl" aria-hidden />
        {t('notFound.home')}
      </Link>
    </StatusPage>
  );
}
