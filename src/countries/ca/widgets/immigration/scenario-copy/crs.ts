/** Scenario copy for the CRS calculator: "what's my score" and "latest draw" (EN + FR). */
import { crsScore, missingAnswers, normalizeProfile, type Profile } from '../crs';
import { inAnyProgram, referenceDraw } from '../crs-insights';
import { getDraws } from '../live';
import { profileFromText } from '../parse';
import { uniAll } from '../text';
import { aRound, longDate, num, roundName, U, type Ctx } from './shared';

export const CRS_MATCH = uniAll([
  /\b(crs|comprehensive ranking)\b/i,
  /\bexpress entry\b.*\b(score|points|calculat\w*|rank\w*)\b/i,
  /\b(score|points)\b.*\bexpress entry\b/i,
  /\b(scg|syst[èe]me de classement global)\b/i,
  /\bentr[ée]e express\b.*\b(note|points|pointage|calcul\w*|classement)\b/i,
  /\b(note|pointage|points)\b.*\bentr[ée]e express\b/i,
]);
export const DRAW_MATCH = uniAll([
  /\b(latest|last|recent|next|new|today['’]?s)\b.*\b(express entry )?(draws?|rounds? of invitations?|cut-?offs?)\b/i,
  /\bexpress entry\b.*\b(draws?|rounds?|cut-?offs?|invitations?)\b/i,
  /\b(derni[èe]re?s?|r[ée]cente?s?|prochaine?)\b.*\b(rondes?|tirages?|invitations?|notes? minimales?)\b/i,
  /\bentr[ée]e express\b.*\b(rondes?|tirages?|invitations?)\b/i,
]);
/** A question about the latest draw goes to the rounds answer, even when it says "CRS". */
export const CRS_EXCLUDE = uniAll([/\b(latest|last|recent|dernière?|récente?)\b.*\b(draws?|rounds?|rondes?|tirages?)\b/i]);

/** The rounds feed is down: what we show is the last round on record, never called "the latest". */
const staleNote = (live: boolean, fx: boolean) =>
  live ? '' : fx ? ' Le fil des rondes d’IRCC ne répond pas en ce moment : une ronde plus récente a peut-être eu lieu.' : ' IRCC’s rounds feed isn’t answering right now, so there may be a newer round.';

// Verdict first: with a complete profile the heading IS the score and the next sentence ties it to a round the
// person could actually be in (same `referenceDraw` as the widget), so the answer and the widget read as one.
export const CRS_REPLY = { en: `# {headline}\n\n{body}`, fr: `# {headline}\n\n{body}` };

export const crsVars = async ({ text, lang }: Ctx): Promise<Record<string, string>> => {
  const fx = lang === 'fr';
  const { draws, live } = await getDraws(lang, 10);
  const stale = staleNote(live, fx);
  const given = profileFromText(text);
  const complete = missingAnswers(Object.keys(given) as (keyof Profile)[]).length === 0;
  const criteria = fx
    ? `Entrée express classe chaque profil sur 1 200 points : âge, études, anglais ou français, expérience de travail, et des points supplémentaires comme le français, un frère ou une sœur au Canada ou une désignation provinciale. Les offres d’emploi ne donnent plus de points depuis le 25 mars 2025.`
    : `Express Entry ranks every profile out of 1,200 points: age, education, English or French, work experience, and extras like French skills, a sibling in Canada or a provincial nomination. Job offers stopped earning points on March 25, 2025.`;
  if (complete) {
    const profile = normalizeProfile(given);
    const total = crsScore(profile).total;
    const ref = referenceDraw(draws, profile);
    let verdict: string;
    if (ref) {
      const gap = total - ref.crs;
      const round = roundName(ref, lang);
      const date = longDate(ref.date, lang);
      verdict = fx
        ? `${gap < 0 ? `C’est ${num(-gap, lang)} points de moins que` : gap > 0 ? `C’est ${num(gap, lang)} points de plus que` : 'C’est exactement'} la note minimale de ${ref.crs} de la dernière ronde ${live ? '' : 'connue '}« ${round} », le ${date}.${stale}`
        : `That’s ${gap < 0 ? `${num(-gap, lang)} points below` : gap > 0 ? `${num(gap, lang)} points above` : 'right at'} the ${ref.crs} cut-off in the ${live ? 'latest' : 'last known'} ${round} round, on ${date}.${stale}`;
    } else {
      verdict = inAnyProgram(profile)
        ? fx
          ? `Aucune des ${draws.length} dernières rondes n’était ouverte à un profil comme le vôtre : elles visaient d’autres programmes ou catégories d’emploi.`
          : `None of the last ${draws.length} rounds was open to a profile like yours: they were for other programs or job categories.`
        : fx
          ? `Avec ces réponses, vous ne répondez peut-être pas encore aux exigences minimales d’un programme d’Entrée express, donc aucune ronde ne s’applique.`
          : `With these answers, you may not meet the minimums of an Express Entry program yet, so no round applies to you.`;
    }
    return {
      headline: fx ? `Votre note SCG estimée est de *${num(total, lang)}*.` : `Your estimated CRS score is *${num(total, lang)}*.`,
      // Two short paragraphs so the widget (and its score) comes into view right away.
      body: [
        `${verdict} [1](${U('rounds', lang)})`,
        fx
          ? `La note tient compte de l’âge, des études, de la langue et de l’expérience de travail; les offres d’emploi ne donnent plus de points depuis le 25 mars 2025. [2](${U('crsCriteria', lang)}) Modifiez une réponse ci-dessous pour recalculer : votre profil Entrée express affiche votre note officielle. [3](${U('crsTool', lang)})`
          : `The score weighs age, education, language and work experience; job offers stopped earning points on March 25, 2025. [2](${U('crsCriteria', lang)}) Change any answer below to recalculate. Your Express Entry profile shows your official score. [3](${U('crsTool', lang)})`,
      ].join('\n\n'),
    };
  }
  const d = draws[0];
  return {
    headline: fx ? `Votre note SCG détermine *quand vous serez invité* à présenter une demande.` : `Your CRS score decides *when you’re invited* to apply.`,
    body: [
      `${criteria} [1](${U('crsCriteria', lang)})`,
      d
      ? fx
        ? `IRCC invite les meilleurs candidats lors de rondes régulières. La ${live ? 'plus récente' : 'dernière connue'}, le ${longDate(d.date, lang)}, a invité ${num(d.size, lang)} personnes (ronde « ${roundName(d, lang)} ») avec une note minimale de **${d.crs}**.${stale} [2](${U('rounds', lang)})`
        : `IRCC invites the top candidates in regular rounds. The ${live ? 'latest' : 'last one on record'}, ${aRound(d)} on ${longDate(d.date, lang)}, invited ${num(d.size, lang)} people with scores down to **${d.crs}**.${stale} [2](${U('rounds', lang)})`
      : fx
        ? `IRCC invite les meilleurs candidats lors de rondes régulières. [2](${U('rounds', lang)})`
        : `IRCC invites the top candidates in regular rounds. [2](${U('rounds', lang)})`,
      fx
        ? `Indiquez votre âge, vos études, votre niveau de langue et votre expérience de travail ci-dessous : votre estimation s’affiche aussitôt. [3](${U('crsTool', lang)})`
        : `Add your age, education, language level and work experience below and your estimate appears right away. [3](${U('crsTool', lang)})`,
    ].join('\n\n'),
  };
};

export const DRAW_REPLY = {
  en: `# {lead} invited *{size} people* with a cut-off of {cut}.

{held}{previous}{stale} [1](${U('rounds', 'en')})

Many rounds only invite people in one program or category, like the Canadian Experience Class, provincial nominees or French speakers, so the cut-off that matters depends on your profile. [1](${U('rounds', 'en')})

Here are the recent rounds. Tap “Estimate my score” to see where you’d land. [2](${U('crsCriteria', 'en')})`,
  fr: `# {lead} a invité *{size} personnes* avec une note minimale de {cut}.

{held}{previous}{stale} [1](${U('rounds', 'fr')})

Beaucoup de rondes n’invitent que les personnes d’un programme ou d’une catégorie, comme la Catégorie de l’expérience canadienne, les candidats des provinces ou les francophones : la note minimale qui compte dépend donc de votre profil. [1](${U('rounds', 'fr')})

Voici les rondes récentes. Touchez « Estimer ma note » pour voir où vous vous situez. [2](${U('crsCriteria', 'fr')})`,
};

export const drawVars = async ({ lang }: Ctx): Promise<Record<string, string>> => {
  const fx = lang === 'fr';
  const { draws, live } = await getDraws(lang, 2);
  const [d, ...rest] = draws;
  const lead = fx ? (live ? 'La plus récente ronde d’Entrée express' : 'La dernière ronde d’Entrée express connue') : live ? 'The latest Express Entry round' : 'The last Express Entry round on record';
  const stale = staleNote(live, fx);
  if (!d) return { lead, size: '—', cut: '—', held: '', previous: '', stale };
  const date = longDate(d.date, lang);
  // English: "for the Canadian Experience Class" reads well for a program; a category round is "a Trades Occupations round".
  const held = fx
    ? `Elle a eu lieu le ${date} (ronde « ${roundName(d, lang)} »).`
    : d.kind === 'cec' || d.kind === 'pnp'
      ? `It was held on ${date} for the ${roundName(d, lang)}.`
      : `It was ${aRound(d)}, held on ${date}.`;
  // One comparison is enough: the table in the widget below lists every recent round.
  const p = rest[0];
  const previous = p
    ? fx
      ? ` La ronde précédente, le ${longDate(p.date, lang)} (${roundName(p, lang)}), avait une note minimale de ${p.crs}.`
      : ` The round before, on ${longDate(p.date, lang)} (${roundName(p, lang)}), had a cut-off of ${p.crs}.`
    : '';
  return { lead, size: num(d.size, lang), cut: String(d.crs), held, previous, stale };
};
