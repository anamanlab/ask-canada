'use client';
/** How to reach an MP: email / call / website actions (rows on a phone, tiles when wide), then the constituency and Hill offices. */
import type { ReactNode } from 'react';
import { Globe, Mail, Phone, type LucideIcon } from 'lucide-react';
import { WidgetSection } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useMessages } from '@/lib/i18n/widget';
import messages from './messages';
import { CardArrow, CardLink } from './shared';
import { genderOf } from './select';
import type { Mp, Office } from './types';

/** House of Commons numbers are North American ("613-992-4211"). */
const telHref = (phone: string) => `tel:+1${phone.replace(/\D/g, '')}`;
/** "yasirnaqvi.libparl.ca" from the MP's website URL (the URL itself when it can't be parsed). */
const hostOf = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
};
const COLS = ['', '', '@xl:grid-cols-2', '@xl:grid-cols-3'];

/** `value` is the address, number or host itself; `note` says which office a number rings (narrow rows only). */
type Action = { key: string; href: string; icon: LucideIcon; label: string; value: ReactNode; note?: string; external?: boolean };

/**
 * One contact action, one tap target. On narrow widths a full-width row (icon, then the label over its value);
 * from the wide layout on an iOS-style tile (icon over label over value). The value is always on screen, once.
 */
function ContactAction({ href, icon: Icon, label, value, note, external }: Omit<Action, 'key'>) {
  return (
    <CardLink
      href={href}
      external={!!external}
      className={cn(
        'relative flex min-h-14 min-w-0 items-center gap-3 rounded-tile border border-hair bg-card px-3.5 py-2.5 text-start text-ink shadow-sm transition-[transform,box-shadow] duration-200 hover:-translate-y-px hover:shadow-md active:scale-[.98]',
        '@xl:min-h-[88px] @xl:flex-col @xl:justify-center @xl:gap-1.5 @xl:px-2 @xl:py-3 @xl:text-center',
      )}
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-maple-wash text-maple">
        <Icon className="size-[18px]" strokeWidth={1.9} aria-hidden />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5 @xl:max-w-full @xl:flex-none @xl:gap-1.5">
        <span className="text-[14.5px] font-semibold leading-tight">
          {label}
          {note ? <span className="font-normal text-ink-2 @xl:hidden"> · {note}</span> : null}
        </span>
        <span className="text-[13.5px] leading-tight text-ink-2 [overflow-wrap:anywhere] @xl:text-[12.5px] @xl:[text-wrap:balance]">{value}</span>
      </span>
      {external ? <CardArrow className="size-3.5 @xl:absolute @xl:end-2 @xl:top-2" /> : null}
    </CardLink>
  );
}

export function MpContact({ mp }: { mp: Mp }) {
  const t = useMessages(messages);
  const local = mp.offices.find((o) => o.kind === 'constituency' && o.phone);
  const call = local ?? mp.offices.find((o) => o.kind === 'hill' && o.phone);
  const actions: Action[] = [];
  if (mp.email) {
    actions.push({ key: 'email', href: `mailto:${mp.email}`, icon: Mail, label: t('mp.contact.email'), value: <bdi dir="ltr">{mp.email}</bdi> });
  }
  if (call?.phone) {
    actions.push({
      key: 'call',
      href: telHref(call.phone),
      icon: Phone,
      label: t('mp.contact.call'),
      note: call === local ? t('mp.office.constituency') : t('mp.office.hill'),
      value: (
        <bdi dir="ltr" className="tabular-nums">
          {call.phone}
        </bdi>
      ),
    });
  }
  if (mp.website) {
    actions.push({
      key: 'web',
      href: mp.website,
      icon: Globe,
      label: t('mp.contact.website'),
      value: <bdi dir="ltr">{hostOf(mp.website)}</bdi>,
      external: true,
    });
  }
  // Constituency offices first, then the Hill office (each keeps its place in the House of Commons' own order).
  const offices = mp.offices.map((office, n) => ({ office, n })).sort((a, b) => (a.office.kind === b.office.kind ? a.n - b.n : a.office.kind === 'constituency' ? -1 : 1));
  return (
    <WidgetSection title={t('mp.contact.title', { gender: genderOf(mp) })}>
      {actions.length ? (
        <ul className={cn('m-0 grid list-none gap-2 p-0', COLS[actions.length])}>
          {actions.map(({ key, ...a }) => (
            <li key={key} className="grid min-w-0">
              <ContactAction {...a} />
            </li>
          ))}
        </ul>
      ) : null}
      {offices.length ? (
        <ul className="m-0 mt-4 grid list-none gap-2.5 p-0 @xl:grid-cols-2">
          {offices.map(({ office, n }) => (
            <OfficeCard key={`${office.kind}-${n}`} office={office} />
          ))}
        </ul>
      ) : null}
      <p className="m-0 mt-3 text-[13px] leading-snug text-ink-2">{t('mp.contact.postage')}</p>
    </WidgetSection>
  );
}

function OfficeCard({ office }: { office: Office }) {
  const t = useMessages(messages);
  const name = office.kind === 'hill' ? t('mp.office.hill') : t('mp.office.constituency');
  return (
    // Cards sit side by side on wide screens: the phone and fax rows are pinned to the bottom so they line up.
    <li className="flex flex-col rounded-tile bg-paper-2 px-4 pb-2 pt-3.5">
      <p className="m-0 text-[13px] font-semibold text-ink-2">{name}</p>
      {/* Lines follow the page direction; each one is isolated so an English address reads correctly in RTL. */}
      <address className="m-0 mt-1.5 text-start text-[14px] not-italic leading-snug text-ink">
        {office.label ? (
          <span className="block font-medium">
            <bdi>{office.label}</bdi>
          </span>
        ) : null}
        {office.lines.map((l, i) => (
          <span key={`${i}-${l}`} className="block text-ink-2">
            <bdi>{l}</bdi>
          </span>
        ))}
      </address>
      <div className="mt-auto pt-1.5">
        {office.phone ? (
          <a
            href={telHref(office.phone)}
            aria-label={t('mp.contact.callOffice', { office: name, phone: office.phone })}
            className="-mx-2 flex min-h-11 items-center gap-2.5 rounded-field px-2 text-[14.5px] font-medium text-ink no-underline transition-colors hover:bg-card"
          >
            <Phone className="size-4 shrink-0 text-maple" strokeWidth={1.9} aria-hidden />
            <bdi dir="ltr" className="tabular-nums">
              {office.phone}
            </bdi>
            <span className="ms-auto text-[13px] text-ink-2">{t('mp.contact.call')}</span>
          </a>
        ) : null}
        {office.fax ? (
          <p className="m-0 pb-1.5 text-[13px] leading-5 text-ink-2">
            {t('mp.contact.fax')} <bdi dir="ltr">{office.fax}</bdi>
          </p>
        ) : (
          // Keeps the phone row level with the neighbouring card's when only one office lists a fax.
          <span aria-hidden className="invisible hidden pb-1.5 text-[13px] leading-5 @xl:block">
            &nbsp;
          </span>
        )}
      </div>
    </li>
  );
}
