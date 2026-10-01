// Reading a life situation out of a question, end to end to the finder's hero:
//   node --test src/countries/ca/widgets/benefits/situation.test.mjs
import { register } from 'node:module';
import { test } from 'node:test';
import assert from 'node:assert/strict';

register('../../../../../scripts/lib/ts-hooks.mjs', import.meta.url);
const { situationIn, oasIn } = await import('./situation.ts');
const { oasVars } = await import('./scenario-copy/seniors.ts');
const { finderVars } = await import('./scenario-copy/finder.ts');
const { buildFinder, buildEstimator } = await import('./build.ts');
const calc = await import('./calc.ts');
const { fallbackDates } = await import('./payments.ts');

const kidsOf = (q) => {
  const p = situationIn(q);
  return [p.childrenUnder6, p.children6to17, p.children];
};

test('flagship: two kids, ages 3 and 8, $55k in Ontario → both ages known, no ages prompt, $13,707', () => {
  const q = 'What benefits can I get? We have two kids, ages 3 and 8, and make $55k in Ontario';
  const p = situationIn(q);
  assert.equal(p.childrenUnder6, 1);
  assert.equal(p.children6to17, 1);
  assert.equal(p.children, undefined);
  assert.equal(p.income, 55000);
  assert.equal(p.province, 'ON');
  assert.equal(p.household, 'couple');
  assert.equal(p.age, undefined, 'a child’s age is never the person’s');
  const out = buildFinder(p, 'en', '2026-09-30', fallbackDates('2026-09-30'));
  assert.equal(out.kidsAgesUnknown, false, 'no AgesPrompt');
  assert.equal(Math.round(out.total), 13707);
});

test('ways people give their children’s ages (EN)', () => {
  assert.deepEqual(kidsOf('two kids, ages 3 and 8'), [1, 1, undefined]);
  assert.deepEqual(kidsOf('three children aged 2, 5 and 11'), [2, 1, undefined]);
  assert.deepEqual(kidsOf('our kids are 3 and 8 years old'), [1, 1, undefined]);
  assert.deepEqual(kidsOf('2 kids, one is 4 and one is 12'), [1, 1, undefined]);
  assert.deepEqual(kidsOf('2 kids, one is 4 and the other is 12'), [1, 1, undefined]);
  assert.deepEqual(kidsOf('a 3-year-old and a 7-year-old'), [1, 1, undefined]);
  assert.deepEqual(kidsOf('my kids are 3 & 8'), [1, 1, undefined]);
  assert.deepEqual(kidsOf('two kids, they’re 16 and 17'), [0, 2, undefined]);
});

test('ways people give their children’s ages (FR)', () => {
  assert.deepEqual(kidsOf('deux enfants âgés de 3 et 8 ans'), [1, 1, undefined]);
  assert.deepEqual(kidsOf('Nous avons deux enfants de 3 et 8 ans'), [1, 1, undefined]);
  assert.deepEqual(kidsOf('deux filles de 3 ans et 8 ans'), [1, 1, undefined]);
  assert.deepEqual(kidsOf('deux enfants, ils ont 2 et 4 ans'), [2, 0, undefined]);
  assert.deepEqual(kidsOf('deux enfants : l’un a 3 ans et l’autre 9 ans'), [1, 1, undefined]);
});

test('a count without ages is left for the widget to ask', () => {
  assert.deepEqual(kidsOf('We have two kids and make $55k'), [undefined, undefined, 2]);
  // Only some ages given: still ask, never guess the rest.
  assert.deepEqual(kidsOf('three kids, one is 4'), [undefined, undefined, 3]);
});

test('age groups in words: "two kids under 6" is an answer, never asked again', () => {
  assert.deepEqual(kidsOf('two kids under 6'), [2, 0, undefined]);
  assert.deepEqual(kidsOf('deux enfants de moins de 6 ans'), [2, 0, undefined]);
  assert.deepEqual(kidsOf('one child under 6 and two aged 6 to 17'), [1, 2, undefined]);
  assert.deepEqual(kidsOf('three kids under six'), [3, 0, undefined]);
  assert.deepEqual(kidsOf('two kids under 5'), [2, 0, undefined]);
  assert.deepEqual(kidsOf('both kids are under 6'), [2, 0, undefined]);
  assert.deepEqual(kidsOf('We have three kids, they’re all under 6'), [3, 0, undefined]);
  assert.deepEqual(kidsOf('We have two kids, both are under 6'), [2, 0, undefined]);
  assert.deepEqual(kidsOf('three kids, one is under 6'), [1, 2, undefined]);
  assert.deepEqual(kidsOf('three kids, two aged 6 to 17'), [1, 2, undefined]);
  assert.deepEqual(kidsOf('Nous avons trois enfants, tous de moins de 6 ans'), [3, 0, undefined]);
  assert.deepEqual(kidsOf('Nos deux enfants ont moins de 6 ans'), [2, 0, undefined]);
  assert.deepEqual(kidsOf('un enfant de moins de 6 ans et deux enfants de 6 à 17 ans'), [1, 2, undefined]);
  assert.deepEqual(kidsOf('two kids over 6'), [0, 2, undefined]);
  // Not an age group: an income under an amount, a count with no ages.
  assert.deepEqual(kidsOf('We have two kids and make under 60k'), [undefined, undefined, 2]);
  assert.deepEqual(kidsOf('We have two kids and make under $6,000 a month'), [undefined, undefined, 2]);
  // End to end: the critic's question gives the under-6 rate and no ages prompt.
  const p = situationIn('What benefits can I get? We are a couple with two kids under 6 and make $55,000 in Ontario');
  assert.deepEqual([p.childrenUnder6, p.children6to17, p.children, p.income, p.household], [2, 0, undefined, 55000, 'couple']);
  const out = buildFinder(p, 'en', '2026-09-30', fallbackDates('2026-09-30'));
  assert.equal(out.kidsAgesUnknown, false);
  assert.equal(Math.round(out.matches.find((m) => m.id === 'ccb').annual), Math.round(calc.ccbAnnual(55000, 2, 0)));
});

test('numbers that are not children’s ages', () => {
  assert.deepEqual(kidsOf('Je vis au Canada depuis plus de 10 ans'), [undefined, undefined, undefined]);
  assert.equal(situationIn('I’m 67 years old and retired').age, '65-74');
  assert.equal(situationIn('I am 34 years old, our kids are 16 and 17 years old').age, '19-59');
  assert.deepEqual(kidsOf('I am 34 years old, our kids are 16 and 17 years old'), [0, 2, undefined]);
  // The finder's own follow-up keeps working.
  assert.deepEqual(kidsOf('Estimate my Canada child benefit for 1 child under 6 and 1 child aged 6 to 17, with a family net income of $55,000'), [1, 1, undefined]);
  assert.deepEqual(kidsOf('Estimer mon allocation pour 1 enfant de moins de 6 ans et 2 enfants de 6 à 17 ans'), [1, 2, undefined]);
});

test('OAS: the age someone would start at is read from the question, and the answer leads with it', () => {
  const fr = 'Combien vais-je recevoir de la Sécurité de la vieillesse si j’attends à 70 ans?';
  assert.equal(oasIn(fr).startAge, 70);
  assert.match(oasVars({ text: fr, lang: 'fr' }).head, /En attendant à 70 ans.*1\s037,00\s\$ par mois/);
  const en = 'How much Old Age Security will I get if I wait until 70?';
  assert.equal(oasIn(en).startAge, 70);
  assert.match(oasVars({ text: en, lang: 'en' }).head, /Waiting until 70 raises the full pension to \*\$1,037\.00 a month\*, 36% more/);
  assert.equal(oasIn('What if I start OAS at 67?').startAge, 67);
  assert.equal(oasIn('Old Age Security at 65 or at 70?').startAge, 70);
  assert.equal(oasIn('Et si je reporte ma pension de la Sécurité de la vieillesse jusqu’à l’âge de 68 ans?').startAge, 68);
  // Waiting with no age named: the longest wait.
  assert.equal(oasIn('Should I delay my OAS?').startAge, 70);
  assert.equal(oasIn('Devrais-je reporter ma pension de la SV?').startAge, 70);
});

test('OAS: numbers that are not a start age', () => {
  assert.equal(oasIn('How much is OAS?').startAge, undefined);
  assert.equal(oasIn('How much OAS will I get with an income of $70,000?').startAge, undefined);
  assert.equal(oasIn('How much OAS with $70k and 20 years in Canada?').startAge, undefined);
  assert.equal(oasIn('I’m 70 years old. How much Old Age Security do I get?').startAge, undefined);
  assert.equal(oasIn('Combien de SV avec un revenu de 70 000 $?').startAge, undefined);
  assert.equal(oasIn('What is the different amount I report for OAS?').startAge, undefined);
  // Their own years and the wait together: 20/40 of $762.50, plus 36%.
  const o = oasIn('How much OAS with 20 years in Canada if I wait until 70?');
  assert.deepEqual([o.yearsInCanada, o.startAge], [20, 70]);
  assert.match(oasVars({ text: 'How much OAS with 20 years in Canada if I wait until 70?', lang: 'en' }).head, /\$518\.50 a month\* if you start at 70/);
});

test('OAS: the finder, the estimator and the scripted answers give one amount for the same person', () => {
  const { oasEstimate } = calc;
  const q = 'I am 68 and retired, single, with $120,000 income. What benefits can I get?';
  const out = buildFinder(situationIn(q), 'en', '2026-09-30', fallbackDates('2026-09-30'));
  const card = out.matches.find((m) => m.id === 'oas');
  const est = oasEstimate({ years: 40, startAge: 65, age75: false, income: 120_000 });
  // 15% of ($120,000 − $93,454) ÷ 12 = $331.83 held back from $762.50 (July 2026 to June 2027, on 2025 income).
  assert.equal(est.monthly, 430.67);
  assert.equal(est.recovery, 331.83);
  assert.equal(est.gross - est.recovery, est.monthly, 'the breakdown adds up to the cent');
  assert.equal(card.annual, est.annual, 'the finder card and the estimator agree');
  // The estimator's own output (what the Estimate button opens on) and the answer's headline.
  const opened = buildEstimator({ program: 'oas', yearsInCanada: 40, income: 120_000 }, 'en', '2026-09-30', fallbackDates('2026-09-30'));
  assert.equal(opened.estimate.monthly, est.monthly);
  const ask = 'Estimate my Old Age Security with 40 years in Canada and a net income of $120,000';
  assert.match(oasVars({ text: ask, lang: 'en' }).head, /keep about \*\$430\.67 a month\*/);
  // The finder's answer names the recovery tax and the same monthly figure the card rounds to, and no GIS.
  const body = finderVars({ text: q, lang: 'en' }).body;
  assert.match(body, /recovery tax.*\$93,454.*about \*\*\$431 a month\*\*/);
  assert.doesNotMatch(body, /Guaranteed Income Supplement/);
});

test('finder answer for seniors follows the income: GIS when it is estimated, neither in between, maximums without one', () => {
  const low = finderVars({ text: 'I am 68 and retired, single, with $20,000 income. What benefits can I get?', lang: 'en' }).body;
  assert.match(low, /Guaranteed Income Supplement\*\* could add about/);
  assert.doesNotMatch(low, /recovery tax/);
  const mid = finderVars({ text: 'I am 68 and retired, single, with $60,000 income. What benefits can I get?', lang: 'en' }).body;
  assert.doesNotMatch(mid, /Guaranteed Income Supplement|recovery tax/);
  const none = finderVars({ text: 'I am 68 and retired. What benefits can I get?', lang: 'en' }).body;
  assert.match(none, /On a low income, the \*\*Guaranteed Income Supplement\*\* can add up to \*\*\$1,138\.90 a month\*\*/);
  const fr = finderVars({ text: 'J’ai 68 ans, je suis retraité et seul, avec un revenu de 120 000 $. À quelles prestations ai-je droit?', lang: 'fr' }).body;
  assert.match(fr, /impôt de récupération.*93\s454\s\$.*environ \*\*431\s\$ par mois\*\*/);
});

test('no income given: nothing is estimated from the placeholder income, only what each program pays at most', () => {
  const { findBenefits, DEFAULT_PROFILE } = calc;
  const opts = { earningsKnown: false, workKnown: false };
  // "I lost my job" and nothing else: the groceries benefit is a ceiling for a single person, like the workers benefit.
  const lost = findBenefits({ ...DEFAULT_PROFILE, jobLoss: true }, opts);
  const cgeb = lost.matches.find((m) => m.id === 'cgeb');
  assert.deepEqual([cgeb.status, cgeb.reason, cgeb.upTo, cgeb.annual, cgeb.pay], ['check', 'incomeNeeded', 679, undefined, undefined]);
  const cwb = lost.matches.find((m) => m.id === 'cwb');
  assert.deepEqual([cwb.status, cwb.reason, cwb.upTo, cwb.annual], ['check', 'incomeNeeded', 1633, undefined]);
  assert.equal(lost.matches.find((m) => m.id === 'cdcp').reason, 'incomeNeeded', 'no co-payment is claimed');
  assert.equal(lost.total, 0);
  // Every household shape: no yearly or weekly estimate anywhere, and the totals stay at zero.
  const shapes = [
    { household: 'couple', childrenUnder6: 1, children6to17: 2, childDisability: 1, disability: true, student: true, jobLoss: true },
    { household: 'single', childrenUnder6: 0, children6to17: 1 },
    { household: 'single', age: '65-74', workIncome: 0 },
    { household: 'couple', age: '75-plus', workIncome: 0, yearsInCanada: 22 },
  ];
  for (const shape of shapes) {
    const r = findBenefits({ ...DEFAULT_PROFILE, ...shape }, opts);
    for (const m of r.matches) assert.equal(m.annual ?? m.weekly, undefined, `${m.id} is not estimated (${JSON.stringify(shape)})`);
    assert.equal(r.total, 0);
  }
  // The ceilings are the official maximums: couple with 3 children 445 + 445 + 3 × 234; single parent 445 + 445 + 234.
  assert.equal(calc.cgebMax('couple', 3), 1592);
  assert.equal(calc.cgebMax('single', 1), 1124);
  assert.equal(findBenefits({ ...DEFAULT_PROFILE, age: '65-74', workIncome: 0 }, opts).matches.find((m) => m.id === 'gis').money.monthly, 1138.9);
  // The tool's output for the same question carries no estimate either.
  const out = buildFinder(situationIn('I lost my job. What benefits can I get?'), 'en', '2026-09-30', fallbackDates('2026-09-30'));
  assert.equal(out.ready, false);
  assert.ok(out.matches.every((m) => m.annual == null && m.weekly == null));
  // With an income, the same person gets an estimate again: $445 on a low income, not the ceiling.
  assert.equal(findBenefits({ ...DEFAULT_PROFILE, income: 10_000, workIncome: 10_000 }, { earningsKnown: true }).matches.find((m) => m.id === 'cgeb').annual, 445);
});

test('workers benefit: the advance is half the yearly amount in whole dollars', () => {
  const { findBenefits, DEFAULT_PROFILE } = calc;
  const cwb = findBenefits({ ...DEFAULT_PROFILE, household: 'couple', income: 46_000, workIncome: 46_000 }, { earningsKnown: true, workKnown: true }).matches.find((m) => m.id === 'cwb');
  assert.equal(Math.round(cwb.annual), 509);
  assert.equal(cwb.money.advance, 254);
});
