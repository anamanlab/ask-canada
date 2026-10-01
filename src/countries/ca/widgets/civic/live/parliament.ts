/**
 * civicParliament builder (SERVER ONLY): live seat counts (House of Commons) and every bill of the current
 * session with its stage dates (LEGISinfo JSON). Without LEGISinfo the explainer still renders, with a link.
 */
import 'server-only';
import { z } from 'zod';
import { CHECKED, HOUSE, SENATE, SOURCES, livePage, torontoToday, type Lang } from '../data';
import { normalizeBillCode, summarizeBill, type RawBill } from '../build/bills';
import { matchesTopic, topicTerms } from '../build/text';
import type { BillSummary, ParliamentOutput } from '../types';
import { houseSeats, seatCounts } from './house';
import { getJson } from './http';

const text = z.string().nullish();
const Bills = z.array(
  z.object({
    NumberCode: z.string(),
    LongTitleEn: text,
    LongTitleFr: text,
    ShortTitleEn: text,
    ShortTitleFr: text,
    StatusNameEn: text,
    StatusNameFr: text,
    BillDocumentTypeNameEn: text,
    ParliamentNumber: z.number().nullish(),
    SessionNumber: z.number().nullish(),
    PassedHouseFirstReadingDateTime: text,
    PassedHouseSecondReadingDateTime: text,
    PassedHouseThirdReadingDateTime: text,
    PassedSenateFirstReadingDateTime: text,
    PassedSenateSecondReadingDateTime: text,
    PassedSenateThirdReadingDateTime: text,
    ReceivedRoyalAssentDateTime: text,
    ReceivedRoyalAssent: z.boolean().nullish(),
    IsProForma: z.boolean().nullish(),
  }) satisfies z.ZodType<RawBill>,
);

/** Most recent movement first; bill number breaks ties. */
const recent = (list: BillSummary[]) =>
  [...list].sort((a, b) => (b.lastMoved ?? '').localeCompare(a.lastMoved ?? '') || a.code.localeCompare(b.code, 'en', { numeric: true }));

export async function buildParliament({ bill, topic, lang }: { bill?: string; topic?: string; lang: Lang }, signal?: AbortSignal): Promise<ParliamentOutput> {
  const code = normalizeBillCode(bill);
  const terms = topicTerms(topic);
  const [legis, seats] = await Promise.all([
    getJson('https://www.parl.ca/legisinfo/en/bills/json', Bills, { revalidate: 3600, timeout: 9000, signal }),
    houseSeats('en', signal),
  ]);
  const raw = legis.ok ? legis.data : null;
  // A source is marked live only when its live fetch worked; otherwise it's the official page to check.
  const process = SOURCES.legislativeProcess(lang);
  const legisinfo = SOURCES.legisinfo(lang, { live: !!raw });
  const rest = [SOURCES.standings(lang, { live: !!seats }), SOURCES.senate(lang)];
  const base: ParliamentOutput = {
    lang,
    parliament: raw?.[0]?.ParliamentNumber ?? HOUSE.parliament,
    session: raw?.[0]?.SessionNumber ?? HOUSE.session,
    house: seats ? seatCounts(seats) : { seats: HOUSE.seats },
    senateSeats: SENATE.seats,
    bills: [],
    live: !!raw,
    // The day the live data was fetched; the static explainer pages keep their own CHECKED date in `sources`.
    checked: raw ? torontoToday() : CHECKED,
    // The first source shows in the widget footer. LEGISinfo leads whenever it answered (the header badge says
    // "Live · LEGISinfo") and for any bill or topic question; the explainer leads only the offline overview.
    sources: raw || code || terms.length ? [legisinfo, process, ...rest] : [process, legisinfo, ...rest],
    ...(topic ? { query: topic } : {}),
  };
  if (!raw) return code ? { ...base, focus: null, notFound: code } : base;

  const all = raw.filter((b) => !b.IsProForma).map((b) => summarizeBill(b, lang));
  const stats = {
    total: all.length,
    law: all.filter((b) => b.law).length,
    government: all.filter((b) => b.kind === 'government' || b.kind === 'senate-government').length,
  };

  if (code) {
    const focus = all.find((b) => b.code === code) ?? null;
    // The answer cites the bill's own LEGISinfo page: it leads the Sources list with its real title.
    const billSource = focus
      ? [livePage(lang === 'fr' ? `Projet de loi ${focus.code} : ${focus.title}` : `Bill ${focus.code}: ${focus.title}`, focus.url)]
      : [];
    return {
      ...base,
      stats,
      focus,
      ...(focus ? {} : { notFound: code }),
      sources: [...billSource, ...base.sources],
      bills: recent(all.filter((b) => b.code !== code && !b.defeated)).slice(0, 3),
    };
  }
  if (terms.length) {
    // Search both official languages' titles so "logement" and "housing" both work.
    const byCode = new Map(raw.map((r) => [r.NumberCode, r]));
    const scored = all
      .map((b) => {
        const r = byCode.get(b.code);
        return { b, s: matchesTopic(`${r?.ShortTitleEn ?? ''} ${r?.LongTitleEn ?? ''} ${r?.ShortTitleFr ?? ''} ${r?.LongTitleFr ?? ''}`, terms) };
      })
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s || (b.b.lastMoved ?? '').localeCompare(a.b.lastMoved ?? ''));
    return { ...base, stats, bills: scored.slice(0, 5).map((x) => x.b) };
  }
  // Default: the bills that moved most recently.
  return { ...base, stats, bills: recent(all.filter((b) => !b.defeated && b.lastMoved)).slice(0, 4) };
}
