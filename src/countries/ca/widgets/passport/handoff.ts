/**
 * Where the planner's main button goes (pure): one rule per situation, first match wins, so the handoff can be
 * read top to bottom and never disagrees with the answer card above it. Returns message keys, not prose.
 */
import { URLS } from './data';
import type { Focus, Method, PlannerOutput } from './types';

export type Handoff = {
  href: string;
  label: 'handoff.new' | 'handoff.continue' | 'trip.more';
  /** Absent when the label already says where the button goes. */
  note?: string;
  /** The answer card holds the one primary action (get the phone number): this button steps back to secondary. */
  secondary?: boolean;
};

export function handoffFor({
  plan,
  method,
  focusFirst,
  tripRush,
}: {
  plan: PlannerOutput;
  /** The way to apply the person chose (or the recommended one). */
  method: Method;
  /** The question the planner is leading with, when it is a fee, processing-time or online answer. */
  focusFirst: Focus | null;
  /** A trip that regular processing can't make. */
  tripRush: boolean;
}): Handoff {
  const go = (href: string, note: string): Handoff => ({ href, label: 'handoff.continue', note: `handoff.note.${note}` });
  const m = plan.methods[method];
  // Not a renewal: the new adult passport application.
  if (!plan.canRenew) return { href: plan.newPassportUrl, label: 'handoff.new', note: 'handoff.newNote' };
  // Even urgent pick-up is too late: the card's own button leads to the phone lines, and this one, to the
  // page about faster service, is the quieter second step.
  if (plan.trip?.option === 'emergency') return { href: plan.trip.urgentUrl, label: 'trip.more', secondary: true };
  // A fee, processing-time or online question: the page that answers it.
  if (focusFirst === 'fees') return go(URLS.payFees[plan.lang], 'fees');
  if (focusFirst === 'processing') return go(URLS.processing[plan.lang], 'processing');
  if (focusFirst === 'online') return go(URLS.online[plan.lang], 'onlineFocus');
  // Express or urgent pick-up is asked for in person, with proof of travel.
  if (method === 'in-person' && tripRush && plan.trip) return go(plan.trip.urgentUrl, 'urgent');
  if (!plan.expiry) return go(plan.renewUrl, 'unknown');
  // Online isn't open to them yet: the page about it, not the portal sign-in.
  if (method === 'online' && !m.available) return go(m.handoff, 'onlineInfo');
  return go(m.handoff, method);
}
