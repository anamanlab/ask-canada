'use client';
/** The official page that completes the task, as one primary button under the answer (core `officialHandoff`). */
import { useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { Button, LinkButton } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Field';
import { useLocale } from '@/lib/i18n/provider';
import type { WidgetPart } from '@/lib/widgets/types';

type HandoffOut = { url?: string; label?: string; note?: string; host?: string; search?: { label: string; placeholder?: string } };
type SearchOut = Required<Pick<HandoffOut, 'url' | 'label' | 'search'>> & HandoffOut;

export function HandoffAction({ part }: { part: WidgetPart }) {
  const out = part.output as HandoffOut | undefined;
  if (part.state !== 'output-available' || !out?.url || !out.label) {
    // Reserve the button's height while the call resolves, so nothing jumps.
    return part.state === 'output-error' ? null : <div className="ac-handoff ac-handoff--pending" aria-hidden />;
  }
  if (out.search) return <HandoffSearch out={out as SearchOut} />;
  return (
    <div className="ac-handoff">
      <LinkButton href={out.url} external variant="primary" className="max-sm:w-full">
        {out.label}
      </LinkButton>
      {out.note ? <p className="ac-handoff__note">{out.note}</p> : null}
    </div>
  );
}

/**
 * A handoff to an official finder (e.g. passport offices by postal code). The person types where they
 * are here; we open the official finder in a new tab with it copied, ready to paste (official finders
 * don't accept a prefilled query). Nothing is sent to us or stored.
 */
function HandoffSearch({ out }: { out: SearchOut }) {
  const { t } = useLocale();
  const [q, setQ] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  return (
    <form
      className="ac-handoff ac-handoff--search"
      onSubmit={(e) => {
        e.preventDefault();
        const v = q.trim();
        window.open(out.url, '_blank', 'noopener,noreferrer');
        if (!v) return setCopied(null);
        navigator.clipboard?.writeText(v).then(
          () => setCopied(v),
          () => setCopied(null),
        );
      }}
    >
      <Field label={out.search.label} className="ac-handoff__field">
        {(p) => <Input {...p} value={q} onChange={(e) => setQ(e.target.value)} placeholder={out.search.placeholder} className="min-h-12" autoComplete="postal-code" enterKeyHint="go" maxLength={60} />}
      </Field>
      <Button type="submit" variant="primary" size="lg" iconEnd={ArrowUpRight} className="ac-handoff__go">
        {out.label}
        <span className="sr-only"> {t('a11y.newTab')}</span>
      </Button>
      <p className="ac-handoff__note" role="status">
        {copied ? t('handoff.copied', { query: copied }) : out.note ?? t('handoff.searchNote')}
      </p>
    </form>
  );
}
