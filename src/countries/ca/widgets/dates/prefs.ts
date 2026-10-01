'use client';
/**
 * What the person follows (programs, tax deadlines, holidays, province), remembered on this device only and
 * shared by the calendar and the holidays list: choosing a province in one shows in the other.
 */
import { useDeviceItem } from '@/lib/device-store';
import { useMessages } from '@/lib/i18n/widget';
import type { Program, Province } from './data';
import messages from './messages';

export type DatePrefs = { programs: Program[]; taxes: boolean; holidays: boolean; province: Province | null };

/** `[saved, save]`: the saved choice (null until they choose) and a setter that labels it for the privacy card. */
export function useDatePrefs() {
  const t = useMessages(messages);
  const [saved, save] = useDeviceItem<DatePrefs>('dates:prefs', { label: t('saved.label'), kind: 'preference' });
  const store = (p: DatePrefs) => save(p, { detail: t('saved.detail', { count: p.programs.length, place: p.province ? ` · ${t(`prov.${p.province}`)}` : '' }) });
  return [saved, store] as const;
}
