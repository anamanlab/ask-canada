/** Question matchers shared by the contact scenarios (EN + FR): who is being called, TTY, and the two shapes of a scam. */
export const PHONE_EN = '(phone|number|call|contact|talk|speak|reach|hours)';
export const PHONE_FR = '(téléphone|telephone|numéro|numero|appeler|joindre|contacter|parler|heures)';
export const both = (a: string, b: string, flags = 'i') => [new RegExp(`\\b${a}\\b.*\\b${b}`, flags), new RegExp(`\\b${b}\\b.*\\b${a}\\b`, flags)];
export const TTY = /\b(tty|teletypewriter|deaf|hard of hearing|ats|sourde?s?|malentendante?s?)\b/i;
export const FRAUD = /\b(scam\w*|fraud\w*|phishing|identity theft|arnaque\w*|fraude\w*|hameçonnage|escroqu\w*|vol d[’']identité)/i;

/** A call, text or email that may be a scam, with nothing lost yet ("I think a call from the CRA was a scam"). */
const CONTACT_EN = '(calls?|called|caller|phone call|texts?|texted|sms|emails?|e-mails?|messages?|voicemails?|letters?)';
const CONTACT_FR = '(appels?|appelant|appelé|textos?|messages?( texte)?|courriels?|messages? vocal|boîte vocale|lettres?)';
export const SUSPECTED = [
  new RegExp(`\\b(think|thought|suspect|believe|wonder\\w*|not sure|unsure|worried|afraid)\\b.*\\b${CONTACT_EN}\\b.*\\b(scam\\w*|fraud\\w*|fake|phishing|real|legit\\w*)`, 'i'),
  new RegExp(`\\b${CONTACT_EN}\\b.*\\b(was|is|might be|may be|could be|seems?|seemed|looks?|looked|sounds?|sounded)\\b( like)?( a| an)? (scam|fraud|fake|phishing)`, 'i'),
  new RegExp(`\\bsuspicious\\b.*\\b${CONTACT_EN}\\b`, 'i'),
  new RegExp(`\\b${CONTACT_EN}\\b.*\\bsuspicious\\b`, 'i'),
  /\b(was|is) (this|it|that) (a |an )?(scam|fraud)\b/i,
  /\b(pretend\w*|claim\w*|said|says|saying) (to be|they (are|were)|it was|it's|they're) (from |with )?(the )?(cra|canada revenue|revenue canada|service canada|government|rcmp|police)\b/i,
  new RegExp(`\\b(pense|crois|doute|soupçonne|me demande|inquiète?)\\b.*\\b${CONTACT_FR}.*\\b(arnaque|fraude|frauduleu\\w*|faux|fausse|hameçonnage)`, 'i'),
  new RegExp(`\\b${CONTACT_FR}.*(\\s|^)(était|est|serait|semble|semblait|ressemble)\\b.*\\b(arnaque|fraude|frauduleu\\w*|faux|fausse)`, 'i'),
  new RegExp(`\\b(suspect|suspecte|louche)\\b.*\\b${CONTACT_FR}|\\b${CONTACT_FR}.*\\b(suspect|suspecte|louche)\\b`, 'i'),
  /\b(prétend\w*|se (fait|faisait) passer pour|disant (être|venir)|disait (être|venir))\b.*\b(arc|agence du revenu|service canada|gouvernement|grc|police)\b/i,
];
/** Money or details already lost: the victim steps (bank first), not the "is it a scam?" answer. */
export const LOST = [
  /\b(i was|i've been|i have been|i got|i've got|got|been|i am|i'm) (scammed|defrauded|hacked|ripped off|a victim)\b/i,
  /\b(lost|paid|sent|gave|transferred|wired|bought|took|stole)\b.*\b(money|\$|dollars|them|him|her|scammers?|gift ?cards?|bitcoin|crypto\w*|e-?transfer|my (bank|sin|card|password|banking|credit))/i,
  /\bvictime\b/i,
  /\b(j[’']ai|on m[’']a) (perdu|payé|envoyé|donné|transféré|acheté|volé)\b/i,
  /\bje me suis fait (arnaquer|avoir|escroquer|frauder)\b/i,
];
