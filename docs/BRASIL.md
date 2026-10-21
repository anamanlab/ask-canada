# Ask Brasil — guia do projeto

**Ask Brasil** é a implementação brasileira do projeto aberto [Ask Canada](../README.md), por meio do pacote `src/countries/br/`. Seu objetivo é facilitar a localização e a compreensão de informações sobre serviços públicos brasileiros, com linguagem simples, fontes oficiais e encaminhamento para o serviço competente.

> **Projeto independente.** Não é um serviço oficial do Governo Federal, não representa órgão público e não substitui os portais, os atendentes ou as orientações oficiais. Não informe senhas, códigos de acesso, CPF completo, dados bancários ou dados sensíveis no chat.

## O que existe no código

O pacote brasileiro contém uma interface prioritariamente em português, versão complementar em inglês, pesquisa em um índice gerado de aproximadamente 1.600 serviços, integrações para dados públicos e componentes interativos. Esse número descreve o índice implementado e **não** representa usuários, serviços oficialmente homologados, cobertura integral do governo ou dados necessariamente atualizados no momento da consulta.

| Área | Fonte / integração documentada | Como interpretar |
| --- | --- | --- |
| Catálogo de serviços | Exportação pública de serviços / Portal GOV.BR, processada por `scripts/fetch-servicos.mjs` | Dados gerados no repositório podem envelhecer; confirme requisitos, taxas e prazos no endereço oficial |
| Municípios e unidades da Federação | API pública do IBGE | Identificadores e informações geográficas; confirme data e disponibilidade |
| Indicadores econômicos | API pública do Banco Central | Valores dependem de série, período e atualização; ausência ou falha nunca deve virar estimativa |
| Câmara dos Deputados | API de Dados Abertos | Exibição factual de dados legislativos; não há recomendações de voto nem avaliações de candidatos |
| Feriados e pontos facultativos | Referências oficiais verificadas nos testes e na fonte | Diferencie feriado de ponto facultativo e informe o âmbito de aplicação |

Nenhuma resposta deve simular autenticação GOV.BR, consultar cadastros pessoais sem autorização, gerar comprovantes oficiais ou afirmar que uma solicitação foi protocolada.

## Experimentar localmente

Requisitos: Node.js 22 ou superior e pnpm conforme `packageManager` em [package.json](../package.json).

```bash
pnpm install --frozen-lockfile
COUNTRY=br pnpm dev
```

Com `SCRIPTED_AI=1`, é possível exercitar respostas demonstrativas sem depender de um provedor de IA. Essa opção é **para testes**, não prova que respostas geradas pelo modelo estejam corretas e não deve ser confundida com produção.

Para executar verificações:

```bash
pnpm typecheck:br
pnpm lint
pnpm check:i18n:br
pnpm check:scenarios:br
pnpm test:br:holidays
pnpm test:br:servicos
pnpm test:br:contract
```

Os detalhes de implantação por país estão em [DEPLOY_TWO_COUNTRIES.md](DEPLOY_TWO_COUNTRIES.md). Não publique credenciais, dados de usuários, arquivos `.env` ou capturas de telas com informação pessoal.

## Regras para informações públicas

1. **Fonte verificável:** toda afirmação variável (valores, prazos, condições, órgãos responsáveis) deve indicar fonte primária, URL e data da última conferência. A data de captura não substitui a vigência da norma.
2. **Informação não é execução:** explique as etapas e encaminhe para o canal oficial; não finja executar serviços, pagar taxas, protocolar pedidos ou consultar situação individual.
3. **Hierarquia e falhas:** priorize APIs e registros oficiais adequados à pergunta, sinalize dados desatualizados e mostre indisponibilidade sem inventar números ou resultados.
4. **Linguagem simples:** use frases curtas, verbos diretos e organização por etapas; evite jargão administrativo ou explique-o.
5. **Acessibilidade:** rótulos, navegação por teclado, contraste, foco visível, leitores de tela, responsividade e estados de erro compreensíveis.
6. **Privacidade:** minimize coleta e persistência, não solicite credenciais ou identificadores sensíveis, teste vazamentos e avalie o tratamento de dados antes de ativar provedores externos.
7. **Neutralidade cívica:** apresente registros públicos, fontes e datas sem classificar partidos, candidatos, propostas ou escolhas eleitorais.

Referências oficiais úteis:

- [GOV.BR — orientações de linguagem simples](https://www.gov.br/pt-br/guia-de-edicao-de-servicos-do-gov.br/escrevendo-para-o-seu-usuario)
- [Padrão Digital de Governo — acessibilidade](https://www.gov.br/ds/acessibilidade)
- [Padrões de qualidade para serviços públicos digitais](https://www.gov.br/governodigital/pt-br/estrategias-e-governanca-digital/transformacao-digital/central-de-qualidade/padroes-de-qualidade/padroes-de-qualidade-para-servicos-publicos-digitais)
- [ANPD — materiais e guias de proteção de dados](https://www.gov.br/anpd/pt-br/centrais-de-conteudo/materiais-educativos-e-publicacoes)

## Colabore

Leia [CONTRIBUTING.md](../CONTRIBUTING.md) e [BR_MAINTENANCE.md](BR_MAINTENANCE.md). Abra uma issue com URL oficial, data de consulta, comportamento esperado, passos para reproduzir e proposta de correção. Nunca inclua informações pessoais em issues públicas. Para vulnerabilidades, siga [SECURITY.md](../SECURITY.md) e utilize relato privado.

## Créditos e licença

O projeto-base Ask Canada é de **Ryan Campbell e colaboradores**, conforme [LICENSE](../LICENSE). A implementação do pacote brasileiro e suas adaptações estão registradas no histórico de commits e [PRs do Brasil](https://github.com/anamanlab/ask-canada/pulls?q=is%3Apr+Brazil). A licença MIT e os avisos de terceiros devem permanecer preservados. Este projeto não possui endosso do Governo do Brasil.
