'use client';
/**
 * Language picker: searchable list of every supported language, each shown in its own script.
 * Official languages come first. Languages without a reviewed interface are marked honestly:
 * the AI answers in them while menus stay in English.
 *
 * <LanguagePicker open={open} onClose={…} onPicked={…} />
 * `onPicked` (optional): called after a language is chosen, instead of `onClose` — e.g. the Menu closes
 * itself too, so choosing a language returns straight to the page (iOS pickers commit and dismiss).
 * The list renders only once the sheet is first opened (see `Sheet`).
 */
import { useState } from 'react';
import { Check, Search } from 'lucide-react';
import { pack } from '@/countries/active';
import { Sheet } from '@/components/ui/Sheet';
import { cn } from '@/lib/cn';
import { useSettled } from '@/lib/hooks/settled';
import { LOCALES, localeInfo, type Locale, type LocaleInfo } from '@/lib/i18n/config';
import { useLocale, useSetLocale } from '@/lib/i18n/provider';

/** Supported languages, official first (fixed per pack, so computed once). */
const SUPPORTED = LOCALES.filter((l) => pack.locales.supported.includes(l.code));
const OFFICIAL = SUPPORTED.filter((l) => pack.locales.official.includes(l.code));
const OTHERS = SUPPORTED.filter((l) => !pack.locales.official.includes(l.code));

/** Each language's name in the interface language ("الإسبانية" in Arabic, "espagnol" in French), built once per interface language. */
const namesByIntl = new Map<string, Map<Locale, string>>();
function namesIn(intl: string): Map<Locale, string> {
  let names = namesByIntl.get(intl);
  if (!names) {
    let dn: Intl.DisplayNames | null = null;
    try {
      dn = new Intl.DisplayNames([intl], { type: 'language' });
    } catch {}
    names = new Map();
    for (const l of SUPPORTED) {
      let n: string | undefined;
      try {
        n = dn?.of(l.code);
      } catch {}
      names.set(l.code, n && n !== l.code ? n : l.english);
    }
    namesByIntl.set(intl, names);
  }
  return names;
}

/** How long after choosing to announce it: the sheets have closed by then (content behind a modal is inert). */
const ANNOUNCE_AFTER_MS = 450;

export function LanguagePicker({ open, onClose, onPicked }: { open: boolean; onClose: () => void; onPicked?: () => void }) {
  const { t, locale } = useLocale();
  const { setLocale } = useSetLocale();
  // "Language: العربية", announced politely once the value has settled (cleared until then).
  const [picked, setPicked] = useState<{ label: string; code: Locale } | null>(null);
  const settled = useSettled(picked, ANNOUNCE_AFTER_MS);
  const said = settled === picked ? picked : null;

  const pick = (code: Locale) => {
    setPicked({ label: t('lang.title'), code });
    if (code !== locale) setLocale(code);
    (onPicked ?? onClose)();
  };

  return (
    <>
      <p className="sr-only" role="status" aria-live="polite">
        {said ? (
          <>
            {said.label}: <span lang={said.code}>{localeInfo(said.code).endonym}</span>
          </>
        ) : null}
      </p>
      <Sheet open={open} onClose={onClose} title={t('lang.title')} description={t('lang.description')}>
        <LanguageList onPick={pick} />
      </Sheet>
    </>
  );
}

function LanguageList({ onPick }: { onPick: (code: Locale) => void }) {
  const { t, locale, intl } = useLocale();
  const [q, setQ] = useState('');
  const names = namesIn(intl);
  const nameOf = (l: LocaleInfo) => names.get(l.code) ?? l.english;
  const needle = q.trim().toLowerCase();
  const match = (l: LocaleInfo) =>
    !needle ||
    l.endonym.toLowerCase().includes(needle) ||
    l.english.toLowerCase().includes(needle) ||
    nameOf(l).toLowerCase().includes(needle) ||
    l.code.toLowerCase() === needle;
  const official = OFFICIAL.filter(match);
  const rest = OTHERS.filter(match);
  const answersOnly = t('lang.answersOnly');
  const choose = (code: Locale) => {
    setQ('');
    onPick(code);
  };
  const row = (l: LocaleInfo) => <LanguageRow key={l.code} l={l} name={nameOf(l)} current={l.code === locale} answersOnly={answersOnly} onPick={choose} />;

  return (
    <>
      <label className="relative mt-2 block">
        <span className="sr-only">{t('lang.search')}</span>
        <Search className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-3" aria-hidden />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t('lang.search')}
          className="min-h-12 w-full rounded-[14px] border border-hair-2 bg-card ps-10 pe-3 text-[16px] placeholder:text-ink-3 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ink"
        />
      </label>
      {official.length ? (
        <>
          <h3 className="eyebrow mb-2 mt-6">{t('lang.official')}</h3>
          <ul className="m-0 grid list-none grid-cols-[minmax(0,1fr)] gap-1 p-0">{official.map(row)}</ul>
        </>
      ) : null}
      {rest.length ? (
        <>
          <h3 className="eyebrow mb-1 mt-6">{t('lang.more')}</h3>
          <p className="m-0 mb-2 text-[13px] leading-snug text-ink-3">{t('lang.answersNote')}</p>
          <ul className="m-0 grid list-none grid-cols-[minmax(0,1fr)] gap-1 p-0">{rest.map(row)}</ul>
        </>
      ) : null}
      {!official.length && !rest.length ? <p className="mt-6 text-ink-3">{t('lang.none')}</p> : null}
      <p className="mt-6 text-[13px] leading-snug text-ink-3">{t('lang.note')}</p>
    </>
  );
}

function LanguageRow({
  l,
  name,
  current,
  answersOnly,
  onPick,
}: {
  l: LocaleInfo;
  name: string;
  current: boolean;
  answersOnly: string;
  onPick: (code: Locale) => void;
}) {
  // Rows follow the interface direction so endonyms and descriptions share one column; only the
  // endonym itself carries its own language + direction.
  return (
    <li>
      <button
        type="button"
        onClick={() => onPick(l.code)}
        aria-current={current ? 'true' : undefined}
        className={cn(
          'flex min-h-14 w-full items-center gap-3 rounded-[16px] px-3 py-2.5 text-start transition-colors hover:bg-paper-2',
          current && 'bg-paper-2',
        )}
      >
        <span className="min-w-0 flex-1">
          <span className="block text-[16px] font-medium leading-snug text-ink">
            <bdi lang={l.code} dir="auto">
              {l.endonym}
            </bdi>
          </span>
          {/* Language names come from the browser's Intl data, which can differ slightly from the server's. */}
          <span className="block text-[12.5px] leading-snug text-ink-3" suppressHydrationWarning>
            {name}
            {l.ui ? null : ` · ${answersOnly}`}
          </span>
        </span>
        {current ? <Check className="size-5 shrink-0 text-pine" aria-hidden /> : null}
      </button>
    </li>
  );
}
