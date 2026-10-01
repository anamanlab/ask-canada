/** Lab fixtures for the `business` widget: every tool, every state and the important edge cases. */
import type { Fixture, WidgetPart } from '@/lib/widgets/types';
import {
  buildFunding,
  buildIncorporate,
  buildRegistration,
  buildStructure,
  buildTrade,
  type FundingInput,
  type IncorporateInput,
  type RegistrationInput,
  type StructureInput,
  type TradeInput,
} from './build';
import type { FxRates } from './build';

const TODAY = '2026-09-30';
/** Bank of Canada daily rates for 2026-09-29 (as returned by the Valet API). */
const FX: FxRates = {
  date: '2026-09-29',
  rates: { USD: 1.4188, EUR: 1.6084, GBP: 1.8758, CNY: 0.2117, MXN: 0.07867, JPY: 0.00901, INR: 0.01478, KRW: 0.001047 },
};

let n = 0;
const part = (toolName: string, input: unknown, output: unknown, state: WidgetPart['state'] = 'output-available', extra: Partial<WidgetPart> = {}): WidgetPart => ({
  type: `tool-${toolName}`,
  toolCallId: `fx-business-${++n}`,
  state,
  input: input as WidgetPart['input'],
  output: state === 'output-available' ? output : undefined,
  ...extra,
});
/** Pinned to the fixture's date, so tenses and “this quarter” don't drift with the day the lab is opened. */
const regOn = (input: RegistrationInput, today: string, pinToday = true) => ({ ...buildRegistration(input, today), pinToday });
const reg = (input: RegistrationInput, state?: WidgetPart['state']) => part('businessRegistration', input, regOn(input, TODAY), state);
const str = (input: StructureInput, state?: WidgetPart['state']) => part('businessStructure', input, buildStructure(input), state);
const inc = (input: IncorporateInput, state?: WidgetPart['state']) => part('businessIncorporate', input, buildIncorporate(input), state);
const fund = (input: FundingInput, state?: WidgetPart['state']) => part('businessFunding', input, buildFunding(input), state);
const trade = (input: TradeInput, fx: FxRates | null = FX, state?: WidgetPart['state']) => part('businessTrade', input, buildTrade(input, fx), state);

const fixtures: Fixture[] = [
  // GST/HST + business number
  { name: 'GST/HST check: streaming (skeleton)', toolName: 'businessRegistration', part: reg({}, 'input-streaming') },
  {
    name: 'GST/HST check: over $30,000 across four quarters (hero case)',
    toolName: 'businessRegistration',
    part: reg({ quarterlySales: [6200, 7400, 8900, 9800], province: 'ON', lang: 'en' }),
    note: 'Total $32,300: stops being a small supplier at the end of the month after the quarter it went over (Oct 31, 2026).',
  },
  {
    name: 'GST/HST check: small supplier with room left (Etsy seller in B.C.)',
    toolName: 'businessRegistration',
    part: reg({ annualSales: 18000, province: 'BC' }),
    note: 'Yearly figure spread across the quarters (the current one by days elapsed); BC shows the 7% PST line.',
  },
  {
    name: 'GST/HST check: $45,000 a year in Ontario (yearly figure, no invented date)',
    toolName: 'businessRegistration',
    part: reg({ annualSales: 45000, province: 'ON' }),
    note: 'A yearly figure can’t show which quarter went over: the hero says “must register” and asks for real quarters instead of stating a date.',
  },
  {
    name: 'GST/HST check: $45,000 a year, asked on the first day of a quarter',
    toolName: 'businessRegistration',
    part: part('businessRegistration', { annualSales: 45000, province: 'ON' }, regOn({ annualSales: 45000, province: 'ON' }, '2026-10-01')),
    note: 'The yearly figure goes to the three quarters that have ended; Oct–Dec 2026 is a day old, so it stays empty.',
  },
  {
    name: 'GST/HST check: over $30,000 in one quarter that has ended',
    toolName: 'businessRegistration',
    part: reg({ quarterlySales: [4000, 5200, 31500, 2000], employees: true, province: 'NS' }),
    note: 'Apr–Jun 2026 is over: the hero speaks in the past tense (the 29 days ran from the sale that went over).',
  },
  {
    name: 'GST/HST check: over $30,000 in the current quarter (29 days still running)',
    toolName: 'businessRegistration',
    part: reg({ quarterlySales: [4000, 5200, 6000, 30001], province: 'SK' }),
  },
  {
    name: 'GST/HST check: exactly at the $30,000 limit',
    toolName: 'businessRegistration',
    part: reg({ quarterlySales: [7500, 7500, 7500, 7500], province: 'AB' }),
    note: '“Exceed” is strict: still a small supplier, and the hero says the next sale goes over instead of “$0 more”.',
  },
  { name: 'GST/HST check: rideshare driver (must register)', toolName: 'businessRegistration', part: reg({ annualSales: 9000, rideshare: true, province: 'AB' }) },
  { name: 'GST/HST check: no sales given yet', toolName: 'businessRegistration', part: reg({}) },
  {
    name: 'GST/HST check: Quebec corporation that imports (Revenu Québec)',
    toolName: 'businessRegistration',
    part: reg({ quarterlySales: [22000, 26000, 30000, 28000], incorporated: true, trade: true, employees: true, province: 'QC' }),
  },
  { name: 'GST/HST check: charity ($50,000 test)', toolName: 'businessRegistration', part: reg({ org: 'charity', quarterlySales: [9000, 12000, 11000, 8000], province: 'MB' }) },
  {
    name: 'GST/HST check: answer from March 2026, reopened today',
    toolName: 'businessRegistration',
    part: part('businessRegistration', { quarterlySales: [6200, 7400, 8900, 9800], province: 'ON' }, regOn({ quarterlySales: [6200, 7400, 8900, 9800], province: 'ON' }, '2026-03-10', false)),
    note: 'Not pinned: the device date decides the tense (the April 30, 2026 date has passed), no quarter is marked “this quarter”, and a line says the quarters are from when the question was asked.',
  },
  { name: 'GST/HST check: error', toolName: 'businessRegistration', part: reg({}, 'output-error') },

  // Structures
  { name: 'Structure: input available (skeleton)', toolName: 'businessStructure', part: str({ owners: 'solo' }, 'input-available') },
  { name: 'Structure: solo, keep it simple', toolName: 'businessStructure', part: str({ owners: 'solo', priorities: ['simple'] }) },
  { name: 'Structure: solo, protect assets + one name across Canada', toolName: 'businessStructure', part: str({ owners: 'solo', priorities: ['protect', 'name'] }) },
  { name: 'Structure: with partners, raising money', toolName: 'businessStructure', part: str({ owners: 'partners', priorities: ['invest', 'protect'] }) },
  { name: 'Structure: error', toolName: 'businessStructure', part: str({}, 'output-error') },

  // Federal incorporation
  { name: 'Incorporation: streaming (skeleton)', toolName: 'businessIncorporate', part: inc({}, 'input-streaming') },
  { name: 'Incorporation: numbered, no provinces yet', toolName: 'businessIncorporate', part: inc({}) },
  {
    name: 'Incorporation: word name, express, operating in 4 provinces',
    toolName: 'businessIncorporate',
    part: inc({ nameType: 'word', express: true, provinces: ['ON', 'QC', 'BC', 'PE'] }),
    note: 'All three registration routes: bundled (ON), partner (QC, BC), registrar (PE).',
  },
  { name: 'Incorporation: error', toolName: 'businessIncorporate', part: inc({}, 'output-error') },

  // Funding
  { name: 'Funding: restaurant in Manitoba (start-up)', toolName: 'businessFunding', part: fund({ province: 'MB', need: 'start' }) },
  { name: 'Funding: Ontario exporter hit by tariffs (two agencies)', toolName: 'businessFunding', part: fund({ province: 'ON', need: 'tariffs' }) },
  { name: 'Funding: exporting from Quebec (Trade Commissioner Service first, CanExport closed)', toolName: 'businessFunding', part: fund({ province: 'QC', need: 'export' }) },
  { name: 'Funding: no province given', toolName: 'businessFunding', part: fund({ need: 'innovate' }) },
  { name: 'Funding: loading (skeleton)', toolName: 'businessFunding', part: fund({}, 'input-available') },
  { name: 'Funding: Manitoba, loading (skeleton with the agency card)', toolName: 'businessFunding', part: fund({ province: 'MB', need: 'start' }, 'input-available') },

  // Import / export
  {
    name: 'Trade: import from the U.S. with live exchange rate',
    toolName: 'businessTrade',
    part: trade({ direction: 'import', amount: 2500, currency: 'USD', origin: 'us', dutyRate: 6.5 }),
    note: 'Bank of Canada rate from Sep 29, 2026; duty and GST calculated the way the CBSA example does.',
  },
  {
    name: 'Trade: import, nothing given yet (asks for the invoice)',
    toolName: 'businessTrade',
    part: trade({ direction: 'import' }),
    note: 'No amount, currency or origin stated: one prompt row instead of empty tiles, USD only as the field default, and the neutral tariff notice.',
  },
  { name: 'Trade: import invoiced in Canadian dollars (no exchange rate line)', toolName: 'businessTrade', part: trade({ direction: 'import', amount: 9000, currency: 'CAD', dutyRate: 5 }) },
  { name: 'Trade: import from China, duty rate unknown', toolName: 'businessTrade', part: trade({ direction: 'import', amount: 48000, currency: 'CNY', origin: 'other' }) },
  {
    name: 'Trade: import from China invoiced in U.S. dollars (neutral tariff notice)',
    toolName: 'businessTrade',
    part: trade({ direction: 'import', amount: 2500, currency: 'USD', origin: 'other', dutyRate: 6.5 }),
    note: 'A U.S.-dollar invoice is not a U.S. origin: no counter-tariff notice, and choosing USD in the field never shows it.',
  },
  {
    name: 'Trade: import, live rates unavailable (fallback)',
    toolName: 'businessTrade',
    part: trade({ direction: 'import', amount: 3200, currency: 'USD', dutyRate: 8 }, null),
    note: 'The US$3,200 invoice is never treated as Canadian dollars: the field is cleared and the notice asks for the converted amount.',
  },
  { name: 'Trade: export $12,000 to Germany (declaration required)', toolName: 'businessTrade', part: trade({ direction: 'export', destination: 'other', value: 12000 }) },
  { name: 'Trade: export, no value given yet (asks for it)', toolName: 'businessTrade', part: trade({ direction: 'export' }) },
  { name: 'Trade: export to the U.S. (no declaration)', toolName: 'businessTrade', part: trade({ direction: 'export', destination: 'us', value: 40000 }) },
  { name: 'Trade: controlled goods to the U.S. (permit)', toolName: 'businessTrade', part: trade({ direction: 'export', destination: 'us', restricted: true, value: 5000 }) },
  { name: 'Trade: import streaming (skeleton)', toolName: 'businessTrade', part: trade({ direction: 'import', amount: 2500, currency: 'USD' }, FX, 'input-streaming') },
  { name: 'Trade: export loading (skeleton)', toolName: 'businessTrade', part: trade({ direction: 'export', destination: 'other', value: 12000 }, FX, 'input-available') },
  {
    name: 'Trade: export to the U.S. loading (short skeleton)',
    toolName: 'businessTrade',
    part: trade({ direction: 'export', destination: 'us', value: 40000 }, FX, 'input-available'),
    note: 'No declaration for the U.S.: the skeleton leaves out the deadline table and the steps, like the answer will.',
  },
  { name: 'Trade: export, nothing given, loading (short skeleton)', toolName: 'businessTrade', part: trade({ direction: 'export' }, FX, 'input-streaming') },
  { name: 'Trade: error', toolName: 'businessTrade', part: trade({}, FX, 'output-error') },
];

export default fixtures;
