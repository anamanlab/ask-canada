# Ask Brasil — Fork and Brazil Country-Pack Implementation Brief

## Objective

Fork `ryancampbell/ask-canada` and add Brazil as a second fully isolated country pack while preserving the existing Canadian implementation.

This must remain **one shared codebase with separate build-time country deployments**:

- `COUNTRY=ca` → existing Ask Canada
- `COUNTRY=br` → new Ask Brasil

Do not convert the application into Brazil-only code.

Do not rewrite the shared core unless a genuinely country-agnostic seam is missing.

The intended architecture is:

```text
Shared application core
├── chat/runtime
├── AI orchestration
├── citations
├── tools framework
├── widgets framework
├── UI
├── safety/privacy
├── rate limits
└── source rendering

Country packs
├── ca/   existing Canada implementation
└── br/   new Brazil implementation
```

The existing project explicitly supports this through the `COUNTRY` build variable and the `@country/*` aliases.

---

# 1. First principle: preserve Canada

Before changing anything:

1. Fork the repository.
2. Install dependencies.
3. Run the existing checks.
4. Build `COUNTRY=ca`.
5. Record the current passing state.
6. Do not modify Canadian data, Canadian tools or vendored Canadian guidance as part of the Brazil implementation.

Canada should continue to work independently.

After every meaningful Brazil milestone, verify both:

```text
COUNTRY=ca
COUNTRY=br
```

The addition of Brazil must not regress Canada.

---

# 2. Create Brazil as a real country pack

Start from the project's `src/countries/example` country template rather than duplicating Canadian facts wholesale.

Create:

```text
src/countries/br/
├── brand/
├── data/
├── knowledge/
├── messages/
├── scenarios/
├── tools/
├── widgets/
├── map.ts
├── pack.ts
└── pack.server.ts
```

Use Canadian implementations as architectural examples where useful, but no Canadian factual constants may leak into Brazil.

Configure approximately:

```text
id: br
region: BR
currency: BRL
default locale: pt-BR / pt as supported by the project's locale contract
time zone: America/Sao_Paulo
```

Brazil has multiple time zones. The pack default can be São Paulo/Brasília time, but tools dealing with dates must accept or infer the user's actual Brazilian time zone where relevant.

Emergency/service numbers must be Brazilian.

The product must clearly state that it is an **independent service using official public sources**, not an official Government of Brazil product.

Do not use official Brazilian government trademarks in a manner that implies government ownership or endorsement.

---

# 3. Brazil source policy

Brazil must not be implemented as:

```text
question
→ LLM knows something about Brazil
→ answer
```

The target architecture is:

```text
question
   ↓
intent/source router
   ↓
best authoritative source
   ↓
structured official data when available
   ↓
official webpage when structured data is unavailable
   ↓
LLM explains the retrieved facts
   ↓
citations
   ↓
official handoff when user must authenticate/apply/pay
```

Use this authority hierarchy:

```text
1. Live official structured API
2. Official open dataset
3. Official government service record
4. Official government webpage
5. Curated Brazil guidance maintained in this repository
6. General model knowledge
```

General model knowledge must never silently override fresher official information.

---

# 4. Initial official-domain allowlist

Create the Brazilian source allowlist conservatively.

Initial domains should include official sources such as:

```text
gov.br
ibge.gov.br
bcb.gov.br
camara.leg.br
senado.leg.br
tse.jus.br
cnj.jus.br
portaldatransparencia.gov.br
```

Add more domains only after verifying:

- the owner;
- the purpose;
- that it is an authoritative source for the relevant subject.

Do not use random blogs, SEO sites, law-firm articles or unofficial government-data mirrors as grounding sources.

---

# 5. Source #1 — GOV.BR Public Services

This is the most important general-purpose Brazil integration.

Use the official **Consulta de Serviços Públicos** API documented by MGI/SGD.

It provides official information about government services including concepts such as:

- service name;
- popular names;
- description;
- responsible organization;
- whether it is free;
- whether it is digital;
- digital-service link;
- estimated waiting/delivery time;
- stages;
- target audience;
- keywords;
- associated legislation;
- contact information;
- official service URL.

Important access constraint:

- consultation of a known/specific service can be performed without the full-catalogue credential;
- retrieval of the complete services catalogue requires credentials/authorization.

Do NOT assume that every endpoint documented historically under an old hostname is still the correct production endpoint.

Before implementing, verify the current production endpoints against the current official MGI documentation.

Create a server-side adapter rather than exposing upstream API details throughout the application.

Suggested abstraction:

```ts
searchGovBrServices(query)
getGovBrService(id)
```

Normalized result:

```ts
type BrazilGovernmentService = {
  id: string;
  name: string;
  popularNames?: string[];
  description?: string;
  agency?: {
    name: string;
    siorgCode?: string;
  };
  free?: boolean;
  digital?: boolean;
  digitalUrl?: string;
  officialUrl: string;
  estimatedTime?: string;
  stages?: ServiceStage[];
  audience?: string[];
  keywords?: string[];
  legislation?: OfficialReference[];
  contact?: string;
  fetchedAt: string;
};
```

Do not force a full catalogue ingestion during MVP if credentials are unavailable.

Fallback strategy:

```text
known service ID
→ official service API

unknown service
→ restricted search over official GOV.BR service pages
→ retrieve exact official page/service
```

Never fabricate a service ID.

---

# 6. Source #2 — IBGE

IBGE should provide geographic normalization and later statistical data.

MVP integration:

```ts
getBrazilStates()
getBrazilMunicipalities(state?)
resolveBrazilLocation(query)
```

Use the official IBGE Localidades API.

Store canonical identifiers such as the IBGE municipality code.

Example:

```text
"Recife"
→ Recife
→ Pernambuco
→ PE
→ Northeast
→ official IBGE municipality identifier
```

This becomes useful to many future tools because Brazilian government datasets frequently identify municipalities by IBGE code.

Do not ask the LLM to guess municipalities, states or regional relationships when IBGE can provide them deterministically.

Later phases may add:

- IBGE aggregate statistics;
- Census;
- population;
- economic/demographic indicators.

Keep location resolution separate from statistical queries.

---

# 7. Source #3 — Banco Central do Brasil

Use Banco Central structured public data for economic/financial information.

Start with an abstraction over official BCB time-series data, not hard-coded prose.

Suggested tool:

```ts
bcbSeries({
  series,
  startDate?,
  endDate?,
  latest?
})
```

Build an explicit registry of approved series:

```ts
BRAZIL_BCB_SERIES = {
  // verified BCB identifiers only
}
```

Do not allow the model to invent SGS series numbers.

Initial useful product areas:

- Selic;
- selected official interest-rate series;
- exchange-rate information;
- selected monetary/economic indicators.

Every series must carry:

```text
official BCB source
series identifier
unit
frequency
fetchedAt
```

Do not confuse Banco Central's GitHub Pix specifications with public citizen-level Pix data.

Repositories such as Pix API specifications describe integration contracts. They are not a public database of individual Pix transactions.

---

# 8. Brazil knowledge router

Canada has a valuable pre-curated `cds-snc/ai-answers` knowledge layer.

Brazil does not have a direct equivalent.

Do NOT fake one by copying Canadian guidance and translating it.

Create a Brazilian router gradually.

Example:

```text
passaporte / CPF / government procedure
→ govbr-services

município / estado / população
→ ibge

Selic / juros / câmbio / Banco Central
→ bcb

deputado / PL / votação / Câmara
→ camara

Senado / senador / proposição
→ senado

lei / norma / legislação
→ lexml / official legislation

processo judicial / movimentação
→ datajud

contrato público / gasto / servidor / sanções
→ transparencia

eleições / candidato / resultado
→ tse
```

Initially use explicit deterministic intent/routing rules similar to Ask Canada's existing department router.

Do not introduce embeddings merely to solve routing.

---

# 9. Structured sources before RAG

Do not build a giant vector database as the first Brazil milestone.

Rules:

```text
If official structured data exists:
    use the structured data.

If the information is a government service:
    use GOV.BR service data.

If the information is dynamic:
    call the relevant live official source.

If the authoritative material is prose-only:
    retrieve the official page.

Only then consider curated RAG/guidance.
```

Examples:

```text
"Qual a Selic?"
→ BCB API
NOT RAG

"Quais municípios existem em Pernambuco?"
→ IBGE
NOT RAG

"Como solicitar determinado serviço federal?"
→ GOV.BR service record
NOT general LLM memory

"Qual a movimentação pública deste processo?"
→ DataJud
NOT legal RAG
```

---

# 10. Sources for phase 2

Do not block MVP on all of these, but design adapters so they can be added independently.

## Câmara dos Deputados

Use the official Câmara Dados Abertos API.

Potential capabilities:

```ts
findDeputy(...)
findProposal(...)
getProposalStatus(...)
getProposalVotes(...)
getVotingDetails(...)
```

Use structured API data for:

- deputies;
- legislative proposals;
- official status;
- votes;
- committees;
- events.

Answers must remain descriptive and factual.

Do not have the assistant rank politicians or tell users whom to support.

---

## Senado / LexML

Use official Senado open data where appropriate.

Use LexML as a useful legal-document discovery layer for:

- legislation;
- proposed legislation;
- related legal-document metadata.

Never treat search results alone as proof of the legal interpretation of a law.

Retrieve/read the authoritative text before making a substantive legal statement.

---

## CNJ DataJud

DataJud is useful but must be represented correctly.

It provides public **process metadata and procedural movements** from the Brazilian judiciary.

Appropriate uses:

```ts
findPublicCases(...)
getPublicCaseMetadata(...)
getCaseMovements(...)
```

DataJud is NOT to be treated as a complete national full-text jurisprudence database.

Never say:

```text
"DataJud found this precedent"
```

when the API only identified process metadata.

For future jurisprudence research:

```text
DataJud
→ discover candidate cases
→ retrieve actual judgment/acórdão from appropriate court source
→ analyze actual decision text
```

Respect confidential/sealed-case limitations.

---

## Portal da Transparência

Use the official REST API.

Authentication/token must remain server-side.

Never expose the token to browser/client code.

Add caching and respect documented rate limits.

Potential areas:

- federal contracts;
- procurement;
- public expenditures;
- public servants;
- travel;
- sanctions;
- available benefit datasets.

For large-scale analysis, prefer official bulk/open-data downloads over repeatedly hitting the transactional API.

---

## TSE

Treat TSE primarily as an official dataset ingestion source.

The portal publishes machine-readable election datasets.

For larger CSV/ZIP resources:

```text
official TSE dataset
→ scheduled ingestion
→ normalize into local database
→ query normalized data from Ask Brasil
```

Do not download large TSE files on every user request.

Keep original source identifiers and provenance.

Political/electoral answers must remain neutral, factual and sourced.

---

# 11. Sources that must NOT be assumed publicly available

The Conecta GOV.BR catalogue contains many attractive APIs.

Do not assume catalogue visibility means public access.

Examples may include:

- CPF/Cadastro Base do Cidadão;
- CadÚnico;
- authenticated GOV.BR identity data;
- other cross-government registries.

Many of these integrations are designed for authorized government bodies.

Therefore:

```text
Do NOT build Ask Brasil around private citizen-record APIs.
Do NOT attempt to bypass Conecta authorization.
Do NOT ask users for CPF/NIS merely because an API exists.
```

Instead:

```text
user asks about personal government status
→ explain how the official service works
→ hand off to official authenticated government service
```

Example:

```text
"Meu benefício foi aprovado?"

Ask Brasil:
"I can't access your private Meu INSS account.
Here's where and how to check it officially."

→ official handoff
```

---

# 12. Privacy and PII

Preserve Ask Canada's privacy architecture.

Ask Brasil should not require an account for ordinary public-information use.

Do not request or retain sensitive identifiers unless a future feature has a specific lawful reason and security design.

At minimum, treat the following as sensitive:

```text
CPF
NIS
RG
passport number
bank details
passwords
health identifiers
authentication codes
```

For government authentication, payment or individualized records:

```text
handoff to the official system
```

rather than attempting to reproduce it.

---

# 13. Tool/source contract

Every Brazil live tool should return both normalized data and source provenance.

Standardize something similar to:

```ts
type BrazilToolSource = {
  title: string;
  url: string;
  authority: string;
  live: boolean;
  fetchedAt?: string;
  checkedAt?: string;
  datasetId?: string;
};
```

Every output should contain:

```ts
sources: BrazilToolSource[];
```

The model should never need to invent citations.

---

# 14. Failure behavior

Every external integration must:

- have a timeout;
- handle upstream errors;
- never turn a failed request into invented facts;
- show an official handoff when useful;
- distinguish live data from cached/static fallback data.

Pattern:

```text
BCB unavailable
→ do not invent today's Selic
→ say live BCB data could not be confirmed
→ provide official source/handoff
```

Same rule for every live source.

---

# 15. Caching

Use caching based on data volatility.

Examples:

```text
IBGE states/municipalities
→ long cache

government service metadata
→ hours/day depending on source

legislative status
→ shorter cache

BCB current values
→ appropriate short cache

TSE historical results
→ essentially immutable after finalized/corrected

DataJud movements
→ short/medium cache
```

Never cache personal/sensitive data.

---

# 16. Brazilian widgets for MVP

Do not try to reproduce every Canadian widget immediately.

Initial widgets/tools:

## A. Government service

Questions:

```text
Como tirar passaporte?
Como emitir Carteira de Trabalho?
Como acessar determinado serviço?
Que documentos preciso?
Quanto custa?
Quanto tempo demora?
```

Source:

```text
GOV.BR
```

Widget can display:

```text
service name
responsible agency
free/paid
digital/in-person
steps
estimated time
official action
sources
```

---

## B. Brazil location

Source:

```text
IBGE
```

Capabilities:

```text
state
municipality
region
canonical IBGE identifiers
```

---

## C. Economy

Source:

```text
Banco Central
```

Capabilities:

```text
current value
historical values
small trend visualization
source metadata
```

Start with a small curated set of high-value BCB series.

---

# 17. MVP categories

Initial public service categories can be:

```text
Documentos
Benefícios
Trabalho
Empresas
Impostos
Saúde
Dinheiro e economia
Serviços públicos
```

Do not pretend each category has complete specialized tooling on day one.

Generic official service retrieval may cover many questions while specialized widgets are developed.

---

# 18. Brand/UI

Keep the independent product identity.

Suggested positioning:

```text
Ask Brasil
Informações públicas em linguagem simples, baseadas em fontes oficiais.
```

Do not imply:

```text
"Assistente oficial do Governo Federal"
```

unless the product actually becomes officially adopted.

The official GOV.BR design system may be studied/reused according to its licensing, but the product should retain an independent brand rather than masquerading as GOV.BR.

---

# 19. Brazilian system prompt

Create Brazil-specific instructions in `pack.server.ts`.

Core principles:

```text
You serve people looking for Brazilian public information.

You are an independent service, not the Brazilian government.

Prefer official Brazilian sources.

When a structured official tool exists, use it rather than model memory.

Never invent a government requirement, fee, deadline, benefit threshold,
legal rule or current economic value.

For personalized government records, authentication, applications or
payments, hand the user to the official service.

Clearly distinguish:
- general information,
- official requirements,
- current live data,
- individualized professional/legal advice.
```

The public Ask Brasil product should generally provide information rather than individualized legal, tax, medical or financial professional advice.

---

# 20. Search behavior

Retain the Ask Canada pattern of restricted official-source search.

For Brazil, external web search used for grounding should be constrained to the Brazil official-domain allowlist.

Search is fallback/discovery, not the primary data source when a proper API exists.

Desired behavior:

```text
API/tool available
→ use it

no structured tool
→ search/fetch official site

official information unavailable
→ say what could not be verified

never silently broaden to random internet sources
```

---

# 21. Do not over-engineer RAG initially

Do NOT begin with:

```text
crawl every gov.br page
chunk everything
embed millions of documents
build huge vector DB
```

That produces maintenance and freshness problems.

Start with:

```text
structured tools
+
official-page retrieval
+
small curated guidance
```

Only introduce RAG for bodies of relatively stable prose where retrieval provides clear value.

---

# 22. Testing requirements

Canada regression:

```text
COUNTRY=ca build
typecheck
lint
existing guard checks
existing i18n checks
existing scenarios/tests
```

Brazil:

```text
COUNTRY=br build
typecheck
lint
Brazil locale check
Brazil scenario tests
```

Add contract tests for each Brazilian adapter.

Test at least:

```text
Como tirar passaporte?

Qual é a Selic atual?

Quais são os municípios de Pernambuco?

Como abrir um MEI?

Como consultar um serviço no gov.br?
```

Later:

```text
Em que fase está determinada proposição legislativa?

Qual foi a última movimentação pública deste processo?

Quanto o governo federal gastou/contratou em X?
```

For every test, verify:

```text
correct source
correct tool routing
citation present
no hallucinated facts
graceful upstream failure
```

---

# 23. Build sequence

Implement in this order.

## PR 1 — Brazil skeleton

Create:

```text
src/countries/br
Brazil pack
Portuguese UI
brand
source allowlist
services/categories
Brazil system prompt
map
basic scenarios
```

Goal:

```text
COUNTRY=br pnpm dev
```

loads a functional Ask Brasil shell.

No major live integrations required yet.

---

## PR 2 — GOV.BR Services

Implement:

```text
GOV.BR adapter
service schema
service tool
service widget
citations
official handoff
timeouts/cache
tests
```

This is the most important Brazil-specific feature.

---

## PR 3 — IBGE

Implement:

```text
state list
municipalities
location resolver
IBGE canonical IDs
tests
```

---

## PR 4 — Banco Central

Implement:

```text
approved-series registry
live time-series adapter
economy tool
economy widget
tests
```

---

## PR 5 — Brazil source router

Route user questions deterministically toward:

```text
govbr
ibge
bcb
official page retrieval
```

Build the router so additional sources can be added without altering core.

---

## Later PRs

Independently add:

```text
Câmara
Senado / LexML
Portal da Transparência
DataJud
TSE
Receita/open datasets
INSS/open datasets
health/regulatory sources
```

Each should be its own vertical/tool integration.

---

# 24. Deployment

Use the same repository for both deployments.

Example:

```text
Deployment: Ask Canada
COUNTRY=ca

Deployment: Ask Brasil
COUNTRY=br
```

Each deployment may have its own:

```text
domain
AI budget
rate limits
analytics settings
environment secrets
API tokens
```

Canada and Brazil should be deployable independently from the same commit.

---

# 25. Definition of MVP completion

Brazil MVP is complete when:

1. Canada still builds and functions.
2. `COUNTRY=br` builds independently.
3. UI is Portuguese/Brazil-specific.
4. Brazil has its own source allowlist.
5. GOV.BR service questions use official government-service data/pages.
6. IBGE handles Brazilian location normalization.
7. Banco Central handles a curated group of live economic questions.
8. Answers display actual official sources.
9. Live-source failures do not hallucinate.
10. Private government APIs are not being accessed improperly.
11. Authentication/application/payment flows hand off to official government systems.
12. No Canadian facts leak into Brazil.
13. Shared core contains no Brazil-specific business logic.

---

# Final engineering principle

Do not build "ChatGPT with a Brazilian prompt."

Build:

```text
                    ASK BRASIL
                        │
                  User question
                        │
                Source/intention router
                        │
       ┌────────────────┼────────────────┐
       │                │                │
 GOV.BR services       IBGE             BCB
       │                │                │
       └────────────────┼────────────────┘
                        │
               normalized official facts
                        │
                 AI explanation
                        │
               official citations
                        │
              official-service handoff
```

Then extend the same architecture with Câmara, Senado/LexML, DataJud, Transparência, TSE and other verified official Brazilian sources.

The LLM is the explanation/orchestration layer.

**The LLM is not the database.**


---

# 26. Source research and credentials (second pass)

## The sources I would seriously consider

| Source | Integration | What we can actually search/get | Questions users could ask | Product value |
| --- | --- | --- | --- | --- |
| 1. GOV.BR Public Services | Live API + official pages | Service name, description, agency, steps, cost/free status, digital link, waiting time, accessibility, audience, legislation, related services. Individual service retrieval doesn't require credentials; the complete catalogue does ([Serviços e Informações do Brasil](https://www.gov.br/pt-br/servicos)) | “Como tirar passaporte?” “Como pedir seguro-desemprego?” “Quanto tempo demora?” “Quais documentos preciso?” “Onde faço isso?” | Essential. This is the closest Brazilian equivalent to the Canada.ca service layer. |
| 2. IBGE APIs | Public REST APIs | Municipalities, states, regions, official IBGE codes, CNAE, geographic boundaries, statistical aggregates, survey data, publications, country indicators and more. IBGE itself exposes separate APIs for Localidades, Agregados, CNAE, Pesquisas, Malhas, Nomes, etc ([IBGE](https://www.ibge.gov.br)) | “Quantas pessoas moram em Recife?” “Quais municípios ficam em Pernambuco?” “Qual o CNAE para limpeza?” “Qual a população desta cidade?” | Essential foundation. Extremely clean structured data. |
| 3. Banco Central — SGS / Olinda / PTAX | Public JSON/OData APIs | Exchange rates, PTAX, economic time series, market expectations and many financial datasets. BCB publishes APIs and OData endpoints; PTAX is updated during the day and market-expectation datasets are machine readable ([Portal de Dados Abertos do Banco Central](https://www.bcb.gov.br)) | “Qual o dólar PTAX hoje?” “Como a Selic mudou no último ano?” “Qual a expectativa de inflação?” | Very high. Gives Ask Brasil useful live answers rather than LLM approximations. |
| 4. Ministério da Saúde — OpenDataSUS/CNES | Public API, no authentication for CNES | Healthcare establishments, CNES numbers, establishment types, health regions/macrorregions; official API explicitly allows free access without authentication ([Serviços e Informações do Brasil](https://www.gov.br/pt-br/servicos)) | “Onde tem uma UPA perto de X?” “Este hospital existe no CNES?” “Quais unidades de saúde existem nesta cidade?” | Very high. Excellent health-services widget. |
| 5. ANVISA | Public search + downloadable structured datasets | Registered medicines, health products, foods, cosmetics, sanitizers, tobacco products, clinical trials and various regulatory datasets. ANVISA exposes registered-product searches and open data for registered medicines/products ([Serviços e Informações do Brasil](https://www.gov.br/pt-br/servicos)) | “Esse medicamento é registrado na Anvisa?” “Quem fabrica?” “Esse produto de saúde é regularizado?” “Existem biossimilares deste remédio?” | Very high. Rough equivalent to Ask Canada's Health Canada drug/product capability. |
| 6. Câmara dos Deputados | Public REST API + bulk files | Deputies, proposals, authors, themes, complete legislative movement history, votes, individual votes, committees, events and parliamentary expenditure files ([Dados Abertos Câmara](https://dadosabertos.camara.leg.br)) | “Em que fase está o PL 1234?” “Quem apresentou?” “Como os deputados votaram?” “O que aconteceu com esse projeto?” | Very high for civic information. Build as live tools, not RAG. |
| 7. Senado Federal | Public web services + CSV | Bills/matérias, updates, authorship, rapporteurs, senators, sessions, speeches, commissions, votes and federal legal norms. Many legislative datasets are marked as online web services ([Senado Federal](https://www.senado.leg.br)) | “Onde está este projeto no Senado?” “Quem é o relator?” “Quais foram as últimas movimentações?” | High. Complements Câmara so the assistant can follow legislation through Congress. |
| 8. LexML | Public SRU/XML search service | Metadata covering legislation, bills, jurisprudence, doctrine and related legal documents in one search system. Its webservice follows SRU and returns XML ([Senado Federal](https://www.senado.leg.br)) | “Encontre a Lei 8.078.” “Quais normas tratam deste assunto?” “Há decisões relacionadas a este dispositivo?” | Very high, particularly if Ask Brasil develops a legal-information layer. |
| 9. CNJ DataJud | Public search API | Process cover metadata and procedural movements from courts throughout Brazil, subject to confidentiality/privacy restrictions ([CNJ](https://www.cnj.jus.br)) | “Qual foi a última movimentação deste processo?” “Qual tribunal está com o caso?” “Encontre processos públicos com determinado assunto.” | High, but remember: case metadata, not full judgment text. |
| 10. Portal da Transparência | REST API; free token registration | Federal contracts, procurement, expenses, civil servants, official travel, sanctions, agreements and several citizen-benefit datasets. API permits filtered queries and recommends bulk files for massive retrieval ([Portal da Transparência](https://www.portaldatransparencia.gov.br)) | “Quanto este órgão gastou?” “Esse fornecedor tem contratos federais?” “Esta empresa aparece no CEIS?” “Quanto foi pago neste contrato?” | Very high for public transparency and investigative questions. |
| 11. Compras.gov.br | Public REST API + CSV | Suppliers, material/service catalogues, tenders, contracts, procurement without bidding and annual procurement plans. The official portal now has an API manual and interactive documentation updated in 2026 ([Serviços e Informações do Brasil](https://www.gov.br/pt-br/servicos)) | “Que contratos federais existem para serviços de limpeza?” “Quanto o governo costuma pagar por este serviço?” “Quais licitações estão relacionadas a X?” | Very high for businesses. Especially interesting commercially. |
| 12. Receita Federal — CNPJ Open Data | Bulk structured datasets | Company/establishment registration data including CNPJ identifiers, corporate name, legal nature, size, capital and establishment information. Receita publishes an official open-data CNPJ dataset and its data dictionary ([Serviços e Informações do Brasil](https://www.gov.br/pt-br/servicos)) | “Quantas empresas de limpeza existem em Recife?” “Qual o CNAE/porte desta empresa?” “Onde estão as filiais?” | High, but ingest it into your own database rather than query gigantic source files per request. |
| 13. INSS Open Data | CKAN API/downloads | Aggregate/anonymized data on maintained, issued, granted and denied benefits; pending requests; workplace accident notifications; INSS offices and more ([Serviços e Informações do Brasil](https://www.gov.br/pt-br/servicos)) | “Quais benefícios são mais indeferidos?” “Quantos BPC foram concedidos em Pernambuco?” “Quais os principais motivos de indeferimento?” | Useful analytics, but it cannot tell a user whether their own benefit was approved. |
| 14. SICONFI / Tesouro Nacional | Public JSON API, no user identification | Fiscal/accounting information for states and municipalities, including the accounting matrix and financial/fiscal data reported by subnational entities. No login is required ([Tesouro Transparente](https://www.tesourotransparente.gov.br)) | “Quanto Recife arrecadou?” “Qual a dívida deste município?” “Quanto Pernambuco gastou em determinada função?” | High for civic/research users, less important for ordinary service questions. |
| 15. TSE Dados Abertos | Bulk CSV/TXT/PDF/JPEG datasets | Candidates, declared assets, coalitions, electoral positions, campaign accounts, electorate, results and campaign documents. The portal currently exposes 182 datasets, including 2026 datasets ([Portal de Dados Abertos do TSE](https://www.tse.jus.br)) | “Qual é a candidatura registrada de X?” “Quais bens foram declarados?” “Qual foi o resultado oficial nesta cidade?” | High during elections, but should be ingested rather than queried as giant files on demand. Political answers must stay factual and neutral. |
| 16. Diário Oficial da União / INLABS | Daily XML/PDF downloads; registration required for INLABS | Official published federal acts. INLABS provides DOU material in machine-readable XML shortly after publication and also PDFs; the certified DOU remains the authoritative publication ([Imprensa Nacional](https://www.in.gov.br)) | “Saiu alguma portaria hoje sobre X?” “Foi publicada a nomeação?” “Quando esta regulamentação apareceu no DOU?” | Potentially enormous value for “latest official change” questions. |
| 17. Transferegov.br | New public APIs + CSV | Federal partnerships and transfers; current APIs include Gestão de Parcerias and Transferências Especiais, including parliamentary-transfer data, payments, execution, locality, year and status ([Serviços e Informações do Brasil](https://www.gov.br/pt-br/servicos)) | “Quanto deste recurso federal chegou ao município?” “Qual o status desta transferência?” “Que emendas foram destinadas a Recife?” | High for transparency/local government. |
| 18. Obrasgov.br | Public REST API, no authentication | Federally funded infrastructure projects, geolocation, physical execution, financial execution, status, agency and period ([Obrasgov API](https://www.gov.br/obrasgov/pt-br)) | “Que obras federais existem em Recife?” “Essa obra está parada?” “Quanto já foi executado?” | Very good citizen-facing widget. Data maps particularly well to visual cards/maps. |
| 19. Ministério do Trabalho — RAIS/Novo CAGED | Bulk microdata and official statistical files | Non-identified employment records and formal-labor statistics covering employment, occupations, industries, municipalities, admissions and dismissals ([Serviços e Informações do Brasil](https://www.gov.br/pt-br/servicos)) | “O emprego está crescendo em Recife?” “Qual setor mais contrata?” “Qual ocupação está crescendo?” | High analytics value, but not a live job-board replacement. |
| 20. INPE Programa Queimadas | Public geospatial datasets/geoservices | Active fire detections, burned-area/event products, fire risk and associated satellite/meteorological information; the official service is open to the general public ([Serviços e Informações do Brasil](https://www.gov.br/pt-br/servicos)) | “Há focos de incêndio perto desta cidade?” “Qual estado teve mais focos este mês?” | Good environmental capability, probably second/third wave. |
| 21. Dados.gov.br API | Meta-API / catalogue | Search, list and retrieve metadata about datasets, organizations, groups and tags across the Brazilian open-data catalogue ([Serviços e Informações do Brasil](https://www.gov.br/pt-br/servicos)) | Mostly internal: “Which official government dataset could answer this question?” | Extremely useful internally. It can become Ask Brasil's dataset discovery engine. |
| 22. Fala.BR / CGU open data | Bulk public data + authenticated operational API | Public statistical files about access-to-information requests and ombudsman complaints; an operational API also exists for authorized integrations ([Fala.BR](https://falabr.cgu.gov.br)) | “Which agencies receive the most complaints about X?” “How long are information requests taking?” | Interesting later, especially for government accountability; not launch-critical. |
| 23. GOVBR Design System | Reusable MIT-licensed source code/components | UI/components, rather than citizen data. The official core library is MIT licensed ([GitLab](https://gitlab.com/govbr-ds/govbr-ds)) | No user query—this improves Ask Brasil's interface/accessibility and Brazilian visual conventions. | Useful engineering asset, not an information source. |
| 24. Banco Central GitHub / Pix specs | GitHub OpenAPI specifications | Technical specifications of Pix and DICT. The official bacen organization is verified; pix-api defines the OpenAPI contract ([GitHub](https://github.com/bacen)) | “How does the Pix API work?” for technical users. It cannot answer “Where is my Pix?” | Not core Ask Brasil data. Useful only for technical/reference capabilities. |

## What I would put in the actual product first

After this research, I would slightly expand the MVP we previously discussed.

The first six integrations I would build are:

GOV.BR Services → IBGE → Banco Central → OpenDataSUS/CNES → ANVISA → legislation search (Câmara + Senado/LexML).

Why? Because together they make the assistant useful across a remarkably broad range:

- government procedures
- documents
- benefits guidance
- business
- geography
- statistics
- economy
- health services
- medicine/product regulation
- laws
- bills
- votes

And most importantly, these aren't just RAG documents. They let the assistant do deterministic lookups.

For example:

> “Minha mãe está tomando Ozempic. Esse medicamento é registrado no Brasil?”

Instead of:

```text
LLM → probably yes
```

we can eventually do:

```text
ANVISA → product record → explain → cite
```

ANVISA's public system covers registered medicines and exposes information such as commercial name, active substance and registration holder ([Serviços e Informações do Brasil](https://www.gov.br/pt-br/servicos))

Or:

> “Tem posto de saúde no bairro X?”

We can combine:

```text
IBGE location → CNES → health establishments
```

The Ministry of Health's API exposes CNES establishments and establishment types without authentication ([Serviços e Informações do Brasil](https://www.gov.br/pt-br/servicos))

Or:

> “O que aconteceu com o PL 1234/2026?”

The Câmara API can return the proposal itself, authors, related proposals, themes, complete tramitation history and associated votes ([Dados Abertos Câmara](https://dadosabertos.camara.leg.br))

That's the Ask Canada pattern done properly.

### A capability that I now think is especially valuable: DOU

I hadn't emphasized the Diário Oficial da União enough.

This could give Ask Brasil something very powerful:

> “What changed officially?”

INLABS provides the Diário Oficial in machine-readable XML, available daily shortly after publication; it requires registration, and the XML does not replace the digitally certified official publication ([Imprensa Nacional](https://www.in.gov.br))

That means we could ingest the new DOU every day and create an index like:

```text
DOU
│
├── laws
├── decrees
├── portarias
├── appointments
├── regulations
├── notices
└── agency decisions
```

Then questions such as:

> “Saiu alguma mudança nova do INSS?”

> “Houve portaria nova do Ministério da Saúde sobre isso?”

> “Essa norma já foi publicada?”

could search today's/this week's actual official publications.

That gets very close to what makes Ask Canada compelling: the assistant knows when model training knowledge isn't current enough.

### Another capability I think could be surprisingly compelling: public works

Obrasgov is very product-friendly.

Its new public API contains project location, physical progress, financial execution and project status, with filters by geography, situation, agency and period. It requires no authorization for its open-data API ([Obrasgov API](https://www.gov.br/obrasgov/pt-br))

Imagine:

> “Quais obras federais estão acontecendo em Recife?”

Ask Brasil could show:

```text
🏗 Escola X
Status: em execução
Physical completion: 74%
Federal resources: R$...
Updated: ...

🏗 Unidade de saúde Y
Status: paralisada
Physical completion: 31%
...
```

potentially on a map.

That's the kind of answer that makes the product feel genuinely different from ChatGPT.

### Another important opportunity: businesses

There is a very strong business-information stack hiding here:

```text
Receita CNPJ
      +
IBGE CNAE
      +
Compras.gov.br
      +
Portal da Transparência
      +
BCB
```

Receita's open CNPJ data contains company and establishment attributes; Compras.gov provides federal supplier, procurement, contract, material and service data; the Transparency Portal lets us query federal contracts and sanctions such as CEIS/CNEP ([Serviços e Informações do Brasil](https://www.gov.br/pt-br/servicos))

That allows questions such as:

> “Essa empresa possui contratos com o governo?”

> “Essa empresa aparece como sancionada?”

> “Quantas empresas deste CNAE existem em Recife?”

> “Quanto o governo paga por serviços de limpeza?”

## What I would not prioritize

The official Conecta GOV.BR API catalogue currently contains dozens of APIs, including very tempting things like CPF, CadÚnico and Previdência. But many are government-to-government integrations. The current catalogue explicitly describes granular integrations between public bodies; for example, the CadÚnico API's target audience is government administration entities ([Serviços e Informações do Brasil](https://www.gov.br/pt-br/servicos))

So I would not waste engineering time trying to integrate:

- private CPF lookup
- personal CadÚnico
- personal INSS benefits
- criminal-record lookup by user
- private GOV.BR account data

unless we later obtain legitimate authorization.

The public assistant doesn't need those anyway. It should explain and then hand the user to GOV.BR/Meu INSS/etc.

## What the Brazil architecture starts looking like

After this deeper review, I see the final source router more like:

```text
                              ASK BRASIL
                                  │
                         understand question
                                  │
        ┌───────────────┬─────────┼─────────┬───────────────┐
        │               │         │         │               │
   GOV.BR Services     IBGE      BCB      Health        Civic/legal
        │               │         │         │               │
        │               │         │     ┌───┴────┐     ┌────┴─────┐
        │               │         │     CNES   ANVISA Câmara   Senado
        │               │         │                       │      │
        │               │         │                       └─LexML─┘
        │               │         │
        │               │         └── economic live data
        │               │
        │               └── geography + statistics + CNAE
        │
        └── public-service instructions

              Other specialist routers
                       │
          ┌────────────┼────────────┐
          │            │            │
       DataJud    Transparência  Compras.gov
          │            │            │
       courts       spending      procurement
          │
       actual court
       source later

          DOU      TSE       SICONFI     Obrasgov
           │        │            │           │
       new rules elections   public finance public works

```

Then dados.gov.br sits behind the whole thing as a discovery catalogue, helping us identify additional official datasets as new user needs emerge. Its official API can search and detail datasets, organizations, groups and tags ([Serviços e Informações do Brasil](https://www.gov.br/pt-br/servicos))

That is the approach I would choose over trying to ingest “the Brazilian government” into one enormous vector database.

The most important new conclusion from this research is that Ask Brasil can potentially be richer than a simple Brazil port of Ask Canada. Brazil has some unusually good structured sources—particularly Câmara, IBGE, BCB, health data, procurement/transparency, DataJud and the new Transferegov/Obrasgov APIs—that lend themselves to interactive, verifiable tools rather than ordinary AI answers.

## Do the integrations need an API key?

Mostly no. For the highest-value Ask Brasil integrations, many are public and can be called without your own API key. A smaller group needs a token/account, and some Conecta APIs are effectively off-limits unless you are an authorized government body.

| Source | Need your own key/account? | Practical meaning |
| --- | --- | --- |
| GOV.BR Services — specific service lookup | No | You can query a known service without credentials. The full catalogue requires credentials ([Serviços e Informações do Brasil](https://www.gov.br/pt-br/servicos)) |
| IBGE APIs | No | Direct public REST calls. |
| Banco Central / SGS / PTAX / many OData feeds | No | Direct server-side calls to official public endpoints. |
| CNES / Ministry of Health open API | No | Ministry explicitly says no account/login is required ([Serviços e Informações do Brasil](https://www.gov.br/pt-br/servicos)) |
| ANVISA public/open datasets | Generally no | Public searches/open datasets can be consumed without a private key; we'd likely ingest some datasets rather than rely on a single unified API ([Serviços e Informações do Brasil](https://www.gov.br/pt-br/servicos)) |
| Câmara dos Deputados API | No | Free, no registration or identification required ([Dados Abertos Câmara](https://dadosabertos.camara.leg.br)) |
| Senado web services | No private key indicated | Public open-data web services/JSON/XML/CSV intended for machine consumption ([Senado Federal](https://www.senado.leg.br)) |
| LexML | No | Public SRU/XML search service ([Senado Federal](https://www.senado.leg.br)) |
| SICONFI / Tesouro | No | Treasury explicitly says no user identification or payment is required ([Tesouro Transparente](https://www.tesourotransparente.gov.br)) |
| Obrasgov public API | No private key indicated | Published as open data “available to everyone.” ([Obrasgov API](https://www.gov.br/obrasgov/pt-br)) |
| Transferegov public-data APIs | No private key indicated | The new public API environment is specifically for open public data ([Transferegov](https://www.gov.br/transferegov/pt-br)) |
| TSE open datasets | No | Mostly public CSV/download ingestion rather than per-request authenticated API calls. |
| Receita open CNPJ datasets | No | Download and ingest the public files into our own database. |
| INSS open datasets | No | Public aggregate datasets; not access to someone's private Meu INSS account. |
| RAIS/CAGED public microdata | No | Download/ingest public non-personal microdata. |
| DataJud | Yes, technically — but the key is public | CNJ publishes one public API key that everyone can use. No personal developer account is required, but the current key must be sent in the header and can change ([DataJud Wiki](https://datajud.cnj.jus.br)) |
| Portal da Transparência API | Yes | You obtain your own API key and send it as chave-api-dados ([Portal da Transparência](https://www.portaldatransparencia.gov.br)) |
| INLABS / Diário Oficial XML | Account/login | Free registration is required for the INLABS download portal ([Imprensa Nacional](https://www.in.gov.br)) |
| GOV.BR full services catalogue | Yes | Credential required for “all services”; individual-service retrieval doesn't require one ([Serviços e Informações do Brasil](https://www.gov.br/pt-br/servicos)) |
| CPF / CadÚnico / private Conecta APIs | Yes + government authorization | Not something we can simply get a developer key for as an ordinary public app. Requires authorized governmental integration ([Serviços e Informações do Brasil](https://www.gov.br/pt-br/servicos)) |

So for an initial version, you could build a surprisingly capable Ask Brasil with almost no credential setup:

- IBGE
- Banco Central
- CNES
- Câmara
- Senado
- LexML
- Obrasgov
- Transferegov
- + GOV.BR individual service lookups

Then we'd probably register/get only a few credentials:

- Portal da Transparência → our private API key
- INLABS → service account
- GOV.BR complete catalogue → request access if worthwhile
- DataJud → use CNJ's published public key

The expensive-looking part is therefore not acquiring APIs. Most of these are free public-data systems.

The main engineering work is building good adapters, caching, normalizing inconsistent government responses, and deciding which tool should answer which question.

One important warning: I would not hard-code DataJud's current public key into the source code even though CNJ publishes it. CNJ says it may change it at any time, so we should keep it in an environment variable or dynamically maintained config ([DataJud Wiki](https://datajud.cnj.jus.br))
