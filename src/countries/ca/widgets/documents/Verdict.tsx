'use client';
/** The answer-first verdict at the top of an explained document: what it means for you, in one line. */
import { cn } from '@/lib/cn';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import type { DocId } from './data';
import type { ExplainOutput } from './explain';
import { LetterArt } from './LetterArt';
import { useDates } from './local';
import messages from './messages';
import { verdictOf, type ScamState, type Tone } from './verdict-of';

/** One calm colour per verdict, fading across the banner (no second hue). */
const TONE_BG: Record<Tone, string> = {
  pine: 'border-pine/15 bg-[linear-gradient(120deg,color-mix(in_oklab,var(--pine)_15%,transparent),color-mix(in_oklab,var(--pine)_5%,transparent))]',
  amber: 'border-amber/20 bg-[linear-gradient(120deg,color-mix(in_oklab,var(--amber)_16%,transparent),color-mix(in_oklab,var(--amber)_5%,transparent))]',
  maple: 'border-maple/20 bg-[linear-gradient(120deg,color-mix(in_oklab,var(--maple)_12%,transparent),color-mix(in_oklab,var(--maple)_4%,transparent))]',
  glacier: 'border-glacier/15 bg-[linear-gradient(120deg,color-mix(in_oklab,var(--glacier)_14%,transparent),color-mix(in_oklab,var(--glacier)_5%,transparent))]',
};
const TONE_DISC: Record<Tone, string> = {
  pine: 'bg-pine shadow-[0_0_0_6px_var(--pine-wash)]',
  amber: 'bg-amber shadow-[0_0_0_6px_var(--amber-wash)]',
  maple: 'bg-maple shadow-[0_0_0_6px_var(--maple-wash)]',
  glacier: 'bg-glacier shadow-[0_0_0_6px_var(--glacier-wash)]',
};

export function Verdict({
  data,
  doc,
  scam,
}: {
  /** The answer, re-dated to the reader's today (`useLiveDates`). */
  data: ExplainOutput;
  doc: DocId | null;
  /** Live scam check state (verify mode): the verdict follows what the person ticks. */
  scam: ScamState | null;
}) {
  const t = useMessages(messages);
  const { fmt } = useLocale();
  const { long, short, day } = useDates(data.today);
  const { tone, Icon, head, sub, highlight } = verdictOf(data, doc, scam, { t, money: (n) => fmt.money(n), long, day });
  // When, not who: the shell's subtitle already names the sender and the document.
  const when = [
    data.extracted.taxYear ? t('taxYear', { year: String(data.extracted.taxYear) }) : null,
    data.extracted.issuedOn ? t('issued', { date: short(data.extracted.issuedOn, 'always') }) : null,
  ].filter((x): x is string => !!x);
  // A scam check is about a call, text or email as often as a letter, and marks no place to look: no paper.
  const art = !scam;

  return (
    <div
      className={cn('relative mx-3 flex items-center gap-5 overflow-hidden rounded-card border px-5 py-6 sm:mx-4 @max-md:block @xl:px-6 @xl:py-7', TONE_BG[tone])}
      // Only the scam verdict changes as the person interacts, so only it is a live region.
      {...(scam ? { role: 'status', 'aria-live': 'polite' as const } : {})}
    >
      {/*
        One letter, placed by the width of the card. Phone: it floats in the top corner and the eyebrow and
        headline wrap around it (in flow, so it can never cover a word). Wide: it sits after the text, leaning
        away from it (mirrored where this card itself reads right to left). In between there is no room for it.
      */}
      {art ? (
        <LetterArt
          doc={doc}
          size="sm"
          highlight={highlight}
          className="hidden shrink-0 -rotate-[5deg] [&:dir(rtl)]:rotate-[5deg] @max-md:float-end @max-md:-mt-1 @max-md:mb-2 @max-md:ms-4 @max-md:block @max-md:w-[70px] @xl:order-last @xl:-mb-14 @xl:-mt-1 @xl:me-2 @xl:block @xl:self-start"
        />
      ) : null}
      <div className="flex min-w-0 flex-1 items-start gap-3.5 @max-md:block">
        <span className={cn('grid size-9 shrink-0 place-items-center rounded-full text-paper transition-colors duration-300 @max-md:mb-3', TONE_DISC[tone])} aria-hidden>
          <Icon className="size-[18px]" strokeWidth={2.4} />
        </span>
        <div className="min-w-0">
          {when.length ? (
            // Each item carries its own leading dot, so a wrap never leaves a separator dangling at a line end.
            <p className="m-0 mb-1.5 flex flex-wrap gap-x-2 gap-y-0.5 text-[13.5px] font-medium text-ink-2 @max-md:flex-col">
              {when.map((w, i) => (
                <span key={w} className="whitespace-nowrap">
                  {/* On a phone the two items stack, so the dot would only ever lead a line: drop it there. */}
                  {i ? <span aria-hidden className="@max-md:hidden">·&ensp;</span> : null}
                  {w}
                </span>
              ))}
            </p>
          ) : null}
          {/* Beside the floated letter (phone), balancing breaks the first lines raggedly: wrap as prose there. */}
          <p
            className={cn(
              "m-0 font-serif text-[30px] leading-[1.1] tracking-[-.022em] text-balance text-ink [font-variation-settings:'opsz'_48] @max-md:text-[25px] @max-md:leading-[1.15]",
              art && '@max-md:text-pretty',
            )}
          >
            {head}
          </p>
          {sub ? <p className="m-0 mt-2 max-w-[46ch] text-[16px] leading-[1.4] text-pretty text-ink-2 @max-md:text-[15.5px]">{sub}</p> : null}
        </div>
      </div>
    </div>
  );
}
