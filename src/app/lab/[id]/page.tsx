import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { pack } from '@/countries/active';
import { catalogs, fixtures } from '@/countries/active.fixtures';
import { Orb } from '@/components/chat/AssistantMessage';
import { LabFixture, LabFixtureList, LabSection } from '@/components/lab/LabFixtures';
import { EmptyState } from '@/components/ui/States';
import { getT } from '@/lib/i18n/server-t';
import '@/components/chat/chat.css';

export const metadata: Metadata = { title: 'Lab', robots: { index: false } };

/**
 * /lab/<id>: every fixture of one widget, in the same message column the chat uses, so spacing, width and
 * typography match production. The page, its title and every fixture's header render on the server (no layout
 * shift); each widget mounts in the browser as it nears the viewport (see LabFixtures.tsx).
 */
export default async function LabWidget({ params }: PageProps<'/lab/[id]'>) {
  const { id } = await params;
  // The proxy already answers an unknown id with the server-rendered 404; this covers client navigations.
  if (!pack.widgetIds.includes(id)) notFound();
  const { t, locale } = await getT();
  const [items, catalog] = await Promise.all([
    fixtures[id]?.().then((m) => m.default).catch(() => []) ?? [],
    catalogs[id]?.().then((m) => m.default).catch(() => undefined),
  ]);
  // The widget's own display name ("Passport renewal planner"), in the page language; the id is the fallback.
  const title = catalog?.[locale]?.title ?? catalog?.en?.title ?? id;
  return (
    <div className="ac-chat">
      <main className="ac-thread" id="thread">
        <Link href="/lab" className="inline-flex min-h-11 items-center gap-2 text-[14px] font-medium text-ink-2 no-underline hover:text-ink">
          <ArrowLeft className="size-4 flip-rtl" aria-hidden />
          {t('lab.back')}
        </Link>
        <p className="m-0 mt-4 font-mono text-[12px] text-ink-3">{id}</p>
        <h1 className="m-0 mt-1 font-serif text-[44px] font-normal leading-none tracking-[-.03em] text-balance">{title}</h1>
        <p className="m-0 mt-2 text-[15px] text-ink-3">{t('lab.fixtures', { count: items.length })}</p>
        {items.length ? null : <EmptyState className="mt-10" title={t('lab.empty')} />}
        <LabFixtureList>
          {items.map((f, i) => (
            <LabSection key={i} index={i} label={f.name}>
              <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-hair pb-3">
                <Orb />
                <h2 className="m-0 text-[15px] font-semibold">{f.name}</h2>
                <span className="rounded-full bg-paper-2 px-2.5 py-1 font-mono text-[11.5px] text-ink-2">
                  {f.toolName} · {f.part.state}
                </span>
                {f.note ? <p className="m-0 w-full text-[13px] text-ink-3">{f.note}</p> : null}
              </div>
              <LabFixture id={id} index={i} toolName={f.toolName} />
            </LabSection>
          ))}
        </LabFixtureList>
      </main>
    </div>
  );
}
