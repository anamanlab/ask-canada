# Ask Brasil — pacote Brasil (independente)

**Ask Brasil** é uma implementação comunitária, gratuita e de código aberto de uma interface para encontrar informações sobre serviços públicos brasileiros. **Não é um serviço oficial do Governo Federal, não representa órgãos públicos e não realiza protocolos, pagamentos ou autenticações no gov.br.** Para concluir um serviço, entre diretamente no órgão responsável pelo link oficial.

Este pacote é desenvolvido no fork `anamanlab/ask-canada` a partir do projeto original **Ask Canada**, creditado a Ryan Campbell em [NOTICE](../NOTICE). O núcleo do projeto e os avisos de direitos autorais continuam sujeitos à [licença MIT](../LICENSE) e ao [NOTICE](../NOTICE). A contribuição brasileira não implica manutenção ou endosso pelo autor do projeto original.

## O que está implementado

- Interface em português, com alternativa em inglês, selecionada com `COUNTRY=br`.
- Busca em um índice gerado de serviços federais, com links para páginas oficiais. O índice é uma **fotografia de dados públicos** e pode ficar desatualizado.
- Consultas estruturadas a dados públicos do IBGE, séries do Banco Central e informações legislativas da Câmara dos Deputados, conforme as ferramentas implementadas.
- Informações sobre feriados e pontos facultativos, com distinção entre ambos.
- Respostas orientadas a fontes e testes automatizados para as fontes, ferramentas e cenários conhecidos.

**Limites:** a resposta gerada por IA pode estar errada ou desatualizada. Não use a resposta isoladamente para prazos, valores, elegibilidade ou decisões jurídicas, médicas e financeiras. Confira os dados, suas datas e os critérios na fonte primária; evite inserir CPF, senhas, códigos gov.br, documentos ou outros dados pessoais no chat. Perguntas enviadas ao serviço podem ser processadas por um provedor de IA, dependendo da implantação. O projeto não substitui o portal oficial.

## Executar e testar

Requer Node.js 22+ e pnpm 10 conforme [package.json](../package.json). Instale as dependências e escolha o pacote antes de iniciar:

```bash
pnpm install --frozen-lockfile
COUNTRY=br pnpm dev
```

Verificações principais do Brasil:

```bash
pnpm typecheck:br
pnpm lint
pnpm check:i18n:br
pnpm check:scenarios:br
pnpm test:br:holidays
pnpm test:br:servicos
pnpm test:br:contract
```

A suíte de CI executa caminhos separados para Brasil e Canadá: [.github/workflows/ci.yml](../.github/workflows/ci.yml). Esses comandos são a maneira de **verificar**, não uma declaração de que todos passam em todas as versões. Consulte a execução mais recente da CI no GitHub.

## Fontes, atualização e rastreabilidade

| Conteúdo | Fonte primária / verificação |
| --- | --- |
| Serviços federais | [gov.br](https://www.gov.br/pt-br/servicos) e exportação pública SERPRO processada por `scripts/fetch-servicos.mjs` |
| Localidades | [IBGE](https://servicodados.ibge.gov.br/api/docs/localidades) |
| Séries econômicas | [Banco Central](https://dadosabertos.bcb.gov.br/) |
| Dados legislativos | [Câmara dos Deputados](https://dadosabertos.camara.leg.br/) |
| Acessibilidade | [eMAG](https://www.gov.br/governodigital/pt-br/acessibilidade-e-usuario/acessibilidade-digital) e [Padrão Digital de Governo](https://www.gov.br/ds) |

Os dados variam de cadência: algumas informações são consultadas em tempo de execução, outras são geradas previamente. **Não presuma atualização em tempo real.** Para mudar uma taxa, prazo, regra ou data, inclua URL oficial, data de publicação/consulta e o teste que demonstra a correção. Veja [plano e notas técnicas](PLAN_BR.md) e [implantação por país](DEPLOY_TWO_COUNTRIES.md).

### Identidade pública antes de implantar

Configure `NEXT_PUBLIC_BR_SITE_URL=https://seu-dominio-real.example` com um domínio **que você controle**, antes do build de produção. Sem essa variável, a origem padrão é `http://localhost:3000`, e a geração de sitemap/indexação deve permanecer desativada em uma implantação pública não configurada. Não use `.gov.br` nem marcas oficiais para um projeto independente. O valor precisa ser HTTPS, sem barra final. Revise `/robots.txt`, `/sitemap.xml`, URLs canônicas e idioma/alternates na URL publicada. Não anuncie um link de demonstração que ainda não foi testado. Use `COUNTRY=br` durante o build e no ambiente de execução.

## Contribuições abertas

Para relatar informação incorreta, use o [formulário de correção de fonte brasileira](../.github/ISSUE_TEMPLATE/br-source-report.yml) nas Issues. Para defeitos de segurança, **não abra uma issue pública**: leia [SECURITY.md](../SECURITY.md). Correções devem ser reproduzíveis, incluir provas oficiais, preservar neutralidade e distinguir informações institucionais de opiniões políticas. Siga [CONTRIBUTING.md](../CONTRIBUTING.md).

### Histórico verificável do pacote Brasil

O trabalho brasileiro foi incluído em [PR #1](https://github.com/anamanlab/ask-canada/pull/1) (primeiro pacote), [PR #2](https://github.com/anamanlab/ask-canada/pull/2) (correções funcionais e testes) e [PR #3](https://github.com/anamanlab/ask-canada/pull/3) (correções adicionais). Esses links demonstram desenvolvimento e manutenção **no fork**; não representam números de usuários, downloads, stars nem adoção externa. Contribuições externas e seus resultados devem ser documentados somente quando verificáveis.
