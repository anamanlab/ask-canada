/** Lab fixtures for the `documents` widget: every state and the important edge cases. */
import type { Fixture, WidgetPart } from '@/lib/widgets/types';
import { explainDocument, type ExplainInput } from './explain';
import { findForms } from './forms';

const TODAY = '2026-09-30';
let n = 0;
/**
 * What the model read on the letter (summary, title, labels, actions) is written in the answer's language.
 * An English fixture with that text is an English answer, so it names `lang: 'en'` and stays English on the
 * French lab (the French twins below show the same letters in French). Fixtures without document text
 * follow the lab's interface language.
 */
const hasProse = (i: ExplainInput) => !!(i.summary || i.title || i.actions?.length || i.amounts?.some((a) => a.label) || i.dates?.some((d) => d.label));
const explain = (input: ExplainInput, state: WidgetPart['state'] = 'output-available', extra: Partial<WidgetPart> = {}): WidgetPart => {
  const inp: ExplainInput = !input.lang && hasProse(input) ? { ...input, lang: 'en' } : input;
  return {
    type: 'tool-documentsExplain',
    toolCallId: `fx-dx-${n++}`,
    state,
    input: inp,
    // Pinned: the lab shows these day counts as computed for TODAY, whatever the date is.
    output: state === 'output-available' ? { ...explainDocument(inp, TODAY), pinned: true } : undefined,
    ...extra,
  };
};
const forms = (query: string, lang: 'en' | 'fr' = 'en', state: WidgetPart['state'] = 'output-available', dept?: 'cra' | 'esdc' | 'ircc'): WidgetPart => ({
  type: 'tool-documentsForms',
  toolCallId: `fx-ff-${n++}`,
  state,
  // English fixtures leave `lang` out so they follow the lab's interface language (?lang=fr); a French
  // fixture names it, like a French question on the English interface.
  input: { query, ...(lang === 'fr' ? { lang } : {}), department: dept },
  output: state === 'output-available' ? findForms(query, lang, dept) : undefined,
});

const NOA_REFUND: ExplainInput = {
  docType: 'cra-noa',
  issuer: 'cra',
  title: 'Notice of assessment',
  taxYear: 2025,
  issuedOn: '2026-03-18',
  summary:
    'The CRA processed your 2025 return as filed and made no changes. Your notice also shows how much you can contribute to an RRSP next year.',
  amounts: [
    { label: 'Refund', amount: 1284.5, kind: 'refund' },
    { label: 'RRSP deduction limit for 2026', amount: 14320, kind: 'limit' },
  ],
};

const fixtures: Fixture[] = [
  { name: 'Streaming input (skeleton)', toolName: 'documentsExplain', part: explain({ docType: 'cra-noa' }, 'input-streaming') },
  { name: 'Input ready, running (skeleton)', toolName: 'documentsExplain', part: explain({ docType: 'cra-noa' }, 'input-available') },
  {
    name: 'Notice of assessment: refund (hero)',
    toolName: 'documentsExplain',
    part: explain(NOA_REFUND),
    note: 'What the model read on an attached NOA. The objection deadline is the later of 90 days after the notice or one year after the April 30 filing deadline.',
  },
  {
    name: 'Notice of assessment: balance owing, past due',
    toolName: 'documentsExplain',
    part: explain({
      docType: 'cra-noa',
      issuer: 'cra',
      taxYear: 2025,
      issuedOn: '2026-06-02',
      summary: 'The CRA assessed your 2025 return. You owe $412.37, including interest on the balance that was due April 30.',
      amounts: [{ label: 'Amount due', amount: 412.37, kind: 'owing' }],
      actions: ['Pay the balance or set up a payment arrangement'],
    }),
  },
  {
    name: 'CRA review letter: reply date falls on Thanksgiving',
    toolName: 'documentsExplain',
    part: explain({
      docType: 'cra-review',
      issuer: 'cra',
      title: 'Processing review',
      taxYear: 2025,
      issuedOn: '2026-09-11',
      summary: 'The CRA is reviewing the medical expenses you claimed on your 2025 return and asks for receipts.',
      dates: [{ label: 'Send your documents by', date: '2026-10-12', kind: 'deadline' }],
      actions: ['Send receipts for medical expenses claimed', 'Include a copy of the letter or the reference number'],
    }),
    note: 'October 12, 2026 is Thanksgiving: the card leads with the date the letter printed, and notes that the CRA treats October 13 as on time.',
  },
  {
    name: 'Canada child benefit notice: next payment',
    toolName: 'documentsExplain',
    part: explain({
      docType: 'cra-ccb-notice',
      issuer: 'cra',
      issuedOn: '2026-07-10',
      summary: 'Your CCB for July 2026 to June 2027 is based on your family’s 2025 income. You’ll get $512.08 a month.',
      amounts: [{ label: 'Monthly payment', amount: 512.08, kind: 'benefit' }],
    }),
  },
  {
    name: 'EI decision: 30 days to ask for a reconsideration',
    toolName: 'documentsExplain',
    part: explain({
      docType: 'esdc-ei-decision',
      issuer: 'esdc',
      issuedOn: '2026-09-21',
      summary: 'Service Canada decided you can’t get regular benefits from September 6, 2026, because it found you left your job voluntarily without just cause.',
    }),
    note: 'Check the step links at phone width: each official page sits under its step, indented to the step’s text; from a wide column it is a pill beside the row. Steps.tsx places the core Checklist’s `aside` slot with child selectors (LINK_BELOW), so a change to the Checklist markup shows up here first.',
  },
  {
    name: 'EI decision naming Form INS5210 (form numbers are not hidden)',
    toolName: 'documentsExplain',
    part: explain({
      docType: 'esdc-ei-decision',
      issuer: 'esdc',
      formCode: 'INS5210',
      issuedOn: '2026-09-21',
      summary: 'Service Canada refused your claim for regular benefits. If you disagree, fill out Form INS5210 within 30 days.',
      actions: ['Send Form INS5210 in person or by mail'],
    }),
    note: 'The redactor keeps form numbers (INS5210, ISP3550, IMM5476…): nothing is masked and the footnote does not claim that personal numbers were hidden.',
  },
  {
    name: 'CCB notice with a benefit year range (2026-2027 is not hidden)',
    toolName: 'documentsExplain',
    part: explain({
      docType: 'cra-ccb-notice',
      issuer: 'cra',
      issuedOn: '2026-07-10',
      summary: 'Your CCB for the 2026-2027 benefit year (July 2026-June 2027) is based on your family’s 2025 income.',
      amounts: [{ label: 'Monthly payment', amount: 512.08, kind: 'benefit' }],
    }),
  },
  {
    name: 'Biometric instruction letter',
    toolName: 'documentsExplain',
    part: explain({ docType: 'ircc-biometrics', issuer: 'ircc', issuedOn: '2026-09-24' }),
  },
  {
    name: 'No details yet: what a notice of assessment is',
    toolName: 'documentsExplain',
    part: explain({ docType: 'cra-noa' }),
    note: 'Asked about the document without attaching it: the verdict says what to look at first, and the letter beside it marks that area.',
  },
  {
    name: 'Scam: text message offering a refund by e-Transfer',
    toolName: 'documentsExplain',
    part: explain({
      docType: 'other',
      focus: 'verify',
      issuer: 'unknown',
      title: 'Text message claiming to be from the CRA',
      summary: 'A text says you have a $486.20 tax refund waiting and asks you to tap a link and enter your bank details to receive it by Interac e-Transfer within 24 hours.',
      warningSigns: ['text-message', 'etransfer', 'link-info'],
    }),
  },
  {
    name: 'Is it real? (interactive check, no signs yet)',
    toolName: 'documentsExplain',
    part: explain({ focus: 'verify', issuer: 'cra' }),
  },
  {
    name: 'Identify: which document do you have?',
    toolName: 'documentsExplain',
    part: explain({}),
    note: 'Shown when a file was attached but the answer comes from the scripted fallback, which can’t read files.',
  },
  {
    name: 'Other document (no guide): provincial letter, identifiers removed',
    toolName: 'documentsExplain',
    part: explain({
      docType: 'other',
      issuer: 'provincial',
      title: 'Vehicle registration renewal notice',
      summary: 'Your vehicle registration for plate ABC1234 and client number 88127734 expires on November 30, 2026. Renew online or at a service centre.',
      dates: [{ label: 'Registration expires', date: '2026-11-30', kind: 'deadline' }],
      amounts: [{ label: 'Renewal fee', amount: 120, kind: 'payment' }],
    }),
    note: 'No federal guide: the deadline leads, the fee is stated as money to pay (amber), and the handoff points to the official list of provincial and territorial governments. The client number was hidden before display.',
  },
  {
    name: 'Avis de cotisation : solde nul (français)',
    toolName: 'documentsExplain',
    part: explain({
      docType: 'cra-noa',
      issuer: 'cra',
      taxYear: 2025,
      issuedOn: '2026-04-09',
      summary: 'L’ARC a traité votre déclaration de 2025 sans modification. Votre solde est nul : vous ne devez rien et il n’y a pas de remboursement.',
      amounts: [{ label: 'Solde', amount: 0, kind: 'owing' }],
      lang: 'fr',
    }),
    note: 'A French question on any interface: the whole card (copy, dates, links) follows the answer’s language.',
  },
  {
    name: 'Avis de cotisation : solde à payer, échéance passée (français)',
    toolName: 'documentsExplain',
    part: explain({
      docType: 'cra-noa',
      issuer: 'cra',
      taxYear: 2025,
      issuedOn: '2026-06-02',
      summary: 'L’ARC a établi la cotisation de votre déclaration de 2025. Vous devez 412,37 $, y compris les intérêts sur le solde qui était dû le 30 avril.',
      amounts: [{ label: 'Montant dû', amount: 412.37, kind: 'owing' }],
      actions: ['Payer le solde ou conclure une entente de paiement'],
      lang: 'fr',
    }),
  },
  {
    name: 'Décision d’assurance-emploi : 30 jours pour demander une révision (français)',
    toolName: 'documentsExplain',
    part: explain({
      docType: 'esdc-ei-decision',
      issuer: 'esdc',
      issuedOn: '2026-09-21',
      summary: 'Service Canada a décidé que vous ne pouvez pas recevoir de prestations régulières à partir du 6 septembre 2026, parce que vous avez quitté votre emploi volontairement sans justification.',
      lang: 'fr',
    }),
  },
  {
    name: 'Lettre d’examen de l’ARC : l’échéance tombe à l’Action de grâces (français)',
    toolName: 'documentsExplain',
    part: explain({
      docType: 'cra-review',
      issuer: 'cra',
      title: 'Examen de traitement',
      taxYear: 2025,
      issuedOn: '2026-09-11',
      summary: 'L’ARC examine les frais médicaux que vous avez demandés dans votre déclaration de 2025 et vous demande des reçus.',
      dates: [{ label: 'Envoyez vos documents au plus tard le', date: '2026-10-12', kind: 'deadline' }],
      actions: ['Envoyer les reçus des frais médicaux demandés', 'Joindre une copie de la lettre ou le numéro de référence'],
      lang: 'fr',
    }),
  },
  {
    name: 'Avis de l’allocation canadienne pour enfants : prochain versement (français)',
    toolName: 'documentsExplain',
    part: explain({
      docType: 'cra-ccb-notice',
      issuer: 'cra',
      issuedOn: '2026-07-10',
      summary: 'Votre ACE pour l’année de prestations 2026-2027 est fondée sur le revenu de votre famille en 2025. Vous recevrez 512,08 $ par mois.',
      amounts: [{ label: 'Versement mensuel', amount: 512.08, kind: 'benefit' }],
      lang: 'fr',
    }),
  },
  {
    name: 'Lettre de décision d’assurance-emploi, sans détails (français)',
    toolName: 'documentsExplain',
    part: explain({ docType: 'esdc-ei-decision', issuer: 'esdc', lang: 'fr' }),
    note: 'Named only (as in the chat answer): the verdict adds what the answer doesn’t say, when the 30 days start.',
  },
  { name: 'Error', toolName: 'documentsExplain', part: explain({ docType: 'cra-noa' }, 'output-error', { errorText: 'Upstream timeout' }) },

  { name: 'Forms: running (skeleton)', toolName: 'documentsForms', part: forms('T2201', 'en', 'input-available') },
  { name: 'Forms: by number (T2201)', toolName: 'documentsForms', part: forms('T2201') },
  { name: 'Forms: by need (change my tax return)', toolName: 'documentsForms', part: forms('change my tax return') },
  { name: 'Forms: many results (pension)', toolName: 'documentsForms', part: forms('pension') },
  { name: 'Forms: passport (points to the passport pages)', toolName: 'documentsForms', part: forms('passport renewal form') },
  { name: 'Formulaires : allocation pour enfants (français)', toolName: 'documentsForms', part: forms('allocation canadienne pour enfants', 'fr') },
  { name: 'Formulaires : plusieurs résultats (pension, français)', toolName: 'documentsForms', part: forms('pension', 'fr') },
  {
    name: 'Forms: no match, provincial (fishing licence)',
    toolName: 'documentsForms',
    part: forms('fishing licence'),
    note: 'One block: the province or territory notice, with the directory link and "Ask about this instead".',
  },
  { name: 'Forms: by life event (divorce → RC65)', toolName: 'documentsForms', part: forms('divorce') },
  {
    name: 'Forms: no match, another federal department (pleasure craft operator card)',
    toolName: 'documentsForms',
    part: forms('pleasure craft operator card'),
    note: 'A federal need outside the CRA, Service Canada and IRCC catalogue: points to the official list of departments and agencies.',
  },
  {
    name: 'Forms: error',
    toolName: 'documentsForms',
    part: { type: 'tool-documentsForms', toolCallId: 'fx-ff-err', state: 'output-error', input: { query: 'T2201' }, errorText: 'Upstream timeout' },
  },
];

export default fixtures;
