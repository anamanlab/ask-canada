/**
 * Scripted scenarios for the `documents` widget (EN + FR). Facts: widgets/documents/data.ts (URLs: urls.ts).
 * The forms finder's scenarios live in widgets/documents/forms-scenarios.ts.
 * The first scenario is also what the engine uses when a file is attached and nothing else matches: the
 * scripted engine can't read files, so it asks which document it is (never pretends to have read it).
 */
import type { Bilingual, Scenario } from '@/lib/scripted/types';
import { PHONES, type DocId, type Lang, type PhoneKey, type Signal } from '../widgets/documents/data';
import { formsScenarios } from '../widgets/documents/forms-scenarios';
import { URLS } from '../widgets/documents/urls';
import en from '../widgets/documents/messages/en.json';
import fr from '../widgets/documents/messages/fr.json';

type Ctx = { text: string; lang: Lang; timeZone?: string };
const M: Record<Lang, Record<string, string>> = { en, fr };
const m = (lang: Lang, key: string) => M[lang][key] ?? M.en[key] ?? '';
/** A phone number that never breaks across lines (non-breaking hyphens), from the verified data. */
const tel = (key: PhoneKey, lang: Lang) => PHONES[key][lang].replace(/-/g, '\u2011');

/* ───────── helpers: what the person described ───────── */

/**
 * Document types named in plain words (EN + FR). Order matters: specific before general.
 * `\b` only sees unaccented letters, so no alternative starts or ends with an accented one.
 */
const TYPES: [RegExp, DocId][] = [
  [/\b(notice of reassessment|reassessment|nouvelle cotisation|ADNC)\b/i, 'cra-nor'],
  [/\b(notice of assessment|avis de cotisation)\b|\bNOA\b|\bADC\b/i, 'cra-noa'],
  [/\b(review letter|processing review|pre-assessment review|lettre d.examen|examen de (ma|votre) déclaration)\b/i, 'cra-review'],
  [/\b(ccb|child benefit|allocation canadienne pour enfants|ACE)\b/i, 'cra-ccb-notice'],
  [/\b(cgeb|groceries and essentials|gst\/?hst credit|pour l.épicerie|ACEBE|crédit (pour la )?TPS)\b/i, 'cra-cgeb-notice'],
  [/\b(benefit statement|access code|relevé des prestations|code d.accès)\b/i, 'esdc-ei-statement'],
  [/\b(ei decision|employment insurance decision|décision d.assurance-emploi|lettre de décision)\b/i, 'esdc-ei-decision'],
  [/\b(oas|old age security|sécurité de la vieillesse|lettre d.inscription)\b/i, 'esdc-oas-enrolment'],
  [/\b(biometric|biométri\w*|BIL)\b/i, 'ircc-biometrics'],
  [/\b(medical (exam )?instructions|medical exam|examen médical)\b/i, 'ircc-medical'],
];
const typeIn = (text: string): DocId | undefined => TYPES.find(([re]) => re.test(text))?.[1];

/** Scam warning signs mentioned in the question. */
const SIGNS: [RegExp, Signal][] = [
  [/\b(gift ?cards?|prepaid|cartes?-cadeaux?|cartes? prépay)\b/i, 'gift-cards'],
  [/\b(bitcoin|crypto\w*)\b/i, 'crypto'],
  [/\b(e-?transfer|interac|virement)\b/i, 'etransfer'],
  [/\b(arrest\w*|deport\w*|jail|prison|police|arrêt\w*|expuls\w*)\b/i, 'threats'],
  [/\b(text(ed)?|sms|whatsapp|messenger|texto|message texte)\b/i, 'text-message'],
  [/\b(link|lien|click|cliquer)\b/i, 'link-info'],
];
const signsIn = (text: string) => SIGNS.filter(([re]) => re.test(text)).map(([, s]) => s);

const U = (k: keyof typeof URLS, lang: Lang) => URLS[k][lang];

/* ───────── "explain my …" for the documents without their own scenario ───────── */

/** Each document's names as people write them (EN, FR), including the picker's titles. */
const CRA_DOCS = {
  en: 'notice of reassessment|review letter|processing review|child benefit notice|ccb notice|groceries and essentials benefit notice|cgeb notice',
  fr: 'avis de nouvelle cotisation|lettre d.examen|avis de l.allocation canadienne pour enfants|avis de l.allocation canadienne pour l.épicerie|avis de l.allocation pour l.épicerie',
};
const EI_STATEMENT = { en: 'ei benefit statement|benefit statement|access code', fr: 'relevé des prestations|code d.accès' };
const OAS_LETTER = { en: 'oas enrol\\w* letter|oas enroll\\w* letter|old age security enrol\\w* letter', fr: 'lettre d.inscription' };
const IRCC_DOCS = { en: 'medical (exam )?instructions', fr: 'instructions pour l.examen médical' };
/** "Explain / what is / I got …" followed by one of these documents' names. */
const ASKS_ABOUT = (names: Bilingual<string>) => [
  new RegExp(`\\b(explain|what is|what's|what does|understand|got|received|have)\\b.*\\b(${names.en})\\b`, 'i'),
  new RegExp(`\\b(explique\\w*|comment lire|qu.est-ce qu|que signifie|j.ai reçu|comprendre)\\b.*\\b(${names.fr})\\b`, 'i'),
];

const TYPE_LINK: Record<DocId, keyof typeof URLS> = {
  'cra-noa': 'noa',
  'cra-nor': 'noa',
  'cra-review': 'respond',
  'cra-ccb-notice': 'ccbGet',
  'cra-cgeb-notice': 'cgeb',
  'esdc-ei-decision': 'eiRecon',
  'esdc-ei-statement': 'eiReporting',
  'esdc-oas-enrolment': 'oasApply',
  'ircc-biometrics': 'bioWhere',
  'ircc-medical': 'medical',
};

/** What the named document means, the explainer card for it, and follow-ups from the same department. */
function typeScenario(id: string, priority: number, match: RegExp[], followUps: Bilingual<string[]>): Scenario {
  return {
    id,
    priority,
    match,
    exclude: [/\bnotice of assessment\b(?! of)|\bavis de cotisation\b/i],
    vars: ({ text, lang }) => {
      const def = typeIn(text) ?? 'cra-nor';
      return { name: m(lang, `doc.${def}.name`), what: m(lang, `doc.${def}.what`), url: U(TYPE_LINK[def], lang) };
    },
    reply: {
      en: `# Here’s what your *{name}* means.

{what} [1]({url})

Below are the steps to take next, with the official page for each one.`,
      fr: `# Voici ce que signifie votre *{name}*.

{what} [1]({url})

Voici les prochaines étapes, avec la page officielle pour chacune.`,
    },
    toolCalls: [{ toolName: 'documentsExplain', input: ({ text, lang, timeZone }: Ctx) => ({ docType: typeIn(text) ?? 'cra-nor', lang, timeZone }) }],
    followUps,
  };
}

/* ───────── scenarios ───────── */

const documents: Scenario[] = [
  {
    // Also the fallback for attached files (see the note at the top).
    id: 'documents-attachment',
    priority: 3,
    match: [
      /\b(what does|what do|explain|help me (understand|read)|make sense of|understand)\b.*\b(this|my|attached|a)\b.*\b(letter|document|notice|mail|form)\b/i,
      /\bgot a letter from the (government|cra|service canada|ircc)\b/i,
      /\b(que (signifie|veut dire)|explique\w*|m.aider à comprendre|comprendre)\b.*\b(ce|cette|mon|ma|la|le)\b.*\b(lettre|document|avis|courrier|formulaire)\b/i,
      /\b(j.ai reçu une lettre)\b/i,
    ],
    exclude: [/\bnotice of (re)?assessment\b|\bavis de (nouvelle )?cotisation\b/i],
    reply: {
      en: `# Let’s make sense of *your document*.

Tell me which one you have below, and I’ll explain it in plain language: what it is, the amounts and dates that matter, and what to do next, with the official page for each step. [1](${U('noa', 'en')})

Worried it might be fake? The CRA never demands payment by gift card, cryptocurrency or e-Transfer, and never threatens arrest. [2](${U('recognizeScam', 'en')})`,
      fr: `# Voyons ensemble ce que dit *votre document*.

Indiquez ci-dessous lequel vous avez, et je vous l’explique en langage clair : de quoi il s’agit, les montants et les dates à surveiller, et quoi faire ensuite, avec la page officielle pour chaque étape. [1](${U('noa', 'fr')})

Vous craignez que ce soit faux? L’ARC n’exige jamais de paiement par carte-cadeau, cryptomonnaie ou virement Interac, et ne menace jamais d’arrestation. [2](${U('recognizeScam', 'fr')})`,
    },
    toolCalls: [{ toolName: 'documentsExplain', input: ({ lang, timeZone }: Ctx) => ({ lang, timeZone }) }],
    followUps: {
      en: ['Explain my notice of assessment', 'Is this CRA letter real or a scam?', 'I got an EI decision letter', 'Find form T2201'],
      fr: ['Comment lire mon avis de cotisation?', 'Est-ce que cette lettre de l’ARC est vraie ou une arnaque?', 'J’ai reçu une lettre de décision d’assurance-emploi', 'Où trouver le formulaire T2201?'],
    },
  },
  {
    id: 'documents-noa',
    priority: 6,
    match: [/\bnotice of assessment\b/i, /\bavis de cotisation\b/i, /\b(my|the|explain|read)\b.*\bNOA\b/i],
    // "How long until I get my NOA / refund" belongs to the taxes widget.
    exclude: [/\b(how long|when will|status|still|yet|waiting|taking)\b/i, /\b(combien de temps|quand (vais|va|est-ce)|toujours pas|pas encore|délai)\b/i],
    reply: {
      en: `# Your notice of assessment is the CRA’s *summary of your tax return*.

It shows what the CRA calculated after processing your return, with one of three results: a **Refund**, an **Amount due**, or **Balance: Nil**. If the CRA changed anything, the notice explains why. [1](${U('noa', 'en')})

Disagree? You can object until the later of **90 days after the notice date** or **one year after the filing deadline**. If you simply forgot something, change your return instead. [2](${U('objection', 'en')}) [3](${U('changeReturn', 'en')})

Here’s where to look on it and what to do next.`,
      fr: `# Votre avis de cotisation est le *résumé de votre déclaration* par l’ARC.

Il présente ce que l’ARC a calculé après le traitement de votre déclaration, avec l’un de trois résultats : **Remboursement**, **Montant dû** ou **Solde : Néant**. Si l’ARC a changé quelque chose, l’avis explique pourquoi. [1](${U('noa', 'fr')})

En désaccord? Vous pouvez vous opposer jusqu’à la plus tardive de ces dates : **90 jours après la date de l’avis** ou **un an après la date limite de production**. Si vous avez simplement oublié quelque chose, modifiez plutôt votre déclaration. [2](${U('objection', 'fr')}) [3](${U('changeReturn', 'fr')})

Voici où regarder sur l’avis et quoi faire ensuite.`,
    },
    toolCalls: [{ toolName: 'documentsExplain', input: ({ lang, timeZone }: Ctx) => ({ docType: 'cra-noa', issuer: 'cra', lang, timeZone }) }],
    followUps: {
      en: ['Find form T400A', 'Explain my notice of reassessment', 'Is this CRA letter real or a scam?', 'How long does my tax refund take?'],
      fr: ['Où trouver le formulaire T400A?', 'Comment lire mon avis de nouvelle cotisation?', 'Est-ce que cette lettre de l’ARC est vraie ou une arnaque?', 'Combien de temps pour recevoir mon remboursement d’impôt?'],
    },
  },
  {
    id: 'documents-scam',
    // Above the contact widget's "I've been scammed" answer, but only for "is this real?" questions.
    priority: 17,
    match: [
      /\b(is|was|are)\b.*\b(this|it|that|these)\b.*\b(scam|scams|fake|real(?! estate)|legit|legitimate|genuine|phishing|fraud|fraudulent)\b/i,
      /\b(real|legit|legitimate|genuine)\b.*\bor\b.*\b(scam|fake|fraud)\b/i,
      /\bhow (do|can) i (tell|know|check|verify)\b.*\b(real|legit|scam|fake|from the cra|from the government)\b/i,
      /\b(est-ce|est-elle|est-il)\b.*\b(arnaque|vraie?|fraude|frauduleu\w*|légitime|authentique)\b/i,
      /\b(vraie?|légitime|authentique)\b.*\bou\b.*\b(arnaque|fraude)\b/i,
      /\bcomment (savoir|vérifier|reconnaître)\b.*\b(arnaque|vraie?|arc|gouvernement)\b/i,
    ],
    exclude: [
      /\b(i was|i've been|i have been|i got|been) (scammed|defrauded|hacked)\b/i,
      /\b(lost|sent|paid|gave)\b.*\b(money|\$|them|my (bank|sin|card))\b/i,
      /\b(été victime|j.ai perdu|j.ai payé|j.ai envoyé|j.ai donné)\b/i,
    ],
    reply: {
      en: `# If it asks for gift cards, crypto or an e-Transfer, *it’s a scam*.

The CRA will never demand immediate payment by Interac e-Transfer, cryptocurrency, prepaid credit cards or gift cards, and never threatens arrest or deportation. It doesn’t send refunds by e-Transfer or text message, and it only texts you sign-in codes. [1](${U('recognizeScam', 'en')})

To check a message, sign in to your CRA account or call the CRA yourself at **${tel('craIndividuals', 'en')}**. Never call a number the message gives you. [2](${U('verifyCra', 'en')}) [3](${U('craContact', 'en')})

Tick what the message does below. If it’s a scam, report it to the CRA and to the Canadian Anti-Fraud Centre, even if you didn’t lose anything. [4](${U('reportScam', 'en')})`,
      fr: `# S’il demande des cartes-cadeaux, de la cryptomonnaie ou un virement Interac, *c’est une arnaque*.

L’ARC n’exige jamais de paiement immédiat par virement Interac, cryptomonnaie, carte de crédit prépayée ou carte-cadeau, et ne menace jamais d’arrestation ou d’expulsion. Elle n’envoie pas de remboursement par virement ou par message texte, et ne vous texte que des codes de connexion. [1](${U('recognizeScam', 'fr')})

Pour vérifier un message, connectez-vous à votre compte de l’ARC ou appelez vous-même l’ARC au **${tel('craIndividuals', 'fr')}**. N’appelez jamais un numéro fourni dans le message. [2](${U('verifyCra', 'fr')}) [3](${U('craContact', 'fr')})

Cochez ci-dessous ce que fait le message. Si c’est une arnaque, signalez‑la à l’ARC et au Centre antifraude du Canada, même si vous n’avez rien perdu. [4](${U('reportScam', 'fr')})`,
    },
    toolCalls: [
      {
        toolName: 'documentsExplain',
        input: ({ text, lang, timeZone }: Ctx) => ({ focus: 'verify', issuer: 'cra', warningSigns: signsIn(text), lang, timeZone }),
      },
    ],
    followUps: {
      en: ['Find form RC213', 'Explain my notice of assessment', 'What does this letter mean?'],
      fr: ['Où trouver le formulaire RC213?', 'Comment lire mon avis de cotisation?', 'Que signifie la lettre que j’ai reçue?'],
    },
  },
  {
    id: 'documents-ei-decision',
    priority: 7,
    match: [
      /\b(ei|employment insurance)\b.*\b(decision|denied|refused|rejected|disqualif\w*|reconsider\w*)\b/i,
      /\b(decision|denied|refused|rejected)\b.*\b(ei|employment insurance)\b/i,
      /\breconsideration\b/i,
      /\b(assurance-emploi|AE)\b.*\b(décision|refus\w*|révision)\b/i,
      /\b(décision|refus\w*)\b.*\b(assurance-emploi)\b/i,
      /\bdemande de révision\b/i,
    ],
    reply: {
      en: `# If you disagree with an EI decision, you have *30 days* to ask for a reconsideration.

Send any new information to Service Canada first: it may change the decision on its own. If not, fill out, print and sign **Form INS5210** and submit it in person or by mail within 30 days after the decision was communicated to you. It’s free. [1](${U('eiRecon', 'en')})

After 30 days you can still ask, but you’ll need to explain the delay. A different officer than the one who decided will review your file. [1](${U('eiRecon', 'en')})

Here’s what to do next. For questions about your claim, call EI at **${tel('ei', 'en')}**. [2](${U('eiContact', 'en')})`,
      fr: `# Si vous êtes en désaccord avec une décision d’assurance-emploi, vous avez *30 jours* pour demander une révision.

Envoyez d’abord tout nouveau renseignement à Service Canada : il peut suffire à changer la décision. Sinon, remplissez, imprimez et signez le **formulaire INS5210**, puis soumettez‑le en personne ou par la poste dans les 30 jours suivant la date à laquelle la décision vous a été communiquée. C’est gratuit. [1](${U('eiRecon', 'fr')})

Après 30 jours, vous pouvez encore la demander, mais vous devrez expliquer le retard. Un autre agent que celui qui a pris la décision examinera votre dossier. [1](${U('eiRecon', 'fr')})

Voici quoi faire ensuite. Pour vos questions, appelez l’assurance-emploi au **${tel('ei', 'fr')}**. [2](${U('eiContact', 'fr')})`,
    },
    toolCalls: [{ toolName: 'documentsExplain', input: ({ lang, timeZone }: Ctx) => ({ docType: 'esdc-ei-decision', issuer: 'esdc', lang, timeZone }) }],
    followUps: {
      // No scam-check chip here: that check follows CRA guidance, and this letter is from Service Canada.
      en: ['Find form INS5210', 'Explain my EI benefit statement', 'What does this letter mean?'],
      fr: ['Où trouver le formulaire INS5210?', 'Explique-moi mon relevé des prestations d’assurance-emploi', 'Que signifie la lettre que j’ai reçue?'],
    },
  },
  {
    id: 'documents-biometrics',
    priority: 7,
    match: [
      /\bbiometric\w*\b.*\b(letter|instruction\w*|deadline|appointment|days)\b/i,
      /\b(letter|instruction\w*)\b.*\bbiometric\w*\b/i,
      /\bBIL\b/,
      /\bbiométri\w*\b.*\b(lettre|instructions?|délai|rendez-vous|jours)\b/i,
      /\b(lettre|instructions?)\b.*\bbiométri\w*\b/i,
    ],
    reply: {
      en: `# You have *30 days* from getting your biometric instruction letter to give your fingerprints and photo.

Book your appointment as soon as the letter arrives. Booking is free, so don’t pay anyone to book an appointment. Bring the letter and a valid passport. [1](${U('bioWhere', 'en')}) [2](${U('bioHow', 'en')})

If you can’t make it within 30 days, use the IRCC web form to explain why and include your appointment date. [1](${U('bioWhere', 'en')})`,
      fr: `# Vous avez *30 jours* après la réception de votre lettre d’instructions pour fournir vos empreintes digitales et votre photo.

Prenez rendez‑vous dès que la lettre arrive. La prise de rendez-vous est gratuite : ne payez personne pour prendre un rendez-vous. Apportez la lettre et un passeport valide. [1](${U('bioWhere', 'fr')}) [2](${U('bioHow', 'fr')})

Si vous ne pouvez pas y aller dans les 30 jours, utilisez le formulaire Web d’IRCC pour expliquer pourquoi, en indiquant la date de votre rendez-vous. [1](${U('bioWhere', 'fr')})`,
    },
    toolCalls: [{ toolName: 'documentsExplain', input: ({ lang, timeZone }: Ctx) => ({ docType: 'ircc-biometrics', issuer: 'ircc', lang, timeZone }) }],
    followUps: {
      en: ['Explain my medical exam instructions', 'Find form IMM 5476', 'What does this letter mean?'],
      fr: ['Explique-moi mes instructions pour l’examen médical', 'Où trouver le formulaire IMM 5476?', 'Que signifie la lettre que j’ai reçue?'],
    },
  },
  // Picker follow-ups and plain questions about the other documents we explain. The CRA answer offers the
  // CRA scam check; Service Canada and IRCC letters keep their follow-ups with their own department.
  typeScenario('documents-type', 5, [...ASKS_ABOUT(CRA_DOCS), /\ble document que j.ai reçu\b/i], {
    en: ['Is this CRA letter real or a scam?', 'Find a government form', 'Explain my notice of assessment'],
    fr: ['Est-ce que cette lettre de l’ARC est vraie ou une arnaque?', 'Où trouver un formulaire du gouvernement?', 'Comment lire mon avis de cotisation?'],
  }),
  typeScenario('documents-type-ei-statement', 6, ASKS_ABOUT(EI_STATEMENT), {
    en: ['Find form INS5210', 'Explain my EI decision letter', 'Find a government form'],
    fr: ['Où trouver le formulaire INS5210?', 'Explique-moi ma lettre de décision d’assurance-emploi', 'Où trouver un formulaire du gouvernement?'],
  }),
  typeScenario('documents-type-oas', 6, ASKS_ABOUT(OAS_LETTER), {
    en: ['Find form ISP3550', 'Find form ISP1000', 'What does this letter mean?'],
    fr: ['Où trouver le formulaire ISP3550?', 'Où trouver le formulaire ISP1000?', 'Que signifie la lettre que j’ai reçue?'],
  }),
  typeScenario('documents-type-ircc', 6, ASKS_ABOUT(IRCC_DOCS), {
    en: ['Explain my biometric instruction letter', 'Find form IMM 5476', 'What does this letter mean?'],
    fr: ['Explique-moi ma lettre d’instructions pour la biométrie', 'Où trouver le formulaire IMM 5476?', 'Que signifie la lettre que j’ai reçue?'],
  }),
  ...formsScenarios,
];

export default documents;
