/**
 * What each offices scenario says (EN + FR), computed per message: the verdict heading and the paragraphs that
 * depend on the place, the time and the nearest office. scenarios/offices.ts keeps the matching and the reply
 * frames; "is it open today?" lives in ./scenario-open.ts. Facts: ./data.ts.
 */
import { URLS } from './data';
import { closedNote, describe, dist, focusOf, NB, NBH, nearestFor, passportNeed, where, type Ctx } from './scenario-helpers';

/**
 * With no place in the message, the card either reuses a place searched earlier on this page (the server
 * can't know) or asks for one. These sentences are true in both cases.
 */
const ASK_BELOW = {
  en: 'The finder below lists the nearest offices. If it asks where you are, enter your postal code or town, or share your location.',
  fr: 'L’outil ci-dessous présente les bureaux les plus proches. S’il vous demande où vous êtes, entrez votre code postal ou votre ville, ou partagez votre position.',
};
/** Passport offices: the nearest place for the need (regular, urgent, express), or a request for a place. */
export async function passportVars({ text, lang }: Ctx) {
  const need = passportNeed(text);
  const fr = lang === 'fr';
  const w = where(text, lang);
  const n = w ? await nearestFor(text, lang, need) : null;
  const what = {
    passport: { en: 'place to apply for a passport', fr: 'endroit où présenter une demande de passeport' },
    'passport-urgent': { en: `urgent pick${NBH}up`, fr: 'point de retrait urgent' },
    'passport-express': { en: `express pick${NBH}up`, fr: 'point de retrait express' },
  }[need as 'passport' | 'passport-urgent' | 'passport-express'];

  const urgentBody = fr
    ? `Le retrait urgent vous remet le passeport d’ici la fin du jour ouvrable suivant. Apportez une preuve de voyage, comme un billet d’avion, d’autobus ou de train, ou un itinéraire qui montre le paiement. [1](${URLS.urgent.fr}) Seuls les bureaux des passeports offrent ce service. [2](${URLS.finderPassport.fr})`
    : `Urgent pick-up gets you the passport by the end of the next business day. Bring proof of travel, like an airline, bus or train ticket, or an itinerary that shows payment. [1](${URLS.urgent.en}) Only passport offices offer it. [2](${URLS.finderPassport.en})`;
  const expressBody = fr
    ? `Le retrait express prend de 2 à 9 jours ouvrables dans la plupart des bureaux des passeports, mais de 4 à 9 jours à Kelowna et à Pointe-Claire, et de 3 à 9 jours à Charlottetown. Il se fait seulement dans un bureau des passeports; apportez une preuve de voyage. [1](${URLS.urgent.fr}) [2](${URLS.finderPassport.fr})`
    : `Express pick-up takes 2 to 9 business days at most passport offices, but 4 to 9 in Kelowna and Pointe-Claire, and 3 to 9 in Charlottetown. It’s only offered at passport offices, so bring proof of travel. [1](${URLS.urgent.en}) [2](${URLS.finderPassport.en})`;
  const regularBody = fr
    ? `Tout Centre Service Canada qui offre des services de passeport accepte un renouvellement, une demande pour adulte ou la plupart des demandes pour enfant; le service urgent ou express exige un bureau des passeports. [1](${URLS.submitAtScc.fr}) Dans la plupart des points de service, le rendez-vous est facultatif : réservez sur eServiceCanada ou présentez-vous sur place. [2](${URLS.booking.fr})`
    : `Any Service Canada Centre with passport services can take a renewal, an adult application or most child applications; urgent and express service needs a passport office. [1](${URLS.submitAtScc.en}) At most locations, appointments are optional: book on eServiceCanada or walk in. [2](${URLS.booking.en})`;
  const body = need === 'passport-urgent' ? urgentBody : need === 'passport-express' ? expressBody : regularBody;

  if (n) {
    // A passport search names the true passport office (pick-up, urgent, express) and keeps the closer
    // Service Canada Centre, which only mails the passport, as the second option: same as the widget.
    if (need === 'passport' && n.passportOffice) {
      const also = n.also && !n.approx
        ? fr
          ? ` Un Centre Service Canada à ${n.also.km}, **${n.also.name}**, accepte aussi les demandes${n.also.mailOnly ? ` (20${NB}jours ouvrables, par la poste)` : ''}.`
          : ` A Service Canada Centre ${n.also.km} away, **${n.also.name}**, also takes applications${n.also.mailOnly ? ` (20${NB}business days, by mail)` : ''}.`
        : '';
      const at = n.street ? (fr ? `, au ${n.street}` : ` at ${n.street}`) : '';
      return {
        head: fr
          ? `Le bureau des passeports le plus proche est celui de *${n.name}*${at}${dist(n, lang)}.`
          : `The nearest passport office is the *${n.name}* office${at}${dist(n, lang)}.`,
        body: `${n.status}${also}\n\n${body}`,
      };
    }
    const office = need === 'passport' && n.office && !n.approx
      ? fr
        ? ` Pour un retrait urgent, express ou en personne, le bureau des passeports le plus proche est **${n.office.name}**, à ${n.office.km}.`
        : ` For urgent, express or in-person pick-up, the nearest passport office is **${n.office.name}**, ${n.office.km} away.`
      : '';
    return {
      head: fr ? `Le ${what.fr} le plus proche est ${describe(n, lang, '*')}${dist(n, lang)}.` : `The closest ${what.en} is ${describe(n, lang, '*')}${dist(n, lang)}.`,
      body: `${closedNote(n, lang)}${n.status}${office}\n\n${body}`,
    };
  }
  if (w) {
    return {
      head: fr ? `Voici les bureaux des passeports les plus proches de ${w}.` : `Here are the passport offices closest to ${w}.`,
      body,
    };
  }
  // No place in this message: the card reuses an earlier search or asks. Short: the full answer comes with the results.
  const ask = {
    passport: { en: 'I can find the *closest passport office* from your postal code or town.', fr: 'Je peux trouver le *bureau des passeports le plus proche* à partir de votre code postal ou de votre ville.' },
    'passport-urgent': { en: `I can find the *closest urgent passport pick${NBH}up* from your postal code or town.`, fr: 'Je peux trouver le *point de retrait urgent le plus proche* à partir de votre code postal ou de votre ville.' },
    'passport-express': { en: `I can find the *closest express passport pick${NBH}up* from your postal code or town.`, fr: 'Je peux trouver le *point de retrait express le plus proche* à partir de votre code postal ou de votre ville.' },
  }[need as 'passport' | 'passport-urgent' | 'passport-express'];
  const short = fr
    ? `Plus de 300 Centres Service Canada acceptent les demandes de passeport, mais seuls les bureaux des passeports offrent le service urgent ou express. [1](${URLS.submitAtScc.fr})\n\n${ASK_BELOW.fr}`
    : `Over 300 Service Canada Centres take passport applications, but only passport offices do urgent and express service. [1](${URLS.submitAtScc.en})\n\n${ASK_BELOW.en}`;
  return { head: ask[lang], body: short };
}

/** Biometrics: the nearest location that collects them, by appointment. */
export async function biometricsVars({ text, lang }: Ctx) {
  const n = where(text, lang) ? await nearestFor(text, lang, 'biometrics') : null;
  if (n) {
    return {
      head: lang === 'fr' ? `Le point de service biométrique le plus proche est ${describe(n, lang, '*')}${dist(n, lang)}, sur rendez-vous.` : `The closest biometrics location is ${describe(n, lang, '*')}${dist(n, lang)}, by appointment.`,
      status: `${n.status} `,
    };
  }
  return {
    head:
      lang === 'fr'
        ? 'Vous pouvez fournir vos données biométriques dans *les points de service de Service Canada qui l’offrent*, sur rendez-vous seulement.'
        : 'You can give biometrics at *Service Canada locations that offer it*, by appointment only.',
    status: '',
  };
}

/** Nearest Service Canada Centre, or a request for a place. */
export async function nearVars({ text, lang }: Ctx) {
  const fr = lang === 'fr';
  const w = where(text, lang);
  const n = w ? await nearestFor(text, lang, 'any') : null;
  const head = n
    ? fr
      ? `Le Centre Service Canada ${n.closed ? 'en service ' : ''}le plus proche est ${describe(n, lang, '*', { kind: false })}${dist(n, lang)}.`
      : `The closest Service Canada Centre ${n.closed ? 'in service ' : ''}is ${describe(n, lang, '*', { kind: false })}${dist(n, lang)}.`
    : w
      ? fr
        ? `Voici les Centres Service Canada *les plus proches* de ${w}.`
        : `Here are the Service Canada Centres *closest* to ${w}.`
      : fr
        ? 'Je peux trouver le *Centre Service Canada le plus proche* à partir de votre code postal ou de votre ville.'
        : 'I can find the *closest Service Canada Centre* from your postal code or town.';
  const tail = w
    ? fr
      ? 'Touchez un bureau ci-dessous pour ses heures, l’accessibilité et l’itinéraire.'
      : 'Tap an office below for its hours, accessibility and directions.'
    : ASK_BELOW[lang];
  return { head, status: n?.status ? `${closedNote(n, lang)}${n.status}\n\n` : '', tail };
}

/** "Do I need an appointment?": by what the visit is for (passport, biometrics, anything else). */
export function appointmentVars({ text, lang }: Ctx) {
  const f = focusOf(text);
  const H = {
    passport: { en: 'For a passport, an appointment is *optional*.', fr: 'Pour un passeport, le rendez-vous est *facultatif*.' },
    biometrics: { en: 'To give biometrics, you *need an appointment*.', fr: 'Pour fournir vos données biométriques, *il faut un rendez-vous*.' },
    other: { en: 'No — you can *walk in* to most Service Canada Centres during opening hours.', fr: 'Non : vous pouvez vous présenter *sans rendez-vous* dans la plupart des Centres Service Canada.' },
  };
  const B = {
    passport: {
      en: `You can book a passport appointment on eServiceCanada to plan your visit. Appointments depend on availability, and most locations also serve you without one. Need it by the end of the next business day? Go to a location with urgent pick-up. [1](${URLS.booking.en}) [2](${URLS.finderPassport.en})`,
      fr: `Vous pouvez réserver un rendez-vous pour votre passeport sur eServiceCanada afin de planifier votre visite. Les rendez-vous dépendent des disponibilités, et la plupart des points de service vous accueillent aussi sans rendez-vous. Besoin du passeport d’ici la fin du jour ouvrable suivant? Rendez-vous à un point de service qui offre le retrait urgent. [1](${URLS.booking.fr}) [2](${URLS.finderPassport.fr})`,
    },
    biometrics: {
      en: `Book on eServiceCanada with the application number from your Biometric Instruction Letter. It takes about 5 to 15 minutes. Bring the letter and the passport or travel document you used to apply. [1](${URLS.booking.en})`,
      fr: `Réservez sur eServiceCanada avec le numéro de demande inscrit dans votre lettre d’instructions relative à la biométrie. Cela prend environ 5 à 15 minutes. Apportez la lettre et le passeport ou le titre de voyage utilisé pour votre demande. [1](${URLS.booking.fr})`,
    },
    other: {
      en: `If no appointment is available, you can still visit a Service Canada location without one; a few centres, like Kingston, take appointments only. [1](${URLS.booking.en}) [2](${URLS.finder.en})

Rather not wait in line? Send an eServiceCanada service request and an officer calls you within 2 business days, then books a visit if you need one. Don’t include your SIN or financial or medical details in the comments. [3](${URLS.callback.en})`,
      fr: `Si aucun rendez-vous n’est disponible, vous pouvez tout de même vous présenter à un point de service de Service Canada; quelques centres, comme celui de Kingston, fonctionnent sur rendez-vous seulement. [1](${URLS.booking.fr}) [2](${URLS.finder.fr})

Vous préférez ne pas attendre? Envoyez une demande de services eServiceCanada : un agent vous appelle dans les 2 jours ouvrables et vous fixe une visite au besoin. N’inscrivez pas votre NAS ni de renseignements financiers ou médicaux dans les commentaires. [3](${URLS.callback.fr})`,
    },
  };
  const O = {
    passport: { en: 'The card below walks you through it and hands you off to the official booking page.', fr: 'La fiche ci-dessous vous guide et vous mène à la page officielle de réservation.' },
    biometrics: { en: 'The card below walks you through it and hands you off to the official booking page.', fr: 'La fiche ci-dessous vous guide et vous mène à la page officielle de réservation.' },
    other: {
      en: 'The card below has the call-back request and the contact page and phone line for each program: EI, CPP and OAS, SIN, the dental care plan and the disability benefit.',
      fr: 'La fiche ci-dessous présente la demande de rappel ainsi que la page de contact et la ligne téléphonique de chaque programme : AE, RPC et SV, NAS, soins dentaires et prestation pour les personnes handicapées.',
    },
  };
  return { head: H[f][lang], body: B[f][lang], outro: O[f][lang] };
}
