/**
 * Feriados nacionais, pontos facultativos, and the "today" clock for Brazil.
 *
 * THE DISTINCTION THIS FILE EXISTS FOR: Brazil separates **feriado nacional** (a national public holiday,
 * fixed in law) from **ponto facultativo** (the federal administration simply has no business that day).
 * Carnaval and Corpus Christi are the famous trap: people call them feriados, but they are *pontos
 * facultativos*. Only Sexta-feira Santa is a national holiday among the three Easter-season days.
 * Getting this wrong is the single most common error a general assistant makes about Brazilian holidays, so
 * the two are separate arrays and a caller must say which one it means.
 *
 * The ten national holidays come from law:
 *   Lei 662/1949 ....... 1 Jan, 21 Apr, 1 May, 7 Sep, 12 Oct, 2 Nov, 15 Nov, 25 Dec
 *   Lei 10.607/2002 .... Sexta-feira Santa (only; Carnaval and Corpus Christi are pontos facultativos)
 *   Lei 14.759/2023 ... 20 Nov, Dia Nacional de Zumbi e da Consciência Negra
 *
 * The pontos facultativos are NOT law: each year's list is published by the Ministry of Public Management
 * (MGI) in a Portaria in late December. So they are stored as published facts per year, with the Portaria
 * cited — never computed, and never guessed for a year that has not been published yet.
 *
 * Sources, read 2026-10-02:
 *   2026 — Portaria MGI nº 11.460, de 29/12/2025, DOU
 *          https://www.gov.br/mre/pt-br/eresp/feriados-e-pontos-facultativos  (reproduces the table)
 *   2025 — Portaria MGI nº 9.783, de 27/12/2024, DOU, as amended by Portaria MGI nº 3.197, de 28/04/2025
 *   2024 — Portaria MGI nº 8.617, de 26/12/2023, DOU
 */
import type { Holiday } from '@/lib/dates/business-days';

/** The page that carries the current year's table, on an official gov.br domain. */
export const HOLIDAYS_URL = 'https://www.gov.br/mre/pt-br/eresp/feriados-e-pontos-facultativos';

/** Easter Sunday, Gregorian (anonymous Gregorian algorithm). */
function easter(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(year, month - 1, day, 12));
}

const toISO = (d: Date) =>
  `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
const shift = (d: Date, days: number) => new Date(d.getTime() + days * 86_400_000);

/** The ten national public holidays of one year, in date order. Law, so valid for any year. */
export function nationalHolidays(year: number): Holiday[] {
  const goodFriday = toISO(shift(easter(year), -2));
  return [
    { date: `${year}-01-01`, name: { en: 'New Year’s Day', pt: 'Confraternização Universal' } },
    { date: goodFriday, name: { en: 'Good Friday', pt: 'Paixão de Cristo' } },
    { date: `${year}-04-21`, name: { en: 'Tiradentes Day', pt: 'Tiradentes' } },
    { date: `${year}-05-01`, name: { en: 'Labour Day', pt: 'Dia Mundial do Trabalho' } },
    { date: `${year}-09-07`, name: { en: 'Independence Day', pt: 'Independência do Brasil' } },
    { date: `${year}-10-12`, name: { en: 'Our Lady of Aparecida', pt: 'Nossa Senhora Aparecida' } },
    { date: `${year}-11-02`, name: { en: 'All Souls’ Day', pt: 'Finados' } },
    { date: `${year}-11-15`, name: { en: 'Republic Proclamation Day', pt: 'Proclamação da República' } },
    { date: `${year}-11-20`, name: { en: 'Black Awareness Day', pt: 'Dia Nacional de Zumbi e da Consciência Negra' } },
    { date: `${year}-12-25`, name: { en: 'Christmas Day', pt: 'Natal' } },
  ].sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Points facultativos actually published, per year. A year that is absent simply has none published yet —
 * the Portaria for year N lands in December of N-1, so a year can legitimately be missing. Deliberately
 * incomplete rather than extrapolated: an invented "ponto facultativo" is a date a person may act on.
 */
export const PONTOS_FACULTATIVOS: Record<number, { date: string; name: { en: string; pt: string } }[]> = {
  2024: [
    { date: '2024-02-12', name: { en: 'Carnival Monday', pt: 'Carnaval' } },
    { date: '2024-02-13', name: { en: 'Carnival Tuesday', pt: 'Carnaval' } },
    { date: '2024-02-14', name: { en: 'Ash Wednesday (until 2pm)', pt: 'Quarta-feira de Cinzas (até as 14h)' } },
    { date: '2024-05-30', name: { en: 'Corpus Christi', pt: 'Corpus Christi' } },
    { date: '2024-05-31', name: { en: 'Corpus Christi (bridged day)', pt: 'Corpus Christi (ponte)' } },
    { date: '2024-10-28', name: { en: 'Public Servant’s Day', pt: 'Dia do Servidor Público' } },
    { date: '2024-12-24', name: { en: 'Christmas Eve (after 1pm)', pt: 'Véspera de Natal (após as 13h)' } },
    { date: '2024-12-31', name: { en: 'New Year’s Eve (after 1pm)', pt: 'Véspera de Ano Novo (após as 13h)' } },
  ],
  2025: [
    { date: '2025-03-03', name: { en: 'Carnival Monday', pt: 'Carnaval' } },
    { date: '2025-03-04', name: { en: 'Carnival Tuesday', pt: 'Carnaval' } },
    { date: '2025-03-05', name: { en: 'Ash Wednesday (until 2pm)', pt: 'Quarta-feira de Cinzas (até as 14h)' } },
    { date: '2025-06-19', name: { en: 'Corpus Christi', pt: 'Corpus Christi' } },
    { date: '2025-06-20', name: { en: 'Corpus Christi (bridged day)', pt: 'Corpus Christi (ponte)' } },
    { date: '2025-10-28', name: { en: 'Public Servant’s Day (kept on the 27th)', pt: 'Dia do Servidor Público (comemorado dia 27)' } },
    { date: '2025-12-24', name: { en: 'Christmas Eve (after 1pm)', pt: 'Véspera de Natal (após as 13h)' } },
    { date: '2025-12-31', name: { en: 'New Year’s Eve (after 1pm)', pt: 'Véspera de Ano Novo (após as 13h)' } },
  ],
  2026: [
    { date: '2026-02-16', name: { en: 'Carnival Monday', pt: 'Carnaval' } },
    { date: '2026-02-17', name: { en: 'Carnival Tuesday', pt: 'Carnaval' } },
    { date: '2026-02-18', name: { en: 'Ash Wednesday (until 2pm)', pt: 'Quarta-feira de Cinzas (até as 14h)' } },
    { date: '2026-04-20', name: { en: 'Facultative day', pt: 'Ponto facultativo' } },
    { date: '2026-06-04', name: { en: 'Corpus Christi', pt: 'Corpus Christi' } },
    { date: '2026-06-05', name: { en: 'Corpus Christi (bridged day)', pt: 'Corpus Christi (ponte)' } },
    { date: '2026-10-28', name: { en: 'Public Servant’s Day', pt: 'Dia do Servidor Público' } },
    { date: '2026-12-24', name: { en: 'Christmas Eve (after 1pm)', pt: 'Véspera de Natal (após as 13h)' } },
    { date: '2026-12-31', name: { en: 'New Year’s Eve (after 1pm)', pt: 'Véspera de Ano Novo (após as 13h)' } },
  ],
};

/**
 * Everything that stops the federal administration, for the next two years: the ten national holidays plus
 * whichever pontos facultativos have been published. Pure and isomorphic. The two years are chosen from
 * `today` in the caller's own zone, so someone already in January sees next January's holidays.
 */
export function federalDaysOff(timeZone?: string): Holiday[] {
  const y = Number(todayInBrazil(timeZone).slice(0, 4));
  return [...nationalHolidays(y), ...nationalHolidays(y + 1), ...(PONTOS_FACULTATIVOS[y] ?? []), ...(PONTOS_FACULTATIVOS[y + 1] ?? [])].sort(
    (a, b) => a.date.localeCompare(b.date),
  );
}

/** National holidays only, for the next two years. */
export function nationalDaysOff(): Holiday[] {
  const y = Number(todayInBrazil().slice(0, 4));
  return [...nationalHolidays(y), ...nationalHolidays(y + 1)];
}

/**
 * Today's date in Brazil (ISO), from the person's IANA time zone when their browser shared one, so someone
 * in Manaus at 11 p.m. isn't planning from tomorrow. Falls back to Brasília.
 */
export function todayInBrazil(timeZone?: string): string {
  let parts: Intl.DateTimeFormatPart[];
  try {
    parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: timeZone || 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(new Date());
  } catch {
    parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  }
  const g = (t: string) => parts.find((p) => p.type === t)?.value ?? '01';
  return `${g('year')}-${g('month')}-${g('day')}`;
}