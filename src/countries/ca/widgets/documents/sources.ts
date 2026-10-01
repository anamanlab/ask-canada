/**
 * Source metadata for the official pages (titles as published, "Date modified", quotes), in both languages.
 * Only the tool needs this table: its output carries the sources for the answer's language and for the other
 * official language, so the card never ships it. Verification notes: ./data.
 */
import type { ToolSource } from '@/lib/widgets/types';
import { bi, CHECKED, type Bi, type Lang } from './data';
import { URLS, type UrlKey } from './urls';

const SRC: Partial<Record<UrlKey, { title: Bi; updated?: string; quote?: Bi }>> = {
  noa: {
    title: bi('Notices of assessment — NOA or NOR', 'Avis de cotisation – ADC ou ADNC'),
    updated: '2025-07-09',
    quote: bi(
      'If the information is complete but you disagree with your assessment or reassessment, you have 90 days from the date of your notice to register a formal dispute.',
      'Si les renseignements sont complets, mais que vous n’êtes pas d’accord avec votre cotisation ou nouvelle cotisation, vous avez 90 jours à partir de la date de l’avis pour enregistrer un avis de différend officiel.',
    ),
  },
  objection: {
    title: bi('File an objection – Income tax', 'Présenter un avis d’opposition – Impôt sur le revenu'),
    updated: '2026-09-17',
    quote: bi(
      'The deadline for filing an objection is whichever of these two dates is later: one year after the tax filing deadline for the return; or 90 days from the date of your notice of assessment or determination.',
      'La date limite pour présenter un avis d’opposition est la plus tardive des deux dates suivantes : un an après la date limite de production de la déclaration de revenus; le 90e jour suivant la date de votre avis de cotisation ou de détermination.',
    ),
  },
  refunds: { title: bi('Tax refunds', 'Remboursements d’impôt'), updated: '2026-01-20' },
  changeReturn: { title: bi('Changing a tax return', 'Modifier une déclaration de revenus'), updated: '2026-09-29' },
  payments: { title: bi('Payments to the CRA', 'Paiements faits à l’ARC'), updated: '2026-01-20' },
  makePayment: { title: bi('Make a payment', 'Faire un paiement'), updated: '2026-09-14' },
  arrangements: { title: bi('Arrange to pay your debt over time', 'Prendre une entente pour payer votre dette en plusieurs versements'), updated: '2026-09-18' },
  review: { title: bi('Review of your tax return by the CRA', 'Examen de votre déclaration de revenus par l’ARC'), updated: '2018-09-25' },
  respond: {
    title: bi('Responding to us — CRA reviews', 'Nous répondre — examens de l’ARC'),
    updated: '2025-03-13',
    quote: bi(
      'Reply within the time frame indicated to the address in our letter; include the reference number found at the upper right corner of our letter.',
      'Répondez dans le délai indiqué à l’adresse fournie dans notre lettre; indiquez le numéro de référence inscrit au coin supérieur droit de notre lettre.',
    ),
  },
  submitDocs: { title: bi('Submit documents online', 'Soumettre des documents en ligne'), updated: '2026-09-18' },
  ccbGet: { title: bi('Keep getting your payments — Canada child benefit', 'Continuer à recevoir vos versements — Allocation canadienne pour enfants'), updated: '2026-08-25' },
  ccbDates: { title: bi('Payment dates — Canada child benefit', 'Dates de versements — Allocation canadienne pour enfants'), updated: '2025-12-17' },
  cgeb: {
    title: bi('Canada Groceries and Essentials Benefit (CGEB)', 'Allocation canadienne pour l’épicerie et les besoins essentiels (ACEBE)'),
    updated: '2026-06-08',
  },
  cgebDates: { title: bi('Payment dates — Canada Groceries and Essentials Benefit', 'Dates de versement — Allocation canadienne pour l’épicerie et les besoins essentiels'), updated: '2026-06-08' },
  recognizeScam: {
    title: bi('Recognize a scam — CRA', 'Reconnaître une arnaque — ARC'),
    updated: '2026-08-06',
    quote: bi(
      'The CRA will not demand or pressure immediate payment by Interac e-transfer, cryptocurrencies, prepaid credit cards or gift cards from any type of retailer.',
      'L’ARC ne va pas exiger ou exercer une pression pour faire un paiement immédiat à l’aide des moyens suivants : virement Interac, cryptomonnaies, cartes de crédit prépayées, cartes-cadeaux de tout type de détaillant.',
    ),
  },
  reportScam: { title: bi('Report a scam or identity theft', 'Signaler une arnaque ou un vol d’identité'), updated: '2026-03-20' },
  verifyCra: { title: bi('Verify it’s the CRA calling', 'Vérifier si c’est bien l’ARC qui appelle'), updated: '2026-04-15' },
  cafc: { title: bi('Report fraud and cybercrime — Canadian Anti-Fraud Centre', 'Signaler les cas de fraude et de cybercriminalité — Centre antifraude du Canada'), updated: '2025-11-27' },
  eiRecon: {
    title: bi('Request for reconsideration of an Employment Insurance decision', 'Demande de révision d’assurance-emploi'),
    updated: '2026-04-01',
    quote: bi(
      'Submit it to Service Canada in person or by mail within 30 days after the date the decision was communicated to you.',
      'Soumettez votre formulaire à Service Canada, en personne ou par courrier, dans les 30 jours suivant la date à laquelle la décision vous a été communiquée.',
    ),
  },
  eiReporting: { title: bi('Employment Insurance reporting', 'Déclarations de l’assurance-emploi'), updated: '2026-08-31' },
  eiContact: { title: bi('Employment Insurance contact information for individuals', 'Coordonnées de l’assurance-emploi pour les individus'), updated: '2026-06-03' },
  oasApply: {
    title: bi('Old Age Security — Apply, delay, or change your start date', 'Pension de la Sécurité de vieillesse — Présenter une demande, retarder la pension, ou modifier votre date de début'),
    updated: '2026-09-09',
    quote: bi(
      'If Service Canada has your eligibility information, you will get an enrollment letter around your 64th birthday. This means that you are enrolled automatically and do not need to apply.',
      'Si Service Canada possède les renseignements relatifs à votre admissibilité, vous recevrez une lettre d’inscription autour de votre 64ᵉ anniversaire. Cela signifie que vous êtes inscrit automatiquement et que vous n’avez pas besoin de présenter une demande.',
    ),
  },
  oasContact: { title: bi('Contact Old Age Security', 'Communiquer avec les responsables du programme de la Sécurité de la vieillesse'), updated: '2026-07-23' },
  bioWhere: {
    title: bi('Biometrics: where to give your fingerprints and photo', 'Données biométriques : où faire prendre vos empreintes digitales et votre photo'),
    updated: '2026-08-24',
    quote: bi('You have 30 days from the time you get your BIL to give your biometrics.', 'Vous disposez de 30 jours pour fournir vos données biométriques à partir du moment où vous recevez votre lettre d’instructions.'),
  },
  bioHow: { title: bi('Biometrics: how to give your fingerprints and photo', 'Données biométriques : comment fournir vos empreintes digitales et votre photo'), updated: '2026-03-30' },
  medical: {
    title: bi('Medical examination for permanent residence applicants', 'Examen médical des demandeurs de la résidence permanente'),
    updated: '2026-08-04',
    quote: bi(
      'You must get your medical exam within 30 days of getting these instructions.',
      'Vous devez passer votre examen médical dans les 30 jours suivant la réception de ces instructions.',
    ),
  },
  irccStatus: { title: bi('How to check the status of your IRCC application', 'Comment vérifier l’état de votre demande à IRCC'), updated: '2026-08-25' },
  irccWebForm: { title: bi('IRCC web form', 'Formulaire Web d’IRCC'), updated: '2026-06-01' },
  irccForms: { title: bi('Find IRCC application forms and instructions', 'Trouver des formulaires de demande d’IRCC et des instructions'), updated: '2026-09-25' },
  craForms: { title: bi('CRA forms listed by number', 'Formulaires de l’ARC classés par numéro') },
  craPdfHelp: { title: bi('Using PDF forms — CRA', 'L’utilisation de formulaires en format PDF — ARC'), updated: '2016-02-10' },
  scForms: { title: bi('Service Canada forms', 'Formulaires de Service Canada') },
  passports: { title: bi('Canadian passports and other travel documents', 'Passeports canadiens et autres documents de voyage') },
  craSignIn: { title: bi('Sign in to your CRA account', 'Se connecter à son compte de l’ARC') },
  ccbApply: { title: bi('How to apply — Canada child benefit (CCB)', 'Comment faire une demande — Allocation canadienne pour enfants (ACE)'), updated: '2026-06-25' },
  dtcApply: {
    title: bi('How to apply — Disability tax credit (DTC)', 'Comment faire une demande — Crédit d’impôt pour personnes handicapées (CIPH)'),
    updated: '2025-11-28',
    quote: bi('You can apply online or by phone using the digital form.', 'Vous pouvez présenter une demande en ligne ou par téléphone au moyen du formulaire numérique.'),
  },
  maritalStatus: {
    title: bi('Update your personal information with the CRA – Change your marital status', 'Mettre à jour vos renseignements personnels auprès de l’ARC – Changer votre état civil'),
    updated: '2026-03-20',
  },
  cppdApply: {
    title: bi('Canada Pension Plan disability benefits', 'Prestations d’invalidité du Régime de pensions du Canada'),
    updated: '2026-09-01',
    quote: bi(
      'Apply online through your My Service Canada Account (MSCA). It’s fast, easy and secure.',
      'Présentez une demande en ligne à l’aide de votre compte Mon dossier Service Canada (MDSC). C’est rapide, facile et sécurisé.',
    ),
  },
  cppApply: { title: bi('Canada Pension Plan retirement pension — Apply', 'Pension de retraite du Régime de pensions du Canada — Présenter une demande'), updated: '2026-09-29' },
  sinApply: { title: bi('Social Insurance Number: Apply', 'Numéro d’assurance sociale : Présenter une demande'), updated: '2026-07-15' },
  citizenshipApply: {
    title: bi('Canadian citizenship for adults and minor children: How to apply', 'Citoyenneté canadienne pour adultes et enfants mineurs : Comment présenter une demande'),
    updated: '2026-04-21',
  },
  // Visible "Date modified" is 2026-09-23 on both the EN and FR pages (checked 2026-09-30).
  craContact: { title: bi('Contact the Canada Revenue Agency (CRA)', 'Contactez l’Agence du revenu du Canada (ARC)'), updated: '2026-09-23' },
  provinces: { title: bi('Provinces and territories — Intergovernmental Affairs', 'Provinces et territoires — Affaires intergouvernementales'), updated: '2026-04-24' },
  departments: { title: bi('Departments and agencies', 'Ministères et organismes'), updated: '2026-07-07' },
};

export function sources(keys: UrlKey[], lang: Lang): ToolSource[] {
  const seen = new Set<UrlKey>();
  const out: ToolSource[] = [];
  for (const k of keys) {
    const s = SRC[k];
    if (!s || seen.has(k)) continue;
    seen.add(k);
    out.push({ title: s.title[lang], url: URLS[k][lang], checked: CHECKED, ...(s.updated ? { updated: s.updated } : {}), ...(s.quote ? { quote: s.quote[lang] } : {}) });
  }
  return out;
}
