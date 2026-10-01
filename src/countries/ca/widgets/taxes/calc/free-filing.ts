/**
 * Free ways to file: free tax clinic income limits and SimpleFile limits.
 * Pure and isomorphic (tools on the server, widgets on the device). Every constant comes from ../data.ts, where
 * each one is traced to its canada.ca page.
 */
import { CLINIC_EXTRA_PERSON, CLINIC_THRESHOLDS, SIMPLEFILE_2025, type ProvinceCode } from '../data';

export type Complexity = 'selfEmployed' | 'rental' | 'capitalGains' | 'foreign' | 'deceased' | 'bankrupt' | 'interestOver1200';
export const COMPLEXITIES: Complexity[] = ['selfEmployed', 'rental', 'capitalGains', 'foreign', 'interestOver1200', 'bankrupt', 'deceased'];

export type FreeFilingInput = {
  province?: ProvinceCode | null;
  familySize?: number | null;
  familyIncome?: number | null;
  personalIncome?: number | null;
  age65?: boolean;
  complex?: Complexity[];
};

export type FreeFilingOutput = {
  input: FreeFilingInput;
  quebec: boolean;
  threshold: number | null;
  clinic: 'yes' | 'income' | 'complex' | 'unknown';
  simpleFileLimit: number | null;
  simpleFile: 'maybe' | 'over' | 'complex' | 'unknown';
  thresholds: number[];
};

function clinicThreshold(size: number) {
  const n = Math.max(1, Math.round(size));
  return n <= 5 ? CLINIC_THRESHOLDS[n - 1] : CLINIC_THRESHOLDS[4] + (n - 5) * CLINIC_EXTRA_PERSON;
}

export function freeFiling(input: FreeFilingInput): FreeFilingOutput {
  const complex = (input.complex ?? []).length > 0;
  const size = input.familySize ?? null;
  const threshold = size ? clinicThreshold(size) : null;
  const clinic: FreeFilingOutput['clinic'] = complex
    ? 'complex'
    : threshold == null || input.familyIncome == null
      ? 'unknown'
      : input.familyIncome <= threshold
        ? 'yes'
        : 'income';
  const sfRow = input.province ? SIMPLEFILE_2025[input.province] : null;
  const simpleFileLimit = sfRow ? sfRow[input.age65 ? 2 : 0] : null;
  const personal = input.personalIncome ?? (size === 1 ? input.familyIncome ?? null : null);
  const simpleFile: FreeFilingOutput['simpleFile'] = complex
    ? 'complex'
    : simpleFileLimit == null || personal == null
      ? 'unknown'
      : personal <= simpleFileLimit
        ? 'maybe'
        : 'over';
  return {
    input,
    quebec: input.province === 'QC',
    threshold,
    clinic,
    simpleFileLimit,
    simpleFile,
    thresholds: [1, 2, 3, 4, 5, 6].map(clinicThreshold),
  };
}
