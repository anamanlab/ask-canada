/**
 * Travel facts, verified against the official pages on 2026-10-01 (URL + the page's printed "Date modified"
 * for each; where the page's `dcterms.modified` meta tag differs, it is noted as "meta").
 * Isomorphic: used by the tools (server) and the renderers (client). The server-only tables (feed URLs,
 * source list, notice fallback) live in sources.ts so they stay out of the browser bundle.
 *
 * LIVE FEEDS (fetched server-side by tools/travel.ts, never from the browser)
 * - Travel Advice and Advisories, Global Affairs Canada open data (230 destinations):
 *   https://data.international.gc.ca/travel-voyage/index-alpha-eng.json (index, generated 2026-09-29 16:20)
 *   https://data.international.gc.ca/travel-voyage/cta-cap-<ISO>.json (one destination: risk levels,
 *   regional advisories, entry/exit, local emergency numbers, Canadian offices, EWRC toll-free number)
 * - CBSA border wait times (30 busiest land crossings; the CSV had 29 rows on 2026-09-30 and 30 on 2026-10-01, Canada-bound waits only):
 *   https://www.cbsa-asfc.gc.ca/bwt-taf/bwt-eng.csv and bwt-fra.csv (Last-Modified 2026-09-30 06:50 EDT)
 *   Page: https://www.cbsa-asfc.gc.ca/bwt-taf/menu-eng.html (2026-09-30). The page says estimates
 *   "do not include any delays on the roads leading to a port of entry". It does not state an update
 *   frequency, so we show each row's own timestamp.
 *   NOTICES are read live from that page (menu-eng.html / menu-fra.html, uncommented
 *   `<section class="alert">` blocks; parse-waits.ts parseWaitNotices), so they come and go with CBSA's own.
 *   A notice whose dates have passed is dropped (the page still showed "Windsor-Detroit Tunnel: Expect
 *   delays between September 9 and 19, 2026" on 2026-09-30). If the page can't be read, the only
 *   fallback is WAIT_NOTICE_FALLBACK (sources.ts), which expires on its own date:
 *   "Saint-Bernard-de-Lacolle under redevelopment: Expect border delays until Winter 2027" (2026-09-30).
 *
 * RISK LEVELS: https://travel.gc.ca/travelling/advisories/explained (Date modified 2026-08-11, re-checked 2026-10-01)
 *   FR: https://voyage.gc.ca/voyager/avertissements/explications (Date de modification 2026-08-11, re-checked 2026-10-01)
 *   Destination list: https://travel.gc.ca/travelling/advisories (Date modified 2026-08-28; meta 2026-09-22)
 *   Official names, as the pages print them (also on travel.gc.ca/destinations/japan and voyage.gc.ca/destinations/mexique):
 *   1 "Take normal security precautions" / « Prenez des mesures de sécurité normales »
 *   2 "Exercise a high degree of caution" / « Faites preuve d’une grande prudence »
 *   3 "Avoid non-essential travel" / « Évitez tout voyage non essentiel »
 *   4 "Avoid all travel" / « Évitez tout voyage »
 *   The open-data feed's `advisory-text` is stale ("Exercise normal security precautions", French infinitives
 *   « Prendre… », « Faire preuve… », « Éviter… »), so we never display it: the level comes from
 *   `advisory-state` (0–3) and the wording from LEVEL_TEXT below. Levels 3 and 4 are formal travel advisories and
 *   "may also affect your travel insurance coverage". Level 4: "If you are already there, leave if it is
 *   safe to do so." FR: https://voyage.gc.ca/voyager/avertissements/explications
 *
 * EMERGENCY ASSISTANCE (Emergency Watch and Response Centre, 24/7, Canadian citizens):
 *   https://travel.gc.ca/assistance/emergency-assistance (2026-09-03) / voyage.gc.ca/assistance/assistance-d-urgence (2026-09-03)
 *   +1 613 996 8885 (call collect where available); inside Canada 613-996-8885 or 1-800-387-3124 (toll-free
 *   from the U.S. and Canada); SOS@international.gc.ca; SMS +1-613-686-3658; WhatsApp +1-613-909-8881;
 *   Signal +1-613-909-8087 (a messaging app: linked with signal.me, never tel:); TTY 613-944-1310 / 1-800-394-3472
 *   (the second "toll-free from the U.S. and Canada", FR « sans frais aux États-Unis et au Canada seulement »; re-checked 2026-10-01). "We do not provide information about
 *   immigration, permanent residence or visas."
 *
 * IF THINGS GO WRONG: https://travel.gc.ca/assistance/if-things-go-wrong (2026-07-13; meta is the day of the request)
 *   Lost/stolen passport → contact the nearest Canadian office; emergency passport if you urgently need to
 *   travel ("not available at every Canadian office abroad"); police report not required for replacement.
 *   stolen-belongings (2026-07-24, re-checked 2026-10-01: guidance unchanged; page title "Lost or stolen belongings
 *   outside Canada"). Arrest: ask authorities to notify the nearest Canadian office; officers
 *   can't get you out of jail, post bail or pay fines; can give a list of local lawyers and contact family.
 *   arrest-detention (2026-01-13). Sick: nearest hospital often best for urgent care; the Government of
 *   Canada does not pay hospital or medical bills. sick-injured (2026-09-01; meta 2026-09-04).
 *
 * REGISTRATION OF CANADIANS ABROAD (ROCA): https://travel.gc.ca/travelling/registration (2026-07-08, EN and FR;
 *   meta is the day of the request)
 *   Free; lets the Government of Canada notify you in an emergency at your destination or at home. The page
 *   doesn't say how long registering takes, so we don't either.
 *   The page's "Service currently unavailable" banner is commented out in the source (checked 2026-10-01),
 *   so no outage is reported.
 *
 * PERSONAL EXEMPTIONS, "I Declare" (CBSA): https://www.cbsa-asfc.gc.ca/travel-voyage/declare-eng.html (2025-11-25)
 *   Under 24 h: no exemption. 24 h+: up to CAN$200, no alcohol/tobacco; over $200 → duty and taxes on the
 *   entire amount; goods must be with you. 48 h+: up to CAN$800 incl. alcohol/tobacco within limits; duty
 *   only on the amount over $800; goods must be with you. 7 days+: CAN$800; alcohol/tobacco must be with you,
 *   other goods may follow (declare all on arrival; Form BSF192). Exemptions can't be combined or transferred.
 *   Alcohol (48 h+, ONE of): wine 1.5 L (two 750 ml bottles); alcoholic beverages 1.14 L (one large standard
 *   bottle of liquor); beer/ale 8.5 L (about 24 × 355 ml). Minimum age 18 (AB, MB, QC) or 19 elsewhere.
 *   Tobacco (48 h+, ALL of, stamped "duty paid Canada droit acquitté"): 200 cigarettes, 50 cigars, 200 g
 *   manufactured tobacco, 200 tobacco sticks, vaping products up to 120 ml / 120 g within any combination of ≤ 12 devices and immediate containers (FR: « dispositifs de vapotage et emballages de consommation »); 18+.
 *   Currency: report CAN$10,000 or more when crossing. Surtaxes: Finance Canada's "Complete list of U.S. products subject to counter tariffs"
 *   (re-checked 2026-09-30): counter tariffs on certain U.S. goods; "These new countermeasures … are effective as of
 *   12:01 a.m., September 8, 2026" (earlier lists ran before that), so we say the current list took effect Sept 8, 2026.
 *   Duty and taxes estimator: https://www.cbsa-asfc.gc.ca/travel-voyage/dte-acl/est-cal-eng.html
 *   Border Information Service: 1-800-461-9999 (Canada/U.S.), TTY 1-866-335-3237, 1-204-983-3500 from
 *   elsewhere; live agents Mon–Fri 8 am–4 pm local time. https://www.cbsa-asfc.gc.ca/contact/bis-sif-eng.html (2026-03-13)
 * ADVANCE DECLARATION (ArriveCAN): https://www.canada.ca/en/border-services-agency/services/arrivecan.html
 *   (2024-09-07): declare up to 72 hours before your flight, at 10 participating airports.
 */
import type { AbsenceTier, Lang, RiskLevel } from './types';

export const CHECKED = '2026-10-01';

export const URLS = {
  advisories: { en: 'https://travel.gc.ca/travelling/advisories', fr: 'https://voyage.gc.ca/voyager/avertissements' },
  explained: { en: 'https://travel.gc.ca/travelling/advisories/explained', fr: 'https://voyage.gc.ca/voyager/avertissements/explications' },
  roca: { en: 'https://travel.gc.ca/travelling/registration', fr: 'https://voyage.gc.ca/voyager/inscription' },
  emergency: { en: 'https://travel.gc.ca/assistance/emergency-assistance', fr: 'https://voyage.gc.ca/assistance/assistance-d-urgence' },
  emergencyForm: {
    en: 'https://travel.gc.ca/assistance/emergency-assistance/emergency-contact-form',
    fr: 'https://voyage.gc.ca/assistance/assistance-d-urgence/demande-aide-urgence',
  },
  tollFree: {
    en: 'https://travel.gc.ca/assistance/emergency-assistance/toll-free-numbers',
    fr: 'https://voyage.gc.ca/assistance/assistance-d-urgence/numero-sans-frais',
  },
  lostStolen: {
    en: 'https://travel.gc.ca/assistance/emergency-info/stolen-belongings',
    fr: 'https://voyage.gc.ca/assistance/info-d-urgence/biens-voles',
  },
  arrest: {
    en: 'https://travel.gc.ca/assistance/emergency-info/arrest-detention',
    fr: 'https://voyage.gc.ca/assistance/info-d-urgence/arrestation-detention',
  },
  sick: { en: 'https://travel.gc.ca/assistance/emergency-info/sick-injured', fr: 'https://voyage.gc.ca/assistance/info-d-urgence/malade-blesse' },
  thingsGoWrong: { en: 'https://travel.gc.ca/assistance/if-things-go-wrong', fr: 'https://voyage.gc.ca/assistance/en-cas-probleme' },
  declare: {
    en: 'https://www.cbsa-asfc.gc.ca/travel-voyage/declare-eng.html',
    fr: 'https://www.cbsa-asfc.gc.ca/travel-voyage/declare-fra.html',
  },
  estimator: {
    en: 'https://www.cbsa-asfc.gc.ca/travel-voyage/dte-acl/est-cal-eng.html',
    fr: 'https://www.cbsa-asfc.gc.ca/travel-voyage/dte-acl/est-cal-fra.html',
  },
  bis: { en: 'https://www.cbsa-asfc.gc.ca/contact/bis-sif-eng.html', fr: 'https://www.cbsa-asfc.gc.ca/contact/bis-sif-fra.html' },
  arrivecan: {
    en: 'https://www.canada.ca/en/border-services-agency/services/arrivecan.html',
    fr: 'https://www.canada.ca/fr/agence-services-frontaliers/services/arrivecan.html',
  },
  surtaxes: {
    en: 'https://www.canada.ca/en/department-finance/programs/international-trade-finance-policy/canadas-response-us-tariffs/complete-list-us-products-subject-to-counter-tariffs.html',
    fr: 'https://www.canada.ca/fr/ministere-finances/programmes/politiques-finances-echanges-internationaux/reponse-canada-droits-douane-americains/liste-complete-produits-americains-assujettis-contre-mesures-tarifaires.html',
  },
  waits: { en: 'https://www.cbsa-asfc.gc.ca/bwt-taf/menu-eng.html', fr: 'https://www.cbsa-asfc.gc.ca/bwt-taf/menu-fra.html' },
} as const;

/** Emergency Watch and Response Centre (24/7). `href` values are dialable/sendable as-is. */
export const EWRC = {
  collect: { label: '+1 613 996 8885', href: 'tel:+16139968885' },
  fromCanada: { label: '1-800-387-3124', href: 'tel:+18003873124' },
  ottawa: { label: '613-996-8885', href: 'tel:+16139968885' },
  email: { label: 'SOS@international.gc.ca', href: 'mailto:SOS@international.gc.ca' },
  sms: { label: '+1-613-686-3658', href: 'sms:+16136863658' },
  whatsapp: { label: '+1-613-909-8881', href: 'https://wa.me/16139098881' },
  signal: { label: '+1-613-909-8087', href: 'https://signal.me/#p/+16139098087' },
  tty: { label: '613-944-1310', href: 'tel:+16139441310' },
  ttyFree: { label: '1-800-394-3472', href: 'tel:+18003943472' },
} as const;

export const BIS = {
  tollFree: { label: '1-800-461-9999', href: 'tel:+18004619999' },
  tty: { label: '1-866-335-3237', href: 'tel:+18663353237' },
  abroad: { label: '1-204-983-3500', href: 'tel:+12049833500' },
} as const;

/** CAN$ personal exemption by length of absence (0 = none). */
export const EXEMPTION: Record<AbsenceTier, number> = { under24: 0, h24: 200, h48: 800, d7: 800 };
export const CURRENCY_REPORT = 10_000;
/** Alcohol: ONE of these (48 hours or more). Litres. */
export const ALCOHOL = [
  { id: 'wine', litres: 1.5 },
  { id: 'spirits', litres: 1.14 },
  { id: 'beer', litres: 8.5 },
] as const;
/** Tobacco and vaping: ALL of these (48 hours or more, stamped duty paid). */
export const TOBACCO = [
  { id: 'cigarettes', amount: 200 },
  { id: 'cigars', amount: 50 },
  { id: 'tobacco', amount: 200 },
  { id: 'sticks', amount: 200 },
  { id: 'vaping', amount: 120 },
] as const;
export const ARRIVECAN_HOURS = 72;

/**
 * Official level names, word for word from travel.gc.ca/travelling/advisories/explained and
 * voyage.gc.ca/voyager/avertissements/explications (both 2026-08-11). Always shown instead of the feed's text.
 */
export const LEVEL_TEXT: Record<Lang, Record<RiskLevel, string>> = {
  en: {
    1: 'Take normal security precautions',
    2: 'Exercise a high degree of caution',
    3: 'Avoid non-essential travel',
    4: 'Avoid all travel',
  },
  fr: {
    1: 'Prenez des mesures de sécurité normales',
    2: 'Faites preuve d’une grande prudence',
    3: 'Évitez tout voyage non essentiel',
    4: 'Évitez tout voyage',
  },
};
