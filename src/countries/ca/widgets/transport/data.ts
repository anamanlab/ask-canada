/**
 * Transport & vehicles facts, verified on the official pages on 2026-09-30 (URL + "Date modified" below).
 * Used by the tools, fixtures and scenarios. The renderers never import this file: the few numbers they recalculate
 * with on the device live in constants.ts, and every link and source reaches them in the tool output.
 *
 * VEHICLE RECALLS (Transport Canada)
 * - Motor Vehicle Safety Recalls Database open API (live): https://data.tc.gc.ca/v1.3/api/{eng|fra}/vehicle-recall-database/
 *   recall/make-name/{make}/model-name/{model}/year-range/{y}-{y}[/count] and recall-summary/recall-number/{n}.
 *   Lists return 25 rows unless `?limit=N` is passed (2021 Ford F-150: 25 rows by default, 27 with ?limit=1000, /count = 27;
 *   2020 Ford Explorer: 33 rows = 29 unique recalls). We pass ?limit=1000, read /count in parallel and flag a truncated
 *   list if the count is still higher. One model year per search; model names match by prefix ("civ" → CIVIC).
 *   Summaries carry COMMENT_ETXT/FTXT with "Issue / Safety Risk / Corrective Actions" (FR: "Problème / Risques pour la
 *   sécurité / Mesures correctives"). Detail pages: wwwapps.tc.gc.ca/Saf-Sec-Sur/7/VRDB-BDRV/search-recherche/detail.aspx?lang=eng&rn=2026251
 * - Defects and recalls hub (2025-01-22): report a defect; 1-800-333-0510 (toll free in Canada), 819-420-4300,
 *   Mon–Fri 8 am–4 pm ET. https://tc.canada.ca/en/road-transportation/defects-recalls-vehicles-tires-child-car-seats
 * - "The manufacturer will almost always make these repairs free of charge." Check with the manufacturer's VIN lookup or a
 *   dealer. importance-having-recalled-vehicles-repaired (2019-03-08)
 * - Manufacturer VIN recall lookups + phone numbers: TC list find-vehicle-tire-child-car-seat-manufacturer (2019-04-16,
 *   CSV export read 2026-09-30).
 *
 * DRONES (Transport Canada, Part IX CARs as amended Nov 4, 2025)
 * - Size: micro < 250 g; small 250 g–25 kg; medium > 25 kg–150 kg; large > 150 kg (special operations).
 *   drone-operation-categories-pilot-certificates (2025-11-04)
 * - Minimum age: Basic 14, Advanced 16, Level 1 Complex 18 (same page). Exceptions (CAR SOR/96-433, read on
 *   laws-lois.justice.gc.ca 2026-09-30): 901.54(2) Basic and 901.63(2) Advanced age/certificate rules don't apply "if the
 *   operation … is conducted under the direct supervision of a person who is permitted to operate such a system" (Basic:
 *   under Div. IV, V or VI; Advanced: Div. V or VI). 901.89(2) Level 1 Complex: only for training, supervised by someone 18+
 *   permitted under Div. VI. 900.15(2): a registered owner must be at least 14.
 * - Basic ops: ≤ 25 kg, VLOS, > 30 m horizontally from any person, uncontrolled airspace, > 5.6 km from a certified airport,
 *   > 1.9 km from a heliport. basic-operations (2026-03-19). Fines (individuals): up to $1,000 no certificate, $3,000 where
 *   not allowed, $3,000 endangering, $5,000 unregistered/unmarked.
 * - Advanced: pass Advanced Exam + flight review + apply for certificate. advanced-operations (2026-03-19)
 * - Level 1 Complex (BVLOS): Advanced Exam, ≥ 20 h ground school, Level 1 Complex Exam, flight review, certificate; fly under
 *   an RPOC. level-1-complex-operations (2026-03-19); apply-rpas-operator-certificate-rpoc (2026-07-30)
 * - Exams: Small Basic 35 questions / 90 min / 65 %; Advanced 50 / 60 min / 80 %; retry after 24 h. take-drone-pilot-online-exam
 *   (2025-11-04, 2025-04-01). Recency: one qualifying activity in the previous 24 months. keep-your-drone-pilot-skills (2026-05-28)
 * - Registration: all drones ≥ 250 g; mark the registration number on the drone. registering-your-drone (2026-03-19)
 * - Fees are indexed every April 1; canada.ca pages load them live from https://api.tc.canada.ca/siapi/api/v2/fees/id=svc-NNNNNN:
 *   202935 registration, 202990 Basic/Advanced exam, 202936 Level 1 Complex exam, 202991 Advanced certificate,
 *   202937 Level 1 Complex certificate, 202942 RPOC. Schedules below were read from that API on 2026-09-30.
 * - Microdrones: no registration or certificate; an SFOC is required at advertised events. microdrones (2025-11-04)
 *
 * BOATING (Transport Canada)
 * - Proof of competency for any motorized pleasure craft used for recreation, all motor types incl. electric trolling motors, even
 *   when the motor is off. Not required in Nunavut / NWT waters, or for visitors operating their own boat < 45 consecutive days.
 *   Youth: under 12 unsupervised ≤ 10 hp (7.5 kW); 12–15 unsupervised ≤ 40 hp (30 kW); under 16 no PWC regardless of supervision;
 *   "direct supervision" = someone 16+ in the boat. PCOC valid for life; paper/electronic copies not accepted; Boating Safety
 *   Infoline 1-800-267-6687. pleasure-craft-operator-card-pcoc (2024-05-30)
 * - Test can be challenged without a course, but only in person under an accredited provider; once per 24 h; fees set by providers
 *   (none go to the federal government). operator-card-pcoc-faq (2026-05-12)
 * - Lost or damaged card: contact the course provider who issued it (Course Provider Lookup, eve.tc.canada.ca/pcoc-ccep); only
 *   currently accredited providers may issue replacements, for a fee they set. operator-card-pcoc-faq (2026-05-12, re-read 2026-09-30)
 *
 * TRAVEL WITH CANNABIS / PETS
 * - Cannabis across the border in any form (incl. CBD, medical) is illegal without Health Canada authorization; declare it
 *   when entering. CBSA cannabis-eng.html (2021-03-26); travel.gc.ca drugs (2026-08-13). Penalties up to $2,000 for not
 *   declaring. CBSA penalties-sanctions-eng.html (2025-08-27)
 * - Domestic flights: allowed in carry-on and checked baggage; liquids/topicals follow the 1 L LAGs bag rule. CATSA (2022-12-22)
 * - Provinces and territories may add restrictions (lower possession limits, higher minimum age, where it can be used in
 *   public); "Go to your provincial or territorial website for more details." HC provinces-territories (2022-10-26)
 * - Public possession: 30 g dried or equivalent; 1 g dried = 5 g fresh = 15 g solids = 70 g non-solids = 0.25 g concentrates =
 *   570 g beverages = 1 seed. Health Canada calculator (2025-05-28)
 * - Pets: only dogs, cats and ferrets are pets for CFIA; requirements depend on origin, age, purpose. travelling-pets (2026-08-14)
 *   Dogs and cats 3 months or older entering Canada need a rabies vaccination certificate (in English or French, from a licensed
 *   vet, identifies the animal, currently vaccinated). CFIA import reference document (2025-10-08)
 *   Dogs to the U.S.: CDC rules since Aug 1, 2024; a dog that was in a high-risk country in the past 6 months can't enter the U.S.
 *   directly from Canada. dogs-usa (2024-08-01). Airlines set their own pet rules; take the pet out of its carrier at screening.
 *   travel.gc.ca pets (2024-11-27)
 *
 * ELECTRIC VEHICLES — Electric Vehicle Affordability Program (EVAP), Transport Canada
 * - Bought or leased (12 months+) on or after Feb 16, 2026, until Mar 31, 2031 or until funds run out. BEV/FCEV up to $5,000,
 *   PHEV up to $2,500 in 2026, stepping down each year (table below). Final transaction value ≤ $50,000 unless made in Canada;
 *   made in Canada or a free-trade partner; new, light-duty, highway-capable, 4+ wheels; demos < 10,000 km OK. Applied at the
 *   dealer; individuals get 1 incentive. overview (2026-09-10)
 * - Lease: (full amount ÷ 48) × months; 48+ months = full. questions-answers (2026-02-12)
 * - Funding: $2.275B; "As of September 1, 2026, there is $2.00B in remaining funds." EVAP page (2026-09-04, read live)
 * - Vehicle list (live, 129 rows on 2026-09-30; a maple leaf marks Canadian-made). vehicle-list (2026-03-10)
 */
import { EVAP, OFFICIAL, type Lang } from './constants';

export { EVAP };
export type { Lang };
/** The day every page below was last read. */
export const CHECKED = '2026-09-30';
export const L = (lang?: string): Lang => (lang === 'fr' ? 'fr' : 'en');

const TC = { en: 'https://tc.canada.ca/en', fr: 'https://tc.canada.ca/fr' };
const DRONE = { en: `${TC.en}/aviation/drone-safety`, fr: `${TC.fr}/aviation/securite-drones` };
const RECALL = {
  en: `${TC.en}/road-transportation/defects-recalls-vehicles-tires-child-car-seats`,
  fr: `${TC.fr}/transport-routier/defauts-rappels-vehicules-pneus-sieges-auto-enfant`,
};
const EV = OFFICIAL.ev;

export const URLS = {
  recalls: { en: RECALL.en, fr: RECALL.fr },
  recallsDb: OFFICIAL.recallsDb,
  recallRepair: {
    en: `${RECALL.en}/importance-having-recalled-vehicles-repaired`,
    fr: `${RECALL.fr}/importance-faire-reparer-vehicules-faisant-objet-rappel`,
  },
  manufacturers: {
    en: `${RECALL.en}/find-vehicle-tire-child-car-seat-manufacturer`,
    fr: `${RECALL.fr}/trouver-fabricant-vehicules-pneus-sieges-auto-enfant`,
  },
  reportDefect: {
    en: `${RECALL.en}/report-potential-safety-defect-vehicles-tires-child-car-seats`,
    fr: `${RECALL.fr}/signaler-defaut-potentiel-lie-securite-vehicules-pneus-sieges-auto-enfant`,
  },
  drone: DRONE,
  droneCategories: OFFICIAL.droneCategories,
  droneBasic: {
    en: `${DRONE.en}/learn-rules-you-fly-your-drone/drone-operation-categories-pilot-certificates/basic-operations`,
    fr: `${DRONE.fr}/apprenez-regles-avant-piloter-votre-drone/categories-operations-drone-certificats-pilote/operations-base`,
  },
  droneAdvanced: {
    en: `${DRONE.en}/learn-rules-you-fly-your-drone/drone-operation-categories-pilot-certificates/advanced-operations`,
    fr: `${DRONE.fr}/apprenez-regles-avant-piloter-votre-drone/categories-operations-drone-certificats-pilote/operations-avancees`,
  },
  droneComplex: {
    en: `${DRONE.en}/learn-rules-you-fly-your-drone/drone-operation-categories-pilot-certificates/level-1-complex-operations`,
    fr: `${DRONE.fr}/apprenez-regles-avant-piloter-votre-drone/categories-operations-drone-certificats-pilote/operations-complexes-niveau-1`,
  },
  droneMicro: {
    en: `${DRONE.en}/learn-rules-you-fly-your-drone/drone-operation-categories-pilot-certificates/microdrones`,
    fr: `${DRONE.fr}/apprenez-regles-avant-piloter-votre-drone/categories-operations-drone-certificats-pilote/microdrones`,
  },
  droneSpecial: {
    en: `${DRONE.en}/drone-pilot-licensing/get-permission-special-drone-operations`,
    fr: `${DRONE.fr}/licence-pilote-drone/obtenir-autorisation-operations-speciales-drones`,
  },
  /** Canadian Aviation Regulations, Part IX: pilot age rules and their direct-supervision exceptions. */
  carPilot: {
    basic: {
      en: 'https://laws-lois.justice.gc.ca/eng/regulations/SOR-96-433/page-115.html#s-901.54',
      fr: 'https://laws-lois.justice.gc.ca/fra/reglements/DORS-96-433/page-115.html#s-901.54',
    },
    advanced: {
      en: 'https://laws-lois.justice.gc.ca/eng/regulations/SOR-96-433/page-115.html#s-901.63',
      fr: 'https://laws-lois.justice.gc.ca/fra/reglements/DORS-96-433/page-115.html#s-901.63',
    },
    complex: {
      en: 'https://laws-lois.justice.gc.ca/eng/regulations/SOR-96-433/page-116.html#s-901.89',
      fr: 'https://laws-lois.justice.gc.ca/fra/reglements/DORS-96-433/page-116.html#s-901.89',
    },
  },
  carOwner: {
    en: 'https://laws-lois.justice.gc.ca/eng/regulations/SOR-96-433/page-112.html#s-900.15',
    fr: 'https://laws-lois.justice.gc.ca/fra/reglements/DORS-96-433/page-112.html#s-900.15',
  },
  droneExam: {
    en: `${DRONE.en}/drone-pilot-licensing/take-drone-pilot-online-exam`,
    fr: `${DRONE.fr}/licence-pilote-drone/passez-examen-pilote-drone-ligne`,
  },
  droneRegister: { en: `${DRONE.en}/registering-your-drone`, fr: `${DRONE.fr}/immatriculer-votre-drone` },
  droneSchools: {
    en: `${DRONE.en}/drone-pilot-licensing/find-drone-flight-school`,
    fr: `${DRONE.fr}/licence-pilote-drone/trouver-ecole-pilotage-drone`,
  },
  droneRecency: {
    en: `${DRONE.en}/drone-pilot-licensing/keep-your-drone-pilot-skills`,
    fr: `${DRONE.fr}/licence-pilote-drone/maintenez-vos-competences-pilote-drone`,
  },
  dronePortal: { en: `${DRONE.en}/drone-management-portal`, fr: `${DRONE.fr}/portail-gestion-drones` },
  dronePortalSignIn: {
    en: 'https://secweb.tc.canada.ca/secure/UASIMS-SGISASP/eng/home',
    fr: 'https://secweb.tc.canada.ca/secure/UASIMS-SGISASP/fra/accueil',
  },
  pcoc: OFFICIAL.pcoc,
  pcocFaq: {
    en: `${TC.en}/marine-transportation/marine-safety/operator-card-pcoc-faq`,
    fr: `${TC.fr}/transport-maritime/securite-maritime/carte-conducteur-ccep-faq`,
  },
  pcocProviders: {
    en: `${TC.en}/marine-transportation/buying-boat/find-education-resources-recreational-boaters`,
    fr: `${TC.fr}/transport-maritime/acheter-bateau/trouver-ressources-formation-plaisanciers`,
  },
  pcocLookup: { en: 'https://eve.tc.canada.ca/pcoc-ccep', fr: 'https://eve.tc.canada.ca/fr/pcoc-ccep' },
  cannabisBorder: OFFICIAL.cannabisBorder,
  cannabisPenalties: {
    en: 'https://www.cbsa-asfc.gc.ca/travel-voyage/penalties-sanctions-eng.html',
    fr: 'https://www.cbsa-asfc.gc.ca/travel-voyage/penalties-sanctions-fra.html',
  },
  cannabisTravel: { en: 'https://travel.gc.ca/travelling/health-safety/drugs', fr: 'https://voyage.gc.ca/voyager/sante-securite/drogues' },
  cannabisFlights: {
    en: 'https://www.catsa-acsta.gc.ca/en/what-can-bring/item/cannabis-marijuana',
    fr: 'https://www.catsa-acsta.gc.ca/fr/que-puis-je-emporter/article/cannabis-marijuana',
  },
  cannabisLimit: {
    en: 'https://www.canada.ca/en/health-canada/services/drugs-medication/cannabis/online-calculator-limits-public-possession.html',
    fr: 'https://www.canada.ca/fr/sante-canada/services/drogues-medicaments/cannabis/calculatrice-en-ligne-limites-possession.html',
  },
  cannabisProvinces: {
    en: 'https://www.canada.ca/en/health-canada/services/drugs-medication/cannabis/laws-regulations/provinces-territories.html',
    fr: 'https://www.canada.ca/fr/sante-canada/services/drogues-medicaments/cannabis/lois-reglementation/provinces-territoires.html',
  },
  pets: OFFICIAL.pets,
  petsImport: {
    en: 'https://inspection.canada.ca/en/importing-food-plants-animals/pets',
    fr: 'https://inspection.canada.ca/fr/importation-aliments-vegetaux-ou-animaux/animaux-compagnie',
  },
  petsUs: {
    en: 'https://inspection.canada.ca/en/animal-health/terrestrial-animals/exports/pets/dogs-usa',
    fr: 'https://inspection.canada.ca/fr/sante-animaux/animaux-terrestres/exportation/animaux-compagnie/chiens-etats-unis-damerique',
  },
  petsTravel: { en: 'https://travel.gc.ca/travelling/health-safety/pets', fr: 'https://voyage.gc.ca/voyager/sante-securite/animaux' },
  ev: EV,
  evOverview: { en: `${EV.en}/overview`, fr: `${EV.fr}/apercu` },
  evList: { en: `${EV.en}/vehicle-list`, fr: `${TC.fr}/transport-routier/technologies-novatrices/vehicules-electriques/programme-abordabilite-vehicules-electriques-pave/liste-vehicules-pave` },
  evQa: { en: `${EV.en}/questions-answers`, fr: `${EV.fr}/questions-reponses` },
} as const;

/** Recall detail page on Transport Canada's database. */
export const recallUrl = (id: string, lang: Lang) =>
  `https://wwwapps.tc.gc.ca/Saf-Sec-Sur/7/VRDB-BDRV/search-recherche/detail.aspx?lang=${lang === 'fr' ? 'fra' : 'eng'}&rn=${encodeURIComponent(id)}`;

export const PHONES = {
  defects: '1-800-333-0510',
  defectsLocal: '819-420-4300',
  boating: '1-800-267-6687',
  dronePortal: '1-800-305-2059',
};

/* ───────────────────────── Drone fees (indexed each April 1) ───────────────────────── */

type FeeSchedule = { id: string; amounts: { amount: number; start: string; end?: string }[] };
const sched = (id: string, a: number, b: number, c: number): FeeSchedule => ({
  id,
  amounts: [
    { amount: a, start: '2025-04-01', end: '2026-03-31' },
    { amount: b, start: '2026-04-01', end: '2027-03-31' },
    { amount: c, start: '2027-04-01' },
  ],
});
export const DRONE_FEES = {
  registration: sched('svc-202935', 10, 10.17, 10.45),
  exam: sched('svc-202990', 10, 10.17, 10.45),
  complexExam: sched('svc-202936', 50, 50.85, 52.27),
  advancedCert: sched('svc-202991', 25, 25.43, 26.14),
  complexCert: sched('svc-202937', 125, 127.13, 130.68),
  rpoc: sched('svc-202942', 125, 127.13, 130.68),
};
export type DroneFeeKey = keyof typeof DRONE_FEES;

/** The fee in force on `date` (ISO). */
export function feeOn(s: FeeSchedule, date: string): number {
  const hit = s.amounts.filter((a) => a.start.slice(0, 10) <= date && (!a.end || a.end.slice(0, 10) >= date));
  return (hit[hit.length - 1] ?? s.amounts[s.amounts.length - 1]).amount;
}
