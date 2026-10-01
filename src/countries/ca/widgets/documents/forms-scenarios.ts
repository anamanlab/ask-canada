/**
 * Scripted scenarios for the forms finder (EN + FR), part of scenarios/documents.ts. The answer names what the
 * form is for and its official title; the follow-ups stay with the department the form belongs to.
 * Facts: ./data (forms: ./forms-catalogue, URLs: ./urls).
 */
import type { Scenario } from '@/lib/scripted/types';
import type { Lang } from './data';
import { FORMS } from './forms-catalogue';
import { searchForms } from './forms-search';
import { URLS } from './urls';
import en from './messages/en.json';
import fr from './messages/fr.json';

type Ctx = { text: string; lang: Lang };
const M: Record<Lang, Record<string, string>> = { en, fr };
const m = (lang: Lang, key: string) => M[lang][key] ?? M.en[key] ?? '';
const U = (k: keyof typeof URLS, lang: Lang) => URLS[k][lang];

/** A form number in the question (T2201, T1-ADJ, RC66, IMM 5476, ISP1000, CIT 0002…). */
const CODE = /\b(T1-?ADJ|AUT-?01|TD1|(?:T|RC|INS|ISP|NAS)\s?-?\d{2,4}[A-Z]?|IMM\s?\d{4}|CIT\s?\d{4})\b/i;
function formQuery(text: string) {
  const code = text.match(CODE)?.[0];
  if (code) return code;
  const words = text
    .replace(/[?!.,]/g, ' ')
    // Letter-aware edges: `\b` never closes after an accented last letter ("où").
    .replace(
      /(?<![\p{L}\p{N}])(where|how|can|do|does|i|find|get|download|the|a|an|form|forms|which|what|need|to|for|my|is|government|official|please|où|comment|trouver|obtenir|télécharger|le|la|les|un|une|formulaire|formulaires|quel|quelle|dois|je|faut-il|pour|mon|ma|du|de|des|gouvernement|officiel|il|me|faut)(?![\p{L}\p{N}-])/giu,
      ' ',
    )
    .replace(/\s+/g, ' ')
    .trim();
  return words;
}

/** The forms answer: the verdict says what the form is for, the body gives its official title and where to get it. */
const formsAnswer: Pick<Scenario, 'vars' | 'reply' | 'toolCalls'> = {
  vars: ({ text, lang }) => {
    const q = formQuery(text);
    const found = searchForms(q, lang);
    const top = found.results[0];
    const fr = lang === 'fr';
    if (found.passport && !found.results.length) {
      return {
        head: fr ? '# Le formulaire de passeport dépend de *votre situation*.' : '# The right passport form depends on *your situation*.',
        body: fr
          ? `Adultes, enfants, renouvellements et remplacements : chaque cas a son propre formulaire. Répondez aux questions des pages sur les passeports pour obtenir le bon. [1](${U('passports', 'fr')})`
          : `Adults, children, renewals and replacements each use a different form. Answer the questions on the passport pages to get the right one. [1](${U('passports', 'en')})`,
      };
    }
    if (!top || found.popular) {
      return {
        head: fr ? '# Voici les *formulaires* les plus utilisés.' : '# Here are the most-used *government forms*.',
        body: fr
          ? `Cherchez par numéro ou décrivez ce que vous voulez faire. Chaque formulaire mène à sa page officielle, qui contient toujours la version à jour. [1](${U('craForms', 'fr')}) [2](${U('irccForms', 'fr')})`
          : `Search by number or describe what you need to do. Each form links to its official page, which always has the current version. [1](${U('craForms', 'en')}) [2](${U('irccForms', 'en')})`,
      };
    }
    const def = FORMS.find((f) => f.code === top.code)!;
    const short = m(lang, `forms.short.${top.slug}`);
    const official = m(lang, 'forms.official').replace('{name}', def.name[lang]);
    const online = top.online ? ` ${m(lang, `forms.online.${top.online.key}`)} [2](${top.online.href})` : '';
    const pdf = fr
      ? `Téléchargez les formulaires PDF sur votre ordinateur et ouvrez‑les dans Adobe Acrobat Reader plutôt que dans votre navigateur. [${top.online ? 3 : 2}](${U('craPdfHelp', 'fr')})`
      : `Download PDF forms to your computer and open them in Adobe Acrobat Reader, not your browser. [${top.online ? 3 : 2}](${U('craPdfHelp', 'en')})`;
    return {
      head: fr ? `# Le formulaire ${top.code} sert à *${short}*.` : `# Form ${top.code} is how you *${short}*.`,
      body: `${official} ${fr ? 'Prenez‑le sur sa page officielle, qui contient toujours la version à jour.' : 'Get it from its official page, which always has the current version.'} [1](${def.href[lang]})${online}\n\n${pdf}`,
    };
  },
  reply: { en: '{head}\n\n{body}', fr: '{head}\n\n{body}' },
  toolCalls: [{ toolName: 'documentsForms', input: ({ text, lang }: Ctx) => ({ query: formQuery(text), lang }) }],
};

export const formsScenarios: Scenario[] = [
  // A Service Canada or IRCC form: same answer, but the follow-ups stay with that department's letters
  // (a CRA scam check after an EI form would be the wrong department).
  {
    id: 'documents-forms-ei',
    priority: 6,
    match: [/\b(forms?|formulaire)\b.*\bINS\s?-?\d{3,4}\b/i, /\bINS\s?-?\d{3,4}\b.*\b(forms?|formulaire)\b/i],
    ...formsAnswer,
    followUps: {
      en: ['Explain my EI decision letter', 'Explain my EI benefit statement', 'What does this letter mean?'],
      fr: ['Explique-moi ma lettre de décision d’assurance-emploi', 'Explique-moi mon relevé des prestations d’assurance-emploi', 'Que signifie la lettre que j’ai reçue?'],
    },
  },
  {
    id: 'documents-forms-esdc',
    priority: 6,
    match: [/\b(forms?|formulaire)\b.*\b(ISP|NAS)\s?-?\d{3,4}\b/i, /\b(ISP|NAS)\s?-?\d{3,4}\b.*\b(forms?|formulaire)\b/i],
    ...formsAnswer,
    followUps: {
      en: ['Explain my Old Age Security enrolment letter', 'Explain my EI decision letter', 'Find a government form'],
      fr: ['Explique-moi ma lettre d’inscription à la Sécurité de la vieillesse', 'Explique-moi ma lettre de décision d’assurance-emploi', 'Où trouver un formulaire du gouvernement?'],
    },
  },
  {
    id: 'documents-forms-ircc',
    priority: 6,
    match: [/\b(forms?|formulaire)\b.*\b(IMM|CIT)\s?-?\d{4}\b/i, /\b(IMM|CIT)\s?-?\d{4}\b.*\b(forms?|formulaire)\b/i],
    ...formsAnswer,
    followUps: {
      en: ['Explain my biometric instruction letter', 'Explain my medical instructions letter', 'What does this letter mean?'],
      fr: ['Explique-moi ma lettre d’instructions pour la biométrie', 'Explique-moi ma lettre d’instructions pour l’examen médical', 'Que signifie la lettre que j’ai reçue?'],
    },
  },
  {
    id: 'documents-forms',
    priority: 6,
    match: [
      /\bforms?\b.*\b(T1-?ADJ|AUT-?01|(?:T|RC|INS|ISP|NAS)\s?-?\d{2,4}[A-Z]?|IMM\s?\d{4}|CIT\s?\d{4})\b/i,
      /\b(T1-?ADJ|AUT-?01|(?:T|RC|INS|ISP|NAS)\s?-?\d{2,4}[A-Z]?|IMM\s?\d{4}|CIT\s?\d{4})\b.*\bforms?\b/i,
      /\b(where|how)\b.*\b(find|get|download)\b.*\bforms?\b/i,
      /\bwhich form\b/i,
      /\bfind (a|the) (government |official )?form\b/i,
      /\b(trouver|obtenir|télécharger|quel)\b.*\bformulaire\b/i,
      /\bformulaire\b.*\b(T1-?ADJ|AUT-?01|(?:T|RC|INS|ISP|NAS)\s?-?\d{2,4}[A-Z]?|IMM\s?\d{4}|CIT\s?\d{4})\b/i,
    ],
    ...formsAnswer,
    followUps: {
      en: ['Which form do I need to change my tax return?', 'What does this letter mean?', 'Is this CRA letter real or a scam?'],
      fr: ['Quel formulaire pour modifier ma déclaration de revenus?', 'Que signifie la lettre que j’ai reçue?', 'Est-ce que cette lettre de l’ARC est vraie ou une arnaque?'],
    },
  },
  {
    // Same answer when the form is about identity theft: the follow-ups stay on that thread.
    id: 'documents-forms-identity-theft',
    priority: 7,
    match: [
      /\b(forms?|formulaire)\b.*\bRC\s?-?213\b/i,
      /\bRC\s?-?213\b.*\b(forms?|formulaire)\b/i,
      /\bforms?\b.*\b(identity theft|stolen identity)\b/i,
      /\b(identity theft|stolen identity)\b.*\bforms?\b/i,
      /\bformulaire\b.*\bvol d.identité\b/i,
    ],
    ...formsAnswer,
    followUps: {
      en: ['How do I report a scam to the CRA?', 'Is this CRA text real or a scam?', 'What does this letter mean?'],
      fr: ['Comment signaler une arnaque à l’ARC?', 'Est-ce que ce texto de l’ARC est vrai ou une arnaque?', 'Que signifie la lettre que j’ai reçue?'],
    },
  },
];
