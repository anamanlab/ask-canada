/**
 * A profile in a sentence, both ways. `profileFromText` reads one out of a question (scripted answers + the lab's
 * regression fixtures): only what the person actually said is returned, anything missing stays undefined, so the
 * widgets can say what they assumed. `profileQuestion` writes one into a follow-up question, in phrases that
 * `profileFromText` reads back (text.test.mjs checks the round trip in EN and FR).
 */
import type { Profile } from './crs';
import { uni } from './text';

const CLB_ANY = uni(/\b(?:clb|nclc)\s*(\d{1,2})\b(?:\s+(?:in|en)\s+(french|français|english|anglais))?(\s+(?:as (?:my|a) second language|comme deuxième langue))?/g);

/** The answers one person can give about themselves: age, education, language levels, work. `t` is lower case. */
function personFromText(t: string): Partial<Profile> {
  const p: Partial<Profile> = {};
  const age = t.match(uni(/\b(\d{2})\s*(?:years? old|yo|y\/o|ans)\b/)) ?? t.match(uni(/\b(?:i['’]?m|i am|age|âge|j['’]ai)\s*(\d{2})\b/));
  if (age) p.age = Number(age[1]);
  // "CLB 9, CLB 7 in French as my second language": the first level without the tail is the main test.
  for (const m of t.matchAll(CLB_ANY)) {
    if (m[3]) p.secondClb ??= Number(m[1]);
    else if (p.firstClb === undefined) {
      p.firstClb = Number(m[1]);
      if (m[2] === 'french' || m[2] === 'français') p.firstLanguage = 'fr';
    }
  }
  if (p.firstClb === undefined && uni(/\b(no language test|pas encore de test de langue)\b/).test(t)) p.firstClb = 0;
  if (p.secondClb === undefined && uni(/\b(no test in my second language|aucun test dans ma deuxième langue)\b/).test(t)) p.secondClb = 0;
  if (uni(/\b(ph\.?\s?d|doctorat\w*|doctorate)\b/).test(t)) p.education = 'phd';
  else if (uni(/\b(master['’]?s?|maîtrise|mba)\b/).test(t)) p.education = 'masters';
  else if (uni(/\b(two or more (?:credentials|degrees|diplomas)|deux diplômes ou plus)\b/).test(t)) p.education = 'two-or-more';
  else if (uni(/\b(bachelor['’]?s?|baccalauréat|degree|licence)\b/).test(t)) p.education = 'bachelors';
  else if (uni(/\b(no high school diploma|less than high school|sans diplôme d['’]études secondaires)\b/).test(t)) p.education = 'none';
  else if (uni(/\b(high school|études secondaires)\b/).test(t)) p.education = 'secondary';
  else if (uni(/\b(1-year|one-year|d['’]un an)\b/).test(t) && uni(/\b(diploma|certificate|diplôme|certificat)\b/).test(t)) p.education = 'one-year';
  else if (uni(/\b(diploma|diplôme)\b/).test(t)) p.education = 'two-year';
  const abroad = uni(/\b(abroad|outside (?:of )?canada|overseas|back home|à l['’]étranger|hors du canada|hors canada)\b/);
  const fw = t.match(uni(new RegExp(`\\b(\\d{1,2})\\s*(?:\\+\\s*)?(?:years?|ans?)\\b[^.,;]*?(?:${abroad.source})`, 'u')));
  if (fw) p.foreignWork = Number(fw[1]);
  const cw = t.match(uni(/\b(\d{1,2})\s*(?:\+\s*)?(?:years?|ans?)\b[^.,;]*?\b(?:in canada|au canada)\b/));
  if (cw && (!fw || cw.index !== fw.index)) p.canadianWork = Number(cw[1]);
  // "No work in Canada" / "no work abroad" are answers too (0 years), not missing ones.
  if (p.canadianWork === undefined && uni(/\b(no (?:skilled )?work(?: experience)? in canada|aucun travail au canada)\b/).test(t)) p.canadianWork = 0;
  if (p.foreignWork === undefined && uni(/\b(no (?:skilled )?work(?: experience)? (?:abroad|outside canada)|aucun travail à l['’]étranger)\b/).test(t)) p.foreignWork = 0;
  return p;
}

const SPOUSE_WITH = uni(/\b(?:my spouse is coming with me|mon époux ou conjoint m['’]accompagne)\s*\(([^)]*)\)/);
const STUDIED = uni(/\b(?:completed a (?:(1|2)-year program|program of (3) or more years) in canada|terminé un programme d['’]études de (\d) ans?(?: ou plus)? au canada)\b/);
const CERTIFICATE = uni(/\b(certificate of qualification|certificat de compétence)\b/);
const TRADE = uni(/\b(?:i work in a skilled trade|je travaille dans un métier spécialisé)\b/);
const JOB_OFFER = uni(/\b(?:i have|i['’]ve got|with|j['’]ai|avec) (?:a |an |une )?(?:valid )?(?:job offer|offre d['’]emploi)\b/);

/**
 * "I'm 29 with a master's, CLB 9 and 2 years of work in Canada" → { age, education, firstClb, canadianWork }.
 * Also reads everything `profileQuestion` writes: second language, job type, Canadian studies, job offer, trade
 * certificate, family in Canada, nomination, and the spouse's own answers (in brackets after the spouse phrase).
 */
export function profileFromText(text: string): Partial<Profile> {
  let t = text.toLowerCase();
  /** Reads a phrase and takes it out, so its words ("2-year program in Canada", "certificate") aren't read twice. */
  const take = (re: RegExp) => {
    const m = t.match(re);
    if (m) t = t.replace(m[0], ' ');
    return m;
  };
  const extra: Partial<Profile> = {};
  const partner = take(SPOUSE_WITH);
  if (partner) {
    const theirs = personFromText(partner[1]);
    extra.spouse = true;
    if (theirs.education) extra.spouseEducation = theirs.education;
    if (theirs.firstClb !== undefined) extra.spouseClb = theirs.firstClb;
    if (theirs.canadianWork !== undefined) extra.spouseCanadianWork = theirs.canadianWork;
  }
  const studied = take(STUDIED);
  if (studied) {
    const years = Number(studied[1] ?? studied[2] ?? studied[3]);
    extra.canadianEducation = years >= 3 ? 'long' : years === 2 ? 'two' : 'short';
  }
  if (take(CERTIFICATE)) extra.certificate = true;
  if (take(TRADE)) extra.occupation = 'trade';
  else if (uni(/\b(?:teer|feer)\s*0/).test(t)) extra.occupation = 'teer01';
  else if (uni(/\b(?:teer|feer)\s*2/).test(t)) extra.occupation = 'teer23';
  else if (uni(/\b(?:teer|feer)\s*4/).test(t)) extra.occupation = 'other';
  if (JOB_OFFER.test(t)) extra.jobOffer = true;
  if (uni(/\b(brother|sister|sibling|frère|sœur)\b/).test(t)) extra.sibling = true;
  else if (uni(/\b(close relative in canada|famille proche au canada)\b/).test(t)) extra.relative = true;
  const p: Partial<Profile> = { ...personFromText(t), ...extra };
  if (!p.spouse && uni(/\b(married|spouse|wife|husband|partner|conjoint|époux|épouse|mari[ée]?)\b/).test(t)) p.spouse = true;
  if (uni(/\b(provincial nomination|pnp nomination|nominated|désignation provinciale|désigné par)\b/).test(t)) p.nomination = true;
  return p;
}

export type QuestionKey = 'ask.eligibility' | 'ask.crs';

/**
 * A follow-up question with the answers written out ("Am I eligible for Express Entry? I’m 29, a bachelor’s
 * degree, CLB 9, 1 year of work in Canada."), so the next answer starts from what the person already said
 * instead of asking again. Only answers the person gave are stated, and every one of them that changes a score
 * or a verdict is (second language, job type, Canadian studies, job offer, certificate, family, spouse).
 * `t` is the widget's message lookup.
 */
export function profileQuestion(t: (key: string, values?: Record<string, string | number>) => string, key: QuestionKey, profile: Profile, given: readonly (keyof Profile)[]): string {
  const has = (k: keyof Profile) => given.includes(k);
  const other = profile.firstLanguage === 'fr' ? 'en' : 'fr';
  const level = (n: number, lang: string) => (n ? t('ask.clb', { n: String(n), lang }) : t('ask.noTest'));
  // The spouse's own answers ride in brackets after the spouse phrase, so they are never read as the person's.
  const theirs = [
    has('spouseEducation') ? t(`ask.edu.${profile.spouseEducation}`) : null,
    has('spouseClb') ? level(profile.spouseClb, 'en') : null,
    has('spouseCanadianWork') ? t('ask.canadianWork', { count: profile.spouseCanadianWork }) : null,
  ].filter((p): p is string => !!p);
  const parts = [
    has('age') ? t('ask.age', { age: String(profile.age) }) : null,
    has('education') ? t(`ask.edu.${profile.education}`) : null,
    has('firstClb') ? level(profile.firstClb, profile.firstLanguage) : null,
    has('secondClb') ? (profile.secondClb ? t('ask.secondClb', { n: String(profile.secondClb), lang: other }) : t('ask.noSecondTest')) : null,
    has('canadianWork') ? t('ask.canadianWork', { count: profile.canadianWork }) : null,
    has('foreignWork') ? t('ask.foreignWork', { count: profile.foreignWork }) : null,
    has('occupation') ? t(`ask.occ.${profile.occupation}`) : null,
    has('canadianEducation') && profile.canadianEducation !== 'none' ? t(`ask.cedu.${profile.canadianEducation}`) : null,
    has('jobOffer') && profile.jobOffer ? t('ask.jobOffer') : null,
    has('certificate') && profile.certificate ? t('ask.certificate') : null,
    has('sibling') && profile.sibling ? t('ask.sibling') : has('relative') && profile.relative ? t('ask.relative') : null,
    has('nomination') && profile.nomination ? t('ask.nomination') : null,
    has('spouse') && profile.spouse ? (theirs.length ? t('ask.spouseWith', { details: theirs.join(', ') }) : t('ask.spouse')) : null,
  ].filter((p): p is string => !!p);
  return parts.length ? t(key, { profile: parts.join(', ') }) : t(`${key}.plain`);
}
