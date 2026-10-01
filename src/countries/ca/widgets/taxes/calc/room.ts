/**
 * TFSA, RRSP and FHSA contribution room.
 * Pure and isomorphic (tools on the server, widgets on the device). Every constant comes from ../data.ts, where
 * each one is traced to its canada.ca page.
 */
import { FHSA, RRSP_LIMITS, RRSP_RATE, TFSA_CURRENT_YEAR, TFSA_FIRST_YEAR, TFSA_LIMITS } from '../data';

export type RoomInput = {
  birthYear?: number | null;
  /** Year they became a resident of Canada, if after 2009. */
  residentSince?: number | null;
  /** Total TFSA contributions ever, minus withdrawals made before this year. */
  tfsaNet?: number | null;
  /** Earned income last year (for new RRSP room). */
  earnedIncome?: number | null;
  /** Year the first FHSA was opened (null: not opened). */
  fhsaOpened?: number | null;
  /** FHSA contributions + RRSP transfers before this year. */
  fhsaPrior?: number | null;
  /** FHSA contributions this year. */
  fhsaThisYear?: number | null;
};

export type RoomOutput = {
  year: number;
  tfsa: { eligible: boolean; startYear: number | null; limitTotal: number; room: number | null; years: { year: number; limit: number; counted: boolean }[] };
  rrsp: { incomeYear: number; forYear: number; limit: number; newRoom: number | null; atMax: boolean };
  fhsa: { opened: number | null; annual: number; carryMax: number; lifetime: number; carry: number; room: number; lifetimeLeft: number };
  input: RoomInput;
};

export function savingsRoom(input: RoomInput): RoomOutput {
  const year = TFSA_CURRENT_YEAR;
  // TFSA: room accrues from the later of 2009, the year you turn 18, and the year you became a resident.
  const turns18 = input.birthYear ? input.birthYear + 18 : null;
  const start = turns18 == null ? null : Math.max(TFSA_FIRST_YEAR, turns18, input.residentSince ?? TFSA_FIRST_YEAR);
  const eligible = start != null && start <= year;
  const years = Object.entries(TFSA_LIMITS).map(([y, limit]) => ({ year: +y, limit, counted: start != null && +y >= start }));
  const limitTotal = years.filter((y) => y.counted).reduce((s, y) => s + y.limit, 0);
  const room = start == null ? null : Math.max(0, limitTotal - Math.max(0, input.tfsaNet ?? 0));

  // RRSP: 18% of last year's earned income, up to this year's dollar limit.
  const limit = RRSP_LIMITS[year];
  const newRoom = input.earnedIncome == null ? null : Math.round(Math.min(limit, Math.max(0, input.earnedIncome) * RRSP_RATE));

  // FHSA: $8,000 a year, up to $8,000 of unused room carried forward, $40,000 for life.
  const opened = input.fhsaOpened ?? null;
  const prior = Math.max(0, input.fhsaPrior ?? 0);
  const yearsBefore = opened == null ? 0 : Math.max(0, year - opened);
  const carry = opened == null ? 0 : Math.min(FHSA.carryMax, Math.max(0, FHSA.annual * yearsBefore - prior));
  const lifetimeLeft = Math.max(0, FHSA.lifetime - prior);
  const yearRoom = Math.min(FHSA.annual + carry, lifetimeLeft);
  const fhsaRoom = Math.max(0, yearRoom - Math.max(0, input.fhsaThisYear ?? 0));

  return {
    year,
    tfsa: { eligible, startYear: start, limitTotal, room, years },
    rrsp: { incomeYear: year - 1, forYear: year, limit, newRoom, atMax: newRoom != null && newRoom >= limit },
    fhsa: { opened, annual: FHSA.annual, carryMax: FHSA.carryMax, lifetime: FHSA.lifetime, carry, room: fhsaRoom, lifetimeLeft },
    input,
  };
}
