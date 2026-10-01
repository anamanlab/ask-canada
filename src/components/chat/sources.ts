/**
 * Collects the sources behind one assistant message: numbered citations in the text
 * (`[1](https://…)`) in citation order, then `sources` returned by tool outputs, de-duplicated.
 */
import type { UIMessage } from 'ai';
import { pack } from '@/countries/active';
import { hostOf, normUrl } from '@/lib/url';
import type { ToolSource } from '@/lib/widgets/types';
import { proseOf } from './answer-parts';

export type CitedSource = ToolSource & { n: number; official: boolean; host: string };

const isOfficial = (u: string) => {
  const h = hostOf(u);
  return pack.sources.allowlist.some((d) => h === d || h.endsWith(`.${d}`));
};
/** File names that say nothing about the page: its language suffix aside, the title comes from the folder or the site. */
const GENERIC_PAGE = /^(index|default|home|accueil|main|canada|page)$/i;
/** `canada_e.html`, `index-eng.html`, `report.fr.html`: the language marker is not part of the title. */
const LANG_SUFFIX = /[-_.](e|f|en|fr|eng|fra|fre)$/i;

/** A readable title for a cited page that came without one, from its address. */
export function prettyTitle(u: string) {
  try {
    const url = new URL(u);
    const words = url.pathname
      .split('/')
      .filter(Boolean)
      .map((seg) => {
        let name = seg;
        try {
          name = decodeURIComponent(seg);
        } catch {
          /* keep the raw segment */
        }
        return name
          .replace(/\.(html?|aspx?|php|jsp)$/i, '')
          .replace(LANG_SUFFIX, '')
          .replace(/[-_+]+/g, ' ')
          .trim();
      })
      // Language folders (/en/, /fra/) and bare ids name nothing either.
      .filter((name) => name && !GENERIC_PAGE.test(name) && !/^(en|fr|eng|fra)$/i.test(name) && !/^\d+$/.test(name));
    const s = words.pop();
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : hostOf(u);
  } catch {
    return u;
  }
}

/** The answer's text (its prose, without the status line written before the tools ran). */
export const textOfMessage = proseOf;

export function collectSources(m: UIMessage): CitedSource[] {
  const toolSources: ToolSource[] = [];
  for (const p of m.parts) {
    if (p.type.startsWith('tool-') && 'output' in p && p.output && typeof p.output === 'object') {
      const s = (p.output as { sources?: ToolSource[] }).sources;
      if (Array.isArray(s)) toolSources.push(...s.filter((x) => x && typeof x.url === 'string'));
    }
  }
  const meta = new Map(toolSources.map((s) => [normUrl(s.url), s]));
  const out: CitedSource[] = [];
  const seen = new Map<string, CitedSource>();
  // `[1](https://…)` or, with a page title, `[1](https://… "Renew an adult passport")`.
  const re = /\[(\d{1,2})\]\((https?:\/\/[^)\s]+)(?:\s+"([^"]+)")?\)/g;
  for (const match of textOfMessage(m).matchAll(re)) {
    const url = match[2];
    const k = normUrl(url);
    if (seen.has(k)) continue;
    const base = meta.get(k);
    const item: CitedSource = {
      ...(base ?? { title: match[3] ?? prettyTitle(url), url, checked: '' }),
      url,
      n: Number(match[1]),
      official: isOfficial(url),
      host: hostOf(url),
    };
    seen.set(k, item);
    out.push(item);
  }
  // One source of truth: pages behind the widgets are listed too (after the ones the text cites), so the
  // Sources list and a widget's "+N more" footer always agree.
  out.sort((a, b) => a.n - b.n);
  let n = out.reduce((a, s) => Math.max(a, s.n), 0);
  for (const s of toolSources) {
    const k = normUrl(s.url);
    if (seen.has(k)) continue;
    const item = { ...s, n: ++n, official: isOfficial(s.url), host: hostOf(s.url) };
    seen.set(k, item);
    out.push(item);
  }
  return out;
}
