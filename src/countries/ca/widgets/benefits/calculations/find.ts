/** The finder: every federal program checked against one set of answers, sorted by what matters first. */
import { CDB, CDCP, CPP, CWB, EI, OAS, STUDENT } from '../rates';
import { ccbAnnual, cdbAnnual, cdcpCopay, cgebAnnual, cgebMax, childDisabilityAnnual, cwbAnnual, eiEstimate, studentGrant } from './family';
import { gisIncome, gisMonthly, oasEstimate, oasShortfall } from './seniors';
import type { AgeBand, FindOptions, Match, Profile, Status } from './types';
import { kidsOf, r2 } from './util';

const RANK: Record<Status, number> = { likely: 0, apply: 1, check: 2, no: 3 };

export function findBenefits(p: Profile, opts: FindOptions = {}): { matches: Match[]; total: number; monthlyTotal: number } {
  const kids = kidsOf(p);
  const senior = p.age === '65-74' || p.age === '75-plus';
  const adult = p.age !== 'under-19';
  // No income given: `p.income` is only a placeholder. Every income-tested program then shows what it is and the
  // most it pays for this household (`upTo`, reason `incomeNeeded`), never an amount worked out from the placeholder.
  const known = opts.earningsKnown !== false;
  const m: Match[] = [];

  // Canada child benefit (+ child disability benefit)
  if (kids === 0) m.push({ id: 'ccb', status: 'no', reason: 'noKids', cadence: 'monthly' });
  else if (!known) {
    m.push({ id: 'ccb', status: 'check', reason: 'incomeNeeded', upTo: ccbAnnual(0, p.childrenUnder6, p.children6to17), cadence: 'monthly', nums: { count: kids }, estimator: 'ccb' });
    const count = Math.min(p.childDisability, kids);
    if (count > 0) m.push({ id: 'childDisability', status: 'check', reason: 'incomeNeeded', upTo: childDisabilityAnnual(0, count), cadence: 'monthly', nums: { count } });
  } else {
    const annual = ccbAnnual(p.income, p.childrenUnder6, p.children6to17);
    m.push(
      annual > 0
        ? { id: 'ccb', status: 'likely', reason: 'yes', annual, cadence: 'monthly', nums: { count: kids }, estimator: 'ccb', pay: 'ccb' }
        : { id: 'ccb', status: 'no', reason: 'income', cadence: 'monthly', estimator: 'ccb' },
    );
    if (p.childDisability > 0) {
      const cd = childDisabilityAnnual(p.income, Math.min(p.childDisability, kids));
      m.push(
        cd > 0
          ? { id: 'childDisability', status: 'likely', reason: 'yes', annual: cd, cadence: 'monthly', nums: { count: Math.min(p.childDisability, kids) }, pay: 'ccb' }
          : { id: 'childDisability', status: 'no', reason: 'income', cadence: 'monthly' },
      );
    }
  }

  // Canada Groceries and Essentials Benefit (formerly the GST/HST credit)
  if (!adult && p.household === 'single' && kids === 0) m.push({ id: 'cgeb', status: 'no', reason: 'age', cadence: 'quarterly' });
  else if (!known) m.push({ id: 'cgeb', status: 'check', reason: 'incomeNeeded', upTo: cgebMax(p.household, kids), cadence: 'quarterly' });
  else {
    const annual = cgebAnnual(p.household, kids, p.income);
    m.push(annual > 0 ? { id: 'cgeb', status: 'likely', reason: 'yes', annual, cadence: 'quarterly', pay: 'cgeb' } : { id: 'cgeb', status: 'no', reason: 'income', cadence: 'quarterly' });
  }

  // Canada workers benefit
  if (!adult && p.household === 'single' && kids === 0) {
    m.push({ id: 'cwb', status: 'no', reason: 'age', cadence: 'yearly' });
  } else if (p.student && kids === 0) {
    m.push({ id: 'cwb', status: 'no', reason: 'student', cadence: 'yearly' });
  } else if (p.workIncome <= CWB.phaseInBase) {
    m.push({ id: 'cwb', status: 'no', reason: 'noWork', cadence: 'yearly', money: { min: CWB.phaseInBase } });
  } else if (p.province && (CWB.different as readonly string[]).includes(p.province)) {
    m.push({ id: 'cwb', status: 'check', reason: 'province', cadence: 'yearly' });
  } else if (!known) {
    const kind = p.household === 'couple' || kids > 0 ? 'family' : 'single';
    m.push({ id: 'cwb', status: 'check', reason: 'incomeNeeded', upTo: CWB.max[kind] + (p.disability ? CWB.disability.max : 0), cadence: 'yearly' });
  } else {
    const c = cwbAnnual(p);
    m.push(
      c.total > 0 && opts.workKnown === false
        ? // Only an income was given: all of it from work is an assumption, and the most it could be.
          { id: 'cwb', status: 'check', reason: 'workAssumed', upTo: c.total, cadence: 'yearly' }
        : c.total > 0
        ? { id: 'cwb', status: 'likely', reason: c.supplement > 0 ? 'yesSupplement' : 'yes', annual: c.total, cadence: 'yearly', money: { advance: Math.round(c.total * CWB.advancePortion) }, pay: 'cwb' }
        : { id: 'cwb', status: 'no', reason: 'income', cadence: 'yearly' },
    );
  }

  // Canadian Dental Care Plan
  const copay = cdcpCopay(p.income);
  if (p.dentalInsurance) m.push({ id: 'cdcp', status: 'no', reason: 'insured', cadence: 'coverage' });
  else if (!known) m.push({ id: 'cdcp', status: 'apply', reason: 'incomeNeeded', cadence: 'coverage', money: { limit: CDCP.limit } });
  else if (copay == null) m.push({ id: 'cdcp', status: 'no', reason: 'income', cadence: 'coverage', money: { limit: CDCP.limit } });
  else m.push({ id: 'cdcp', status: 'apply', reason: copay === 0 ? 'full' : 'copay', cadence: 'coverage', nums: { copay, covered: 100 - copay } });

  // Canada Disability Benefit (18–64, DTC)
  if (!p.disability) m.push({ id: 'cdb', status: 'no', reason: 'dtc', cadence: 'monthly' });
  else if (senior) m.push({ id: 'cdb', status: 'no', reason: 'age', cadence: 'monthly' });
  else if (!adult) m.push({ id: 'cdb', status: 'check', reason: 'young', cadence: 'monthly' });
  else if (!known) m.push({ id: 'cdb', status: 'apply', reason: 'incomeNeeded', upTo: r2(CDB.monthlyMax * 12), cadence: 'monthly' });
  else {
    const annual = cdbAnnual(p.household, p.income, p.workIncome);
    m.push(annual > 0 ? { id: 'cdb', status: 'apply', reason: 'yes', annual, cadence: 'monthly', pay: 'cdb' } : { id: 'cdb', status: 'no', reason: 'income', cadence: 'monthly' });
  }

  // EI regular benefits: never tell someone they won't qualify; invite them to apply right away.
  // EI is based on the claimant's own insurable earnings: for a couple, family income says nothing about it,
  // so until they give their own earnings we show the ceiling, never a family-based number.
  if (p.jobLoss) {
    const own = p.household === 'couple' ? p.jobEarnings : known ? p.workIncome : undefined;
    const base = { id: 'ei', status: 'apply', cadence: 'weekly', nums: { weeks: EI.applyWithinWeeks }, estimator: 'ei', how: 'now' } as const;
    if (own == null) m.push({ ...base, reason: 'yes', upTo: EI.maxWeekly });
    else m.push({ ...base, reason: own > 0 ? 'yes' : 'noEarnings', weekly: own > 0 ? eiEstimate(own).weekly : undefined, money: { earnings: own } });
  } else m.push({ id: 'ei', status: 'no', reason: 'working', cadence: 'weekly', estimator: 'ei' });

  // Canada Student Grant for Full-Time Students
  if (!p.student) m.push({ id: 'student', status: 'no', reason: 'notStudent', cadence: 'yearly' });
  // Quebec, the NWT and Nunavut have their own programs: the federal grant isn't a match there.
  else if (p.province && (STUDENT.notIn as readonly string[]).includes(p.province)) m.push({ id: 'student', status: 'no', reason: 'province', cadence: 'yearly' });
  else if (!known) m.push({ id: 'student', status: 'apply', reason: 'incomeNeeded', upTo: STUDENT.maxYearly, cadence: 'yearly', money: { monthly: STUDENT.maxMonthly } });
  else {
    const size = 1 + (p.household === 'couple' ? 1 : 0) + kids;
    const g = studentGrant(size, p.income);
    m.push(
      g === 'none'
        ? { id: 'student', status: 'no', reason: 'income', cadence: 'yearly' }
        : { id: 'student', status: 'apply', reason: g, upTo: STUDENT.maxYearly, cadence: 'yearly', money: { monthly: STUDENT.maxMonthly } },
    );
  }

  // Old Age Security + Guaranteed Income Supplement
  if (senior) {
    if (p.yearsInCanada < OAS.minYears) m.push({ id: 'oas', status: 'no', reason: 'years', cadence: 'monthly', nums: { years: OAS.minYears } });
    else if (!known) {
      // The pension before any recovery tax (it only applies to high incomes), and the most the supplement pays.
      const couple = p.household === 'couple';
      const o = oasEstimate({ years: p.yearsInCanada, startAge: 65, age75: p.age === '75-plus', income: 0 });
      m.push({ id: 'oas', status: 'likely', reason: o.residency < 1 ? 'partial' : 'yes', upTo: o.annual, cadence: 'monthly', nums: { years: Math.min(p.yearsInCanada, OAS.fullYears) }, estimator: 'oas', pay: 'oas', ...(couple ? { note: 'couple' } : {}) });
      const g = couple ? OAS.gis.spouseOas : OAS.gis.single;
      m.push({ id: 'gis', status: 'check', reason: couple ? 'incomeNeededCouple' : 'incomeNeeded', cadence: 'monthly', money: { limit: g.limit, monthly: g.max } });
    } else {
      // Recovery tax is on individual income: split a couple's income evenly (an assumption the card states whenever
      // it changes the amount). Withholding from July 2026 to June 2027 uses 2025 income, the same year as the income
      // asked for (the estimator and the scripted answer use the same threshold).
      const couple = p.household === 'couple';
      const own = couple ? p.income / 2 : p.income;
      const o = oasEstimate({ years: p.yearsInCanada, startAge: 65, age75: p.age === '75-plus', income: own });
      const split = couple && o.recovery > 0;
      m.push(
        o.monthly > 0
          ? { id: 'oas', status: 'likely', reason: o.residency < 1 ? 'partial' : o.recovery > 0 ? 'recovery' : 'yes', annual: o.annual, cadence: 'monthly', nums: { years: Math.min(p.yearsInCanada, OAS.fullYears) }, money: { own }, estimator: 'oas', pay: 'oas', ...(couple ? { note: split ? 'coupleSplit' : 'couple' } : {}) }
          : { id: 'oas', status: 'no', reason: 'income', cadence: 'monthly', money: { own }, estimator: 'oas', ...(split ? { note: 'split' } : {}) },
      );
      // GIS counts income without OAS (the net income asked for includes it) and without part of work income.
      // For a couple, assume the partner gets OAS too (the common case) and count both pensions.
      const g = couple ? OAS.gis.spouseOas : OAS.gis.single;
      const oasInIncome = o.gross * 12 * (couple ? 2 : 1);
      const gi = gisIncome(p.income, oasInIncome, p.workIncome);
      // A partial pensioner's GIS is raised by what their OAS is short of the full pension (each partner's own).
      const partial = p.yearsInCanada < OAS.fullYears;
      const monthly = gisMonthly(p.household, gi, oasShortfall(p.yearsInCanada, p.age === '75-plus'));
      m.push(
        monthly > 0
          ? { id: 'gis', status: 'apply', reason: couple ? 'estCouple' : 'est', annual: r2(monthly * 12), cadence: 'monthly', money: { income: Math.round(gi), limit: g.limit }, pay: 'oas', ...(partial ? { note: 'partial' } : {}) }
          : { id: 'gis', status: 'no', reason: couple ? 'incomeCouple' : 'income', cadence: 'monthly', money: { limit: g.limit } },
      );
    }
  } else if (p.age === '60-64') m.push({ id: 'oas', status: 'check', reason: 'soon', cadence: 'monthly', estimator: 'oas' });
  else m.push({ id: 'oas', status: 'no', reason: 'age', cadence: 'monthly', estimator: 'oas' });

  // CPP retirement pension (depends on contributions: show the typical amount, not an estimate)
  // There's no advantage to waiting past 70 (cppWhen), so at 75+ it should already be paid; if not, a late
  // application can ask for a start date up to 11 months back.
  if (p.age === '75-plus')
    m.push({ id: 'cpp', status: 'check', reason: 'already', upTo: CPP.average65 * 12, cadence: 'monthly', money: { average: CPP.average65, max: CPP.max65 }, nums: { months: CPP.retroMonths }, how: 'already' });
  else if (p.age === '60-64' || senior) m.push({ id: 'cpp', status: 'check', reason: 'yes', upTo: CPP.average65 * 12, cadence: 'monthly', money: { average: CPP.average65, max: CPP.max65 }, estimator: 'cpp', pay: 'cpp' });
  else m.push({ id: 'cpp', status: 'no', reason: 'age', cadence: 'monthly', estimator: 'cpp' });

  // Someone who just lost their job needs EI first: it has a 4-week window.
  const urgent = (x: Match) => (x.id === 'ei' && x.status === 'apply' ? -1 : 0);
  m.sort((a, b) => urgent(a) - urgent(b) || RANK[a.status] - RANK[b.status] || (b.annual ?? b.upTo ?? 0) - (a.annual ?? a.upTo ?? 0));
  const total = r2(m.reduce((s, x) => s + (x.status !== 'no' && x.annual ? x.annual : 0), 0));
  return { matches: m, total, monthlyTotal: r2(total / 12) };
}

export const isSenior = (age: AgeBand) => age === '65-74' || age === '75-plus';

/** When "of that, from work" wasn't given: all of it before 65, none of it from 65 (pensions are the common case). */
export const assumedWork = (age: AgeBand, income: number) => (isSenior(age) ? 0 : income);

/**
 * The profile after the person changes some answers. Until they say how much is from work (`workKnown`), that
 * figure follows the assumption above; once they have, it only stays within their total income.
 */
export function withAnswers(p: Profile, patch: Partial<Profile>, workKnown: boolean): Profile {
  const next: Profile = { ...p, ...patch };
  const workSet = workKnown || patch.workIncome !== undefined;
  if (!workSet && (patch.income !== undefined || patch.age !== undefined)) next.workIncome = assumedWork(next.age, next.income);
  if (workSet && (patch.income !== undefined || patch.workIncome !== undefined)) next.workIncome = Math.min(next.workIncome, next.income);
  return next;
}

const PROFILE_KEYS = [
  'household',
  'age',
  'childrenUnder6',
  'children6to17',
  'income',
  'workIncome',
  'disability',
  'childDisability',
  'jobLoss',
  'jobEarnings',
  'student',
  'dentalInsurance',
  'yearsInCanada',
  'province',
] as const satisfies readonly (keyof Profile)[];

/** Whether two sets of answers are the same (the saved ones and the ones on screen). */
export const sameProfile = (a: Profile, b: Profile) => PROFILE_KEYS.every((k) => a[k] === b[k]);
