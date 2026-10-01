'use client';
/**
 * "Check a product" as one search row; the priority allergens are one tap away under it. Each asks a
 * follow-up in the chat, and so runs a fresh live search of the Recalls site.
 */
import { useId, useRef, useState, type FormEvent } from 'react';
import { ArrowRight, Search } from 'lucide-react';
import { Button, Chip, Disclosure, Input } from '@/components/ui';
import { useChatActions } from '@/components/chat/actions';
import { useMessages } from '@/lib/i18n/widget';
import messages from './messages';

const ALLERGENS = ['peanut', 'milk', 'egg', 'sesame', 'soy', 'gluten', 'treeNuts', 'mustard'] as const;

export function RecallFinder() {
  const t = useMessages(messages);
  const { send } = useChatActions();
  const [q, setQ] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const uid = useId();
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const v = q.trim();
    // The button always looks ready: with nothing typed yet, it puts the cursor in the field.
    if (v.length >= 2) send(t('recalls.ask.product', { query: v }));
    else input.current?.focus();
  };
  return (
    <div className="mt-7 border-t border-hair px-5 pt-5 sm:px-6">
      <form onSubmit={submit} role="search" className="relative">
        <label htmlFor={`${uid}-q`} className="sr-only">
          {t('recalls.find.label')}
        </label>
        <Search className="pointer-events-none absolute start-4 top-1/2 size-[18px] -translate-y-1/2 text-ink-3" strokeWidth={1.8} aria-hidden />
        <Input
          ref={input}
          id={`${uid}-q`}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t('recalls.find.placeholder')}
          maxLength={60}
          enterKeyHint="search"
          className="min-h-[52px] rounded-full pe-[68px] ps-11 shadow-sm @md:pe-[124px]"
        />
        <Button type="submit" variant="secondary" size="md" className="absolute end-1.5 top-1/2 -translate-y-1/2 hover:-translate-y-1/2">
          {/* Narrow cards: an arrow, so the field doesn't show two magnifiers. */}
          <ArrowRight className="size-4 flip-rtl @md:hidden" aria-hidden />
          <span className="@max-md:sr-only">{t('recalls.find.go')}</span>
        </Button>
      </form>
      <Disclosure title={<span className="text-[14.5px] font-medium">{t('recalls.find.allergens')}</span>} headingLevel={4} className="mt-1 border-t-0">
        <ul aria-label={t('recalls.find.allergens')} className="m-0 flex list-none flex-wrap gap-2 p-0 pb-1">
          {ALLERGENS.map((a) => (
            <li key={a}>
              <Chip onClick={() => send(t(`recalls.askAllergen.${a}`))} className="px-4 text-[14px]">
                {t(`recalls.allergen.${a}`)}
              </Chip>
            </li>
          ))}
        </ul>
      </Disclosure>
    </div>
  );
}
