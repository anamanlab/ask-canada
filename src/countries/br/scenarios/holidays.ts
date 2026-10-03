/**
 * Scripted answers for the `holidays` widget. These really call `holidaysNext`, so the tool runs and the
 * list on screen is the same data the answer describes.
 *
 * The reply teaches the distinction the widget makes visible: Carnaval and Corpus Christi are pontos
 * facultativos, not feriados nacionais.
 */
import { federalDaysOff, HOLIDAYS_URL, nationalHolidays, todayInBrazil } from '../data/holidays';
import type { Scenario, ScenarioCtx } from '@/lib/scripted/types';

const CHECKED = '2026-10-02';

/** "2 de outubro de 2026" / "2 October 2026", in the person's own time zone. */
function longDate(iso: string, locale: string, timeZone?: string) {
  return new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: timeZone || 'America/Sao_Paulo',
  }).format(new Date(`${iso}T12:00:00Z`));
}

const pt = (iso: string, timeZone?: string) => longDate(iso, 'pt', timeZone);
const en = (iso: string, timeZone?: string) => longDate(iso, 'en', timeZone);

/**
 * "Feriado nacional" in the reader's own words. Such a question wants the statutory list, so it is answered
 * from the law rather than from the wider calendar — which is where a ponto facultativo would creep in.
 */
const ASKS_NATIONAL = /\b(feriado(s)? (nacional|nacionais)|national holidays?)\b/i;

function vars({ text, locale, timeZone }: ScenarioCtx) {
  const today = todayInBrazil(timeZone);
  const year = Number(today.slice(0, 4));
  // Both years, because every list here spans them: a statutory holiday in January of next year is still a
  // feriado nacional, and labelling it a ponto would be the one error this answer exists to avoid.
  const national = [...nationalHolidays(year), ...nationalHolidays(year + 1)].sort((a, b) => a.date.localeCompare(b.date));
  const nationalDates = new Set(national.map((h) => h.date));
  const list = ASKS_NATIONAL.test(text) ? national : federalDaysOff(timeZone);
  const upcoming = list.filter((d) => d.date >= today).slice(0, 3);
  const next = upcoming[0];
  const english = locale === 'en';
  const format = english ? en : pt;
  const nameOf = (d: { name: { en: string; pt?: string } }) => d.name[english ? 'en' : 'pt'] ?? d.name.en;
  // Both kinds, in the reader's own words, so a ponto facultativo is never announced as a feriado.
  const [feriado, ponto] = english ? ['national holiday', 'optional non-service day'] : ['feriado nacional', 'ponto facultativo'];
  // The statutory holidays are law, so `next` always exists — but never throw in a script: fall back to
  // leaving the placeholder in place, which the engine renders as the key itself.
  return {
    today: format(today, timeZone),
    nextDate: next ? format(next.date, timeZone) : '',
    nextName: next ? nameOf(next) : '',
    nextKind: next && nationalDates.has(next.date) ? feriado : ponto,
  };
}

const scenarios: Scenario[] = [
  {
    id: 'holidays-next',
    priority: 6,
    match: [
      /\b(pr[oó]ximo|pr[oó]ximos)\s+(feriado|feriados|ponto facultativo|ponto facultativo|ponto facultativo)\b/i,
      /\bqual (é|o|os) (o )?(pr[oó]ximo|pr[oó]ximos) (feriado|feriados|ponto)\b/i,
      /\bquando (é|ser[aá]) (o )?pr[oó]ximo (feriado|ponto)\b/i,
      /\bferiado nacional\b/i,
      /\bponto[s]? facultativo[s]?\b/i,
      /\bquantos feriados\b|\bquais (são os )?feriados\b|feriados (deste|do) ano\b/i,
      /\bpr[oó]ximos feriados\b/i,
      /\b(next|upcoming) (national )?(holiday|holidays|non-service day)\b/i,
      /\bwhat (is|are) the next (national )?holiday\b/i,
      /\bwhich (are|is) (this year[’']?s )?(the )?(national )?holidays\b|\blist of .*holidays\b/i,
      /\bhow many (national )?holidays\b/i,
      /\bwhen is the next holiday\b/i,
      /\bpublic holiday\b/i,
    ],
    exclude: [/\b(estadual|estadual|municipal|feriado municipal|feriado estadual)\b/i],
    reply: {
      pt: `# O próximo {nextKind} é {nextDate}: *{nextName}*.

Nesse dia o governo federal não tem expediente. Adicionei a lista dos próximos dias sem serviço logo abaixo,
com uma diferença que importa: *{nextName}* é um **{nextKind}**. [1](${HOLIDAYS_URL})

**Feriado nacional** quer dizer que a lei determina o dia sem expediente. **Ponto facultativo** quer dizer
apenas que o governo federal não trabalha — Carnaval e Corpus Christi são pontos facultativos, não feriados
nacionais. Sexta-feira Santa é feriado nacional. Os pontos facultativos de cada ano são publicados em uma
Portaria do Ministério da Gestão, e é dela que a lista abaixo vem.`,
      en: `# The next {nextKind} is {nextDate}: *{nextName}*.

The federal government does no work that day. I have added the list of upcoming non-service days below, with
one distinction that matters: *{nextName}* is a **{nextKind}**. [1](${HOLIDAYS_URL})

A **national holiday** means the law sets the day off. An **optional non-service day** only means the federal
government does not work — Carnival and Corpus Christi are optional non-service days, not national holidays.
Good Friday is a national holiday. Each year's optional days are published in a Portaria from the Ministry
of Public Management, and that is what the list below comes from.`,
    },
    vars,
    toolCalls: [{ toolName: 'holidaysNext', input: () => ({ count: 4 }) }],
    checked: CHECKED,
    followUps: {
      pt: ['Quais são os feriados nacionais deste ano?', 'O Carnaval é feriado nacional?', 'O que é ponto facultativo?'],
      en: ['Which are this year’s national holidays?', 'Is Carnival a national holiday?', 'What is an optional non-service day?'],
    },
  },
  {
    id: 'holidays-carnaval',
    priority: 7,
    match: [
      /\b(carnaval|carnavalesco|carnival)\b/i,
      /\bcorpus christi\b/i,
      /\b(é|e) (o )?carnaval (feriado|ponto facultativo)\b/i,
      /\b(is|does) carnival (count|is)\b.*\b(holiday|day off)\b/i,
    ],
    reply: {
      pt: `# Não: o Carnaval não é feriado nacional, é ponto facultativo.

As segundas, as terças e a quarta-feira de cinzas são pontos facultativos — o governo federal não tem
expediente, mas o dia não está fixado na lei como feriado nacional. O que *é* feriado nacional na Semana Santa
é a Sexta-feira Santa (Paixão de Cristo). Corpus Christi também é ponto facultativo. [1](${HOLIDAYS_URL})

Na prática, a diferença aparece no atendimento: bancos e boa parte do comércio fecham no Carnaval, mas, para
um documento emitido pelo governo federal, vale a data que a lei fixa.`,
      en: `# No: Carnival is not a national holiday, it is an optional non-service day.

Carnival Monday, Tuesday and Ash Wednesday are optional non-service days — the federal government does no
work, but the day is not set in law as a national holiday. What *is* a national holiday in Holy Week is Good
Friday (Paixão de Cristo). Corpus Christi is also an optional non-service day. [1](${HOLIDAYS_URL})

In practice the difference shows up in service: banks and most shops close over Carnival, but for an official
document it is the date set in law that counts.`,
    },
    toolCalls: [{ toolName: 'holidaysNext', input: () => ({ count: 4 }) }],
    checked: CHECKED,
    followUps: {
      pt: ['Qual é o próximo feriado nacional?', 'O Corpus Christi é feriado nacional?'],
      en: ['What is the next national holiday?', 'Is Corpus Christi a national holiday?'],
    },
  },
  {
    id: 'holidays-ponto-facultativo',
    priority: 7,
    match: [
      /\bo que (é|e|significa) (um|uma)?\s*(ponto facultativo|feriado nacional)\b/i,
      /\bdiferen[çc]a entre (feriado|ponto)\b/i,
      /\bwhat (is|does) (an optional non-service day|a national holiday)\b/i,
      /\b(ponto facultativo|optional non-service day)\b/i,
      /\bcorpus christi\b/i,
      /\bdifference between\b|\bquantos feriados\b/i,
      /\bnon-service day\b.*\bmean\b/i,
    ],
    reply: {
      pt: `# Feriado nacional é lei; ponto facultativo é só o calendário do governo.

São **dez feriados nacionais** no Brasil: 1º de janeiro, Sexta-feira Santa, 21 de abril, 1º de maio,
7 de setembro, 12 de outubro, 2 de novembro, 15 de novembro, 20 de novembro e 25 de dezembro.

Os **pontos facultativos** (Carnaval, Quarta-feira de Cinzas, Corpus Christi, Dia do Servidor Público e as
vésperas de Natal e Ano Novo) são dias em que a administração federal não tem expediente, sem serem
feriados nacionais. Todo ano o Ministério da Gestão publica uma Portaria com essas datas. [1](${HOLIDAYS_URL})`,
      en: `# A national holiday is law; an optional non-service day is just the government's calendar.

There are **ten national holidays** in Brazil: 1 January, Good Friday, 21 April, 1 May, 7 September,
12 October, 2 November, 15 November, 20 November and 25 December.

The **optional non-service days** (Carnival, Ash Wednesday, Corpus Christi, Public Servant's Day, and the
eves of Christmas and New Year) are days the federal administration does no work, without being national
holidays. Each year the Ministry of Public Management publishes a Portaria with those dates. [1](${HOLIDAYS_URL})`,
    },
    toolCalls: [{ toolName: 'holidaysNext', input: () => ({ count: 6 }) }],
    checked: CHECKED,
    followUps: {
      pt: ['Qual é o próximo feriado nacional?', 'Quais são os feriados nacionais deste ano?'],
      en: ['What is the next national holiday?', 'Which are this year’s national holidays?'],
    },
  },
];

export default scenarios;