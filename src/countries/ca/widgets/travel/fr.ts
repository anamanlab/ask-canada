/**
 * French "in <destination>" with the right preposition: au Mexique, en France, aux États-Unis, à Cuba.
 * Rules of thumb for country names plus the exceptions that matter for the 230 travel.gc.ca destinations.
 */
const A = new Set([
  'cuba', 'haïti', 'madagascar', 'malte', 'chypre', 'singapour', 'taïwan', 'hong kong', 'macao', 'maurice', 'monaco', 'bahreïn',
  'la réunion', 'sainte-lucie', 'saint-marin', 'saint-martin', 'saint-barthélemy', 'saint-pierre-et-miquelon', 'saint-kitts-et-nevis',
  'saint-vincent-et-grenadines', 'antigua-et-barbuda', 'trinité-et-tobago', 'sao tomé-et-principe', 'porto rico', 'guam', 'aruba', 'curaçao',
  'bonaire', 'sint maarten', 'montserrat', 'anguilla', 'niue', 'nauru', 'tuvalu', 'kiribati', 'tokelau', 'palaos', 'mayotte', 'gibraltar',
  'la barbade', 'barbade', 'la dominique', 'dominique', 'la grenade', 'grenade', 'djibouti', 'tonga', 'oman', 'bermudes', 'israël', 'cabo verde',
]);
const AU_EXCEPTIONS = new Set(['mexique', 'cambodge', 'mozambique', 'zimbabwe', 'belize', 'suriname', 'bélarus', 'kosovo']);
const ARTICLE: Record<string, string> = {
  barbade: 'à la Barbade',
  dominique: 'à la Dominique',
  grenade: 'à la Grenade',
  'la réunion': 'à La Réunion',
  fidji: 'aux Fidji',
  honduras: 'au Honduras',
  yémen: 'au Yémen',
  samoa: 'au Samoa',
  'israël et la palestine': 'en Israël et en Palestine',
  'micronésie (efm)': 'en Micronésie (EFM)',
  moldova: 'en Moldova',
  'timor-leste (timor oriental)': 'au Timor-Leste',
  'timor-leste': 'au Timor-Leste',
};

export function frIn(name: string): string {
  const n = name.trim();
  const k = n.toLowerCase();
  if (ARTICLE[k]) return ARTICLE[k];
  if (A.has(k)) return k === 'bermudes' ? 'aux Bermudes' : `à ${n}`;
  if (/^(îles?|émirats|états-unis|pays-bas|philippines|maldives|seychelles|comores|bahamas|samoa américaines|açores|îles canaries)/i.test(n) || /s$/i.test(k) && !/^(laos|honduras|belarus|bélarus|chypre)$/i.test(k)) {
    return `aux ${n.replace(/^Îles?/, (m) => m.toLowerCase())}`;
  }
  if (/^[aeiouyéèêâîôûœh]/i.test(n)) return `en ${n}`;
  if (k.endsWith('e') && !AU_EXCEPTIONS.has(k)) return `en ${n}`;
  if (/^(république|guinée|nouvelle|papouasie|polynésie|guyane|macédoine|corée|bosnie|arabie|afrique|côte)/i.test(n)) return `en ${n}`;
  return `au ${n}`;
}

/** Same, capitalized for the start of a sentence: "Au Mexique". */
export const FrIn = (name: string) => {
  const s = frIn(name);
  return s.charAt(0).toUpperCase() + s.slice(1);
};
