/**
 * Business facts, verified against the official pages on 2026-09-29/30 (each URL + its "Date modified").
 * Isomorphic: used by the tools (server) and the widgets (client, for instant recomputation).
 *
 * GST/HST (CRA)
 * - Small supplier: most businesses do not have to register while taxable supplies do not EXCEED $30,000
 *   over four consecutive calendar quarters. Over $30,000 in a single quarter: register, charge GST/HST on
 *   the supply that put you over. Over $30,000 across four (or fewer) quarters but not in one: no longer a
 *   small supplier at the end of the month following that quarter. Register within 29 days of the
 *   effective date. Public service bodies: $50,000 test (charities also have a $250,000 gross revenue test).
 *   Voluntary registration is allowed. Taxi / commercial rideshare drivers must register whatever they earn.
 *   when-register-charge.html (2026-06-16) · register-rideshare-taxi.html (2026-08-20)
 * - Rates by province (calculator.html, modified 2025-04-01, checked 2026-09-30): AB 5, BC 5 (+7 PST), MB 5 (+7 PST), NB 15, NL 15,
 *   NT 5, NS 14 (since 2025-04-01), NU 5, ON 13, PE 15, QC 5 (+9.975 QST), SK 5 (+6 PST), YT 5.
 * - Businesses physically located in Quebec register and file GST/HST with Revenu Québec.
 *   how-register/resident.html (2026-09-03)
 *
 * Business number (CRA)
 * - 9-digit BN; one per business. Needed when you need a CRA program account or incorporate; an
 *   unincorporated business only needs one for program accounts. Federal incorporation gives a BN and the
 *   RC account automatically. Registering/incorporating with AB, BC, MB, NB, NS, ON, PE, SK also gives a BN;
 *   NL, NT, NU, QC, YT do not. need-bn.html (2026-06-30)
 * - Program accounts: RT GST/HST, RP payroll, RC corporation income tax, RZ information returns,
 *   RR charities, RM import-export (administered by CBSA since 2024-10-21). Format 123456789 RT 0001.
 *   need-program-accounts.html (2026-09-03)
 * - Register online with Business Registration Online (BRO) through a CRA account (not 3 am to 6 am ET);
 *   otherwise Form RC1 by mail. how-register/resident.html (2026-09-03)
 *
 * Business structures (CRA setting-your-business/*, 2026-08-17; ISED social enterprise page, 2025-09-18;
 * Corporations Canada benefits-incorporating, 2025-09-16) — re-checked 2026-09-30
 * - Sole proprietorship: one owner, no separate legal status, owner assumes all risks incl. personal
 *   property; tax on T1 (Form T2125). (CRA sole-proprietorship)
 * - Partnership: two or more individuals, corporations, trusts or partnerships; no annual partnership
 *   income tax return, each partner reports a share (T5013 in some cases). (CRA partnership)
 *   "The partnership is bound by the actions of any member of the partnership, as long as these are within
 *   the usual scope of the operations." (CRA partnership) · "In a general partnership, the general partners
 *   equally share the decision making, the profits, and the liability, unless otherwise provided in a
 *   formal partnership contract." (ISED social enterprise)
 * - Corporation: separate legal entity; shareholders not responsible for its debts (lenders may ask for a
 *   personal guarantee); T2 return within 6 months of year-end even if no tax owing. (CRA corporation)
 * - Lifespan: "Corporations live on until they wind up, amalgamate, or give up their charter (for example,
 *   when they go bankrupt). With other business structures, a business stops existing when the owner
 *   dies." Money: "Corporations can borrow money at lower rates. They can also raise money by selling
 *   shares or bonds to investors." (benefits-incorporating)
 *
 * Federal incorporation (Corporations Canada / ISED)
 * - Five steps: name (numbered or word), articles, registered office + first directors, individuals with
 *   significant control, submit and pay. Registered office: "where you must keep your corporate records and
 *   where official documents will be served on the corporation". Basic incorporation comes with "an
 *   assigned, numbered corporate name" and pre-set articles. how-incorporate-business (2026-02-25)
 * - Online: $200, 1 day; express +$100 in 4 hours. No Nuans report needed to incorporate online with a
 *   word name. Annual return $12 online, every year. services-fees-and-processing-times (2025-05-06),
 *   annual-return (2026-04-20)
 * - Email with BN within minutes; name protected across Canada. benefits-incorporating (2025-09-16)
 * - Register in each province/territory where you do business; ON, NS, NL forms filled during
 *   incorporation; AB, BC, MB, SK, QC partnered registration; others via their registrar; provincial fees
 *   vary. register-federal-corporation-province-or-territory (2022-06-26)
 * - At least one director, 18 or older; one person can be sole shareholder, director and officer.
 *   directors-and-officers (2016-07-03)
 * - Phone: "1-866-333-5556 (toll-free in Canada)".
 *   https://ised-isde.canada.ca/site/corporations-canada/en/corporation-key (2026-01-19; checked 2026-09-30).
 *   The local/international line (613-941-9042) is flagged as "experiencing technical difficulties" on
 *   https://ised-isde.canada.ca/site/corporations-canada/en/corporations-canada (2026-08-28), so we don't show it.
 *
 * Funding (ISED guidance: always send funding questions to the Business Benefits Finder)
 * - Regional development agencies by province/territory: support-financing.html (2026-07-22). The page has
 *   one section per province/territory (h3 ids below, EN/FR) listing the agency plus local partners
 *   (Community Futures, CBDCs, business service networks…), and a "Support across Canada" section
 *   (#support-canada / #soutien-canada): Indigenous businesses, social enterprises, co-operatives, veterans.
 * - CSBFP shares risk with lenders (ask your bank). (2026-06-25) · NRC IRAP advice, connections, funding
 *   (2025-12-22) · Canada Strong "Find support for your business" (2026-09-22).
 * - CanExport SMEs (Trade Commissioner Service): shares the costs of export-related activities to enter new
 *   international markets; "Applications are not being accepted at this time" — the last intake ended
 *   Aug 31, 2026 at noon ET. canexport-smes.html (2026-02-09; status checked 2026-09-30)
 * - CBSA Duties Relief Program: import without paying duties if the goods are eventually exported
 *   (2025-08-19). Drawback Program: removes the domestic duty impact on goods later exported (2025-04-03).
 *   (Both listed in vendor/cds-ai-answers/scenarios/shared/trade-tariffs.md.)
 *
 * Import / export (CBSA)
 * - Importers need a CARM Client Portal account, a BN9 and an RM import program account (BN15); optional
 *   Release Prior to Payment; customs brokers are optional and not government. guide-4 (2026-09-17)
 * - Value for duty in Canadian dollars at the exchange rate on the date of direct shipment; GST is
 *   calculated on the value plus duty (example 5%). guide-3 (2026-09-17)
 * - Exports: declaration not required for goods for consumption in the U.S. or non-restricted goods under
 *   CAN$2,000; required for commercial goods ≥ $2,000 to other destinations and for restricted goods to
 *   non-U.S. destinations (restricted goods always need a permit). Deadlines: air 2 h before loading,
 *   marine 48 h, rail 2 h, mail 2 h before delivery to the post office, highway immediately before export.
 *   Keep records 6 years. export/guide-eng.html (2024-10-21)
 * - Exchange rates: Bank of Canada Valet API (live, server-side).
 * - Counter-tariffs: "Complete list of U.S. products subject to counter tariffs" (Finance Canada: "Updated list
 *   of U.S. products subject to counter tariffs effective September 8, 2026", "List updated as of August 26,
 *   2026"; checked 2026-10-01) — the page the ISED trade-tariffs guidance says to use.
 * - Tariffs beyond the U.S.: "The government has responded by applying tariffs on imports from the United
 *   States and other countries." Steel and aluminum: "Tariffs are applied on imports of steel and aluminum
 *   from the U.S. and other countries". canadas-tariff-responses.html (2026-09-29; checked 2026-09-30)
 *
 * Quebec: "Registering for the GST and QST" (Revenu Québec; checked 2026-09-30 — you must register if
 *   taxable supplies exceed $30,000 in a calendar quarter or over the four preceding quarters).
 */
import type { ToolSource } from '@/lib/widgets/types';
import type { UrlKey } from './urls';

export const CHECKED = '2026-09-30';
export type Lang = 'en' | 'fr';
export type L2 = { en: string; fr: string };

export const PROVINCES = ['AB', 'BC', 'MB', 'NB', 'NL', 'NS', 'NT', 'NU', 'ON', 'PE', 'QC', 'SK', 'YT'] as const;
export type Province = (typeof PROVINCES)[number];

export type ProvinceFacts = {
  /** GST or HST rate (%) charged when this is the place of supply. */
  rate: number;
  kind: 'gst' | 'hst';
  /** Provincial sales tax (QST in Quebec) shown on the CRA rate table, when the province has one. */
  pst?: number;
  /** Registering or incorporating with the province also issues a CRA business number. */
  bnWithProvince: boolean;
  /** How a federal corporation registers here: during incorporation, partnered online, or the registrar. */
  extra: 'bundled' | 'partner' | 'registrar';
  /** Regional development agencies (keys of AGENCIES). */
  agencies: AgencyKey[];
};

export const PROVINCE: Record<Province, ProvinceFacts> = {
  AB: { rate: 5, kind: 'gst', bnWithProvince: true, extra: 'partner', agencies: ['prairiescan'] },
  BC: { rate: 5, kind: 'gst', pst: 7, bnWithProvince: true, extra: 'partner', agencies: ['pacifican'] },
  MB: { rate: 5, kind: 'gst', pst: 7, bnWithProvince: true, extra: 'partner', agencies: ['prairiescan'] },
  NB: { rate: 15, kind: 'hst', bnWithProvince: true, extra: 'registrar', agencies: ['acoa'] },
  NL: { rate: 15, kind: 'hst', bnWithProvince: false, extra: 'bundled', agencies: ['acoa'] },
  NS: { rate: 14, kind: 'hst', bnWithProvince: true, extra: 'bundled', agencies: ['acoa'] },
  NT: { rate: 5, kind: 'gst', bnWithProvince: false, extra: 'registrar', agencies: ['cannor'] },
  NU: { rate: 5, kind: 'gst', bnWithProvince: false, extra: 'registrar', agencies: ['cannor'] },
  ON: { rate: 13, kind: 'hst', bnWithProvince: true, extra: 'bundled', agencies: ['feddev', 'fednor'] },
  PE: { rate: 15, kind: 'hst', bnWithProvince: true, extra: 'registrar', agencies: ['acoa'] },
  QC: { rate: 5, kind: 'gst', pst: 9.975, bnWithProvince: false, extra: 'partner', agencies: ['ced'] },
  SK: { rate: 5, kind: 'gst', pst: 6, bnWithProvince: true, extra: 'partner', agencies: ['prairiescan'] },
  YT: { rate: 5, kind: 'gst', bnWithProvince: false, extra: 'registrar', agencies: ['cannor'] },
};

/** Section anchors on the support-financing page (checked 2026-09-30). */
export const SUPPORT_ANCHOR: Record<Lang, Record<Province, string> & { groups: string }> = {
  en: {
    groups: 'support-canada',
    AB: 'alberta', BC: 'british-columbia', MB: 'manitoba', NB: 'new-brunswick', NL: 'newfoundland-labrador', NS: 'nova-scotia',
    NT: 'northwest-territories', NU: 'nunavut', ON: 'ontario', PE: 'prince-edward-island', QC: 'quebec', SK: 'saskatchewan', YT: 'yukon',
  },
  fr: {
    groups: 'soutien-canada',
    AB: 'alberta', BC: 'colombie-britannique', MB: 'manitoba', NB: 'nouveau-brunswick', NL: 'terre-neuve-et-labrador', NS: 'nouvelle-ecosse',
    NT: 'territoires-du-nord-ouest', NU: 'nunavut', ON: 'ontario', PE: 'ile-du-prince-edouard', QC: 'quebec', SK: 'saskatchewan', YT: 'yukon',
  },
};

export const GST = {
  threshold: 30_000,
  publicServiceThreshold: 50_000,
  charityGrossRevenue: 250_000,
  registerWithinDays: 29,
  gstRate: 5,
  nsRateSince: '2025-04-01',
} as const;

export const INCORPORATION = {
  fee: 200,
  express: 100,
  standardTime: { days: 1 },
  expressTime: { hours: 4 },
  annualReturn: 12,
  t2MonthsAfterYearEnd: 6,
  phone: '1-866-333-5556',
} as const;

export const EXPORT = {
  declarationValue: 2_000,
  recordsYears: 6,
  /** Deadline to report before the goods leave, by mode (hours; 0 = immediately before). */
  deadlines: { air: 2, marine: 48, rail: 2, mail: 2, highway: 0 },
} as const;

export const IMPORT = { gstRate: 5 } as const;

/** Currencies with a Bank of Canada daily rate that the import estimate offers. */
export const CURRENCIES = ['USD', 'EUR', 'GBP', 'CNY', 'MXN', 'JPY', 'INR', 'KRW'] as const;
export type Currency = (typeof CURRENCIES)[number];

export type AgencyKey = 'pacifican' | 'prairiescan' | 'feddev' | 'fednor' | 'ced' | 'acoa' | 'cannor';
export const AGENCIES: Record<AgencyKey, { name: L2; short: L2; url: L2; region: L2 }> = {
  pacifican: {
    name: { en: 'Pacific Economic Development Canada', fr: 'Développement économique Canada pour le Pacifique' },
    short: { en: 'PacifiCan', fr: 'PacifiCan' },
    url: { en: 'https://www.canada.ca/en/pacific-economic-development.html', fr: 'https://www.canada.ca/fr/developpement-economique-pacifique.html' },
    region: { en: 'British Columbia', fr: 'Colombie-Britannique' },
  },
  prairiescan: {
    name: { en: 'Prairies Economic Development Canada', fr: 'Développement économique Canada pour les Prairies' },
    short: { en: 'PrairiesCan', fr: 'PrairiesCan' },
    url: { en: 'https://www.canada.ca/en/prairies-economic-development.html', fr: 'https://www.canada.ca/fr/developpement-economique-prairies.html' },
    region: { en: 'Alberta, Saskatchewan and Manitoba', fr: 'Alberta, Saskatchewan et Manitoba' },
  },
  feddev: {
    name: { en: 'FedDev Ontario – Small Business Services', fr: 'FedDev Ontario – Services aux petites entreprises' },
    short: { en: 'FedDev Ontario', fr: 'FedDev Ontario' },
    url: { en: 'https://sbs-spe.feddevontario.canada.ca/', fr: 'https://sbs-spe.feddevontario.canada.ca/fr/accueil' },
    region: { en: 'Southern Ontario', fr: 'Sud de l’Ontario' },
  },
  fednor: {
    name: { en: 'Federal Economic Development Agency for Northern Ontario', fr: 'Agence fédérale de développement économique pour le Nord de l’Ontario' },
    short: { en: 'FedNor', fr: 'FedNor' },
    url: { en: 'https://fednor.canada.ca/en', fr: 'https://fednor.canada.ca/fr/soutien-aux-entreprises' },
    region: { en: 'Northern Ontario', fr: 'Nord de l’Ontario' },
  },
  ced: {
    name: { en: 'Canada Economic Development for Quebec Regions', fr: 'Développement économique Canada pour les régions du Québec' },
    short: { en: 'CED', fr: 'DEC' },
    url: { en: 'https://www.canada.ca/en/economic-development-quebec-regions.html', fr: 'https://www.canada.ca/fr/developpement-economique-regions-quebec.html' },
    region: { en: 'Quebec', fr: 'Québec' },
  },
  acoa: {
    name: { en: 'Atlantic Canada Opportunities Agency', fr: 'Agence de promotion économique du Canada atlantique' },
    short: { en: 'ACOA', fr: 'APECA' },
    url: { en: 'https://www.canada.ca/en/atlantic-canada-opportunities.html', fr: 'https://www.canada.ca/fr/promotion-economique-canada-atlantique.html' },
    region: { en: 'Atlantic Canada', fr: 'Canada atlantique' },
  },
  cannor: {
    name: { en: 'Canadian Northern Economic Development Agency', fr: 'Agence canadienne de développement économique du Nord' },
    short: { en: 'CanNor', fr: 'CanNor' },
    url: { en: 'https://www.canada.ca/en/northern-economic-development.html', fr: 'https://www.canada.ca/fr/developpement-economique-nord.html' },
    region: { en: 'Yukon, Northwest Territories and Nunavut', fr: 'Yukon, Territoires du Nord-Ouest et Nunavut' },
  },
};

export { URLS, type UrlKey } from './urls';

/**
 * One official page in both languages, built by the tool (see sources.ts), so the widget can switch language
 * or reorder the list without the page-title catalog. `extra` pages are only shown when the widget asks for
 * them (e.g. Revenu Québec once the person picks Quebec).
 */
export type SourceRef = { key: UrlKey; en: ToolSource; fr: ToolSource; extra?: true };

/**
 * The sources to show, in the reader's language: the pages in `first` lead, in that order (the shell footer
 * cites the first one); every other listed page keeps its place after them. Outputs saved before `refs`
 * existed fall back to the list the tool answered with.
 */
export function pickSources(data: { sources: ToolSource[]; refs?: SourceRef[] }, lang: Lang, first: readonly UrlKey[] = []): ToolSource[] {
  if (!data.refs) return data.sources;
  const rank = (k: UrlKey) => {
    const i = first.indexOf(k);
    return i < 0 ? first.length : i;
  };
  return data.refs
    .filter((r) => !r.extra || first.includes(r.key))
    .map((r, i) => ({ r, i, k: rank(r.key) }))
    .sort((a, b) => a.k - b.k || a.i - b.i)
    .map((x) => x.r[lang]);
}

/** Pick the catalog language used for official URLs from any UI locale. */
export const langOf = (locale: string): Lang => (locale.startsWith('fr') ? 'fr' : 'en');
