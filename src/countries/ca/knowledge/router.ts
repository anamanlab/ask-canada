/**
 * Department router: picks the 1–2 most relevant departments for a question with cheap EN/FR keyword
 * heuristics (no embeddings), so their CDS AI Answers guidance can be injected into the system prompt.
 * The model can still load any other department with the `officialGuidance` tool.
 */
import 'server-only';
import { loadGuidance } from './index';

const RULES: [string, RegExp][] = [
  ['ircc', /\b(passport|passeport|visa|eta|ave|immigra\w*|citizen\w*|citoyen\w*|permanent resident|résident permanent|pr card|carte rp|study permit|permis d[’']études|work permit|permis de travail|refugee|réfugié\w*|express entry|entrée express|sponsor\w*|parrain\w*)\b/i],
  ['cra-arc', /\b(tax\w*|impôt\w*|cra|arc|gst|hst|tps|tvh|rrsp|reer|tfsa|celi|fhsa|celiapp|refund|rembours\w*|netfile|t4|notice of assessment|avis de cotisation|canada child benefit|allocation canadienne pour enfants|ccb|ace|disability tax credit|crédit d[’']impôt pour personnes handicapées)\b/i],
  ['edsc-esdc', /\b(employment insurance|assurance-emploi|\bei\b|\bae\b|record of employment|relevé d[’']emploi|cpp|rpc|old age security|sécurité de la vieillesse|oas|gis|srg|pension|service canada|sin|nas|social insurance|assurance sociale|canada disability benefit|prestation canadienne pour les personnes handicapées|dental care|soins dentaires|student loan|prêt étudiant|job bank|guichet-emplois)\b/i],
  ['hc-sc', /\b(health canada|santé canada|recall\w*|rappel\w*|drug\w*|médicament\w*|vaccin\w*|cannabis|food safety|salubrité|natural health|phac|aspc|public health|santé publique)\b/i],
  ['cbsa-asfc', /\b(border|frontière|customs|douane\w*|duty|droits|declar\w* (goods|marchandises)|arrivecan|nexus|import\w*|export\w*|cbsa|asfc)\b/i],
  ['eccc', /\b(weather|météo|forecast|prévision\w*|alert\w*|avertissement\w*|air quality|qualité de l[’']air|wildfire smoke|fumée|climate|climat|environment\w*|environnement)\b/i],
  ['tc', /\b(transport canada|drone\w*|boat\w*|bateau|pleasure craft|embarcation|vehicle recall|rappel de véhicule|car seat|siège d[’']auto|aviation|flight|vol aérien|rail)\b/i],
  ['vac-acc', /\b(veteran\w*|vétéran\w*|anciens combattants|remembrance|souvenir)\b/i],
  ['dnd-mdn', /\b(armed forces|forces armées|military|militaire|caf|faf|reserve force|réserve|recruit\w*|recrut\w*|national defence|défense nationale)\b/i],
  ['ceo-bec', /\b(vote|voter|élection\w*|election\w*|elections canada|élections canada|ballot|bulletin de vote|register to vote|s[’']inscrire pour voter)\b/i],
  ['ised-isde', /\b(business number|numéro d[’']entreprise|incorporat\w*|constitution en société|corporation|trademark|marque de commerce|patent|brevet|small business|petite entreprise|grant\w* for business|subvention\w*)\b/i],
  ['sac-isc', /\b(indigenous|autochtone\w*|first nations?|premières nations|inuit|métis|status card|carte de statut|jordan[’']s principle|principe de jordan)\b/i],
  ['statcan', /\b(statistic\w*|statistique\w*|census|recensement|statcan|inflation rate|taux d[’']inflation)\b/i],
  ['bac-lac', /\b(archives?|genealog\w*|généalog\w*|ancestor\w*|ancêtre\w*|library and archives|bibliothèque et archives)\b/i],
  ['fin', /\b(budget|finance canada|tariff\w*|tarif\w*|counter-tariff\w*|contre-mesures?)\b/i],
  ['jus', /\b(divorce|family law|droit de la famille|criminal code|code criminel|pardon|record suspension|suspension du casier)\b/i],
  ['nrcan-rncan', /\b(home energy|énergie domestique|greener homes|maisons plus vertes|heat pump|thermopompe|natural resources|ressources naturelles|forestry|forest\w*)\b/i],
];

export function routeDepartments(text: string, max = 2): string[] {
  const scored = RULES.map(([dept, re]) => [dept, (text.match(new RegExp(re.source, 'gi')) ?? []).length] as const)
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1]);
  return scored.slice(0, max).map(([d]) => d);
}

/** System-prompt block with the routed departments' guidance for this turn ('' when none match). */
export async function groundingForTurn(text: string): Promise<string> {
  const depts = routeDepartments(text);
  if (!depts.length) return '';
  const blocks = await Promise.all(depts.map((d) => loadGuidance(d)));
  const body = blocks
    .filter((b): b is NonNullable<typeof b> => Boolean(b))
    .map((b) => `### ${b.name}\n${b.guidance.trim()}`)
    .join('\n\n');
  return body
    ? `## Department guidance for this question (Canadian Digital Service AI Answers, MIT)
Expert-curated notes for the departments this question most likely concerns. Follow them for which pages to
cite and what to avoid. They were written for another assistant: ignore instructions about tools, tags or
downloads you don't have, and never give phone numbers or amounts they tell you not to.

${body}`
    : '';
}
