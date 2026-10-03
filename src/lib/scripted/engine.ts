/**
 * Scripted engine (core). Streams a realistic answer for a known intent without calling a model:
 * text token-by-token with natural pacing, then REAL tool calls executed through the tool registry
 * (live data where the tool fetches it), then follow-up suggestions.
 *
 * Used when SCRIPTED_AI=1, and as a graceful fallback when the model call fails (e.g. no credits).
 */
import 'server-only';
import type { ToolSet, UIMessage, UIMessageStreamWriter } from 'ai';
import type { Locale } from '@/lib/i18n/config';
import { officialLocales } from '@/lib/i18n/catalog';
import { localeOfText } from '@/lib/i18n/script';
import type { Scenario } from './types';
import { pickCopy } from './types';

/** The languages scripted copy is written in: the pack's official ones (`fr` for Canada, `pt` for Brazil). */
type AnswerLang = Locale;

/** Narrowed to the historical EN/FR pair for backward compatibility with pack code. */
type Lang = 'en' | 'fr';

const isOfficial = (l: Locale) => officialLocales.includes(l);

/**
 * Opening note for answers to questions written in a language the pack has no scripted copy for, when the
 * scripted engine (no model) answers: the intent is recognized, the details follow in an official language.
 * Country-agnostic wording, reviewed per language.
 */
const BRIDGE: Partial<Record<Locale, string>> = {
  ar: 'إليك معلومات من المصادر الرسمية. التفاصيل أدناه باللغة الإنجليزية حاليًا.',
  fa: 'این اطلاعات از منابع رسمی است. جزئیات زیر فعلاً به زبان انگلیسی است.',
  ur: 'یہ معلومات سرکاری ذرائع سے ہیں۔ فی الحال نیچے دی گئی تفصیلات انگریزی میں ہیں۔',
  'zh-Hans': '以下是来自官方来源的信息。下面的详细内容目前为英文。',
  'zh-Hant': '以下是來自官方來源的資訊。下面的詳細內容目前為英文。',
  pa: 'ਇਹ ਜਾਣਕਾਰੀ ਸਰਕਾਰੀ ਸਰੋਤਾਂ ਤੋਂ ਹੈ। ਹੇਠਾਂ ਦਿੱਤੇ ਵੇਰਵੇ ਫਿਲਹਾਲ ਅੰਗਰੇਜ਼ੀ ਵਿੱਚ ਹਨ।',
  hi: 'यह जानकारी आधिकारिक स्रोतों से है। नीचे दिया गया विवरण अभी अंग्रेज़ी में है।',
  gu: 'આ માહિતી સત્તાવાર સ્રોતોમાંથી છે. નીચેની વિગતો હાલમાં અંગ્રેજીમાં છે.',
  ta: 'இந்தத் தகவல் அதிகாரப்பூர்வ ஆதாரங்களிலிருந்து பெறப்பட்டது. கீழே உள்ள விவரங்கள் தற்போது ஆங்கிலத்தில் உள்ளன.',
  ko: '공식 출처의 정보입니다. 아래 세부 내용은 현재 영어로 제공됩니다.',
  ru: 'Вот информация из официальных источников. Подробности ниже пока на английском языке.',
  uk: 'Ось інформація з офіційних джерел. Подробиці нижче поки що англійською мовою.',
  es: 'Esta es la información de las fuentes oficiales. Por ahora, los detalles a continuación están en inglés.',
  pt: 'Estas são as informações das fontes oficiais. Por enquanto, os detalhes abaixo estão em inglês.',
  it: 'Ecco le informazioni dalle fonti ufficiali. Per ora i dettagli qui sotto sono in inglese.',
  de: 'Hier sind die Informationen aus offiziellen Quellen. Die Details unten sind vorerst auf Englisch.',
  vi: 'Đây là thông tin từ các nguồn chính thức. Hiện tại, chi tiết bên dưới được trình bày bằng tiếng Anh.',
  tl: 'Narito ang impormasyon mula sa mga opisyal na sanggunian. Sa ngayon, nasa Ingles ang mga detalye sa ibaba.',
};

/**
 * The language to answer in. A non-Latin script (Arabic, Gurmukhi, Han…) selects that language; text in one
 * of the pack's other official languages selects that one. Otherwise (English-looking or other Latin text)
 * a language the person chose that has an official catalog wins: someone who picked العربية or Português and
 * types in English still gets their language (the menus may be in English; the answer shouldn't be).
 */
export function detectAnswerLocale(text: string, locale: Locale): Locale {
  const fromText = localeOfText(text, locale, 'en');
  if (isOfficial(fromText) || fromText === locale) {
    const lang = detectLang(text, locale);
    if (isOfficial(lang) && lang !== 'en') return lang;
    return locale !== 'en' && isOfficial(locale) ? locale : 'en';
  }
  return fromText;
}

/**
 * Word lists that identify each of the pack's non-English official languages in a plain-latin-script
 * question. `fr` for Canada, `pt` for Brazil. A pack with a third official language adds a line here.
 */
const HINTS: Partial<Record<Locale, { words: RegExp; diacritics: RegExp }>> = {
  fr: {
    words: /\b(je|j['’]|mon|ma|mes|est-ce|comment|pourquoi|quand|combien|où|quel(le)?s?|passeport|impôts?|prestations?|assurance-emploi|bonjour|merci|puis-je|dois-je|nous|vous|avec|pour|dans|une?|des|les|le|la)\b/gi,
    diacritics: /[éèêàçùûôîœ]/gi,
  },
  pt: {
    // Only words that read as Portuguese on their own: `como` and `com` also come from Spanish and from a
    // bare `.com`, and a hint that fires on either can outvote a real second word.
    words: /\b(meu|minha|meus|minhas|eu|você|vocês|onde|quando|quanto|qual|quais|preciso|tenho|tenha|não|sim|obrigado|obrigada|por favor|passaporte|meu\s?inss|aposentadoria|benefício|benefícios|serviço|serviços|documento|documentos|para|sem|mais)\b/gi,
    diacritics: /[ãõçáéíóúâêôà]/gi,
  },
};

/** Decide which official language to write the scripted body in: the chosen one wins, then sniff the text. */
export function detectLang(text: string, locale: Locale): AnswerLang {
  for (const l of officialLocales) {
    if (l === 'en') continue;
    if (l === locale) return l;
    const hints = HINTS[l];
    if (!hints) continue;
    const hits = text.match(hints.words)?.length ?? 0;
    const accents = (text.match(hints.diacritics) ?? []).length;
    if (hits >= 2 || (hits >= 1 && accents >= 1)) return l;
  }
  return 'en';
}

/** "We couldn't find an answer" in each official language the pack ships scripted copy for. */
const NOT_FOUND: Partial<Record<Locale, string>> = {
  en: 'I couldn’t find an answer for that.',
  fr: 'Je n’ai pas trouvé de réponse.',
  pt: 'Não encontrei uma resposta para isso.',
};

/** Compare questions loosely: case, punctuation and spacing don't matter. */
export function normalizeQuestion(text: string) {
  return text
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\s\p{P}\p{S}]+/gu, ' ')
    .trim();
}

export function latestUserText(messages: UIMessage[]): { text: string; hasFiles: boolean } {
  const last = [...messages].reverse().find((m) => m.role === 'user');
  if (!last) return { text: '', hasFiles: false };
  const text = last.parts
    .map((p) => (p.type === 'text' ? p.text : ''))
    .join(' ')
    .trim();
  return { text, hasFiles: last.parts.some((p) => p.type === 'file') };
}

export function pickScenario(scenarios: Scenario[], text: string, hasFiles: boolean): Scenario | undefined {
  const rank = (list: Scenario[]) => list.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))[0];
  const allowed = scenarios.filter((s) => s.id !== 'fallback' && !s.exclude?.some((re) => re.test(text)));
  const direct = rank(allowed.filter((s) => s.match.some((re) => re.test(text))));
  if (direct) return direct;
  const intl = rank(allowed.filter((s) => s.matchIntl?.some((re) => re.test(text))));
  if (intl) return intl;
  if (hasFiles) {
    const doc = scenarios.find((s) => s.id.startsWith('documents'));
    if (doc) return doc;
  }
  return scenarios.find((s) => s.id === 'fallback');
}

const speed = () => Number(process.env.SCRIPTED_SPEED ?? 1) || 1;
const sleep = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve) => {
    if (signal?.aborted) return resolve();
    const t = setTimeout(resolve, ms / speed());
    signal?.addEventListener('abort', () => {
      clearTimeout(t);
      resolve();
    });
  });

let seq = 0;
const id = (p: string) => `${p}_${Date.now().toString(36)}${(seq++).toString(36)}`;

/**
 * Stream markdown in word-sized chunks with human-feeling rhythm. A list marker ("- ", "1. ") always
 * arrives together with the first words of its item, so a bullet never shows up on its own.
 */
async function streamText(writer: UIMessageStreamWriter, text: string, signal?: AbortSignal) {
  if (!text.trim()) return;
  const tid = id('txt');
  writer.write({ type: 'text-start', id: tid });
  const tokens = text.match(/\s+|[^\s]+/g) ?? [];
  let buf = '';
  let words = 0;
  const target = () => 1 + Math.floor(Math.random() * 3);
  let want = target();
  let lineStart = true;
  for (const tok of tokens) {
    if (signal?.aborted) break;
    buf += tok;
    const marker = lineStart && /^([-*+]|\d{1,2}[.)])$/.test(tok);
    if (/\n/.test(tok)) lineStart = true;
    else if (/\S/.test(tok)) lineStart = false;
    if (marker) {
      // Hold the marker until its item has a few words.
      want = words + 4;
      continue;
    }
    if (/\S/.test(tok)) words++;
    if (words >= want) {
      writer.write({ type: 'text-delta', id: tid, delta: buf });
      const pause = /[.!?:]\s*$/.test(buf) ? 70 : /\n/.test(buf) ? 90 : 18 + Math.random() * 22;
      buf = '';
      words = 0;
      want = target();
      await sleep(pause, signal);
    }
  }
  if (buf) writer.write({ type: 'text-delta', id: tid, delta: buf });
  writer.write({ type: 'text-end', id: tid });
}

async function callTool(
  writer: UIMessageStreamWriter,
  tools: ToolSet,
  toolName: string,
  input: unknown,
  signal?: AbortSignal,
) {
  const toolCallId = id('call');
  writer.write({ type: 'tool-input-start', toolCallId, toolName });
  const json = JSON.stringify(input ?? {});
  for (let i = 0; i < json.length; i += 24) {
    writer.write({ type: 'tool-input-delta', toolCallId, inputTextDelta: json.slice(i, i + 24) });
    await sleep(8, signal);
  }
  writer.write({ type: 'tool-input-available', toolCallId, toolName, input });
  const t = tools[toolName] as { execute?: (i: unknown, o: unknown) => unknown } | undefined;
  if (!t?.execute) {
    writer.write({ type: 'tool-output-error', toolCallId, errorText: `Tool "${toolName}" is not available.` });
    return;
  }
  try {
    await sleep(160, signal);
    const result = await t.execute(input, { toolCallId, messages: [], abortSignal: signal, context: {} });
    if (result && typeof result === 'object' && Symbol.asyncIterator in (result as object)) {
      let last: unknown;
      for await (const chunk of result as AsyncIterable<unknown>) {
        last = chunk;
        writer.write({ type: 'tool-output-available', toolCallId, output: chunk, preliminary: true });
      }
      writer.write({ type: 'tool-output-available', toolCallId, output: last });
    } else {
      writer.write({ type: 'tool-output-available', toolCallId, output: result });
    }
  } catch (err) {
    console.error(`[scripted] tool ${toolName} failed`, err);
    writer.write({ type: 'tool-output-error', toolCallId, errorText: 'The service did not respond. Please try again.' });
  }
}

export async function runScripted({
  writer,
  messages,
  locale,
  tools,
  scenarios,
  signal,
  forceLang,
  timeZone,
  checked,
  aliases,
}: {
  /** Translated starter questions -> their English original (see aliases.ts). */
  aliases?: Map<string, string>;
  forceLang?: AnswerLang;
  /** ISO date the answers' facts were last verified (shown on sources that carry no date of their own). */
  checked?: string;
  /** The person's IANA time zone (from their browser), passed to tool inputs that need "today". */
  timeZone?: string;
  writer: UIMessageStreamWriter;
  messages: UIMessage[];
  locale: Locale;
  tools: ToolSet;
  scenarios: Scenario[];
  signal?: AbortSignal;
}) {
  const { text: asked_, hasFiles } = latestUserText(messages);
  // A translated starter question is matched (and its tool inputs derived) from its English original.
  const text = aliases?.get(normalizeQuestion(asked_)) ?? asked_;
  // The person's language (may be beyond the pack's official ones), and the language the scripted body is written in.
  const asked = forceLang ?? detectAnswerLocale(asked_, locale);
  const answerLang: AnswerLang = isOfficial(asked) ? asked : isOfficial(locale) ? locale : 'en';
  const other = !isOfficial(asked);
  const ctxLang: Lang = (answerLang === 'fr' ? 'fr' : 'en');
  const ctx = { text, locale: answerLang, lang: ctxLang, timeZone };
  const scenario = pickScenario(scenarios, text, hasFiles);
  // A native reply in the person's language when the scenario has one; otherwise a short note in their
  // language (shown as a callout above the answer) and the sourced answer in an official language.
  const localized = other ? scenario?.replyIntl?.[asked] : undefined;
  const note = other && !localized ? BRIDGE[asked] : undefined;

  const verified = scenario?.checked ?? checked;
  writer.write({
    type: 'start',
    messageMetadata: { lang: localized ? asked : answerLang, asked, ...(note ? { note } : {}), ...(verified && scenario?.id !== 'fallback' ? { checked: verified } : {}) },
  });
  writer.write({ type: 'start-step' });
  await sleep(380, signal);

  if (!scenario) {
    await streamText(writer, NOT_FOUND[answerLang] ?? NOT_FOUND.en!, signal);
  } else {
    let vars: Record<string, string> = {};
    try {
      vars = (await scenario.vars?.(ctx)) ?? {};
    } catch (err) {
      console.error(`[scripted] vars for ${scenario.id} failed`, err);
    }
    const fill = (s: string) => s.replace(/\{(\w+)\}/g, (m, k: string) => vars[k] ?? m);
    await streamText(writer, fill(localized ?? pickCopy(scenario.reply, answerLang) ?? ''), signal);
    for (const call of scenario.toolCalls ?? []) {
      if (signal?.aborted) break;
      const input = typeof call.input === 'function' ? call.input(ctx) : call.input;
      await callTool(writer, tools, call.toolName, input, signal);
    }
    const after = localized ? undefined : pickCopy(scenario.after, answerLang);
    if (after && !signal?.aborted) await streamText(writer, fill(after), signal);
    const followUps = localized ? undefined : pickCopy(scenario.followUps, answerLang);
    if (followUps?.length && !signal?.aborted) {
      await callTool(writer, tools, 'suggestFollowUps', { questions: followUps }, signal);
    }
  }
  writer.write({ type: 'finish-step' });
  writer.write({ type: 'finish', finishReason: signal?.aborted ? 'other' : 'stop' });
}
