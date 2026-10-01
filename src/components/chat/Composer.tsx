'use client';
/**
 * Composer: the question box used on the landing hero, the closing section and the chat dock.
 *
 * <Composer variant="hero|closing|dock" placeholders={[…]} placeholderLang="fr" hint="…" />
 * - Autosizing textarea; Enter sends, Shift+Enter adds a line (IME-safe).
 * - Attach images or PDFs (max 3; previews with remove), voice input via the Web Speech API with a
 *   graceful fallback message, and a send button that becomes Stop while an answer streams.
 * - Rotating example placeholder (pauses on focus, static with reduced motion; never blank).
 * - Registers itself with the composer registry (`./composers`), so the app can focus it without the DOM.
 */
import './composer.css';
import { use, useCallback, useEffect, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore, type FormEvent, type Ref } from 'react';
import { flushSync } from 'react-dom';
import { ArrowUp, FileText, Mic, MicOff, Paperclip, Square, X } from 'lucide-react';
import { cx } from '@/lib/cx';
import { useLocale } from '@/lib/i18n/provider';
import { UPLOAD_LIMITS } from '@/lib/ai/limits.shared';
import { redactPii } from '@/lib/pii';
import { useChatCommands, useChatStatus } from './actions';
import { MaxInputCharsContext, useComposers, type ComposerHandle, type ComposerVariant } from './composers';
import { RotatingPlaceholder } from './RotatingPlaceholder';
import { useAttachments, type AttachmentRejection } from './useAttachments';
import { useSpeechInput } from './useSpeechInput';

export type { ComposerHandle } from './composers';

const noStore = () => () => {};
const noNote = () => null;

type Props = {
  variant?: ComposerVariant;
  placeholders: string[];
  /** Shorter placeholders for phones (same order as `placeholders`); used below 760px. */
  compactPlaceholders?: string[];
  placeholderLang?: string;
  hint?: string;
  label?: string;
  className?: string;
  id?: string;
  ref?: Ref<ComposerHandle>;
};

export function Composer({ variant = 'dock', placeholders, compactPlaceholders, placeholderLang, hint, label, className, id, ref }: Props) {
  const { t, intl } = useLocale();
  const { send, stop } = useChatCommands();
  const status = useChatStatus();
  const composers = useComposers();
  const maxInputChars = use(MaxInputCharsContext);
  const [text, setText] = useState('');
  const [focused, setFocused] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  // A note left by the landing's composer as it sent the first question (it unmounts when the chat opens).
  const carried = useSyncExternalStore(composers?.subscribeNote ?? noStore, composers?.note ?? noNote, noNote);
  const shownNote = note ?? (variant === 'dock' ? carried : null);
  const ta = useRef<HTMLTextAreaElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const busy = status === 'submitted' || status === 'streaming';
  const hasText = text !== '';
  const attachments = useAttachments({
    onRejected: (reason: AttachmentRejection) =>
      setNote(reason === 'count' ? t('composer.maxFiles', { max: UPLOAD_LIMITS.maxFiles }) : reason === 'type' ? t('composer.fileType') : t('composer.fileSize')),
  });
  const voice = useSpeechInput({
    lang: intl,
    onText: setText,
    onUnsupported: () => setNote(t('composer.voiceUnsupported')),
    onDenied: () => setNote(t('composer.voiceDenied')),
  });

  const handle = useMemo<ComposerHandle>(
    () => ({
      focus: (options) => ta.current?.focus(options),
      setText: (v) => {
        flushSync(() => setText(v));
        ta.current?.focus();
      },
    }),
    [],
  );
  useImperativeHandle(ref, () => handle, [handle]);
  const registerForm = useCallback(() => composers?.register(variant, handle), [composers, variant, handle]);

  // Autosize before paint, so the box never shows a frame at the old height.
  useLayoutEffect(() => {
    const el = ta.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, variant === 'dock' ? 200 : 260)}px`;
  }, [text, variant]);

  useEffect(() => {
    if (!note) return;
    const tm = setTimeout(() => setNote(null), 4200);
    return () => clearTimeout(tm);
  }, [note]);

  function submit(e?: FormEvent) {
    e?.preventDefault();
    if (busy) return;
    const value = text.trim();
    if (!value && !attachments.files.length) {
      ta.current?.focus();
      return;
    }
    if (value.length > maxInputChars) {
      setNote(t('composer.tooLong', { max: maxInputChars }));
      return;
    }
    const { text: safe, found } = redactPii(value);
    if (found.length) {
      setNote(t('composer.piiRemoved'));
      if (variant !== 'dock') composers?.leaveNote(t('composer.piiRemoved'));
    }
    voice.abort();
    send(safe || t('composer.fileOnly'), attachments.parts);
    setText('');
    attachments.clear();
  }

  async function onFiles(list: FileList | null) {
    await attachments.add(list);
    if (fileInput.current) fileInput.current.value = '';
    ta.current?.focus();
  }

  const isHero = variant === 'hero';
  const inputId = id ?? `composer-${variant}`;

  return (
    <form
      ref={registerForm}
      onSubmit={submit}
      className={cx('ac-composer', `ac-composer--${variant}`, className)}
      style={{ viewTransitionName: variant === 'closing' ? undefined : 'ask-composer' }}
      aria-label={label ?? t('composer.label')}
      role="search"
    >
      <label htmlFor={inputId} className="sr-only">
        {label ?? t('composer.label')}
      </label>
      {attachments.files.length ? (
        <ul className="ac-composer__files" aria-label={t('composer.attachments')}>
          {attachments.files.map((f) => (
            <li key={f.id} className="ac-composer__file">
              {f.mediaType.startsWith('image/') ? (
                <img src={f.url} alt="" className="size-8 rounded-[8px] object-cover" />
              ) : (
                <span className="grid size-8 place-items-center rounded-[8px] bg-maple-wash text-maple">
                  <FileText className="size-4" aria-hidden />
                </span>
              )}
              <span className="max-w-[160px] truncate text-[13px] font-medium">{f.name}</span>
              <button
                type="button"
                className="grid size-7 place-items-center rounded-full text-ink-3 hover:bg-hair hover:text-ink"
                aria-label={t('composer.removeFile', { name: f.name })}
                onClick={() => attachments.remove(f.id)}
              >
                <X className="size-3.5" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="ac-composer__field">
        <textarea
          ref={ta}
          id={inputId}
          name="q"
          // Follows what is typed (Arabic, Urdu, Persian… right-to-left); empty, it follows the page.
          dir={hasText ? 'auto' : undefined}
          rows={isHero ? 2 : 1}
          value={text}
          autoComplete="off"
          enterKeyHint="send"
          maxLength={maxInputChars + 200}
          onChange={(e) => setText(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              submit();
            }
          }}
          aria-describedby={hint ? `${inputId}-hint` : undefined}
        />
        <RotatingPlaceholder placeholders={placeholders} compactPlaceholders={compactPlaceholders} lang={placeholderLang} shown={!hasText} paused={focused} />
      </div>
      <div className="ac-composer__tools">
        <div className="ac-composer__tools-l">
          <input
            ref={fileInput}
            type="file"
            accept={UPLOAD_LIMITS.allowedMedia.join(',')}
            multiple
            hidden
            onChange={(e) => onFiles(e.target.files)}
          />
          <button type="button" className="ac-icon-btn" aria-label={t('composer.attach')} title={t('composer.attach')} onClick={() => fileInput.current?.click()}>
            <Paperclip className="size-5" strokeWidth={1.7} aria-hidden />
          </button>
          <button
            type="button"
            className={cx('ac-icon-btn', voice.listening && 'is-listening')}
            aria-label={voice.listening ? t('composer.voiceStop') : t('composer.voice')}
            title={voice.listening ? t('composer.voiceStop') : t('composer.voice')}
            aria-pressed={voice.listening}
            onClick={() => voice.toggle(text)}
          >
            {voice.listening ? <MicOff className="size-5" strokeWidth={1.7} aria-hidden /> : <Mic className="size-5" strokeWidth={1.7} aria-hidden />}
          </button>
          {hint ? (
            <span id={`${inputId}-hint`} className="ac-composer__hint">
              {hint}
            </span>
          ) : null}
        </div>
        {busy && variant === 'dock' ? (
          <button type="button" className="ac-send is-stop" onClick={() => stop()} aria-label={t('composer.stop')} title={t('composer.stopKey')}>
            <Square className="size-4 fill-current" aria-hidden />
          </button>
        ) : (
          <button type="submit" className="ac-send" aria-label={t('composer.send')} disabled={busy}>
            <ArrowUp className="size-[22px]" strokeWidth={2.1} aria-hidden />
          </button>
        )}
      </div>
      <p className="sr-only" role="status" aria-live="polite">
        {voice.listening ? t('composer.listening') : ''}
      </p>
      {shownNote ? (
        <p className="ac-composer__note" role="status">
          {shownNote}
        </p>
      ) : null}
    </form>
  );
}
