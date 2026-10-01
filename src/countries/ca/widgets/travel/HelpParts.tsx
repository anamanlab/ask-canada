'use client';
/**
 * Contact pieces shared by the advisory's help tab and the emergency card: dialable phone links, local
 * emergency numbers and the Canadian offices list.
 */
import { Building2, Mail, Phone } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useMessages } from '@/lib/i18n/widget';
import messages from './messages';
import { phoneParts, telHref } from './phone';
import { capFirst } from './select';
import { Feed, REVEAL_FOCUS, ShowAll, useShowAll } from './shared';
import type { Lang, LocalEmergency, Office } from './types';

/**
 * A printed phone value that dials on tap when it can (always left-to-right), shown in international form
 * when we could normalise it (phone.ts `displayPhone`). Each alternative in
 * "+52 81-2088-3200/3201" gets its own link; anything we can't normalise to a safe `tel:` stays text
 * (see phone.ts). `local`: dial exactly as printed inside the destination (toll-free lines).
 */
export function PhoneLink({ number, iso, local, className }: { number: string; iso?: string; local?: boolean; className?: string }) {
  const parts = phoneParts(number, { iso, local });
  return (
    <bdi dir="ltr" className={cn('min-w-0 [overflow-wrap:anywhere]', className)}>
      {parts.map((p, i) =>
        p.href ? (
          <a
            key={i}
            href={p.href}
            // International form ("+81 3 5412 6200"); the feed's own text stays in the tooltip.
            title={p.display ? p.text : undefined}
            className="inline-flex min-h-11 items-center whitespace-nowrap font-medium text-ink underline decoration-hair-2 underline-offset-[3px] hover:decoration-ink"
          >
            {p.display ?? p.text}
          </a>
        ) : (
          <span key={i}>{p.text}</span>
        ),
      )}
    </bdi>
  );
}

/** Local emergency numbers: one big number ("911"), or a short list (police, ambulance…). */
export function LocalNumbers({ emergency, compact, iso, lang }: { emergency: LocalEmergency; compact?: boolean; iso?: string; lang: Lang }) {
  const t = useMessages(messages);
  const { primary, numbers, lead } = emergency;
  if (!primary && !numbers.length) {
    return lead ? (
      <p className="m-0 text-[14.5px] text-ink-2">
        <Feed lang={lang}>{lead}</Feed>
      </p>
    ) : <p className="m-0 text-[14.5px] text-ink-3">{t('help.localUnknown')}</p>;
  }
  return (
    <div>
      {primary ? (
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          {primary.split(/\s+(?:or|ou)\s+/i).map((n) => {
            const href = telHref(n, { iso, local: true });
            const big = cn('rounded-[12px] font-serif leading-none tracking-[-.03em] text-maple-ink [font-variation-settings:"opsz"_72]', compact ? 'text-[34px]' : 'text-[44px]');
            // A number we can't turn into a safe `tel:` is plain text: same size, not styled as a link.
            return href ? (
              <a key={n} href={href} className={cn(big, 'no-underline hover:underline')}>
                <bdi dir="ltr">{n}</bdi>
              </a>
            ) : (
              <span key={n} className={big}>
                <bdi dir="ltr">{n}</bdi>
              </span>
            );
          })}
          <span className="text-[14px] text-ink-3">{t('help.localAll')}</span>
        </div>
      ) : null}
      {numbers.length ? (
        // Rows are always full: 3 numbers sit 3 across in a wide column (Japan), 2 or 4 pair up, and an odd
        // last one takes the whole row.
        <dl
          className={cn(
            'm-0 grid gap-2',
            primary ? 'mt-3' : '',
            numbers.length === 3 ? '@xl:grid-cols-3' : '@md:grid-cols-2 @md:[&>*:last-child:nth-child(odd)]:col-span-2',
          )}
        >
          {numbers.map((n, i) => (
            <div key={`${n.label}-${i}`} className="flex min-h-11 items-center justify-between gap-3 rounded-[14px] border border-hair bg-card px-3.5 py-2">
              <dt className="min-w-0 text-[14px] leading-snug text-ink-2">
                <Feed lang={lang}>{capFirst(n.label)}</Feed>
              </dt>
              <dd className="m-0 shrink-0 text-end font-serif text-[22px] leading-none tracking-[-.02em] text-ink">
                <PhoneLink number={n.number} iso={iso} local className="font-normal [&_a]:font-normal [&_a]:no-underline" />
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
    </div>
  );
}

/** An embassy or high commission, in the feed's English or French. */
const MISSION = /embass|ambassade|high commission|haut-commissariat/i;

/** Canadian embassies and consulates; first `initial` shown, the rest behind "Show all". */
export function OfficeList({ offices, initial = 3, iso, lang }: { offices: Office[]; initial?: number; iso?: string; lang: Lang }) {
  const t = useMessages(messages);
  const more = useShowAll<HTMLLIElement>(initial);
  const shown = more.open ? offices : offices.slice(0, initial);
  if (!offices.length) return <p className="m-0 text-[14px] text-ink-3">{t('help.noOffices')}</p>;
  // The feed flags passport services per office, and the flag can be missing where the service exists (the
  // embassy in Mexico City). A tag on the consulate but not the embassy would read as "the embassy doesn't do
  // passports", so tags show only when the list's embassy or high commission carries one too; otherwise one
  // neutral line under the list.
  const tagged = offices.some((o) => o.passportServices && MISSION.test(o.type));
  return (
    <>
      <ul className="m-0 grid list-none grid-cols-[minmax(0,1fr)] gap-2 p-0">
        {shown.map((o, i) => (
          <li
            key={`${o.city}-${o.type}-${i}`}
            {...more.revealed(i)}
            className={cn('rounded-[16px] border border-hair bg-card px-4 py-3', REVEAL_FOCUS)}
          >
            <div className="flex items-start gap-3">
              <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-[10px] bg-paper-2 text-ink-2" aria-hidden>
                <Building2 className="size-4" strokeWidth={1.8} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="m-0 text-[15px] font-semibold leading-snug text-ink">
                  <Feed lang={lang}>{o.city}</Feed>
                </p>
                <p className="m-0 text-[13.5px] leading-snug text-ink-3">
                  <Feed lang={lang}>{o.type}</Feed>
                </p>
                {o.address ? (
                  <p className="m-0 mt-1 text-[13px] leading-snug text-ink-3">
                    <Feed lang={lang}>{o.address}</Feed>
                  </p>
                ) : null}
                <div className="mt-1.5 flex min-w-0 flex-wrap items-center gap-x-4 text-[14px]">
                  {o.phone ? (
                    <span className="inline-flex min-w-0 max-w-full items-center gap-1.5">
                      <Phone className="size-3.5 shrink-0 text-ink-3" aria-hidden strokeWidth={2} />
                      <span className="sr-only">{t('help.phone')}</span>
                      <PhoneLink number={o.phone} iso={iso} className="text-ink-2" />
                    </span>
                  ) : null}
                  {o.email ? (
                    <a
                      href={`mailto:${o.email}`}
                      className="inline-flex min-h-11 min-w-0 max-w-full items-center gap-1.5 text-ink-2 underline decoration-hair-2 underline-offset-[3px] hover:text-ink"
                    >
                      <Mail className="size-3.5 shrink-0 text-ink-3" aria-hidden strokeWidth={2} />
                      {/* Breaks only after the @ ("monterreyconsular@" / "international.gc.ca"), never mid-word unless it must. */}
                      <bdi dir="ltr" className="min-w-0 [overflow-wrap:break-word]">
                        {o.email.split('@')[0]}
                        {o.email.includes('@') ? (
                          <>
                            @<wbr />
                            {o.email.slice(o.email.indexOf('@') + 1)}
                          </>
                        ) : null}
                      </bdi>
                    </a>
                  ) : null}
                </div>
                {tagged && o.passportServices ? <p className="m-0 mt-1.5 font-mono text-[11.5px] uppercase tracking-[.08em] text-pine">{t('help.passportServices')}</p> : null}
              </div>
            </div>
          </li>
        ))}
      </ul>
      {offices.length > initial ? (
        <ShowAll open={more.open} onToggle={more.toggle} more={t('help.showAll', { count: offices.length })} fewer={t('help.showFewer')} className="mt-2 px-2" />
      ) : null}
      {tagged && offices.every((o) => o.passportServices) ? null : (
        <p className="m-0 mt-2 px-1 text-[13px] leading-snug text-ink-3">{t(tagged ? 'help.passportNoteTagged' : 'help.passportNote')}</p>
      )}
    </>
  );
}
