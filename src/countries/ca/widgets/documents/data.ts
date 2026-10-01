/**
 * Document understanding: verified facts, official URLs and the catalogues the explainer and the forms
 * finder draw on. Isomorphic (tool on the server, widgets in the browser). Prose lives in messages/*.json.
 *
 * Every fact below was checked on the official page on 2026-09-30 ("updated" = the page's Date modified).
 *
 * CRA — notices and letters
 * - NOA / NOR: an NOA summarizes the calculated amounts for your return; an NOR is sent only if changes are
 *   made to an assessed return. Account summary shows "Refund", "Amount due" or "Balance: Nil". The notice
 *   shows the tax year, the date issued and the last 4 digits of the SIN; the 8-character access code is on
 *   the right side; it may include the RRSP deduction limit statement, HBP/LLP and FHSA statements. A notice
 *   issued before a payment was received may still show a balance. If you disagree: 90 days from the date of
 *   the notice to register a formal dispute. Notices are issued in one language (your filing preference).
 *   /en/services/taxes/income-tax/personal-income-tax/after-you-file/noa-nor.html (2025-07-09)
 * - Objection deadline for individuals: the later of one year after the tax filing deadline for the return,
 *   or 90 days from the date of the notice (TFSA/RRSP objections: 90 days). File online in My Account
 *   ("Register my formal dispute") or with Form T400A. Extension possible up to one year after the deadline.
 *   /en/revenue-agency/services/about-canada-revenue-agency-cra/complaints-disputes/file-objection-cppei-appeal-minister/income-tax.html (2026-09-17)
 *   Filing deadline "April 30 or June 15" (self-employed): income-tax-decision-tree.html (2026-05-19)
 *   "June 15, 2026: Deadline to file your taxes if you or your spouse or common-law partner are self-employed":
 *   /en/revenue-agency/services/tax/individuals/topics/important-dates-individuals.html (2026-09-17, rechecked 2026-09-30).
 *   The card counts from April 30 and says June 15 applies to the self-employed (dl.rule.objection).
 * - Balance due: "April 30, 2026: Deadline to pay your individual taxes" (2025 taxes). Pay online, by mail or
 *   in person; payment arrangements available. payments-cra.html (2026-01-20), make-payment.html
 *   (2026-09-14), payment-arrangements.html (2026-09-18)
 * - Due dates on a weekend or a CRA-recognized public holiday: received or postmarked by the next business
 *   day is on time (CDS AI Answers CRA guidance; applied to CRA dates only).
 * - Change a return: Change my return in your CRA account, ReFILE or by mail. change-return.html (2026-09-29)
 * - Reviews: a review is not an audit. Reply within the time frame in the letter, include the reference
 *   number (upper right corner), send the receipts/documents requested; upload with "Submit documents" in
 *   your CRA account; no receipts: written explanation or call the number at the bottom of the letter; need
 *   more time: call the number on the letter. review-your-tax-return-cra.html (2018-09-25),
 *   responding-us.html (2025-03-13), submit-documents-online.html (2026-09-18)
 * - CCB: recalculated every July from the previous year's tax information; the notice shows the annual
 *   amount and the information used to calculate it; file by April 30 every year (spouse too) to avoid a
 *   disruption; overpayment -> notice with a remittance voucher, CRA may keep future payments.
 *   canada-child-benefit/get-payments.html (2026-08-25), how-much.html (2026-06-23)
 *   2026 payment dates: Jan 20, Feb 20, Mar 20, Apr 20, May 20, Jun 19, Jul 20, Aug 20, Sep 18, Oct 20,
 *   Nov 20, Dec 11. canada-child-benefit/payment-dates.html (2025-12-17); benefit-payment-dates.html (2026-07-31)
 * - CGEB replaced the GST/HST credit in July 2026 (same eligibility and calculation, 25% increase for 5 years),
 *   quarterly, recalculated every July; 2026 CGEB payments Jul 3 and Oct 5; under $50 a quarter -> one payment in
 *   July; missing payment: wait 10 business days before calling. canada-groceries-essentials-benefit.html
 *   (2026-06-08), payment-dates.html (2026-06-08)
 * - Scams: the CRA will not send refunds by e-transfer or text; will not demand payment by Interac
 *   e-Transfer, cryptocurrency, prepaid credit cards or gift cards; will not threaten arrest, deportation or
 *   prison or use aggressive language; will not set up an in-person meeting in a public place to collect
 *   payment; emails won't ask you to reply or include a link to enter personal or financial information;
 *   texts only for multi-factor codes; no Messenger/WhatsApp. Official CRA addresses start with canada.ca or
 *   end in cra-arc.gc.ca. recognize-scam.html (2026-08-06). Report: 1-833-995-2336 (personal accounts),
 *   report-scam.html (2026-03-20). Individual enquiries 1-800-959-8281 (noa-nor.html). Verify a caller:
 *   verify-cra-contact.html (2026-04-15). Canadian Anti-Fraud Centre 1-888-495-8501 (antifraudcentre, 2025-11-27).
 *
 * Service Canada (ESDC)
 * - EI reconsideration: within 30 days after the decision was communicated; Form INS5210, in person or by
 *   mail; no fee; after 30 days give a reason for the delay; send new information first; a different
 *   officer reviews. ei-reconsideration.html (2026-04-01)
 * - EI reporting: every 2 weeks; the benefit statement mailed after you apply has a 4-digit access code; you
 *   need it and your SIN to report; keep it separate from your SIN. employment-insurance-reporting.html
 *   (2026-08-31). Phone: EI 1-800-206-7218 (FR 1-800-808-6352); telephone reporting 1-800-531-7555
 *   (FR 1-800-431-5595). contact/ei-individual.html (2026-06-03)
 * - OAS: enrolment letter around your 64th birthday = enrolled automatically; act if the information is
 *   wrong, the letter asks you to apply, or to delay; apply/delay online in My Service Canada Account.
 *   old-age-security/apply.html (2026-09-09). CPP/OAS phone 1-800-277-9914 (FR 1-800-277-9915). (2026-07-23)
 *
 * IRCC
 * - Biometric instruction letter (BIL): sent after you pay the biometric fee; bring the BIL and a valid
 *   passport to the appointment. biometrics/how-to-give.html (2026-03-30)
 *   30 days from when you get the letter; appointments are "free to book" ("La prise de rendez-vous est
 *   gratuite"), don't pay anyone; more time -> web form with the appointment details.
 *   biometrics/where-to-give.html (2026-08-24)
 * - PR medical exam: instructions arrive after you apply; exam within 30 days of getting them; only a panel
 *   physician (not your own doctor); not following the instructions may lead to refusal.
 *   medical-exams/requirements-permanent-residents.html (2026-08-04)
 * - IRCC phone numbers are never given (CDS AI Answers IRCC guidance): self-service pages and web form only.
 *
 * Other senders (no guide): Intergovernmental Affairs "Provinces and territories" links each provincial and
 *   territorial government's website (intergovernmental-affairs/services/provinces-territories.html, 2026-04-24);
 *   "Departments and agencies" lists every federal organization (government/dept.html, 2026-07-07).
 *
 * - Refunds: track the status in your CRA account; the CRA may keep all or part of a refund for an amount
 *   owing or other federal, provincial or territorial debts (e.g. student loans). refunds.html (2026-01-20)
 *
 * - Disability tax credit: "You can apply online or by phone using the digital form" (Part A in your CRA
 *   account under Benefits and credits > Apply for DTC, or by phone; the medical practitioner completes Part B
 *   online with your reference number) or by mail with the paper form T2201; both parts must use the same
 *   method. disability-tax-credit/how-apply-dtc.html (2025-11-28; FR comment-demande-ciph.html), checked 2026-09-30.
 * - Texts: "The CRA only sends text messages for multi-factor authentication for all of its sign-in services
 *   and if you enrolled with the telephone option", so the "came as a text" sign excludes a sign-in code you
 *   asked for. recognize-scam.html, rechecked 2026-09-30.
 *
 * Forms: each form page below was opened on 2026-09-30 (EN + FR titles as published; `updated` = the page's
 * visible "Date modified", which can differ from its dcterms.modified meta). RC65: "Individuals use this form
 * to tell the Canada Revenue Agency about a change of marital status" (rc65.html, 2026-07-02). CRA and IRCC PDF
 * forms must be downloaded and opened in Adobe Acrobat Reader (form pages; CRA "Using PDF forms").
 * Online routes checked 2026-10-01 (EN + FR):
 * - RC65: marital status can be changed online in the CRA account (Profile > Marital status > Edit, processing
 *   "Immediate"), by phone, by mail or fax with Form RC65 or a letter, or on the tax return.
 *   child-family-benefits/update-your-marital-status-canada-revenue-agency.html (2026-03-20)
 * - ISP1151: "Apply online through your My Service Canada Account (MSCA)"; by mail with ISP-1151 (ISP-2530A for
 *   a terminal illness). publicpensions/cpp-disability-benefit/apply.html (2026-09-01)
 */
export const CHECKED = '2026-09-30';

export type Lang = 'en' | 'fr';
export type Bi = Record<Lang, string>;
export type Dept = 'cra' | 'esdc' | 'ircc';

export const bi = (en: string, fr: string): Bi => ({ en, fr });
export const otherLang = (lang: Lang): Lang => (lang === 'fr' ? 'en' : 'fr');

/** Verified phone numbers (EN line / FR line where they differ). IRCC numbers are intentionally absent. */
export const PHONES = {
  craIndividuals: bi('1-800-959-8281', '1-800-959-8281'),
  craScam: bi('1-833-995-2336', '1-833-995-2336'),
  cafc: bi('1-888-495-8501', '1-888-495-8501'),
  ei: bi('1-800-206-7218', '1-800-808-6352'),
  eiReport: bi('1-800-531-7555', '1-800-431-5595'),
  cppOas: bi('1-800-277-9914', '1-800-277-9915'),
} as const;
export type PhoneKey = keyof typeof PHONES;

export const DOC_IDS = [
  'cra-noa',
  'cra-nor',
  'cra-review',
  'cra-ccb-notice',
  'cra-cgeb-notice',
  'esdc-ei-decision',
  'esdc-ei-statement',
  'esdc-oas-enrolment',
  'ircc-biometrics',
  'ircc-medical',
] as const;
export type DocId = (typeof DOC_IDS)[number];

/** Things the CRA says it will never do (recognize-scam.html). */
export const SIGNALS = ['gift-cards', 'crypto', 'etransfer', 'threats', 'text-message', 'link-info', 'fake-website', 'public-meeting'] as const;
export type Signal = (typeof SIGNALS)[number];

/** The verdict of the interactive scam check, from how many signs are ticked. */
export const scamLevel = (count: number, touched: boolean): 'high' | 'check' | 'idle' => (count > 0 ? 'high' : touched ? 'check' : 'idle');
