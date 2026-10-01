import { Phone } from 'lucide-react';

/** Text in which the first of `phones` it mentions becomes a tap-to-call link. */
export function WithPhones({ text, phones }: { text: string; phones: string[] }) {
  const found = phones.find((p) => text.includes(p));
  if (!found) return <>{text}</>;
  const at = text.indexOf(found);
  return (
    <>
      {text.slice(0, at)}
      <a
        href={`tel:${found.replace(/[^0-9+]/g, '')}`}
        className="-my-3 inline-flex min-h-11 items-center gap-1 whitespace-nowrap py-3 font-medium text-ink underline decoration-hair-2 underline-offset-[3px] hover:decoration-ink"
      >
        <Phone className="size-3.5" strokeWidth={2} aria-hidden />
        <bdi dir="ltr">{found}</bdi>
      </a>
      {text.slice(at + found.length)}
    </>
  );
}
