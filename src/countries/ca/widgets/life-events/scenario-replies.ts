/**
 * Scripted scenarios for life events: the answers themselves (EN + FR), keyed by scenario id without its
 * `life-events-` prefix. `{placeholders}` are filled by the scenario's `vars` (scenario-vars.ts). Every fact
 * is cited to a page in pages/*.ts, where it was verified.
 */
import type { Scenario } from '@/lib/scripted/types';
import { c } from './scenario-helpers';

const cm = { 1: c(1, 'changeAddress'), 2: c(2, 'craAddress'), 3: c(3, 'scPersonal'), 4: c(4, 'elections'), 5: c(5, 'passportHelp') };
const cb = { 1: c(1, 'registerBirth'), 2: c(2, 'ccbApply'), 3: c(3, 'eiParentalApply'), 4: c(4, 'childSupport') };
const cp = { 1: c(1, 'eiParentalAmount'), 2: c(2, 'eiParentalApply'), 3: c(3, 'eiParentalEligibility'), 4: c(4, 'childSupport') };
const cdb = { 1: c(1, 'cppDeath') };
const cmar = { 1: c(1, 'craMarital'), 2: c(2, 'sinUpdate'), 3: c(3, 'craName'), 4: c(4, 'newPassport') };
const cj = { 1: c(1, 'eiApply'), 2: c(2, 'eiEligibility'), 3: c(3, 'eiReporting'), 4: c(4, 'jobBank') };
const cr = { 1: c(1, 'cppWhen'), 2: c(2, 'cppApply'), 3: c(3, 'oasApply'), 4: c(4, 'gis') };
const cd = { 1: c(1, 'craDeath'), 2: c(2, 'cppCancel'), 3: c(3, 'cppDeath'), 4: c(4, 'finalReturn'), 5: c(5, 'mentalHealth') };
const cs = { 1: c(1, 'cppSurvivor'), 2: c(2, 'cppChildren'), 3: c(3, 'survivorAllowance') };
const ca = { 1: c(1, 'survivorAllowanceEligibility'), 2: c(2, 'survivorAllowance'), 3: c(3, 'survivorAllowanceApply') };
const cg = { 1: c(1, 'gisEligibility'), 2: c(2, 'gis'), 3: c(3, 'gisApply') };
const cf = { 1: c(1, 'finalReturn'), 2: c(2, 'representDeceased') };
const cl = { 1: c(1, 'lifeEvents'), 2: c(2, 'changeAddress') };

/** The answer after a death (the dated and undated scenarios share it). */
export const DEATH_REPLY: Scenario['reply'] = {
  en: `# I’m so sorry for your loss. Here’s what to do, *one step at a time*.

Start by telling the **CRA** the date of death as soon as you can, even if they didn’t get benefits. ${cd[1].en} If they received **CPP or Old Age Security**, call Service Canada to cancel it: payments after the month of death must be repaid. ${cd[2].en}

If they paid into the CPP long enough, the **CPP death benefit** is a one-time payment of $2,500. Another $2,500 is added only in some cases: if they never received a CPP or QPP pension or disability benefit, and left no spouse or partner who qualifies for a survivor’s pension. {benefitDue} ${cd[3].en}

{finalReturn} ${cd[4].en}

{dateLine} If you need someone to talk to, support is available. ${cd[5].en}`,
  fr: `# Toutes nos condoléances. Voici quoi faire, *une étape à la fois*.

Commencez par informer l’**ARC** de la date du décès dès que possible, même si la personne ne recevait pas de prestations. ${cd[1].fr} Si elle recevait le **RPC ou la Sécurité de la vieillesse**, appelez Service Canada pour les annuler : les versements après le mois du décès doivent être remboursés. ${cd[2].fr}

Si la personne a cotisé assez longtemps au RPC, la **prestation de décès du RPC** est un paiement unique de 2 500 $. Un montant complémentaire de 2 500 $ s’ajoute seulement dans certains cas : si elle n’a jamais reçu de pension ni de prestation d’invalidité du RPC ou du RRQ, et ne laisse aucun époux ou conjoint admissible à une pension de survivant. {benefitDue} ${cd[3].fr}

{finalReturn} ${cd[4].fr}

{dateLine} Si vous avez besoin de parler à quelqu’un, du soutien est offert. ${cd[5].fr}`,
};

export const REPLIES = {
  moving: {
    en: `# Tell *each department* yourself: they don’t share your new address.

Government systems aren’t connected, so every program that has your address needs the new one. ${cm[1].en}

With the **CRA**, the change is immediate online in your CRA account. ${cm[2].en} With **Service Canada**, you can update Old Age Security and dental care in My Service Canada Account, but EI, CPP and the Canada Disability Benefit need a call, a call back or a visit. ${cm[3].en}

Don’t forget your **voter registration** ${cm[4].en} and your **passport**: cross out the old address on page 4 and write the new one above it. Moving doesn’t make it invalid. ${cm[5].en}

Here’s your moving checklist. Tick things off as you go; it stays on this device.`,
    fr: `# Avisez *chaque ministère* vous-même : ils ne se transmettent pas votre nouvelle adresse.

Les systèmes gouvernementaux ne sont pas reliés entre eux : chaque programme qui a votre adresse doit recevoir la nouvelle. ${cm[1].fr}

Auprès de l’**ARC**, le changement est immédiat en ligne dans votre compte de l’ARC. ${cm[2].fr} Auprès de **Service Canada**, vous pouvez modifier la Sécurité de la vieillesse et les soins dentaires dans Mon dossier Service Canada, mais l’AE, le RPC et la Prestation canadienne pour les personnes handicapées demandent un appel, un rappel ou une visite. ${cm[3].fr}

N’oubliez pas votre **inscription électorale** ${cm[4].fr} ni votre **passeport** : rayez l’ancienne adresse à la page 4 et écrivez la nouvelle au-dessus. Un déménagement ne l’invalide pas. ${cm[5].fr}

Voici votre liste pour le déménagement. Cochez au fur et à mesure; elle reste sur cet appareil.`,
  },
  baby: {
    en: `# Congratulations! Start by *registering the birth*: it can start the rest.

Parents must register the birth with their province or territory. Some provinces offer a newborn registration service that also applies for child benefits at the same time, and in every province you can request your baby’s SIN when you register. ${cb[1].en}

Apply for the **Canada child benefit** as soon as your baby is born. When you apply through birth registration, you don’t need to send proof of birth. ${cb[2].en}

Taking time off work? **EI maternity benefits** can start up to 12 weeks before your due date. Apply as soon as you stop working, and choose standard (up to $729 a week) or extended (up to $437 a week) parental benefits. ${cb[3].en} In Quebec, you apply to the Quebec Parental Insurance Plan instead. ${cb[4].en}

{dateLine}`,
    fr: `# Félicitations! Commencez par *enregistrer la naissance* : le reste peut en découler.

Les parents doivent enregistrer la naissance auprès de leur province ou territoire. Certaines provinces offrent un service d’enregistrement des nouveau-nés qui permet aussi de demander des prestations pour enfants en même temps, et dans chaque province, vous pouvez demander le NAS de votre bébé en enregistrant la naissance. ${cb[1].fr}

Demandez l’**Allocation canadienne pour enfants** dès la naissance. Si vous la demandez par l’enregistrement de la naissance, vous n’avez pas à fournir de preuve de naissance. ${cb[2].fr}

Vous prenez congé? Les **prestations de maternité de l’AE** peuvent commencer jusqu’à 12 semaines avant la date prévue. Faites la demande dès que vous cessez de travailler, et choisissez les prestations parentales standards (jusqu’à 729 $ par semaine) ou prolongées (jusqu’à 437 $ par semaine). ${cb[3].fr} Au Québec, faites plutôt la demande au Régime québécois d’assurance parentale. ${cb[4].fr}

{dateLine}`,
  },
  parental: {
    en: `# Up to *$729 a week*, depending on your earnings and the option you choose.

EI pays **55%** of your average insurable weekly earnings for maternity and standard parental benefits, up to $729 a week in 2026. Extended parental benefits pay **33%**, up to $437 a week. ${cp[1].en}

**Maternity** benefits last up to 15 weeks and can start as early as 12 weeks before your due date. For **parental** benefits, you choose standard (up to 35 weeks, up to $729 a week) or extended (up to 61 weeks, up to $437 a week). Parents who share them get more weeks in total: up to 40 standard or 69 extended. ${cp[2].en}

To qualify, you need 600 insured hours of work in the 52 weeks before your claim, and your weekly earnings must drop by more than 40%. The eligibility page links to the EI Benefits Estimator, for an amount based on your own earnings. ${cp[3].en}

Apply as soon as you stop working, even if you’re not sure you qualify: if you apply more than 4 weeks after your last day of work, you may lose benefits. ${cp[2].en} In Quebec, these benefits come from the Quebec Parental Insurance Plan instead. ${cp[4].en}`,
    fr: `# Jusqu’à *729 $ par semaine*, selon votre rémunération et l’option choisie.

L’AE verse **55 %** de votre rémunération hebdomadaire assurable moyenne pour les prestations de maternité et les prestations parentales standards, jusqu’à 729 $ par semaine en 2026. Les prestations parentales prolongées versent **33 %**, jusqu’à 437 $ par semaine. ${cp[1].fr}

Les prestations de **maternité** durent au plus 15 semaines et peuvent commencer dès 12 semaines avant la date prévue de l’accouchement. Pour les prestations **parentales**, vous choisissez l’option standard (jusqu’à 35 semaines, jusqu’à 729 $ par semaine) ou prolongée (jusqu’à 61 semaines, jusqu’à 437 $ par semaine). Les parents qui se les partagent obtiennent plus de semaines au total : jusqu’à 40 en standard ou 69 en prolongé. ${cp[2].fr}

Pour y avoir droit, il faut avoir accumulé 600 heures d’emploi assurable au cours des 52 semaines précédant votre demande, et votre rémunération hebdomadaire doit avoir diminué de plus de 40 %. La page sur l’admissibilité mène à l’Estimateur des prestations d’assurance-emploi, pour un montant calculé selon votre propre rémunération. ${cp[3].fr}

Faites la demande dès que vous cessez de travailler, même si vous n’êtes pas certain d’y avoir droit : si vous la présentez plus de 4 semaines après votre dernier jour de travail, vous pourriez perdre des prestations. ${cp[2].fr} Au Québec, ces prestations relèvent plutôt du Régime québécois d’assurance parentale. ${cp[4].fr}`,
  },
  marriage: {
    en: `# Congratulations! Tell the CRA your new status *by the end of next month*.

You must tell the CRA about a new marital status by the end of the month after it changes: married in March, tell them by the end of April. That includes becoming common-law. The CRA then recalculates payments like the Canada child benefit. ${cmar[1].en}

Changing your name is a few more stops. The law requires you to **update your SIN record** ${cmar[2].en}, the **CRA** takes name changes by phone in some cases, or by mail or fax, but not online ${cmar[3].en}, and a passport in your new name is a **new application**, not a renewal. ${cmar[4].en}

{dateLine}`,
    fr: `# Félicitations! Informez l’ARC de votre nouvel état civil *d’ici la fin du mois prochain*.

Vous devez informer l’ARC d’un nouvel état civil au plus tard à la fin du mois suivant le changement : mariage en mars, avis d’ici la fin d’avril. Cela comprend le fait de devenir conjoints de fait. L’ARC recalcule ensuite des versements comme l’Allocation canadienne pour enfants. ${cmar[1].fr}

Changer de nom demande quelques démarches de plus. La loi vous oblige à **mettre à jour votre dossier de NAS** ${cmar[2].fr}, l’**ARC** accepte les changements de nom par téléphone dans certains cas, ou par la poste ou par télécopieur, mais pas en ligne ${cmar[3].fr}, et un passeport à votre nouveau nom exige une **nouvelle demande**, pas un renouvellement. ${cmar[4].fr}

{dateLine}`,
  },
  'job-loss': {
    en: `# Apply for EI *right away*, even before you have your paperwork.

If you apply more than 4 weeks after your last day of work, you may lose benefits. You can send your record of employment and other documents after you apply. ${cj[1].en}

The eligibility page links to the EI Benefits Estimator, which shows which benefit may fit and a possible weekly amount. ${cj[2].en} Once you’re receiving EI, you complete a report every 2 weeks. ${cj[3].en} Job Bank has free job search and alerts. ${cj[4].en}

{dateLine}`,
    fr: `# Demandez l’assurance-emploi *tout de suite*, même sans vos documents.

Si vous présentez votre demande plus de 4 semaines après votre dernier jour de travail, vous pourriez perdre des prestations. Vous pourrez envoyer votre relevé d’emploi et les autres documents après la demande. ${cj[1].fr}

La page sur l’admissibilité mène à l’Estimateur des prestations d’assurance-emploi, qui indique la prestation qui pourrait vous convenir et un montant hebdomadaire possible. ${cj[2].fr} Une fois les prestations commencées, vous remplissez une déclaration toutes les 2 semaines. ${cj[3].fr} Guichet-Emplois offre une recherche d’emploi et des alertes gratuites. ${cj[4].fr}

{dateLine}`,
  },
  retiring: {
    en: `# Plan your dates: *your CPP won’t start unless you apply*.

You can start your Canada Pension Plan any time from 60 to 70. Each month before 65 lowers payments by 0.6%; each month after 65 raises them by 0.7%. ${cr[1].en} It doesn’t start on its own, and you can apply up to 12 months before your chosen start date. ${cr[2].en}

**Old Age Security** is different: most people are enrolled automatically and get a letter around their 64th birthday. ${cr[3].en} With a low income, the **Guaranteed Income Supplement** adds a monthly tax-free payment. ${cr[4].en}

Here’s your checklist. Add the date you want your CPP to start to see when you can apply. Retiring earlier doesn’t mean your CPP has to start then.`,
    fr: `# Planifiez vos dates : *votre pension du RPC ne commence pas si vous ne la demandez pas*.

Vous pouvez commencer votre pension du Régime de pensions du Canada à tout moment entre 60 et 70 ans. Chaque mois avant 65 ans réduit les versements de 0,6 %; chaque mois après les augmente de 0,7 %. ${cr[1].fr} Elle ne commence pas d’elle-même, et vous pouvez faire la demande jusqu’à 12 mois avant la date de début choisie. ${cr[2].fr}

La **Sécurité de la vieillesse** est différente : la plupart des gens sont inscrits automatiquement et reçoivent une lettre vers leur 64e anniversaire. ${cr[3].fr} À faible revenu, le **Supplément de revenu garanti** ajoute un paiement mensuel non imposable. ${cr[4].fr}

Voici votre liste. Ajoutez la date où vous voulez que votre RPC commence pour voir quand faire la demande. Prendre votre retraite plus tôt ne veut pas dire que votre RPC doit commencer à ce moment-là.`,
  },
  'death-benefit': {
    en: `# The executor should apply *online or by mail*, within 60 days of the death.

If there’s an estate, the executor named in the will, or the administrator named by the court, applies for the **CPP death benefit**. They should apply within 60 days of the date of death. ${cdb[1].en}

To apply online, sign in to My Service Canada Account, complete the online CPP Death Benefit form and upload any documents. Or mail the paper Application for a Canada Pension Plan Death Benefit (ISP1200). Payment takes about 6 to 12 weeks after Service Canada receives a complete application. ${cdb[1].en}

If there’s no estate, or the executor hasn’t applied, it can be paid to others who apply, in this order: whoever paid or is responsible for paying the funeral, then the surviving spouse or common-law partner, then the next of kin. ${cdb[1].en}

It’s a one-time payment of $2,500, with a possible $2,500 top-up in some cases, for a maximum of $5,000. ${cdb[1].en}`,
    fr: `# L’exécuteur testamentaire devrait en faire la demande *en ligne ou par la poste*, dans les 60 jours suivant le décès.

S’il y a une succession, l’exécuteur testamentaire nommé dans le testament, ou l’administrateur nommé par le tribunal, demande la **prestation de décès du RPC**. Il devrait le faire dans les 60 jours suivant la date du décès. ${cdb[1].fr}

Pour la demander en ligne, connectez-vous à Mon dossier Service Canada, remplissez le formulaire de prestation de décès du RPC en ligne et téléversez les documents justificatifs, le cas échéant. Vous pouvez aussi envoyer par la poste le formulaire papier Demande de prestations de décès du Régime de pensions du Canada (ISP1200). Il faut compter environ de 6 à 12 semaines à partir de la réception d’une demande complète par Service Canada. ${cdb[1].fr}

S’il n’y a pas de succession, ou si l’exécuteur n’a pas fait la demande, la prestation peut être versée à d’autres personnes qui la demandent, dans cet ordre : la personne ou l’établissement qui a payé les frais funéraires ou qui doit les payer, puis l’époux ou le conjoint de fait survivant, puis le plus proche parent. ${cdb[1].fr}

C’est un paiement unique de 2 500 $, avec un montant complémentaire possible de 2 500 $ dans certains cas, pour un maximum de 5 000 $. ${cdb[1].fr}`,
  },
  survivor: {
    en: `# A *spouse or common-law partner* can get the CPP survivor’s pension.

You qualify if you were legally married to the person who died, or were their common-law partner, living together in a conjugal relationship for at least 1 year. A separated legal spouse may qualify if there’s no common-law partner. ${cs[1].en}

Apply as soon as you can: the CPP pays back at most 12 months. You can apply online in My Service Canada Account or by mail. ${cs[1].en}

Their **dependent children** may get a monthly benefit until 18, or until 25 if they attend a recognized school or university full-time or part-time. ${cs[2].en} If you’re 60 to 64 with a low income, also check the **Allowance for the Survivor**. ${cs[3].en}`,
    fr: `# L’*époux ou le conjoint de fait* peut recevoir la pension de survivant du RPC.

Vous y avez droit si vous étiez légalement marié à la personne décédée, ou si vous étiez son conjoint de fait, en union conjugale depuis au moins 1 an. L’époux séparé peut y avoir droit s’il n’y a pas de conjoint de fait. ${cs[1].fr}

Faites la demande dès que possible : le RPC verse au plus 12 mois de paiements rétroactifs. Vous pouvez la faire en ligne dans Mon dossier Service Canada ou par la poste. ${cs[1].fr}

Ses **enfants à charge** pourraient recevoir une prestation mensuelle jusqu’à 18 ans, ou jusqu’à 25 ans s’ils fréquentent une école ou une université reconnue à temps plein ou à temps partiel. ${cs[2].fr} Si vous avez de 60 à 64 ans et un faible revenu, vérifiez aussi l’**Allocation au survivant**. ${cs[3].fr}`,
  },
  'allowance-survivor': {
    en: `# Yes, if you’re 60 to 64 and your income is *under $31,152 a year*.

The **Allowance for the Survivor** is for a person whose spouse or common-law partner has died, and who hasn’t remarried or started a new common-law relationship. You must also live in Canada, have lived in Canada for at least 10 years since age 18, not be under a sponsorship agreement, and have an annual income under $31,152 (October to December 2026). ${ca[1].en}

It’s a monthly, tax-free payment of up to **$1,726.18 a month**, depending on your income. You have to apply for it, as early as 11 months before your 60th birthday. ${ca[2].en}

Apply online in My Service Canada Account, or by mail with a paper form. A CPP survivor’s pension counts as income when your Allowance is calculated. ${ca[3].en}`,
    fr: `# Oui, si vous avez de 60 à 64 ans et un revenu *inférieur à 31 152 $ par année*.

L’**Allocation au survivant** s’adresse à la personne dont l’époux ou le conjoint de fait est décédé, et qui ne s’est pas remariée ni engagée dans une nouvelle union de fait. Vous devez aussi être citoyen canadien ou résident autorisé, avoir résidé au Canada pendant au moins 10 ans depuis l’âge de 18 ans, ne pas avoir d’entente de parrainage et avoir un revenu annuel inférieur à 31 152 $ (d’octobre à décembre 2026). ${ca[1].fr}

C’est un paiement mensuel non imposable d’au plus **1 726,18 $ par mois**, selon votre revenu. Vous devez en faire la demande, au plus tôt 11 mois avant votre 60e anniversaire. ${ca[2].fr}

Faites la demande en ligne dans Mon dossier Service Canada, ou par la poste avec un formulaire papier. La pension de survivant du RPC compte comme un revenu dans le calcul de l’Allocation. ${ca[3].fr}`,
  },
  gis: {
    en: `# The GIS is for people *65 or older* who get Old Age Security and have a low income.

To qualify, you must be 65 or older, receive the Old Age Security pension, live in Canada, not be under a sponsorship agreement, and have an income under the limit for your situation. If you’re single, divorced or widowed, that’s under $23,112 a year. ${cg[1].en}

The **Guaranteed Income Supplement** is a monthly, tax-free payment. If you’re single, divorced or widowed, it’s up to **$1,138.90 a month**. ${cg[2].en}

Most people don’t have to apply. Shortly after your 64th birthday, Service Canada sends a letter confirming your OAS and tries to enrol you in the GIS automatically. If a month has passed since your 64th birthday with no letter, contact Service Canada to find out if you need to apply. ${cg[3].en}`,
    fr: `# Le SRG s’adresse aux personnes de *65 ans ou plus* qui reçoivent la Sécurité de la vieillesse et ont un faible revenu.

Pour y avoir droit, vous devez avoir 65 ans ou plus, recevoir la pension de la Sécurité de la vieillesse, vivre au Canada, ne pas avoir d’entente de parrainage et avoir un revenu inférieur au seuil prévu pour votre situation. Si vous êtes célibataire, divorcé ou veuf, c’est moins de 23 112 $ par année. ${cg[1].fr}

Le **Supplément de revenu garanti** est un paiement mensuel non imposable. Si vous êtes célibataire, divorcé ou veuf, il peut atteindre **1 138,90 $ par mois**. ${cg[2].fr}

La plupart des gens n’ont pas à en faire la demande. Peu après votre 64e anniversaire, Service Canada vous envoie une lettre qui confirme votre inscription à la SV et tente de vous inscrire automatiquement au SRG. Si un mois s’est écoulé depuis votre 64e anniversaire sans lettre, communiquez avec Service Canada pour savoir si vous devez faire une demande. ${cg[3].fr}`,
  },
  'final-return': {
    en: `# The final return is due *April 30 of the next year* for a death from January to October.

For a death from November 1 to December 31, it’s due 6 months after the death, on the same calendar day. Any balance owing is due on the same date. ${cf[1].en}

If the person who died, or the spouse or common-law partner living with them, ran a business, the return can be filed by June 15 of the next year (6 months after, for a death from December 16 to 31). A balance owing is still due on the regular date. A due date on a weekend or public holiday is on time the next business day. ${cf[1].en}

The legal representative, usually the executor, files it. Don’t sign in to their CRA account. ${cf[2].en}`,
    fr: `# La déclaration finale est due le *30 avril de l’année suivante* pour un décès de janvier à octobre.

Pour un décès du 1er novembre au 31 décembre, elle est due 6 mois après le décès, le même jour du mois. Tout solde dû doit être payé à la même date. ${cf[1].fr}

Si la personne décédée, ou l’époux ou le conjoint de fait qui vivait avec elle, exploitait une entreprise, la déclaration peut être produite au plus tard le 15 juin de l’année suivante (6 mois après, pour un décès du 16 au 31 décembre). Le solde dû reste exigible à la date habituelle. Une date limite qui tombe une fin de semaine ou un jour férié est respectée le jour ouvrable suivant. ${cf[1].fr}

C’est le représentant légal, habituellement l’exécuteur testamentaire, qui la produit. Ne vous connectez pas à son compte de l’ARC. ${cf[2].fr}`,
  },
  'final-return-dated': {
    en: `# Their final return is due *{due}*.

For a death on {death}, that’s the due date to file the final return and to pay any balance owing. ${cf[1].en} {rolled}If the person who died, or the spouse or common-law partner living with them, ran a business, filing can be later, but the balance owing is still due then. ${cf[1].en}

The legal representative, usually the executor, files it. Don’t sign in to their CRA account. ${cf[2].en}

Here’s the checklist for everything else, with your dates. I’m so sorry for your loss.`,
    fr: `# Sa déclaration finale est due le *{due}*.

Pour un décès survenu le {death}, c’est la date limite pour produire la déclaration finale et payer tout solde dû. ${cf[1].fr} {rolled}Si la personne décédée, ou l’époux ou le conjoint de fait qui vivait avec elle, exploitait une entreprise, la production peut être plus tardive, mais le solde dû reste exigible à cette date. ${cf[1].fr}

C’est le représentant légal, habituellement l’exécuteur testamentaire, qui la produit. Ne vous connectez pas à son compte de l’ARC. ${cf[2].fr}

Voici la liste pour tout le reste, avec vos dates. Toutes nos condoléances.`,
  },
  all: {
    en: `# Big moments come with paperwork. Here’s *one list* for each.

Canada.ca groups its services around life events, like welcoming a child, retiring or losing someone. ${cl[1].en} The catch: government systems aren’t connected, so something as simple as a new address has to be given to each department separately. ${cl[2].en}

Pick a moment below to get a checklist across every department, with the official page for each step.`,
    fr: `# Les grands moments viennent avec de la paperasse. Voici *une liste* pour chacun.

Canada.ca regroupe ses services par événement de la vie, comme l’arrivée d’un enfant, la retraite ou le décès d’un proche. ${cl[1].fr} Le hic : les systèmes gouvernementaux ne sont pas reliés entre eux, alors même une nouvelle adresse doit être donnée à chaque ministère séparément. ${cl[2].fr}

Choisissez un moment ci-dessous pour obtenir une liste qui couvre tous les ministères, avec la page officielle de chaque étape.`,
  },
} satisfies Record<string, Scenario['reply']>;
