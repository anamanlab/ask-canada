# Security policy

Please report vulnerabilities privately (do not open a public issue): use GitHub's "Report a vulnerability"
for this repository **when enabled**. If it is unavailable, ask the maintainers to establish a private contact
channel without sharing vulnerability details publicly. Include reproduction steps and impact only through
that private channel. We aim to acknowledge valid reports within 3 business days.

Security measures: strict per-request CSP with nonces, HSTS, `X-Frame-Options: DENY`, `nosniff`, narrow
`Permissions-Policy`, no server-side storage of conversations or personal data, PII redaction before model
calls, input size caps, step and output limits on the model, per-IP rate limiting, official-domain allowlist
for page fetching.

---

# Politique de sécurité

Signalez les vulnérabilités en privé (pas de billet public) : utilisez « Report a vulnerability » de GitHub
pour ce dépôt **si cette fonction est activée**. Dans le cas contraire, demandez aux responsables un canal
privé sans divulguer de détails publiquement. Envoyez les étapes et l’impact uniquement par ce canal.
Nous visons un accusé de réception en 3 jours ouvrables.


---

## Independent Brazil deployment — private reporting setup

The Brazil project's public repository link (`pack.brand.contact`) **is not a private security-reporting channel**. The operator must enable GitHub **private vulnerability reporting** for this repository or publish a monitored private security email before inviting security reports or launching a public service. If the repository shows a **Report a vulnerability** control, use that control and include reproduction steps and impact; do not send exploits, credentials or private records through public Issues, PRs or discussions. Public Issues are currently disabled (checked 2026-10-21). This is a release-readiness requirement, not a statement that private reporting has already been enabled.

## Implantação independente do Brasil — canal privado

O link público do repositório (`pack.brand.contact`) **não é um canal privado de segurança**. Antes da divulgação pública, o responsável deve habilitar o **relato privado de vulnerabilidades** no GitHub ou disponibilizar um e-mail privado de segurança monitorado. Se a opção **Report a vulnerability** estiver visível, use-a; nunca publique detalhes de exploração, senhas ou dados pessoais em Issues, pull requests ou discussões. As Issues públicas estão desativadas (verificado em 21/10/2026).
