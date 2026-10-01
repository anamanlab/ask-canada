/**
 * Scripted scenarios for the `civic` widget (EN + FR). Facts: widgets/civic/data.ts.
 * The "who is my MP" answer is written from the same LIVE lookup the widget shows (House of Commons),
 * so the name in the headline is never from memory.
 */
import type { Scenario } from '@/lib/scripted/types';
import { normalizeBillCode } from '../widgets/civic/build/bills';
import { HOUSE, SENATE, URLS } from '../widgets/civic/data';
import { buildFindMp } from '../widgets/civic/live/find-mp';
import { buildParliament } from '../widgets/civic/live/parliament';
import { findPostal } from '../widgets/civic/select';

type Lang = 'en' | 'fr';
type Ctx = { text: string; lang: Lang; timeZone?: string };

const MP = [
  /\b(who('?s| is)|find|what('?s| is))\b.*\b(my|our)\s+(mp|m\.p\.|member of parliament|federal (rep|representative)|riding|electoral district)\b/i,
  /\b(my|our)\s+(mp|member of parliament)\b/i,
  /\b(contact|email|call|write( to)?)\b.*\b(my|an?)\s+(mp|member of parliament)\b/i,
  /\bwhich (federal )?riding\b/i,
  /\b(mon|ma|notre)\s+(d[ée]put[ée]e?|circonscription)/i,
  /\bqui est\b.*\bd[ée]put[ée]/i,
  /\b(trouver|joindre|[ée]crire [àa])\b.*\bd[ée]put[ée]/i,
];
const POSTAL_RE = /\b[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z]\s?-?\d[ABCEGHJ-NPRSTV-Z]\d\b/i;

const REGISTER = [
  /\b(am i|are you|how (do|can) i|where (do|can) i|check (if|my|whether)|update my)\b.*\b(registered|register|registration)\b.*\bvot/i,
  /\bvoter registration\b/i,
  /\bregister(ed)? to vote\b/i,
  /\bcan i vote\b/i,
  /\b(who can|eligible to|allowed to) vote\b/i,
  /\binscri\w*\b.*\b(voter|liste [ée]lectorale|[ée]lecteurs?)\b/i,
  /\b(puis-je|peut-on|qui peut)\s+voter\b/i,
];
const VOTER_ID = [/\b(id|identification|documents?)\b.*\bto vote\b/i, /\bvoter id\b/i, /\bwhat (id|identification)\b.*\bvot/i, /\bpi[èe]ces? d['’]identit[ée].*\bvot/i];
const WAYS = [/\b(ways|how) to vote\b/i, /\b(advance poll|vote by mail|mail-in ballot|special ballot)\b/i, /\bfa[çc]ons de voter\b/i, /\bvote par (anticipation|la poste)\b/i, /\bbulletin (de vote )?sp[ée]cial\b/i];

const PARLIAMENT = [
  /\bhow (does|do) (the )?(canadian )?parliament work\b/i,
  /\bhow (does )?a bill become (a )?law\b/i,
  /\bhow (are )?laws (are )?(made|passed)\b/i,
  /\bwhat (does|is) the senate\b/i,
  /\b(bill|projet de loi)\s+[CS]-?\d{1,4}\b/i,
  /\bbills?\b.*\b(in|before|at) parliament\b/i,
  /\bis there a bill\b/i,
  /\bcomment fonctionne (le )?parlement\b/i,
  /\bcomment (un projet de loi|une loi) (devient|est adopt)/i,
  /\b[àa] quoi sert le s[ée]nat\b/i,
  /\bprojets? de loi\b.*\bparlement\b/i,
  /\by a-t-il (un|des) projets? de loi\b/i,
  /\bprojets? de loi (sur|concernant|au sujet)\b/i,
];

const BILL_CODE = /\b(bill|projet de loi)\s+[CS]-?\s?\d/i;
const BILL_TOPIC = [
  /\bis there a bill\b/i,
  /\bbills? (about|on|regarding|for)\b/i,
  /\by a-t-il (un|des) projets? de loi\b/i,
  /\bprojets? de loi (sur|concernant|au sujet)\b/i,
];

const NEWS = [
  /\b(latest|recent|today'?s|new)\b.*\b(government|federal|canada\.ca)\b.*\b(news|announcements?|press releases?|news releases?)\b/i,
  /\b(government|federal)\b.*\b(news|announcements?)\b/i,
  /\b(news|announcements?)\b.*\b(from|by) (the )?(government|ottawa|federal)\b/i,
  /\b(nouvelles|annonces|communiqu[ée]s)\b.*\b(gouvernement|f[ée]d[ée]ra)/i,
  /\bquoi de neuf\b.*\bgouvernement\b/i,
];

const topicOf = (text: string) => {
  const m = text.match(/\b(?:about|on|regarding|for|sur|concernant|au sujet d[eu'’]s?)\s+(?:the |le |la |les |l['’])?([\p{L}\s-]{3,40}?)(?:\?|\.|$)/iu);
  const t = m?.[1]?.trim();
  return t && !/^(government|gouvernement|canada|parliament|parlement)$/i.test(t) ? t : undefined;
};

function parliamentInput(text: string): { bill?: string; topic?: string } {
  const bill = normalizeBillCode(text.match(/\b(?:bill|projet de loi)\s+([CS]-?\s?\d{1,4})\b/i)?.[1]);
  const topic = bill ? undefined : /\b(bill|law|projets? de loi|loi)\b/i.test(text) ? topicOf(text) : undefined;
  return { bill, topic };
}

/** The Parliament answer, from the same LEGISinfo lookup the widget shows (general, one bill, or bills on a topic). */
async function parliamentAnswer({ text, lang }: { text: string; lang: Lang }): Promise<Record<string, string>> {
  const general = { en: `# Parliament has *three parts*, and a bill needs all three to become law.

The **House of Commons** has ${HOUSE.seats} seats, one for each riding, and each riding elects a Member of Parliament. [1](${URLS.partyStandings.en}) The **Senate** has ${SENATE.seats} senators, and every bill must pass it too. [2](${URLS.senate.en}) The **Crown**, represented by the Governor General, gives royal assent. [3](${URLS.legislativeProcess.en})

A bill goes through first reading, second reading, committee study, report stage and third reading in one chamber, then the same in the other. It becomes law only when both have passed the same text and it receives royal assent. [3](${URLS.legislativeProcess.en})

Below: the House today, the steps, and the bills that moved most recently, live from LEGISinfo. [4](${URLS.legisinfo.en})`, fr: `# Le Parlement compte *trois parties*, et un projet de loi a besoin des trois pour devenir loi.

La **Chambre des communes** compte ${HOUSE.seats} sièges, un par circonscription, et chaque circonscription élit un député. [1](${URLS.partyStandings.fr}) Le **Sénat** compte ${SENATE.seats} sénateurs, et chaque projet de loi doit aussi y être adopté. [2](${URLS.senate.fr}) La **Couronne**, représentée par le gouverneur général, accorde la sanction royale. [3](${URLS.legislativeProcess.fr})

Un projet de loi passe par la première lecture, la deuxième lecture, l’étude en comité, l’étape du rapport et la troisième lecture dans une chambre, puis les mêmes étapes dans l’autre. Il devient loi seulement quand les deux chambres ont adopté le même texte et qu’il reçoit la sanction royale. [3](${URLS.legislativeProcess.fr})

Ci-dessous : la Chambre aujourd’hui, les étapes et les projets de loi qui ont avancé le plus récemment, en direct de LEGISinfo. [4](${URLS.legisinfo.fr})` };
  const { bill, topic } = parliamentInput(text);
  if (!bill && !topic) return { answer: general[lang] };
  const fr = lang === 'fr';
  try {
    const p = await buildParliament({ bill, topic, lang }, AbortSignal.timeout(9000));
    const li = URLS.legisinfo[lang];
    const lp = URLS.legislativeProcess[lang];
    if (bill && p.focus) {
      const b = p.focus;
      const status = b.status.charAt(0).toLowerCase() + b.status.slice(1);
      const head = b.defeated
        ? fr ? `# Le projet de loi ${b.code} a été *rejeté*.` : `# Bill ${b.code} was *defeated*.`
        : b.law
        ? fr ? `# Le projet de loi ${b.code}, *${b.title}*, a reçu la sanction royale.` : `# Bill ${b.code}, the *${b.title}*, has received royal assent.`
        : fr ? `# Le projet de loi ${b.code} est *${status.replace(/\.$/, '')}*.` : `# Bill ${b.code} is *${status.replace(/\.$/, '')}*.`;
      const body = b.law
        ? fr ? `C’est maintenant une loi. Elle entre en vigueur à la date de la sanction ou à une date prévue dans la loi elle-même. [1](${b.url}) [2](${lp})` : `It is now law. It comes into force on the day of assent or on a date set in the act itself. [1](${b.url}) [2](${lp})`
        : fr ? `Son titre : « ${b.title} ». Pour devenir loi, il doit être adopté dans les mêmes termes par la Chambre des communes et le Sénat, puis recevoir la sanction royale. [1](${b.url}) [2](${lp})` : `Its title is the ${b.title}. To become law, it must pass both the House of Commons and the Senate in the same form, then receive royal assent. [1](${b.url}) [2](${lp})`;
      return { answer: `${head}\n\n${body}\n\n${fr ? 'Voici où il en est, étape par étape, en direct de LEGISinfo.' : 'Here’s where it stands, step by step, live from LEGISinfo.'}` };
    }
    if (bill) {
      return { answer: fr ? `# Nous n’avons pas trouvé le projet de loi *${bill}* dans la session actuelle.\n\nVérifiez le numéro ou cherchez dans LEGISinfo, qui présente aussi les sessions précédentes. [1](${li})` : `# We couldn’t find Bill *${bill}* in the current session.\n\nCheck the number, or search LEGISinfo, which also covers earlier sessions. [1](${li})` };
    }
    const n = p.bills.length;
    if (!n) return { answer: fr ? `# Aucun projet de loi de cette session ne mentionne *${topic}* dans son titre.\n\nLEGISinfo permet de chercher dans le texte et les sessions précédentes. [1](${li})` : `# No bill this session has *${topic}* in its title.\n\nLEGISinfo can search bill text and earlier sessions too. [1](${li})` };
    return {
      answer: fr
        ? `# ${n === 1 ? 'Un projet de loi' : `${n} projets de loi`} de cette session ${n === 1 ? 'mentionne' : 'mentionnent'} *${topic}* dans ${n === 1 ? 'son' : 'leur'} titre.\n\nLes titres et l’état de chaque projet viennent en direct de LEGISinfo, le suivi officiel du Parlement. [1](${li}) Un projet de loi devient loi seulement après son adoption par les deux chambres et la sanction royale. [2](${lp})`
        : `# ${n === 1 ? 'One bill' : `${n} bills`} this session ${n === 1 ? 'mentions' : 'mention'} *${topic}* in ${n === 1 ? 'its' : 'their'} title.\n\nTitles and status come live from LEGISinfo, Parliament’s official bill tracker. [1](${li}) A bill becomes law only after both chambers pass it and it receives royal assent. [2](${lp})`,
    };
  } catch {
    return { answer: general[lang] };
  }
}

const parliamentTool = [
  {
    toolName: 'civicParliament',
    input: ({ text, lang }: Ctx) => {
      const { bill, topic } = parliamentInput(text);
      return { lang, ...(bill ? { bill } : {}), ...(topic ? { topic } : {}) };
    },
  },
];

const civic: Scenario[] = [
  {
    id: 'civic-find-mp-postal',
    priority: 14,
    match: MP.map((re) => new RegExp(`(?=.*${re.source})(?=.*${POSTAL_RE.source})`, 'i')),
    reply: { en: '{answer}', fr: '{answer}' },
    vars: async ({ text, lang }) => {
      const postal = findPostal(text) ?? '';
      const fr = lang === 'fr';
      try {
        const r = await buildFindMp({ postalCode: postal, lang }, AbortSignal.timeout(9000));
        const riding = r.ridings[0];
        const find = URLS.findRiding[lang];
        if (r.status !== 'ok' || !riding) {
          return {
            answer: fr
              ? `# Ce code postal ne correspond à *aucune circonscription* que nous connaissons.\n\nVérifiez-le, ou cherchez avec votre adresse complète dans le Service d’information à l’électeur d’Élections Canada. [1](${find}) La Chambre des communes peut aussi trouver votre député par code postal. [2](${URLS.membersSearch.fr})`
              : `# That postal code didn’t match *a riding* we know.\n\nCheck it, or search with your full address in Elections Canada’s Voter Information Service. [1](${find}) The House of Commons can also find your MP by postal code. [2](${URLS.membersSearch.en})`,
          };
        }
        // Keep riding names whole in prose: no line break at the em dash ("Laurier—Sainte-Marie") or a hyphen ("Ottawa-Centre").
        const rn = riding.name.replace(/—/g, '\u2060—\u2060').replace(/-/g, '\u2011');
        const pc = (r.postalCode ?? '').replace(/ /g, '\u00a0');
        const mp = riding.status === 'sitting' ? riding.mp : null;
        if (mp) {
          const role = mp.roles[0];
          return {
            answer: fr
              ? `# ${mp.feminine == null ? 'Votre député ou députée est' : mp.feminine ? 'Votre députée est' : 'Votre député est'} *${mp.name}*, qui représente ${rn}.\n\nLe code postal ${pc} se trouve dans la circonscription fédérale **${rn}** (${riding.provinceName}). [1](${mp.profileUrl})${role ? ` ${mp.name} occupe aussi la fonction de ${role.charAt(0).toLowerCase()}${role.slice(1)}. [1](${mp.profileUrl})` : ''}\n\nSa fiche ci-dessous réunit son courriel, ses bureaux et la carte de votre circonscription.`
              : `# Your MP is *${mp.name}*, who represents ${rn}.\n\nPostal code ${pc} is in the federal riding of **${rn}** (${riding.provinceName}). [1](${mp.profileUrl})${role ? ` ${mp.name} also serves as ${role}. [1](${mp.profileUrl})` : ''}\n\nThe card below has their email, both offices and a map of your riding.`,
          };
        }
        if (riding.status === 'vacant') {
          return {
            answer: fr
              ? `# ${rn} n’a *pas de député* en ce moment : le siège est vacant.\n\nLe code postal ${pc} se trouve dans **${rn}** (${riding.provinceName}). Selon la Chambre des communes, ${r.house.vacant ?? 'plusieurs'} des ${HOUSE.seats} sièges sont vacants aujourd’hui. [1](${URLS.partyStandings.fr}) [2](${find})\n\nUn siège vacant le reste jusqu’à une élection partielle. Élections Canada publie les dates des élections partielles sur son site. [3](${URLS.electionsHome.fr})`
              : `# ${rn} has *no MP right now*: the seat is vacant.\n\nPostal code ${pc} is in **${rn}** (${riding.provinceName}). The House of Commons lists ${r.house.vacant ?? 'several'} of its ${HOUSE.seats} seats as vacant today. [1](${URLS.partyStandings.en}) [2](${find})\n\nA vacant seat stays empty until a by-election. Elections Canada posts by-election dates on its website. [3](${URLS.electionsHome.en})`,
          };
        }
        return {
          answer: fr
            ? `# Votre circonscription est *${rn}*.\n\nNous n’avons pas pu confirmer qui occupe ce siège en ce moment. La Chambre des communes publie la liste de tous les députés en fonction. [1](${URLS.membersSearch.fr}) [2](${find})`
            : `# Your riding is *${rn}*.\n\nWe couldn’t confirm who holds the seat right now. The House of Commons lists every current member. [1](${URLS.membersSearch.en}) [2](${find})`,
        };
      } catch {
        return {
          answer: fr
            ? `# Voici comment trouver *votre député*.\n\nLa Chambre des communes trouve votre député avec votre code postal. [1](${URLS.membersSearch.fr})`
            : `# Here’s how to find *your MP*.\n\nThe House of Commons finds your MP from your postal code. [1](${URLS.membersSearch.en})`,
        };
      }
    },
    toolCalls: [{ toolName: 'civicFindMp', input: ({ text, lang }: Ctx) => ({ postalCode: findPostal(text), lang }) }],
    followUps: {
      en: ['Am I registered to vote?', 'How does Parliament work?', 'What ID do I need to vote?'],
      fr: ['Suis-je inscrit pour voter?', 'Comment fonctionne le Parlement?', 'Quelles pièces d’identité faut-il pour voter?'],
    },
  },
  {
    id: 'civic-find-mp',
    priority: 12,
    match: MP,
    reply: {
      en: `# Your postal code is all it takes to find *your MP*.

Canada has ${HOUSE.seats} federal ridings, and each one elects a Member of Parliament to the House of Commons. [1](${URLS.partyStandings.en}) Your postal code tells us which riding you’re in; the House of Commons tells us who holds that seat today, including by-election winners and vacant seats. [2](${URLS.membersSearch.en})

Enter your postal code below to see your MP, their offices and how to reach them.`,
      fr: `# Votre code postal suffit pour trouver *votre député*.

Le Canada compte ${HOUSE.seats} circonscriptions fédérales, et chacune élit un député à la Chambre des communes. [1](${URLS.partyStandings.fr}) Votre code postal indique votre circonscription; la Chambre des communes indique qui occupe ce siège aujourd’hui, y compris après une élection partielle ou si le siège est vacant. [2](${URLS.membersSearch.fr})

Entrez votre code postal ci-dessous pour savoir qui vous représente et comment joindre ses bureaux.`,
    },
    toolCalls: [{ toolName: 'civicFindMp', input: ({ lang }: Ctx) => ({ lang }) }],
    followUps: {
      en: ['Who is my MP? My postal code is K1A 0B1', 'How does Parliament work?', 'Am I registered to vote?'],
      fr: ['Qui est mon député? Mon code postal est H2X 1Y4', 'Comment fonctionne le Parlement?', 'Suis-je inscrit pour voter?'],
    },
  },
  {
    id: 'civic-voter-id',
    priority: 11,
    match: VOTER_ID,
    reply: {
      en: `# To vote, you prove *who you are and where you live*, and there are 3 ways to do it.

**Option 1:** your driver’s licence, or any Canadian government card with your photo, name and current address. **Option 2:** two pieces of ID with your name, one showing your current address, like a health card and a bank statement. **Option 3:** no ID? Declare your identity and address in writing and have someone who knows you and is assigned to your polling station vouch for you. [1](${URLS.voterId.en})

Expired ID is accepted if it has your name and current address, and e-statements count when shown on your phone. A passport proves identity only, not address. [1](${URLS.voterId.en})

Pick what you have below to check you’re set.`,
      fr: `# Pour voter, vous prouvez *votre identité et votre adresse*, et il y a 3 façons de le faire.

**Option 1 :** votre permis de conduire, ou toute carte d’un gouvernement canadien portant vos photo, nom et adresse actuelle. **Option 2 :** deux pièces à votre nom, dont une avec votre adresse actuelle, comme une carte d’assurance-maladie et un état de compte bancaire. **Option 3 :** aucune pièce? Établissez votre identité et votre adresse par écrit et demandez à une personne qui vous connaît et qui est inscrite à votre bureau de vote de répondre de vous. [1](${URLS.voterId.fr})

Une pièce expirée est acceptée si elle porte votre nom et votre adresse actuelle, et les relevés électroniques comptent s’ils sont présentés sur votre téléphone. Le passeport prouve l’identité seulement, pas l’adresse. [1](${URLS.voterId.fr})

Choisissez ci-dessous ce que vous avez pour vérifier que tout est en règle.`,
    },
    toolCalls: [{ toolName: 'civicVoterCheck', input: ({ lang }: Ctx) => ({ focus: 'id', lang }) }],
    followUps: {
      en: ['Am I registered to vote?', 'Who is my MP?', 'How does Parliament work?'],
      fr: ['Suis-je inscrit pour voter?', 'Qui est mon député?', 'Comment fonctionne le Parlement?'],
    },
  },
  {
    id: 'civic-ways-to-vote',
    priority: 10,
    match: WAYS,
    reply: {
      en: `# Once an election is called, you can vote *4 ways*.

On **election day** at your assigned polling station; at **advance polls** on the 10th, 9th, 8th and 7th days before election day; at **any Elections Canada office** until the Tuesday before; or **by mail** with a special ballot, if you apply by 6 p.m. on the Tuesday before election day. [1](${URLS.waysToVote.en})

Whichever you pick, you’ll need to prove your identity and address. [2](${URLS.voterId.en})`,
      fr: `# Une fois l’élection déclenchée, vous pouvez voter *de 4 façons*.

**Le jour de l’élection** à votre bureau de vote; **par anticipation** les 10e, 9e, 8e et 7e jours précédant le jour de l’élection; à **n’importe quel bureau d’Élections Canada** jusqu’au mardi précédent; ou **par la poste** avec un bulletin de vote spécial, si vous en faites la demande avant 18 h le mardi précédant le jour de l’élection. [1](${URLS.waysToVote.fr})

Peu importe votre choix, vous devrez prouver votre identité et votre adresse. [2](${URLS.voterId.fr})`,
    },
    toolCalls: [{ toolName: 'civicVoterCheck', input: ({ lang }: Ctx) => ({ focus: 'ways', lang }) }],
    followUps: {
      en: ['What ID do I need to vote?', 'Am I registered to vote?', 'Who is my MP?'],
      fr: ['Quelles pièces d’identité faut-il pour voter?', 'Suis-je inscrit pour voter?', 'Qui est mon député?'],
    },
  },
  {
    id: 'civic-register',
    priority: 9,
    match: REGISTER,
    reply: {
      en: `# You can check your voter registration *online* with Elections Canada.

To register and vote in a federal election, you must be **a Canadian citizen** and **at least 18**. Registering in advance at your current address means your voter information card arrives in the mail when an election is called. [1](${URLS.register.en})

You can also keep it up to date by checking “Yes” on your tax return, by mail, or at the polls during an election. Citizens aged 14 to 17 who live in Canada can sign up as future electors. [1](${URLS.register.en}) [2](${URLS.futureElectors.en})

Answer three quick questions below; the check itself happens on Elections Canada’s secure site, and we never see your details.`,
      fr: `# Vous pouvez vérifier votre inscription *en ligne* auprès d’Élections Canada.

Pour vous inscrire et voter à une élection fédérale, vous devez être **citoyen canadien** et avoir **au moins 18 ans**. Si vous vous inscrivez d’avance à votre adresse actuelle, votre carte d’information de l’électeur arrive par la poste quand une élection est déclenchée. [1](${URLS.register.fr})

Vous pouvez aussi garder votre inscription à jour en cochant « Oui » dans votre déclaration de revenus, par la poste ou au moment de voter pendant une élection. Les citoyens de 14 à 17 ans qui vivent au Canada peuvent s’inscrire comme futurs électeurs. [1](${URLS.register.fr}) [2](${URLS.futureElectors.fr})

Répondez à trois questions rapides ci-dessous; la vérification se fait sur le site sécurisé d’Élections Canada, et nous ne voyons jamais vos renseignements.`,
    },
    toolCalls: [
      {
        toolName: 'civicVoterCheck',
        input: ({ text, lang }: Ctx) => {
          const age = Number(text.match(/\b(1[0-9]|[2-9]\d)\s*(years?|yrs?|ans)\b/i)?.[1]) || undefined;
          const pr = /\b(permanent resident|PR card|r[ée]sident permanent)\b/i.test(text);
          const citizen = /\b(i('| a)m a (canadian )?citizen|je suis citoyen)\b/i.test(text) ? true : pr ? false : undefined;
          const abroad = /\b(abroad|outside canada|live in (the )?(us|usa|uk|france)|[àa] l['’][ée]tranger)\b/i.test(text) || undefined;
          const qc = /\b(quebec|québec|montr[ée]al)\b/i.test(text) ? 'QC' : undefined;
          return { lang, ...(age ? { age } : {}), ...(citizen != null ? { citizen } : {}), ...(abroad ? { livesAbroad: true } : {}), ...(qc ? { province: qc } : {}) };
        },
      },
    ],
    followUps: {
      en: ['What ID do I need to vote?', 'What are the ways to vote?', 'Who is my MP?'],
      fr: ['Quelles pièces d’identité faut-il pour voter?', 'Quelles sont les façons de voter?', 'Qui est mon député?'],
    },
  },
  {
    // "Where is Bill C-25 now?": its own chips, so Ask next never repeats the question just answered.
    id: 'civic-parliament-bill',
    priority: 9,
    match: [BILL_CODE],
    reply: { en: '{answer}', fr: '{answer}' },
    vars: parliamentAnswer,
    toolCalls: parliamentTool,
    followUps: {
      en: ['How does a bill become law?', 'Is there a bill about housing?', 'Who is my MP?'],
      fr: ['Comment un projet de loi devient-il loi?', 'Y a-t-il un projet de loi sur le logement?', 'Qui est mon député?'],
    },
  },
  {
    // "Is there a bill about housing?": chips point to a specific bill and the process instead.
    id: 'civic-parliament-topic',
    priority: 8.5,
    match: BILL_TOPIC,
    reply: { en: '{answer}', fr: '{answer}' },
    vars: parliamentAnswer,
    toolCalls: parliamentTool,
    followUps: {
      en: ['Where is Bill C-2 now?', 'How does a bill become law?', 'Who is my MP?'],
      fr: ['Où en est le projet de loi C-2?', 'Comment un projet de loi devient-il loi?', 'Qui est mon député?'],
    },
  },
  {
    id: 'civic-parliament',
    priority: 8,
    match: PARLIAMENT,
    reply: { en: '{answer}', fr: '{answer}' },
    vars: parliamentAnswer,
    toolCalls: parliamentTool,
    followUps: {
      en: ['Who is my MP?', 'Where is Bill C-25 now?', 'How does a bill become law?'],
      fr: ['Qui est mon député?', 'Où en est le projet de loi C-25?', 'Comment un projet de loi devient-il loi?'],
    },
  },
  {
    id: 'civic-news',
    priority: 6,
    match: NEWS,
    reply: {
      en: `# {headEn}

These are the newest items published on canada.ca (news releases, statements, advisories, readouts and more), live. [1](${URLS.news.en})

Filter by type below, or open any item to read it in full on canada.ca.`,
      fr: `# {headFr}

Ce sont les plus récentes publications de canada.ca (communiqués, déclarations, avis aux médias, comptes rendus et plus), en direct. [1](${URLS.news.fr})

Filtrez par type ci-dessous, ou ouvrez un article pour le lire en entier sur canada.ca.`,
    },
    vars: ({ text }) => {
      const topic = topicOf(text);
      return {
        headEn: topic ? `Here’s the latest Government of Canada news about *${topic}*.` : 'Here’s *the latest* from Government of Canada departments.',
        headFr: topic ? `Voici les dernières nouvelles du gouvernement du Canada au sujet de *« ${topic} »*.` : 'Voici *les dernières nouvelles* des ministères du gouvernement du Canada.',
      };
    },
    toolCalls: [{ toolName: 'civicNews', input: ({ text, lang }: Ctx) => ({ lang, ...(topicOf(text) ? { topic: topicOf(text) } : {}) }) }],
    followUps: {
      en: ['Is there a bill about housing?', 'How does Parliament work?', 'Who is my MP?'],
      fr: ['Y a-t-il un projet de loi sur le logement?', 'Comment fonctionne le Parlement?', 'Qui est mon député?'],
    },
  },
];

export default civic;
