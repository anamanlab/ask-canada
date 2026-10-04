/**
 * PII redaction (isomorphic). Applied in the composer before a question is sent (so it is never shown,
 * stored or transmitted) and again on the server before anything reaches a model.
 * Detects: Social Insurance Numbers (Luhn-valid 9 digits), payment card numbers (Luhn-valid 13–19 digits),
 * Canadian passport numbers (2 letters + 6 digits), Brazilian CPF (mod-11-valid 11 digits, formatted or
 * bare) and Brazilian CNPJ (mod-11-valid 14 digits, formatted or bare). Conservative by design: check
 * digits must validate, and bare 11-digit runs shaped like a Brazilian mobile number are left alone, so it
 * never rewrites dates, amounts or phone numbers.
 */

export type PiiKind = 'sin' | 'card' | 'passport' | 'cpf' | 'cnpj';

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

const LABEL: Record<PiiKind, string> = {
  sin: '[SIN removed]',
  card: '[card number removed]',
  passport: '[passport number removed]',
  cpf: '[CPF removed]',
  cnpj: '[CNPJ removed]',
};

const sameDigits = (d: string) => /^(\d)\1*$/.test(d);

/** Brazilian CPF: 11 digits, two mod-11 check digits (weights 10..2 then 11..2). */
function validCpf(d: string): boolean {
  if (d.length !== 11 || sameDigits(d)) return false;
  let s = 0;
  for (let i = 0; i < 9; i++) s += (d.charCodeAt(i) - 48) * (10 - i);
  let r = s % 11;
  if ((r < 2 ? 0 : 11 - r) !== d.charCodeAt(9) - 48) return false;
  s = 0;
  for (let i = 0; i < 10; i++) s += (d.charCodeAt(i) - 48) * (11 - i);
  r = s % 11;
  return (r < 2 ? 0 : 11 - r) === d.charCodeAt(10) - 48;
}

/** Brazilian CNPJ: 14 digits, two mod-11 check digits. */
function validCnpj(d: string): boolean {
  if (d.length !== 14 || sameDigits(d)) return false;
  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let s = 0;
  for (let i = 0; i < 12; i++) s += (d.charCodeAt(i) - 48) * w1[i];
  let r = s % 11;
  if ((r < 2 ? 0 : 11 - r) !== d.charCodeAt(12) - 48) return false;
  s = 0;
  for (let i = 0; i < 13; i++) s += (d.charCodeAt(i) - 48) * w2[i];
  r = s % 11;
  return (r < 2 ? 0 : 11 - r) === d.charCodeAt(13) - 48;
}

/** A bare 11-digit run shaped like a Brazilian mobile (DDD + 9 + 8 digits) is a phone, not a CPF. */
const looksLikeBrMobile = (d: string) => /^[1-9]{2}9\d{8}$/.test(d);

export function redactPii(text: string): { text: string; found: PiiKind[] } {
  const found = new Set<PiiKind>();
  // Brazilian documents first: their formatted shapes are unambiguous, and a bare run that validates as
  // CPF/CNPJ is claimed before the card rule below can mislabel it.
  let out = text
    .replace(/\b\d{3}[. ]\d{3}[. ]\d{3}[- ]\d{2}\b/g, (m) => {
      const d = m.replace(/\D/g, '');
      if (d.length === 11 && validCpf(d)) {
        found.add('cpf');
        return LABEL.cpf;
      }
      return m;
    })
    .replace(/\b\d{2}[. ]\d{3}[. ]\d{3}\/\d{4}[- ]\d{2}\b/g, (m) => {
      const d = m.replace(/\D/g, '');
      if (d.length === 14 && validCnpj(d)) {
        found.add('cnpj');
        return LABEL.cnpj;
      }
      return m;
    })
    .replace(/\b\d{14}\b/g, (m) => {
      if (validCnpj(m)) {
        found.add('cnpj');
        return LABEL.cnpj;
      }
      return m;
    })
    .replace(/\b\d{11}\b/g, (m) => {
      if (!looksLikeBrMobile(m) && validCpf(m)) {
        found.add('cpf');
        return LABEL.cpf;
      }
      return m;
    });
  out = out.replace(/\b(?:\d[ -]?){12,18}\d\b/g, (m) => {
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
