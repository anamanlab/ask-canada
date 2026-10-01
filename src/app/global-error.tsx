'use client';
/**
 * Last-resort error page, shown when the root layout itself fails. It replaces the whole document, so the
 * i18n provider, the request's language and theme are all out of reach: like a Government of Canada splash
 * page, it speaks both official languages side by side. The strings mirror the catalogs' `error.generic`,
 * `chat.retry` and `notFound.home` (this component is part of every page's bundle, so the catalogs and the
 * router's link component stay out: the way home is a plain link and a full page load).
 */
import { useEffect } from 'react';
import { fontFaceVars, fontVariables } from './fonts';
import { StatusPage, statusAction, statusActionQuiet } from './_status/StatusPage';
import './globals.css';

const en = { title: 'Something went wrong on our side.', retry: 'Try again', home: 'Go to the home page' };
const fr = { title: 'Un problème est survenu de notre côté.', retry: 'Réessayer', home: 'Aller à la page d’accueil' };

export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <html lang="en" className={fontVariables} style={fontFaceVars}>
      <body>
        <title>{`${en.title} · ${fr.title}`}</title>
        <StatusPage
          title={
            <>
              {en.title} <span lang="fr" className="mt-3 block text-ink-2">{fr.title}</span>
            </>
          }
        >
          <button type="button" onClick={retry} className={statusAction}>
            <span>
              {en.retry} · <span lang="fr">{fr.retry}</span>
            </span>
          </button>
          <a href="/" className={`${statusActionQuiet} py-2 text-center`}>
            <span>
              {en.home} · <span lang="fr">{fr.home}</span>
            </span>
          </a>
        </StatusPage>
      </body>
    </html>
  );
}
