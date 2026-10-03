/**
 * General fallback answers: what the scripted engine says when no more specific scenario matches.
 *
 * These run when SCRIPTED_AI=1 (dev, screenshots) and when the model call fails, so they must be honest
 * about the service rather than pretending to be a normal answer.
 */
import type { Scenario } from '@/lib/scripted/types';
import { U } from './titles';

export const scenarios: Scenario[] = [
  {
    id: 'fallback',
    match: [],
    reply: {
      pt: `# Posso ajudar com serviços do Governo Federal.

Você pode perguntar sobre benefícios, impostos, INSS, saúde, educação, trabalho, empresas, documentos,
passaportes, viagens ou feriados, e eu procuro a página oficial certa para o seu caso. [1](${U.servicos})

Não entrego CPF, senha nem faço protocolo por você: quando o passo final é entrar na conta ou pagar, eu levo
você ao site oficial.`,
      en: `# I can help with Brazilian federal services.

Ask me about benefits, taxes, the INSS, health, education, work, business, documents, passports, travel or
holidays, and I will find the right official page. [1](${U.servicos})

I never take a CPF or a password and I never file a request for you: when the last step is signing in or
paying, I take you to the official site.`,
    },
    followUps: {
      pt: ['Qual é o próximo feriado nacional?', 'Quem tem direito ao BPC?', 'Como peço um benefício no Meu INSS?'],
      en: ['What is the next national holiday?', 'Who qualifies for the BPC?', 'How do I apply on Meu INSS?'],
    },
  },
  {
    id: 'identity',
    priority: 3,
    match: [
      // `\b` is ASCII-only, so it can never close a match after "você" or "vocês". Boundaries are spelled
      // out instead: start-or-whitespace before, whitespace-or-punctuation-or-end after.
      /(?:^|\s)(quem (?:s[ãa]o|é|e) voc[eê]s?|o que (?:s[ãa]o|é|e) voc[eê]s?|vc (?:é|e) (?:o )?governo|é o governo|voc[eê]s s[ãa]o)(?=$|[\s.,?!;:…—-])/i,
      /\b(who are you|are you the government|are you (the )?gov)/i,
    ],
    reply: {
      pt: `# Sou o Ask Brasil, um serviço independente.

Não sou o Governo Federal e não falo em nome de nenhum ministério. Minha resposta vem de páginas oficiais do
governo, e eu mostro qual é cada fonte e quando ela foi conferida. [1](${U.servicos})

Para entrar na conta, pedir ou pagar, eu levo você ao portal oficial — nunca peço seu CPF, sua senha ou seus
dados de pagamento.`,
      en: `# I'm Ask Brasil, an independent service.

I am not the Federal Government and I do not speak for any ministry. My answers come from official
government pages, and I show you which source each one is and when it was checked. [1](${U.servicos})

For signing in, applying or paying, I take you to the official portal — I never ask for your CPF, your
password or your payment details.`,
    },
    followUps: {
      pt: ['Qual é o próximo feriado nacional?', 'Quem tem direito ao BPC?'],
      en: ['What is the next national holiday?', 'Who qualifies for the BPC?'],
    },
  },
  {
    id: 'privacy-ours',
    priority: 3,
    match: [
      /\b(voc[eê]s (guardam|armazenam|salvam)|guardam (minha|mais) (pergunta|conversa|hist[oó]rico)|o que (voc[eê]s|servidor) (guarda|armazena|faz) com os dados)\b/i,
      /\b(do you (store|keep|save)|what do you do with) my (data|questions|conversation)/i,
    ],
    reply: {
      pt: `# Não guardamos sua conversa.

A pergunta é enviada ao servidor para escrever a resposta e não é gravada. Não há conta, nome nem e-mail, e
não usamos cookies de rastreamento. Qualquer lista ou plano que você crie fica no armazenamento local deste
navegador, e dá para apagar com "Limpar este aparelho" no menu.

Nunca pedimos CPF, CNPJ ou senha — se alguém pedir, não é o Ask Brasil.`,
      en: `# We do not store your conversation.

Your question is sent to our server to write the answer and is not written down. There is no account, name
or email, and we use no tracking cookies. Any checklist or plan you create lives in this browser's local
storage, and "Clear this device" in the menu removes it.

We never ask for a CPF, a CNPJ or a password — if someone asks, it is not Ask Brasil.`,
    },
    followUps: {
      pt: ['Como faço uma conta gov.br?', 'Quem tem direito ao BPC?'],
      en: ['How do I get a gov.br account?', 'Who qualifies for the BPC?'],
    },
  },
];

export default scenarios;