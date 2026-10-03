// Regression test for `data/holidays.ts`. Run: node src/countries/br/data/holidays.test.mjs
//
// The expected dates are transcribed from the three published Portarias of the Ministry of Public
// Management (MGI), each published in the DOU in late December:
//   2024 — Portaria MGI nº 8.617, de 26/12/2023
//   2025 — Portaria MGI nº 9.783, de 27/12/2024 (as amended by Portaria MGI nº 3.197, de 28/04/2025)
//   2026 — Portaria MGI nº 11.460, de 29/12/2025
// If a future Portaria changes something, update the transcription here too — that is the point.
import { register } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..', '..', '..');
process.env.COUNTRY ||= 'br';
register(join(root, 'scripts', 'lib', 'ts-hooks.mjs'), { parentURL: import.meta.url });
const ns = await import(join(here, 'holidays.ts'));

const FERIADOS = {
  2024: ['2024-01-01', '2024-03-29', '2024-04-21', '2024-05-01', '2024-09-07', '2024-10-12', '2024-11-02', '2024-11-15', '2024-11-20', '2024-12-25'],
  2025: ['2025-01-01', '2025-04-18', '2025-04-21', '2025-05-01', '2025-09-07', '2025-10-12', '2025-11-02', '2025-11-15', '2025-11-20', '2025-12-25'],
  2026: ['2026-01-01', '2026-04-03', '2026-04-21', '2026-05-01', '2026-09-07', '2026-10-12', '2026-11-02', '2026-11-15', '2026-11-20', '2026-12-25'],
};

const PONTOS = {
  2024: ['2024-02-12', '2024-02-13', '2024-02-14', '2024-05-30', '2024-05-31', '2024-10-28', '2024-12-24', '2024-12-31'],
  2025: ['2025-03-03', '2025-03-04', '2025-03-05', '2025-06-19', '2025-06-20', '2025-10-28', '2025-12-24', '2025-12-31'],
  2026: ['2026-02-16', '2026-02-17', '2026-02-18', '2026-04-20', '2026-06-04', '2026-06-05', '2026-10-28', '2026-12-24', '2026-12-31'],
};

let problems = 0;
const check = (ok, msg) => {
  if (!ok) problems++;
  console.log(`${ok ? '✓' : '✗'} ${msg}`);
};
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

for (const [year, expected] of Object.entries(FERIADOS)) {
  const got = ns.nationalHolidays(Number(year)).map((h) => h.date);
  check(same(got, expected), `nationalHolidays(${year}) matches Portaria MGI ${year}` + (same(got, expected) ? '' : `\n    got ${got}\n    expected ${expected}`));
}
for (const [year, expected] of Object.entries(PONTOS)) {
  const got = (ns.PONTOS_FACULTATIVOS[year] ?? []).map((p) => p.date);
  check(same(got, expected), `PONTOS_FACULTATIVOS[${year}] matches Portaria MGI ${year}` + (same(got, expected) ? '' : `\n    got ${got}\n    expected ${expected}`));
  const clash = got.filter((d) => FERIADOS[year].includes(d));
  check(clash.length === 0, `no day is claimed as both feriado nacional and ponto facultativo (${clash.join(', ') || 'none'})`);
}

// The distinction this file exists for: Carnaval is a ponto facultativo, Good Friday is a national holiday.
const n26 = ns.nationalHolidays(2026).map((h) => h.date);
check(!n26.includes('2026-02-17'), 'Carnaval is NOT a feriado nacional (ponto facultativo)');
check(n26.includes('2026-04-03'), 'Paixão de Cristo IS a feriado nacional');
check(!n26.includes('2026-06-04'), 'Corpus Christi is NOT a feriado nacional (ponto facultativo)');
check(ns.nationalHolidays(2026).length === 10, 'there are exactly ten national holidays');
check(ns.nationalHolidays(2035).length === 10, 'the law-based list holds for an unpublished year (2035)');

const all = ns.federalDaysOff();
check(all.every((h, i, a) => i === 0 || a[i - 1].date <= h.date), 'federalDaysOff() is sorted by date');
check(all.every((h) => h.name.pt && h.name.en), 'every day has a Portuguese and an English name');
check(/^\d{4}-\d{2}-\d{2}$/.test(ns.todayInBrazil()), 'todayInBrazil() returns an ISO date');

console.log(problems ? `\n${problems} problem(s)` : '\n✓ Brazilian holiday data matches the published Portarias');
process.exit(problems ? 1 : 0);
