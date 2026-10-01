'use client';
/**
 * Letter explainer, once the tool has answered (loaded on demand by ./index):
 *  - identify: "Which document do you have?" picker (no document details yet)
 *  - explained: the verdict, the dates that matter (CRA holiday rule) and the first next steps (saved on the
 *    device); what the letter says, where to look, the official pages and the scam check wait in one group of
 *    rows below, so the card stays short. Then the handoff.
 *  - verify focus: the interactive scam check leads
 * Every day count follows the reader's own date (`useLiveDates`), not the moment the tool ran.
 */
import type { ReactNode } from 'react';
import { BookOpen, Bookmark, BookmarkCheck, EyeOff, FileCheck, FileText, Info, Landmark, ShieldAlert, TextQuote } from 'lucide-react';
import { Badge, Button, Disclosure, LiveRegion, Notice, WidgetSection, WidgetShell } from '@/components/ui';
import { useDeviceItem } from '@/lib/device-store';
import { useMessages } from '@/lib/i18n/widget';
import { Amounts } from './Amounts';
import type { Deadline, ExplainOutput } from './explain';
import { DeadlineRow, PaymentRow } from './Dates';
import { Identify } from './Identify';
import { hasZones } from './LetterArt';
import { BADGE_TEXT, pickSources, useDates, useLang, useLiveDates } from './local';
import messages from './messages';
import { OfficialPages } from './OfficialPages';
import { RealCheck } from './RealCheck';
import { Asks, Says } from './Says';
import { ScamCheck, useScamSigns } from './ScamCheck';
import { Steps } from './Steps';
import { url } from './urls';
import { Verdict } from './Verdict';
import { statedAmount } from './verdict-of';
import { WhereToLook } from './WhereToLook';

export default function DocumentExplainer({ data }: { data: ExplainOutput }) {
  return data.mode === 'identify' ? <Identify data={data} /> : <Explained data={data} />;
}

function Explained({ data: answer }: { data: ExplainOutput }) {
  const t = useMessages(messages);
  const lang = useLang();
  const data = useLiveDates(answer);
  const doc = data.docType && data.docType !== 'other' ? data.docType : null;
  const verify = data.focus === 'verify' || data.scam.level === 'high';
  const cra = data.dept === 'cra' || (!doc && data.issuer === 'unknown');
  const docTitle = doc ? t(`doc.${doc}.title`) : data.extracted.title || (data.focus === 'verify' ? t('badge.verify') : t('doc.other.name'));
  const sender = data.dept ? t(`dept.short.${data.dept}`) : t(`issuer.${data.issuer}`);
  // The header says who sent it and what it is; the verdict's eyebrow says when (tax year, date issued).
  const subtitle = `${sender} · ${docTitle}`;
  // The first date still ahead today: what "Save deadline" keeps. None left: nothing to save.
  const primary = data.deadlines.find((d) => d.days >= 0) ?? null;

  const [saved, save] = useDeviceItem<{ doc: string; date: string; label: string }>(`documents:deadline:${doc ?? 'other'}`, { label: t('saved.label'), kind: 'reminder' });
  const labelOf = (d: Deadline) => (d.source === 'letter' ? d.label || t('dl.letter') : t(`dl.${d.rule}`));
  const { long } = useDates(data.today);
  // One source of truth for the scam check: the verdict and the checklist read the same ticked signs.
  const scam = useScamSigns(data.scam.signs);

  const handoffKey = data.handoff?.key;
  // The note about what happens there sits under the buttons, with the card's closing line (see `footnote`).
  const handoff = handoffKey ? { href: url(handoffKey, lang), label: t(`handoff.${handoffKey}`) } : undefined;
  // Amounts the verdict already states aren't repeated below it.
  const stated = statedAmount(data);
  const amounts = data.extracted.amounts.filter((a) => !stated(a));
  // The handoff button already goes to its page: don't list it twice.
  const links = data.links.filter((l) => l.key !== handoffKey).map((l) => ({ key: l.key, href: url(l.key, lang), label: t(`link.${l.key}`) }));
  const provincial = !doc && (data.issuer === 'provincial' || data.issuer === 'other-federal');
  // Only claim to have read a document when details from one actually reached the tool.
  const x = data.extracted;
  const fromDocument = !!(x.summary || x.title || x.issuedOn || x.taxYear || x.formCode || x.amounts.length || x.dates.length || x.actions.length) || data.redacted;
  const footnote = [
    handoffKey ? t(`handoff.${handoffKey}.note`) : '',
    verify && !doc && !x.summary ? t('footnote.verify') : fromDocument ? t(verify ? 'footnote.explained.message' : 'footnote.explained') : t('footnote.general'),
    data.redacted ? t('footnote.redacted') : '',
  ]
    .filter(Boolean)
    .join(' ');

  const dated = data.deadlines.length > 0 || !!data.nextPayment;
  const says = !!(x.summary || x.actions.length);
  // What this kind of document is: said when the verdict hasn't already made it its subject.
  const about = doc && data.headline.kind !== 'info' ? t(`doc.${doc}.what`) : undefined;
  // A guided letter keeps its reference material in one group of rows, closed until asked for; only what the
  // letter asks for stays in the open. A card with no guide to lead with shows what the letter says outright.
  const grouped = !!doc && !verify;
  const saysOpen = says && (!grouped || !data.steps.length);
  const asksOpen = !saysOpen && x.actions.length > 0;
  const whatRow = grouped && !saysOpen && (x.summary || about);
  const lookRow = grouped && hasZones(doc) && data.look > 0;
  const linksRow = grouped && links.length > 0;
  const realRow = grouped && cra;
  const rowTitle = (icon: ReactNode, text: string) => (
    <>
      {icon}
      {text}
    </>
  );

  return (
    <WidgetShell
      icon={verify ? ShieldAlert : FileText}
      tone={verify ? 'amber' : 'glacier'}
      title={t('title')}
      subtitle={subtitle}
      // Say that numbers were hidden only when some were; otherwise just where the details came from.
      badge={
        data.redacted ? (
          <Badge icon={EyeOff} className={BADGE_TEXT}>
            {t('badge.private')}
          </Badge>
        ) : fromDocument ? (
          // A scam check is as often about a text, a call or an email as about a letter: don't call it a document.
          <Badge icon={FileCheck} className={BADGE_TEXT}>
            {t(verify ? 'badge.message' : 'badge.document')}
          </Badge>
        ) : !verify ? (
          <Badge icon={BookOpen} className={BADGE_TEXT}>
            {t('badge.general')}
          </Badge>
        ) : null
      }
      sources={pickSources(data, lang)}
      handoff={handoff}
      secondaryAction={
        primary ? (
          <>
            <Button
              icon={saved ? BookmarkCheck : Bookmark}
              size="lg"
              aria-pressed={!!saved}
              // On phones the handoff is full width: the two stacked buttons match.
              className="max-sm:w-full"
              onClick={() => save({ doc: docTitle, date: primary.date, label: labelOf(primary) }, { detail: t('saved.detail', { name: docTitle, date: long(primary.date) }) })}
            >
              {saved ? t('action.saved') : t('action.save')}
            </Button>
            <LiveRegion text={saved ? t('action.saved') : ''} delay={300} />
          </>
        ) : null
      }
      footnote={<span className="block max-w-[80ch] text-[13.5px] leading-[1.45] text-ink-2">{footnote}</span>}
      // The shell's aurora rule stays (as on the picker and the forms finder, so consecutive cards from this
      // widget share one top edge); the verdict banner sits beneath it.
      className="@container"
    >
      <Verdict data={data} doc={doc} scam={verify ? { count: scam.on.length, touched: scam.touched } : null} />

      {verify ? (
        <WidgetSection title={t('sec.scam')}>
          <ScamCheck on={scam.on} onToggle={scam.toggle} lang={lang} />
        </WidgetSection>
      ) : null}

      {dated || amounts.length ? (
        <WidgetSection className="pt-6">
          {dated ? (
            <>
              <h4 className="sr-only">{t('sec.dates')}</h4>
              <ul className="m-0 list-none p-0">
                {data.nextPayment ? <PaymentRow p={data.nextPayment} today={data.today} lang={lang} /> : null}
                {data.deadlines.map((d) => (
                  <DeadlineRow
                    key={d.id}
                    d={d}
                    label={labelOf(d)}
                    issuedOn={x.issuedOn}
                    today={data.today}
                    docTitle={docTitle}
                    handoff={handoff?.href ?? data.sources[0]?.url ?? ''}
                    // The verdict already explains the holiday grace for the date it leads with.
                    graceInVerdict={!verify && data.headline.kind === 'deadline' && data.headline.date === d.date && d.status !== 'passed'}
                  />
                ))}
              </ul>
            </>
          ) : null}
          {amounts.length ? (
            <>
              <h4 className="sr-only">{t('sec.numbers')}</h4>
              <Amounts amounts={amounts} className={dated ? 'mt-4 border-t border-hair pt-4' : undefined} />
            </>
          ) : null}
        </WidgetSection>
      ) : null}

      {saysOpen ? (
        <WidgetSection title={t('sec.says')}>
          <Says summary={x.summary} about={about} actions={x.actions} />
        </WidgetSection>
      ) : null}

      {asksOpen ? (
        <WidgetSection title={t('sec.asks')}>
          <Asks actions={x.actions} />
        </WidgetSection>
      ) : null}

      {!doc && !verify ? (
        <div className="px-5 pt-5 sm:px-6">
          <Notice tone="info" icon={Info}>
            {provincial && data.issuer === 'provincial' ? t('sec.provincial') : t('sec.noGuide')}
          </Notice>
        </div>
      ) : null}

      {doc && data.steps.length ? <Steps doc={doc} steps={data.steps} /> : null}

      {whatRow || lookRow || linksRow || realRow ? (
        <div className="px-5 pt-6 sm:px-6">
          <div className="rounded-tile border border-hair bg-paper-2/60 px-4 [&>section:first-child]:border-t-0">
            {whatRow ? (
              <Disclosure
                title={rowTitle(<TextQuote className="size-[18px] shrink-0 text-glacier" strokeWidth={1.9} aria-hidden />, x.summary ? t('sec.says') : t('sec.what'))}
                // A purpose-written line, never a cut-off excerpt: the full text is one tap away.
                summary={t('what.hint')}
              >
                <div className="border-t border-hair pb-3 pt-4">
                  <Says summary={x.summary} about={about} />
                </div>
              </Disclosure>
            ) : null}
            {lookRow ? <WhereToLook doc={doc} count={data.look} /> : null}
            {linksRow ? (
              <Disclosure
                title={rowTitle(<Landmark className="size-[18px] shrink-0 text-glacier" strokeWidth={1.9} aria-hidden />, t('sec.links'))}
                count={links.length}
                summary={t('links.hint')}
              >
                <div className="border-t border-hair pb-3 pt-4">
                  <OfficialPages links={links} />
                </div>
              </Disclosure>
            ) : null}
            {realRow ? <RealCheck lang={lang} /> : null}
          </div>
        </div>
      ) : null}

      {!grouped && about && !saysOpen ? (
        <WidgetSection title={t('sec.what')}>
          <Says about={about} />
        </WidgetSection>
      ) : null}

      {!grouped && links.length ? (
        <WidgetSection title={t('sec.links')}>
          <OfficialPages links={links} />
        </WidgetSection>
      ) : null}

      {!grouped && !verify && cra ? (
        <div className="px-5 pt-6 sm:px-6">
          <div className="rounded-tile border border-hair bg-paper-2/60 px-4 [&>section:first-child]:border-t-0">
            <RealCheck lang={lang} />
          </div>
        </div>
      ) : null}
    </WidgetShell>
  );
}
