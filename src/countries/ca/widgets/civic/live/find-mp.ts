/**
 * civicFindMp builder (SERVER ONLY): postal code → federal riding (Represent by Open North, 2023
 * Representation Order, with its outline) → who holds that seat now (House of Commons). Degrades to the
 * official search page when a lookup fails.
 */
import 'server-only';
import { z } from 'zod';
import { CHECKED, HOUSE, PROVINCES, SOURCES, livePage, mpProfileUrl, torontoToday, vacantSources, type Lang } from '../data';
import { cityName, matchSeat, projectShape, type Seat } from '../build/ridings';
import { fold } from '../build/text';
import { looksLikePostal, normalizePostal } from '../select';
import type { FindMpOutput, Mp, Riding } from '../types';
import { houseSeats, memberProfile, seatCounts } from './house';
import { getJson } from './http';

const REP = 'https://represent.opennorth.ca';
const FED_SET = '/boundary-sets/federal-electoral-districts-2023-representation-order/';

const Boundary = z.object({
  url: z.string(),
  name: z.string(),
  external_id: z.string(),
  related: z.object({ boundary_set_url: z.string().nullish() }).nullish(),
});
const Representative = z.object({
  url: z.string().nullish(),
  representative_set_name: z.string().nullish(),
  related: z.object({ boundary_url: z.string().nullish() }).nullish(),
});
const Postcode = z.object({
  city: z.string().nullish(),
  province: z.string().nullish(),
  // The pin is optional: an unexpected centroid shape must not fail the whole lookup.
  centroid: z.object({ coordinates: z.tuple([z.number(), z.number()]) }).nullish().catch(null),
  boundaries_centroid: z.array(Boundary).nullish(),
  boundaries_concordance: z.array(Boundary).nullish(),
  representatives_centroid: z.array(Representative).nullish(),
  representatives_concordance: z.array(Representative).nullish(),
});
const BoundaryDetail = z.object({ metadata: z.object({ ED_NAMEF: z.string().nullish() }).nullish() });

const Position = z.tuple([z.number(), z.number()], z.number());
const Geometry = z.discriminatedUnion('type', [
  z.object({ type: z.literal('Polygon'), coordinates: z.array(z.array(Position)) }),
  z.object({ type: z.literal('MultiPolygon'), coordinates: z.array(z.array(z.array(Position))) }),
]);

/** Every source the scripted and model answers cite before a lookup succeeds, so each citation has a titled card. */
function baseFindMp(lang: Lang): Omit<FindMpOutput, 'status'> {
  return { lang, ridings: [], house: { seats: HOUSE.seats }, live: false, checked: CHECKED, sources: [SOURCES.members(lang), SOURCES.findRiding(lang), SOURCES.standings(lang, { live: false })] };
}

/** The riding's name in French: the House of Commons' own French name, else Elections Canada's. */
function frenchName(seat: Seat | undefined, seatsFr: Seat[] | null, boundaryName: string, provinceFr: string, edNameF?: string | null) {
  const fr =
    (seat?.personId && seatsFr?.find((s) => s.personId === seat.personId)) ||
    (seat && seatsFr ? matchSeat(seatsFr.filter((s) => !s.personId || s.personId === seat.personId), { name: seat.name, provinceName: provinceFr }) : undefined);
  return fr?.name ?? (seat && fold(seat.name) !== fold(boundaryName) ? seat.name : edNameF) ?? undefined;
}

export async function buildFindMp({ postalCode, lang }: { postalCode?: string; lang: Lang }, signal?: AbortSignal): Promise<FindMpOutput> {
  const base = baseFindMp(lang);
  if (!postalCode?.trim()) return { ...base, status: 'ask' };
  const pc = normalizePostal(postalCode);
  if (!pc) return { ...base, status: looksLikePostal(postalCode) ? 'invalid' : 'ask', postalCode: postalCode.trim().slice(0, 12) };

  const seatsP = houseSeats('en', signal);
  const seatsFrP = lang === 'fr' ? houseSeats('fr', signal) : Promise.resolve(null);
  const found = await getJson(`${REP}/postcodes/${pc.code}/`, Postcode, { revalidate: 86_400, timeout: 4500, signal });
  if (!found.ok) {
    const missing = found.reason === 'http' && found.status === 404;
    return { ...base, status: missing ? 'not-found' : 'unavailable', postalCode: pc.display, province: pc.province };
  }
  const place = found.data;
  const provCode = (place.province ?? pc.province ?? '').toUpperCase();
  const city = cityName(place.city ?? undefined, lang);

  const fed = [...(place.boundaries_centroid ?? []), ...(place.boundaries_concordance ?? [])].filter((b) => b.related?.boundary_set_url === FED_SET);
  const unique = fed.filter((b, i) => fed.findIndex((x) => x.external_id === b.external_id) === i).slice(0, 3);
  if (!unique.length) return { ...base, status: 'not-found', postalCode: pc.display, city, ...(place.province ? { province: place.province } : {}) };

  const reps = [...(place.representatives_centroid ?? []), ...(place.representatives_concordance ?? [])].filter(
    (r) => r.representative_set_name === 'House of Commons',
  );
  const [seats, seatsFr] = await Promise.all([seatsP, seatsFrP]);
  const prov = PROVINCES[provCode];

  const ridings: Riding[] = await Promise.all(
    unique.map(async (b): Promise<Riding> => {
      const repId = reps.find((r) => r.related?.boundary_url === b.url)?.url?.match(/\((\d+)\)/)?.[1];
      const week = { revalidate: 604_800, signal };
      const [detail, geometry] = await Promise.all([
        getJson(`${REP}${b.url}`, BoundaryDetail, { ...week, timeout: 4000 }),
        getJson(`${REP}${b.url}simple_shape`, Geometry, { ...week, timeout: 4500 }),
      ]);
      const seat = seats ? matchSeat(seats, { name: b.name, provinceName: prov?.en ?? '', personId: repId }) : undefined;
      const status = !seats || !seat ? 'unconfirmed' : seat.personId ? 'sitting' : 'vacant';
      let mp: Mp | null = null;
      if (status === 'sitting' && seat?.personId) {
        // The profile page can be down while the seat list is up: keep the name, caucus and official link.
        mp = (await memberProfile(seat.personId, lang, signal)) ?? {
          personId: seat.personId,
          name: [seat.first, seat.last].filter(Boolean).join(' '),
          honorific: seat.honorific,
          caucus: seat.caucus,
          roles: [],
          profileUrl: mpProfileUrl(seat.personId, lang),
          offices: [],
        };
      }
      // Riding name: the House of Commons' current name (ridings renamed in 2026 included), in the answer language.
      const current = seat?.name ?? b.name;
      const name = lang === 'fr' ? (frenchName(seat, seatsFr, b.name, prov?.fr ?? '', detail.ok ? detail.data.metadata?.ED_NAMEF : undefined) ?? current) : current;
      const shape = geometry.ok ? projectShape(geometry.data, place.centroid?.coordinates) : undefined;
      return { fedNum: b.external_id, name, province: provCode, provinceName: prov?.[lang] ?? provCode, status, mp, ...(shape ? { shape } : {}) };
    }),
  );

  const first = ridings[0];
  return {
    ...base,
    status: 'ok',
    postalCode: pc.display,
    city,
    province: provCode,
    ridings,
    house: seats ? seatCounts(seats) : { seats: HOUSE.seats },
    live: !!seats,
    ...(seats ? { checked: torontoToday() } : {}),
    sources: first?.mp
      ? [
          livePage(lang === 'fr' ? `${first.mp.name} : profil à la Chambre des communes` : `${first.mp.name}: House of Commons profile`, first.mp.profileUrl),
          SOURCES.findRiding(lang),
          SOURCES.standings(lang, { live: !!seats }),
        ]
      : first?.status === 'vacant'
        ? vacantSources(lang)
        : [SOURCES.members(lang), SOURCES.findRiding(lang), SOURCES.standings(lang, { live: !!seats })],
  };
}


/** What the model reads: everything but the portrait and the outline (screen only; keeps tokens out of its context). */
export const findMpForModel = (o: FindMpOutput) => ({
  ...o,
  ridings: o.ridings.map((r) => ({ ...r, shape: undefined, mp: r.mp ? { ...r.mp, photo: undefined } : null })),
});
