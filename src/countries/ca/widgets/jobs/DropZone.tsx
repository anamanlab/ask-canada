'use client';
/**
 * Where a resume comes in: the full drop card (drop, choose a file, or paste text) and the compact "refine
 * with your resume" strip under the matches. The file is handed to the matcher and read on the device.
 */
import { useId, useRef, useState, type DragEvent, type Ref, type RefObject } from 'react';
import { ClipboardPaste, FileText, LockKeyhole, ScanSearch, Upload } from 'lucide-react';
import { Button, Textarea } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useMessages } from '@/lib/i18n/widget';
import messages from './messages';

const ACCEPT = '.pdf,.docx,.txt,.md,.rtf,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain';
/** Shorter than this isn't a resume or a list of skills yet. */
const MIN_PASTE = 20;

type OnFile = (file: File | undefined) => void;
/** Refs for the two ways in, so the matcher can hand the keyboard back after "Cancel" or "Start over". */
type EntryRefs = { chooseRef: Ref<HTMLButtonElement>; pasteRef: Ref<HTMLButtonElement> };
/** The paste box opens under the button that was pressed: the keyboard goes with it. */
const focusOnMount = (el: HTMLTextAreaElement | null) => el?.focus();

/** Drag-and-drop for one element plus a hidden file input that a button opens. */
function useFilePick(onFile: OnFile) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const dropProps = {
    onDragOver: (e: DragEvent) => {
      e.preventDefault();
      setOver(true);
    },
    onDragLeave: () => setOver(false),
    onDrop: (e: DragEvent) => {
      e.preventDefault();
      setOver(false);
      onFile(e.dataTransfer.files?.[0]);
    },
  };
  return { input, over, dropProps, choose: () => input.current?.click() };
}

function FileInput({ ref, onFile }: { ref: RefObject<HTMLInputElement | null>; onFile: OnFile }) {
  return (
    <input
      ref={ref}
      type="file"
      className="sr-only"
      tabIndex={-1}
      aria-hidden
      accept={ACCEPT}
      onChange={(e) => {
        onFile(e.target.files?.[0]);
        e.target.value = '';
      }}
    />
  );
}

/** The compact strip shown under matches that came from the conversation. */
export function ResumeRefine({ onFile, onPaste, chooseRef, pasteRef }: { onFile: OnFile; onPaste: () => void } & EntryRefs) {
  const t = useMessages(messages);
  const { input, over, dropProps, choose } = useFilePick(onFile);
  return (
    <div {...dropProps} className={cn('flex flex-wrap items-center gap-3 rounded-tile border border-dashed px-4 py-3 transition-colors', over ? 'border-maple bg-maple-wash' : 'border-hair-2 bg-paper-2')}>
      <FileText className="size-5 shrink-0 text-ink-3" aria-hidden strokeWidth={1.7} />
      <p className="m-0 min-w-0 flex-1 text-[14px] text-ink-2">{t('match.refine')}</p>
      <FileInput ref={input} onFile={onFile} />
      {/* Two equal buttons: side by side when they fit, each the full width when they don't (French on a phone). */}
      <div className="flex flex-wrap gap-2 max-sm:w-full">
        <Button ref={chooseRef} size="md" icon={Upload} className="whitespace-nowrap max-sm:flex-auto" onClick={choose}>
          {t('match.choose')}
        </Button>
        <Button ref={pasteRef} size="md" icon={ClipboardPaste} className="whitespace-nowrap max-sm:flex-auto" onClick={onPaste}>
          {t('match.pasteShort')}
        </Button>
      </div>
    </div>
  );
}

/** Paste a resume or a list of skills instead of a file. */
function PasteBox({ onSubmit, onCancel }: { onSubmit: (text: string) => void; onCancel: () => void }) {
  const t = useMessages(messages);
  const id = useId();
  const [text, setText] = useState('');
  return (
    <div className="rounded-tile border border-hair bg-paper-2 p-3">
      <label htmlFor={id} className="mb-2 block text-[14px] font-medium text-ink">
        {t('match.pasteLabel')}
      </label>
      <Textarea ref={focusOnMount} id={id} rows={7} value={text} onChange={(e) => setText(e.target.value)} placeholder={t('match.pastePlaceholder')} className="bg-card text-[15px]" />
      <div className="mt-2.5 flex flex-wrap gap-2">
        <Button variant="primary" size="md" disabled={text.trim().length < MIN_PASTE} onClick={() => onSubmit(text)}>
          {t('match.pasteGo')}
        </Button>
        <Button variant="quiet" size="md" onClick={onCancel}>
          {t('match.cancel')}
        </Button>
      </div>
    </div>
  );
}

type DropProps = EntryRefs & {
  /** A file is being read. */
  reading: boolean;
  /** The paste box is open instead of the drop card. */
  pasting: boolean;
  onPasting: (open: boolean) => void;
  onFile: OnFile;
  onPaste: (text: string) => void;
};

/** The full card: drop a file, choose one, or switch to pasting text. */
export function ResumeDrop({ reading, pasting, onPasting, onFile, onPaste, chooseRef, pasteRef }: DropProps) {
  const t = useMessages(messages);
  const { input, over, dropProps, choose } = useFilePick(onFile);
  if (pasting) {
    return (
      <div className="mt-1">
        <PasteBox onSubmit={onPaste} onCancel={() => onPasting(false)} />
      </div>
    );
  }
  return (
    <div className="mt-1">
      <div
        {...dropProps}
        aria-busy={reading}
        className={cn(
          'relative flex flex-col items-center overflow-hidden rounded-tile border-[1.5px] border-dashed px-5 py-8 text-center transition-colors',
          over ? 'border-maple bg-maple-wash' : 'border-hair-2 bg-[linear-gradient(160deg,color-mix(in_oklab,var(--maple)_6%,transparent),color-mix(in_oklab,var(--a-rose)_8%,transparent))]',
        )}
      >
        <span className={cn('mb-4 grid size-14 place-items-center rounded-tile bg-card text-maple shadow-md', reading && 'motion-safe:animate-pulse')}>
          {reading ? <ScanSearch className="size-7" strokeWidth={1.6} aria-hidden /> : <FileText className="size-7" strokeWidth={1.6} aria-hidden />}
        </span>
        <p className="m-0 font-serif text-[23px] leading-tight tracking-[-.02em] text-ink" role={reading ? 'status' : undefined}>
          {reading ? t('match.reading') : t('match.dropTitle')}
        </p>
        <p className="m-0 mt-1.5 max-w-[40ch] text-[14px] text-ink-2">{t('match.dropBody')}</p>
        <FileInput ref={input} onFile={onFile} />
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Button ref={chooseRef} variant="primary" size="md" icon={Upload} disabled={reading} onClick={choose}>
            {t('match.choose')}
          </Button>
          <Button ref={pasteRef} variant="secondary" size="md" icon={ClipboardPaste} disabled={reading} onClick={() => onPasting(true)}>
            {t('match.paste')}
          </Button>
        </div>
        <p className="m-0 mt-4 inline-flex items-center gap-1.5 text-[12.5px] text-ink-3">
          <LockKeyhole className="size-3.5" aria-hidden />
          {t('match.privacy')}
        </p>
      </div>
    </div>
  );
}
