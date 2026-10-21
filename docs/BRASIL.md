# Ask Brasil — pacote brasileiro (PT-BR)

**Projeto independente, de código aberto. Não é um site, canal de atendimento ou serviço oficial do Governo Federal.** Para entrar, solicitar serviços, enviar documentos ou pagar taxas, utilize os endereços oficiais mostrados nas respostas.

Este é o pacote brasileiro do [Ask Canada](../README.md), desenvolvido sobre a arquitetura de países criada no projeto de Ryan Campbell. O repositório preserva a implementação canadense. A contribuição brasileira introduz conteúdo, ferramentas, integrações e verificações próprias; não se atribui autoria da plataforma original.

## O que existe no código

- Interface prioritariamente em português brasileiro, com catálogo também em inglês.
- Pesquisa em uma **seleção limitada de 1.600 serviços** extraídos de um catálogo oficial em **03/10/2026**. Não é uma lista completa ou em tempo real; regras, taxas e requisitos podem mudar.
- Ferramentas para calendário federal, séries econômicas do Banco Central, localização do IBGE, serviços federais e dados públicos da Câmara dos Deputados.
- Encaminhamento para páginas oficiais quando o procedimento requer autenticação, inscrição, documento ou pagamento.
- Modo de respostas determinísticas para demonstração sem consumo de modelos de IA.

O projeto fornece **informação geral**, não aconselhamento jurídico, médico, tributário ou financeiro, nem consulta processos pessoais. Dados de APIs podem estar temporariamente indisponíveis; dados antigos não devem ser apresentados como atuais.

## Rodar o pacote brasileiro

Pré-requisitos: Node.js 22, pnpm 10 (ver `packageManager` em [package.json](../package.json)).

```bash
corepack enable
pnpm install --frozen-lockfile
COUNTRY=br SCRIPTED_AI=1 pnpm dev
```

Abra http://localhost:3000. O modo `SCRIPTED_AI=1` evita dependência de chaves de modelos e **não demonstra a qualidade de respostas generativas em produção**. Para modelos reais, veja [.env.example](../.env.example) e [implantação de dois países](DEPLOY_TWO_COUNTRIES.md). Nunca envie chaves para o GitHub.

Verificações locais (exigem dependências instaladas):

```bash
pnpm typecheck:br
pnpm lint
pnpm check:i18n:br
pnpm check:scenarios:br
pnpm test:br:holidays
pnpm test:br:servicos
pnpm test:br:contract
```

Os testes que usam fontes simuladas **não** verificam que dados governamentais continuam atuais. Consulte [política de fontes e qualidade](SOURCE_POLICY_BR.md) antes de alterar fatos e [contribuições](../CONTRIBUTING.md) antes de abrir um PR.

## Privacidade, acessibilidade e identificação

Não envie CPF, RG, NIS, números de contas, senhas, códigos de acesso, dados de saúde ou documentos de terceiros em perguntas, exemplos ou issues. A LGPD trata CPF e RG como dados pessoais; dados de saúde são dados pessoais sensíveis. O código procura reduzir exposição, mas a operação de uma instância pública exige avaliação de provedores, logs, retenção e avisos de privacidade.

A meta de desenvolvimento é acessibilidade digital segundo as WCAG, considerando também o [eMAG brasileiro](https://emag.governoeletronico.gov.br/). **Não há declaração de conformidade certificada** ou auditoria independente neste documento.

## Antes de tornar uma implantação pública

- [ ] Substituir a URL, o domínio e o e-mail **fictícios** hoje presentes em `src/countries/br/brand/index.ts`. Eles incluem `example.gov.br` e **não podem ser divulgados como endereços de produção**.
- [ ] Confirmar domínio próprio que não sugira afiliação governamental, URLs canônicas, sitemap, contato e política de privacidade efetiva.
- [ ] Revisar a data e a abrangência do catálogo de serviços, limites de APIs, taxas e prazos; registrar evidências oficiais.
- [ ] Verificar manualmente teclado e leitores de tela em PT-BR, uso em celular e avisos de indisponibilidade.
- [ ] Executar as duas matrizes de CI (`ca` e `br`), testes de implantação e revisão de segurança/privacidade.

**Participação da comunidade:** GitHub Issues está desativado neste repositório (verificado em 21/10/2026). O responsável deve ativar *Settings → Features → Issues* antes de anunciar o formulário de erros; até lá, as propostas de correção podem ser enviadas por pull requests públicos **sem dados pessoais**. O formulário `.github/ISSUE_TEMPLATE/br-source-error.yml` ficará disponível depois da ativação.

## Créditos

Projeto original: [ryancampbell/ask-canada](https://github.com/ryancampbell/ask-canada). Adaptação brasileira: contribuições documentadas no [histórico de PRs](MAINTAINERSHIP.md). Licença do código: [MIT](../LICENSE). Fontes governamentais são de seus respectivos órgãos e têm condições próprias de reutilização. O projeto não tem vínculo com o Governo do Brasil.
