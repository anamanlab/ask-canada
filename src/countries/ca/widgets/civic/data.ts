/**
 * Democracy & civic facts, verified on 2026-09-30 against the official pages below. Isomorphic.
 *
 * Department guidance: vendor/cds-ai-answers/scenarios/context-ceo-bec/ (Canada.ca Experience Office;
 * nothing election-specific) and vendor/cds-ai-answers/safety.js, which says: name current elected
 * officials only after verifying them on ourcommons.ca/members (or ParlInfo), stay out of partisan
 * matters, and never treat news announcements as programs that exist. This widget follows all three:
 * MP names come live from the House of Commons, party is shown as a neutral fact, and news items are
 * labelled as announcements.
 *
 * Verified facts (URL — "Date modified")
 * - House of Commons: 343 seats; party standings list 6 vacant seats and 337 sitting members today.
 *   https://www.ourcommons.ca/members/en/party-standings (live page; "Total Seats 343")
 *   The 343 electoral districts came into effect with the writs of the 45th general election.
 *   https://www.elections.ca/content.aspx?section=res&dir=cir/red&document=index&lang=e (2025-03-23)
 * - Current Parliament: 45th Parliament, 1st Session (LEGISinfo JSON: ParliamentNumber 45, SessionNumber 1,
 *   IsSessionOngoing true). https://www.parl.ca/legisinfo/en/bills
 * - Senate: "Parliament’s 105 senators"; "a bill must pass the Senate before it can become law".
 *   https://sencanada.ca/en/about/
 * - Legislative process (notice 48 h → 1st reading → 2nd reading + committee → committee → report stage
 *   → 3rd reading → Senate → royal assent by the Governor General). Money/tax bills must start in the
 *   House of Commons. Royal assent brings together the Crown, the Senate and the House of Commons.
 *   https://www.ourcommons.ca/procedure/our-procedure/legislativeProcess/c_g_legislativeprocess-e.html
 * - "Mail may be sent postage-free to any member of Parliament." (every MP profile page, ourcommons.ca)
 * - Voter registration: must be at least 18 and a Canadian citizen; register in advance to get a voter
 *   information card when an election is called; other ways: CRA tax return (check "Yes"), by mail,
 *   or at the local office / polling place during an election. The same page's notice: "The next provincial
 *   general election in Quebec will take place on October 5, 2026" (Élections Québec, not Elections Canada;
 *   also "Le 5 octobre, on exerce notre droit de vote!" on electionsquebec.qc.ca, checked 2026-09-30).
 *   https://www.elections.ca/content.aspx?section=vot&dir=reg&document=index&lang=e (2026-09-02)
 *   Online Voter Registration Service: https://ereg.elections.ca/en/ereg/index
 * - Register of Future Electors: "To register, you must be: A Canadian Citizen, Between 14 and 17 years old,
 *   Living in Canada"; "Register online"; at 18 you're added to the National Register of Electors.
 *   (The page documents online registration only, so the widget says "online".)
 *   https://www.elections.ca/content.aspx?section=vot&dir=reg/fut&document=index&lang=e (2025-10-31)
 * - International Register of Electors: "be a Canadian citizen and at least 18 years old on polling day;
 *   be living outside Canada; have lived in Canada at some point in your life"; no limit on years abroad;
 *   vote by mail-in special ballot. https://www.elections.ca/content.aspx?section=vot&dir=reg/etr&document=index&lang=e (2026-02-04)
 * - Voter ID: 3 options. 1) driver's licence or any Canadian government card with photo, name and current
 *   address; 2) two pieces of ID, both with your name, one with your current address (e.g. health card +
 *   bank statement); 3) no ID: declare identity and address in writing and have someone who knows you and is assigned to your
 *   polling station vouch for you (a voucher can vouch for only one person, except in long-term care).
 *   Passport = proof of identity only. Expired ID accepted if it has name + current address. E-statements
 *   accepted (printed or on a phone).
 *   https://www.elections.ca/content.aspx?section=vot&dir=ids&document=index&lang=e (2026-09-02)
 * - Ways to vote once an election is called: election day; advance polls on the 10th, 9th, 8th and 7th days
 *   before election day; any Elections Canada office until the 6th day before (the Tuesday before);
 *   by mail (special ballot; application deadline 6 p.m. on the Tuesday before election day).
 *   https://www.elections.ca/content.aspx?section=vot&dir=vote&document=index&lang=e (2026-02-17)
 * - Elections Canada: 1-800-463-6868 (toll-free Canada/US), TTY 1-800-361-8935, Mon–Fri 9 a.m.–5 p.m. ET.
 *   https://www.elections.ca/content.aspx?section=cont&document=index&lang=e (2026-04-15)
 * - GC news: canada.ca news centre feed (api.io.canada.ca), types: news releases, media advisories,
 *   statements, backgrounders, speeches, readouts. https://www.canada.ca/en/news.html
 *
 * Live sources (server): represent.opennorth.ca (postal code → 2023 Representation Order riding + shape;
 * its MP list can lag by-elections and renamed ridings, so MPs are never taken from it alone),
 * ourcommons.ca constituencies XML (who holds each seat now, or vacant), ourcommons.ca member profile
 * (photo, roles, contact), parl.ca LEGISinfo JSON (bills), api.io.canada.ca (news).
 */
import type { ToolSource } from '@/lib/widgets/types';

export type Lang = 'en' | 'fr';
/** The day the static pages below were last read. Live sources carry the day they were fetched instead (see `liveSrc`). */
export const CHECKED = '2026-09-30';

/** Today's date (YYYY-MM-DD) in Ottawa's time zone: Parliament's and Elections Canada's dates are Eastern. */
export function torontoToday(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Toronto', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}

export const HOUSE = { seats: 343, parliament: 45, session: 1 } as const;

/** Quebec provincial general election day (Elections Canada registration notice; Élections Québec). */
export const QUEBEC_ELECTION = '2026-10-05';
export const SENATE = { seats: 105 } as const;

export const ELECTIONS_CANADA = {
  phone: '1-800-463-6868',
  tty: '1-800-361-8935',
} as const;

const EC = (q: string, lang: Lang) => `https://www.elections.ca/content.aspx?${q}&lang=${lang === 'fr' ? 'f' : 'e'}`;

/**
 * Host of the French House of Commons pages we cite. The House serves the same French pages on both of its
 * hosts (checked 2026-10-01: /Members/fr/… and /procedure/notre-procedure/… answer 200 in French on each).
 * The pack's official-source allowlist has ourcommons.ca but not noscommunes.ca yet, and a source outside it
 * is flagged "not an official source" in the chat. Switch back to https://www.noscommunes.ca once it is listed.
 */
const COMMONS_FR = 'https://www.ourcommons.ca';

export const URLS = {
  ereg: { en: 'https://ereg.elections.ca/en/ereg/index', fr: 'https://ereg.elections.ca/fr/ereg/index' },
  register: { en: EC('section=vot&dir=reg&document=index', 'en'), fr: EC('section=vot&dir=reg&document=index', 'fr') },
  voterId: { en: EC('section=vot&dir=ids&document=index', 'en'), fr: EC('section=vot&dir=ids&document=index', 'fr') },
  waysToVote: { en: EC('section=vot&dir=vote&document=index', 'en'), fr: EC('section=vot&dir=vote&document=index', 'fr') },
  futureElectors: { en: EC('section=vot&dir=reg/fut&document=index', 'en'), fr: EC('section=vot&dir=reg/fut&document=index', 'fr') },
  abroad: { en: EC('section=vot&dir=reg/etr&document=index', 'en'), fr: EC('section=vot&dir=reg/etr&document=index', 'fr') },
  contactEc: { en: EC('section=cont&document=index', 'en'), fr: EC('section=cont&document=index', 'fr') },
  redistribution: { en: EC('section=res&dir=cir/red&document=index', 'en'), fr: EC('section=res&dir=cir/red&document=index', 'fr') },
  findRiding: {
    en: 'https://www.elections.ca/Scripts/vis/FindED?L=e&QID=-1&PAGEID=20',
    fr: 'https://www.elections.ca/Scripts/vis/FindED?L=f&QID=-1&PAGEID=20',
  },
  // "Maps Corner": maps and boundary descriptions of the federal electoral districts (Date modified 2025-03-23).
  ridingMaps: { en: EC('section=res&dir=cir/maps2&document=index', 'en'), fr: EC('section=res&dir=cir/maps2&document=index', 'fr') },
  electionsHome: { en: 'https://www.elections.ca/home.aspx', fr: 'https://www.elections.ca/accueil.aspx' },
  quebecElections: { en: 'https://www.electionsquebec.qc.ca/en/homepage/', fr: 'https://www.electionsquebec.qc.ca/' },
  membersSearch: { en: 'https://www.ourcommons.ca/Members/en/search', fr: `${COMMONS_FR}/members/fr/search` },
  partyStandings: { en: 'https://www.ourcommons.ca/members/en/party-standings', fr: `${COMMONS_FR}/members/fr/party-standings` },
  legislativeProcess: {
    en: 'https://www.ourcommons.ca/procedure/our-procedure/legislativeProcess/c_g_legislativeprocess-e.html',
    fr: `${COMMONS_FR}/procedure/notre-procedure/legislativeProcess/c_g_legislativeprocess-f.html`,
  },
  senate: { en: 'https://sencanada.ca/en/about/', fr: 'https://sencanada.ca/fr/a-propos/' },
  legisinfo: { en: 'https://www.parl.ca/legisinfo/en/bills', fr: 'https://www.parl.ca/legisinfo/fr/projets-de-loi' },
  howGovernmentWorks: {
    en: 'https://www.canada.ca/en/government/system/how-government-works.html',
    fr: 'https://www.canada.ca/fr/gouvernement/systeme/comment-gouvernement-fonctionne.html',
  },
  news: { en: 'https://www.canada.ca/en/news.html', fr: 'https://www.canada.ca/fr/nouvelles.html' },
  represent: { en: 'https://represent.opennorth.ca/', fr: 'https://represent.opennorth.ca/' },
} as const;

export const mpProfileUrl = (personId: string, lang: Lang) =>
  lang === 'fr' ? `${COMMONS_FR}/Members/fr/${personId}` : `https://www.ourcommons.ca/Members/en/${personId}`;

export const billUrl = (code: string, lang: Lang, parliament: number = HOUSE.parliament, session: number = HOUSE.session) =>
  lang === 'fr'
    ? `https://www.parl.ca/legisinfo/fr/projet-de-loi/${parliament}-${session}/${code.toLowerCase()}`
    : `https://www.parl.ca/legisinfo/en/bill/${parliament}-${session}/${code.toLowerCase()}`;

/** Province / territory codes → names (EN, FR) as the House of Commons writes them. */
export const PROVINCES: Record<string, { en: string; fr: string }> = {
  NL: { en: 'Newfoundland and Labrador', fr: 'Terre-Neuve-et-Labrador' },
  PE: { en: 'Prince Edward Island', fr: 'Île-du-Prince-Édouard' },
  NS: { en: 'Nova Scotia', fr: 'Nouvelle-Écosse' },
  NB: { en: 'New Brunswick', fr: 'Nouveau-Brunswick' },
  QC: { en: 'Quebec', fr: 'Québec' },
  ON: { en: 'Ontario', fr: 'Ontario' },
  MB: { en: 'Manitoba', fr: 'Manitoba' },
  SK: { en: 'Saskatchewan', fr: 'Saskatchewan' },
  AB: { en: 'Alberta', fr: 'Alberta' },
  BC: { en: 'British Columbia', fr: 'Colombie-Britannique' },
  YT: { en: 'Yukon', fr: 'Yukon' },
  NT: { en: 'Northwest Territories', fr: 'Territoires du Nord-Ouest' },
  NU: { en: 'Nunavut', fr: 'Nunavut' },
};

/** First letter of a postal code → province/territory (X is shared by NT and NU). */
export const POSTAL_PROVINCE: Record<string, string> = {
  A: 'NL', B: 'NS', C: 'PE', E: 'NB', G: 'QC', H: 'QC', J: 'QC', K: 'ON', L: 'ON', M: 'ON', N: 'ON', P: 'ON',
  R: 'MB', S: 'SK', T: 'AB', V: 'BC', X: 'NT', Y: 'YT',
};

const src = (title: string, url: string, updated?: string, extra: Partial<ToolSource> = {}): ToolSource => ({
  title,
  url,
  checked: CHECKED,
  ...(updated ? { updated } : {}),
  ...extra,
});

/** `live: false` when the live fetch failed and the widget falls back to the official page; `today` pins the fetch day (fixtures). */
type LiveOpts = { live?: boolean; today?: string };

/** A source fetched live is "checked" the day it was fetched; when the fetch failed it is the static page we read on CHECKED. */
const liveSrc = (title: string, url: string, { live = true, today }: LiveOpts = {}): ToolSource =>
  src(title, url, undefined, live ? { live: true, checked: today ?? torontoToday() } : {});

/** A page fetched during this lookup (an MP's profile, a bill's LEGISinfo page). */
export const livePage = (title: string, url: string, today?: string): ToolSource => liveSrc(title, url, { today });

export const SOURCES = {
  members: (lang: Lang) =>
    src(lang === 'fr' ? 'Députés : recherche par code postal' : 'Members of Parliament: search by postal code', URLS.membersSearch[lang]),
  standings: (lang: Lang, opts?: LiveOpts) =>
    liveSrc(lang === 'fr' ? 'Répartition des sièges à la Chambre des communes' : 'Party standings in the House of Commons', URLS.partyStandings[lang], opts),
  findRiding: (lang: Lang) =>
    src(lang === 'fr' ? 'Service d’information à l’électeur : trouver votre circonscription' : 'Voter Information Service: find your electoral district', URLS.findRiding[lang]),
  electionsHome: (lang: Lang) => src(lang === 'fr' ? 'Élections Canada (accueil)' : 'Elections Canada (home)', URLS.electionsHome[lang]),
  represent: () => liveSrc('Represent API by Open North (postal code → electoral district)', URLS.represent.en),
  register: (lang: Lang) =>
    src(lang === 'fr' ? 'Inscription des électeurs' : 'Voter registration', URLS.register[lang], '2026-09-02', {
      quote:
        lang === 'fr'
          ? 'Pour vous inscrire et voter à une élection fédérale, vous devez : avoir au moins 18 ans; être citoyen canadien.'
          : 'To register and vote in a federal election, you must: be at least 18 years old; have Canadian citizenship.',
    }),
  ereg: (lang: Lang) => src(lang === 'fr' ? 'Service d’inscription en ligne des électeurs' : 'Online Voter Registration Service', URLS.ereg[lang]),
  voterId: (lang: Lang) =>
    src(lang === 'fr' ? 'Pièces d’identité pour voter' : 'ID to vote', URLS.voterId[lang], '2026-09-02', {
      quote:
        lang === 'fr'
          ? 'Pour voter lors d’une élection fédérale, vous devez prouver votre identité et votre adresse.'
          : 'To vote at the federal election you have to prove your identity and address.',
    }),
  waysToVote: (lang: Lang) => src(lang === 'fr' ? 'Façons de voter' : 'Ways to vote', URLS.waysToVote[lang], '2026-02-17'),
  futureElectors: (lang: Lang) =>
    src(lang === 'fr' ? 'Registre des futurs électeurs' : 'Register of Future Electors', URLS.futureElectors[lang], '2025-10-31', {
      quote: lang === 'fr' ? 'Pour t’inscrire, tu dois : être citoyen canadien; avoir entre 14 et 17 ans; vivre au Canada.' : 'To register, you must be: a Canadian citizen; between 14 and 17 years old; living in Canada.',
    }),
  abroad: (lang: Lang) =>
    src(lang === 'fr' ? 'Registre international des électeurs' : 'International Register of Electors', URLS.abroad[lang], '2026-02-04', {
      quote:
        lang === 'fr'
          ? 'Vous devez : être citoyen canadien et avoir au moins 18 ans le jour de l’élection; vivre à l’extérieur du Canada; avoir déjà habité au Canada à un moment donné dans votre vie.'
          : 'You must: be a Canadian citizen and at least 18 years old on polling day; be living outside Canada; have lived in Canada at some point in your life.',
    }),
  legislativeProcess: (lang: Lang) =>
    src(lang === 'fr' ? 'Processus législatif (Chambre des communes)' : 'Legislative process (House of Commons)', URLS.legislativeProcess[lang], undefined, {
      quote:
        lang === 'fr'
          ? 'Un projet de loi ne peut devenir loi que lorsque les deux Chambres ont convenu d’adopter le même libellé et qu’il a reçu la sanction royale.'
          : 'A bill can become law only once the same text has been approved by both Houses of Parliament and has received royal assent.',
    }),
  senate: (lang: Lang) =>
    src(lang === 'fr' ? 'À propos du Sénat' : 'About the Senate', URLS.senate[lang], undefined, {
      quote:
        lang === 'fr'
          ? 'Les 105 sénateurs du Parlement façonnent l’avenir du pays.'
          : 'Parliament’s 105 senators shape Canada’s future.',
    }),
  legisinfo: (lang: Lang, opts?: LiveOpts) => liveSrc(lang === 'fr' ? 'LEGISinfo : projets de loi' : 'LEGISinfo: bills before Parliament', URLS.legisinfo[lang], opts),
  news: (lang: Lang, opts?: LiveOpts) => liveSrc(lang === 'fr' ? 'Nouvelles du gouvernement du Canada' : 'Government of Canada news', URLS.news[lang], opts),
  howGovernmentWorks: (lang: Lang) =>
    src(lang === 'fr' ? 'Comment le gouvernement fonctionne' : 'How government works', URLS.howGovernmentWorks[lang], '2025-05-16'),
};

/**
 * Sources for a vacant seat. The live seat list is what says the seat is empty, so it leads (the widget's
 * footer shows the first source, and it agrees with the "Live" badge); Elections Canada runs the by-election.
 */
export const vacantSources = (lang: Lang, today?: string) => [SOURCES.standings(lang, { today }), SOURCES.findRiding(lang), SOURCES.electionsHome(lang), SOURCES.members(lang)];

/** News item types in the canada.ca news centre (api.io.canada.ca `type=`). */
export const NEWS_TYPES = ['newsreleases', 'statements', 'mediaadvisories', 'backgrounders', 'speeches', 'readouts'] as const;
export type NewsType = (typeof NEWS_TYPES)[number];
