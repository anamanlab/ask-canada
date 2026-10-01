/** Scenario copy for processing times, including the paused Parents and Grandparents Program (EN + FR). */
import { countryFromText } from '../countries';
import { countryName } from '../country-name';
import { getTimes } from '../live';
import { programFromText, uniAll } from '../text';
import { isLive, QUEBEC_SPLIT, TIME_META, updatedOf, type Duration } from '../times';
import { durText, intl, longDate, msg, num, U, type Ctx } from './shared';

/** Short names for country-based applications (headlines). */
const SHORT = {
  en: { visitor: 'Visitor visa', supervisa: 'Super visa', study: 'Study permit', work: 'Work permit' },
  fr: { visitor: 'Visa de visiteur', supervisa: 'Super visa', study: 'Permis d’études', work: 'Permis de travail' },
};

export const TIMES_MATCH = uniAll([
  /\b(processing|wait(ing)?) times?\b/i,
  /\bhow long\b.*\b(does|do|will|is|to|for)\b.*\b(express entry|cec|fsw|pnp|pr|permanent residen\w*|spous\w*|partner|wife|husband|sponsor\w*|visitor visa|tourist visa|super ?visa|study permit|students?|work permit|e-?ta|pr card|iec|working holiday|visa|citizenship)\b/i,
  /\bd[ée]lais? de traitement\b/i,
  /\b(combien de temps|d[ée]lais?)\b.*\b(entr[ée]e express|r[ée]sidence permanente|parrainage|parrainer|visa|super visa|permis d['’][ée]tudes|[ée]tudiante?s?|permis de travail|ave|carte de r[ée]sident|eic|pvt|[ée]poux|[ée]pouse|conjointe?|mari|citoyennet[ée])\b/i,
]);
export const TIMES_EXCLUDE = uniAll([/\bpass(e)?port/i, /^(?!.*\b(processing|d[ée]lais? de traitement)\b).*\b(citizen\w*|citoyen\w*)\b/i]);

// The Parents and Grandparents Program is paused (sponsor-parents-grandparents.html, modified 2026-08-18):
// never present it as open, and never lead with an "if you apply today" time.
export const PARENTS_MATCH = uniAll([
  /\bsponsor\w*\b.*\b(parents?|grand-?parents?|mom|mother|dad|father|in-laws?)\b/i,
  /\b(parents?|grand-?parents?)\b.*\bsponsor\w*/i,
  /\b(pgp|parents and grandparents program)\b/i,
  /\bbring my (parents?|grand-?parents?|mom|mother|dad|father)\b.*\bcanada\b/i,
  /\bparrain\w*\b.*\b(parents?|grands?-parents?|m[èe]re|p[èe]re|beaux-parents)\b/i,
  /\b(parents?|grands?-parents?)\b.*\bparrain\w*/i,
  /\bprogramme des parents et des grands-parents\b/i,
  /\bfaire venir mes (parents?|grands?-parents?|m[èe]re|p[èe]re)\b/i,
  /\b(processing|wait(ing)?|how long)\b.*\b(parents?|grand-?parents?)\b/i,
  /\b(d[ée]lais?|combien de temps)\b.*\b(parents|grands-parents)\b/i,
]);
export const PARENTS_EXCLUDE = uniAll([/\b(super ?visa|visitor|tourist|visa|e-?ta|ave|visiteur|touriste)\b/i]);

export const PARENTS_REPLY = {
  en: `# IRCC isn’t accepting new parent and grandparent sponsorships right now.

IRCC has paused the Parents and Grandparents Program. It won’t accept new interest to sponsor forms or invite potential sponsors to apply until further notice, but it keeps processing applications already submitted. [1](${U('parents', 'en')})

If you’ve already applied, IRCC estimates {roc} outside Quebec and {qc} in Quebec ({asOf}). Your own file can move faster or slower, so check your application status. [2](${U('processing', 'en')}) [3](${U('status', 'en')})

To have your parents or grandparents with you in the meantime, the *super visa* lets them visit for up to 5 years at a time, with multiple entries for up to 10 years. [4](${U('superVisa', 'en')})

Here are IRCC’s latest times, with the super visa one tap away.`,
  fr: `# IRCC n’accepte pas de nouvelles demandes de parrainage de parents et de grands-parents en ce moment.

IRCC a suspendu le Programme des parents et des grands-parents. Jusqu’à nouvel ordre, il n’accepte pas de nouveaux formulaires d’intérêt à parrainer et n’invite pas de répondants potentiels à présenter une demande, mais il continue de traiter les demandes déjà présentées. [1](${U('parents', 'fr')})

Si vous avez déjà présenté une demande, IRCC estime le délai à {roc} hors Québec et à {qc} au Québec ({asOf}). Votre dossier peut avancer plus vite ou plus lentement : vérifiez l’état de votre demande. [2](${U('processing', 'fr')}) [3](${U('status', 'fr')})

D’ici là, le *super visa* permet à vos parents ou grands-parents de venir en visite jusqu’à 5 ans à la fois, avec des entrées multiples pendant une période maximale de 10 ans. [4](${U('superVisa', 'fr')})

Voici les délais les plus récents d’IRCC, avec le super visa à portée de main.`,
};

/**
 * Wording for a feed that isn't answering: the number shown is the last known one, so the answer never says
 * "right now" / « en ce moment » about it and always gives the date it is from.
 */
const DOWN = {
  en: 'IRCC’s live times aren’t answering right now.',
  fr: 'Les délais en direct d’IRCC ne répondent pas en ce moment.',
};
const TODAY = {
  en: 'Check IRCC’s page for today’s time.',
  fr: 'Consultez la page d’IRCC pour le délai du jour.',
};

export const parentsVars = async ({ lang }: Ctx): Promise<Record<string, string>> => {
  const data = await getTimes();
  const row = data.rows.find((r) => r.key === 'parents');
  const when = data.updated.pr ? longDate(data.updated.pr, lang) : '—';
  const live = isLive(data, 'parents');
  return {
    roc: durText(row?.value ?? null, lang),
    qc: durText(row?.quebec ?? null, lang),
    asOf:
      lang === 'fr'
        ? live
          ? `mise à jour le ${when}`
          : `derniers chiffres connus, du ${when} : les délais en direct d’IRCC ne répondent pas en ce moment`
        : live
          ? `updated ${when}`
          : `last known figures, from ${when}: IRCC’s live times aren’t answering right now`,
  };
};

export const TIMES_REPLY = {
  en: `# {headline}

{basis} [1](${U('processing', 'en')})

Already applied? Your own file may move faster or slower, so check your application status instead of the average. [2](${U('status', 'en')})

Here are IRCC’s latest times. Tap any application type to focus it.`,
  fr: `# {headline}

{basis} [1](${U('processing', 'fr')})

Vous avez déjà présenté une demande? Votre dossier peut avancer plus vite ou plus lentement : vérifiez plutôt l’état de votre demande. [2](${U('status', 'fr')})

Voici les délais les plus récents d’IRCC. Touchez un type de demande pour l’afficher.`,
};

export const timesVars = async ({ text, lang }: Ctx): Promise<Record<string, string>> => {
  const fx = lang === 'fr';
  const key = programFromText(text);
  const label = msg(lang, `pt.key.${key}`);
  const data = await getTimes();
  const meta = TIME_META[key];
  // Last-known values (the feed behind this application type is down) are never worded as "right now".
  const live = isLive(data, key);
  const updated = updatedOf(data, key);
  const when = updated ? longDate(updated, lang) : '—';
  const now = (value: string) => (fx ? (live ? `*${value}* en ce moment.` : `*${value}* à la dernière mise à jour.`) : live ? `*${value}* right now.` : `*${value}* when last updated.`);
  if (meta.byCountry) {
    const c = countryFromText(text);
    const code = c && c !== 'CA' ? c : null;
    const map = data.countries[key as 'visitor' | 'supervisa' | 'study' | 'work'] ?? {};
    const raw = code ? map[code] : undefined;
    const m = raw?.match(/^(\d+)([dw])$/);
    const d: Duration | null = m ? { n: Number(m[1]), unit: m[2] === 'd' ? 'day' : 'week' } : null;
    if (code && d) {
      const name = countryName(code, intl(lang));
      const short = SHORT[lang][key as keyof (typeof SHORT)['en']];
      return {
        headline: fx ? `${short} (${name}) : ${now(durText(d, lang))}` : `${short} from ${name}: ${now(durText(d, lang))}`,
        basis: fx
          ? live
            ? `C’est le temps qu’il a fallu à IRCC pour traiter 80 % des demandes récentes, sans compter la biométrie (mis à jour le ${when}).`
            : `${DOWN.fr} C’est le dernier délai connu, du ${when} : le temps qu’il a fallu à IRCC pour traiter 80 % des demandes récentes, sans compter la biométrie. ${TODAY.fr}`
          : live
            ? `That’s how long it took IRCC to process 80% of recent applications, not counting biometrics (updated ${when}).`
            : `${DOWN.en} This is the last known time, from ${when}: how long it took IRCC to process 80% of recent applications, not counting biometrics. ${TODAY.en}`,
      };
    }
    return {
      headline: fx
        ? `${SHORT.fr[key as keyof (typeof SHORT)['fr']]} : le délai *dépend du pays* d’où vous présentez votre demande.`
        : `${SHORT.en[key as keyof (typeof SHORT)['en']]} times *depend on the country* you apply from.`,
      basis: fx
        ? `IRCC publie un délai pour chaque pays, fondé sur le temps qu’il a fallu pour traiter 80 % des demandes récentes. Choisissez votre pays ci-dessous.`
        : `IRCC publishes a time for each country, based on how long it took to process 80% of recent applications. Choose your country below.`,
    };
  }
  const row = data.rows.find((r) => r.key === key);
  if (row?.status === 'paused') {
    // Normally answered by 'immigration-parents'; never call a paused program's time an "apply today" estimate.
    return {
      headline: fx ? `${label} : IRCC a *suspendu* ce programme.` : `${label}: IRCC has *paused* this program.`,
      basis: fx
        ? `Il n’accepte pas de nouvelles demandes jusqu’à nouvel ordre. Pour les demandes déjà présentées, le délai est ${durText(row.value, lang)} (${live ? `mis à jour le ${when}` : `dernier délai connu, du ${when}`}).`
        : `It isn’t accepting new applications until further notice. For applications already submitted, it’s ${durText(row.value, lang)} (${live ? `updated ${when}` : `last known time, from ${when}`}).`,
    };
  }
  const qc = QUEBEC_SPLIT.includes(key) && row?.quebec ? (fx ? ` Au Québec, c’est ${durText(row.quebec, lang)}.` : ` In Quebec, it’s ${durText(row.quebec, lang)}.`) : '';
  const waiting = row?.waiting ? (fx ? ` Environ ${num(row.waiting, lang)} personnes attendent une décision.` : ` About ${num(row.waiting, lang)} people are waiting for a decision.`) : '';
  const forward = meta.basis === 'forward';
  return {
    headline: `${label}${fx ? ' : ' : ': '}${now(durText(row?.value ?? null, lang))}`,
    basis: live
      ? forward
        ? fx
          ? `C’est l’estimation d’IRCC pour une demande présentée aujourd’hui, mise à jour le ${when}.${qc}${waiting}`
          : `That’s IRCC’s estimate for an application submitted today, updated ${when}.${qc}${waiting}`
        : fx
          ? `C’est le temps qu’il a fallu à IRCC pour traiter la plupart des demandes récentes (mis à jour le ${when}).`
          : `That’s how long it took IRCC to process most recent applications (updated ${when}).`
      : forward
        ? fx
          ? `${DOWN.fr} C’est sa dernière estimation connue pour une nouvelle demande, du ${when}.${qc} ${TODAY.fr}`
          : `${DOWN.en} This is its last known estimate for a new application, from ${when}.${qc} ${TODAY.en}`
        : fx
          ? `${DOWN.fr} C’est le dernier délai connu, du ${when} : le temps qu’il a fallu à IRCC pour traiter la plupart des demandes récentes. ${TODAY.fr}`
          : `${DOWN.en} This is the last known time, from ${when}: how long it took IRCC to process most recent applications. ${TODAY.en}`,
  };
};

/** The program asked about and, for country-based applications, the country named in the question. */
export const timesInput = ({ text, lang }: Ctx) => {
  const c = countryFromText(text);
  return { program: programFromText(text), ...(c && c !== 'CA' ? { country: c } : {}), lang };
};
