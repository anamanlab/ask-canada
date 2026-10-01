import { AskApp } from '@/components/chat/AskApp';
import { Landing } from '@/components/landing/Landing';
import { LIMITS } from '@/lib/ai/limits';
import { languageAlternates } from '@/lib/i18n/server';

/** Each official language has its own URL (`/?lang=fr`), announced with hreflang alternates. */
export async function generateMetadata() {
  return { alternates: await languageAlternates('/') };
}

/** Home: the landing page, which becomes the chat once a question is asked. `/?q=…` asks right away. */
export default async function Home({ searchParams }: PageProps<'/'>) {
  const sp = await searchParams;
  const raw = Array.isArray(sp.q) ? sp.q[0] : sp.q;
  const q = raw?.trim().slice(0, 500) || undefined;
  return <AskApp initialQuery={q} maxInputChars={LIMITS.maxInputChars} landing={<Landing />} />;
}
