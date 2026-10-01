/**
 * Scripted scenarios for the `passport` widget (EN + FR): the table only. Facts: widgets/passport/data.ts.
 * The computed answers (month, trip) and the question parsing live in widgets/passport/answers/.
 */
import type { Scenario } from '@/lib/scripted/types';
import { todayInCanada } from '../data/holidays';
import { cite } from '../widgets/passport/answers/format';
import { renewReply, travelSoonReply } from '../widgets/passport/answers/general';
import { RENEW, renewMonth } from '../widgets/passport/answers/monthScenarios';
import { TRAVEL_DATE, TRAVEL_WORDS, tripInput, type Ctx } from '../widgets/passport/answers/parse';
import { RENEW_INTL } from '../widgets/passport/answers/renewIntl';
import { tripAnswer } from '../widgets/passport/answers/tripAnswer';
import { CHECKED, URLS } from '../widgets/passport/data';

const today = (timeZone?: string) => todayInCanada(new Date(), timeZone);
const PHOTOS = {
  en: 'https://www.canada.ca/en/immigration-refugees-citizenship/services/canadian-passports/photos.html',
  fr: 'https://www.canada.ca/fr/immigration-refugies-citoyennete/services/passeports-canadiens/photos.html',
};

const passport: Scenario[] = [
  ...renewMonth,
  {
    id: 'passport-renew',
    priority: 5,
    match: RENEW,
    // "passport" in Canada's most common other home languages (answer opens with a note in that language).
    matchIntl: [
      /جواز\s*(ال)?سفر|جواز|گذرنامه|پاسپورت|پاسپورٹ/,
      /护照|護照/,
      /ਪਾਸਪੋਰਟ|पासपोर्ट|પાસપોર્ટ|கடவுச்சீட்டு|பாஸ்போர்ட்/,
      /여권/,
      /паспорт/i,
      /\b(pasaporte|passaporte|passaporto|reisepass|hộ chiếu)\b/i,
    ],
    reply: { en: renewReply('en'), fr: renewReply('fr') },
    // Native answers for the most common other home languages.
    replyIntl: { ...RENEW_INTL },
    toolCalls: [{ toolName: 'passportPlanner', input: ({ lang, timeZone }: Ctx) => ({ lang, timeZone }) }],
    followUps: {
      en: ['My passport expires in March', 'How much does a passport cost?', 'Find a passport office near me', 'Who can be my reference?'],
      fr: ['Mon passeport expire en mars', 'Combien coûte un passeport?', 'Trouver un bureau des passeports près de chez moi', 'Qui peut être ma référence?'],
    },
  },
  {
    id: 'passport-fees',
    priority: 4,
    match: [/\bpassport\b.*\b(cost|fee|fees|price|how much)\b/i, /\b(cost|fee|fees|price|how much)\b.*\bpassport/i, /\b(co[uû]t|frais|prix|combien)\b.*\bpasseport/i, /\bpasseport\b.*\b(co[uû]t|frais|prix)/i],
    reply: {
      en: `# An adult passport costs *$163.50* for 10 years or $122.50 for 5 years.

Those are the fees for adults applying in Canada, in effect since March 31, 2026. A child passport is $58.50. [1](${URLS.payFees.en}) [2](${URLS.fees.en})

Faster service at a passport office costs extra: express pickup (2 to 9 business days) is $50 and urgent pickup (by the end of the next business day) is $125.75, on top of the passport fee. [2](${URLS.fees.en}) [3](${URLS.processing.en})

The official fees page shows the fee for your exact situation and how to pay it. [1](${URLS.payFees.en})`,
      fr: `# Un passeport pour adulte coûte *163,50 $* pour 10 ans ou 122,50 $ pour 5 ans.

Ce sont les frais pour les adultes qui présentent leur demande au Canada, en vigueur depuis le 31 mars 2026. Un passeport pour enfant coûte 58,50 $. [1](${URLS.payFees.fr}) [2](${URLS.fees.fr})

Un service plus rapide dans un bureau des passeports coûte plus cher : le service de retrait express (2 à 9 jours ouvrables) coûte 50 $ et le service de retrait urgent (avant la fin du jour ouvrable suivant), 125,75 $, en plus des frais de passeport. [2](${URLS.fees.fr}) [3](${URLS.processing.fr})

La page officielle des frais indique les frais qui s’appliquent à votre situation et comment les payer. [1](${URLS.payFees.fr})`,
    },
    // Leads with the fee summary (focus: 'fees'); the expiry picker is a follow-on step.
    toolCalls: [{ toolName: 'passportPlanner', input: ({ lang, timeZone }: Ctx) => ({ focus: 'fees', lang, timeZone }) }],
    followUps: {
      en: ['Can I renew my passport online?', 'How long does passport renewal take?', 'Find a passport office near me'],
      fr: ['Puis-je renouveler mon passeport en ligne?', 'Combien de temps prend le renouvellement du passeport?', 'Trouver un bureau des passeports près de chez moi'],
    },
  },
  {
    // "How long does passport renewal take?": the processing times, with the planner leading with them.
    id: 'passport-processing',
    priority: 9.5,
    match: [
      /\b(how long|how many (business )?days|processing times?|wait times?|how quickly|how fast)\b.*\bpassports?\b/i,
      /\bpassports?\b.*\b(how long|processing times?|take to (arrive|process|come))\b/i,
      /(?<!\p{L})(combien de temps|délais?|delais?)(?!\p{L}).*\bpasseports?\b/iu,
      /\bpasseports?\b.*(?<!\p{L})(combien de temps|délais?|delais?)(?!\p{L})/iu,
    ],
    reply: {
      en: `# It takes *10 business days* at a passport office, or 20 online, by mail or at a regular Service Canada Centre.

Those times don’t include mailing. After processing, delivery usually takes about 5 business days. [1](${URLS.processing.en}) [2](${URLS.afterApply.en})

Need it sooner? Passport offices offer express pick-up in 2 to 9 business days ($50) and urgent pick-up by the end of the next business day ($125.75), with proof of travel. [3](${URLS.urgent.en}) [4](${URLS.fees.en})

Renewing online takes up to 20 business days plus mailing, and it cancels your current passport as soon as you apply. [5](${URLS.online.en})

The planner shows the times side by side. Pick your expiry month to see your own dates.`,
      fr: `# Le traitement prend *10 jours ouvrables* dans un bureau des passeports, ou 20 en ligne, par la poste ou dans un Centre Service Canada régulier.

Ces délais n’incluent pas l’envoi postal. Après le traitement, la livraison prend habituellement environ 5 jours ouvrables. [1](${URLS.processing.fr}) [2](${URLS.afterApply.fr})

Besoin plus tôt? Les bureaux des passeports offrent le service de retrait express, en 2 à 9 jours ouvrables (50 $), et le service de retrait urgent, avant la fin du jour ouvrable suivant (125,75 $), avec une preuve de voyage. [3](${URLS.urgent.fr}) [4](${URLS.fees.fr})

Le renouvellement en ligne prend jusqu’à 20 jours ouvrables, plus la livraison, et il annule votre passeport actuel dès que vous présentez la demande. [5](${URLS.online.fr})

Le planificateur compare les délais. Choisissez le mois d’expiration de votre passeport pour voir vos dates.`,
    },
    toolCalls: [{ toolName: 'passportPlanner', input: ({ lang, timeZone }: Ctx) => ({ focus: 'processing', lang, timeZone }) }],
    followUps: {
      en: ['I need my passport in 10 days', 'Can I renew my passport online?', 'What should I bring to the passport office?'],
      fr: ['J’ai besoin de mon passeport dans 10 jours', 'Puis-je renouveler mon passeport en ligne?', 'Que dois-je apporter au bureau des passeports?'],
    },
  },
  {
    // "Can I renew my passport online?": the 6-month rule first, then the other conditions.
    id: 'passport-online',
    priority: 9,
    match: [/\bpassports?\b.*\bonline\b/i, /\bonline\b.*\bpassports?\b/i, /\bpasseports?\b.*\ben ligne\b/i, /\ben ligne\b.*\bpasseports?\b/i],
    reply: {
      en: `# Yes, if your passport *expires within 6 months* or has already expired.

You can renew online if your current passport is a regular (blue) one, valid for 5 or 10 years, that shows your place of birth, and your home and mailing addresses are in Canada. You’ll need a digital photo from a commercial photographer, taken no more than 6 months before you apply. [1](${URLS.online.en})

Applying online **cancels your current passport right away**, so don’t use it if you travel in the next 20 business days. It takes up to 20 business days, plus mailing. [1](${URLS.online.en}) [2](${URLS.processing.en})

Not open to you yet? You can renew in person or by mail at any time. [3](${URLS.renew.en})

The planner lists every condition. Pick your expiry month to see when online renewal opens for you.`,
      fr: `# Oui, si votre passeport *expire dans les 6 prochains mois* ou a déjà expiré.

Vous pouvez renouveler en ligne si votre passeport actuel est un passeport régulier (bleu), valide 5 ou 10 ans, qui indique votre lieu de naissance, et si votre adresse domiciliaire et votre adresse postale sont au Canada. Il vous faut une photo numérique prise par un photographe commercial au plus 6 mois avant votre demande. [1](${URLS.online.fr})

Une demande en ligne **annule immédiatement votre passeport actuel** : ne l’utilisez pas si vous voyagez dans les 20 prochains jours ouvrables. Le traitement prend jusqu’à 20 jours ouvrables, plus la livraison. [1](${URLS.online.fr}) [2](${URLS.processing.fr})

Ce n’est pas encore possible pour vous? Vous pouvez renouveler en personne ou par la poste en tout temps. [3](${URLS.renew.fr})

Le planificateur énumère toutes les conditions. Choisissez le mois d’expiration de votre passeport pour savoir quand le renouvellement en ligne vous sera ouvert.`,
    },
    toolCalls: [{ toolName: 'passportPlanner', input: ({ lang, timeZone }: Ctx) => ({ focus: 'online', lang, timeZone }) }],
    followUps: {
      en: ['My passport expires in March', 'What makes a passport photo acceptable?', 'How long does passport renewal take?'],
      fr: ['Mon passeport expire en mars', 'Qu’est-ce qu’une photo de passeport acceptable?', 'Combien de temps prend le renouvellement du passeport?'],
    },
  },
  {
    id: 'passport-bring',
    // Above offices-passport-near (14) and offices-open-today (15): "What should I bring to the passport
    // office?" names an office but asks what to bring, not where to go.
    priority: 16,
    match: [
      /\b(what|which)\b.*\b(bring|take)\b.*\bpassport\b/i,
      /\bwhat do i need\b.*\bpassport office\b/i,
      /\bpassport\b.*\bwhat\b.*\b(bring|take)\b/i,
      /\b(quoi|que)\b.*\bapporter\b.*\bpasseport/i,
      /(?<!\p{L})(qu’|qu')est-ce qu(’|')il faut apporter(?!\p{L}).*\bpasseport/iu,
      /\bpasseport\b.*\b(quoi|que)\b.*\bapporter\b/i,
    ],
    reply: {
      en: `# Bring *4 things*: your form, your photos, your passport and a way to pay.

To renew in person, bring: [1](${URLS.inPerson.en})

- **Form PPTC 054**, filled in on a computer, with your **2 references** listed. [2](${URLS.whatYouNeed.en})
- **2 identical passport photos** from a commercial photographer, taken in the last 6 months. [3](${PHOTOS.en})
- **Your most recent passport.**
- **Payment**: a credit, prepaid or debit card, or a certified cheque or money order in Canadian funds. Cash and personal cheques aren’t accepted. [1](${URLS.inPerson.en})

You can book an appointment online or walk in. Wait times can be long at some passport offices. [1](${URLS.inPerson.en})`,
      fr: `# Apportez *4 choses* : votre formulaire, vos photos, votre passeport et un moyen de paiement.

Pour renouveler en personne, apportez : [1](${URLS.inPerson.fr})

- **Le formulaire PPTC 054**, rempli à l’ordinateur, avec vos **2 références**. [2](${URLS.whatYouNeed.fr})
- **2 photos de passeport identiques** prises par un photographe commercial au cours des 6 derniers mois. [3](${PHOTOS.fr})
- **Votre passeport le plus récent.**
- **Le paiement** : carte de crédit, prépayée ou de débit, ou chèque certifié ou mandat en dollars canadiens. L’argent comptant et les chèques personnels ne sont pas acceptés. [1](${URLS.inPerson.fr})

Vous pouvez prendre rendez-vous en ligne ou vous présenter sans rendez-vous. L’attente peut être longue dans certains bureaux des passeports. [1](${URLS.inPerson.fr})`,
    },
    followUps: {
      en: ['What makes a passport photo acceptable?', 'Who can be my reference?', 'How much does a passport cost?'],
      fr: ['Qu’est-ce qu’une photo de passeport acceptable?', 'Qui peut être ma référence?', 'Combien coûte un passeport?'],
    },
  },
  {
    id: 'passport-photo',
    priority: 12,
    match: [/\bpassport\b.*\bphotos?\b/i, /\bphotos?\b.*\bpassport/i, /\bphotos?\b.*\bpasseport/i, /\bpasseport\b.*\bphotos?\b/i],
    reply: {
      en: `# Two identical photos from *a commercial photographer*, taken in the last 6 months.

If you apply in person or by mail, the photos must be 50 mm wide by 70 mm high, with your face measuring 31 to 36 mm from chin to crown. They must be taken in person by a commercial photographer or photo studio, with a neutral expression and a plain background that contrasts with your face. [1](${PHOTOS.en})

Renewing **online**? You need a **digital** photo instead, also taken by a commercial photographer no more than 6 months before you apply. Don’t edit it, and don’t change or remove the background. [1](${PHOTOS.en}) [2](${URLS.online.en})`,
      fr: `# Deux photos identiques prises par *un photographe commercial* au cours des 6 derniers mois.

Si vous présentez votre demande en personne ou par la poste, les photos doivent mesurer 50 mm de largeur sur 70 mm de hauteur, et votre visage doit mesurer de 31 à 36 mm du menton au sommet de la tête. Elles doivent être prises en personne par un photographe commercial ou un studio de photo, avec une expression neutre et un arrière-plan uni qui contraste avec votre visage. [1](${PHOTOS.fr})

Vous renouvelez **en ligne**? Il vous faut plutôt une photo **numérique**, elle aussi prise par un photographe commercial au plus 6 mois avant votre demande. Ne la retouchez pas et ne modifiez pas l’arrière-plan. [1](${PHOTOS.fr}) [2](${URLS.online.fr})`,
    },
    followUps: {
      en: ['Who can be my reference?', 'Find a passport office near me'],
      fr: ['Qui peut être ma référence?', 'Trouver un bureau des passeports près de chez moi'],
    },
  },
  {
    id: 'passport-references',
    priority: 12,
    match: [
      /\b(reference|references|guarantor)\b.*\b(passport|renew\w*)\b/i,
      /\bwho can be my (reference|guarantor)\b/i,
      /\b(passport|renew\w*)\b.*\b(reference|references|guarantor)\b/i,
      /\b(référence|références|répondant)\b/i,
    ],
    reply: {
      en: `# You need *2 references* who’ve known you for 2+ years.

They must be 18 or older and agree to be your reference. They can’t be your spouse or common-law partner, or immediate family like a parent, child, grandparent, grandchild or sibling (or their spouse or partner), or an in-law. [1](${URLS.whatYouNeed.en})

Other relatives, like aunts, uncles and cousins, **can** be references unless they live at your address. A boyfriend or girlfriend can too, if you’re not in a common-law relationship. [1](${URLS.whatYouNeed.en})

Renewing? You don’t need a guarantor. A guarantor is only needed when you apply for a new passport. [2](${URLS.renew.en})`,
      fr: `# Il vous faut *2 références* qui vous connaissent depuis 2 ans ou plus.

Elles doivent avoir 18 ans ou plus et accepter d’être votre référence. Elles ne peuvent pas être votre époux ou conjoint de fait, ni un membre de votre famille immédiate comme un parent, un enfant, un grand-parent, un petit-enfant ou un frère ou une sœur (ou leur époux ou conjoint de fait), ni un membre de votre belle-famille. [1](${URLS.whatYouNeed.fr})

Les autres membres de la famille, comme les tantes, les oncles et les cousins, **peuvent** être des références, sauf s’ils habitent à votre adresse. Un petit ami ou une petite amie aussi, si vous n’êtes pas en union de fait. [1](${URLS.whatYouNeed.fr})

Vous renouvelez? Vous n’avez pas besoin de répondant. Un répondant est nécessaire seulement pour une nouvelle demande de passeport. [2](${URLS.renew.fr})`,
    },
    followUps: {
      en: ['What makes a passport photo acceptable?', 'Can I renew my passport online?'],
      fr: ['Qu’est-ce qu’une photo de passeport acceptable?', 'Puis-je renouveler mon passeport en ligne?'],
    },
  },
  {
    id: 'passport-urgent',
    priority: 12,
    match: [
      /\b(travel\w*|trip|flight|flying|leav\w*)\b.*\bbefore\b.*\b(it|passport)\b.*\b(arrives?|comes?|ready)\b/i,
      /\b(urgent|express|rush|emergency|fast(er|est)?|quick(ly)?)\b.*\bpassport\b/i,
      /\bpassport\b.*\b(urgent\w*|express|rush|in a hurry|next week|in (\d+|two|three) (days|weeks))\b/i,
      /\bvoyag\w*\b.*\bavant de le recevoir\b/i,
      /\b(urgent|express|rapide\w*|vite)\b.*\bpasseport/i,
      /\bpasseport\b.*\b(urgen\w*|express|rapide\w*|la semaine prochaine)\b/i,
    ],
    reply: { en: travelSoonReply('en'), fr: travelSoonReply('fr') },
    followUps: {
      en: ['I need my passport in 10 days', 'Find a passport office near me', 'How much does a passport cost?'],
      fr: ['J’ai besoin de mon passeport dans 10 jours', 'Trouver un bureau des passeports près de chez moi', 'Combien coûte un passeport?'],
    },
  },
  {
    // A trip with a date ("I need my passport in 10 days", "je pars le 15 octobre"): the planner checks it
    // against processing and names regular, express or urgent service, with dates, fees and proof of travel.
    id: 'passport-trip-date',
    priority: 14,
    match: [
      new RegExp(`(?=.*\\b(passport|passeport)\\b)(?=.*(${TRAVEL_WORDS.source}))(?=.*(${TRAVEL_DATE.source}))`, 'iu'),
    ],
    reply: { en: '{answer}', fr: '{answer}' },
    vars: ({ text, lang, timeZone }: Ctx) => ({ answer: tripAnswer(text, lang, timeZone) }),
    toolCalls: [{ toolName: 'passportPlanner', input: ({ text, lang, timeZone }: Ctx) => ({ ...tripInput(text, lang, today(timeZone)), timeZone }) }],
    followUps: {
      en: ['Find a passport office near me', 'What should I bring to the passport office?', 'How much does a passport cost?'],
      fr: ['Trouver un bureau des passeports près de chez moi', 'Que dois-je apporter au bureau des passeports?', 'Combien coûte un passeport?'],
    },
  },
];

// Every passport answer cites with the planner's titles and carries its check date, like the widget.
for (const s of passport) {
  s.checked = CHECKED;
  s.reply = { en: cite(s.reply.en), fr: cite(s.reply.fr) };
  if (s.replyIntl) for (const k of Object.keys(s.replyIntl)) s.replyIntl[k] = cite(s.replyIntl[k]!);
}

export default passport;
