/**
 * PII redaction (isomorphic). Applied in the composer before a question is sent (so it is never shown,
 * stored or transmitted) and again on the server before anything reaches a model.
 * Detects: Social Insurance Numbers (Luhn-valid 9 digits), payment card numbers (Luhn-valid 13–19 digits)
 * and Canadian passport numbers (2 letters + 6 digits). Conservative by design: it never rewrites dates,
 * amounts or phone numbers.
 */

export type PiiKind = 'sin' | 'card' | 'passport';

function luhn(digits: string) {
  let sum = 0;
  let dbl = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = digits.charCodeAt(i) - 48;
    if (dbl) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    dbl = !dbl;
  }
  return sum % 10 === 0;
}

const LABEL: Record<PiiKind, string> = { sin: '[SIN removed]', card: '[card number removed]', passport: '[passport number removed]' };

export function redactPii(text: string): { text: string; found: PiiKind[] } {
  const found = new Set<PiiKind>();
  let out = text.replace(/\b(?:\d[ -]?){12,18}\d\b/g, (m) => {
    const d = m.replace(/\D/g, '');
    if (d.length >= 13 && d.length <= 19 && luhn(d)) {
      found.add('card');
      return LABEL.card;
    }
    return m;
  });
  out = out.replace(/\b\d{3}[ -]?\d{3}[ -]?\d{3}\b/g, (m) => {
    const d = m.replace(/\D/g, '');
    if (d.length === 9 && d[0] !== '0' && d[0] !== '8' && luhn(d)) {
      found.add('sin');
      return LABEL.sin;
    }
    return m;
  });
  out = out.replace(/\b[A-Z]{2}\d{6}\b/g, () => {
    found.add('passport');
    return LABEL.passport;
  });
  return { text: out, found: [...found] };
}
