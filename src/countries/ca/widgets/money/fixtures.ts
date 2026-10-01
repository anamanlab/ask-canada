/** Lab fixtures for the `money` widget: every state and the important edge cases. See docs/WIDGET_GUIDE.md. */
import { parseLocaleNumber } from '@/lib/i18n/number';
import type { Fixture, WidgetPart } from '@/lib/widgets/types';
import { buildBudget, buildCompare, buildMortgage, buildResp } from './build';
import type { LiveRates } from './rates';

const TODAY = '2026-10-01';
let n = 0;
const part = (toolName: string, output: unknown, state: WidgetPart['state'] = 'output-available', input: unknown = {}, extra: Partial<WidgetPart> = {}): WidgetPart => ({
  type: `tool-${toolName}`,
  toolCallId: `fx-money-${++n}`,
  state,
  input,
  output: state === 'output-available' ? output : undefined,
  ...extra,
});

/** The Bank of Canada values observed on 2026-09-30 (the tool fetches them live). */
const RATES: LiveRates = {
  live: true,
  posted5y: { value: 6.09, date: '2026-09-23' },
  policy: { value: 2.25, date: '2026-09-28' },
  prime: { value: 4.45, date: '2026-09-23' },
};

/**
 * French typing check: the fields parse with parseLocaleNumber, so a dot typed on a French keyboard is a decimal
 * ("4.2" was once read as 42). The lab note shows each result and flags any mismatch. The mortgage's money
 * fields are whole dollars (`cents={false}`), like every figure the widget prints: "95000.50" is parsed as
 * 95000.5 and the field then keeps the rounded dollar amount.
 */
const FR_TYPED: [string, number][] = [
  ['4.2', 4.2],
  ['4,2', 4.2],
  ['95 000', 95000],
  ['95000.50', 95000.5],
];
const fr = (raw: string) => parseLocaleNumber(raw, 'fr-CA') ?? undefined;
const frTypingNote = `fr-CA: ${FR_TYPED.map(([raw]) => `“${raw}” → ${fr(raw)}`).join(' · ')}${FR_TYPED.every(([raw, want]) => fr(raw) === want) ? ' (all as expected)' : ' — MISMATCH'}`;

const fixtures: Fixture[] = [
  /* ── RESP ── */
  { name: 'RESP · streaming (skeleton)', toolName: 'moneyRespPlanner', part: part('moneyRespPlanner', null, 'input-streaming', { childAge: 2 }) },
  {
    name: 'RESP · input available (skeleton of the chat question)',
    toolName: 'moneyRespPlanner',
    part: part('moneyRespPlanner', null, 'input-available', { childAge: 3, annual: 1200 }),
    note: 'The skeleton takes its height from the planner laid out unseen for this input: it must be exactly as tall as the “age 3, $100 a month” fixture below, in English and in French.',
  },
  {
    name: 'RESP · newborn, $2,500 a year (hero case)',
    toolName: 'moneyRespPlanner',
    part: part('moneyRespPlanner', buildResp({ childAge: 0, annual: 2500 }, TODAY)),
    note: 'Full $500 grant every year until the $7,200 lifetime maximum, reached at 14 (marked on the chart); 3% growth assumption.',
  },
  {
    name: 'RESP · lower income, age 6: Canada Learning Bond + catch-up',
    toolName: 'moneyRespPlanner',
    part: part('moneyRespPlanner', buildResp({ childAge: 6, annual: 1200, familyIncome: 48000, children: 2 }, TODAY)),
    note: 'CLB is retroactive: $500 + $100 for each past year of eligibility. Additional 20% on the first $500.',
  },
  {
    name: 'RESP · age 3, $100 a month, income not given (the chat question)',
    toolName: 'moneyRespPlanner',
    part: part('moneyRespPlanner', buildResp({ childAge: 3, annual: 1200 }, TODAY)),
    note: 'Grant $3,600 by the end of 2040; $1,500 of unused room from past years (catch up with $5,000 in a year).',
  },
  {
    name: 'RESP · middle income, $100 a month (under the full grant)',
    toolName: 'moneyRespPlanner',
    part: part('moneyRespPlanner', buildResp({ childAge: 3, annual: 1200, incomeTier: 'middle', lang: 'en' }, TODAY)),
  },
  {
    name: 'RESP · income exactly $58,523 (10% additional grant band, still Learning Bond eligible)',
    toolName: 'moneyRespPlanner',
    part: part('moneyRespPlanner', buildResp({ childAge: 1, annual: 2500, familyIncome: 58523, children: 1 }, TODAY)),
    note: 'ESDC Table 2: 20% is for income less than $58,523; the CLB limit for 1–3 children is “less than or equal to $58,523”.',
  },
  {
    name: 'RESP · 4 children, middle band (asks whether income is under the $66,036 Learning Bond limit)',
    toolName: 'moneyRespPlanner',
    part: part('moneyRespPlanner', buildResp({ childAge: 2, annual: 1200, incomeTier: 'middle', children: 4 }, TODAY)),
    note: 'The bond limit for 4 children ($66,036) and 5 ($73,577) sits inside the middle band: the family-size control and a switch settle it. More than 5: call 1 800 O-Canada.',
  },
  {
    name: 'RESP · age 16, new plan (grant condition not met)',
    toolName: 'moneyRespPlanner',
    part: part('moneyRespPlanner', buildResp({ childAge: 16, annual: 2500 }, TODAY)),
  },
  { name: 'RESP · error', toolName: 'moneyRespPlanner', part: part('moneyRespPlanner', null, 'output-error', {}, { errorText: 'Upstream timeout' }) },

  /* ── TFSA vs RRSP vs FHSA ── */
  { name: 'Accounts · input available (skeleton)', toolName: 'moneyAccountCompare', part: part('moneyAccountCompare', null, 'input-available', { goal: 'home', firstHome: true, age: 30 }) },
  {
    name: 'Accounts · no tax rates given (same example rate now and later → TFSA and RRSP tie)',
    toolName: 'moneyAccountCompare',
    part: part('moneyAccountCompare', buildCompare({ lang: 'fr' })),
    note: 'The chat question “Devrais-je utiliser un CELI ou un REER?”: no verdict from invented rates.',
  },
  {
    name: 'Accounts · first home, 30 years old (FHSA wins)',
    toolName: 'moneyAccountCompare',
    part: part('moneyAccountCompare', buildCompare({ goal: 'home', firstHome: true, age: 30 })),
  },
  {
    name: 'Accounts · first home in 20 years: FHSA must close within 15, RRSP through the Home Buyers’ Plan',
    toolName: 'moneyAccountCompare',
    part: part('moneyAccountCompare', buildCompare({ goal: 'home', firstHome: true, age: 25, years: 20, rateNow: 30, rateLater: 30 })),
    note: 'CRA: an FHSA closes by the end of the year of its 15th anniversary. The HBP withdrawal isn’t taxed but is repaid over 15 years.',
  },
  {
    name: 'Accounts · retirement, higher rate now (RRSP wins)',
    toolName: 'moneyAccountCompare',
    part: part('moneyAccountCompare', buildCompare({ goal: 'retirement', rateNow: 43, rateLater: 30 })),
  },
  {
    name: 'Accounts · low income now (TFSA wins), already a home owner',
    toolName: 'moneyAccountCompare',
    part: part('moneyAccountCompare', buildCompare({ goal: 'anything', firstHome: false, rateNow: 20, rateLater: 30, years: 10 })),
  },
  { name: 'Accounts · error', toolName: 'moneyAccountCompare', part: part('moneyAccountCompare', null, 'output-error', {}, { errorText: 'Bad input' }) },

  /* ── Mortgage stress test ── */
  { name: 'Mortgage · streaming (skeleton)', toolName: 'moneyMortgageStressTest', part: part('moneyMortgageStressTest', null, 'input-streaming', { income: 120000 }) },
  {
    name: 'Mortgage · input available (skeleton of the rough check)',
    toolName: 'moneyMortgageStressTest',
    part: part('moneyMortgageStressTest', null, 'input-available', { income: 120000, price: 600000, downPayment: 60000 }),
  },
  {
    name: 'Mortgage · $120k income, $600k home, 10% down: just misses',
    toolName: 'moneyMortgageStressTest',
    part: part(
      'moneyMortgageStressTest',
      buildMortgage({ income: 120000, price: 600000, downPayment: 60000, rate: 4.2, amortization: 30, propertyTax: 4800, heating: 120, firstTimeBuyer: true }, RATES),
    ),
    note: 'Qualifying rate 6.20% (4.20% + 2). CMHC premium 3.10% + 0.20% for 30 years.',
  },
  {
    name: 'Mortgage · passes, 20% down, no insurance',
    toolName: 'moneyMortgageStressTest',
    part: part('moneyMortgageStressTest', buildMortgage({ income: 165000, price: 750000, downPayment: 150000, rate: 3.99, propertyTax: 5200, heating: 140, debts: 350 }, RATES)),
  },
  {
    name: 'Mortgage · rough check: no rate, no property tax or heating (maybe, not a pass)',
    toolName: 'moneyMortgageStressTest',
    part: part('moneyMortgageStressTest', buildMortgage({ income: 120000, price: 600000, downPayment: 60000 }, RATES)),
    note: 'The chat question “$600,000 on $120,000 with 10% down”: tested at the 5.25% floor, so a pass would only be a maybe.',
  },
  {
    name: 'Mortgage · fails even at the lowest test rate (no rate given)',
    toolName: 'moneyMortgageStressTest',
    part: part('moneyMortgageStressTest', buildMortgage({ income: 90000, price: 650000, downPayment: 65000, propertyTax: 4200 }, RATES)),
  },
  {
    name: 'Mortgage · down payment too small, no rate, costs missing',
    toolName: 'moneyMortgageStressTest',
    part: part('moneyMortgageStressTest', buildMortgage({ income: 95000, price: 650000, downPayment: 25000 }, RATES)),
  },
  {
    name: 'Mortgage · French typing: “4.2” is a decimal, “95 000” is whole dollars',
    toolName: 'moneyMortgageStressTest',
    part: part(
      'moneyMortgageStressTest',
      buildMortgage({ income: fr('95 000'), price: 450000, downPayment: 45000, rate: fr('4.2'), propertyTax: 3600, heating: 110, lang: 'fr' }, RATES),
    ),
    note: frTypingNote,
  },
  { name: 'Mortgage · no numbers yet', toolName: 'moneyMortgageStressTest', part: part('moneyMortgageStressTest', buildMortgage({}, RATES)) },
  {
    name: 'Mortgage · no numbers yet, live rates unavailable (fallback)',
    toolName: 'moneyMortgageStressTest',
    part: part('moneyMortgageStressTest', buildMortgage({ lang: 'en' })),
  },
  { name: 'Mortgage · error', toolName: 'moneyMortgageStressTest', part: part('moneyMortgageStressTest', null, 'output-error', {}, { errorText: 'Upstream timeout' }) },

  /* ── Budget ── */
  { name: 'Budget · input available (skeleton)', toolName: 'moneyBudgetPlanner', part: part('moneyBudgetPlanner', null, 'input-available', {}) },
  {
    name: 'Budget · input available (skeleton of the chat question)',
    toolName: 'moneyBudgetPlanner',
    part: part('moneyBudgetPlanner', null, 'input-available', { income: 4200, expenses: { housing: 1500, food: 600 } }),
  },
  {
    name: 'Budget · pay, rent and groceries (the chat question)',
    toolName: 'moneyBudgetPlanner',
    part: part('moneyBudgetPlanner', buildBudget({ income: 4200, expenses: { housing: 1500, food: 600 } })),
    note: '“Je gagne 4 200 $ par mois, loyer 1 500 $, épicerie 600 $”: every amount the person gave is filled in.',
  },
  {
    name: 'Budget · money left over, building an emergency fund',
    toolName: 'moneyBudgetPlanner',
    part: part(
      'moneyBudgetPlanner',
      buildBudget({ income: 5200, expenses: { housing: 2100, utilities: 180, food: 700, transport: 450, debt: 300, phone: 120, personal: 250 }, savings: 300, emergencySaved: 2000 }),
    ),
  },
  {
    name: 'Budget · spending more than income',
    toolName: 'moneyBudgetPlanner',
    part: part('moneyBudgetPlanner', buildBudget({ income: 3400, expenses: { housing: 1850, food: 650, transport: 420, debt: 380, phone: 110, childcare: 300 } })),
  },
  { name: 'Budget · empty (nothing entered yet)', toolName: 'moneyBudgetPlanner', part: part('moneyBudgetPlanner', buildBudget({})) },
  { name: 'Budget · error', toolName: 'moneyBudgetPlanner', part: part('moneyBudgetPlanner', null, 'output-error', {}, { errorText: 'Upstream timeout' }) },
];

export default fixtures;
