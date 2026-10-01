'use client';
import { Check, ShieldQuestion } from 'lucide-react';
import { Disclosure } from '@/components/ui';
import { useMessages } from '@/lib/i18n/widget';
import { PHONES, type Lang } from './data';
import messages from './messages';
import { WithPhones } from './Phones';
import { CompactScamCheck } from './ScamCheck';

/**
 * "Is it really from the CRA?" for a document we already identified: one row of the card's "more" group, so the
 * low-priority check doesn't push the checklist and the handoff down. Opening it shows the three ways to check and the
 * interactive scam check (mounted on first open).
 */
export function RealCheck({ lang }: { lang: Lang }) {
  const t = useMessages(messages);
  const phone = PHONES.craIndividuals[lang];
  return (
    <Disclosure
      lazy
      title={
        <>
          <ShieldQuestion className="size-[18px] shrink-0 text-amber" strokeWidth={1.9} aria-hidden />
          {t('sec.real')}
        </>
      }
      summary={t('real.hint')}
    >
      <ul className="m-0 grid list-none gap-2 border-t border-hair p-0 pt-3.5">
        {(['1', '2', '3'] as const).map((n) => (
          <li key={n} className="flex gap-2.5 text-[15px] leading-snug text-ink-2">
            <Check className="mt-[3px] size-4 shrink-0 text-pine" strokeWidth={2.4} aria-hidden />
            <span>
              <WithPhones text={t(`scam.real.${n}`, { phone })} phones={[phone]} />
            </span>
          </li>
        ))}
      </ul>
      {/* The ways to check it's real are listed just above, so the compact check only adds what to do if it's a scam. */}
      <div className="mb-3 mt-4">
        <CompactScamCheck lang={lang} />
      </div>
    </Disclosure>
  );
}
