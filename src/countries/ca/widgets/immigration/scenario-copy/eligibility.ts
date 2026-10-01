/** Scenario copy for the Express Entry eligibility check (EN + FR). */
import { buildEligibility } from '../build';
import { assumedFields, missingAnswers, normalizeProfile, type AssumedField, type Profile } from '../crs';
import { profileFromText } from '../parse';
import { uniAll } from '../text';
import { listOf, msg, num, U, type Ctx } from './shared';

export const ELIGIBILITY_MATCH = uniAll([
  /\b(can|could|may|how (can|do|could)) i\b.*\b(immigrate|move|emigrate|live permanently|get (pr|permanent residen\w*))\b.*\bcanada\b/i,
  /\b(am i|are we|i['’]?m|would i be)\b.*\b(eligible|qualif\w*)\b.*\b(express entry|fsw|cec|skilled worker|skilled trades|canadian experience|immigrat\w*|pr\b|permanent residen\w*)/i,
  /\b(eligib\w*|qualif\w*)\b.*\b(express entry|federal skilled|canadian experience class)\b/i,
  /\bcome to canada tool\b/i,
  /\b(puis-je|pourrais-je|comment)\b.*\b(immigrer|m['’]installer|vivre de fa[çc]on permanente|obtenir la r[ée]sidence permanente)\b/i,
  /\b(suis-je|serais-je|sommes-nous|je suis)\b.*\b(admissible|[ée]ligible)\b.*\b(entr[ée]e express|travailleurs? qualifi[ée]s?|exp[ée]rience canadienne|immigr\w*|r[ée]sidence permanente)/i,
  /\badmissibilit[ée]\b.*\bentr[ée]e express\b/i,
  /\boutil venir au canada\b/i,
]);
export const ELIGIBILITY_EXCLUDE = uniAll([/\b(refugee|asylum|réfugié|asile|sponsor\w*|parrain\w*)\b/i]);

/** Eligibility answer when the question doesn't carry a profile yet. */
const GENERIC_ELIG = {
  en: `# If you have skilled work experience, *Express Entry* is the main way in.

It manages 3 programs: the Canadian Experience Class (skilled work in Canada), the Federal Skilled Worker Program (skilled work anywhere, scored out of 100, with 67 points needed) and the Federal Skilled Trades Program. Each has minimums for language, work experience and, for some, education or a job offer. [1](${U('whoCanApply', 'en')})

Most people also need proof of funds, starting at $15,263 for one person. The Canadian Experience Class doesn’t require it. [2](${U('eeFunds', 'en')})

Check where you stand below. IRCC’s Come to Canada tool then confirms it and gives you a reference code for your profile. [3](${U('comeToCanada', 'en')})`,
  fr: `# Si vous avez de l’expérience de travail qualifié, *Entrée express* est la voie principale.

Elle gère 3 programmes : la Catégorie de l’expérience canadienne (travail qualifié au Canada), le Programme des travailleurs qualifiés (fédéral), qui évalue votre profil sur 100 points (67 points requis), et le Programme des travailleurs de métiers spécialisés (fédéral). Chacun a des exigences minimales de langue, d’expérience de travail et, pour certains, d’études ou d’offre d’emploi. [1](${U('whoCanApply', 'fr')})

La plupart des gens doivent aussi prouver qu’ils ont des fonds suffisants, à partir de 15 263 $ pour une personne. La Catégorie de l’expérience canadienne ne l’exige pas. [2](${U('eeFunds', 'fr')})

Vérifiez votre situation ci-dessous. L’outil Venir au Canada d’IRCC la confirme ensuite et vous donne un code de référence pour votre profil. [3](${U('comeToCanada', 'fr')})`,
};

// Verdict first when the question carries the profile: same `programs()` check as the widget below it.
export const ELIGIBILITY_REPLY = { en: `# {headline}\n\n{p1}\n\n{p2}\n\n{p3}`, fr: `# {headline}\n\n{p1}\n\n{p2}\n\n{p3}` };

export const eligibilityVars = ({ text, lang }: Ctx): Record<string, string> => {
  const fx = lang === 'fr';
  const given = profileFromText(text);
  if (missingAnswers(Object.keys(given) as (keyof Profile)[]).length) {
    const [h, ...rest] = (fx ? GENERIC_ELIG.fr : GENERIC_ELIG.en).split('\n\n');
    return { headline: h.replace(/^# /, ''), p1: rest[0], p2: rest[1], p3: rest[2] };
  }
  const out = buildEligibility({ ...given, lang });
  const ok = out.programs.filter((r) => r.eligible);
  const names = ok.map((r) => msg(lang, `prog.${r.id}`));
  const list = listOf(names, lang);
  const funds = num(out.funds.amount, lang);
  const withCec = ok.some((r) => r.id === 'cec');
  // Same words and order as the widget's "We assumed …" note (answers.tsx AssumedNote), so they read as one.
  const prof = normalizeProfile(given);
  const first = msg(lang, prof.firstLanguage === 'fr' ? 'langLower.fr' : 'langLower.en');
  const other = msg(lang, prof.firstLanguage === 'fr' ? 'langLower.en' : 'langLower.fr');
  const item = (f: AssumedField) => {
    switch (f) {
      case 'age':
        return msg(lang, 'assumed.age', { age: prof.age });
      case 'education':
        return msg(lang, 'assumed.education', { edu: prof.education });
      case 'firstClb':
        return prof.firstClb ? msg(lang, 'assumed.clb', { n: String(prof.firstClb), lang: first }) : msg(lang, 'assumed.noTest', { lang: first });
      case 'secondClb':
        return prof.secondClb ? msg(lang, 'assumed.clb', { n: String(prof.secondClb), lang: other }) : msg(lang, 'assumed.noTest', { lang: other });
      case 'canadianWork':
        return msg(lang, 'assumed.canadianWork', { count: prof.canadianWork });
      case 'foreignWork':
        return msg(lang, 'assumed.foreignWork', { count: prof.foreignWork });
      case 'occupation':
        return msg(lang, 'assumed.occupation', { occ: prof.occupation });
    }
  };
  const listEn = listOf(names.map((n) => `the ${n}`), lang);
  const assumedList = listOf(assumedFields(Object.keys(given) as (keyof Profile)[], 'eligibility').map(item), lang);
  const assumed = assumedList ? (fx ? `Nous avons supposé\u00a0: ${assumedList}. Vérifiez ces réponses.` : `We assumed ${assumedList}, so check those answers.`) : '';
  const onlyCec = ok.length > 0 && ok.every((r) => r.id === 'cec');
  return {
    headline: ok.length > 1
      ? fx ? `Vous pourriez être admissible à *${ok.length} programmes d’Entrée express*.` : `You may qualify for *${ok.length} Express Entry programs*.`
      : ok.length === 1
        ? fx ? `Vous pourriez être admissible au *${names[0]}*.`.replace('au *Catégorie', 'à la *Catégorie') : `You may qualify for the *${names[0]}*.`
        : fx ? `Vous ne répondez pas encore aux *exigences minimales* d’Entrée express.` : `You don’t meet the *Express Entry minimums* yet.`,
    p1: ok.length
      ? fx
        ? `Selon vos réponses, vous répondez aux exigences minimales de ces programmes : ${list}. [1](${U('whoCanApply', lang)})${assumed ? ` ${assumed}` : ''}`
        : `From what you told us, you meet the minimums of ${listEn}. [1](${U('whoCanApply', lang)})${assumed ? ` ${assumed}` : ''}`
      : fx
        ? `Selon vos réponses, il vous manque au moins une exigence de chaque programme : langue, expérience de travail qualifié ou études. Les détails figurent ci-dessous. [1](${U('whoCanApply', lang)})`
        : `From what you told us, each program is missing at least one minimum: language, skilled work experience or education. The details are below. [1](${U('whoCanApply', lang)})`,
    p2: onlyCec
      ? fx
        ? `La Catégorie de l’expérience canadienne n’exige pas de preuve de fonds. [2](${U('eeFunds', lang)})`
        : `The Canadian Experience Class doesn’t require proof of funds. [2](${U('eeFunds', lang)})`
      : withCec
        ? fx
          ? `Sauf si vous passez par la Catégorie de l’expérience canadienne, vous devez prouver que vous avez des fonds suffisants : ${funds} $ pour une personne. [2](${U('eeFunds', lang)})`
          : `Unless you go through the Canadian Experience Class, you must show proof of funds: $${funds} for one person. [2](${U('eeFunds', lang)})`
        : fx
          ? `Vous devez aussi prouver que vous avez des fonds suffisants : ${funds} $ pour une personne, sauf si vous avez une offre d’emploi valide et êtes autorisé à travailler au Canada. [2](${U('eeFunds', lang)})`
          : `You also need proof of funds: $${funds} for one person, unless you have a valid job offer and are authorized to work in Canada. [2](${U('eeFunds', lang)})`,
    p3: fx
      ? `Chaque réponse ci-dessous se modifie et met la vérification à jour. L’outil Venir au Canada d’IRCC la confirme ensuite et vous donne un code de référence pour votre profil. [3](${U('comeToCanada', lang)})`
      : `Change any answer below and the check updates. IRCC’s Come to Canada tool then confirms it and gives you a reference code for your profile. [3](${U('comeToCanada', lang)})`,
  };
};
