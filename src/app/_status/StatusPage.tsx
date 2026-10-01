import type { ReactNode } from 'react';
import { Mark } from '@/countries/active.mark';

/** The primary action of a status page (a link or a button). */
export const statusAction =
  'inline-flex min-h-12 cursor-pointer items-center gap-2 rounded-full border-0 bg-ink px-6 font-medium text-paper no-underline shadow-md';
/** A quieter second action next to the primary one. */
export const statusActionQuiet =
  'inline-flex min-h-12 cursor-pointer items-center gap-2 rounded-full border border-hair bg-card px-6 font-medium text-ink no-underline';

/**
 * The calm, branded shell shared by the 404 and error pages: the mark, an optional status code, a serif
 * title, one line of help and the way back. Plain markup, so Server and Client Components can both use it.
 */
export function StatusPage({ code, title, body, children }: { code?: string; title: ReactNode; body?: ReactNode; children: ReactNode }) {
  return (
    <main id="main" className="mx-auto flex min-h-[100svh] max-w-[720px] flex-col items-center justify-center px-6 text-center">
      <Mark className="size-12 text-maple" />
      {code ? <p className="mt-8 font-mono text-[13px] tracking-[.14em] text-ink-3">{code}</p> : null}
      <h1 className={`m-0 ${code ? 'mt-3' : 'mt-8'} font-serif text-[clamp(36px,6vw,56px)] font-normal leading-[1.05] tracking-[-.03em]`}>{title}</h1>
      {body ? <p className="mt-4 max-w-[40ch] text-[18px] text-ink-2">{body}</p> : null}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">{children}</div>
    </main>
  );
}
