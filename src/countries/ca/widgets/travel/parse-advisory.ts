/**
 * Pure parser for Global Affairs Canada's per-destination advisory feed (no network, no DOM):
 * https://data.international.gc.ca/travel-voyage/cta-cap-<ISO>.json (HTML fragments inside JSON).
 * Server-side only in practice: the renderers import the few helpers they need from select.ts, so none of
 * this ships to the browser. Parsing is defensive: anything unexpected is dropped rather than guessed, and
 * the widget links the official page for the full text.
 */
import { LEVEL_TEXT } from './data';
import type { FeedCountry, FeedOffice } from './feed';
import { decodeEntities, textOf } from './html';
import type { AdvisoryProse, CountryAdvisory, EntryNotice, Lang, LocalEmergency, Office, RegionArea, RegionalAdvisory, RiskLevel } from './types';

/** Official level wording → level 1–4. */
function levelFromText(s: string): RiskLevel {
  const t = s.toLowerCase();
  if (/avoid all travel|(é|e)vite[rz]? tout voyage(?! non)/.test(t)) return 4;
  if (/non-essential|non essentiel/.test(t)) return 3;
  if (/high degree of caution|grande prudence/.test(t)) return 2;
  return 1;
}

/**
 * Items of the lists in a fragment. Nested items become `except` of the item above them, also when the
 * page closes the parent <li> before opening the nested <ul> (a common pattern in the feed).
 */
function listItems(html: string): RegionArea[] {
  const out: RegionArea[] = [];
  let depth = 0;
  let buf = '';
  let target: 'top' | 'sub' | null = null;
  const flush = () => {
    const text = textOf(buf).replace(/:$/, '').trim();
    buf = '';
    if (!text || !target) return;
    if (target === 'top') out.push({ text });
    else {
      const parent = out[out.length - 1];
      if (parent) (parent.except ??= []).push(text);
      else out.push({ text });
    }
  };
  for (const m of html.matchAll(/<(\/?)(ul|ol|li)\b[^>]*>|([^<]+)|<[^>]*>/gi)) {
    const [, close, tag, text] = m;
    if (text !== undefined) {
      if (target) buf += text;
      continue;
    }
    if (!tag) {
      if (target && /^<br/i.test(m[0])) buf += ' ';
      continue;
    }
    const t = tag.toLowerCase();
    if (t === 'ul' || t === 'ol') {
      flush();
      depth += close ? -1 : 1;
      target = null;
    } else if (!close) {
      flush();
      target = depth <= 1 ? 'top' : 'sub';
    } else {
      flush();
      target = null;
    }
  }
  flush();
  return out.filter((a) => a.text.length > 1);
}

/* ---------- Advisory feed ---------- */

export const destinationUrl = (lang: Lang, slug: string) =>
  lang === 'fr' ? `https://voyage.gc.ca/destinations/${slug}` : `https://travel.gc.ca/destinations/${slug}`;

/** Paragraphs and list items of a fragment as plain text (link-only lines and stray dots dropped). */
function blocks(html: string): string[] {
  return html
    .split(/<\/?(?:p|li|ul|ol|div|h\d)\b[^>]*>|<br\s*\/?>/i)
    .filter((chunk) => !/^\s*<a\b[^>]*>[\s\S]*<\/a>\s*$/i.test(chunk))
    .map(textOf)
    .filter((t) => t.replace(/[.\s]/g, '').length > 1);
}

const SMALL = new Set(['and', 'of', 'the', 'with', 'et', 'de', 'la', 'le', 'du', 'des', 'avec']);
/** "PALESTINE - AVOID ALL TRAVEL" headings come in capitals: "Palestine". */
const unshout = (s: string) =>
  s === s.toUpperCase() && /[A-Z]/.test(s)
    ? s
        .toLowerCase()
        .split(' ')
        .map((w, i) => (i > 0 && SMALL.has(w) ? w : w.charAt(0).toUpperCase() + w.slice(1)))
        .join(' ')
    : s;

function parseRegions(html: string, lang: Lang): { summary: string; points: string[]; regions: RegionalAdvisory[] } {
  const chunks = html.split(/<div class="AdvisoryContainer\s*/i).slice(1);
  let summary = '';
  let points: string[] = [];
  const regions: RegionalAdvisory[] = [];
  let national = true;
  for (const chunk of chunks) {
    const cls = chunk.match(/^([A-Za-z]+)/)?.[1] ?? '';
    const h3 = textOf(chunk.match(/<h3[^>]*>([\s\S]*?)<\/h3>/i)?.[1] ?? '');
    const body = chunk.replace(/^[\s\S]*?<\/h3>/i, '');
    const beforeList = body.split(/<(?:ul|ol)\b/i)[0];
    const paras = blocks(body);
    if (national && !/regional/i.test(cls)) {
      // The first container is the national advisory: its first paragraph is the summary, the rest are key points.
      national = false;
      summary = paras[0] ?? '';
      points = paras.slice(1, 9).map((x) => (/[\p{L}\d)]$/u.test(x) ? `${x}.` : x));
      continue;
    }
    national = false;
    const reason = (blocks(beforeList)[0] ?? paras[0] ?? '').replace(/\s*:\s*$/, '').trim();
    // "Region name - Avoid non-essential travel" (the level is the last " - " part).
    const dash = h3.lastIndexOf(' - ');
    const head = unshout(dash > 0 ? h3.slice(0, dash).trim() : h3);
    const headLevel = dash > 0 ? h3.slice(dash + 3).trim() : '';
    // "Regional Advisory" / « Avertissement régional » says nothing: the renderer builds a short title instead.
    const title = /^(regional advisory|avertissement r(é|e)gional|avertissements r(é|e)gionaux)$/i.test(head) ? '' : head;
    const level = levelFromText(headLevel || reason);
    // Official wording for the level, never the feed's own (see data.ts).
    regions.push({ title, level, levelText: LEVEL_TEXT[lang][level], reason: reason.replace(/[\s.;:]+$/, ''), areas: listItems(body) });
  }
  // Most serious first.
  regions.sort((a, b) => b.level - a.level);
  return { summary, points, regions };
}

/**
 * The lead paragraphs every destination carries (who decides entry, where the information comes from, who to
 * verify it with). They are context, not news, so they never show as a notice.
 */
const ENTRY_PREAMBLE =
  /^(the authorities of a country|every country or territory decides|individual border agents|we have obtained|verify this information|les autorités d.un pays|ce sont les autorités d.un pays|les agents frontaliers|nous avons obtenu|l.information contenue dans cette page|vérifiez cette information|confirmez ces renseignements)/i;
/** Paragraphs kept per notice; the card links the full section for the rest. */
const NOTICE_PARAS = 2;

/**
 * Notices above the passport rules in the entry/exit section: a lead paragraph that isn't the standing
 * preamble (in 2026, entry restrictions over the Ebola outbreak) and the page's own alert boxes (ETIAS for
 * the Schengen area, exit screening). Word for word; at most two.
 */
function parseEntryNotices(html: string): EntryNotice[] {
  const head = html.split(/<h3>\s*(?:Passport|Passeport)\s*<\/h3>/i)[0];
  const notice = (paras: string[], title?: string, cut = false): EntryNotice | null =>
    paras.length ? { ...(title ? { title } : {}), body: paras.slice(0, NOTICE_PARAS), ...(cut || paras.length > NOTICE_PARAS ? { more: true } : {}) } : null;
  const alert = /<section class="alert[^"]*">([\s\S]*?)<\/section>/gi;
  const boxes = [...head.matchAll(alert)].map((m) => {
    const title = textOf(m[1].match(/<h3[^>]*>([\s\S]*?)<\/h3>/i)?.[1] ?? '');
    // The box's own sub-sections (h4) are detail for the official page.
    const [intro, ...rest] = m[1].replace(/^[\s\S]*?<\/h3>/i, '').split(/<h4\b/i);
    return notice(blocks(intro), title || undefined, rest.length > 0);
  });
  const lead = notice(blocks(head.replace(alert, '').split(/<h3\b/i)[0]).filter((p) => !ENTRY_PREAMBLE.test(p)));
  return [lead, ...boxes].filter((n): n is EntryNotice => !!n).slice(0, 2);
}

function parseEntry(html: string): CountryAdvisory['entry'] {
  const notices = parseEntryNotices(html);
  const pass = html.match(/<h4>\s*(?:Regular Canadian passport|Passeport canadien r(?:é|&eacute;)gulier)\s*<\/h4>\s*<p>([\s\S]*?)<\/p>/i)?.[1];
  const visaP = html.match(/<h3>\s*Visas?\s*<\/h3>\s*<p>([\s\S]*?)<\/p>/i)?.[1];
  const visas: { label: string; value: string }[] = [];
  if (visaP) {
    for (const line of visaP.split(/<br\s*\/?>/i)) {
      const t = textOf(line);
      const i = t.indexOf(':');
      if (i > 0 && i < 60) visas.push({ label: t.slice(0, i).trim(), value: t.slice(i + 1).trim().replace(/\*$/, '').trim() });
    }
  }
  return { passport: pass ? textOf(pass) : undefined, visas: visas.filter((v) => v.value).slice(0, 8), ...(notices.length ? { notices } : {}) };
}

function parseEmergency(html: string): LocalEmergency {
  const block = html.match(/(?:Emergency services|Services d(?:’|'|&rsquo;)urgence)\s*<\/summary>\s*<div[^>]*>([\s\S]*?)<\/div>\s*<\/details>/i)?.[1] ?? '';
  if (!block) return { numbers: [] };
  // Only the list that follows the lead sentence (later lists are tourist-police or roadside extras).
  const main = block.split(/<h4\b/i)[0];
  const firstList = main.match(/<ul\b[^>]*>([\s\S]*?)<\/ul>/i);
  const leadHtml = firstList ? main.slice(0, firstList.index) : (main.match(/<p>([\s\S]*?)<\/p>/i)?.[1] ?? main);
  const lead = textOf(leadHtml.replace(/<h4[\s\S]*$/i, '')) || undefined;
  const numbers = firstList
    ? listItems(firstList[0])
        .map(({ text }) => {
          const i = text.lastIndexOf(':');
          // The French feed ends items with list punctuation (« police : 191; », « pompiers : 199. »).
          if (i > 0) return { label: text.slice(0, i).trim(), number: text.slice(i + 1).trim().replace(/[\s;,.]+$/, '') };
          // "112 for emergency assistance" / « 112 pour les urgences »
          const m = text.match(/^([\d][\d\s/-]*\d|\d+)\s+(?:for|pour)\s+(.+)$/i);
          return m ? { label: m[2].replace(/^(les?|la|l’|l')\s*/i, '').trim(), number: m[1].trim() } : null;
        })
        .filter((x): x is { label: string; number: string } => !!x && /\d/.test(x.number) && x.number.length <= 60)
        .slice(0, 6)
    : [];
  const primary = lead?.match(/(?:dial|composez(?: le)?)\s+((?:\d{2,4})(?:\s+(?:or|ou)\s+\d{2,4})?)/i)?.[1];
  return { primary, lead, numbers };
}

const OFFICE_RANK = (type: string) =>
  /embass|ambassade|high commission|haut-commissariat/i.test(type) ? 0 : /consulate|consulat/i.test(type) ? 1 : /agency|agence/i.test(type) ? 2 : 3;

function parseOffices(list: FeedOffice[] | null | undefined): Office[] {
  return (list ?? [])
    .map((o) => {
      const lat = Number(o.lat ?? NaN);
      const lng = Number(o.lng ?? NaN);
      const valid = Number.isFinite(lat) && Number.isFinite(lng) && !(lat === 0 && lng === 0);
      return {
        city: decodeEntities(o.city ?? '').trim(),
        type: decodeEntities(o.type ?? '').trim(),
        phone: o['tel-legacy']?.trim() || undefined,
        email: o['email-1']?.trim() || undefined,
        address: o.address ? textOf(o.address) : undefined,
        lat: valid ? lat : undefined,
        lng: valid ? lng : undefined,
        url: o.internet?.trim().startsWith('https://') ? o.internet.trim() : undefined,
        passportServices: Number(o['has-passport-services']) === 1,
      } satisfies Office;
    })
    .filter((o) => o.city)
    .sort((a, b) => OFFICE_RANK(a.type) - OFFICE_RANK(b.type))
    .slice(0, 16);
}

const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
const ZONES: Record<string, string> = { EDT: '-04:00', EST: '-05:00', UTC: '+00:00', GMT: '+00:00' };

/**
 * Last update as ISO with offset. The per-destination feed carries only a "friendly" English date
 * ("September 29, 2026 14:42 EDT"); the index feed has `date-published.asp`.
 */
function isoOf(pub: FeedCountry['date-published'], friendly?: string | null): string {
  const asp = pub?.asp?.replace(/\.\d+(?=[+-]\d\d:\d\d$)/, '');
  if (asp && !Number.isNaN(Date.parse(asp))) return asp;
  const m = friendly?.match(/^([A-Za-z]+)\s+(\d{1,2}),\s*(\d{4})\s+(\d{1,2}):(\d{2})\s*([A-Z]{3})?/);
  if (m) {
    const mo = MONTHS.indexOf(m[1].toLowerCase()) + 1;
    if (mo > 0) {
      const p = (n: string | number) => String(n).padStart(2, '0');
      return `${m[3]}-${p(mo)}-${p(m[2])}T${p(m[4])}:${m[5]}:00${ZONES[m[6] ?? 'EDT'] ?? '-04:00'}`;
    }
  }
  return (pub?.date ?? '').replace(' ', 'T');
}

/** The feed's prose in one language (summary, key points, regions, entry rules, local help). */
function parseProse(feed: FeedCountry, lang: Lang): AdvisoryProse {
  const L = (lang === 'fr' ? feed.fra : null) ?? feed.eng;
  const { summary, points, regions } = parseRegions(L.advisories ?? '', lang);
  const offHtml = L['offices-html'] ?? '';
  const tollFree = textOf(offHtml).match(/(?:toll-free at|sans frais au)\s*([+\d][\d\-\s()]*\d)/i)?.[1]?.trim();
  return {
    summary,
    points,
    regions,
    change: L['recent-updates'] ? textOf(L['recent-updates']) || undefined : undefined,
    entry: parseEntry(L['entry-exit'] ?? ''),
    help: { emergency: parseEmergency(offHtml), tollFree, offices: parseOffices(L.offices) },
  };
}

/**
 * One destination in `lang`, with the same prose in the other official language when the feed has it
 * (`prose`), so the card can follow the UI's language without a second request.
 */
export function parseCountry(feed: FeedCountry, lang: Lang): CountryAdvisory {
  const L = (lang === 'fr' ? feed.fra : null) ?? feed.eng;
  const state = Math.max(0, Math.min(3, Math.round(feed['advisory-state'] ?? 0)));
  const other: Lang = lang === 'fr' ? 'en' : 'fr';
  const O = other === 'fr' ? feed.fra : feed.eng;
  const alt = O?.advisories ? parseProse(feed, other) : null;
  return {
    iso: feed['country-iso'],
    name: textOf(L.name ?? feed['country-iso']),
    level: (state + 1) as RiskLevel,
    // The feed's `advisory-text` is stale ("Exercise normal security precautions", French infinitives):
    // the official wording comes from the level. "(with regional advisories)" is shown as its own section.
    levelText: LEVEL_TEXT[lang][(state + 1) as RiskLevel],
    ...parseProse(feed, lang),
    updated: isoOf(feed['date-published'], feed.eng['friendly-date']),
    url: destinationUrl(lang, L['url-slug'] ?? ''),
    ...(alt ? { prose: { [other]: alt } } : {}),
  };
}

/** Only the local-help part of the other language's prose (numbers' labels, offices), for travelEmergencyHelp. */
export function helpProse(c: Pick<CountryAdvisory, 'prose'>): Partial<Record<Lang, CountryAdvisory['help']>> | undefined {
  const out: Partial<Record<Lang, CountryAdvisory['help']>> = {};
  for (const k of ['en', 'fr'] as const) {
    const p = c.prose?.[k];
    if (p) out[k] = p.help;
  }
  return Object.keys(out).length ? out : undefined;
}
