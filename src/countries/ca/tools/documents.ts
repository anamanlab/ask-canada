/**
 * AI tools for the `documents` widget (document understanding + forms finder).
 *   documentsExplain — turns what the model read on a government letter, notice or form into a verified
 *                      explainer: what it is, key amounts, deadlines (CRA holiday rule), next steps, scam check.
 *   documentsForms   — finds the official page for a government form by number or plain words.
 * Facts: widgets/documents/data.ts (URLs: urls.ts, sources: sources.ts, catalogues: docs.ts, forms-catalogue.ts).
 * Everything is computed from verified tables: no upstream API is called. Prose for the model: widgets/documents/messages/*.json.
 */
import { tool, type ToolSet } from 'ai';
import { z } from 'zod';
import { todayInCanada } from '../data/holidays';
import { formatMessage } from '@/lib/i18n/format';
import { DOC_IDS, SIGNALS, type Lang } from '../widgets/documents/data';
import { explainDocument, type ExplainOutput } from '../widgets/documents/explain';
import { findForms } from '../widgets/documents/forms';
import en from '../widgets/documents/messages/en.json';
import fr from '../widgets/documents/messages/fr.json';

const iso = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const CAT: Record<Lang, Record<string, string>> = { en, fr };
const msg = (lang: Lang, key: string, values?: Record<string, string | number>) => {
  const tpl = CAT[lang][key] ?? CAT.en[key];
  return tpl ? formatMessage(tpl, values, lang === 'fr' ? 'fr-CA' : 'en-CA') : undefined;
};

/** Plain-language guidance for the model, in the answer's language (the widget renders its own copy). */
function guidance(out: ExplainOutput) {
  const { lang, docType } = out;
  if (!docType || docType === 'other') return { documentName: null, whatItIs: null, nextSteps: [] as string[] };
  return {
    documentName: msg(lang, `doc.${docType}.name`) ?? null,
    whatItIs: msg(lang, `doc.${docType}.what`) ?? null,
    nextSteps: out.steps.map((s) =>
      [msg(lang, `doc.${docType}.step.${s.id}.title`), [msg(lang, `doc.${docType}.step.${s.id}.detail`, { phone: s.phone ?? '' }), msg(lang, `doc.${docType}.step.${s.id}.note`)].filter(Boolean).join(' ')]
        .filter(Boolean)
        .join(' — '),
    ),
  };
}

export const tools = {
  documentsExplain: tool({
    description:
      'Explain a Government of Canada letter, notice or form the person received, as an explainer card: what it is, the key amounts, every deadline (with the CRA weekend/holiday rule), what to do next, the official links, and a scam check. ALWAYS call it when the person attaches a photo or PDF of a government document (CRA, Service Canada, IRCC), or describes one ("I got a notice of assessment", "what does this CRA letter mean", "EI decision letter", "biometric instruction letter"), or asks whether a letter, text, email or call is really from the government (set focus "verify"). Read the attachment yourself first, then pass: the closest docType ("other" if none fits; omit it only when you know nothing about the document, which shows a picker of common letters), the issuer, the title and form code as printed, the tax year, the date issued, a 1–3 sentence plain-language summary of what THIS document says, the amounts and dates exactly as printed (kind "owing" for Amount due/Balance due, "refund" for Refund, "benefit" for benefit amounts you receive, "payment" for a fee or payment the person must make; kind "deadline" for any reply-by/pay-by date, with the label as printed, e.g. "Send your documents by"), the actions it asks for, and any scam warning signs you saw. Never pass personal identifiers: no SIN, names, addresses, account, reference, client, UCI or access-code numbers, phone numbers or banking details. The card computes deadlines itself: do not invent dates that are not printed.',
    inputSchema: z.object({
      docType: z
        .enum([...DOC_IDS, 'other'])
        .optional()
        .describe(
          'cra-noa = CRA notice of assessment (NOA); cra-nor = notice of reassessment; cra-review = CRA review letter asking for receipts/documents; cra-ccb-notice = Canada child benefit notice; cra-cgeb-notice = Canada Groceries and Essentials Benefit notice (formerly GST/HST credit); esdc-ei-decision = Service Canada EI decision letter; esdc-ei-statement = EI benefit statement with the 4-digit access code; esdc-oas-enrolment = Old Age Security enrolment letter; ircc-biometrics = IRCC biometric instruction letter (BIL); ircc-medical = IRCC medical exam instructions; other = any other government document.',
        ),
      focus: z.enum(['explain', 'verify']).optional().describe('"verify" when the main question is whether the message is real or a scam.'),
      issuer: z.enum(['cra', 'esdc', 'ircc', 'other-federal', 'provincial', 'unknown']).optional().describe('Who sent it (esdc = Service Canada / ESDC).'),
      title: z.string().max(140).optional().describe('The document title as printed, e.g. "Notice of assessment". No names or numbers.'),
      formCode: z.string().max(24).optional().describe('Form or letter code if printed (e.g. "T451", "IMM 5476").'),
      taxYear: z.number().int().min(1990).max(2100).optional(),
      issuedOn: iso.optional().describe('Date the document was issued, YYYY-MM-DD.'),
      summary: z.string().max(600).optional().describe('1–3 short sentences, grade-8 plain language, on what this document says beyond the amounts and dates (those go in amounts/dates; don’t repeat them here). No personal identifiers.'),
      amounts: z
        .array(z.object({ label: z.string().max(80), amount: z.number(), kind: z.enum(['refund', 'owing', 'payment', 'benefit', 'credit', 'limit', 'info']) }))
        .max(8)
        .optional()
        .describe('Money amounts as printed (positive numbers), e.g. {label:"Refund", amount:1284.5, kind:"refund"}; a fee to pay: {label:"Renewal fee", amount:120, kind:"payment"}.'),
      dates: z
        .array(z.object({ label: z.string().max(80), date: iso, kind: z.enum(['deadline', 'payment', 'appointment', 'issued', 'effective', 'info']) }))
        .max(6)
        .optional()
        .describe('Dates printed on the document.'),
      actions: z.array(z.string().max(160)).max(5).optional().describe('What the document asks the person to do, in plain words.'),
      warningSigns: z
        .array(z.enum(SIGNALS))
        .max(8)
        .optional()
        .describe(
          'Scam signs you saw: gift-cards, crypto, etransfer (payment or refund by Interac e-Transfer), threats (arrest, deportation, aggressive language), text-message (text/WhatsApp/Messenger from "the CRA"), link-info (link asking for personal or banking info), fake-website (address not canada.ca / cra-arc.gc.ca), public-meeting (meet in person to pay).',
        ),
      lang: z.enum(['en', 'fr']).optional().describe('Language of the answer.'),
      timeZone: z.string().max(64).optional().describe("The person's IANA time zone, so day counts match their date."),
    }),
    execute: async ({ timeZone, ...input }) => {
      const out = explainDocument(input, todayInCanada(new Date(), timeZone));
      return { ...out, guidance: guidance(out) };
    },
  }),

  documentsForms: tool({
    description:
      'Forms finder: returns the official page for Government of Canada forms by number or by need, with what each form is for and the faster online option when one exists (e.g. T2201 disability tax credit, RC66 child benefit, T1-ADJ change a return, T400A objection, RC65 marital status change (married, separated, divorced), AUT-01 representative, INS5210 EI reconsideration, ISP1000 CPP, ISP3550 OAS, NAS2120 SIN, IMM 5476, IMM 5444 PR card, CIT 0002 citizenship, IMM 5257 visitor visa). Call it for "where do I find form …", "which form do I need to …", "formulaire …". For passports it points to the passport pages (several forms exist). Links go to the form page, never a direct PDF.',
    inputSchema: z.object({
      query: z.string().max(120).optional().describe('Form number (e.g. "T2201", "IMM 5476") or a few words about the need (e.g. "change my tax return"). Omit to show the most-used forms.'),
      department: z.enum(['cra', 'esdc', 'ircc']).optional().describe('Limit to one department when the person named it.'),
      lang: z.enum(['en', 'fr']).optional(),
    }),
    execute: async ({ query, department, lang }) => findForms(query ?? '', lang === 'fr' ? 'fr' : 'en', department),
  }),
} satisfies ToolSet;
