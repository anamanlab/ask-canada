'use client';
/** Who holds the seat: the MP (portrait, caucus, roles, preferred language), or the riding when the seat is vacant or unconfirmed. */
import { Badge } from '@/components/ui';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import { URLS, type Lang } from './data';
import messages from './messages';
import { genderOf, preferredLangs } from './select';
import { LinkRow, Portrait } from './shared';
import type { FindMpOutput, Mp, Riding } from './types';

type Props = { riding: Riding; mp: Mp | null; postal?: string; city?: string; lang: Lang; house: FindMpOutput['house'] };

// "For K1A 0B1 · Ottawa": the code, the dot and the place never split across lines.
const nb = (s: string) => s.replace(/ /g, ' ');

export function MpPerson({ riding, mp, postal, city, lang, house }: Props) {
  const t = useMessages(messages);
  const forLine = postal ? t('mp.verdict.for', { code: nb(postal), city: nb(city ?? riding.provinceName) }) : null;
  return mp ? <Sitting riding={riding} mp={mp} forLine={forLine} /> : <EmptySeat riding={riding} lang={lang} house={house} forLine={forLine} />;
}

/** The answer above already says the seat is vacant: lead with the riding and the next useful facts. */
function EmptySeat({ riding, lang, house, forLine }: Pick<Props, 'riding' | 'lang' | 'house'> & { forLine: string | null }) {
  const t = useMessages(messages);
  const { fmt } = useLocale();
  const vacant = riding.status === 'vacant';
  return (
    <div className="flex flex-col justify-center rounded-card border border-hair bg-[linear-gradient(135deg,var(--amber-wash),transparent_70%)] px-5 py-5" role="group" aria-label={riding.name}>
      {forLine ? <p className="m-0 font-mono text-[11.5px] font-medium uppercase tracking-[.1em] text-ink-2">{forLine}</p> : null}
      <p className="m-0 mt-2 font-serif text-[30px] leading-[1.08] tracking-[-.025em] text-ink [font-variation-settings:'opsz'_48] [text-wrap:balance]">{riding.name}</p>
      <p className="m-0 mt-1 text-[14.5px] text-ink-2">{riding.provinceName}</p>
      <p className="m-0 mt-3 flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
        <Badge tone={vacant ? 'warn' : 'neutral'}>{vacant ? t('mp.vacant.badge') : t('mp.unconfirmed.badge')}</Badge>
        {vacant && house.vacant != null ? <span className="text-[13.5px] text-ink-2">{t('mp.vacant.count', { vacant: house.vacant, seats: fmt.number(house.seats) })}</span> : null}
      </p>
      <p className="m-0 mt-3 max-w-[48ch] text-[14.5px] leading-snug text-ink-2 [text-wrap:pretty]">{vacant ? t('mp.vacant.body') : t('mp.unconfirmed.body')}</p>
      {vacant ? (
        <p className="m-0 mt-3 text-[14px]">
          <LinkRow href={URLS.electionsHome[lang]}>{t('mp.vacant.link')}</LinkRow>
        </p>
      ) : null}
    </div>
  );
}

function Sitting({ riding, mp, forLine }: { riding: Riding; mp: Mp; forLine: string | null }) {
  const t = useMessages(messages);
  const { fmt } = useLocale();
  const langs = preferredLangs(mp.preferredLanguage);
  return (
    <div className="relative flex flex-col justify-center overflow-hidden rounded-card border border-hair bg-[linear-gradient(135deg,var(--maple-wash),transparent_55%),linear-gradient(320deg,var(--glacier-wash),transparent_60%)] px-5 py-5">
      {/* Narrow cards: the "For K1A 0B1 · Ottawa" eyebrow runs full width above the portrait so it never breaks. */}
      {forLine ? <p className="m-0 mb-3.5 font-mono text-[12px] font-medium uppercase tracking-[.1em] text-ink-2 @xl:hidden">{forLine}</p> : null}
      <div className="flex items-start gap-4">
        <Portrait src={mp.photo} name={mp.name} alt={mp.photo ? t('mp.portrait', { name: mp.name }) : t('mp.monogram', { name: mp.name })} />
        <div className="min-w-0 flex-1">
          {forLine ? <p className="m-0 hidden font-mono text-[12px] font-medium uppercase tracking-[.1em] text-ink-2 @xl:block">{forLine}</p> : null}
          <p className="m-0 font-serif text-[30px] leading-[1.05] tracking-[-.025em] text-ink [font-variation-settings:'opsz'_48] @xl:mt-1.5">
            {/* One isolate: the honorific and the name are a single left-to-right run, so the gap stays between them in RTL. */}
            <bdi>
              {mp.honorific ? <span className="me-1.5 align-[.35em] font-sans text-[12px] font-semibold uppercase tracking-[.08em] text-ink-2">{mp.honorific}</span> : null}
              {mp.name}
            </bdi>
          </p>
          <p className="m-0 mt-1.5 text-[14.5px] text-ink-2">{riding.name}</p>
          {mp.caucus || mp.since ? (
            // Caucus and elected date wrap as whole items (never truncated): the date stays on one line when it fits.
            <p className="m-0 mt-2 flex flex-wrap gap-x-2.5 gap-y-0.5 text-[13.5px] leading-snug text-ink-2">
              {mp.caucus ? <span className="font-semibold text-ink">{mp.caucus}</span> : null}
              {mp.since ? (
                <span className="min-w-0">
                  {t('mp.elected', { date: fmt.date(mp.since, { year: 'numeric', month: 'long', day: 'numeric' }), gender: genderOf(mp) })}
                </span>
              ) : null}
            </p>
          ) : null}
        </div>
      </div>
      {mp.roles.length ? (
        <ul className="m-0 mt-4 flex list-none flex-col gap-1.5 border-t border-hair p-0 pt-3.5" aria-label={t('mp.roles')}>
          {mp.roles.slice(0, 3).map((r) => (
            <li key={r} className="flex gap-2.5 text-[14px] leading-snug text-ink">
              <span className="mt-[7px] size-1.5 shrink-0 rounded-full bg-maple" aria-hidden />
              {r}
            </li>
          ))}
        </ul>
      ) : null}
      {/* The House of Commons field is "Preferred Language": say exactly that, in the page's language. */}
      {langs.length ? <p className="m-0 mt-3 text-[13px] text-ink-2">{t('mp.languages', { langs: langs.map((l) => t(`mp.lang.${l}`)).join(' / ') })}</p> : null}
    </div>
  );
}
