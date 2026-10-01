# Security policy

Please report vulnerabilities privately (do not open a public issue): use GitHub's "Report a vulnerability"
for this repository, or the contact in `pack.brand.contact`. Include steps to reproduce and impact. We aim to
acknowledge within 3 business days.

Security measures: strict per-request CSP with nonces, HSTS, `X-Frame-Options: DENY`, `nosniff`, narrow
`Permissions-Policy`, no server-side storage of conversations or personal data, PII redaction before model
calls, input size caps, step and output limits on the model, per-IP rate limiting, official-domain allowlist
for page fetching.

---

# Politique de sécurité

Signalez les vulnérabilités en privé (pas de billet public) : utilisez « Report a vulnerability » de GitHub
pour ce dépôt, ou le contact indiqué dans `pack.brand.contact`. Décrivez les étapes et l’impact. Nous visons
un accusé de réception en 3 jours ouvrables.
