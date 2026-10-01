/**
 * Small text primitives for the contact cards: phone numbers that never break or flip in right-to-left pages,
 * "·"-separated lines and the amber warning surface.
 */
import { cn } from '@/lib/cn';

/** "tel:" href for a North American number ("1-800-959-8281" → "tel:+18009598281"; "9-1-1" → "tel:911"). */
export function telHref(n: string) {
  const d = n.replace(/\D/g, '');
  if (d.length <= 4) return `tel:${d}`;
  return `tel:+${d.length === 10 ? `1${d}` : d}`;
}

export function PhoneNumber({ number, className }: { number: string; className?: string }) {
  return (
    <bdi dir="ltr" className={cn('whitespace-nowrap tabular-nums', className)}>
      {number}
    </bdi>
  );
}

/** A sentence that mentions a phone number ("Call 9-1-1."): the number never breaks at its hyphens, in any language. */
export function WithNumbers({ text }: { text: string }) {
  return text.split(/(\d+(?:-\d+)+)/).map((part, i) => (i % 2 ? <PhoneNumber key={i} number={part} /> : part));
}

/**
 * A "·"-separated line ("Suicide Crisis Helpline · 24/7") that never starts or ends a line on the dot: each
 * part is a flex item with its dot drawn before it, and the dot of any part that starts a new line falls
 * into the clipped negative margin.
 */
export function DotParts({ text, className, itemClassName }: { text: string; className?: string; itemClassName?: string }) {
  const parts = text.split(/\s+·\s+/);
  if (parts.length < 2) return <span className={className}>{text}</span>;
  return (
    <span className={cn('block overflow-hidden', className)}>
      <span className="-ms-4 flex flex-wrap">
        {parts.map((p, i) => (
          <span key={i} className={cn("relative ps-4 before:absolute before:start-0 before:w-4 before:text-center before:content-['·']", itemClassName)}>
            {p}
          </span>
        ))}
      </span>
    </span>
  );
}

/**
 * The amber "warning" surface (scam signs, the fraud hero card). The wash token alone turns grey-brown on the
 * dark navy card, so dark mode keeps the fill faint and lets an amber hairline (and amber headings) carry the warning.
 */
export const amberPanel =
  'border border-transparent bg-amber-wash dark:border-amber/40 dark:bg-transparent dark:bg-linear-to-b dark:from-amber/[.10] dark:to-amber/[.03] dark:shadow-[inset_0_1px_0_0_color-mix(in_oklab,var(--amber)_22%,transparent)]';
