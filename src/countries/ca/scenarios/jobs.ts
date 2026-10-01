/**
 * Scripted scenarios for the `jobs` widget (EN + FR). Facts: widgets/jobs/data.ts. The search and wage
 * answers quote live Job Bank numbers (widgets/jobs/answers.ts) and their follow-up chips are tailored to
 * the question (widgets/jobs/follow-ups.ts).
 */
import type { Scenario } from '@/lib/scripted/types';
import { T, link, money, searchAnswer, wageAnswer } from '../widgets/jobs/answers';
import { STUDENT_PAY, URLS, provinceFrom, type Lang } from '../widgets/jobs/data';
import { GOV_SPARES, STUDENT_PAY_QUESTION, followUpsFor, governmentFollowUps, liveChips, prefetchChips, resumeFollowUps, searchFollowUps, wageFollowUps } from '../widgets/jobs/follow-ups';
import { parseJobQuery, parseWageQuery, skillsFromText, youthFromText } from '../widgets/jobs/intent';
import { resolveLocation } from '../widgets/jobs/live';
import { displayTerm } from '../widgets/jobs/text';

/** "$18.84 to $28.30" / "de 18,84 $ à 28,30 $": a student pay range, in a sentence. */
const range = (r: { min: number; max: number }, lang: Lang) => (lang === 'fr' ? `de ${money(r.min, 'fr')} à ${money(r.max, 'fr')}` : `${money(r.min, 'en')} to ${money(r.max, 'en')}`);

/** A RegExp-shaped matcher backed by a parser, so a scenario only claims questions it can really answer. */
const when = (fn: (text: string) => boolean): RegExp => Object.assign(/(?:)/, { test: fn });

const MONEY_WORDS = /\b(how much|salary|salaries|wages?|pay|paid|earn\w*|make|income)\b|\b(combien|salaires?|gagne\w*|rémunération|payé\w*)\b/i;
const NOT_SEARCH = /\b(military|army|navy|air force|armed forces|caf|rcmp|grc|forces armées|résumé|resume|cv)\b/i;

/**
 * Last line of the program answers. It agrees with the widget below: prefilled from the question
 * ("I'm 55…", "I'm in high school"), or still waiting for a stage and an age.
 */
const TOLD = {
  en: 'The programs below are checked against what you told me; change your stage or age to see others.',
  fr: 'Les programmes ci-dessous tiennent compte de ce que vous m’avez dit; modifiez votre situation ou votre âge pour en voir d’autres.',
};
function nextStep(text: string, lang: Lang, ask: Record<Lang, string>): string {
  const { age, stage } = youthFromText(text);
  return (age != null || stage ? TOLD : ask)[lang];
}

const jobs: Scenario[] = [
  {
    id: 'jobs-wages',
    priority: 5,
    checked: '2026-09-30',
    match: [when((t) => MONEY_WORDS.test(t) && !!parseWageQuery(t))],
    exclude: [/\b(minimum wage|salaire minimum|ei|assurance-emploi|employment insurance|pension|cpp|rpc|oas|sv)\b/i],
    reply: {
      en: `{headline}

{body}

Compare every province below, or switch to yearly pay.`,
      fr: `{headline}

{body}

Comparez toutes les provinces ci-dessous ou affichez le salaire annuel.`,
    },
    vars: ({ text, lang }) => (prefetchChips(wageFollowUps(text, lang), lang), wageAnswer(text, lang)),
    toolCalls: [
      {
        toolName: 'jobsWages',
        input: ({ text, lang }: { text: string; lang: Lang }) => {
          const w = parseWageQuery(text);
          return { occupation: w?.occupation ?? text.slice(0, 80), province: w?.province, lang };
        },
      },
      followUpsFor(wageFollowUps),
    ],
    // The chips shown come from wageFollowUps above (tailored to the occupation and place). This list is what
    // scripts/check-scenarios.mjs verifies; see the note on followUpsFor about the engine's second call.
    followUps: {
      en: ['What jobs match my resume?', 'Government of Canada jobs', 'Summer jobs for students'],
      fr: ['Quels emplois correspondent à mon CV?', 'Emplois au gouvernement du Canada', 'Emplois d’été pour étudiants'],
    },
  },
  {
    id: 'jobs-search',
    priority: 3,
    checked: '2026-09-30',
    match: [when((t) => !NOT_SEARCH.test(t) && !!parseJobQuery(t))],
    exclude: [/\b(lost|lose|losing|quit|laid off|fired)\b.*\bjob\b/i, /\b(perdu|perdre|perte)\b.*\bemploi\b/i, /\b(record of employment|relevé d[’']emploi|assurance-emploi|employment insurance)\b/i],
    reply: {
      en: `{headline}

Job Bank is the Government of Canada’s national job board: it lists jobs posted directly by employers plus postings from partner job boards, and you can search it without an account. ${link(1, URLS.jobBankFind.en, T.jobBank.en)} For jobs in the federal public service, most departments post on **GC Jobs** instead. ${link(2, URLS.gcJobs.en, T.gcJobs.en)}{pay}

{outro}`,
      fr: `{headline}

Le Guichet-Emplois est le site national d’emplois du gouvernement du Canada : il présente les offres publiées directement par les employeurs et celles de sites d’emploi partenaires, et vous pouvez y chercher sans compte. ${link(1, URLS.jobBankFind.fr, T.jobBank.fr)} Pour les emplois dans la fonction publique fédérale, la plupart des ministères affichent plutôt leurs offres sur **Emplois GC**. ${link(2, URLS.gcJobs.fr, T.gcJobs.fr)}{pay}

{outro}`,
    },
    vars: ({ text, lang }) => {
      // The chips' searches start as soon as the place is known, alongside the main search.
      resolveLocation(parseJobQuery(text)?.location, lang)
        .then(() => prefetchChips(searchFollowUps(text, lang), lang))
        .catch(() => undefined);
      return searchAnswer(text, lang);
    },
    toolCalls: [
      {
        toolName: 'jobsSearch',
        input: ({ text, lang }: { text: string; lang: Lang }) => {
          const q = parseJobQuery(text);
          return { query: q ? q.query : 'jobs', location: q?.location, remote: q?.remote, student: q?.student, recent: q?.recent, lang };
        },
      },
      followUpsFor(searchFollowUps),
    ],
    // The chips shown come from searchFollowUps above (tailored to the search).
    followUps: {
      en: ['What jobs match my resume?', 'Government of Canada jobs', 'Summer jobs for students'],
      fr: ['Quels emplois correspondent à mon CV?', 'Emplois au gouvernement du Canada', 'Emplois d’été pour étudiants'],
    },
  },
  {
    id: 'jobs-resume-match',
    priority: 5,
    checked: '2026-09-30',
    match: [
      /(?<!\p{L})(resume|résumé)(?!\p{L})/iu,
      /\bmy cv\b/i,
      /\bwhat (?:kind of )?(?:jobs?|careers?|work)\b.*\b(fit|fits|match|matches|suit|suits|suited|good for|could i do|can i do)\b/i,
      /\b(career change|change careers?|switch(?:ing)? careers?|new career)\b/i,
      /\b(mon cv|curriculum vitae|\bcv\b)/i,
      /(?<!\p{L})quels? (?:emplois?|métiers?|carrières?|postes?)(?!\p{L}).*(?<!\p{L})(correspond\p{L}*|convien\p{L}*|pour moi|pourrais)(?!\p{L})/iu,
      /(?<!\p{L})(changer de carrière|réorientation|nouvelle carrière)(?!\p{L})/iu,
      // "I worked retail and know Excel, what else could I do?"
      when((t) => /\bwhat else (?:could|can) i do\b/i.test(t) && /\b(work(?:ed)?|jobs?|careers?|skills?|experience|retail|excel)\b/i.test(t)),
      /\b(?:i(?:['’]ve| have)? worked|my (?:experience|skills))\b.*\b(?:what|which)\b.*\b(?:jobs?|careers?|could i do|can i do)\b/i,
      /(?<!\p{L})qu[’']est-ce que je (?:pourrais|peux) faire(?!\p{L}).*(?<!\p{L})(?:emplois?|métiers?|carrières?|travail|expérience|compétences)(?!\p{L})|(?<!\p{L})(?:emplois?|métiers?|carrières?|travail|expérience|compétences)(?!\p{L}).*(?<!\p{L})qu[’']est-ce que je (?:pourrais|peux) faire(?!\p{L})/iu,
      /(?<!\p{L})j[’']ai travaillé(?!\p{L}).*(?<!\p{L})(?:quels?|quelles?|qu[’']est-ce)(?!\p{L}).*(?<!\p{L})(?:emplois?|métiers?|carrières?|postes?|faire)(?!\p{L})/iu,
    ],
    exclude: [/\bresume builder\b/i, /\b(employment insurance|assurance-emploi|record of employment|relevé d[’']emploi)\b/i, /\bEI\b/],
    reply: {
      en: `# Let’s find the jobs your *experience* fits.

Drop your resume into the matcher below, or paste it. It’s read **on your device only**: nothing is uploaded or saved. We pick out your skills and past job titles, then rank occupations from Job Bank with their median pay. ${link(1, URLS.trendAnalysis.en, T.trends.en)}{skills}

When you’re ready to apply, Job Bank’s free **Resume Builder** helps you write a strong resume. ${link(2, URLS.resumeBuilder.en, T.resume.en)}`,
      fr: `# Trouvons les emplois qui correspondent à votre *expérience*.

Déposez votre CV dans l’outil ci-dessous ou collez-le. Il est lu **sur votre appareil seulement** : rien n’est téléversé ni conservé. Nous repérons vos compétences et vos titres d’emploi, puis classons les professions du Guichet-Emplois avec leur salaire médian. ${link(1, URLS.trendAnalysis.fr, T.trends.fr)}{skills}

Quand vous serez prêt à postuler, le **concepteur de CV** gratuit du Guichet-Emplois vous aide à rédiger un bon CV. ${link(2, URLS.resumeBuilder.fr, T.resume.fr)}`,
    },
    vars: ({ text, lang }) => {
      const { skills, titles, years } = skillsFromText(text);
      // "retail (3 years)": the time spent counts, so the answer says it was heard.
      const span = years && titles.length === 1 ? (lang === 'fr' ? ` (${years} ${years === 1 ? 'an' : 'ans'})` : ` (${years} ${years === 1 ? 'year' : 'years'})`) : '';
      const words = [...titles.map((k) => displayTerm(text, k) + span), ...skills.map((k) => displayTerm(text, k))].slice(0, 6);
      if (!words.length) return { skills: '' };
      return { skills: lang === 'fr' ? ` Pour commencer, j’ai utilisé ce que vous m’avez dit : ${words.join(', ')}.` : ` To start, I used what you told me: ${words.join(', ')}.` };
    },
    toolCalls: [
      {
        toolName: 'jobsResumeMatch',
        input: ({ text, lang }: { text: string; lang: Lang }) => {
          const { skills, titles, years } = skillsFromText(text);
          const prov = text.match(/\b(?:in|en|au|à)\s+([A-ZÀ-Ý][\p{L}-]+(?:\s[A-ZÀ-Ý][\p{L}-]+)*)/u)?.[1];
          return { skills: skills.map((k) => displayTerm(text, k)), titles: titles.map((k) => displayTerm(text, k)), years, province: provinceFrom(prov), lang };
        },
      },
      followUpsFor(resumeFollowUps),
    ],
    // The chips shown come from resumeFollowUps above (tailored to what the person said).
    followUps: {
      en: ['I know customer service, sales and Excel. What jobs fit me?', 'Summer jobs for students', 'Government of Canada jobs'],
      fr: ['Je connais le service à la clientèle, la vente et Excel. Quels emplois me conviennent?', 'Emplois d’été pour étudiants', 'Emplois au gouvernement du Canada'],
    },
  },
  {
    id: 'jobs-government',
    priority: 7,
    checked: '2026-09-30',
    match: [
      /\b(government|federal|public service|gc)\s+(?:of canada\s+)?(jobs?|careers?|work|internships?|positions?)\b/i,
      /\bwork (?:for|in) the (?:federal )?(government|public service)\b/i,
      /\b(gc jobs|fswep|federal student work)\b/i,
      /(?<!\p{L})(emplois?|carrières?|travailler|stages?)(?!\p{L}).*(?<!\p{L})(gouvernement|fonction publique|fédéra(?:l|le|ux))(?!\p{L})/iu,
      /\b(emplois gc|pfete)\b/i,
    ],
    exclude: [/\b(military|army|navy|armed forces|forces armées|caf|rcmp|grc)\b/i],
    reply: {
      en: `# Most federal jobs are posted on *GC Jobs*, and you can search them without an account.

Most Government of Canada departments list their openings on GC Jobs; some also post on their own career pages or on Job Bank. ${link(1, URLS.gcJobs.en, T.gcJobs.en)}

Students can join the **Federal Student Work Experience Program**, which hires full-time students into 200+ departments and agencies all year round. Student pay starts at **${money(STUDENT_PAY.secondary, 'en')} an hour**. ${link(2, URLS.fswep.en, T.fswep.en)} ${link(3, URLS.studentPay.en, T.pay.en)}

{next}`,
      fr: `# La plupart des emplois fédéraux sont affichés sur *Emplois GC*, et vous pouvez les chercher sans compte.

La plupart des ministères du gouvernement du Canada affichent leurs postes sur Emplois GC; certains les publient aussi sur leur propre site de carrières ou au Guichet-Emplois. ${link(1, URLS.gcJobs.fr, T.gcJobs.fr)}

Les étudiants peuvent participer au **Programme fédéral d’expérience de travail étudiant**, qui embauche des étudiants à temps plein dans plus de 200 ministères et organismes, toute l’année. Le salaire étudiant commence à **${money(STUDENT_PAY.secondary, 'fr')} de l’heure**. ${link(2, URLS.fswep.fr, T.fswep.fr)} ${link(3, URLS.studentPay.fr, T.pay.fr)}

{next}`,
    },
    toolCalls: [
      {
        toolName: 'jobsPrograms',
        input: ({ text, lang, timeZone }: { text: string; lang: Lang; timeZone?: string }) => ({ ...youthFromText(text), interest: 'government', lang, timeZone }),
      },
      {
        toolName: 'suggestFollowUps',
        input: ({ text, lang }: { text: string; lang: Lang }) => ({ questions: liveChips(governmentFollowUps(text, lang), GOV_SPARES[lang], lang) }),
      },
    ],
    // Warms the search chip while the answer streams, so a chip with no postings today is swapped out.
    vars: ({ text, lang }) => {
      prefetchChips([...governmentFollowUps(text, lang), ...GOV_SPARES[lang]], lang);
      return {
        next: nextStep(text, lang, {
          en: 'Set your stage and age below to see which programs fit you.',
          fr: 'Indiquez votre situation et votre âge ci-dessous pour voir les programmes qui vous conviennent.',
        }),
      };
    },
    // The chips shown come from governmentFollowUps above (checked live on Job Bank).
    followUps: {
      en: ['Summer jobs for students', STUDENT_PAY_QUESTION.en, 'What jobs match my resume?'],
      fr: ['Emplois d’été pour étudiants', STUDENT_PAY_QUESTION.fr, 'Quels emplois correspondent à mon CV?'],
    },
  },
  {
    id: 'jobs-youth-summer',
    priority: 6,
    checked: '2026-09-30',
    match: [
      /\bsummer (jobs?|work|employment)\b/i,
      /\bcanada summer jobs\b/i,
      /\b(student|youth|teen|teenager|high school)s?\s+(jobs?|work|employment|programs?)\b/i,
      /\bjobs? for (students?|youth|teens?|teenagers?|young people)\b/i,
      /\bmy first job\b/i,
      /(?<!\p{L})emplois? d[’']été(?!\p{L})/iu,
      /(?<!\p{L})emplois? (?:pour (?:les )?|des )(étudiants?|jeunes)(?!\p{L})/iu,
      /(?<!\p{L})(étudiants?|jeunes)(?!\p{L}).*(?<!\p{L})(emplois?|travail|job)(?!\p{L})/iu,
    ],
    // A search with a place ("student jobs in Toronto") belongs to jobs-search.
    exclude: [/\b(military|army|cadets?|rcmp|grc)\b/i, /(?<!\p{L})(?:jobs?|emplois?|work|travail)(?!\p{L}).*\s(?:in|near|à|au|en|dans)\s+[A-ZÀ-Ý]/u],
    reply: {
      en: `# If you’re 15 to 30, *Canada Summer Jobs* can get you paid work experience.

The program helps youth aged 15 to 30 gain paid summer work experience. The jobs are posted on **Job Bank each spring**, so start your search early. ${link(1, URLS.csj.en, T.csj.en)} ${link(2, URLS.jobBankYouth.en, T.youth.en)}

Full-time students can also work for the federal government through **FSWEP**, all year round. ${link(3, URLS.fswep.en, T.fswep.en)} And the **Youth Employment and Skills Strategy** offers training and paid work experience for youth facing barriers. ${link(4, URLS.yess.en, T.yess.en)}

{next}`,
      fr: `# Si vous avez de 15 à 30 ans, *Emplois d’été Canada* peut vous offrir une expérience de travail rémunérée.

Le programme aide les jeunes de 15 à 30 ans à acquérir une expérience de travail rémunérée pendant l’été. Les offres sont publiées au **Guichet-Emplois chaque printemps** : commencez vos recherches tôt. ${link(1, URLS.csj.fr, T.csj.fr)} ${link(2, URLS.jobBankYouth.fr, T.youth.fr)}

Les étudiants à temps plein peuvent aussi travailler au gouvernement fédéral grâce au **PFETE**, toute l’année. ${link(3, URLS.fswep.fr, T.fswep.fr)} Et la **Stratégie emploi et compétences jeunesse** offre de la formation et de l’expérience de travail rémunérée aux jeunes qui font face à des obstacles. ${link(4, URLS.yess.fr, T.yess.fr)}

{next}`,
    },
    toolCalls: [
      {
        toolName: 'jobsPrograms',
        input: ({ text, lang, timeZone }: { text: string; lang: Lang; timeZone?: string }) => ({ ...youthFromText(text), interest: 'summer', lang, timeZone }),
      },
    ],
    vars: ({ text, lang }) => ({
      next: nextStep(text, lang, {
        en: 'Set your stage and age below to see every program that fits.',
        fr: 'Indiquez votre situation et votre âge ci-dessous pour voir tous les programmes qui vous conviennent.',
      }),
    }),
    // No chip leads back to the government answer, which itself offers "Summer jobs for students": the two
    // answers would send the person round in a circle.
    followUps: {
      en: [STUDENT_PAY_QUESTION.en, 'Find student jobs in Toronto', 'What jobs match my resume?'],
      fr: [STUDENT_PAY_QUESTION.fr, 'Trouver des emplois pour étudiants à Montréal', 'Quels emplois correspondent à mon CV?'],
    },
  },
  {
    id: 'jobs-student-pay',
    priority: 9,
    checked: '2026-10-01',
    match: [
      /\bhow much\b.*\bstudents?\b.*\b(federal|government|public service|fswep)\b/i,
      /\bstudent (?:rates? of pay|pay rates?)\b/i,
      /\b(fswep|federal student)\b.*\b(pay|pays|paid|wages?|salary|salaries|rates?)\b/i,
      /(?<!\p{L})combien(?!\p{L}).*étudiant\p{L}*.*(?<!\p{L})(fédéral\p{L}*|gouvernement|fonction publique|pfete)(?!\p{L})/iu,
      /(?<!\p{L})taux de rémunération des étudiants(?!\p{L})/iu,
      /(?<!\p{L})(pfete|emplois? étudiants? fédéra\p{L}*)(?!\p{L}).*(?<!\p{L})(salaires?|pai\p{L}*|rémunération|taux)(?!\p{L})/iu,
    ],
    exclude: [/\b(military|army|navy|armed forces|forces armées|caf|rcmp|grc|loans?|grants?|prêts?|bourses?)\b/i],
    reply: {
      en: `# Federal student jobs pay from *${money(STUDENT_PAY.secondary, 'en')} an hour*, and more as you advance in your studies.

The rate depends on your level of study. Secondary school students earn **${money(STUDENT_PAY.secondary, 'en')} an hour**. College, CEGEP and pre-university students earn ${range(STUDENT_PAY.college, 'en')}, and university undergraduates ${range(STUDENT_PAY.undergrad, 'en')}. ${link(1, URLS.studentPay.en, T.pay.en)}

Master’s students earn ${range(STUDENT_PAY.masters, 'en')} an hour and doctoral students ${range(STUDENT_PAY.doctorate, 'en')}. A department can offer a step above the minimum when, for example, you have relevant work experience or have finished more than one year of your program. If the minimum wage in your province or territory is higher than the top rate for your level, you are paid the minimum wage instead. These rates took effect on May 1, 2025. ${link(1, URLS.studentPay.en, T.pay.en)}

Most of these jobs are filled through the **Federal Student Work Experience Program**, which hires full-time students all year round. ${link(2, URLS.fswep.en, T.fswep.en)}

Set your stage and age below to see which student programs fit you.`,
      fr: `# Les emplois étudiants fédéraux paient à partir de *${money(STUDENT_PAY.secondary, 'fr')} de l’heure*, et davantage selon votre niveau d’études.

Le taux dépend de votre niveau d’études. Les élèves du secondaire gagnent **${money(STUDENT_PAY.secondary, 'fr')} de l’heure**. Les étudiants du collège, du cégep ou du niveau préuniversitaire gagnent ${range(STUDENT_PAY.college, 'fr')}, et ceux du premier cycle universitaire, ${range(STUDENT_PAY.undergrad, 'fr')}. ${link(1, URLS.studentPay.fr, T.pay.fr)}

À la maîtrise, le taux va ${range(STUDENT_PAY.masters, 'fr')} de l’heure et, au doctorat, ${range(STUDENT_PAY.doctorate, 'fr')}. Un ministère peut offrir un échelon supérieur au minimum, par exemple si vous avez une expérience de travail pertinente ou avez terminé plus d’une année de votre programme. Si le salaire minimum de votre province ou de votre territoire dépasse le taux maximal de votre niveau, c’est le salaire minimum qui s’applique. Ces taux sont en vigueur depuis le 1ᵉʳ mai 2025. ${link(1, URLS.studentPay.fr, T.pay.fr)}

La plupart de ces emplois sont pourvus par le **Programme fédéral d’expérience de travail étudiant**, qui embauche des étudiants à temps plein toute l’année. ${link(2, URLS.fswep.fr, T.fswep.fr)}

Indiquez votre situation et votre âge ci-dessous pour voir les programmes étudiants qui vous conviennent.`,
    },
    toolCalls: [
      {
        toolName: 'jobsPrograms',
        input: ({ text, lang, timeZone }: { text: string; lang: Lang; timeZone?: string }) => ({ ...youthFromText(text), interest: 'government', lang, timeZone }),
      },
    ],
    followUps: {
      en: ['Find student jobs in Ottawa', 'What jobs match my resume?', 'How much does an administrative assistant make in Ontario?'],
      fr: ['Trouver des emplois pour étudiants à Ottawa', 'Quels emplois correspondent à mon CV?', 'Combien gagne-t-on comme adjoint administratif en Ontario?'],
    },
  },
];

export default jobs;
