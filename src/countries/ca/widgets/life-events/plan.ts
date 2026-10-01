/**
 * Life-event checklists: the planner. Pure and isomorphic: the `lifeEventsChecklist` tool runs it on the server,
 * and the checklist downloads it on demand (planner.ts) to switch events or re-plan when a date changes.
 * All dates are ISO (YYYY-MM-DD). The output shape and the light render helpers live in model.ts.
 */
import { addDays, addMonths, diffDays, isWeekend, lastDayOfMonth } from '@/lib/dates/business-days';
import { formatDate, formatMessage, type MessageValues } from '@/lib/i18n/format';
import type { ToolSource } from '@/lib/widgets/types';
import { FEDERAL_HOLIDAYS } from '../../data/holidays';
import { EVENTS, EVENT_DEFS, FACTS, PAGES, PROVINCES, TERRITORIES, TONES, isEvent, isRegion, pageSource, type DueRule, type EventId, type Lang, type PageKey, type Phase, type Region } from './data';
import en from './messages/en.json';
import fr from './messages/fr.json';
import { acceptDate, countAgencies, messageValues, ordinalDay, pickKeyDue, taskKey, type ChecklistInput, type ChecklistOutput, type Due, type EventSummary, type Plan, type PlanTask } from './model';

export type { ChecklistInput, ChecklistOutput };

const ISO = /^\d{4}-\d{2}-\d{2}$/;
const catalogs = { en: en as Record<string, string>, fr: fr as Record<string, string> };
const intlOf = (lang: Lang) => (lang === 'fr' ? 'fr-CA' : 'en-CA');

const isProvince = (r: Region | null) => !!r && (PROVINCES as readonly string[]).includes(r);
const isTerritory = (r: Region | null) => !!r && (TERRITORIES as readonly string[]).includes(r);

const HOLIDAYS = new Set(FEDERAL_HOLIDAYS.map((h) => h.date));

/** CRA rule: a due date on a weekend or public holiday is on time the next business day. */
function rollover(iso: string) {
  let d = iso;
  while (isWeekend(d) || HOLIDAYS.has(d)) d = addDays(d, 1);
  return d;
}

/** Final return due date for a death on `death` (see data.ts, filing-deadlines). */
export function finalReturnDue(death: string) {
  const [y, m] = death.split('-').map(Number);
  const raw = m <= 10 ? `${y + 1}-04-30` : addMonths(death, 6);
  const due = rollover(raw);
  return { raw, due };
}

function computeDue(rule: DueRule, anchor: string, today: string): Due {
  let date: string;
  let kind: Due['kind'] = 'by';
  let rolledFrom: string | undefined;
  switch (rule) {
    case 'ei-4-weeks':
      date = addDays(anchor, FACTS.eiWeeks * 7);
      break;
    case 'maternity-12-weeks':
      date = addDays(anchor, -FACTS.maternityWeeksBefore * 7);
      kind = 'from';
      break;
    case 'marital-next-month':
      date = lastDayOfMonth(addMonths(`${anchor.slice(0, 7)}-01`, 1).slice(0, 7));
      break;
    case 'cpp-death-60-days':
      date = addDays(anchor, FACTS.cppDeathDays);
      break;
    case 'final-return': {
      const r = finalReturnDue(anchor);
      date = r.due;
      if (r.due !== r.raw) rolledFrom = r.raw;
      break;
    }
    case 'cpp-apply-12-months':
      date = addMonths(anchor, -FACTS.cppApplyMonths);
      kind = 'from';
      break;
  }
  const days = diffDays(today, date);
  return { rule, date, kind, days, passed: days < 0, ...(rolledFrom ? { rolledFrom } : {}) };
}

/** Build the checklist for one event. Unknown/invalid inputs are ignored rather than thrown. */
function buildPlan(event: EventId, opts: { date?: string | null; region?: Region | null; lang: Lang; today: string }): Plan {
  const def = EVENT_DEFS[event];
  const { lang, today } = opts;
  const date = opts.date && ISO.test(opts.date) ? opts.date : null;
  const region = opts.region ?? null;
  const cat = catalogs[lang];
  const intl = intlOf(lang);
  const vals = messageValues(intl);
  const msg = (key: string, extra: MessageValues = {}) => formatMessage(cat[key] ?? catalogs.en[key] ?? '', { ...vals, ...extra }, intl);
  const fmtDate = (iso: string) => ordinalDay(formatDate(iso, intl, { month: 'long', day: 'numeric', year: 'numeric' }), intl);

  const tasks: PlanTask[] = [];
  for (const d of def.tasks) {
    if (d.region === 'qc' && region !== 'QC') continue;
    if (d.region === 'not-qc' && region === 'QC') continue;
    let phase: Phase = d.phase;
    let cond: string | null = d.cond ?? null;
    let variant: PlanTask['variant'] = null;
    if (d.autoIn === 'province' && isProvince(region)) {
      phase = 'auto';
      cond = null;
      variant = 'auto';
    } else if (d.autoIn === 'province' && isTerritory(region)) {
      cond = null;
    }
    if (event === 'baby' && d.id === 'ei' && !region) variant = 'note';
    const due = d.due && date && phase !== 'auto' ? computeDue(d.due, date, today) : null;
    const title = msg(taskKey(event, d.id, 'title', variant));
    let detail = msg(taskKey(event, d.id, 'detail', variant));
    if (variant === 'note') detail += ` ${msg(`task.${event}.${d.id}.note`)}`;
    tasks.push({
      id: d.id,
      agency: d.agency,
      phase,
      url: d.url[lang],
      channels: d.channels ?? [],
      cond,
      due,
      variant,
      title,
      detail,
      ...(cond ? { only: msg(`cond.${cond}`) } : {}),
      ...(due ? { dueText: msg(`due.${due.rule}${due.passed ? '.passed' : ''}`, { date: fmtDate(due.date) }) } : {}),
    });
  }

  const order: Phase[] = ['now', 'next', 'later', 'auto'];
  tasks.sort((a, b) => order.indexOf(a.phase) - order.indexOf(b.phase));

  const agencies = countAgencies(tasks.filter((t) => t.phase !== 'auto'));
  const keyDue = pickKeyDue(tasks);

  return { event, tone: TONES[event], dateKind: def.dateKind, hubUrl: PAGES[def.hub].url[lang], tasks, agencies, keyDue };
}

function summarize(): EventSummary[] {
  return EVENTS.map((id) => {
    const tasks = EVENT_DEFS[id].tasks.filter((t) => t.phase !== 'auto' && t.region !== 'qc');
    return { id, steps: tasks.length, agencies: countAgencies(tasks) };
  });
}

function sourcesFor(event: EventId | null, lang: Lang): ToolSource[] {
  const keys: PageKey[] = event
    ? [EVENT_DEFS[event].hub, ...EVENT_DEFS[event].tasks.map((t) => t.source), ...(event === 'death' ? (['cppChildren'] as PageKey[]) : [])]
    : ['lifeEvents', 'changeAddress', 'child', 'craPersonal', 'eiEligibility', 'retirement', 'death'];
  return [...new Set(keys)].map((k) => pageSource(k, lang));
}

export function buildChecklist(input: ChecklistInput, today: string): ChecklistOutput {
  const lang: Lang = input.lang === 'fr' ? 'fr' : 'en';
  const event = isEvent(input.event) ? input.event : null;
  // A date further ahead than the event allows (a death next month) is dropped, not planned from.
  const date = acceptDate(event, input.date && ISO.test(input.date) ? input.date : null, today);
  const region = isRegion(input.region) ? (input.region.toUpperCase() as Region) : null;
  const plan = event ? buildPlan(event, { date, region, lang, today }) : null;
  const cat = catalogs[lang];
  const name = (id: EventId) => cat[`event.${id}.name`] ?? id;
  const summary = plan
    ? formatMessage(cat['summary.plan'], { event: name(plan.event), count: plan.tasks.filter((t) => t.phase !== 'auto').length, agencies: plan.agencies.length }, intlOf(lang))
    : formatMessage(cat['summary.picker'], { events: EVENTS.map(name).join(', ') }, intlOf(lang));
  return {
    version: 1,
    lang,
    today,
    event,
    date,
    region,
    plan,
    events: summarize(),
    summary,
    sources: sourcesFor(event, lang),
  };
}
