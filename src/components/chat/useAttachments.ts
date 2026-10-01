/**
 * The composer's attachments: images or PDFs read as data URLs, within the upload limits.
 *
 *   const attachments = useAttachments({ onRejected: (reason) => setNote(…) });
 *   attachments.add(input.files);   attachments.remove(id);   attachments.clear();
 *   attachments.parts               // what `send()` takes
 *
 * A file over the count, of another type or too large is left out and reported through `onRejected`.
 */
import { useCallback, useMemo, useState } from 'react';
import type { FileUIPart } from 'ai';
import { UPLOAD_LIMITS } from '@/lib/ai/limits.shared';

export type Attachment = FileUIPart & { id: string; name: string };
export type AttachmentRejection = 'count' | 'type' | 'size';

const readAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export function useAttachments({ onRejected }: { onRejected: (reason: AttachmentRejection) => void }) {
  const [files, setFiles] = useState<Attachment[]>([]);

  async function add(list: FileList | null) {
    if (!list) return;
    const picked: Attachment[] = [];
    const room = UPLOAD_LIMITS.maxFiles - files.length;
    for (const file of Array.from(list)) {
      if (picked.length >= room) {
        onRejected('count');
        break;
      }
      if (!UPLOAD_LIMITS.allowedMedia.includes(file.type)) {
        onRejected('type');
        continue;
      }
      if (file.size > UPLOAD_LIMITS.maxFileBytes) {
        onRejected('size');
        continue;
      }
      const url = await readAsDataUrl(file);
      picked.push({ id: crypto.randomUUID(), type: 'file', mediaType: file.type, url, filename: file.name, name: file.name });
    }
    // Merge with whatever is attached now (another pick may have landed while these were read).
    setFiles((current) => [...current, ...picked].slice(0, UPLOAD_LIMITS.maxFiles));
  }

  const remove = useCallback((id: string) => setFiles((current) => current.filter((f) => f.id !== id)), []);
  const clear = useCallback(() => setFiles([]), []);
  const parts = useMemo<FileUIPart[]>(() => files.map(({ type, mediaType, url, filename }) => ({ type, mediaType, url, filename })), [files]);

  return { files, parts, add, remove, clear };
}
