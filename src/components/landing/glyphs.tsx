/** Small server-rendered pieces the landing's showcase cards share. */
import 'server-only';
import { BookUser } from 'lucide-react';
import { packServer } from '@/countries/active.server';

/** The passport product glyph: the pack's own mark (the same one the live widget uses), or a generic tile. */
export function PassportGlyph() {
  const Icon = packServer.showcase.passportIcon;
  if (Icon) {
    return (
      <span className="grid shrink-0 place-items-center" aria-hidden>
        <Icon />
      </span>
    );
  }
  return (
    <span className="grid size-9 shrink-0 place-items-center rounded-[11px] bg-maple-wash text-maple">
      <BookUser className="size-5" strokeWidth={1.7} aria-hidden />
    </span>
  );
}

/** Server-side tear-off date tile (the client DateTile needs the i18n context). */
export function DateTileServer({ iso, month }: { iso: string; month: string }) {
  return (
    <span className="inline-block w-[46px] shrink-0 overflow-hidden rounded-[12px] border border-hair bg-card text-center shadow-sm" aria-hidden>
      <b className="block bg-maple py-0.5 text-[10px] font-semibold uppercase tracking-[.08em] text-white">{month.replace('.', '')}</b>
      <span className="block font-serif text-[22px] leading-[1.25] text-ink">{Number(iso.slice(8, 10))}</span>
    </span>
  );
}
