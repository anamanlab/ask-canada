'use client';
/** The action row under a complete answer: copy, read aloud, feedback, share, print, retry, other language. */
import { useState } from 'react';
import type { UIMessage } from 'ai';
import { Check, CircleAlert, Copy, Globe, Printer, RotateCcw, Share2, ThumbsDown, ThumbsUp, Volume2, VolumeX } from 'lucide-react';
import { pack } from '@/countries/active';
import { IconButton } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import { useLocale } from '@/lib/i18n/provider';
import { copyText } from './clipboard';
import { useBriefly, useReadAloud, useToast } from './message-hooks';
import { collectSources, textOfMessage } from './sources';

/** The answer as plain text: citations kept as [n], markdown marks removed. */
const plainText = (message: UIMessage) =>
  textOfMessage(message)
    .replace(/\[(\d{1,2})\]\((https?:[^)\s]+)(?:\s+"[^"]*")?\)/g, '[$1]')
    .replace(/[#*_`>]/g, '')
    .trim();

export function MessageActions({
  message,
  question,
  isLast,
  onRegenerate,
}: {
  message: UIMessage;
  question?: string;
  isLast: boolean;
  onRegenerate: (messageId: string, answerLocale?: string) => void;
}) {
  const { t, locale, intl, translated } = useLocale();
  const [copied, markCopied] = useBriefly(1800);
  const [vote, setVote] = useState<'up' | 'down' | null>(null);
  const { toast, flash } = useToast();
  const reader = useReadAloud(intl);
  // The other official language: French from English (or from an English interface around answers in another
  // language); English from French or from any other translated interface.
  const other = locale === 'en' || !translated ? 'fr' : 'en';

  async function copy() {
    const srcs = collectSources(message)
      .map((s) => `[${s.n}] ${s.title} — ${s.url}`)
      .join('\n');
    if (await copyText(`${plainText(message)}\n\n${srcs}`.trim())) {
      markCopied();
      flash(t('chat.copied'));
    } else {
      flash(t('chat.copyFailed'), 'warn');
    }
  }

  function speak() {
    if (!reader.supported()) return flash(t('chat.speakUnsupported'));
    if (reader.speaking) return reader.stop();
    reader.speak(plainText(message).replace(/\[\d+\]/g, ''));
  }

  async function share() {
    const url = new URL('/', window.location.origin);
    if (question) url.searchParams.set('q', question);
    const data = { title: pack.brand.name, text: question ?? pack.brand.name, url: url.toString() };
    try {
      if (navigator.share) await navigator.share(data);
      else if (await copyText(url.toString())) flash(t('chat.linkCopied'));
      else flash(t('chat.copyFailed'), 'warn');
    } catch {
      /* dismissed */
    }
  }

  return (
    <div className="ac-actions no-print">
      <IconButton size="sm" label={copied ? t('chat.copied') : t('chat.copy')} icon={copied ? Check : Copy} onClick={copy} />
      <IconButton
        size="sm"
        label={reader.speaking ? t('chat.stopReading') : t('chat.readAloud')}
        icon={reader.speaking ? VolumeX : Volume2}
        onClick={speak}
        active={reader.speaking}
      />
      <IconButton
        size="sm"
        label={t('chat.helpful')}
        icon={ThumbsUp}
        active={vote === 'up'}
        aria-pressed={vote === 'up'}
        onClick={() => {
          setVote('up');
          flash(t('chat.thanks'));
        }}
      />
      <IconButton
        size="sm"
        label={t('chat.notHelpful')}
        icon={ThumbsDown}
        active={vote === 'down'}
        aria-pressed={vote === 'down'}
        onClick={() => {
          setVote('down');
          flash(t('chat.thanksDown'));
        }}
      />
      <IconButton size="sm" label={t('chat.share')} icon={Share2} onClick={share} />
      <IconButton size="sm" label={t('chat.print')} icon={Printer} onClick={() => window.print()} className="max-sm:hidden" />
      {isLast ? <IconButton size="sm" label={t('chat.retry')} icon={RotateCcw} onClick={() => onRegenerate(message.id)} /> : null}
      <span className="ac-actions__sep" aria-hidden />
      <button type="button" className="ac-actions__lang" onClick={() => onRegenerate(message.id, other)} lang={other}>
        <Globe className="size-4" aria-hidden strokeWidth={1.7} />
        {t('chat.otherLanguage')}
      </button>
      <span className={cn('ac-toast', toast && 'is-on', toast?.tone === 'warn' && 'is-warn')} role="status" aria-live="polite">
        {toast ? (
          <>
            {toast.tone === 'warn' ? <CircleAlert className="size-3.5 shrink-0" aria-hidden /> : <Check className="size-3.5 shrink-0" strokeWidth={2.4} aria-hidden />}
            {toast.text}
          </>
        ) : null}
      </span>
    </div>
  );
}
