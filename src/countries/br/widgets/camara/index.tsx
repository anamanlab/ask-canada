'use client';
/**
 * Widget `camara`: the Chamber of Deputies, as facts.
 *
 * Two cards, one rule both obey: a legislature is reported, never assessed. A deputy card
 * shows the mandate — name, party, state, office — and a proposal card shows the text,
 * the status, the last movements and the last vote with its numbers. Neither ranks,
 * compares, endorses or advises; the day this widget tells anyone whom to support is
 * the day it has failed at the one thing it exists to do.
 *
 * A vote without its placar is shown as what it is. Most votes that matter here are
 * symbolic — "approved the final text" with no nominal record — and presenting the
 * description without numbers is honest, while presenting numbers that were never
 * recorded would be fabrication.
 *
 * Built only from core primitives (`@/components/ui`) and design tokens; no user-visible string in TSX.
 */
import { Landmark, Scale } from 'lucide-react';
import { WidgetError, WidgetShell, WidgetSkeleton } from '@/components/ui';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import type { Renderers, ToolSource, WidgetProps } from '@/lib/widgets/types';
import messages from './messages';

type Deputy = {
  id: number;
  name: string;
  ballotName: string;
  party: string;
  state: string;
  photo?: string;
  email?: string;
  office?: string;
  legislature?: number;
};
type DeputyOutput = { query: string; matches: Deputy[]; reason?: string; sources?: ToolSource[] };

type Movement = { at: string; organ: string; description: string };
type Vote = { at: string; organ: string; description: string; approved?: boolean; yes?: number; no?: number; abstentions?: number };
type Proposal = {
  id: number;
  type: string;
  number: number;
  year: number;
  title: string;
  presentedAt?: string;
  status?: string;
  statusAt?: string;
  organ?: string;
  movements: Movement[];
  lastVote?: Vote;
};
type ProposalOutput = { query: string; proposals: Proposal[]; reason?: string; sources?: ToolSource[] };

function CamaraDeputado({ part }: WidgetProps<{ nome: string }, DeputyOutput>) {
  const t = useMessages(messages);
  const out = part.state === 'output-available' ? part.output : undefined;

  if (part.state === 'output-error') return <WidgetError message={t('error')} />;
  if (part.state !== 'output-available' || !out) {
    return <WidgetSkeleton title={t('deputyTitle')} icon={Landmark} tone="glacier" rows={2} />;
  }
  if (!out.matches.length) {
    return (
      <WidgetShell icon={Landmark} tone="glacier" title={t('deputyTitle')} subtitle={t('deputySubtitle')} sources={out.sources} footnote={t('note')}>
        <p className="m-0 px-5 pb-5 text-[15px] leading-snug text-ink-2 sm:px-6">
          {t('deputyNotFound')} <b className="font-semibold text-ink">{out.query}</b>. {t('deputyNotFoundHint')}
        </p>
      </WidgetShell>
    );
  }
  const d = out.matches[0];
  return (
    <WidgetShell
      icon={Landmark}
      tone="glacier"
      title={t('deputyTitle')}
      subtitle={`${d.ballotName} · ${d.party}/${d.state}`}
      sources={out.sources}
      footnote={t('note')}
    >
      {/* No photo, on purpose: the Câmara serves portraits from its own domain, and loading
        them would hand every visitor's IP to a third party and need a Brazil-specific hole
        in the shared Content-Security-Policy. A mandate is identified by name, party and
        state — not by face — so the card shows the mandate. The photo URL stays in the
        tool output for anyone who wants to look. */}
      <div className="px-5 pb-5 pt-1 sm:px-6">
        <dl className="m-0 grid min-w-0 flex-1 gap-y-2">
          <div>
            <dt className="text-[12px] font-medium uppercase tracking-wide text-ink-3">{t('civilName')}</dt>
            <dd className="m-0 text-[14.5px] font-semibold text-ink">{d.name}</dd>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <div>
              <dt className="text-[12px] font-medium uppercase tracking-wide text-ink-3">{t('party')}</dt>
              <dd className="m-0 text-[14px] text-ink-2">{d.party} · {d.state}</dd>
            </div>
            {d.office ? (
              <div>
                <dt className="text-[12px] font-medium uppercase tracking-wide text-ink-3">{t('office')}</dt>
                <dd className="m-0 text-[14px] text-ink-2">{d.office}</dd>
              </div>
            ) : null}
            {d.email ? (
              <div>
                <dt className="text-[12px] font-medium uppercase tracking-wide text-ink-3">{t('email')}</dt>
                <dd className="m-0 text-[14px] text-ink-2">{d.email}</dd>
              </div>
            ) : null}
          </div>
          {out.matches.length > 1 ? (
            <p className="m-0 text-[12.5px] text-ink-3">
              {t('moreDeputies', { count: out.matches.length - 1, names: out.matches.slice(1).map((m) => `${m.ballotName} (${m.party}/${m.state})`).join(', ') })}
            </p>
          ) : null}
        </dl>
      </div>
    </WidgetShell>
  );
}

function Placar({ vote }: { vote: Vote }) {
  const t = useMessages(messages);
  const hasNumbers = vote.yes !== undefined && vote.no !== undefined;
  return (
    <div className="mt-3 rounded-lg bg-paper-2 px-3.5 py-2.5">
      <p className="m-0 text-[13.5px] font-semibold leading-snug text-ink">{vote.description}</p>
      <p className="m-0 mt-1 text-[12.5px] text-ink-2">
        {vote.organ} · {vote.at}
        {hasNumbers ? (
          <>
            {' · '}
            <span className="font-semibold text-pine">{t('yesVotes', { count: vote.yes! })}</span>
            {' · '}
            <span className="font-semibold text-ink">{t('noVotes', { count: vote.no! })}</span>
            {vote.abstentions ? ` · ${t('abstentions', { count: vote.abstentions })}` : ''}
          </>
        ) : (
          <> · {t('symbolicVote')}</>
        )}
      </p>
    </div>
  );
}

function CamaraProposicao({ part }: WidgetProps<{ busca: string }, ProposalOutput>) {
  const t = useMessages(messages);
  const { fmt } = useLocale();
  const out = part.state === 'output-available' ? part.output : undefined;

  if (part.state === 'output-error') return <WidgetError message={t('error')} />;
  if (part.state !== 'output-available' || !out) {
    return <WidgetSkeleton title={t('proposalTitle')} icon={Scale} tone="glacier" rows={3} />;
  }
  if (!out.proposals.length) {
    return (
      <WidgetShell icon={Scale} tone="glacier" title={t('proposalTitle')} subtitle={t('proposalSubtitle')} sources={out.sources} footnote={t('note')}>
        <p className="m-0 px-5 pb-5 text-[15px] leading-snug text-ink-2 sm:px-6">
          {t('proposalNotFound')} <b className="font-semibold text-ink">{out.query}</b>. {t('proposalNotFoundHint')}
        </p>
      </WidgetShell>
    );
  }
  const p = out.proposals[0];
  return (
    <WidgetShell
      icon={Scale}
      tone="glacier"
      title={t('proposalTitle')}
      subtitle={`${p.type} ${p.number}/${p.year}`}
      sources={out.sources}
      footnote={t('note')}
    >
      <div className="px-5 pb-5 pt-1 sm:px-6">
        <p className="m-0 text-[14.5px] font-semibold leading-snug text-ink">{p.title}</p>
        {p.status ? (
          <p className="m-0 mt-2 inline-flex items-center gap-1.5 rounded-full bg-glacier-wash px-2.5 py-1 text-[12.5px] font-medium text-glacier">
            <span className="size-1.5 rounded-full bg-glacier" aria-hidden />
            {p.status}
            {p.organ ? ` · ${p.organ}` : ''}
            {p.statusAt ? ` · ${fmt.date(p.statusAt, { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}
          </p>
        ) : null}

        {p.lastVote ? (
          <div className="mt-3">
            <p className="m-0 text-[12px] font-medium uppercase tracking-wide text-ink-3">{t('lastVote')}</p>
            <Placar vote={p.lastVote} />
          </div>
        ) : null}

        {p.movements.length > 0 ? (
          <div className="mt-4">
            <p className="m-0 text-[12px] font-medium uppercase tracking-wide text-ink-3">{t('movements')}</p>
            <ul className="m-0 mt-1.5 grid list-none gap-0 p-0">
              {p.movements.map((m, i) => (
                <li key={i} className="border-t border-hair py-2 first:border-t-0 first:pt-0">
                  <p className="m-0 text-[13px] font-medium text-ink-2">
                    {m.organ} · {fmt.date(m.at, { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                  <p className="m-0 mt-0.5 text-[13px] leading-snug text-ink-3">{m.description}</p>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {out.proposals.length > 1 ? (
          <p className="m-0 mt-3 border-t border-hair pt-3 text-[12.5px] text-ink-3">
            {t('moreProposals', { count: out.proposals.length - 1 })}
          </p>
        ) : null}
      </div>
    </WidgetShell>
  );
}

export const renderers: Renderers = { camaraDeputado: CamaraDeputado, camaraProposicao: CamaraProposicao };
export default renderers;