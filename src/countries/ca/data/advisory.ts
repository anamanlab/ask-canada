/**
 * Live travel advisory from Global Affairs Canada open data (travel.gc.ca), cached 30 minutes.
 * https://data.international.gc.ca/travel-voyage/index-alpha-eng.json
 */
import 'server-only';
import type { Advisory } from '@/lib/country/types';

/** Live travel advisory from Global Affairs Canada open data (travel.gc.ca). */
export async function getAdvisory(iso = 'MX'): Promise<Advisory | null> {
  try {
    const res = await fetch('https://data.international.gc.ca/travel-voyage/index-alpha-eng.json', {
      next: { revalidate: 1800 },
      signal: AbortSignal.timeout(3500),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { data: Record<string, Record<string, unknown>> };
    const c = json.data?.[iso] as
      | {
          'advisory-state': number;
          'date-published': { date: string };
          eng: { name: string; 'url-slug': string; 'advisory-text': string };
          fra: { name: string; 'url-slug': string; 'advisory-text': string };
        }
      | undefined;
    if (!c) return null;
    return {
      country: { en: c.eng.name, fr: c.fra.name },
      level: Math.max(0, Math.min(3, c['advisory-state'])) as Advisory['level'],
      text: { en: c.eng['advisory-text'], fr: c.fra['advisory-text'] },
      updated: c['date-published'].date.slice(0, 10),
      url: {
        en: `https://travel.gc.ca/destinations/${c.eng['url-slug']}`,
        fr: `https://voyage.gc.ca/destinations/${c.fra['url-slug']}`,
      },
    };
  } catch {
    return null;
  }
}


type AdvisoryIndex = Record<
  string,
  {
    'advisory-state': number;
    'date-published': { date: string };
    eng: { name: string; 'url-slug': string; 'advisory-text': string };
    fra: { name: string; 'url-slug': string; 'advisory-text': string };
  }
>;

const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/**
 * Finds the destination named in a question ("Is it safe to travel to Portugal?", « Est-ce sécuritaire
 * d’aller au Mexique? ») and returns its live advisory, or null when no country is named or the feed is down.
 */
export async function findAdvisory(text: string): Promise<Advisory | null> {
  try {
    const res = await fetch('https://data.international.gc.ca/travel-voyage/index-alpha-eng.json', {
      next: { revalidate: 1800 },
      signal: AbortSignal.timeout(3500),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { data: AdvisoryIndex };
    const q = ` ${fold(text).replace(/[^a-z0-9]+/g, ' ')} `;
    let best: { iso: string; len: number } | null = null;
    for (const [iso, c] of Object.entries(json.data ?? {})) {
      for (const name of [c.eng?.name, c.fra?.name]) {
        if (!name) continue;
        const n = fold(name).replace(/\(.*?\)/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
        if (n.length > 2 && q.includes(` ${n} `) && (!best || n.length > best.len)) best = { iso, len: n.length };
      }
    }
    return best ? getAdvisory(best.iso) : null;
  } catch {
    return null;
  }
}
