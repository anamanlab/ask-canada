'use client';
/**
 * Forms finder, once the tool has answered (loaded on demand by ./index). Results link to the official form
 * page and the faster online option. Typing a new search loads the catalogue and re-runs the tool's own pure
 * search on the device.
 */
import { useId, useRef, useState } from 'react';
import { BookOpen, FileDown, FileSearch, Landmark, MessageCircleQuestion, Search, X, Zap } from 'lucide-react';
import { Badge, Button, IconButton, Input, LinkButton, LiveRegion, Notice, WidgetSection, WidgetShell } from '@/components/ui';
import { useChatActions } from '@/components/chat/actions';
import { cn } from '@/lib/cn';
import { useMessages } from '@/lib/i18n/widget';
import type { FormsOutput } from './forms';
import type { FormHit, FormSearch, hitSources, searchForms } from './forms-search';
import { pickSources, useLang } from './local';
import messages from './messages';
import { url, type UrlKey } from './urls';

export default function FormsFinder({ data }: { data: FormsOutput }) {
  const t = useMessages(messages);
  const { send } = useChatActions();
  const lang = useLang();
  const [q, setQ] = useState(data.query);
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  // The search and its catalogue arrive when the field is first used; until then the tool's answer stands.
  const [search, setSearch] = useState<{ run: typeof searchForms; cite: typeof hitSources } | null>(null);
  const wanted = useRef(false);
  const wantSearch = () => {
    if (wanted.current) return;
    wanted.current = true;
    import('./forms-search').then(
      (m) => setSearch({ run: m.searchForms, cite: m.hitSources }),
      () => {
        wanted.current = false;
      },
    );
  };
  const fresh = search && q.trim() !== data.query ? search : null;
  const live: FormSearch = fresh ? fresh.run(q, lang, data.dept) : data;
  // The footer cites what the card shows now: after a new search, the forms it found, then the official lists.
  // Nothing matched: point to whoever issues it, the province or territory or another federal department.
  const elsewhere: UrlKey | null = live.results.length || live.passport ? null : live.provincial ? 'provinces' : 'departments';
  const pageKeys: UrlKey[] = [...(live.passport ? (['passports'] as const) : []), ...(elsewhere ? [elsewhere] : []), ...data.more.map((m) => m.key), ...(live.results.length ? (['craPdfHelp'] as const) : [])];
  const pages = data.lang === lang ? data.pages : data.altPages;
  const sources = fresh ? [...fresh.cite(live.results), ...pageKeys.flatMap((k) => pages.find((s) => s.url === url(k, lang)) ?? [])] : pickSources(data, lang);
  const countLine = live.popular ? t('forms.popular') : live.passport && !live.results.length ? null : t('forms.count', { count: live.results.length });

  return (
    <WidgetShell
      icon={FileSearch}
      tone="pine"
      title={t('forms.title')}
      subtitle={t('forms.subtitle')}
      sources={sources}
      className="@container"
    >
      <div className="px-5 sm:px-6">
        <label htmlFor={id} className="mb-1.5 block text-[14px] font-medium text-ink">
          {t('forms.search.label')}
        </label>
        <div className="relative">
          <Search className="pointer-events-none absolute start-3.5 top-1/2 size-[18px] -translate-y-1/2 text-ink-3" aria-hidden />
          <Input
            ref={input}
            id={id}
            type="search"
            value={q}
            onFocus={wantSearch}
            onPointerEnter={wantSearch}
            onChange={(e) => {
              wantSearch();
              setQ(e.target.value);
            }}
            placeholder={t('forms.search.placeholder')}
            autoComplete="off"
            spellCheck={false}
            enterKeyHint="search"
            className={cn('ps-10 [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none', q && 'pe-12')}
          />
          {q ? (
            <IconButton
              label={t('forms.search.clear')}
              icon={X}
              className="absolute end-0.5 top-1/2 -translate-y-1/2 text-ink-3 hover:text-ink"
              onClick={() => {
                wantSearch();
                setQ('');
                input.current?.focus();
              }}
            />
          ) : null}
        </div>
        {/* Empty when the passport notice says it all. Announced once typing settles, not on every keystroke. */}
        {countLine ? (
          <p className="m-0 mt-2 font-mono text-[12px] uppercase tracking-[.08em] text-ink-3">
            <bdi>{countLine}</bdi>
          </p>
        ) : null}
        <LiveRegion text={countLine ?? ''} />
      </div>

      {live.passport ? (
        <div className="px-5 pt-4 sm:px-6">
          <Notice tone="info" icon={BookOpen} title={t('forms.passport.title')}>
            <span className="mt-1 block">{t('forms.passport.body')}</span>
            <LinkButton href={url('passports', lang)} external variant="secondary" size="md" className="mt-3">
              {t('forms.passport.link')}
            </LinkButton>
          </Notice>
        </div>
      ) : null}

      {live.results.length ? (
        <WidgetSection>
          <ul className="m-0 grid list-none gap-2.5 p-0" aria-label={t('forms.listLabel')}>
            {live.results.map((f) => (
              <FormCard key={f.code} f={f} alt={live.lang !== lang} />
            ))}
          </ul>
        </WidgetSection>
      ) : elsewhere ? (
        // One block, one way out: who issues this kind of thing, and the question itself as a fallback.
        <div className="px-5 pt-4 sm:px-6">
          <Notice tone="info" icon={Landmark} title={elsewhere === 'provinces' ? t('forms.provincial.title') : t('forms.empty.title', { q: q.trim() || '…' })}>
            <span className="mt-1 block">{elsewhere === 'provinces' ? t('forms.provincial.body') : t('forms.empty.body')}</span>
            <span className="mt-3 flex flex-wrap gap-2">
              <LinkButton href={url(elsewhere, lang)} external variant="secondary" size="md">
                {t(elsewhere === 'provinces' ? 'link.provinces' : 'handoff.departments')}
              </LinkButton>
              {q.trim() ? (
                <Button variant="quiet" size="md" icon={MessageCircleQuestion} onClick={() => send(q.trim())}>
                  {t('forms.ask')}
                </Button>
              ) : null}
            </span>
          </Notice>
        </div>
      ) : null}

      {/* The PDF tip only helps when there's a form to open. */}
      {live.results.length ? (
        <div className="px-5 pt-4 sm:px-6">
          <Notice tone="info" icon={FileDown} title={t('forms.pdf.title')}>
            <span className="mt-1 block">{t('forms.pdf.body')}</span>
          </Notice>
        </div>
      ) : null}

      <WidgetSection title={t('forms.more')} className="pb-5 sm:pb-6">
        <div className="flex flex-wrap gap-2">
          {data.more.map((m) => (
            <LinkButton key={m.key} href={url(m.key, lang)} external variant="secondary" size="md">
              {t(`link.${m.key}`)}
            </LinkButton>
          ))}
        </div>
      </WidgetSection>
    </WidgetShell>
  );
}

/** `alt`: the card is shown in the other official language than the answer, so the form's title and page are too. */
function FormCard({ f, alt }: { f: FormHit; alt: boolean }) {
  const t = useMessages(messages);
  const lang = useLang();
  const { name, href } = alt ? f.alt : f;
  const nameKey = `forms.purpose.${f.slug}`;
  return (
    <li className="rounded-tile border border-hair bg-card p-4 shadow-sm">
      {/* Narrow column: the code sits above the title so long names get the full width. */}
      <div className="flex flex-col items-start gap-2.5 @md:flex-row @md:gap-3.5">
        <span className="inline-grid min-w-[64px] shrink-0 place-items-center rounded-field bg-paper-2 px-2.5 py-1.5 text-center font-mono text-[13px] font-semibold leading-tight tracking-[.02em] text-ink @md:py-2">
          <bdi dir="ltr">{f.code}</bdi>
        </span>
        <div className="min-w-0 flex-1">
          <p className="m-0 text-[15.5px] font-semibold leading-snug text-ink">{name}</p>
          <p className="m-0 mt-1 text-[14px] leading-snug text-ink-2">{t(nameKey)}</p>
          <p className="m-0 mt-1.5">
            <Badge mono>{t(`dept.short.${f.dept}`)}</Badge>
          </p>
        </div>
      </div>
      {f.online ? (
        <p className="m-0 mt-3 flex items-start gap-2 rounded-field bg-pine-wash px-3 py-2.5 text-[13.5px] leading-snug text-ink">
          <Zap className="mt-px size-4 shrink-0 text-pine" strokeWidth={2} aria-hidden />
          <span>
            <b className="font-semibold text-pine">{t('forms.online')}</b> · {t(`forms.online.${f.online.key}`)}
          </span>
        </p>
      ) : null}
      {/* Phones: buttons fill the row, two side by side when both labels fit (English), stacked when they can't (French). */}
      <div className="mt-3 flex flex-wrap gap-2">
        <LinkButton href={href} external variant={f.online ? 'secondary' : 'primary'} size="md" className="flex-[1_1_7rem] whitespace-nowrap px-3.5 @md:flex-none @md:px-5">
          {t('forms.open')}
        </LinkButton>
        {f.online ? (
          <LinkButton href={url(f.online.key, lang)} external variant="primary" size="md" className="flex-[1_1_7rem] whitespace-nowrap px-3.5 @md:flex-none @md:px-5">
            {t('forms.online')}
          </LinkButton>
        ) : null}
      </div>
    </li>
  );
}
