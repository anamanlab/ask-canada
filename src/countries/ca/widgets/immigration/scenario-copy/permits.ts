/** Scenario copy for study and work permits (EN + FR). */
import { countryFromText } from '../countries';
import { uni, uniAll } from '../text';
import { U, type Ctx } from './shared';

export const PERMITS_MATCH = uniAll([
  /\bstudy permit\b/i,
  /\b(study|studying|go to school|go to university|go to college)\b.*\bin canada\b/i,
  /\binternational students?\b/i,
  /\bwork while (studying|in school|i study)\b/i,
  /\b(travailler|travail) (pendant|durant) (mes|ses|vos|nos|les) [ée]tudes\b/i,
  /\b(pgwp|post-?graduation work permit)\b/i,
  /\bwork permit\b/i,
  /\bwork visa\b/i,
  /\b(work|job|working)\b.*\bin canada\b.*\b(foreigner|foreign national|from abroad|permit|visa)\b/i,
  /\bpermis d['’][ée]tudes\b/i,
  /\b[ée]tudier au canada\b/i,
  /\b[ée]tudiants? [ée]trangers?\b/i,
  /\b(ptpd|permis de travail postdipl[ôo]me)\b/i,
  /\bpermis de travail\b/i,
  /\bvisa de travail\b/i,
]);
const WORK_FOCUS = uni(/\b(work permit|work visa|working|job|permis de travail|visa de travail|travailler|emploi)\b/i);
const STUDY_FOCUS = uni(/\b(study|studies|studying|students?|school|university|college|pgwp|post-?graduation|études|étudier|étudiante?s?|école|université|collège|ptpd)\b/i);
/** "I'm an international student, can I work?" (with STUDY_FOCUS). */
const WORK_WHILE_STUDYING = uni(/\b(work|working|job|jobs|travailler|travail|emploi)\b/i);
export const PERMITS_EXCLUDE = uniAll([/\b(processing|wait) times?\b|\bhow long\b|\bd[ée]lais? de traitement\b|\bcombien de temps\b/i, /\b(extend|extension|prolong\w*|renew\w*)\b/i]);

export const PERMITS_REPLY = { en: `# {headline}\n\n{body}\n\n{rule}\n\n{next}`, fr: `# {headline}\n\n{body}\n\n{rule}\n\n{next}` };

export const permitsVars = ({ text, lang }: Ctx): Record<string, string> => {
  const work = WORK_FOCUS.test(text) && !STUDY_FOCUS.test(text);
  const fx = lang === 'fr';
  // "I'm an international student, can I work?": answer the work question first (work-off-campus.html, 2026-04-15).
  if (WORK_WHILE_STUDYING.test(text) && STUDY_FOCUS.test(text) && !uni(/\b(pgwp|post-?graduation|ptpd|postdipl[ôo]me|work permit|permis de travail)\b/i).test(text)) {
    return {
      headline: fx
        ? `Pendant vos études, vous pourriez travailler hors campus *jusqu’à 24 heures par semaine*.`
        : `While you study, you may be able to work off campus *up to 24 hours a week*.`,
      body: fx
        ? `Il faut être étudiant à temps plein dans un établissement d’enseignement désigné, dans un programme d’au moins 6 mois menant à un diplôme, et avoir commencé vos études. Votre permis d’études doit aussi indiquer que vous pouvez travailler hors campus, et il vous faut un numéro d’assurance sociale. [1](${U('offCampus', 'fr')})`
        : `You must be a full-time student at a designated learning institution, in a program of at least 6 months that leads to a degree, diploma or certificate, and you must have started your studies. Your study permit must also say you can work off campus, and you need a social insurance number. [1](${U('offCampus', 'en')})`,
      rule: fx
        ? `Pendant les congés prévus par votre établissement, comme les vacances d’été ou d’hiver, il n’y a pas de limite d’heures. [1](${U('offCampus', 'fr')})`
        : `During breaks scheduled by your school, like summer or winter holidays, there’s no limit on hours. [1](${U('offCampus', 'en')})`,
      next: fx
        ? `Voici le permis d’études en bref, avec les frais, le délai et l’argent à prévoir. [2](${U('studyDocs', 'fr')})`
        : `Here’s the study permit at a glance, with fees, the processing time and the money you’ll need. [2](${U('studyDocs', 'en')})`,
    };
  }
  if (work) {
    return {
      headline: fx ? `Pour travailler au Canada, il faut presque toujours *un permis de travail*.` : `To work in Canada, you almost always need *a work permit*.`,
      body: fx
        ? `Il en existe deux types : le permis lié à un employeur, qui exige une offre d’emploi, et le permis ouvert, qui n’en exige pas mais n’est offert qu’à certaines personnes. [1](${U('workCanada', 'fr')})`
        : `There are two kinds: an employer-specific permit, which needs a job offer, and an open permit, which doesn’t but is only for some people. [1](${U('workCanada', 'en')})`,
      rule: fx
        ? `Les frais sont de 155 $, plus 100 $ pour un permis ouvert. Après des études au Canada, le permis de travail postdiplôme peut durer jusqu’à 3 ans. [2](${U('pgwp', 'fr')})`
        : `The fee is $155, plus $100 for an open work permit. After studying in Canada, a post-graduation work permit can last up to 3 years. [2](${U('pgwp', 'en')})`,
      next: fx
        ? `Répondez aux questions d’IRCC pour trouver le permis qu’il vous faut et savoir comment présenter votre demande. [3](${U('needWorkPermit', 'fr')})`
        : `Answer IRCC’s questions to find the permit you need and how to apply. [3](${U('needWorkPermit', 'en')})`,
    };
  }
  return {
    headline: fx ? `Pour étudier au Canada, il vous faut d’abord *une lettre d’acceptation*.` : `To study in Canada, start with *a letter of acceptance*.`,
    body: fx
      ? `Elle doit venir d’un établissement d’enseignement désigné. Dans la plupart des cas, il faut aussi une lettre d’attestation provinciale ou territoriale, et le permis d’études coûte 150 $. [1](${U('studyDocs', 'fr')})`
      : `It must come from a designated learning institution. In most cases you also need a provincial or territorial attestation letter, and the study permit costs $150. [1](${U('studyDocs', 'en')})`,
    rule: fx
      ? `Vous devez prouver que vous pouvez payer vos droits de scolarité, votre transport et vos frais de subsistance : 23 448 $ pour une personne la première année, pour les demandes présentées à compter du 1er septembre 2026 (hors Québec). Pendant vos études, vous pourriez travailler hors campus jusqu’à 24 heures par semaine. [2](${U('studyFunds', 'fr')}) [3](${U('offCampus', 'fr')})`
      : `You must show you can pay for tuition, travel and living expenses: $23,448 for one person for the first year, for applications from September 1, 2026 (outside Quebec). While you study, you may be able to work off campus up to 24 hours a week. [2](${U('studyFunds', 'en')}) [3](${U('offCampus', 'en')})`,
    next: fx
      ? `Les questions d’IRCC vous indiquent si vous avez besoin d’un permis d’études et comment présenter votre demande. [4](${U('studyTool', 'fr')})`
      : `IRCC’s questions tell you whether you need a study permit and exactly how to apply. [4](${U('studyTool', 'en')})`,
  };
};

export const permitsInput = ({ text, lang }: Ctx) => {
  const c = countryFromText(text);
  return { focus: WORK_FOCUS.test(text) && !STUDY_FOCUS.test(text) ? 'work' : 'study', ...(c && c !== 'CA' ? { country: c } : {}), lang };
};
