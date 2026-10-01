/** Scripted scenarios for the `citizenship` widget (EN + FR). Facts: widgets/citizenship/data.ts. */
import type { Scenario } from '@/lib/scripted/types';
import { todayInCanada } from '../data/holidays';
import { liveFees, liveProcessing } from '../tools/citizenship';
import { CHECKED, RULES, URLS } from '../widgets/citizenship/data';
import { calcPresence } from '../widgets/citizenship/presence';

const MONTHS: Record<string, number> = {
  january: 1, jan: 1, janvier: 1, february: 2, feb: 2, février: 2, fevrier: 2, march: 3, mar: 3, mars: 3, april: 4, apr: 4, avril: 4,
  may: 5, mai: 5, june: 6, jun: 6, juin: 6, july: 7, jul: 7, juillet: 7, august: 8, aug: 8, août: 8, aout: 8,
  september: 9, sept: 9, sep: 9, septembre: 9, october: 10, oct: 10, octobre: 10, november: 11, nov: 11, novembre: 11,
  december: 12, dec: 12, décembre: 12, decembre: 12,
};
const PR_WORDS = /\b(pr|permanent resident|permanent residence|landed|landing|résident(e)? permanent(e)?|résidence permanente|rp)\b/i;

/**
 * "I became a PR in March 2023" / "PR since 2023-03-15" / "résidente permanente depuis le 3 mars 2023"
 * -> { date: ISO, monthOnly }. A month without a day gives the 1st, flagged so the answer and widget say so.
 */
export function prDateFrom(text: string): { date: string; monthOnly: boolean } | undefined {
  if (!PR_WORDS.test(text)) return undefined;
  const iso = text.match(/\b(20\d{2}|19\d{2})-(\d{2})-(\d{2})\b/);
  if (iso) return { date: iso[0], monthOnly: false };
  const t = text.toLowerCase();
  const m =
    t.match(/\b(\d{1,2})(?:er)?\s+([a-zéû]+)\.?\s+(\d{4})\b/) ?? // 3 mars 2023
    t.match(/\b([a-zéû]+)\.?\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})\b/) ?? // March 3, 2023
    t.match(/\b([a-zéû]+)\.?\s+(\d{4})\b/); // March 2023
  if (!m) return undefined;
  let day = 1;
  let month: number | undefined;
  let year: number;
  if (m.length === 4 && /^\d/.test(m[1])) [day, month, year] = [Number(m[1]), MONTHS[m[2]], Number(m[3])];
  else if (m.length === 4) [month, day, year] = [MONTHS[m[1]], Number(m[2]), Number(m[3])];
  else [month, year] = [MONTHS[m[1]], Number(m[2])];
  if (!month || year < 1990 || year > 2100 || day < 1 || day > 31) return undefined;
  return { date: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`, monthOnly: m.length === 3 };
}

const longDate = (iso: string, lang: 'en' | 'fr') => {
  const s = new Intl.DateTimeFormat(lang === 'fr' ? 'fr-CA' : 'en-CA', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(`${iso}T12:00:00Z`));
  return lang === 'fr' ? s.replace(/^1 /, '1er ') : s;
};

/** "Today" at both ends of the world's time zones: the answer text is written without knowing the reader's zone. */
const todayRange = (now: Date) => [todayInCanada(now, 'Pacific/Kiritimati'), todayInCanada(now, 'Etc/GMT+12')];

/**
 * Personal lead for "I became a PR in March 2023. When can I apply?": the same calculation the widget
 * runs (no trips). The widget counts from "today" in the reader's time zone, which this text can't know, so
 * the text carries no figure that depends on today (the widget shows the day count), and it only says
 * "now" or gives a date when every time zone agrees. Generic without a date.
 */
function presenceLead(text: string, lang: 'en' | 'fr') {
  const WHO_L = lang === 'fr' ? WHO.fr : WHO.en;
  const generic = {
    heading:
      lang === 'fr'
        ? '# Il vous faut *1 095 jours* au Canada au cours des 5 ans précédant votre demande.'
        : '# You need *1,095 days* in Canada in the 5 years before you apply.',
    lead: '',
  };
  const pr = prDateFrom(text);
  if (!pr) return generic;
  const [ahead, behind] = todayRange(new Date()).map((today) => (pr.date < today ? calcPresence({ prDate: pr.date }, today) : null));
  if (!ahead || !behind || ahead.eligible !== behind.eligible || (!ahead.eligible && ahead.earliest !== behind.earliest)) return generic;
  const r = ahead;
  if (!r.eligible && !r.earliest) return generic;
  const need = new Intl.NumberFormat(lang === 'fr' ? 'fr-CA' : 'en-CA').format(RULES.requiredDays);
  const from = longDate(pr.date, lang);
  const assume = pr.monthOnly
    ? lang === 'fr'
      ? ` Comme vous n’avez indiqué que le mois, nous avons compté à partir du ${from} : entrez la date exacte dans le calculateur.`
      : ` Since you gave only the month, we counted from ${from}: enter your exact date in the calculator.`
    : '';
  if (r.eligible) {
    return lang === 'fr'
      ? {
          heading: '# Vous avez probablement *assez de jours* pour présenter une demande dès maintenant.',
          lead: `En comptant à partir du ${from}, sans voyage hors du Canada, vous avez les ${need} jours requis. Chaque voyage à l’étranger réduit ce total : ajoutez les vôtres dans le calculateur ci-dessous. [1](${WHO_L})${assume}

`,
        }
      : {
          heading: '# You likely have *enough days* to apply now.',
          lead: `Counting from ${from}, with no trips outside Canada, you have the ${need} days you need. Each trip abroad lowers that total, so add yours in the calculator below. [1](${WHO_L})${assume}

`,
        };
  }
  const when = longDate(r.earliest!, lang);
  return lang === 'fr'
    ? {
        heading: `# Vous pourriez présenter une demande dès le *${when}*.`,
        lead: `En comptant à partir du ${from}, sans voyage hors du Canada, vous atteindrez ce jour-là les ${need} jours requis. Chaque voyage à l’étranger repousse cette date : ajoutez les vôtres dans le calculateur ci-dessous. [1](${WHO_L})${assume}

`,
      }
    : {
        heading: `# You could apply as early as *${when}*.`,
        lead: `Counting from ${from}, with no trips outside Canada, that is the day you reach the ${need} days you need. Each trip abroad pushes that date later, so add yours in the calculator below. [1](${WHO_L})${assume}

`,
      };
}

/** A cited link with its page title; French titles keep the colon on the same line (U+00A0 before ':'). */
const L = (url: string, title: string) => `${url} "${title.replace(/ ([:;?!])/g, '\u00a0$1')}"`;
const WHO = { en: L(URLS.who.en, 'Canadian citizenship: Who can apply'), fr: L(URLS.who.fr, 'Citoyenneté canadienne : Qui peut présenter une demande') };
const CIT = { en: L(URLS.cit0407.en, 'How to Calculate Physical Presence (CIT 0407, PDF form)'), fr: L(URLS.cit0407.fr, 'Calcul de la présence effective (CIT 0407, formulaire PDF)') };
const HOW = { en: L(URLS.how.en, 'Canadian citizenship: How to apply'), fr: L(URLS.how.fr, 'Citoyenneté canadienne : Comment présenter une demande') };
const PT = { en: L(URLS.processingTimes.en, 'Check processing times'), fr: L(URLS.processingTimes.fr, 'Vérifiez les délais de traitement actuels de l’IRCC') };
const STUDY = { en: L(URLS.study.en, 'Citizenship test: Study for the test'), fr: L(URLS.study.fr, 'Examen pour la citoyenneté : étudier pour l’examen') };
const GUIDE = { en: L(URLS.guide.en, 'Discover Canada'), fr: L(URLS.guide.fr, 'Découvrir le Canada') };
const TESTHOW = { en: L(URLS.testHow.en, 'Citizenship test: How it works'), fr: L(URLS.testHow.fr, 'Examen pour la citoyenneté : fonctionnement') };
const WHEN = { en: L(URLS.when.en, 'Citizenship ceremony: When to go'), fr: L(URLS.when.fr, 'Cérémonie de citoyenneté : Quand assister à la cérémonie') };
const BRING = { en: L(URLS.bring.en, 'Citizenship ceremony: What to bring'), fr: L(URLS.bring.fr, 'Cérémonie de citoyenneté : Ce qu’il faut apporter') };
const EXPECT = { en: L(URLS.expect.en, 'Citizenship ceremony: What to expect'), fr: L(URLS.expect.fr, 'Cérémonie de citoyenneté : À quoi s’attendre') };
const AFTERC = { en: L(URLS.afterCeremony.en, 'Citizenship ceremony: After the ceremony'), fr: L(URLS.afterCeremony.fr, 'Cérémonie de citoyenneté : Après la cérémonie') };
const STATUS = { en: L(URLS.status.en, 'Check your application status'), fr: L(URLS.status.fr, 'Vérifier l’état de votre demande') };
const AFTER = { en: L(URLS.after.en, 'Canadian citizenship: After you apply'), fr: L(URLS.after.fr, 'Citoyenneté canadienne : Après avoir présenté une demande') };

const CITIZEN = /\b(citizenship|citizen)\b|citoyenneté|\bcitoyen/i;
const APPLIED = /\b(i (have )?(already )?applied|already applied|my (citizenship )?application|j[’'](ai )?(déjà )?(présenté|fait|envoyé) (ma|une) demande|ma demande de citoyenneté)\b/i;

const FOLLOW = {
  days: { en: 'When can I apply for citizenship?', fr: 'Quand puis-je demander la citoyenneté?' },
  apply: { en: 'How do I apply for citizenship?', fr: 'Comment demander la citoyenneté?' },
  test: { en: 'Quiz me for the citizenship test', fr: 'Faites-moi pratiquer l’examen de citoyenneté' },
  oath: { en: 'What happens at the citizenship ceremony?', fr: 'Comment se déroule la cérémonie de citoyenneté?' },
  fees: { en: 'How much does citizenship cost?', fr: 'Combien coûte la citoyenneté?' },
};
const follow = (...keys: (keyof typeof FOLLOW)[]) => ({ en: keys.map((k) => FOLLOW[k].en), fr: keys.map((k) => FOLLOW[k].fr) });

type Ctx = { text: string; lang: 'en' | 'fr'; timeZone?: string };
const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

const scenarios: Scenario[] = [
  {
    // Same id as the pack's generic starter: this widget answer replaces it (checked by paraphrases.json).
    id: 'citizenship',
    priority: 6,
    checked: CHECKED,
    match: [
      /\bcitizenship\b/i,
      /\bbecome (a )?(canadian )?citizen\b/i,
      /\b(how many|enough) days\b.*\b(canada|citizen)/i,
      /\bphysical presence\b/i,
      /\bcitoyenneté/i,
      /\bdevenir citoyen/i,
      /\bprésence effective\b/i,
      // "I became a PR in March 2023. When can I apply?" (citizenship is implied, the PR card is not)
      /\b(pr|permanent resident|landed)\b(?!\s*card).*\bwhen (can|could|will|do) (i|we) (be able to )?apply\s*\??\s*$/i,
      /\b(rp|résident(e)? permanent(e)?)\b(?!\s*carte).*\bquand (puis-je|pourrai-je|est-ce que je peux|pourrais-je) (présenter une |faire (une|ma) )?demande\s*\??\s*$/i,
    ],
    exclude: [APPLIED],
    vars: ({ text, lang }) => presenceLead(text, lang),
    reply: {
      en: `{heading}

{lead}To become a citizen as an adult, you must be a permanent resident and have been physically present in Canada for at least 1,095 days (3 years) in the 5 years before the day you sign your application, including at least 730 days as a permanent resident. [1](${WHO.en})

Each day you spent in Canada as a student, worker, visitor or protected person before becoming a PR counts as half a day, up to 365 days. The day you leave Canada and the day you come back both count as days in Canada. [1](${WHO.en}) [2](${CIT.en})

If you’re 18 to 54, you also need proof of English or French and must pass the citizenship test. You may need to have filed taxes for 3 of those 5 years. [1](${WHO.en})

The calculator below counts your days and shows the earliest date you can apply. Add your trips to see how each one moves that date.`,
      fr: `{heading}

{lead}Pour devenir citoyen à l’âge adulte, vous devez être résident permanent et avoir été effectivement présent au Canada au moins 1 095 jours (3 ans) au cours des 5 années précédant la date de signature de votre demande, dont au moins 730 jours comme résident permanent. [1](${WHO.fr})

Chaque jour passé au Canada comme étudiant, travailleur, visiteur ou personne protégée avant la résidence permanente compte pour une demi-journée, jusqu’à 365 jours. Le jour où vous quittez le Canada et le jour de votre retour comptent tous deux comme des jours au Canada. [1](${WHO.fr}) [2](${CIT.fr})

Si vous avez de 18 à 54 ans, il vous faut aussi une preuve de compétence en français ou en anglais et réussir l’examen pour la citoyenneté. Vous pourriez devoir avoir produit vos déclarations de revenus pour 3 de ces 5 années. [1](${WHO.fr})

Le calculateur ci-dessous compte vos jours et indique la première date à laquelle vous pourrez présenter une demande. Ajoutez vos voyages pour voir comment chacun déplace cette date.`,
    },
    toolCalls: [
      {
        toolName: 'citizenshipPresence',
        input: ({ text, lang, timeZone }: Ctx) => {
          const pr = prDateFrom(text);
          return { prDate: pr?.date, prDateMonthOnly: pr?.monthOnly || undefined, lang, timeZone };
        },
      },
    ],
    followUps: follow('apply', 'test', 'oath'),
  },
  {
    id: 'citizenship-apply',
    priority: 8,
    checked: CHECKED,
    match: [
      /\bhow (do|can|would) (i|we|you) apply for (canadian )?citizenship\b/i,
      /\bapply(ing)? for (canadian )?citizenship\b.*\b(how|steps?|process)\b/i,
      /\bcitizenship\b.*\b(cost|costs|fee|fees|price|pay)\b/i,
      /\b(cost|fee|fees|price|how much)\b.*\bcitizenship\b/i,
      /\bhow long (does|will|is) (it take to get |the )?(canadian )?citizenship\b/i,
      /\bcitizenship\b.*\bprocessing( time)?\b/i,
      /\bprocessing time\b.*\bcitizenship\b/i,
      /\bcomment (demander|obtenir|présenter une demande de) (la )?citoyenneté/i,
      /\b(combien|frais|coût|coûte|prix)\b.*\bcitoyenneté/i,
      /\bcitoyenneté.*\b(frais|coût|coûte|délai|délais)\b/i,
    ],
    exclude: [APPLIED],
    vars: async ({ lang }) => {
      const [fees, proc] = await Promise.all([liveFees(), liveProcessing(lang)]);
      const money = (n: number) => (lang === 'fr' ? `${n} $` : `$${n}`);
      return {
        fee: money(fees.adultTotal),
        processing: money(fees.adultProcessing),
        right: money(fees.rightOfCitizenship),
        minor: money(fees.minor),
        time: lower(proc.text),
      };
    },
    reply: {
      en: `# Citizenship costs *{fee}* per adult, and processing takes {time}.

Most people apply online: you create an account, calculate your days in Canada, pay the fee and upload your documents. Families and groups can apply together. [1](${HOW.en})

The adult fee is {processing} for processing plus {right} for the right of citizenship, which is refunded if you aren’t approved. For a child under 18, it’s {minor}. [1](${HOW.en})

Processing currently takes {time}, from when IRCC gets your complete application to when you become a citizen, including the test and ceremony. [2](${PT.en})

If you’re 18 to 54 on the day you sign, you’ll also take a 20-question test. [3](${STUDY.en}) Below are the steps from start to finish, with a fee total for your family.`,
      fr: `# La citoyenneté coûte *{fee}* par adulte, et le traitement prend {time}.

La plupart des gens présentent leur demande en ligne : vous créez un compte, calculez vos jours au Canada, payez les frais et téléversez vos documents. Les familles et les groupes peuvent présenter une demande ensemble. [1](${HOW.fr})

Pour un adulte, les frais sont de {processing} pour le traitement plus {right} pour le droit de citoyenneté. Ce dernier montant est remboursé si la demande n’est pas approuvée. Pour un enfant de moins de 18 ans, ils sont de {minor}. [1](${HOW.fr})

Le traitement prend actuellement {time}, de la réception d’une demande complète par IRCC jusqu’à ce que vous deveniez citoyen, examen et cérémonie compris. [2](${PT.fr})

Si vous avez de 18 à 54 ans le jour de la signature, vous passerez aussi un examen de 20 questions. [3](${STUDY.fr}) Voici les étapes du début à la fin, avec le total des frais pour votre famille.`,
    },
    toolCalls: [
      {
        toolName: 'citizenshipSteps',
        input: ({ text, lang }: Ctx) => {
          const n = (re: RegExp) => Number(text.match(re)?.[1]) || undefined;
          const kids = n(/\b(\d{1,2}) (kids|children|enfants)\b/i);
          const adults = n(/\b(\d{1,2}) (adults|adultes)\b/i) ?? (/\b(my|our) (wife|husband|spouse|partner)|\bwe\b|\bnous\b|conjoint/i.test(text) ? 2 : undefined);
          return { lang, adults, minors: kids };
        },
      },
    ],
    followUps: follow('days', 'test', 'oath'),
  },
  {
    id: 'citizenship-test',
    priority: 8,
    checked: CHECKED,
    match: [
      /\b(citizenship )?(test|quiz|exam)\b.*\bcitizenship\b/i,
      /\bcitizenship\b.*\b(test|quiz|exam|questions)\b/i,
      /\bquiz me\b/i,
      /\bpractice (test|questions)\b/i,
      /\bdiscover canada\b/i,
      /\bexamen\b.*\bcitoyenneté/i,
      /\bcitoyenneté.*\b(examen|quiz|questions)\b/i,
      /\bdécouvrir le canada\b/i,
      /\b(faites-moi|fais-moi) pratiquer\b/i,
    ],
    reply: {
      en: `# The real test has *20 questions*, and you need 15 right to pass.

It’s 45 minutes, with multiple-choice or true-or-false questions, in English or French, and you get 3 chances to pass. Every question comes from the official study guide, Discover Canada. [1](${STUDY.en}) [2](${GUIDE.en})

You take it if you’re 18 to 54 on the day you sign your application. IRCC emails you an invitation after you apply, and you have 30 days to take the test online. [3](${TESTHOW.en})

Here’s a practice set written from the guide. Each answer shows the chapter it comes from, so you know what to review.`,
      fr: `# Le vrai examen compte *20 questions*, et il faut 15 bonnes réponses pour réussir.

Il dure 45 minutes, comporte des questions à choix multiple ou vrai ou faux, se fait en français ou en anglais, et vous avez 3 tentatives pour le réussir. Toutes les questions viennent du guide d’étude officiel, Découvrir le Canada. [1](${STUDY.fr}) [2](${GUIDE.fr})

Vous le passez si vous avez de 18 à 54 ans le jour où vous signez votre demande. IRCC vous envoie une invitation par courriel après votre demande, et vous avez 30 jours pour faire l’examen en ligne. [3](${TESTHOW.fr})

Voici une série de questions de pratique rédigées à partir du guide. Chaque réponse indique le chapitre d’où elle vient, pour savoir quoi revoir.`,
    },
    toolCalls: [
      {
        toolName: 'citizenshipPracticeTest',
        input: ({ text, lang }: Ctx) => {
          const topic = /histor|histoire/i.test(text)
            ? 'history'
            : /govern|gouvern|parliament|parlement|vote|elect|élect/i.test(text)
              ? 'government'
              : /symbol/i.test(text)
                ? 'symbols'
                : /geograph|géograph|province|region|région/i.test(text)
                  ? 'geography'
                  : /right|droit/i.test(text)
                    ? 'rights'
                    : 'all';
          const count = /\b(20|full|mock|complet|complète)\b/i.test(text) ? 20 : 10;
          return { count, topic, lang };
        },
      },
    ],
    followUps: follow('oath', 'days', 'apply'),
  },
  {
    id: 'citizenship-ceremony',
    priority: 8,
    checked: CHECKED,
    match: [
      /\b(oath|ceremony)\b.*\b(citizenship|citizen)\b/i,
      /\b(citizenship|citizen)\b.*\b(oath|ceremony)\b/i,
      /\boath of citizenship\b/i,
      /\b(serment|cérémonie)\b.*\bcitoyenneté/i,
      /\bcitoyenneté.*\b(serment|cérémonie)\b/i,
    ],
    reply: {
      en: `# The ceremony is the last step: you take the *oath of citizenship* and become a citizen.

You’re invited at least 1 week ahead, to a virtual or in-person ceremony. [1](${WHEN.en}) Bring your invitation, your PR card (even if it’s expired) or your Confirmation of Permanent Residence, and 2 pieces of ID. [2](${BRING.en})

You can swear or affirm the oath, and IRCC encourages you to practise it, and O Canada, before the day. [3](${EXPECT.en})

Afterwards you get your citizenship certificate. You need it to apply for a passport, and you can’t travel on your PR card anymore. [4](${AFTERC.en})

Practise the oath below, line by line, in English or French.`,
      fr: `# La cérémonie est la dernière étape : vous prêtez le *serment de citoyenneté* et devenez citoyen.

Vous êtes invité au moins 1 semaine à l’avance, à une cérémonie virtuelle ou en personne. [1](${WHEN.fr}) Apportez votre invitation, votre carte de résident permanent (même expirée) ou votre confirmation de résidence permanente, et 2 pièces d’identité. [2](${BRING.fr})

Vous pouvez jurer ou affirmer solennellement, et IRCC vous encourage à répéter le serment et l’Ô Canada avant le jour J. [3](${EXPECT.fr})

Ensuite, vous recevez votre certificat de citoyenneté. Il vous faut ce certificat pour demander un passeport, et vous ne pouvez plus voyager avec votre carte de RP. [4](${AFTERC.fr})

Pratiquez le serment ci-dessous, ligne par ligne, en français ou en anglais.`,
    },
    toolCalls: [
      {
        toolName: 'citizenshipCeremony',
        input: ({ text, lang }: Ctx) => ({
          format: /\b(virtual|online|virtuelle?|en ligne)\b/i.test(text) ? 'virtual' : /\bin[- ]person\b|\ben personne\b/i.test(text) ? 'in-person' : undefined,
          lang,
        }),
      },
    ],
    followUps: follow('test', 'apply'),
  },
  {
    id: 'citizenship-status',
    priority: 9,
    checked: CHECKED,
    match: [
      new RegExp(`(?=.*${APPLIED.source})(?=.*${CITIZEN.source})`, 'i'),
      /\b(status|update)\b.*\bcitizenship application\b/i,
      /état de ma demande de citoyenneté/i,
    ],
    // People who have already applied go to the status tracker only: no processing-time estimate here
    // (CDS AI Answers, context-ircc: processing times are for estimates before applying).
    reply: {
      en: `# Check your application status online for the latest on your file.

Once you have your acknowledgement of receipt (AOR), the application status tracker shows each step, from the test to the ceremony. [1](${STATUS.en})

While you wait, tell IRCC if you move, change your email or plan to leave Canada for more than 2 weeks in a row, and stay available in Canada for your test, interview and ceremony. [2](${AFTER.en})`,
      fr: `# Vérifiez l’état de votre demande en ligne pour connaître où en est votre dossier.

Une fois l’accusé de réception reçu, l’outil de suivi de l’état de la demande montre chaque étape, de l’examen à la cérémonie. [1](${STATUS.fr})

En attendant, informez IRCC si vous déménagez, changez d’adresse courriel ou prévoyez quitter le Canada plus de 2 semaines d’affilée, et restez disponible au Canada pour votre examen, votre entrevue et la cérémonie. [2](${AFTER.fr})`,
    },
    followUps: follow('test', 'oath'),
  },
];

// French typography: a non-breaking space before ':' so a colon never starts a line.
export default scenarios.map((s) => ({ ...s, reply: { ...s.reply, fr: s.reply.fr.replace(/ :/g, '\u00a0:') } }));
