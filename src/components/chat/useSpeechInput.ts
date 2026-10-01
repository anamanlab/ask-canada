'use client';
/**
 * Voice input for the composer (Web Speech API). The recognizer is aborted when the composer sends and
 * when it unmounts (the hero composer unmounts as the chat opens), so a late result can never refill a
 * box that was just sent, and the microphone never stays live behind the chat.
 *
 *   const voice = useSpeechInput({ lang: intl, onText: setText, onError: setNote });
 *   voice.toggle(currentText);  voice.abort();  voice.listening
 */
import { useEffect, useRef, useState } from 'react';

type SpeechRec = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
};

type SpeechWindow = { SpeechRecognition?: new () => SpeechRec; webkitSpeechRecognition?: new () => SpeechRec };

export function useSpeechInput({
  lang,
  onText,
  onUnsupported,
  onDenied,
}: {
  lang: string;
  /** The field's full text: what was there when listening started, plus what has been heard so far. */
  onText: (text: string) => void;
  onUnsupported: () => void;
  onDenied: () => void;
}) {
  const [listening, setListening] = useState(false);
  const rec = useRef<SpeechRec | null>(null);

  useEffect(() => () => rec.current?.abort(), []);

  /** Stop listening and drop any result still in flight. */
  function abort() {
    const r = rec.current;
    if (!r) return;
    rec.current = null;
    r.onresult = null;
    r.abort();
    setListening(false);
  }

  function toggle(current: string) {
    if (listening) {
      rec.current?.stop();
      return;
    }
    const w = window as unknown as SpeechWindow;
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) {
      onUnsupported();
      return;
    }
    const r = new Ctor();
    r.lang = lang;
    r.interimResults = true;
    r.continuous = false;
    const base = current ? current.trimEnd() + ' ' : '';
    r.onresult = (e) => {
      const said = Array.from(e.results)
        .map((res) => res[0].transcript)
        .join('');
      onText(base + said);
    };
    r.onerror = (e) => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') onDenied();
    };
    r.onend = () => {
      if (rec.current === r) rec.current = null;
      setListening(false);
    };
    rec.current = r;
    setListening(true);
    r.start();
  }

  return { listening, toggle, abort };
}
