'use client';
/**
 * The parts of the eligibility check: the verdict, the 3 Express Entry programs with each minimum requirement
 * ticked or missing, the Federal Skilled Worker selection grid (out of 100, pass mark 67), the money to plan for
 * by family size, and the official tools. Each part depends only on the answers (and published amounts), so the
 * loading state lays out the very same parts to reserve their exact space (EligibilitySkeleton).
 */
import { useState, type Ref } from 'react';
import { CircleAlert, Compass } from 'lucide-react';
import { Badge, ExternalLink, LinkButton, Notice } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import { AssumedNote } from './answers';
import { fswGrid, type AssumedField, type Profile, type ProgramId, type ProgramResult } from './crs';
import { EE_FUNDS, fundsFor, PROGRAMS, URLS, type Lang } from './data';
import messages from './messages';
import { CheckLine, Counter, Hero, Meter, Section, useDate } from './Shared';

const ORDER: ProgramId[] = ['cec', 'fsw', 'fst'];

/**
 * Until the key answers are known: IRCC's own program finder, for people who are still exploring. One link only:
 * the Come to Canada tool is the card's primary action in the footer, so it isn't offered a second time here.
 */
export function OfficialFirst({ lang }: { lang: Lang }) {
  const t = useMessages(messages);
  return (
    <div className="px-5 pt-4 sm:px-6">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-tile border border-hair bg-paper-2 px-4 py-3.5">
        <p className="m-0 flex min-w-[24ch] flex-1 items-start gap-2.5 text-[14px] leading-snug text-ink-2">
          <Compass className="mt-px size-[18px] shrink-0 text-glacier" strokeWidth={1.8} aria-hidden />
          <span>{t('elig.need.official')}</span>
        </p>
        <LinkButton href={URLS.explore[lang]} external variant="secondary" size="md" className="@max-md:w-full">
          {t('elig.other.link')}
        </LinkButton>
      </div>
    </div>
  );
}

/** The verdict in one line, what it means, and every answer we assumed, in words. */
export function Verdict({ profile, assumed, results, focusRef }: { profile: Profile; assumed: AssumedField[]; results: ProgramResult[]; focusRef?: Ref<HTMLDivElement> }) {
  const t = useMessages(messages);
  const ok = results.filter((r) => r.eligible);
  const verdict = ok.length === 0 ? 'none' : ok.length === 1 ? 'one' : 'many';
  return (
    <Hero tone={ok.length ? 'pine' : 'amber'} focusRef={focusRef}>
      <div role="status" aria-live="polite">
        <p className="m-0 font-serif text-[26px] leading-[1.15] tracking-[-.02em] text-ink [font-variation-settings:'opsz'_36]">
          {t(`elig.verdict.${verdict}`, { count: ok.length, program: ok[0]?.id ?? 'other' })}
        </p>
        <p className="m-0 mt-1.5 text-[14.5px] leading-snug text-ink-2">{t(`elig.verdictSub.${verdict}`)}</p>
        <AssumedNote className="mt-3" profile={profile} assumed={assumed} />
      </div>
    </Hero>
  );
}

/** When no Express Entry program fits: the other ways in. */
export function OtherPrograms({ lang }: { lang: Lang }) {
  const t = useMessages(messages);
  return (
    <div className="px-5 pt-5 sm:px-6">
      <Notice tone="info" title={t('elig.other.title')}>
        {t('elig.other.body')}
      </Notice>
      <LinkButton href={URLS.explore[lang]} external variant="secondary" size="md" className="mt-3">
        {t('elig.other.link')}
      </LinkButton>
    </div>
  );
}

/**
 * The 3 programs, each minimum ticked or missing. The Canadian Experience Class language minimum depends on the
 * job (CLB 7 for TEER 0–1, CLB 5 for TEER 2–3): until a skilled job type is given, the line states both and is
 * only ticked (CLB 7+) or crossed (under CLB 5) when the answer is the same either way.
 */
export function Programs({ results, lang, profile, occupationKnown }: { results: ProgramResult[]; lang: Lang; profile: Profile; occupationKnown: boolean }) {
  const t = useMessages(messages);
  const { clbTeer01: high, clbTeer23: low } = PROGRAMS.cec;
  const cecEither = !occupationKnown || profile.occupation === 'other';
  const line = (c: ProgramResult['checks'][number]) =>
    c.key === 'cec.language' && cecEither
      ? { ok: profile.firstClb >= high ? true : profile.firstClb < low ? false : null, text: t('check.cec.languageEither', { high, low }) }
      : { ok: c.ok, text: t(`check.${c.key}`, c.values) };
  return (
    <Section title={t('elig.programs')}>
      <ul className="m-0 grid list-none gap-2.5 p-0 @xl:grid-cols-3">
        {ORDER.map((id) => {
          const r = results.find((x) => x.id === id)!;
          return (
            <li key={id} className={cn('flex flex-col rounded-tile border px-4 pb-1.5 pt-3.5', r.eligible ? 'border-pine/25 bg-pine-wash' : 'border-hair bg-card')}>
              {/* Badge on its own row: long French program names get the card's full width. */}
              <Badge tone={r.eligible ? 'ok' : 'neutral'} className="self-start">
                {r.eligible ? t('elig.badge.yes') : t('elig.badge.no')}
              </Badge>
              <h4 className="m-0 mt-2.5 text-[15.5px] font-semibold leading-snug text-ink">{t(`prog.${id}`)}</h4>
              <p className="m-0 mt-1 text-[13px] leading-snug text-ink-2">{t(`prog.${id}.sub`)}</p>
              <ul className="m-0 mt-3 grid list-none gap-2 p-0">
                {r.checks.map((c) => {
                  const l = line(c);
                  return (
                    <CheckLine key={c.key} ok={l.ok}>
                      {l.text}
                    </CheckLine>
                  );
                })}
              </ul>
              <ExternalLink href={URLS[id][lang]} standalone icon={false} className="mt-1 self-start text-[13.5px] text-ink-2 hover:text-ink">
                {t('elig.readRules')}
              </ExternalLink>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}

/** Federal Skilled Worker selection grid: points out of 100 against the pass mark. */
export function SelectionGrid({ profile }: { profile: Profile }) {
  const t = useMessages(messages);
  const { fmt } = useLocale();
  const grid = fswGrid(profile);
  return (
    <Section
      title={t('elig.grid.title')}
      aside={
        <Badge tone={grid.total >= grid.passMark ? 'ok' : 'warn'} icon={grid.total >= grid.passMark ? undefined : CircleAlert}>
          {t('elig.grid.pass', { pass: grid.passMark })}
        </Badge>
      }
    >
      <div className="flex items-baseline gap-2">
        <span className="font-serif text-[40px] leading-none tracking-[-.03em] text-ink">
          <bdi dir="ltr">{fmt.number(grid.total)}</bdi>
        </span>
        <bdi className="text-[14px] text-ink-3">{t('elig.grid.of', { max: 100 })}</bdi>
      </div>
      <Meter className="mt-3" value={grid.total} max={100} marker={grid.passMark} tone={grid.total >= grid.passMark ? 'pine' : 'amber'} />
      <p className="sr-only">{t('elig.grid.sr', { points: grid.total, pass: grid.passMark })}</p>
      <ul className="m-0 mt-4 grid list-none gap-x-6 gap-y-2 p-0 @xl:grid-cols-2">
        {grid.lines.map((l) => (
          <li key={l.key} className="flex items-baseline justify-between gap-3 border-b border-hair pb-2 text-[14px]">
            <span className="text-ink-2">{t(`fsw.${l.key}`)}</span>
            <bdi dir="ltr" className="whitespace-nowrap text-[13.5px] tabular-nums text-ink-2">
              <b className="font-semibold text-ink">{l.points}</b> / {l.max}
            </bdi>
          </li>
        ))}
      </ul>
      <p className="m-0 mt-3 text-[12.5px] leading-snug text-ink-3">{t('elig.grid.note')}</p>
    </Section>
  );
}

/** Money to plan for: settlement funds by family size (not needed through the CEC) and the application fee. */
export function Money({ results, familySize, fee }: { results: ProgramResult[]; familySize: number; fee: number }) {
  const t = useMessages(messages);
  const { fmt } = useLocale();
  const fdate = useDate();
  const [family, setFamily] = useState(familySize);
  const ok = results.filter((r) => r.eligible);
  const funds = fundsFor(EE_FUNDS, family);
  const fundsNeeded = ok.some((r) => r.id !== 'cec') || ok.length === 0;
  return (
    <Section title={t('elig.money.title')}>
      <div className="grid gap-3 @xl:grid-cols-2">
        <div className={cn('rounded-tile border border-hair bg-paper-2 px-4 py-3.5', !fundsNeeded && 'opacity-80')}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[13.5px] font-semibold text-ink-2">{t('elig.money.funds')}</span>
            <Counter label={t('elig.money.family')} value={family} onChange={setFamily} min={1} max={10} format={(n) => t('family.count', { count: n })} />
          </div>
          <p className="m-0 mt-1 font-serif text-[30px] leading-none tracking-[-.03em] text-ink" aria-live="polite">
            {fmt.money(funds, { cents: 'never' })}
          </p>
          <p className="m-0 mt-1.5 text-[13px] leading-snug text-ink-2">
            {t(fundsNeeded ? 'elig.money.fundsNote' : 'elig.money.fundsCec', { date: fdate(EE_FUNDS.updated, { month: 'long', day: 'numeric', year: 'numeric' }) })}
          </p>
        </div>
        <div className="rounded-tile border border-hair bg-paper-2 px-4 py-3.5">
          <span className="text-[13.5px] font-semibold text-ink-2">{t('elig.money.fee')}</span>
          <p className="m-0 mt-1 font-serif text-[30px] leading-none tracking-[-.03em] text-ink">{fmt.money(fee, { cents: 'never' })}</p>
          <p className="m-0 mt-1.5 text-[13px] leading-snug text-ink-2">{t('elig.money.feeNote')}</p>
        </div>
      </div>
    </Section>
  );
}
