/**
 * Pure builders for every tool output of the `parks` widget. The tools (live.ts) do the network work and
 * call these; the lab fixtures call them with recorded data. Isomorphic, no network.
 */
import { campgroundName } from './campground-names';
import {
  DISCOVERY,
  FAMILY_MAX,
  RESERVATION,
  STRONG_PASS,
  TIERS,
  PARKS,
  hasReservations,
  type Landscape,
  type Lang,
  type Park,
  type Province,
  type Tier,
} from './data';
import {
  distanceKm,
  matchPark,
  type Bulletin,
  type CampingOutput,
  type ConditionsOutput,
  type FinderOutput,
  type FireStatus,
  type NationalRow,
  type Origin,
} from './model';
import { clampDays, normalizeParty, passCalc, type Party, type PassesOutput } from './pass-model';
import { campingParks, lite, rankParks } from './rank';
import { sources } from './sources';

export function parkConditionsOutput(a: {
  park: Park;
  lang: Lang;
  fetchedAt: string;
  fire: FireStatus | null;
  fireLive: boolean;
  bulletins: Bulletin[];
  bulletinsLive: boolean;
  bulletinsUrl: string;
}): ConditionsOutput {
  const { park, lang } = a;
  return {
    version: 1,
    lang,
    scope: 'park',
    fetchedAt: a.fetchedAt,
    park: lite(park, lang),
    fire: a.fire,
    fireLive: a.fireLive,
    bulletins: a.bulletins.slice(0, 6),
    bulletinsTotal: a.bulletins.length,
    bulletinsLive: a.bulletinsLive,
    bulletinsUrl: a.bulletinsUrl,
    fireBan: a.bulletins.find((b) => b.kind === 'fireBan') ?? null,
    national: null,
    sources: [
      sources.bulletins(lang, a.bulletinsUrl, a.bulletinsLive),
      sources.fireDanger(lang, a.fireLive),
      sources.fireMap(lang, a.fireLive),
      sources.rules(lang),
      sources.wildlife(lang),
      sources.emergency(lang),
    ],
  };
}

export function nationalConditionsOutput(a: { lang: Lang; fetchedAt: string; rows: NationalRow[]; live: boolean; unknown?: string }): ConditionsOutput {
  const { lang, live } = a;
  return {
    version: 1,
    lang,
    scope: 'national',
    fetchedAt: a.fetchedAt,
    park: null,
    fire: null,
    fireLive: live,
    bulletins: [],
    bulletinsTotal: 0,
    bulletinsLive: false,
    bulletinsUrl: sources.bulletins(lang).url,
    fireBan: null,
    national: a.rows,
    ...(a.unknown ? { unknown: a.unknown.slice(0, 80) } : {}),
    sources: [sources.fireDanger(lang, live), sources.fireMap(lang, live), sources.bulletins(lang), sources.rules(lang)],
  };
}

export function finderOutput(a: {
  lang: Lang;
  matched: Park | null;
  filters: { province?: Province; landscape?: Landscape; camping?: boolean };
  origin: Origin | null;
  originUnknown?: string;
  unknown?: string;
  conditions: ConditionsOutput | null;
}): FinderOutput {
  const { lang, matched, origin } = a;
  const all = rankParks(a.filters, origin, lang);
  const results = matched ? [lite(matched, lang, origin ? distanceKm(origin, matched) : undefined), ...all.filter((p) => p.id !== matched.id)] : all;
  // With a named park and no place, "nearby" means near that park.
  const from = origin ?? (matched ? { label: matched.short[lang], lat: matched.lat, lng: matched.lng } : null);
  return {
    version: 1,
    lang,
    filters: a.filters,
    origin,
    ...(a.originUnknown ? { originUnknown: a.originUnknown.slice(0, 80) } : {}),
    matchedId: matched?.id ?? null,
    ...(a.unknown ? { unknown: a.unknown.slice(0, 80) } : {}),
    results: results.slice(0, 12),
    total: results.length,
    order: rankParks({}, from, lang).map((p) => ({ id: p.id, ...(p.km != null ? { km: p.km } : {}) })),
    conditions: a.conditions,
    sources: [
      ...(matched ? [sources.parkHome(matched, lang), ...sources.parkFees(matched, lang)] : [sources.parksSearch(lang)]),
      sources.admission(lang),
      sources.reserve(lang),
      ...(a.conditions ? a.conditions.sources.slice(0, 2) : []),
      sources.wildlife(lang),
      sources.rules(lang),
      sources.emergency(lang),
    ],
  };
}

/** Without a park named, the fee source is a tier-1 park's fees page (Banff, the first entry). */
const TIER_ONE_PARK = PARKS[0];

export const tierFor = (p: Park | null | undefined): Tier => (p?.admission.kind === 'daily' ? p.admission.tier : 1);

export type PassesInput = { park?: string; adults?: number; seniors?: number; youth?: number; days?: number; family?: boolean; lang: Lang };

export function passesOutput(input: PassesInput): PassesOutput {
  const { lang } = input;
  const park = matchPark(input.park);
  const tier = tierFor(park);
  // "My family" with no head counts: start from two adults and two youth, so the card and the answer agree.
  const counted = [input.adults, input.seniors, input.youth].some((n) => n != null);
  const party: Party = normalizeParty(input.family && !counted ? { adults: 2, youth: 2 } : { adults: input.adults, seniors: input.seniors, youth: input.youth });
  const days = clampDays(input.days);
  return {
    version: 1,
    lang,
    party,
    days,
    tier,
    park: park ? lite(park, lang) : null,
    tiers: TIERS,
    discovery: DISCOVERY,
    calc: passCalc(party, days, tier),
    strongPass: STRONG_PASS,
    familyMax: FAMILY_MAX,
    ...(input.family ? { family: true } : {}),
    sources: [sources.admission(lang), ...sources.parkFees(park?.admission.kind === 'daily' ? park : TIER_ONE_PARK, lang), sources.youth(lang)],
  };
}

export function campingOutput(a: { lang: Lang; today: string; park: Park | null; origin: Origin | null; unknown?: string }): CampingOutput {
  const { lang, park: p } = a;
  const park = p
    ? {
        ...lite(p, lang),
        campgrounds: (p.campgrounds ?? []).map((c) => campgroundName(c, lang)),
        ...(p.firstCome ? { firstCome: p.firstCome.map((c) => campgroundName(c, lang)) } : {}),
        backcountry: !!p.backcountry,
        launch2026: p.launch2026 ?? null,
        ...(p.launchEarly ? { launchEarly: { date: p.launchEarly.date, what: p.launchEarly.what[lang] } } : {}),
      }
    : null;
  return {
    version: 1,
    lang,
    today: a.today,
    park,
    // A park with nothing to reserve: its nearest parks that have some (with distances), like "near a place".
    options: p && hasReservations(p) ? [] : campingParks(lang, p ? { label: p.short[lang], lat: p.lat, lng: p.lng } : a.origin).slice(0, 12),
    ...(a.unknown ? { unknown: a.unknown.slice(0, 80) } : {}),
    reservation: RESERVATION,
    sources: [sources.reserve(lang), sources.howToReserve(lang), ...(p ? sources.parkFees(p, lang) : []), sources.rules(lang)],
  };
}
