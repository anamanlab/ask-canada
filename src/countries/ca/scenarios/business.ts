/**
 * Scripted scenarios for the `business` widget (EN + FR): what matches, which tool runs with which input, and
 * the follow-up chips. The answer copy lives in widgets/business/scenario/*, the text parsers in
 * widgets/business/parse.ts, the facts and URLs in widgets/business/data.ts.
 */
import type { Scenario } from '@/lib/scripted/types';
import { CHECKED } from '../widgets/business/data';
import { fetchFxRates } from '../widgets/business/live';
import { amountIn, currencyIn, dutyRateIn, isRideshare, needIn, originIn, partnersIn, prioritiesIn, provinceIn, provincesIn, wantsExpress, withoutRates } from '../widgets/business/parse';
import type { Lang } from '../widgets/business/scenario/cite';
import { incorporateReply, incorporateVars, structureReply } from '../widgets/business/scenario/company';
import { fundingReply, fundingVars } from '../widgets/business/scenario/funding';
import { registrationReply, registrationVars } from '../widgets/business/scenario/registration';
import { exportReply, importNeedsFx, importReply, importVars } from '../widgets/business/scenario/trade';

const business: Scenario[] = [
  {
    id: 'business-gst-register',
    priority: 5,
    checked: CHECKED,
    match: [
      /\b(register|registration|sign up)\b.*\b(gst|hst)\b/i,
      /\b(gst|hst)\b.*\b(regist\w*|number|account|charge|charging|collect\w*)\b/i,
      /\b(charge|charging|collect)\b.*\b(gst|hst|sales tax)\b/i,
      /\bsmall supplier\b/i,
      /\b(need|get|have)\b.*\bbusiness number\b/i,
      /\bbusiness number\b.*\b(need|get|how|what)\b/i,
      /\binscri\w*\b.*\b(tps|tvh)\b/i,
      /\b(tps|tvh)\b.*\b(inscri\w*|numéro|compte|factur\w*|percevoir|exiger)\b/i,
      /\b(factur\w*|charger|percevoir|exiger)\b.*\b(tps|tvh)\b/i,
      /\bpetit fournisseur\b/i,
      /\bnuméro d[’']entreprise\b/i,
    ],
    exclude: [/\b(credits?|crédits?|benefits?|allocations?|payments?|paiements?|versements?|cgeb|acebe|groceries|épicerie|rebates?|remboursements?)\b/i],
    reply: registrationReply,
    vars: registrationVars,
    toolCalls: [
      {
        toolName: 'businessRegistration',
        input: ({ text, lang, timeZone }: { text: string; lang: Lang; timeZone?: string }) => {
          const amount = amountIn(text);
          return {
            annualSales: amount != null && amount >= 1000 ? amount : undefined,
            rideshare: isRideshare(text) || undefined,
            employees: /\b(employees?|staff|hire|hiring|employés?|embauch\w*)\b/i.test(text) || undefined,
            incorporated: /\b(corporation|incorporated|inc\.|société par actions|constituée?)\b/i.test(text) || undefined,
            province: provinceIn(text),
            lang,
            timeZone,
          };
        },
      },
    ],
    followUps: {
      en: ['Should I incorporate or stay a sole proprietor?', 'How do I incorporate federally?', 'Are there grants to start a business?'],
      fr: ['Devrais-je m’incorporer ou rester une entreprise individuelle?', 'Comment constituer une société au fédéral?', 'Y a-t-il des subventions pour démarrer une entreprise?'],
    },
  },

  {
    id: 'business-structure',
    priority: 5,
    checked: CHECKED,
    match: [
      /\bshould i (incorporate|register as a corporation|be a corporation)\b/i,
      /\b(sole propriet\w*|partnership)\b.*\b(or|vs\.?|versus|corporation|incorporat\w*)\b/i,
      /\b(incorporat\w*|corporation)\b.*\b(or|vs\.?|versus)\b.*\b(sole propriet\w*|partnership)\b/i,
      /\b(business|company|legal) structure\b/i,
      /\b(incorporate|incorporating)\b.*\b(worth it|or not|benefits?|advantages?|pros|why)\b/i,
      /\bwhat is a (sole proprietorship|partnership)\b/i,
      /\b(devrais-je|dois-je|faut-il) (m[’']incorporer|me constituer|m[’']enregistrer en société)\b/i,
      /\bstructure (d[’']entreprise|juridique)\b/i,
      /\b(entreprise individuelle|société de personnes)\b.*\b(ou|vs|versus|société par actions|incorpor\w*)\b/i,
      /\b(avantages?|pourquoi)\b.*\b(m[’']incorporer|s[’']incorporer|incorporer|constitution en société)\b/i,
    ],
    exclude: [/\b(tax(es)? return|file my taxes|filing taxes|déclaration de revenus|produire ma déclaration)\b/i],
    reply: structureReply,
    toolCalls: [
      {
        toolName: 'businessStructure',
        input: ({ text, lang }: { text: string; lang: Lang }) => ({
          owners: partnersIn(text) ? 'partners' : 'solo',
          priorities: prioritiesIn(text),
          province: provinceIn(text),
          lang,
        }),
      },
    ],
    // The widget's own button asks "Do I need to register for GST/HST?", so the chips don't repeat it.
    followUps: {
      en: ['How do I incorporate federally?', 'Are there grants to start a business?', 'How do I import goods for my business?'],
      fr: ['Comment constituer une société au fédéral?', 'Y a-t-il des subventions pour démarrer une entreprise?', 'Comment importer des marchandises pour mon entreprise?'],
    },
  },

  {
    id: 'business-incorporate',
    priority: 6,
    checked: CHECKED,
    match: [
      /\bhow (do i|to|can i|would i)\b.*\bincorporat\w*/i,
      /\bfederal(ly)? incorporat\w*/i,
      /\bincorporat\w*\b.*\b(federal(ly)?|cost|fees?|price|how much|steps?|online|numbered)\b/i,
      /\bnumbered (company|corporation)\b/i,
      /\bcorporations canada\b/i,
      /\bcomment\b.*\b(incorporer|m[’']incorporer|constituer|me constituer)\b/i,
      /\b(constitu\w*|incorpor\w*)\b.*\b(au fédéral|fédérale?|coût|coûte|frais|combien|étapes?|en ligne)\b/i,
      /\bsociété (à numéro|numérotée)\b/i,
    ],
    reply: incorporateReply,
    vars: incorporateVars,
    toolCalls: [
      {
        toolName: 'businessIncorporate',
        input: ({ text, lang }: { text: string; lang: Lang }) => ({
          nameType: /\b(own name|word name|my name|brand|nom de mon choix|mon propre nom)\b/i.test(text) ? 'word' : 'numbered',
          express: wantsExpress(text) || undefined,
          provinces: provincesIn(text),
          lang,
        }),
      },
    ],
    // The widget's own button asks "Do I need to register my corporation for GST/HST?", so the chips don't repeat it.
    followUps: {
      en: ['Should I incorporate or stay a sole proprietor?', 'Can I get funding to grow my business?', 'How do I import goods for my business?'],
      fr: ['Devrais-je m’incorporer ou rester une entreprise individuelle?', 'Puis-je obtenir du financement pour faire croître mon entreprise?', 'Comment importer des marchandises pour mon entreprise?'],
    },
  },

  {
    id: 'business-funding',
    priority: 5,
    checked: CHECKED,
    match: [
      /\b(grants?|funding|subsid\w*)\b.*\b(business|start\w*|restaurant|shop|store|company|entrepreneur\w*|small|export\w*|grow\w*|tariffs?|farm)\b/i,
      /\b(business|small business|start-?up|restaurant|company)\b.*\b(grants?|loans?|funding|financing)\b/i,
      /\bfunding to (start|grow|export|expand)\b/i,
      /\bbusiness benefits finder\b/i,
      /\b(business|company|companies|employer)\b.*\b(tariffs?)\b.*\b(help|support|relief|funding)\b/i,
      /\b(help|support|relief)\b.*\b(business\w*|compan\w*)\b.*\b(tariffs?)\b/i,
      /\b(entreprise|pme)\b.*\b(tarifs?|droits de douane)\b.*\b(aide|soutien)\b/i,
      /\b(subventions?|financement|prêts?|aide financière)\b.*\b(entreprise|démarr\w*|restaurant|commerce|pme|export\w*|croissance|croître|tarifs?)\b/i,
      /\b(entreprise|pme|commerce)\b.*\b(subventions?|financement|prêts?)\b/i,
    ],
    exclude: [/\b(student|students|étudiants?|études|housing|logement|home buyer|mortgage|hypothèque)\b/i],
    reply: fundingReply,
    vars: fundingVars,
    toolCalls: [
      {
        toolName: 'businessFunding',
        input: ({ text, lang }: { text: string; lang: Lang }) => ({ province: provinceIn(text), need: needIn(text), lang }),
      },
    ],
    followUps: {
      en: ['Should I incorporate or stay a sole proprietor?', 'Do I need to register for GST/HST?', 'How do I import goods into Canada?'],
      fr: ['Devrais-je m’incorporer ou rester une entreprise individuelle?', 'Dois-je m’inscrire à la TPS/TVH?', 'Comment importer des marchandises au Canada?'],
    },
  },

  {
    id: 'business-import',
    // Above the income-tax estimate (6): « Combien de droits de douane vais-je payer… » is about customs, not income tax.
    priority: 7,
    checked: CHECKED,
    match: [
      /\bimport(s|ing|ed|er|ers)?\b.*\b(goods|products|inventory|merchandise|stock|for (my|a|the) business|commercial\w*|into canada|from (china|the us|the u\.s\.|mexico|europe|japan|india|korea))\b/i,
      /\b(customs|import) dut(y|ies)\b/i,
      /\bduty\b.*\b(on|for)\b.*\b(goods|products|imports?)\b/i,
      /\bCARM\b/,
      /\bcustoms broker\b/i,
      /\bimport(er|ation|ations|ateur|ateurs)\b.*\b(marchandises|produits|stock|inventaire|entreprise|commercial\w*|au canada|de chine|des états-unis)\b/i,
      /\bdroits de douane\b.*\b(marchandises|produits|importation|payer|calcul\w*)\b/i,
      /\bGCRA\b/,
      /\bcourtier en douane\b/i,
    ],
    exclude: [/\b(personal exemption|bring(ing)? back|souvenirs?|vacation|trip|duty-?free|exemption personnelle|voyage|en revenant|online shopping|ordered online|commandé en ligne|car|vehicle|véhicule|voiture|dog|cat|pet|chien|chat)\b/i],
    reply: importReply,
    // A foreign invoice with a duty rate gets its total in the heading, at the same Bank of Canada rate the tool uses.
    vars: async ({ text }: { text: string }) => importVars({ text }, importNeedsFx(text) ? await fetchFxRates() : null),
    toolCalls: [
      {
        toolName: 'businessTrade',
        // Only what the person said: no amount or currency means the estimate opens empty and asks for them.
        // The origin comes from place words, never from the currency (a U.S.-dollar invoice can be for goods from China).
        input: ({ text, lang }: { text: string; lang: Lang }) => ({
          direction: 'import',
          amount: amountIn(withoutRates(text)),
          currency: currencyIn(text),
          origin: ((o) => (o == null ? undefined : o === 'us' ? 'us' : 'other'))(originIn(text)),
          dutyRate: dutyRateIn(text),
          lang,
        }),
      },
    ],
    followUps: {
      en: ['Do I need an export declaration?', 'Do I need to register for GST/HST?', 'Can I get funding to export?'],
      fr: ['Ai-je besoin d’une déclaration d’exportation?', 'Dois-je m’inscrire à la TPS/TVH?', 'Puis-je obtenir du financement pour exporter?'],
    },
  },

  {
    id: 'business-export',
    priority: 5,
    checked: CHECKED,
    match: [
      /\bexport declaration\b/i,
      /\bexport(s|ing|ed|er|ers)?\b.*\b(declaration|goods|products|permit|from canada|to the (us|u\.s\.|united states|states)|abroad|overseas|shipment)\b/i,
      /\bCERS\b/,
      /\bdéclaration d[’']exportation\b/i,
      /\bexport(er|ation|ations|ateur|ateurs)\b.*\b(déclaration|marchandises|produits|permis|à l[’']étranger|aux états-unis|envoi)\b/i,
    ],
    exclude: [/\b(funding|grants?|loans?|financement|subventions?|prêts?)\b/i],
    reply: exportReply,
    toolCalls: [
      {
        toolName: 'businessTrade',
        input: ({ text, lang }: { text: string; lang: Lang }) => ({
          direction: 'export',
          destination: /\b(to the (us|u\.s\.|united states|states)|aux états-unis|vers les états-unis|american)\b/i.test(text) ? 'us' : 'other',
          restricted: /\b(controlled|regulated|prohibited|military|firearms?|contrôlées?|réglementées?|interdites?)\b/i.test(text) || undefined,
          value: amountIn(text),
          lang,
        }),
      },
    ],
    followUps: {
      en: ['How do I import goods into Canada?', 'Can I get funding to export?', 'Do I need to register for GST/HST?'],
      fr: ['Comment importer des marchandises au Canada?', 'Puis-je obtenir du financement pour exporter?', 'Dois-je m’inscrire à la TPS/TVH?'],
    },
  },
];

export default business;
