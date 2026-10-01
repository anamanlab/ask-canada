/** Lab fixtures for the `taxes` widget: every tool, every state and the important edge cases. */
import type { Fixture, WidgetPart } from '@/lib/widgets/types';
import { buildDeadlines, buildEstimate, buildFreeFiling, buildRefund, buildRoom } from './build';
import { estimate } from './calc/estimate';
import { startWhatIf, whatIfDelta, whatIfKey } from './calc/what-if';
import { incomeAndTaxIn } from './parse';

const TODAY = '2026-09-30';
let n = 0;
const part = (toolName: string, input: unknown, output: unknown, state: WidgetPart['state'] = 'output-available', extra: Partial<WidgetPart> = {}): WidgetPart => ({
  type: `tool-${toolName}`,
  toolCallId: `fx-taxes-${++n}`,
  state,
  input: input as WidgetPart['input'],
  output: state === 'output-available' ? output : undefined,
  ...extra,
});

const dl = (i: Parameters<typeof buildDeadlines>[0], today = TODAY) => part('taxesDeadlines', i, buildDeadlines(i, today));
const est = (i: Parameters<typeof buildEstimate>[0]) => {
  const out = buildEstimate(i);
  const e = out.estimate;
  // Every displayed triple must add up in whole dollars: deducted − tax = refund (or −owing), federal + provincial = total.
  const tax = e.input.province === 'QC' ? e.federal : e.total;
  const ok =
    [e.federal, e.total, e.provincial ?? 0, e.balance ?? 0].every(Number.isInteger) &&
    (e.provincial == null || e.federal + e.provincial === e.total) &&
    (e.balance == null || Math.round(e.input.taxDeducted ?? 0) - tax === e.balance);
  if (!ok) throw new Error(`taxes fixture: estimate figures don't add up for ${JSON.stringify(i)}`);
  return part('taxesEstimator', i, out);
};
const room = (i: Parameters<typeof buildRoom>[0]) => part('taxesSavingsRoom', i, buildRoom(i));
const free = (i: Parameters<typeof buildFreeFiling>[0]) => part('taxesFreeFiling', i, buildFreeFiling(i));
const ref = (i: Parameters<typeof buildRefund>[0], today = TODAY) => part('taxesRefundStatus', i, buildRefund(i, today));

// The scripted answers read the tax deducted out of the question: both word orders, English and French, must
// reach the estimator (a miss leaves "Income tax deducted" empty although the person gave the number).
const SAID: [string, number, number][] = [
  ['I made $65,000 in Ontario and $10,400 was deducted. Will I get a refund?', 65_000, 10_400],
  ['I made $65,000 in Ontario and my employer deducted $10,400. Will I get a refund?', 65_000, 10_400],
  ['I earned 65k in BC and paid $10,400 in tax. Do I owe?', 65_000, 10_400],
  ['J’ai gagné 65 000 $ au Québec et 10 400 $ d’impôt ont été retenus. Vais-je recevoir un remboursement?', 65_000, 10_400],
  ['J’ai gagné 65 000 $ en Ontario et mon employeur a retenu 10 400 $. Vais-je recevoir un remboursement?', 65_000, 10_400],
  ['J’ai gagné 65 000 $ et j’ai payé 10 400 $ d’impôt. Est-ce que je vais devoir payer?', 65_000, 10_400],
];
for (const [text, income, tax] of SAID) {
  const got = incomeAndTaxIn(text);
  if (got.employmentIncome !== income || got.taxDeducted !== tax) throw new Error(`taxes fixture: "${text}" read as ${JSON.stringify(got)}`);
}

// "Try +$1,000" then another edit: the confirmation is for the RRSP alone, so it is withdrawn once the
// province (or any other entry) changes instead of crediting the RRSP with the whole difference.
{
  const figures = (province: 'ON' | 'QC', rrsp: number) => {
    const e = estimate({ province, employmentIncome: 65_000, otherIncome: 0, rrsp, fhsa: 0, taxDeducted: 10_400 });
    return { balance: e.balance, owed: province === 'QC' ? e.federal : e.total };
  };
  const key = (province: 'ON' | 'QC') => whatIfKey({ province, picked: true, emp: 65_000, other: null, fhsa: null, deducted: 10_400 });
  const tried = startWhatIf(1000, key('ON'), figures('ON', 0));
  const after = whatIfDelta(tried, { rrsp: 1000, key: key('ON'), ...figures('ON', 1000) });
  const moved = whatIfDelta(tried, { rrsp: 1000, key: key('QC'), ...figures('QC', 1000) });
  if (after?.kind !== 'refund' || after.amount !== 297) throw new Error(`taxes fixture: +$1,000 RRSP in Ontario at $65,000 should read "refund up $297", got ${JSON.stringify(after)}`);
  if (moved !== null) throw new Error('taxes fixture: the RRSP what-if note must clear once the province changes');
}

// Clinic limits past five people, the contact-the-CRA boundary and the un-rolled FHSA date (Dec 31, 2028 is a Sunday).
const big = buildFreeFiling({ familySize: 8, familyIncome: 82_000 });
const day84 = buildRefund({ filedOn: '2026-07-08', method: 'online' }, '2026-09-30');
const fhsa2028 = buildDeadlines({}, '2028-09-30').deadlines.find((x) => x.kind === 'fhsa');
if (big.threshold !== 85_000 || big.clinic !== 'yes') throw new Error('taxes fixture: clinic limit for 8 people should be $85,000');
if (day84.elapsedDays !== 84 || day84.stage !== 'late') throw new Error('taxes fixture: day 84 still waits (contact the CRA after that date)');
if (fhsa2028?.onTimeBy !== '2028-12-31' || fhsa2028.rolled) throw new Error('taxes fixture: the FHSA date never rolls to January');

const fixtures: Fixture[] = [
  // ── Deadlines
  { name: 'Deadlines · streaming (skeleton)', toolName: 'taxesDeadlines', part: part('taxesDeadlines', {}, null, 'input-streaming') },
  { name: 'Deadlines · countdown to April 30, 2027 (hero case)', toolName: 'taxesDeadlines', part: dl({}), note: 'Today 2026-09-30: the 2026 return. Next up is the Dec 31 FHSA date (the Dec 15 instalment only applies to some).' },
  { name: 'Deadlines · self-employed (June 15)', toolName: 'taxesDeadlines', part: dl({ selfEmployed: true }) },
  { name: 'Deadlines · RRSP focus (countdown to March 1, 2027)', toolName: 'taxesDeadlines', part: dl({ focus: 'rrsp' }), note: 'From “When is the RRSP deadline?”: the hero counts down to the RRSP date.' },
  { name: 'Deadlines · RRSP focus after the RRSP date (falls back to April 30)', toolName: 'taxesDeadlines', part: dl({ focus: 'rrsp' }, '2027-03-10') },
  {
    name: 'Deadlines · mid-season, some dates passed (March 10, 2027)',
    toolName: 'taxesDeadlines',
    part: dl({}, '2027-03-10'),
    note: 'Instalment, FHSA and RRSP dates are shown as passed.',
  },
  {
    name: 'Deadlines · weekend rollover (2025 return, seen Feb 2026)',
    toolName: 'taxesDeadlines',
    part: dl({}, '2026-02-10'),
    note: 'The RRSP deadline (March 1, 2026, a Sunday) rolls to Monday, March 2 — as on canada.ca.',
  },
  { name: 'Deadlines · French answer in an English interface', toolName: 'taxesDeadlines', part: dl({ lang: 'fr' }) },
  { name: 'Deadlines · error', toolName: 'taxesDeadlines', part: part('taxesDeadlines', {}, null, 'output-error', { errorText: 'Timeout' }) },

  // ── Estimator
  { name: 'Estimator · input ready (skeleton)', toolName: 'taxesEstimator', part: part('taxesEstimator', { province: 'ON' }, null, 'input-available') },
  {
    name: 'Estimator · Ontario $65,000, refund',
    toolName: 'taxesEstimator',
    part: est({ province: 'ON', employmentIncome: 65_000, taxDeducted: 10_400 }),
    note: 'Deducted $10,400 − tax $9,726 = refund $674: whole dollars first, so the three figures always add up (asserted for every estimator fixture).',
  },
  { name: 'Estimator · BC $48,000 + RRSP, balance owing', toolName: 'taxesEstimator', part: est({ province: 'BC', employmentIncome: 48_000, otherIncome: 6_000, rrspContribution: 2_000, taxDeducted: 5_100 }) },
  { name: 'Estimator · Alberta $120,000, tax deducted unknown', toolName: 'taxesEstimator', part: est({ province: 'AB', employmentIncome: 120_000 }) },
  {
    name: 'Estimator · Quebec (federal only + abatement)',
    toolName: 'taxesEstimator',
    part: est({ province: 'QC', employmentIncome: 58_000, taxDeducted: 5_200 }),
  },
  { name: 'Estimator · high income, top brackets (Manitoba $310,000)', toolName: 'taxesEstimator', part: est({ province: 'MB', employmentIncome: 310_000, taxDeducted: 99_000 }) },
  {
    name: 'Estimator · $3,000,000 (long number, mobile)',
    toolName: 'taxesEstimator',
    part: est({ province: 'ON', employmentIncome: 3_000_000 }),
    note: 'A ten-character result ("$1,5…") must stay clear of the average-rate ring at 360–390px: the number steps down to fit.',
  },
  { name: 'Estimator · nothing entered yet', toolName: 'taxesEstimator', part: est({}) },
  { name: 'Estimator · income but no province yet (federal only)', toolName: 'taxesEstimator', part: est({ employmentIncome: 52_000, taxDeducted: 6_900 }) },
  { name: 'Estimator · error', toolName: 'taxesEstimator', part: part('taxesEstimator', {}, null, 'output-error', { errorText: 'Upstream error' }) },

  // ── Savings room
  { name: 'Savings room · streaming (skeleton)', toolName: 'taxesSavingsRoom', part: part('taxesSavingsRoom', { focus: 'tfsa' }, null, 'input-streaming') },
  { name: 'Savings room · TFSA, born 1990, $42,500 in', toolName: 'taxesSavingsRoom', part: room({ focus: 'tfsa', birthYear: 1990, tfsaContributed: 42_500 }) },
  { name: 'Savings room · TFSA, newcomer since 2021', toolName: 'taxesSavingsRoom', part: room({ focus: 'tfsa', birthYear: 1994, residentSince: 2021 }) },
  { name: 'Savings room · TFSA, no birth year yet', toolName: 'taxesSavingsRoom', part: room({ focus: 'tfsa' }) },
  { name: 'Savings room · TFSA, turns 18 next year', toolName: 'taxesSavingsRoom', part: room({ focus: 'tfsa', birthYear: 2009 }) },
  { name: 'Savings room · RRSP, $82,000 earned', toolName: 'taxesSavingsRoom', part: room({ focus: 'rrsp', earnedIncome: 82_000 }) },
  { name: 'Savings room · RRSP at the maximum', toolName: 'taxesSavingsRoom', part: room({ focus: 'rrsp', earnedIncome: 240_000 }) },
  { name: 'Savings room · FHSA opened 2024, $8,000 in', toolName: 'taxesSavingsRoom', part: room({ focus: 'fhsa', fhsaOpenedYear: 2024, fhsaContributed: 8_000 }) },
  { name: 'Savings room · FHSA not opened yet', toolName: 'taxesSavingsRoom', part: room({ focus: 'fhsa' }) },
  { name: 'Savings room · error', toolName: 'taxesSavingsRoom', part: part('taxesSavingsRoom', {}, null, 'output-error') },

  // ── Free filing
  { name: 'Free filing · single, $32,000 in Ontario (clinic yes)', toolName: 'taxesFreeFiling', part: free({ province: 'ON', familySize: 1, familyIncome: 32_000 }) },
  { name: 'Free filing · family of 4, $78,000 (over the limit)', toolName: 'taxesFreeFiling', part: free({ province: 'NS', familySize: 4, familyIncome: 78_000 }) },
  { name: 'Free filing · rental income (complex)', toolName: 'taxesFreeFiling', part: free({ province: 'BC', familySize: 2, familyIncome: 50_000, complex: ['rental'] }) },
  { name: 'Free filing · Quebec (volunteer program)', toolName: 'taxesFreeFiling', part: free({ province: 'QC', familySize: 2, familyIncome: 41_000 }) },
  {
    name: 'Free filing · family of 8, $82,000 (exact size past 6)',
    toolName: 'taxesFreeFiling',
    part: free({ province: 'MB', familySize: 8, familyIncome: 82_000 }),
    note: '6+ opens the exact count: the suggested limit for 8 people is $85,000 ($70,000 + 3 × $5,000), so the clinic is a yes.',
  },
  { name: 'Free filing · nothing known yet', toolName: 'taxesFreeFiling', part: free({}) },
  { name: 'Free filing · streaming (skeleton)', toolName: 'taxesFreeFiling', part: part('taxesFreeFiling', {}, null, 'input-streaming') },
  { name: 'Free filing · error', toolName: 'taxesFreeFiling', part: part('taxesFreeFiling', {}, null, 'output-error') },

  // ── Refund status (the CRA's 2-week / 12-week goals only cover returns filed by the due date)
  {
    name: 'Refund · filed online on time, 6 days ago (on track)',
    toolName: 'taxesRefundStatus',
    part: ref({ filedOn: '2026-04-10', method: 'online' }, '2026-04-16'),
    note: 'Seen April 16, 2026: a 2025 return filed April 10, before the April 30 deadline.',
  },
  { name: 'Refund · on time online, 3 weeks ago (past the window)', toolName: 'taxesRefundStatus', part: ref({ filedOn: '2026-04-01', method: 'online' }, '2026-04-22') },
  { name: 'Refund · paper, on time, 5 weeks ago', toolName: 'taxesRefundStatus', part: ref({ filedOn: '2026-03-20', method: 'paper' }, '2026-04-24') },
  {
    name: 'Refund · late return, filed online 3 weeks ago (no service standard)',
    toolName: 'taxesRefundStatus',
    part: ref({ filedOn: '2026-09-09', method: 'online' }),
    note: 'Filed September 9, 2026, after the April 30 deadline: no "expected by" date, contact after 12 weeks.',
  },
  {
    name: 'Refund · self-employed, filed May 20 (on time by their answer)',
    toolName: 'taxesRefundStatus',
    part: ref({ filedOn: '2026-05-20', method: 'online', onTime: true }, '2026-05-27'),
  },
  { name: 'Refund · late paper, 14 weeks ago (contact the CRA)', toolName: 'taxesRefundStatus', part: ref({ filedOn: '2026-06-20', method: 'paper' }) },
  { name: 'Refund · date not given yet', toolName: 'taxesRefundStatus', part: ref({}) },
  {
    name: 'Refund · French answer in an English interface',
    toolName: 'taxesRefundStatus',
    part: ref({ filedOn: '2026-09-09', method: 'online', lang: 'fr' }),
    note: 'The widget follows the answer language (input.lang), not the interface.',
  },
  { name: 'Refund · streaming (skeleton)', toolName: 'taxesRefundStatus', part: part('taxesRefundStatus', {}, null, 'input-streaming') },
  { name: 'Refund · input with a date (skeleton)', toolName: 'taxesRefundStatus', part: part('taxesRefundStatus', { filedOn: '2026-09-09', method: 'online' }, null, 'input-available') },
  { name: 'Refund · error', toolName: 'taxesRefundStatus', part: part('taxesRefundStatus', {}, null, 'output-error') },
];

export default fixtures;
