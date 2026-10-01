/**
 * Visa or eTA? Pure rules from the official lists (entry-requirements-country.html, eta-x.html), isomorphic.
 * The official "Find out if you need a visa or eTA" questions always have the final word: the widget says so.
 */
import { ETA_CONDITIONAL, ETA_REQUIRED, PASSPORT_NOTES, VISA_REQUIRED } from './data';

export type Travel = 'air' | 'land-sea';
export type EntryKind =
  | 'visa' // visitor visa, any way of travelling
  | 'eta' // eTA to fly
  | 'eta-conditional' // visa-required country, flying, meets the eTA conditions
  | 'visa-conditional' // visa-required country with an eTA route, but the conditions aren't met
  | 'passport-only' // eTA country arriving by land or sea
  | 'none-us' // US citizen or US lawful permanent resident
  | 'canadian' // Canadian citizen
  | 'unknown';

export type EntryInput = {
  /** ISO 3166-1 alpha-2 nationality (the passport's country). */
  country?: string;
  travel?: Travel;
  /** Held a Canadian visitor visa in the past 10 years, or has a valid US non-immigrant visa. */
  hasVisaHistory?: boolean;
  /** Lawful permanent resident of the United States (green card). */
  usPermanentResident?: boolean;
};

export type EntryResult = {
  kind: EntryKind;
  country: string | null;
  travel: Travel;
  /** True when a visa-required country has an eTA route (the conditional toggle matters). */
  conditional: boolean;
  note?: (typeof PASSPORT_NOTES)[string];
};

export function checkEntry(input: EntryInput): EntryResult {
  const country = input.country && /^[A-Za-z]{2}$/.test(input.country) ? input.country.toUpperCase() : null;
  const travel: Travel = input.travel === 'land-sea' ? 'land-sea' : 'air';
  const conditional = !!country && ETA_CONDITIONAL.has(country);
  const note = country ? PASSPORT_NOTES[country] : undefined;
  const base = { country, travel, conditional, ...(note ? { note } : {}) };
  if (input.usPermanentResident && country !== 'CA') return { ...base, kind: 'none-us' };
  if (!country) return { ...base, kind: 'unknown' };
  if (country === 'CA') return { ...base, kind: 'canadian' };
  if (country === 'US') return { ...base, kind: 'none-us' };
  if (conditional) {
    if (travel === 'air' && input.hasVisaHistory) return { ...base, kind: 'eta-conditional' };
    return { ...base, kind: 'visa-conditional' };
  }
  if (VISA_REQUIRED.has(country)) return { ...base, kind: 'visa' };
  if (ETA_REQUIRED.has(country)) return { ...base, kind: travel === 'air' ? 'eta' : 'passport-only' };
  return { ...base, kind: 'unknown' };
}

/** Whether the answer is a visa (drives fees, processing time and the handoff). */
export const needsVisa = (k: EntryKind) => k === 'visa' || k === 'visa-conditional';
export const needsEta = (k: EntryKind) => k === 'eta' || k === 'eta-conditional';
