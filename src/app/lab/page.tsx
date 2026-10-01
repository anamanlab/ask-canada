import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { pack } from '@/countries/active';
import { fixtures } from '@/countries/active.fixtures';
import { getT } from '@/lib/i18n/server-t';

export const metadata: Metadata = { title: 'Lab', robots: { index: false } };

/** /lab — index of every widget in the active pack, with fixture counts. */
export default async function LabIndex() {
  const { t } = await getT();
  const counts = await Promise.all(
    pack.widgetIds.map(async (id) => {
      try {
        return (await fixtures[id]()).default.length;
      } catch {
        return 0;
      }
    }),
  );
  return (
    <main className="mx-auto max-w-[1100px] px-5 py-14 sm:px-8">
      <p className="eyebrow">{pack.brand.name}</p>
      <h1 className="m-0 font-serif text-[clamp(40px,6vw,64px)] font-normal leading-none tracking-[-.035em]">{t('lab.title')}</h1>
      <p className="mt-4 max-w-[52ch] text-[17px] text-ink-2">{t('lab.sub')}</p>
      <p className="mt-2 font-mono text-[12px] text-ink-3">?theme=dark · ?lang=fr · ?dir=rtl</p>
      <ul className="mt-10 grid list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-3">
        {pack.widgetIds.map((id, i) => (
          <li key={id}>
            <Link
              href={`/lab/${id}`}
              className="group flex min-h-[92px] items-center justify-between gap-4 rounded-card border border-hair bg-card px-5 py-4 no-underline shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <span>
                <span className="block font-mono text-[13px] text-ink-3">{id}</span>
                <span className={counts[i] ? 'mt-1 block text-[15px] font-medium text-pine' : 'mt-1 block text-[15px] text-ink-3'}>
                  {t('lab.fixtures', { count: counts[i] })}
                </span>
              </span>
              <ArrowUpRight className="size-5 text-ink-3 transition group-hover:text-ink" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
