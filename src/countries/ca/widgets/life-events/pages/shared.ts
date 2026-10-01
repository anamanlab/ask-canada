/** Life events, official pages: the record shape and the URL helpers the per-event tables share. */
export type Bi = { en: string; fr: string };
export type Page = { url: Bi; title: Bi; updated: string; quote?: Bi };

/** The day every page in pages/*.ts was fetched and checked. */
export const CHECKED = '2026-09-30';

export const CA = 'https://www.canada.ca';
export const cra = (en: string, fr: string): Bi => ({ en: `${CA}/en/revenue-agency/${en}`, fr: `${CA}/fr/agence-revenu/${fr}` });
