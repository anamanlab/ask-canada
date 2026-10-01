'use client';
/** The person's question, with previews of what they attached. */
import type { Ref } from 'react';
import type { FileUIPart, UIMessage } from 'ai';
import { FileText } from 'lucide-react';

export function UserBubble({ text, message, bubbleRef }: { text: string; message?: UIMessage; bubbleRef?: Ref<HTMLDivElement> }) {
  const files = message?.parts.filter((p): p is FileUIPart => p.type === 'file') ?? [];
  return (
    <div className="ac-msg-user">
      <div ref={bubbleRef} className="ac-bubble">
        {files.length ? (
          <ul className="mb-2 flex list-none flex-wrap gap-2 p-0">
            {files.map((f, i) => (
              <li key={i} className="flex items-center gap-2 rounded-[12px] bg-card/70 px-2 py-1.5 text-[13px]">
                {f.mediaType.startsWith('image/') ? (
                  <img src={f.url} alt={f.filename ?? ''} className="size-10 rounded-[8px] object-cover" />
                ) : (
                  <FileText className="size-4 text-maple" aria-hidden />
                )}
                <span className="max-w-[180px] truncate">{f.filename}</span>
              </li>
            ))}
          </ul>
        ) : null}
        <p className="m-0 whitespace-pre-wrap" dir="auto">
          {text}
        </p>
      </div>
    </div>
  );
}
