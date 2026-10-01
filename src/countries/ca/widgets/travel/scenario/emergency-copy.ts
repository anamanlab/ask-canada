/** Answer text for emergencies abroad and lost passports: local numbers, the main Canadian office, the Centre in Ottawa. */
import { buildEmergency } from '../build';
import { findCountry } from '../countries';
import { EWRC } from '../data';
import { FrIn, frIn } from '../fr';
import { canadaPhone } from '../phone';
import { emergencyGroups } from '../select';
import type { Lang } from '../types';
import { cite, citeUrl, destCite, destTitle, mainOffice, nb, phoneText, safe } from './text';

/**
 * "In Mexico, call *911* in an emergency." When a country has one number per service (Japan: police 110,
 * ambulance and fire 119), every number is named: "In Japan, call *110* (police) or 119 (medical
 * assistance, firefighters)."
 */
function localHeadline(name: string, e: { primary?: string; numbers: { label: string; number: string }[] }, lang: Lang): string {
  const fr = lang === 'fr';
  const where = fr ? FrIn(name) : `In ${name}`;
  if (e.primary) return fr ? `${where}, composez le *${e.primary}* en cas d’urgence.` : `${where}, call *${e.primary}* in an emergency.`;
  const list = emergencyGroups(e).map((g) => [g.number, g.labels] as [string, string[]]);
  if (!list.length) return fr ? `${where}, *appelez d’abord les services d’urgence locaux.*` : `${where}, *call local emergency services first.*`;
  if (list.length === 1) return fr ? `${where}, composez le *${list[0][0]}* en cas d’urgence.` : `${where}, call *${list[0][0]}* in an emergency.`;
  const part = ([num, labels]: [string, string[]], i: number) => `${i === 0 ? `*${num}*` : num} (${safe(labels.join(', '))})`;
  const parts = list.map(part);
  const joined = `${parts.slice(0, -1).join(', ')} ${fr ? 'ou le' : 'or'} ${parts[parts.length - 1]}`;
  return fr ? `${where}, composez le ${joined}.` : `${where}, call ${joined}.`;
}

export async function emergencyFor(text: string, lang: Lang) {
  const fr = lang === 'fr';
  const hasPlace = !!findCountry(text);
  const out = hasPlace ? await buildEmergency({ destination: text, lang }) : null;
  const c = out?.country;
  const missing = out?.countryMissing;
  if (!c && missing?.url) {
    // The place is known but its feed didn't answer: the card links to its official page, and so does the text.
    const name = safe(missing.query);
    const page = citeUrl(2, missing.url, destTitle(name, lang));
    const lostCite = cite(3, 'lostStolen', lang);
    return fr
      ? { headline: 'En danger immédiat? *Appelez d’abord les services d’urgence locaux.*', local: `Ensuite, le bureau du Canada le plus proche ou le Centre peut vous aider. La page officielle de cette destination (${name}) donne les numéros d’urgence locaux et les bureaux du Canada. ${page}`, lostCite }
      : { headline: 'In immediate danger? *Call local emergency services first.*', local: `Then the nearest Canadian office or the Centre can help. The official page for ${name} lists the local emergency numbers and the Canadian offices. ${page}`, lostCite };
  }
  if (!c) {
    const lostCite = cite(2, 'lostStolen', lang);
    return fr
      ? { headline: 'En danger immédiat? *Appelez d’abord les services d’urgence locaux.*', local: 'Ensuite, le bureau du Canada le plus proche ou le Centre peut vous aider. Dites-moi où vous êtes pour obtenir les numéros locaux.', lostCite }
      : { headline: 'In immediate danger? *Call local emergency services first.*', local: 'Then the nearest Canadian office or the Centre can help. Tell me where you are to get the local numbers.', lostCite };
  }
  // Citations in reading order: the Centre [1], the destination [2], lost or stolen passports [3].
  const lostCite = cite(3, 'lostStolen', lang);
  const office = mainOffice(c.offices);
  const officeLine = office
    ? fr
      ? `Principal bureau du Canada : ${safe(office.type)}, ${safe(office.city)}${office.phone ? `, ${phoneText(office.phone, c.iso)}` : ''}. `
      : `Main Canadian office: ${safe(office.type)}, ${safe(office.city)}${office.phone ? `, ${phoneText(office.phone, c.iso)}` : ''}. `
    : '';
  return {
    headline: localHeadline(c.name, c.emergency, lang),
    local: fr
      ? `${c.tollFree ? `${FrIn(c.name)}, le Centre est aussi joignable sans frais au ${nb(c.tollFree)}. ` : ''}${officeLine}${destCite(2, c, 'fr')}`
      : `${c.tollFree ? `From ${safe(c.name)}, you can also reach the Centre toll-free at ${nb(c.tollFree)}. ` : ''}${officeLine}${destCite(2, c, 'en')}`,
    lostCite,
  };
}

export async function lostPassportFor(text: string, lang: Lang) {
  const fr = lang === 'fr';
  const row = findCountry(text);
  const out = row ? await buildEmergency({ destination: text, lang }) : null;
  const c = out?.country ?? null;
  const name = c?.name ?? (row ? (fr ? row[2] : row[1]) : '');
  // Citations in reading order: the lost-and-stolen page, the destination's page (if any), the Centre.
  const n = { lost: 1, dest: 2, ewrc: c ? 3 : 2 };
  const office = c ? mainOffice(c.offices) : undefined;
  const more = c ? c.offices.length - 1 : 0;
  const officePhone = office?.phone && c ? phoneText(office.phone, c.iso) : '';
  const headline = fr
    ? name
      ? `Passeport perdu ou volé ${safe(FrIn(name).replace(/^./, (m) => m.toLowerCase()))}? *Communiquez avec le bureau du Canada le plus proche.*`
      : 'Passeport perdu ou volé à l’étranger? *Communiquez avec le bureau du Canada le plus proche.*'
    : name
      ? `Lost or stolen passport in ${safe(name)}? *Contact the nearest Canadian office.*`
      : 'Lost or stolen passport abroad? *Contact the nearest Canadian office.*';
  const p1 = fr
    ? `Faites-le dès que possible. Si vous devez voyager de toute urgence, vous pouvez y demander un passeport d’urgence, mais ce service n’est pas offert dans tous les bureaux canadiens à l’étranger. ${cite(n.lost, 'lostStolen', 'fr')}`
    : `Do it as soon as you can. If you urgently need to travel, you can apply for an emergency passport there, but not every Canadian office abroad offers this service. ${cite(n.lost, 'lostStolen', 'en')}`;
  const p2 = fr
    ? `Rendez-vous dans un endroit sûr et signalez l’incident à la police locale. Demandez un rapport de police si possible : il n’est pas exigé pour remplacer votre passeport, mais il peut aider pour une réclamation d’assurance. ${cite(n.lost, 'lostStolen', 'fr')}`
    : `Get to a safe place and report it to the local police. Ask for a police report if you can: you don’t need one to replace your passport, but it can help with an insurance claim. ${cite(n.lost, 'lostStolen', 'en')}`;
  const p3 = c
    ? fr
      ? `${office ? `${safe(office.type)}, ${safe(office.city)}${officePhone ? ` : ${officePhone}` : ''}${office.passportServices ? ' (services de passeport offerts)' : ''}. ${more > 0 ? `La liste ci-dessous présente les ${more + 1} bureaux du Canada ${frIn(safe(name))}. ` : ''}` : ''}${c.tollFree ? `${FrIn(name)}, le Centre est aussi joignable sans frais au ${nb(c.tollFree)}. ` : ''}${destCite(n.dest, c, 'fr')}`
      : `${office ? `${safe(office.type)}, ${safe(office.city)}${officePhone ? `: ${officePhone}` : ''}${office.passportServices ? ' (passport services available)' : ''}. ${more > 0 ? `The list below has all ${more + 1} Canadian offices in ${safe(name)}. ` : ''}` : ''}${c.tollFree ? `From ${safe(name)}, you can also reach the Centre toll-free at ${nb(c.tollFree)}. ` : ''}${destCite(n.dest, c, 'en')}`
    : '';
  const p4 = fr
    ? `Si c’est urgent ou si le bureau est fermé, le Centre de surveillance et d’intervention d’urgence à Ottawa répond 24 heures sur 24 : composez le ${nb(canadaPhone(EWRC.collect.label))} (à frais virés si possible) ou écrivez à ${EWRC.email.label}. ${cite(n.ewrc, 'emergency', 'fr')}`
    : `If it’s urgent or the office is closed, the Emergency Watch and Response Centre in Ottawa answers 24/7: call ${nb(canadaPhone(EWRC.collect.label))} (collect where available) or email ${EWRC.email.label}. ${cite(n.ewrc, 'emergency', 'en')}`;
  const close = fr
    ? c
      ? 'Voici les numéros d’urgence locaux, les bureaux du Canada et toutes les façons de joindre le Centre.'
      : name
        ? `Voici toutes les façons de joindre le Centre, avec le lien vers la page officielle de cette destination (${safe(name)}), qui donne les bureaux du Canada et leurs numéros.`
        : 'Dites-moi dans quel pays vous êtes pour voir le bureau le plus proche et son numéro. Voici toutes les façons de joindre le Centre.'
    : c
      ? 'Here are the local emergency numbers, the Canadian offices and every way to reach the Centre.'
      : name
        ? `Here’s every way to reach the Centre, with a link to the official page for ${safe(name)}, which lists the Canadian offices and their numbers.`
        : 'Tell me which country you’re in to see the nearest office and its number. Here’s every way to reach the Centre.';
  return { headline, body: [p1, p2, p3, p4, close].filter(Boolean).join('\n\n') };
}
