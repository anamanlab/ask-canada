/**
 * Parks Canada "Important bulletins": what kind of notice a title is, its date, and the order to show them in.
 * Pure; used by the scraper (live.ts) and the lab fixtures, never by the renderers.
 */
import { fold, type Bulletin, type BulletinKind } from './model';

export function classifyBulletin(title: string): BulletinKind {
  const t = fold(title);
  if (/\barmes? a feu\b|\bfirearm/.test(t)) return 'restricted';
  if (/\bfire ban\b|\bprohibition on (wood )?fires\b|\binterdiction (de |des |d )?(faire (du |des )?)?(feux?|incendies)\b|\bfeux (de camp )?interdits\b/.test(t)) return 'fireBan';
  if (/\bwildfire|\bprescribed fire|\bfeux? de (foret|vegetation)|\bincendies? de foret|\bfeux? dirige|\bbrulage/.test(t)) return 'fire';
  if (/\bclos(ure|ed)\b|\bfermeture|\bferme(e|es)?\b/.test(t)) return 'closure';
  if (/\bbears?\b|\bwildlife|\belk\b|\bcougars?|\bwol(f|ves)|\bcoyotes?|\bbison|\bours\b|\bfaune\b|\bwapitis?\b|\bloups?\b|\bcouguars?/.test(t)) return 'wildlife';
  if (/\brestrict|\bprohibit|\binterdi|\brestrein/.test(t)) return 'restricted';
  return 'info';
}

const MONTHS: Record<string, number> = {
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6, july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
  janvier: 1, fevrier: 2, mars: 3, avril: 4, mai: 5, juin: 6, juillet: 7, aout: 8, septembre: 9, octobre: 10, novembre: 11, decembre: 12,
};

/** "September 21, 2026" / "21 septembre 2026" → "2026-09-21". */
export function parseBulletinDate(s: string | undefined | null): string | null {
  if (!s) return null;
  const f = fold(s);
  let m = f.match(/^([a-z]+) (\d{1,2}) (\d{4})$/);
  let day: number | undefined, month: number | undefined, year: number | undefined;
  if (m && MONTHS[m[1]]) [month, day, year] = [MONTHS[m[1]], +m[2], +m[3]];
  m = f.match(/^(\d{1,2}) ([a-z]+) (\d{4})$/);
  if (m && MONTHS[m[2]]) [day, month, year] = [+m[1], MONTHS[m[2]], +m[3]];
  if (!day || !month || !year) return null;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

const KIND_ORDER: BulletinKind[] = ['fireBan', 'fire', 'closure', 'wildlife', 'restricted', 'info'];
/** Most useful first: fire bans, then newest. */
export function sortBulletins(list: Bulletin[]) {
  return [...list].sort((a, b) => {
    if ((a.kind === 'fireBan') !== (b.kind === 'fireBan')) return a.kind === 'fireBan' ? -1 : 1;
    const d = (b.date ?? '').localeCompare(a.date ?? '');
    return d || KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind);
  });
}
