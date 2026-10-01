/**
 * Tool outputs for the transport widgets: each builder turns a tool input (plus live data, when there is some) into
 * the JSON its renderer reads, with every link and source in the answer's language. Pure; used by the tool, the
 * fixtures and the scenarios, never by the renderers (it pulls in the URL catalogue and source lists of data.ts).
 */
import type { ToolSource } from '@/lib/widgets/types';
import type { BoatInput, BoatOutput } from './boating';
import { DRONE_FEES, EVAP, PHONES, URLS, feeOn, type Lang } from './data';
import { boatingSources, cannabisSources, droneSources, evSources, petSources } from './sources';
import { OPS, SIZES, sizeOf, type DroneFees, type DroneInput, type DroneOp, type DroneOutput, type DroneSize } from './drone';
import { searchEv, type EvInput, type EvOutput, type EvRow, type Fuel } from './ev';
import { TRIPS, type Pet, type TravelInput, type TravelOutput, type TravelTopic, type Trip } from './travel';

/* ─────────────── Drone ─────────────── */

/** Transport Canada's scheduled fees in force on `date` (the fallback when its fee service doesn't answer). */
export const feesOn = (date: string): DroneFees =>
  Object.fromEntries(Object.entries(DRONE_FEES).map(([k, s]) => [k, feeOn(s, date)])) as DroneFees;

export function buildDrone(input: DroneInput, today: string, fees: DroneFees = feesOn(today), feesLive = false): DroneOutput {
  const lang: Lang = input.lang === 'fr' ? 'fr' : 'en';
  const w = typeof input.weightGrams === 'number' && input.weightGrams > 0 ? Math.round(input.weightGrams) : null;
  const size: DroneSize = w != null ? sizeOf(w) : input.size && SIZES.includes(input.size) ? input.size : 'small';
  const operation: DroneOp = input.operation && OPS.includes(input.operation) ? input.operation : 'standard';
  const age = typeof input.age === 'number' && input.age > 0 && input.age < 120 ? Math.floor(input.age) : null;
  return {
    version: 1,
    lang,
    today,
    size,
    sizeKnown: w != null || !!input.size,
    weightGrams: w,
    operation,
    age,
    fees,
    feesLive,
    links: {
      portal: URLS.dronePortalSignIn[lang],
      schools: URLS.droneSchools[lang],
      register: URLS.droneRegister[lang],
      exam: URLS.droneExam[lang],
      recency: URLS.droneRecency[lang],
      special: URLS.droneSpecial[lang],
      categories: URLS.droneCategories[lang],
      micro: URLS.droneMicro[lang],
      car: { basic: URLS.carPilot.basic[lang], advanced: URLS.carPilot.advanced[lang], complex: URLS.carPilot.complex[lang] },
      carOwner: URLS.carOwner[lang],
    },
    sources: droneSources(lang, feesLive, age != null && age < 18),
  };
}

/* ─────────────── Boating ─────────────── */

export function buildBoat(input: BoatInput): BoatOutput {
  const lang: Lang = input.lang === 'fr' ? 'fr' : 'en';
  const ageKnown = typeof input.age === 'number' && input.age > 0;
  return {
    version: 1,
    lang,
    age: ageKnown ? Math.min(99, Math.max(1, Math.floor(input.age as number))) : 18,
    horsepower: typeof input.horsepower === 'number' && input.horsepower >= 0 ? Math.min(600, Math.round(input.horsepower)) : input.pwc ? 130 : 25,
    pwc: !!input.pwc,
    supervised: !!input.supervised,
    north: !!input.north,
    visitor: !!input.visitor,
    lost: !!input.lost,
    ageKnown,
    links: { card: URLS.pcoc[lang], faq: URLS.pcocFaq[lang], providers: URLS.pcocProviders[lang], lookup: URLS.pcocLookup[lang] },
    phone: PHONES.boating,
    sources: boatingSources(lang, !!input.lost),
  };
}

/* ─────────────── Travel rules ─────────────── */

export function buildTravel(input: TravelInput): TravelOutput {
  const lang: Lang = input.lang === 'fr' ? 'fr' : 'en';
  const topic: TravelTopic = input.topic === 'pets' ? 'pets' : 'cannabis';
  const trip: Trip = input.trip && TRIPS.includes(input.trip) ? input.trip : topic === 'cannabis' ? 'domestic-flight' : 'entering-canada';
  const pet: Pet = input.pet === 'cat' || input.pet === 'other' ? input.pet : 'dog';
  const petAgeMonths = typeof input.petAgeMonths === 'number' && input.petAgeMonths >= 0 ? Math.floor(input.petAgeMonths) : null;
  return {
    version: 1,
    lang,
    topic,
    trip,
    pet,
    petAgeMonths,
    links: {
      border: URLS.cannabisBorder[lang],
      penalties: URLS.cannabisPenalties[lang],
      travel: URLS.cannabisTravel[lang],
      flights: URLS.cannabisFlights[lang],
      limit: URLS.cannabisLimit[lang],
      provinces: URLS.cannabisProvinces[lang],
      pets: URLS.pets[lang],
      petsImport: URLS.petsImport[lang],
      petsUs: URLS.petsUs[lang],
      petsTravel: URLS.petsTravel[lang],
    },
    sources: topic === 'cannabis' ? cannabisSources(lang, trip) : petSources(lang, trip),
    ...(topic === 'cannabis' ? { sourcesByTrip: Object.fromEntries(TRIPS.map((k) => [k, cannabisSources(lang, k)])) as Record<Trip, ToolSource[]> } : {}),
  };
}

/* ─────────────── EV incentive ─────────────── */

export function buildEv(
  input: EvInput,
  today: string,
  data: { vehicles: EvRow[]; listLive: boolean; funds?: { remaining: number; asOf: string } | null; fundsLive?: boolean },
): EvOutput {
  const lang: Lang = input.lang === 'fr' ? 'fr' : 'en';
  const query = input.query?.trim().slice(0, 60) || null;
  const matches = searchEv(data.vehicles, query);
  const first = matches.length ? data.vehicles[matches[0]] : null;
  const fuel: Fuel = input.fuel ?? first?.[4] ?? 'BEV';
  const canadianMade = input.canadianMade ?? (matches.length ? matches.every((i) => data.vehicles[i][5] === 1) : false);
  const lease = typeof input.leaseMonths === 'number' && input.leaseMonths > 0 ? Math.min(96, Math.round(input.leaseMonths)) : 0;
  const funds = data.funds ?? EVAP.remaining;
  return {
    version: 1,
    lang,
    today,
    query,
    fuel,
    price: typeof input.price === 'number' && input.price > 0 ? Math.round(input.price) : null,
    canadianMade,
    leaseMonths: lease,
    vehicles: data.vehicles,
    matches,
    listLive: data.listLive,
    funds: { remaining: 'amount' in funds ? funds.amount : funds.remaining, asOf: funds.asOf, total: EVAP.totalFunding, live: !!data.fundsLive },
    levels: EVAP.levels,
    links: { program: URLS.ev[lang], overview: URLS.evOverview[lang], list: URLS.evList[lang], qa: URLS.evQa[lang] },
    sources: evSources(lang, data.listLive || !!data.fundsLive),
  };
}
