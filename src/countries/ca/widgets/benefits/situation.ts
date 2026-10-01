/**
 * Reading a life situation out of a question (EN + FR): income, household, children and their ages, the person's
 * own age, job loss, disability, province. Used by the scripted scenarios; tested in ./situation.test.mjs.
 */
import type { FinderInput } from './build';
import type { AgeBand } from './calc';
import { PROVINCES, type Province } from './rates';

const WORDS: Record<string, number> = { a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, un: 1, une: 1, deux: 2, trois: 3, quatre: 4, cinq: 5 };
const num = (s: string) => (/^\d+$/.test(s) ? Number(s) : (WORDS[s.toLowerCase()] ?? 0));

export function incomeIn(text: string): number | undefined {
  const k = text.match(/\$\s?(\d{2,3}(?:[.,]\d)?)\s?k\b|\b(\d{2,3}(?:[.,]\d)?)\s?k\s?\$?|\b(\d{2,3})\s?k\b/i);
  if (k) return Math.round(Number((k[1] ?? k[2] ?? k[3]).replace(',', '.')) * 1000);
  const full = text.match(/\$\s?(\d{1,3}(?:[,\s ]\d{3})+|\d{4,6})\b|\b(\d{1,3}(?:[\s .]\d{3})+|\d{4,6})\s?\$/);
  if (full) return Number((full[1] ?? full[2]).replace(/[^\d]/g, ''));
  return undefined;
}

/** A count as people write it: "2", "two", "deux". */
const N = String.raw`\d+|a|an|one|two|three|four|five|un|une|deux|trois|quatre|cinq`;
const KIDS = /\b(\d+|a|an|one|two|three|four|five|un|une|deux|trois|quatre|cinq)\s+(?:young\s+|little\s+|jeunes?\s+|petits?\s+)?(kids?|children|child|toddlers?|babies|baby|enfants?|bébés?|tout-petits?)\b/i;

/** A list of ages: "3", "3 and 8", "3, 5 and 8", "3 & 8", "3 ans et 8 ans". */
const LIST = String.raw`\d{1,2}(?:\s*ans)?(?:(?:\s*,\s*(?:and\s+|et\s+)?|\s+(?:and|et)\s+|\s*&\s*)\d{1,2}(?:\s*ans)?)*`;
const LIST2 = String.raw`\d{1,2}(?:\s*ans)?(?:(?:\s*,\s*(?:and\s+|et\s+)?|\s+(?:and|et)\s+|\s*&\s*)\d{1,2}(?:\s*ans)?)+`;
const CHILD_WORD = String.raw`(?:kids?|children|child|sons?|daughters?|boys?|girls?|twins|enfants?|fils|filles?|garçons?|jumeaux|jumelles|bébés?)`;
/** Ways people give their children's ages, EN + FR. Every number under 18 in a matched phrase is a child's age. */
const AGE_PHRASES: RegExp[] = [
  new RegExp(String.raw`\b(?:ages?|aged)\s+(${LIST})\b(?!\s*(?:to|à|-|–)\s*\d)`, 'gi'), // ages 3 and 8 · aged 3, 5 and 8 (not the group "aged 6 to 17")
  new RegExp(String.raw`\b(${LIST})[\s-]+(?:years?|yrs?)[\s-]+olds?\b`, 'gi'), // 3 and 8 years old · a 3-year-old
  new RegExp(String.raw`\b(?:they(?:[’']re|\s+are)|who\s+are)\s+(${LIST2})\b`, 'gi'), // they're 3 and 8
  new RegExp(String.raw`\b${CHILD_WORD}\s+(?:are|is)\s+(${LIST})\b`, 'gi'), // my kids are 3 and 8 · my son is 4
  new RegExp(String.raw`\b(?:one|the other|the other one|another|the (?:older|younger|oldest|youngest)(?: one)?)\s+is\s+(\d{1,2})\b`, 'gi'), // one is 3 and one is 8
  new RegExp(String.raw`(?:^|[^\p{L}])âgée?s?\s+de\s+(${LIST})\s*ans\b`, 'giu'), // âgés de 3 et 8 ans
  new RegExp(String.raw`(?:^|[^\p{L}])${CHILD_WORD}\s+de\s+(${LIST})\s*ans\b`, 'giu'), // deux enfants de 3 et 8 ans
  new RegExp(String.raw`(?:^|[^\p{L}])de\s+(${LIST2})\s*ans\b`, 'giu'), // de 3 et 8 ans
  new RegExp(String.raw`(?:^|[^\p{L}])(?:ils|elles|qui)\s+ont\s+(${LIST})\s*ans\b`, 'giu'), // ils ont 3 et 8 ans
  new RegExp(String.raw`(?:^|[^\p{L}])l[’'](?:une?|autre|aîné(?:e)?|cadet(?:te)?)\s+(?:a\s+)?(\d{1,2})\s*ans\b`, 'giu'), // l’un a 3 ans et l’autre 8 ans
];

/** Children's ages the person gave, and where they were in the text (so they're never read as the person's own age). */
export function childAgesIn(text: string): { ages: number[]; spans: [number, number][] } {
  const found: { start: number; end: number; ages: number[] }[] = [];
  for (const re of AGE_PHRASES) {
    for (const m of text.matchAll(re)) {
      const start = m.index ?? 0;
      found.push({ start, end: start + m[0].length, ages: [...m[1].matchAll(/\d{1,2}/g)].map((d) => Number(d[0])) });
    }
  }
  const spans: [number, number][] = [];
  const ages: number[] = [];
  for (const f of found.sort((a, b) => a.start - b.start || b.end - a.end)) {
    if (spans.some(([s, e]) => f.start < e && f.end > s)) continue; // the same words matched by two phrasings
    const kidsAges = f.ages.filter((a) => a < 18);
    if (!kidsAges.length) continue;
    spans.push([f.start, f.end]);
    ages.push(...kidsAges);
  }
  return { ages, spans };
}

/** Words that may sit between a count and its age group: "two kids, both are under 6", "2 enfants âgés de 6 à 17 ans". */
const LINK = String.raw`(?:(?:who|that|qui|are|is|sont|est|ont|a|all|both|tous|toutes|âgée?s?|aged?|ages|between|entre|de|from)\s+){0,4}`;
const KID_WORD = String.raw`(?:young\s+|little\s+|jeunes?\s+|petits?\s+)?(?:kids?|children|child|toddlers?|babies|baby|sons?|daughters?|boys?|girls?|enfants?|bébés?|tout-petits?|fils|filles?|garçons?)`;
const UP_TO_SIX = String.raw`(?:[1-6]|one|two|three|four|five|six|un|deux|trois|quatre|cinq)`;
/** "under 6", "under five", "younger than 4", "de moins de 6 ans", "en bas de 6 ans": every such child is under 6. Not "under 60" or "under 6%". */
const UNDER = String.raw`(?:(?:under|below|younger\s+than)\s+(?:the\s+age\s+of\s+|age\s+)?${UP_TO_SIX}\b(?![.,]?\d|\s*(?:k\b|%|\$))|(?:moins\s+de|en\s+bas\s+de)\s+${UP_TO_SIX}\s+ans\b)`;
/** "aged 6 to 17", "6-17", "de 6 à 17 ans", "over 6", "de plus de 6 ans". */
const OLDER = String.raw`(?:(?:6|six)\s*(?:to|and|-|–|à|et)\s*17\b|(?:over|older\s+than)\s+(?:6|six)\b(?![.,]?\d|\s*(?:k\b|%|\$))|plus\s+de\s+(?:6|six)\s+ans\b)`;
const COUNT_UNDER = new RegExp(String.raw`\b(${N})(?:\s+${KID_WORD})?[,:;]?\s+${LINK}${UNDER}`, 'i');
const COUNT_OLDER = new RegExp(String.raw`\b(${N})(?:\s+${KID_WORD})?[,:;]?\s+${LINK}${OLDER}`, 'i');
/** "both kids are under 6", "they’re all under 6", "all three are under 5", "les deux ont moins de 6 ans". */
const ALL_UNDER = new RegExp(
  String.raw`\b(?:(both|les\s+deux)|all|tous|toutes)(?:\s+(?:les\s+)?(${N}))?(?:\s+(?:of\s+)?(?:them|(?:(?:my|our|the|mes|nos|les)\s+)?${KID_WORD}))?[,:;]?\s+${LINK}${UNDER}`,
  'i',
);

/**
 * Children by age group, when the person gave groups instead of ages: "two kids under 6", "1 child under 6 and
 * 2 children aged 6 to 17" (the finder's own follow-ups), "three kids, one under 6", "both kids are under 6".
 * `kidCount` is how many children they said they have (0 when they gave no count).
 */
function ageGroupsIn(text: string, kidCount: number): { under6: number; age6to17: number } | undefined {
  const under = text.match(COUNT_UNDER);
  const older = text.match(COUNT_OLDER);
  if (under || older) {
    const u = under ? num(under[1]) : undefined;
    const o = older ? num(older[1]) : undefined;
    // One group given with a bigger family: the rest are in the other group ("three kids, one under 6").
    return { under6: u ?? Math.max(kidCount - (o ?? 0), 0), age6to17: o ?? Math.max(kidCount - (u ?? 0), 0) };
  }
  const all = text.match(ALL_UNDER);
  if (all) {
    const n = all[2] ? num(all[2]) : all[1] ? kidCount || 2 : kidCount;
    if (n > 0) return { under6: n, age6to17: 0 };
  }
  return undefined;
}

/** What the person said, as tool input. `children` = a count without ages (the widget asks how many are under 6). */
export function situationIn(text: string): FinderInput {
  const p: FinderInput = {};
  const income = incomeIn(text);
  if (income != null && income <= 1_000_000) p.income = income;

  if (/\b(wife|husband|partner|spouse|married|common[- ]law|my girlfriend|my boyfriend|conjoint|conjointe|mari|ma femme|époux|épouse|mariés?)\b/i.test(text)) p.household = 'couple';
  else if (/\b(we|our|us|nous|notre|nos)\b/i.test(text) && !/\b(single|seule?|monoparental\w*)\b/i.test(text)) p.household = 'couple';
  else if (/\b(single|divorced|separated|widow(ed|er)?|on my own|single (mom|dad|parent)|seule?|célibataire|divorcée?|séparée?|veuve?|monoparental\w*)\b/i.test(text)) p.household = 'single';

  const kids = text.match(KIDS);
  const kidCount = kids ? num(kids[1]) : 0;
  const { ages, spans } = childAgesIn(text);
  const groups = ageGroupsIn(text, kidCount);
  if (groups) {
    p.childrenUnder6 = groups.under6;
    p.children6to17 = groups.age6to17;
  } else if (ages.length && ages.length >= kidCount) {
    p.childrenUnder6 = ages.filter((a) => a < 6).length;
    p.children6to17 = ages.filter((a) => a >= 6).length;
  } else if (/\b(baby|newborn|pregnant|expecting|bébé|nouveau-né|enceinte)\b/i.test(text) && !kids) {
    p.childrenUnder6 = 1;
    p.children6to17 = 0;
  } else if (kids) {
    const n = kidCount;
    if (n > 0) {
      const young = /\b(baby|babies|toddlers?|bébés?|tout-petits?|young|little|jeunes?|petits?)\b/i.test(kids[0]);
      if (young) {
        p.childrenUnder6 = n;
        p.children6to17 = 0;
      } else p.children = n; // ages unknown (or only some given): don't guess them
    }
  } else if (/\b(no (kids|children)|sans enfants?|pas d[’']enfants?)\b/i.test(text)) {
    p.childrenUnder6 = 0;
    p.children6to17 = 0;
  }

  // The person's own age, from the text without the children's ages ("they're 16 and 17 years old" is not them).
  let own = text;
  for (const [s, e] of spans) own = own.slice(0, s) + ' '.repeat(e - s) + own.slice(e);
  const age = own.match(/\b(?:i[’']?m|i am|aged?)\s+(\d{2})\b|\b(\d{2})\s+years? old\b|\bj[’']ai\s+(\d{2})\s+ans\b/i);
  const a = age ? Number(age[1] ?? age[2] ?? age[3]) : undefined;
  if (a != null && a >= 16 && a <= 110) p.age = (a < 19 ? 'under-19' : a < 60 ? '19-59' : a < 65 ? '60-64' : a < 75 ? '65-74' : '75-plus') as AgeBand;
  else if (/\b(retired|retiring|retirement|senior|pensioner|retraité\w*|retraite|aîné\w*)\b/i.test(text)) p.age = '65-74';

  if (/\b(lost|lose|losing|quit) (my |our )?job\b|\b(laid off|got fired|unemployed|out of work)\b|\b(perdu|perte de|perdre) (mon |d[’'] ?)?emploi\b|\b(mise? à pied|sans emploi|chômage)\b/i.test(text)) p.jobLoss = true;
  if (/\b(full[- ]time student|student|college|university|étudiante?|cégep|université)\b/i.test(text)) p.student = true;
  const dtcKids = text.match(/\b(\d+)\s+(?:with the disability tax credit|admissibles? au crédit d[’']impôt pour personnes handicapées)/i);
  if (dtcKids) p.childDisability = Number(dtcKids[1]);
  else if (/\b(child|son|daughter|kid|enfant|fils|fille)\b[^.]{0,40}\b(disabilit\w*|disabled|autism|handicap\w*|autis\w*)/i.test(text)) p.childDisability = 1;
  else if (/\b(disabilit\w*|disabled|handicap\w*|disability tax credit|DTC|CIPH)\b/i.test(text)) p.disability = true;
  if (/\b(no dental (insurance|coverage|plan)|sans assurance dentaire)\b/i.test(text)) p.dentalInsurance = false;

  const prov: [RegExp, Province][] = [
    [/\b(ontario)\b/i, 'ON'],
    [/\b(quebec|québec)\b/i, 'QC'],
    [/\b(british columbia|colombie-britannique|BC)\b/i, 'BC'],
    [/\balberta\b/i, 'AB'],
    [/\bmanitoba\b/i, 'MB'],
    [/\bsaskatchewan\b/i, 'SK'],
    [/\b(nova scotia|nouvelle-écosse)\b/i, 'NS'],
    [/\b(new brunswick|nouveau-brunswick)\b/i, 'NB'],
    [/\b(newfoundland|terre-neuve)\b/i, 'NL'],
    [/\b(prince edward island|île-du-prince-édouard|PEI)\b/i, 'PE'],
    [/\b(northwest territories|territoires du nord-ouest)\b/i, 'NT'],
    [/\bnunavut\b/i, 'NU'],
    [/\byukon\b/i, 'YT'],
  ];
  const pr = prov.find(([re]) => re.test(text))?.[1];
  if (pr && (PROVINCES as readonly string[]).includes(pr)) p.province = pr;
  return p;
}

/** Words for putting the pension off (EN + FR). The OAS scenario matches on the same ones. */
export const OAS_DEFER = /\b(?:delay\w*|defer\w*|postpon\w*|wait(?:ing)?\s+(?:until|till|to)|hold(?:ing)? off)\b|\b(?:report(?:er|ez|ais|ant|e|é|ée)|report (?:de|après)|retard(?:er|e|ant)|attend(?:s|re|ant|ais|ez)|différ(?:er|e|é|ant))(?![\wà-ÿ])/i;
/** A start age from 65 to 70: "at 70", "until age 67", "à 70 ans", "jusqu’à l’âge de 68 ans". Not "$70k" or "65 years in Canada". */
export const OAS_START = /(?:^|[\s(,;:’'])(?:at|until|till|to|à|jusqu[’']à|dès)\s+(?:age\s+|l[’']âge de\s+)?(6[5-9]|70)(?![\d.,]\d|\s*(?:%|k\b|\$|years? in\b|ans au\b))/i;

/**
 * What an OAS question says: years in Canada, income, whether they're 75 or older, and the age they'd start at
 * (65 to 70). A question about waiting that names no age is about the longest wait: 70.
 */
const OAS_MAX_START = 70;

export function oasIn(text: string): { yearsInCanada?: number; income?: number; age75?: boolean; startAge?: number } {
  const years = text.match(/\b(\d{1,2})\s+(years|ans)\b.*\b(canada)\b|\b(canada)\b.*\b(?:for\s+)?(\d{1,2})\s+(years|ans)\b/i);
  const y = years ? Number(years[1] ?? years[5]) : undefined;
  // An age, not any number (an income like "$85,000" must not read as 85 years old).
  const age75 = /\b(?:i[’']?m|i am|aged?)\s+(?:7[5-9]|[89]\d)\b|\b(?:7[5-9]|[89]\d)\s+(?:years old|ans)\b|\b75 (?:or older|and over)\b|\b75 ans (?:ou|et) plus\b/i.test(text);
  // "At 65 or at 70?" is about the later age; waiting with no age named is about the longest wait.
  const ages = [...text.matchAll(new RegExp(OAS_START.source, 'gi'))].map((m) => Number(m[1]));
  const startAge = ages.length ? Math.max(...ages) : OAS_DEFER.test(text) ? OAS_MAX_START : undefined;
  return { yearsInCanada: y, income: incomeIn(text), age75: age75 || undefined, startAge };
}
