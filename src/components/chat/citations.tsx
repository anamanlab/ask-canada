'use client';
/**
 * The numbered sources of one answer, for its citation chips: `CitationsProvider` wraps the answer, and a
 * chip looks up the title and host of the page it points at (`useCitations()`, keyed by normalized URL).
 * Kept apart from `Markdown` so the answer's shell doesn't pull in the markdown renderer.
 */
import { createContext, use, useMemo, type ReactNode } from 'react';
import { normUrl } from '@/lib/url';

export type CiteInfo = { n: number; title: string; host: string };

const CitationsContext = createContext<Map<string, CiteInfo> | null>(null);

export function CitationsProvider({ sources, children }: { sources: { url: string; n: number; title: string; host: string }[]; children: ReactNode }) {
  const map = useMemo(() => new Map(sources.map((s) => [normUrl(s.url), { n: s.n, title: s.title, host: s.host }])), [sources]);
  return <CitationsContext value={map}>{children}</CitationsContext>;
}

/** The sources of the answer being rendered, or `null` outside an answer. */
export function useCitations(): Map<string, CiteInfo> | null {
  return use(CitationsContext);
}
