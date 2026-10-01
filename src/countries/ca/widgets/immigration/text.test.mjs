// Question-reading checks (EN + FR at parity): node --test src/countries/ca/widgets/immigration/text.test.mjs
import { register } from 'node:module';
import { test } from 'node:test';
import assert from 'node:assert/strict';

register('../../../../../scripts/lib/ts-hooks.mjs', import.meta.url);
const { programFromText, uni } = await import('./text.ts');
const { profileFromText, profileQuestion } = await import('./parse.ts');
const { msg } = await import('./scenario-copy/shared.ts');
const { assumedFields, normalizeProfile } = await import('./crs.ts');
const { countryFromText } = await import('./countries.ts');
const { default: scenarios } = await import('../../scenarios/immigration.ts');
// Same ranking as the scripted engine's pickScenario (src/lib/scripted/engine.ts), over the immigration answers.
const pickScenario = (list, text) => {
  const allowed = list.filter((s) => !s.exclude?.some((re) => re.test(text)));
  return allowed.filter((s) => s.match.some((re) => re.test(text))).sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))[0];
};

test('uni() treats accented letters as part of a word', () => {
  assert.ok(uni(/\bétudes\b/i).test('Délais de traitement du permis d’études'));
  assert.ok(uni(/\bcitoyenneté\b/i).test('Délais de traitement de la citoyenneté?'));
  assert.ok(!uni(/\bmari\b/i).test('Je suis marié'));
  assert.ok(!uni(/\bave\b/i).test('avec mon conjoint'));
  // Already-converted patterns stay valid (idempotent).
  assert.equal(uni(uni(/\bé\b/)).source, uni(/\bé\b/).source);
});

// [question, expected processing-time row]
const TIMES = [
  ['Study permit processing times', 'study'],
  ['Délais de traitement du permis d’études', 'study'],
  ['How long does a study permit take from India?', 'study'],
  ['Combien de temps prend un permis d’études depuis l’Inde?', 'study'],
  ['Wait time for an international student', 'study'],
  ['Délai pour un étudiant étranger', 'study'],
  ['Délai pour une étudiante étrangère', 'study'],
  ['How long to extend my study permit?', 'study-extension'],
  ['Délai de prolongation du permis d’études', 'study-extension'],
  ['Délais de traitement pour prolonger mon permis de travail', 'work-extension'],
  ['Work permit processing times', 'work'],
  ['Délais de traitement du permis de travail', 'work'],
  ['How long does spouse sponsorship take in Canada?', 'spouse-inside'],
  ['Combien de temps pour mon épouse au Canada?', 'spouse-inside'],
  ['Combien de temps pour parrainer mon époux?', 'spouse-outside'],
  ['Citizenship processing times', 'citizenship'],
  ['Délais de traitement de la citoyenneté', 'citizenship'],
  ['Délais de traitement de la preuve de citoyenneté', 'citizenship-proof'],
  ['Visitor visa processing times', 'visitor'],
  ['Délais de traitement du visa de visiteur', 'visitor'],
  ['Prolongation de la fiche de visiteur : délais', 'visitor-extension'],
  ['How long does an eTA take?', 'eta'],
  ['Combien de temps pour une AVE?', 'eta'],
  ['How long does a super visa take from India?', 'supervisa'],
  ['Combien de temps prend un super visa depuis l’Inde?', 'supervisa'],
  ['PR card processing times', 'pr-card'],
  ['Délais de traitement de la carte de résident permanent', 'pr-card'],
  ['How long does Express Entry take?', 'cec'],
  ['Combien de temps prend Entrée express?', 'cec'],
  ['Federal skilled worker processing time', 'fsw'],
  ['Délais de traitement des travailleurs qualifiés', 'fsw'],
];
test('programFromText: EN and FR phrasings reach the same row', () => {
  for (const [q, want] of TIMES) assert.equal(programFromText(q), want, q);
});

// [EN question, FR question, expected scenario]
const PAIRS = [
  ['I want to study in Canada', 'Je veux étudier au Canada', 'immigration-permits'],
  ['Can I study in Canada?', 'Est-ce que je peux étudier au Canada?', 'immigration-permits'],
  ['I’m an international student, can I work?', 'Je suis étudiant étranger, puis-je travailler?', 'immigration-permits'],
  ['How do I get a study permit?', 'Comment obtenir un permis d’études?', 'immigration-permits'],
  ['How do I get a work permit?', 'Comment obtenir un permis de travail?', 'immigration-permits'],
  ['Am I eligible for Express Entry?', 'Suis-je éligible à Entrée express?', 'immigration-eligibility'],
  ['Am I eligible for Express Entry?', 'Suis-je admissible à Entrée express?', 'immigration-eligibility'],
  ['Can I immigrate to Canada?', 'Puis-je immigrer au Canada?', 'immigration-eligibility'],
  ['What’s my CRS score?', 'Quelle est ma note SCG?', 'immigration-crs'],
  ['What was the latest Express Entry draw?', 'Quelle a été la dernière ronde d’Entrée express?', 'immigration-draw'],
  ['Study permit processing times', 'Délais de traitement du permis d’études', 'immigration-times'],
  ['How long does a study permit take from India?', 'Combien de temps prend un permis d’études depuis l’Inde?', 'immigration-times'],
  ['Wait time for an international student', 'Délai pour un étudiant étranger', 'immigration-times'],
  ['How long does spouse sponsorship take?', 'Combien de temps pour mon épouse au Canada?', 'immigration-times'],
  ['Do I need a visa to visit Canada?', 'Ai-je besoin d’un visa pour visiter le Canada?', 'immigration-visa'],
  ['Visitor visa processing times', 'Délais de traitement du visa de visiteur', 'immigration-times'],
  ['Sponsor my parents', 'Parrainer mes parents', 'immigration-parents'],
];
test('scenario matching: every EN question and its FR twin reach the same answer', () => {
  for (const [en, fr, want] of PAIRS) {
    assert.equal(pickScenario(scenarios, en, false)?.id, want, en);
    assert.equal(pickScenario(scenarios, fr, false)?.id, want, fr);
  }
});

test('every follow-up chip the immigration answers offer reaches an immigration answer', () => {
  for (const s of scenarios.filter((x) => x.id.startsWith('immigration-'))) {
    for (const lang of ['en', 'fr']) {
      for (const q of s.followUps?.[lang] ?? []) {
        const hit = pickScenario(scenarios, q, false);
        assert.ok(hit, `${s.id} ${lang}: “${q}” reached no immigration answer`);
      }
    }
  }
  assert.equal(programFromText('Délais de traitement du permis d’études'), programFromText('Study permit processing times'));
});

test('“can I work while I study?” leads with the work answer in EN and FR', async () => {
  const s = scenarios.find((x) => x.id === 'immigration-permits');
  for (const [q, lang] of [['I’m an international student, can I work?', 'en'], ['Je suis étudiant étranger, puis-je travailler?', 'fr'], ['Can I work while studying in Canada?', 'en'], ['Est-ce que je peux travailler pendant mes études au Canada?', 'fr']]) {
    assert.equal(pickScenario(scenarios, q)?.id, 'immigration-permits', q);
    const v = await s.vars({ text: q, lang });
    assert.match(v.headline, /24/, q);
  }
});

test('profileFromText reads French answers as well as English', () => {
  const en = profileFromText('I’m 29 with a master’s, CLB 9, 2 years of work in Canada and 3 years abroad');
  const fr = profileFromText('J’ai 29 ans, une maîtrise, NCLC 9, 2 ans de travail au Canada et 3 ans à l’étranger');
  assert.deepEqual(fr, en);
  assert.equal(profileFromText('Mon âge 31, un baccalauréat').education, 'bachelors');
  assert.equal(profileFromText('Mon âge 31, un baccalauréat').age, 31);
  assert.equal(profileFromText('J’ai un diplôme de 2 ans').education, 'two-year');
  assert.equal(profileFromText('avec mon épouse').spouse, true);
});

test('a follow-up asked from a widget carries the answers: profileQuestion → profileFromText round trip, EN and FR', () => {
  const PROFILES = [
    { age: 29, education: 'bachelors', firstClb: 9, canadianWork: 1 },
    { age: 33, education: 'masters', firstClb: 10, canadianWork: 3, foreignWork: 3, spouse: true },
    { age: 44, education: 'secondary', firstClb: 6, canadianWork: 0, foreignWork: 5 },
    { age: 27, education: 'bachelors', firstLanguage: 'fr', firstClb: 8, foreignWork: 2 },
    { age: 31, education: 'two-year', firstClb: 7, canadianWork: 2, foreignWork: 0, nomination: true },
    { age: 38, education: 'one-year', firstClb: 0, foreignWork: 4 },
    { age: 24, education: 'none', firstClb: 5, canadianWork: 0 },
    { age: 35, education: 'two-or-more', firstClb: 9, canadianWork: 1 },
    { age: 40, education: 'phd', firstClb: 9, foreignWork: 6 },
    // Everything else a person can set in the widgets travels too (round 4: "with these answers" dropped these).
    { age: 29, education: 'bachelors', firstClb: 9, secondClb: 7, canadianWork: 1 },
    { age: 27, education: 'bachelors', firstLanguage: 'fr', firstClb: 8, secondClb: 5, foreignWork: 2, occupation: 'teer23' },
    { age: 30, education: 'masters', firstClb: 9, secondClb: 0, canadianWork: 1, foreignWork: 3, occupation: 'teer01', canadianEducation: 'long', jobOffer: true, relative: true },
    { age: 38, education: 'secondary', firstClb: 5, foreignWork: 4, occupation: 'trade', certificate: true, canadianEducation: 'short' },
    { age: 26, education: 'two-year', firstClb: 7, canadianWork: 2, occupation: 'other', canadianEducation: 'two', sibling: true },
    { age: 33, education: 'masters', firstClb: 10, secondClb: 7, canadianWork: 3, foreignWork: 3, sibling: true, spouse: true, spouseEducation: 'bachelors', spouseClb: 8, spouseCanadianWork: 1 },
    { age: 35, education: 'bachelors', firstClb: 8, canadianWork: 1, spouse: true, spouseEducation: 'one-year', spouseClb: 0, spouseCanadianWork: 0, nomination: true },
  ];
  for (const lang of ['en', 'fr']) {
    const t = (key, values) => msg(lang, key, values);
    for (const given of PROFILES) {
      for (const [key, want] of [['ask.eligibility', 'immigration-eligibility'], ['ask.crs', 'immigration-crs']]) {
        const q = profileQuestion(t, key, normalizeProfile(given), Object.keys(given));
        assert.deepEqual(profileFromText(q), given, q);
        assert.equal(pickScenario(scenarios, q)?.id, want, q);
        // The answer built from the question scores exactly like the answers the person left behind.
        assert.deepEqual(normalizeProfile(profileFromText(q)), normalizeProfile(given), q);
      }
    }
    assert.equal(profileQuestion(t, 'ask.crs', normalizeProfile({}), []), msg(lang, 'ask.crs.plain'));
    const times = msg(lang, 'visa.askTimes', { country: lang === 'fr' ? 'Mexique' : 'Mexico' });
    assert.equal(pickScenario(scenarios, times)?.id, 'immigration-times', times);
    assert.equal(programFromText(times), 'visitor', times);
    assert.equal(countryFromText(times), 'MX', times);
  }
});

test('“Try it: NCLC 7 in French”, then “Check my eligibility with these answers”: the second language arrives', () => {
  const given = { age: 29, education: 'bachelors', firstClb: 9, canadianWork: 1, secondClb: 7 };
  for (const lang of ['en', 'fr']) {
    const q = profileQuestion((key, values) => msg(lang, key, values), 'ask.eligibility', normalizeProfile(given), Object.keys(given));
    const read = profileFromText(q);
    assert.equal(read.secondClb, 7, q);
    assert.equal(read.firstClb, 9, q);
    assert.equal(read.firstLanguage, undefined, q);
    assert.ok(!assumedFields(Object.keys(read), 'eligibility').includes('secondClb'), q);
  }
});
