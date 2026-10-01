/**
 * Pure transforms for weather alerts (isomorphic, no network): one `weather-alerts` feature → Alert, the
 * alerts for a place, the Canada-wide / province grouping, and the city page's own warnings list (the
 * fallback when the alerts collection is unreachable). Input types come from schemas.ts.
 */
import type { AlertColour, Lang } from './data';
import { L, str, typo, words } from './model';
import type { RawAlert, RawCity } from './schemas';
import { provinceTz } from './alert-view';
import type { Alert, AlertGroup, AlertType } from './types';

const TYPES: readonly AlertType[] = ['warning', 'watch', 'advisory', 'statement'];
const typeOf = (v: string): AlertType => TYPES.find((t) => t === v) ?? 'other';
const colourOf = (v: unknown): AlertColour | null => (v === 'yellow' || v === 'orange' || v === 'red' ? v : null);
const INACTIVE = new Set(['ended', 'cancelled', 'expired']);
const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

/** One feature of `weather-alerts` → Alert (null when it has ended). */
function parseAlertFeature(f: RawAlert, lang: Lang, now = new Date(), url = ''): Alert | null {
  const p = f.properties;
  const fr = lang === 'fr';
  if (INACTIVE.has((p.status_en ?? '').toLowerCase())) return null;
  if (p.expiration_datetime && new Date(p.expiration_datetime) < now) return null;
  const short = typo((fr ? p.alert_short_name_fr : p.alert_short_name_en) ?? '');
  const name = typo((fr ? p.alert_name_fr : p.alert_name_en) ?? '') || short;
  const hazard = cap(short.replace(/\s*\(.*\)\s*$/, '').trim() || name);
  const text = ((fr ? p.alert_text_fr : p.alert_text_en) ?? '')
    .split(/\n\s*\n/)
    .map((s) => typo(s.replace(/\s+/g, ' ').trim()))
    .filter(Boolean);
  return {
    id: `${p.feature_id ?? f.id ?? `${p.alert_code}-${p.feature_name_en}`}:${p.alert_code ?? ''}`,
    colour: colourOf(p.risk_colour_en),
    type: typeOf(p.alert_type ?? ''),
    hazard,
    name: cap(name),
    issuedAt: p.publication_datetime ?? undefined,
    endsAt: p.event_end_datetime ?? undefined,
    area: typo((fr ? p.feature_name_fr : p.feature_name_en) ?? ''),
    province: p.province ?? undefined,
    impact: typo((fr ? p.impact_fr : p.impact_en) ?? '') || undefined,
    confidence: typo((fr ? p.confidence_fr : p.confidence_en) ?? '') || undefined,
    text,
    url,
    airQuality: /air quality|qualit[ée] de l.air|smoke|fum[ée]e/i.test(`${p.alert_name_en} ${p.alert_short_name_en}`),
  };
}

const RANK: Record<AlertColour, number> = { red: 0, orange: 1, yellow: 2 };
const TYPE_RANK: Record<AlertType, number> = { warning: 0, watch: 1, advisory: 2, statement: 3, other: 4 };
type Ranked = { colour: AlertColour | null; type: AlertType };
const rank = (c: AlertColour | null) => (c ? RANK[c] : 3);
const alertOrder = (a: Ranked, b: Ranked) => rank(a.colour) - rank(b.colour) || TYPE_RANK[a.type] - TYPE_RANK[b.type];

/** Alerts for one place: drop duplicates (overlapping polygons) and sort by severity. */
export function placeAlerts(features: RawAlert[], lang: Lang, now = new Date(), url = ''): Alert[] {
  const seen = new Map<string, Alert>();
  for (const f of features) {
    const a = parseAlertFeature(f, lang, now, url);
    if (!a) continue;
    const key = `${f.properties.alert_code}:${a.colour}:${a.type}`;
    if (!seen.has(key)) seen.set(key, a);
  }
  return [...seen.values()].sort(alertOrder);
}

/**
 * Alerts across Canada / a province, grouped by hazard + colour, with the areas they cover.
 * Counts are of distinct areas: an area under two alerts counts once, at its most serious colour, so the
 * colour chips add up to the total. Special weather statements are "for information only, not an alert",
 * so they are counted apart.
 */
export function groupAlerts(features: RawAlert[], lang: Lang, now = new Date(), province?: string) {
  const groups = new Map<string, AlertGroup>();
  const worst = new Map<string, AlertColour>();
  const statementAreas = new Set<string>();
  for (const f of features) {
    const p = f.properties;
    // An area that straddles a boundary is filed under both provinces ("SK/AB").
    const provs = (p.province ?? '').toLowerCase().split('/').filter(Boolean);
    const prov = provs[0] ?? '';
    if (province && !provs.includes(province)) continue;
    const a = parseAlertFeature(f, lang, now);
    if (!a) continue;
    const areaKey = `${prov}:${p.feature_name_en ?? p.feature_id ?? a.area}`;
    if (a.colour && a.type !== 'statement' && a.type !== 'other') {
      const had = worst.get(areaKey);
      if (!had || RANK[a.colour] < RANK[had]) worst.set(areaKey, a.colour);
    } else {
      statementAreas.add(areaKey);
    }
    const key = `${p.alert_code}:${a.colour}:${a.type}`;
    const g = groups.get(key) ?? { key, colour: a.colour, type: a.type, hazard: a.hazard, name: a.name, areas: [], provinces: [], airQuality: a.airQuality, tz: provinceTz(prov) };
    // One record per area (overlapping polygons of the same alert repeat an area: keep its latest end).
    const area = g.areas.find((x) => x.name === a.area && x.provinces[0] === prov);
    if (area) {
      if (a.endsAt && (!area.endsAt || a.endsAt > area.endsAt)) area.endsAt = a.endsAt;
    } else if (a.area) {
      g.areas.push({ name: a.area, provinces: provs, ...(a.endsAt ? { endsAt: a.endsAt } : {}) });
    }
    for (const code of provs) if (!g.provinces.includes(code)) g.provinces.push(code);
    groups.set(key, g);
  }
  const list = [...groups.values()].sort((a, b) => alertOrder(a, b) || b.areas.length - a.areas.length);
  for (const g of list) {
    g.areas.sort((a, b) => a.name.localeCompare(b.name, lang === 'fr' ? 'fr-CA' : 'en-CA'));
    g.provinces.sort();
  }
  const counts: Record<AlertColour, number> = { red: 0, orange: 0, yellow: 0 };
  for (const c of worst.values()) counts[c]++;
  return { groups: list, counts, total: worst.size, statements: statementAreas.size };
}

/** City-page `warnings` (fallback when the alerts collection is unreachable). */
export function cityPageAlerts(p: RawCity, lang: Lang): Alert[] {
  return (p.warnings ?? [])
    .map((w, i): Alert => {
      const desc = words(w.description, lang);
      const [head, hazard = ''] = desc.split(/\s+-\s+/);
      return {
        id: `cp-${i}-${desc}`,
        colour: colourOf(L(w.alertColourLevel, 'en')),
        type: typeOf(str(w.type, 'en').toLowerCase()),
        hazard: cap(hazard.toLowerCase()) || cap(head.toLowerCase()),
        name: cap(desc.toLowerCase()),
        issuedAt: str(w.eventIssue, lang) || undefined,
        area: words(p.region, lang),
        text: [],
        url: str(w.url, lang),
        airQuality: /air quality|qualit[ée] de l.air/i.test(desc),
      };
    })
    .sort(alertOrder);
}

/** The official alert report link for a place (from the city page's own warnings list), if any. */
export const cityPageAlertUrl = (p: RawCity, lang: Lang): string | undefined => {
  const u = L(p.warnings?.[0]?.url, lang);
  return typeof u === 'string' ? u.replace(/#.*$/, '') : undefined;
};
