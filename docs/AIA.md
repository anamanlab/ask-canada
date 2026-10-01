# Algorithmic Impact Assessment (pre-filled answers)

Prepared against the Treasury Board **Directive on Automated Decision-Making** and its Algorithmic Impact
Assessment (AIA) questionnaire, to support adoption by a Government of Canada institution. Final scoring
must be completed in the official AIA tool by the adopting department.

## Project
- **Name:** Ask Canada — plain-language front door to federal services.
- **Description:** Answers questions about government services with citations to official pages and
  provides informational tools (planners, calculators, checklists, live public data).
- **Stage:** Design/implementation (open source).

## Does the system make or support administrative decisions?
**No.** It provides general information only. It does not determine eligibility, entitlements, benefits,
penalties or any outcome for a person, does not access personal case data, and does not submit anything on
anyone's behalf. Eligibility checkers are self-assessment aids that always point to the official program page
and state that the department decides. Under the Directive's scope, the system is informational and falls
outside "automated decision systems"; the answers below document this for transparency.

## Impact (pre-filled)
| Area | Answer |
| --- | --- |
| Rights and freedoms | None affected: no decision is made. |
| Health and well-being | Low: safety-critical questions route to 911 / 9-8-8 and official health pages. |
| Economic interests | Low: fees and deadlines are sourced and dated; users are told to confirm on the official page. |
| Sustainability of ecosystems | Not applicable. |
| Reversibility | Fully reversible: users act only on official sites. |
| Duration | Momentary; no records kept server-side. |

## Data
- **Personal information collected:** none by design. Identifiers (SIN, card and passport numbers) are
  removed before transmission. No accounts or tracking. Conversations are not stored server-side.
- **Data sources:** public official web pages and open data (weather, advisories, recalls, holidays), plus
  the Canadian Digital Service's AI Answers department guidance (MIT).
- **Privacy Impact Assessment:** recommended before production use by a department (model provider,
  hosting region and zero-retention terms).

## Mitigation measures
- Citations to official pages on every factual claim; out-of-allowlist links flagged.
- Verified facts with recorded source URLs and dates; widgets fail safe to the official page.
- Bias and neutrality guidance (CDS AI Answers) in the system prompt; EN/FR parity; accessibility (WCAG 2.1 AA).
- Human oversight: scenario review and expert evaluation by department; public system card; open source code.
- Transparency: the UI identifies the service as independent (or as a GC service in official mode) and
  tells users to confirm on the linked page.

## Indicative level
**Level I (little to no impact)** — information only, no decisions, no personal information.
