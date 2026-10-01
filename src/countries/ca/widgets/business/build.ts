/**
 * Tool outputs for the business widgets (isomorphic). The tools call these on the server; the fixtures
 * call them with a fixed date so the lab is deterministic. Keep outputs JSON-serializable.
 */
import type { ToolSource } from '@/lib/widgets/types';
import {
  accountsFor,
  fundingFor,
  gstCheck,
  recommendStructure,
  spreadYear,
  type Account,
  type Destination,
  type GstCheck,
  type Need,
  type OrgType,
  type Owners,
  type Priority,
  type StructureFit,
} from './calc';
import { CURRENCIES, INCORPORATION, PROVINCES, type Currency, type Lang, type Province, type SourceRef } from './data';
import { listed, QUOTES, ref } from './sources';

/** Bank of Canada daily rates (CAD per unit of each currency) and the day they were observed. */
export type FxRates = { date: string; rates: Partial<Record<Currency, number>> };

/** Every output: `sources` in the answer's language (what the chat cites) and `refs`, the same pages in both. */
type Sourced = { sources: ToolSource[]; refs: SourceRef[] };
const sourced = (refs: SourceRef[], lang: Lang): Sourced => ({ sources: listed(refs, lang), refs });

const isProvince = (p: unknown): p is Province => typeof p === 'string' && (PROVINCES as readonly string[]).includes(p.toUpperCase());
const prov = (p: unknown): Province | null => (isProvince(p) ? (p.toUpperCase() as Province) : null);

/* ---------------------------------------------------------------- businessStructure --------------- */

export type StructureInput = { owners?: Owners; priorities?: Priority[]; province?: string; lang?: Lang };
export type StructureOutput = {
  lang: Lang;
  owners: Owners;
  priorities: Priority[];
  province: Province | null;
  fit: StructureFit;
  federalFee: number;
} & Sourced;

export function buildStructure(input: StructureInput = {}): StructureOutput {
  const lang = input.lang ?? 'en';
  const owners = input.owners ?? 'solo';
  const priorities = [...new Set(input.priorities ?? [])];
  return {
    lang,
    owners,
    priorities,
    province: prov(input.province),
    fit: recommendStructure({ owners, priorities }),
    federalFee: INCORPORATION.fee,
    // The CRA structure pages lead (the shell footer shows the first source).
    ...sourced(
      [ref('soleProp'), ref('partnership'), ref('corporation'), ref('ccBenefits'), ref('registerSoleProp'), ref('structures', { quote: QUOTES.unincorporated })],
      lang,
    ),
  };
}

/* ---------------------------------------------------------------- businessIncorporate ------------- */

export type NameType = 'numbered' | 'word';
export type IncorporateInput = { nameType?: NameType; express?: boolean; provinces?: string[]; lang?: Lang };
export type IncorporateOutput = {
  lang: Lang;
  nameType: NameType;
  express: boolean;
  provinces: Province[];
  fees: { incorporation: number; express: number; annualReturn: number };
  phone: string;
} & Sourced;

export function buildIncorporate(input: IncorporateInput = {}): IncorporateOutput {
  const lang = input.lang ?? 'en';
  const provinces = [...new Set((input.provinces ?? []).map(prov).filter((p): p is Province => p !== null))];
  return {
    lang,
    nameType: input.nameType ?? 'numbered',
    express: Boolean(input.express),
    provinces,
    fees: { incorporation: INCORPORATION.fee, express: INCORPORATION.express, annualReturn: INCORPORATION.annualReturn },
    phone: INCORPORATION.phone,
    ...sourced(
      [ref('howIncorporate'), ref('ccFees'), ref('ccBenefits', { quote: QUOTES.incorporate }), ref('extraProvincial'), ref('annualReturn'), ref('needBn')],
      lang,
    ),
  };
}

/* ---------------------------------------------------------------- businessRegistration ------------ */

export type RegistrationInput = {
  quarterlySales?: number[];
  annualSales?: number;
  org?: OrgType;
  rideshare?: boolean;
  employees?: boolean;
  incorporated?: boolean;
  trade?: boolean;
  province?: string;
  lang?: Lang;
};
export type RegistrationOutput = {
  lang: Lang;
  today: string;
  /** Lab fixtures: keep `today` as the reader's date too (the tool never sets it). */
  pinToday?: boolean;
  /** False when no sales figures were given: the widget asks for them. */
  hasSales: boolean;
  /** True when a yearly figure was spread over the quarters (see `spreadYear`). */
  spread: boolean;
  org: OrgType;
  rideshare: boolean;
  employees: boolean;
  incorporated: boolean;
  trade: boolean;
  province: Province | null;
  check: GstCheck;
  accounts: Account[];
} & Sourced;

export function buildRegistration(input: RegistrationInput, today: string): RegistrationOutput {
  const lang = input.lang ?? 'en';
  const q = input.quarterlySales?.filter((n) => Number.isFinite(n)).slice(-4);
  const spread = !q?.length && input.annualSales != null && Number.isFinite(input.annualSales);
  // Right-align given quarters so the most recent figure lands on the current quarter.
  const amounts = q?.length ? [...Array(4 - q.length).fill(0), ...q] : spread ? spreadYear(input.annualSales as number, today) : [0, 0, 0, 0];
  const org = input.org ?? 'business';
  const rideshare = Boolean(input.rideshare);
  const check = gstCheck({ amounts, org, rideshare, today });
  const activities = { employees: Boolean(input.employees), incorporated: Boolean(input.incorporated), trade: Boolean(input.trade) };
  return {
    lang,
    today,
    hasSales: Boolean(q?.length) || spread,
    spread,
    org,
    rideshare,
    ...activities,
    province: prov(input.province),
    check,
    accounts: accountsFor(check.status, activities),
    // Rideshare and Revenu Québec are cited when they apply; the widget brings them in if the person switches.
    ...sourced(
      [
        ref('gstWhen', { quote: QUOTES.gstSmall }),
        ref('accounts'),
        ref('needBn'),
        ref('registerBn'),
        ref('gstRates'),
        ref('rideshare', { extra: !rideshare }),
        ref('rqRegister', { extra: true }),
      ],
      lang,
    ),
  };
}

/* ---------------------------------------------------------------- businessFunding ----------------- */

export type FundingInput = { province?: string; need?: Need; lang?: Lang };
export type FundingOutput = {
  lang: Lang;
  province: Province | null;
  need: Need;
} & Sourced &
  ReturnType<typeof fundingFor>;

export function buildFunding(input: FundingInput = {}): FundingOutput {
  const lang = input.lang ?? 'en';
  const province = prov(input.province);
  const need = input.need ?? 'start';
  const result = fundingFor({ province, need });
  return {
    lang,
    province,
    need,
    ...result,
    ...sourced([ref('bbf'), ref('supportFinancing'), ...result.programs.map((p) => ref(p))], lang),
  };
}

/* ---------------------------------------------------------------- businessTrade ------------------- */

export type Direction = 'import' | 'export';
export type TradeInput = {
  direction?: Direction;
  amount?: number;
  currency?: string;
  /** Where the goods are made, when the person said: decides which tariff notice shows. */
  origin?: 'us' | 'other';
  dutyRate?: number;
  destination?: Destination;
  restricted?: boolean;
  value?: number;
  lang?: Lang;
};
export type TradeOutput = {
  lang: Lang;
  direction: Direction;
  import: {
    /** Invoice value in `currency`; 0 when it couldn't be converted (see `original`). */
    amount: number;
    currency: Currency | 'CAD';
    /** Where the goods are made, from what the person said (never from the currency); null when they didn't say. */
    origin: 'us' | 'other' | null;
    dutyRate: number | null;
    fx: FxRates | null;
    /** The foreign invoice the person gave, when live rates were unavailable to convert it. */
    original: { amount: number; currency: string } | null;
  };
  export: { destination: Destination; restricted: boolean; value: number };
} & Sourced;

export function buildTrade(input: TradeInput, fx: FxRates | null): TradeOutput {
  const lang = input.lang ?? 'en';
  const direction = input.direction ?? 'import';
  const cur = (input.currency ?? 'USD').toUpperCase();
  const currency: Currency | 'CAD' = (CURRENCIES as readonly string[]).includes(cur) && fx?.rates[cur as Currency] ? (cur as Currency) : 'CAD';
  // No amount given: 0, so the estimate opens empty and asks for the invoice value (never a made-up figure).
  const amount = Math.max(0, input.amount ?? 0);
  // No live rate for a foreign invoice: never treat it as Canadian dollars. Clear the field and say why.
  const unconverted = currency === 'CAD' && cur !== 'CAD';
  const importRefs = [ref('importGuide'), ref('importSetup'), ref('importDuties'), ref('fx', fx ? { over: { live: true, updated: fx.date } } : {}), ref('counterTariffs')];
  const exportRefs = [ref('exportGuide'), ref('tcs')];
  return {
    lang,
    direction,
    import: {
      amount: unconverted ? 0 : amount,
      currency,
      origin: input.origin === 'us' || input.origin === 'other' ? input.origin : null,
      original: unconverted && input.amount ? { amount, currency: cur } : null,
      dutyRate: input.dutyRate != null && Number.isFinite(input.dutyRate) ? Math.max(0, Math.min(300, input.dutyRate)) : null,
      fx,
    },
    export: {
      destination: input.destination ?? 'other',
      restricted: Boolean(input.restricted),
      value: Math.max(0, input.value ?? 0),
    },
    ...sourced([...(direction === 'import' ? importRefs : exportRefs), ...(direction === 'import' ? exportRefs : importRefs), ref('tariffResponses')], lang),
  };
}
