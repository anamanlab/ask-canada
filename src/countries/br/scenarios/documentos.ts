/**
 * Scripted answers for core Brazilian citizen documents:
 * CPF (Receita Federal) and CIN / Novo RG (Carteira de Identidade Nacional).
 */
import { U } from './titles';

const scenarios = [
  {
    id: 'documentos-cpf',
    priority: 8,
    match: [
      /\b(tirar|fazer|emitir|segunda via|2a via|2ª via|regularizar|consultar|perdi|obter).*\bcpf\b/i,
      /\bcpf\b.*\b(segunda via|2a via|2ª via|regularizar|pendente|bloqueado|cancelado|consultar|comprovante|cart[aã]o|perdi)\b/i,
      /\bcomo (tiro|fa[cç]o|pe[cç]o|emito|regularizo) (o |meu )?cpf\b/i,
      /\b(duplicate|second copy|how to get|register|regularize).*\bcpf\b/i,
    ],
    reply: {
      pt: `# A segunda via e a consulta do CPF são feitas online no site da Receita Federal, de forma gratuita e imediata.

Você pode emitir o Comprovante de Inscrição no CPF pelo portal da Receita Federal ou pelo aplicativo gov.br. O documento digital substitui o antigo cartão plástico azul e tem validade jurídica em todo o país.

Para regularizar um CPF que esteja "Pendente de Regularização" (geralmente por falta de entrega de Declaração de Imposto de Renda) ou "Suspenso" (dados cadastrais desatualizados), o pedido é feito online no formulário de regularização da Receita Federal, sem custo. [1](${U.cpf})`,
      en: `# A duplicate CPF or status check is done online for free on the Federal Revenue website with immediate issuance.

You can print or download your CPF Registration Proof via the Federal Revenue portal or the gov.br mobile app. This digital proof replaces the old blue plastic card and is legally valid nationwide.

To regularize a CPF marked as "Pending" (usually due to unfiled annual income tax) or "Suspended" (outdated personal info), submit the free online regularization request on the Receita Federal website. [1](${U.cpf})`,
    },
    checked: '2026-10-02',
    followUps: {
      pt: [
        'Como emitir a nova Carteira de Identidade Nacional (CIN)?',
        'Como faço a primeira emissão do passaporte?',
      ],
      en: [
        'How do I get the new National Identity Card (CIN)?',
        'How do I get a first passport?',
      ],
    },
  },
  {
    id: 'documentos-cin',
    priority: 8,
    match: [
      /\b(nova carteira de identidade|carteira de identidade nacional|cin|novo rg|tirar rg|segunda via do rg|fazer identidade)\b/i,
      /\b(como (tiro|fa[cç]o|emito|renovo)|documentos para|agendar).*\b(identidade|rg|cin)\b/i,
      /\b(national id|new id card|identity card|how to get id).*\b(brazil|cin|rg)\b/i,
    ],
    reply: {
      pt: `# A Carteira de Identidade Nacional (CIN) usa o número do CPF como padrão único e tem a 1ª via gratuita em todo o Brasil.

A CIN substitui o antigo RG estadual e unifica a identificação em todo o país pelo CPF. A primeira emissão em papel moeda ou policarbonato é 100% gratuita por lei federal.

Para emitir: agende o atendimento no órgão de identificação do seu estado (como Poupatempo em SP, Detran no RJ, Vapt Vupt em GO, etc.). Você precisará apresentar a Certidão de Nascimento ou Casamento e o CPF regularizado. Após a emissão presencial, você pode acessar a versão digital pelo aplicativo gov.br. [1](${U.cin})`,
      en: `# The National Identity Card (CIN) uses the CPF as the sole registry number, and the 1st issue is free nationwide.

The CIN replaces old state RG cards and unifies identification across Brazil using the CPF. The first issue on security paper or polycarbonate is 100% free by federal law.

To apply: schedule an in-person appointment at your state identification department (e.g. Poupatempo in SP, Detran in RJ, Vapt Vupt in GO). Present your original Birth or Marriage Certificate and your regular CPF. Once issued, your digital ID is available in the gov.br app. [1](${U.cin})`,
    },
    checked: '2026-10-02',
    followUps: {
      pt: [
        'Como tirar a 2ª via ou regularizar o CPF?',
        'Como faço a primeira emissão do passaporte?',
      ],
      en: [
        'How do I get a duplicate or regularize my CPF?',
        'How do I get a first passport?',
      ],
    },
  },
];

export default scenarios;
