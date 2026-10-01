/**
 * Builds each tool's full output (data + sources) from its input. Shared by the tools (server) and the lab
 * fixtures, so the lab always shows exactly what the tools return.
 */
import { planDeadlines } from './calc/deadlines';
import { estimate } from './calc/estimate';
import { freeFiling } from './calc/free-filing';
import { refundStatus } from './calc/refund';
import { savingsRoom } from './calc/room';
import { TFSA_CURRENT_YEAR, type Lang } from './data';
import { source } from './urls';
import type {
  DeadlinesInput,
  DeadlinesResult,
  EstimatorInput,
  EstimatorResult,
  FreeFilingArgs,
  FreeFilingResult,
  RefundArgs,
  RefundResult,
  RoomInputArgs,
  RoomResult,
} from './types';

const L = (l?: Lang): Lang => (l === 'fr' ? 'fr' : 'en');

export function buildDeadlines(a: DeadlinesInput, today: string): DeadlinesResult {
  const lang = L(a.lang);
  return {
    ...planDeadlines({ today, selfEmployed: !!a.selfEmployed, lang }),
    focus: a.focus === 'rrsp' ? 'rrsp' : 'file',
    sources:
      a.focus === 'rrsp'
        ? [source('rrspLimit', lang), source('limits', lang), source('rrspDates', lang), source('filingDates', lang), source('dates', lang), source('latePenalty', lang)]
        : [source('filingDates', lang), source('dates', lang), source('rrspLimit', lang), source('instalments', lang), source('latePenalty', lang)],
  };
}

export function buildEstimate(a: EstimatorInput): EstimatorResult {
  const lang = L(a.lang);
  return {
    estimate: estimate({
      province: a.province ?? 'ON',
      employmentIncome: a.employmentIncome ?? 0,
      otherIncome: a.otherIncome ?? 0,
      rrsp: a.rrspContribution ?? 0,
      fhsa: a.fhsaContribution ?? 0,
      taxDeducted: a.taxDeducted ?? null,
    }),
    provinceGiven: !!a.province,
    incomeGiven: a.employmentIncome != null || a.otherIncome != null,
    lang,
    sources: [
      source('rates', lang),
      source('indexation', lang),
      source('cpp', lang),
      source('ei', lang),
      source('t4127', lang),
      ...(a.province === 'QC' ? [source('quebecRates', lang)] : []),
    ],
  };
}

export function buildRoom(a: RoomInputArgs): RoomResult {
  const lang = L(a.lang);
  const birthYear = a.birthYear ?? (a.age != null ? TFSA_CURRENT_YEAR - a.age : null);
  return {
    ...savingsRoom({
      birthYear,
      residentSince: a.residentSince ?? null,
      tfsaNet: a.tfsaContributed ?? null,
      earnedIncome: a.earnedIncome ?? null,
      fhsaOpened: a.fhsaOpenedYear ?? null,
      fhsaPrior: a.fhsaContributed ?? null,
    }),
    focus: a.focus ?? 'tfsa',
    lang,
    sources:
      a.focus === 'rrsp'
        ? [source('limits', lang), source('rrspLimit', lang), source('rrspDates', lang), source('tfsaRoom', lang), source('fhsa', lang)]
        : a.focus === 'fhsa'
          ? [source('fhsa', lang), source('fhsaOpen', lang), source('fhsaHome', lang), source('rrspDates', lang), source('tfsaRoom', lang), source('limits', lang), source('rrspLimit', lang)]
          : [source('tfsaRoom', lang), source('limits', lang), source('tfsaOpen', lang), source('rrspLimit', lang), source('fhsa', lang)],
  };
}

export function buildFreeFiling(a: FreeFilingArgs): FreeFilingResult {
  const lang = L(a.lang);
  return {
    ...freeFiling({ province: a.province ?? null, familySize: a.familySize ?? null, familyIncome: a.familyIncome ?? null, age65: !!a.age65, complex: a.complex ?? [] }),
    lang,
    sources:
      a.province === 'QC'
        ? [source('quebecClinics', lang), source('clinics', lang), source('simpleFile', lang), source('software', lang), source('howFile', lang)]
        : [source('clinics', lang), source('simpleFile', lang), source('software', lang), source('howFile', lang)],
  };
}

export function buildRefund(a: RefundArgs, today: string): RefundResult {
  const lang = L(a.lang);
  return {
    ...refundStatus({ filedOn: a.filedOn ?? null, method: a.method ?? 'online', abroad: !!a.abroad, onTime: a.onTime ?? null, today }),
    methodGiven: !!a.method,
    lang,
    sources: [source('refunds', lang), source('serviceStandards', lang), source('directDeposit', lang), source('signIn', lang)],
  };
}
