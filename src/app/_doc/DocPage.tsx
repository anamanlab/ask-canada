import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { pack } from '@/countries/active';
import { Footer } from '@/components/site/Footer';
import { getT } from '@/lib/i18n/server-t';
import { languageAlternates } from '@/lib/i18n/server';
import { dirOf } from '@/lib/i18n/config';
import { hasCatalog } from '@/lib/i18n/catalog';

/**
 * The policy pages. Each one is its own static route (`src/app/<doc>/page.tsx`) rather than a `[doc]` segment,
 * so an unknown `/<anything>` matches no route and gets the server-rendered 404. A `notFound()` thrown from a
 * dynamic page is only painted in the browser (the server sends Next's empty error shell).
 */
export const DOCS = ['about', 'privacy', 'accessibility', 'terms'] as const;
export type Doc = (typeof DOCS)[number];

export async function docMetadata(doc: Doc): Promise<Metadata> {
  const { t } = await getT();
  return { title: t(`doc.${doc}.title`), description: t(`doc.${doc}.lede`), alternates: await languageAlternates(`/${doc}`) };
}

/** Tiny, safe renderer for doc bodies stored in pack messages: `## heading` lines, paragraphs, `- lists`. */
function Body({ text }: { text: string }) {
  return (
    <>
      {text.split(/\n{2,}/).map((block, i) => {
        const lines = block.split('\n');
        const heading = lines[0].startsWith('## ') ? lines.shift()!.slice(3) : null;
        const list = lines.length > 0 && lines.every((l) => l.startsWith('- '));
        return (
          <section key={i}>
            {heading ? <h2 className="m-0 mt-12 font-serif text-[30px] font-normal leading-tight tracking-[-.02em] text-ink">{heading}</h2> : null}
            {list ? (
              <ul className="m-0 mt-4 grid gap-2.5 ps-5 text-[17px] leading-relaxed text-ink-2 marker:text-maple">
                {lines.map((l, j) => (
                  <li key={j}>{l.slice(2)}</li>
                ))}
              </ul>
            ) : lines.length ? (
              <p className="m-0 mt-4 max-w-[68ch] text-[17px] leading-relaxed text-ink-2">{lines.join(' ')}</p>
            ) : null}
          </section>
        );
      })}
    </>
  );
}

export async function DocPage({ doc }: { doc: Doc }) {
  const { t, locale } = await getT();
  const Mark = pack.brand.Mark;
  // Policy pages are published in the official languages only (their terms must stay exact). In any other
  // interface language the page body is English, tagged as such, under a note in the person's language.
  const official = pack.locales.official.includes(locale);
  return (
    <>
      <header className="mx-auto flex max-w-[1240px] items-center justify-between px-5 py-5 sm:px-8">
        <Link href="/" className="ac-brand" aria-label={t('brand.home', { brand: pack.brand.name })}>
          <Mark className="ac-brand__leaf" />
          <span className="ac-brand__name">{pack.brand.name}</span>
        </Link>
        <Link href="/" className="ac-btn-quiet no-underline">
          <ArrowLeft className="size-4 flip-rtl" aria-hidden />
          {t('doc.back')}
        </Link>
      </header>
      {!official ? (
        <p className="mx-auto mt-2 max-w-[820px] px-5 text-[15px] text-ink-2 sm:px-8" lang={hasCatalog(locale) ? locale : 'en'} dir={hasCatalog(locale) ? dirOf(locale) : 'ltr'}>
          <span className="inline-flex items-start gap-2 rounded-[14px] bg-paper-2 px-4 py-3">{t('doc.languageNote')}</span>
        </p>
      ) : null}
      <main id="main" className="mx-auto max-w-[820px] px-5 pb-24 pt-10 sm:px-8 sm:pt-16" lang={official ? undefined : 'en'} dir={official ? undefined : 'ltr'}>
        <p className="eyebrow">{pack.brand.name}</p>
        <h1 className="m-0 font-serif text-[clamp(44px,7vw,72px)] font-normal leading-[1.02] tracking-[-.035em]">{t(`doc.${doc}.title`)}</h1>
        <p className="mt-5 max-w-[46ch] text-[21px] leading-snug text-ink-2">{t(`doc.${doc}.lede`)}</p>
        <div className="mt-6 border-t border-hair pt-2">
          <Body text={t(`doc.${doc}.body`)} />
        </div>
        {pack.brand.contact ? (
          <p className="mt-12 rounded-[18px] bg-paper-2 px-5 py-4 text-[15px] text-ink-2">
            {t('doc.contact', { contact: pack.brand.contact.replace(/^mailto:/, '') })}
          </p>
        ) : null}
      </main>
      <Footer />
    </>
  );
}
