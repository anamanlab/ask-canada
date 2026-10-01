/**
 * A hazard group as the Canada-wide card shows it: all of it, or only the part inside one province. Pure and
 * isomorphic (the widget filters on the client; alerts-model.ts builds the groups on the server).
 */
import type { AlertGroup } from './types';

/** Main time zone of each province/territory (the alerts feed carries no coordinates when geometry is skipped). */
const PROVINCE_TZ: Record<string, string> = {
  ab: 'America/Edmonton', bc: 'America/Vancouver', mb: 'America/Winnipeg', nb: 'America/Halifax', nl: 'America/St_Johns',
  ns: 'America/Halifax', nt: 'America/Yellowknife', nu: 'America/Iqaluit', on: 'America/Toronto', pe: 'America/Halifax',
  qc: 'America/Toronto', sk: 'America/Regina', yt: 'America/Whitehorse',
};
export const provinceTz = (prov: string) => PROVINCE_TZ[prov] ?? 'America/Toronto';

export type GroupView = {
  /** Area names, in the group's (alphabetical) order. */
  areas: string[];
  provinces: string[];
  /** The latest end among the areas shown (each area keeps its own end time). */
  endsAt?: string;
  /** The time zones `endsAt` is written in, in province order. */
  zones: string[];
};

/**
 * What a group covers, optionally inside one province only: its areas, where they are and until when. With a
 * province, everything comes from that province's areas alone, so the card never lists another province's
 * areas or borrows its end time (fog can lift at 10 a.m. in Ontario and 11 a.m. in Quebec under one hazard).
 */
export function viewGroup(group: AlertGroup, province?: string | null): GroupView {
  const areas = province ? group.areas.filter((a) => a.provinces.includes(province)) : group.areas;
  const provinces = province ? [province] : group.provinces;
  const endsAt = areas.reduce<string | undefined>((max, a) => (a.endsAt && (!max || Date.parse(a.endsAt) > Date.parse(max)) ? a.endsAt : max), undefined);
  return { areas: areas.map((a) => a.name), provinces, endsAt, zones: [...new Set(provinces.map(provinceTz))] };
}
