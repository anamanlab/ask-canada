'use client';
/**
 * The offices a person saved, kept on this device only (`offices:saved`, listed in the privacy card under
 * "Saved on this device" with their names). A small list keyed by office id: saving a second office keeps the
 * first. No personal data: an office id and its public name.
 */
import { useDeviceItem } from '@/lib/device-store';
import { useMessages } from '@/lib/i18n/widget';
import messages from './messages';

type SavedOffice = { id: string; name: string };
/** The newest few; the oldest falls off. */
const MAX = 8;

export function useSavedOffices() {
  const t = useMessages(messages);
  // Earlier versions stored a single office; read it as a list of one.
  const [stored, save, clear] = useDeviceItem<SavedOffice[] | SavedOffice>('offices:saved', { label: t('saved.label'), kind: 'preference' });
  const list = Array.isArray(stored) ? stored : stored ? [stored] : [];
  const isSaved = (id: string) => list.some((o) => o.id === id);
  /** Saves or removes one office; returns whether it is saved now. */
  function toggle(office: SavedOffice) {
    const next = isSaved(office.id) ? list.filter((o) => o.id !== office.id) : [...list, office].slice(-MAX);
    if (next.length) save(next, { detail: next.map((o) => o.name).join(' · ') });
    else clear();
    return next.length > list.length || (next.length === list.length && !isSaved(office.id));
  }
  return { isSaved, toggle };
}
