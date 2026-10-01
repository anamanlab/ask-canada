/**
 * Forms catalogue: the verified form pages the forms finder searches (EN + FR titles as published). Loaded by
 * the tool, and by the card only once someone types a new search. Verification notes: ./data.
 */
import { bi, type Bi, type Dept } from './data';
import { CRA, IRCC, type UrlKey } from './urls';

export type FormDef = {
  /** Form number as printed (search key). */
  code: string;
  dept: Dept;
  /** Official title as published on the form page. */
  name: Bi;
  /** Form page (never the direct PDF: pages carry the current version and instructions). */
  href: Bi;
  /** Better option than the paper form, when one exists (prose: `form.<slug>.online`). */
  online?: UrlKey;
  /** Extra words people use (EN + FR), lowercase. */
  keywords: string;
  updated?: string;
};

const craForm = (slug: string) => bi(`${CRA.en}/services/forms-publications/forms/${slug}.html`, `${CRA.fr}/services/formulaires-publications/formulaires/${slug}.html`);
const scForm = (code: string) =>
  bi(`https://catalogue.servicecanada.gc.ca/content/EForms/en/Detail.html?Form=${code}`, `https://catalogue.servicecanada.gc.ca/content/EForms/fr/Detail.html?Form=${code}`);
const irccForm = (slug: string) =>
  bi(`${IRCC.en}/services/application/application-forms-guides/${slug}.html`, `${IRCC.fr}/services/demande/formulaires-demande-guides/${slug}.html`);

export const FORMS: FormDef[] = [
  {
    code: 'RC66',
    dept: 'cra',
    name: bi('Canada Child Benefits Application', 'Demande de l’allocation canadienne pour enfants'),
    href: craForm('rc66'),
    online: 'ccbApply',
    keywords: 'ccb child benefit children baby newborn kids apply allocation canadienne pour enfants ace enfant bébé naissance',
    updated: '2026-08-25',
  },
  {
    code: 'RC151',
    dept: 'cra',
    name: bi(
      'Canada Groceries and Essentials Benefit Application for Individuals Who Become Residents of Canada',
      'Demande de l’Allocation canadienne pour l’épicerie et les besoins essentiels pour les particuliers qui deviennent résidents du Canada',
    ),
    href: craForm('rc151'),
    keywords: 'cgeb gst hst credit newcomer new resident immigrant groceries essentials acebe tps tvh nouvel arrivant nouveau résident épicerie',
    updated: '2026-08-06',
  },
  {
    code: 'T2201',
    dept: 'cra',
    name: bi('Disability Tax Credit Certificate', 'Certificat pour le crédit d’impôt pour personnes handicapées'),
    href: craForm('t2201'),
    online: 'dtcApply',
    keywords: 'dtc disability tax credit handicap impairment cipph crédit personnes handicapées invalidité',
    updated: '2024-02-12',
  },
  {
    code: 'RC65',
    dept: 'cra',
    name: bi('Marital Status Change', 'Changement d’état civil'),
    href: craForm('rc65'),
    online: 'maritalStatus',
    keywords:
      'marital status married marriage divorce divorced separated separation widowed widow common-law spouse partner état civil marié mariage divorcé séparé séparation veuf veuve conjoint de fait époux',
    updated: '2026-07-02',
  },
  {
    code: 'T1-ADJ',
    dept: 'cra',
    name: bi('T1 Adjustment Request', 'Demande de redressement d’une T1'),
    href: craForm('t1-adj'),
    online: 'changeReturn',
    keywords: 't1adj adjust change fix correct mistake amend return redressement modifier corriger erreur déclaration',
    updated: '2026-09-09',
  },
  {
    code: 'T400A',
    dept: 'cra',
    name: bi('Notice of Objection – Income Tax Act', 'Avis d’opposition – Loi de l’impôt sur le revenu'),
    href: craForm('t400a'),
    online: 'objection',
    keywords: 'objection object disagree dispute assessment appeal opposition contester désaccord cotisation',
    updated: '2026-04-02',
  },
  {
    code: 'AUT-01',
    dept: 'cra',
    name: bi('Authorize a Representative for Offline Access', 'Autoriser l’accès hors ligne d’un représentant'),
    href: craForm('aut-01'),
    keywords: 'aut01 representative authorize accountant family member someone else represent représentant autoriser comptable',
    updated: '2025-11-28',
  },
  {
    code: 'RC4288',
    dept: 'cra',
    name: bi('Taxpayer Relief Request – Cancel or Waive Penalties and Interest', 'Demande d’allègement pour les contribuables – Annuler des pénalités et des intérêts ou y renoncer'),
    href: craForm('rc4288'),
    keywords: 'relief penalty penalties interest waive cancel hardship allègement pénalités intérêts annuler',
    updated: '2025-05-19',
  },
  {
    code: 'T1213',
    dept: 'cra',
    name: bi('Request to Reduce Tax Deductions at Source', 'Demande de réduction des retenues d’impôt à la source'),
    href: craForm('t1213'),
    keywords: 'reduce tax deductions at source payroll rrsp support payments réduction retenues à la source paie',
    updated: '2026-09-03',
  },
  {
    code: 'T777',
    dept: 'cra',
    name: bi('Statement of Employment Expenses', 'État des dépenses d’emploi'),
    href: craForm('t777'),
    keywords: 'employment expenses work from home employee dépenses d’emploi travail à domicile employé',
    updated: '2026-02-26',
  },
  {
    code: 'T2125',
    dept: 'cra',
    name: bi('Statement of Business or Professional Activities', 'État des résultats des activités d’une entreprise ou d’une profession libérale'),
    href: craForm('t2125'),
    keywords: 'self-employed business income freelance sole proprietor gig travailleur autonome entreprise revenu profession libérale',
    updated: '2026-05-01',
  },
  {
    code: 'RC213',
    dept: 'cra',
    name: bi(
      'Identity theft and suspicious activity declaration form for individual, business and trust',
      'Formulaire de déclaration de vol d’identité et d’activité suspecte pour les particuliers, les entreprises et les fiducies',
    ),
    href: craForm('rc213'),
    online: 'reportScam',
    keywords: 'identity theft scam fraud suspicious hacked vol d’identité arnaque fraude suspect',
    updated: '2024-08-09',
  },
  {
    code: 'INS5210',
    dept: 'esdc',
    name: bi('Request for Reconsideration of an Employment Insurance (EI) decision', 'Demande de révision d’une décision d’assurance-emploi'),
    href: scForm('INS5210'),
    keywords: 'ei employment insurance reconsideration disagree decision denied appeal assurance-emploi ae révision décision refus',
  },
  {
    code: 'ISP1000',
    dept: 'esdc',
    name: bi('Application for a Canada Pension Plan Retirement Pension', 'Demande de pension de retraite du Régime de pensions du Canada'),
    href: scForm('ISP1000'),
    online: 'cppApply',
    keywords: 'isp-1000 cpp canada pension plan retirement pension rpc régime de pensions retraite',
  },
  {
    code: 'ISP3550',
    dept: 'esdc',
    name: bi('Application for the Old Age Security Pension and the Guaranteed Income Supplement', 'Demande de pension de la Sécurité de la vieillesse et de Supplément de revenu garanti'),
    href: scForm('ISP3550'),
    online: 'oasApply',
    keywords: 'isp-3550 oas old age security gis guaranteed income supplement sv sécurité de la vieillesse srg supplément',
  },
  {
    code: 'ISP1151',
    dept: 'esdc',
    name: bi('Application kit for Canada Pension Plan Disability benefits', 'Trousse de demande de prestations d’invalidité du Régime de pensions du Canada'),
    href: scForm('ISP1151'),
    online: 'cppdApply',
    keywords: 'isp-1151 cpp disability cpp-d invalidité rpc',
  },
  {
    code: 'ISP1300',
    dept: 'esdc',
    name: bi('Application for CPP Survivor’s Pension and Surviving Child’s Benefits', 'Demande de pension de survivant et de prestation d’enfant survivant du RPC'),
    href: scForm('ISP1300'),
    keywords: 'isp-1300 survivor death spouse died widow survivant décès conjoint veuve',
  },
  {
    code: 'NAS2120',
    dept: 'esdc',
    name: bi('Application for a Social Insurance Number', 'Demande de numéro d’assurance sociale'),
    href: scForm('NAS2120'),
    online: 'sinApply',
    keywords: 'sin social insurance number nas numéro d’assurance sociale',
  },
  {
    code: 'IMM 5476',
    dept: 'ircc',
    name: bi('Use of a Representative Form', 'Recours aux services d’un représentant'),
    href: irccForm('imm5476'),
    keywords: 'imm5476 representative consultant lawyer immigration représentant consultant avocat',
    updated: '2025-12-12',
  },
  {
    code: 'IMM 5444',
    dept: 'ircc',
    name: bi(
      'Application for a Permanent Resident Card (PR card) or Permanent Resident Travel Document (PRTD)',
      'Demande d’une carte de résident permanent (carte RP) ou un titre de voyage pour résident permanent (TVRP)',
    ),
    href: irccForm('imm5444'),
    keywords: 'imm5444 pr card renew permanent resident card prtd travel document carte rp résident permanent tvrp renouveler',
    updated: '2025-12-09',
  },
  {
    code: 'CIT 0002',
    dept: 'ircc',
    name: bi('Application for Canadian Citizenship – Adults', 'Demande de citoyenneté canadienne – Adultes'),
    href: irccForm('cit0002'),
    online: 'citizenshipApply',
    keywords: 'cit0002 citizenship adult apply become canadian citoyenneté adulte devenir canadien',
    updated: '2026-06-23',
  },
  {
    code: 'IMM 5257',
    dept: 'ircc',
    name: bi('Application for visitor visa (temporary resident visa)', 'Demande de visa de visiteur (visa de résident temporaire)'),
    href: irccForm('imm5257'),
    keywords: 'imm5257 visitor visa trv temporary resident visit tourist visa de visiteur vrt résident temporaire touriste',
    updated: '2026-07-21',
  },
];

/** Passport forms differ by situation (IRCC guidance): never link one form, send people to the passport pages. */
export const PASSPORT_WORDS = /\b(passports?|passeports?|pptc)\b/i;
