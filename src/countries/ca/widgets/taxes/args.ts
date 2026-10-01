/**
 * Tool input as the widget may see it before the output exists: still streaming, so any field can be missing
 * or half-written ("O" on its way to "ON", 19 on its way to 1990). These keep only the fields that are already
 * valid, with the same bounds as the tool's schema, so the loading state can be built from them safely.
 *   buildEstimate(estimatorArgs(part.input, lang))
 */
import { COMPLEXITIES } from './calc/free-filing';
import { FHSA, PROVINCES, TFSA_CURRENT_YEAR, type Lang } from './data';
import type { DeadlinesInput, EstimatorInput, FreeFilingArgs, RefundArgs, RoomInputArgs } from './types';

type Raw = Record<string, unknown>;
const raw = (input: unknown): Raw => (input && typeof input === 'object' ? (input as Raw) : {});
const oneOf = <T extends string>(v: unknown, all: readonly T[]) => (all.includes(v as T) ? (v as T) : undefined);
const flag = (v: unknown) => (typeof v === 'boolean' ? v : undefined);
const amount = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 100_000_000 ? v : undefined);
const whole = (v: unknown, min: number, max: number) => (typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max ? v : undefined);

export function deadlinesArgs(input: unknown, lang: Lang): DeadlinesInput {
  const i = raw(input);
  return { selfEmployed: flag(i.selfEmployed), focus: oneOf(i.focus, ['file', 'rrsp'] as const), lang };
}

export function estimatorArgs(input: unknown, lang: Lang): EstimatorInput {
  const i = raw(input);
  return {
    province: oneOf(i.province, PROVINCES),
    employmentIncome: amount(i.employmentIncome),
    otherIncome: amount(i.otherIncome),
    rrspContribution: amount(i.rrspContribution),
    fhsaContribution: amount(i.fhsaContribution),
    taxDeducted: amount(i.taxDeducted),
    lang,
  };
}

export function roomArgs(input: unknown, lang: Lang): RoomInputArgs {
  const i = raw(input);
  return {
    focus: oneOf(i.focus, ['tfsa', 'rrsp', 'fhsa'] as const),
    birthYear: whole(i.birthYear, 1900, TFSA_CURRENT_YEAR),
    age: whole(i.age, 0, 120),
    residentSince: whole(i.residentSince, 1900, TFSA_CURRENT_YEAR),
    tfsaContributed: amount(i.tfsaContributed),
    earnedIncome: amount(i.earnedIncome),
    fhsaOpenedYear: whole(i.fhsaOpenedYear, FHSA.firstYear, TFSA_CURRENT_YEAR),
    fhsaContributed: amount(i.fhsaContributed),
    lang,
  };
}

export function freeFilingArgs(input: unknown, lang: Lang): FreeFilingArgs {
  const i = raw(input);
  return {
    province: oneOf(i.province, PROVINCES),
    familySize: whole(i.familySize, 1, 15),
    familyIncome: amount(i.familyIncome),
    age65: flag(i.age65),
    complex: Array.isArray(i.complex) ? i.complex.flatMap((c) => oneOf(c, COMPLEXITIES) ?? []) : undefined,
    lang,
  };
}

export function refundArgs(input: unknown, lang: Lang): RefundArgs {
  const i = raw(input);
  return {
    filedOn: typeof i.filedOn === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(i.filedOn) ? i.filedOn : undefined,
    method: oneOf(i.method, ['online', 'paper'] as const),
    abroad: flag(i.abroad),
    onTime: flag(i.onTime),
    lang,
  };
}
