/**
 * Brazil country pack: the client-safe half (brand, locales, services, art, sources). It is bundled for the
 * browser, so it must never hold server-only content; the system prompt, UI catalogs and live data loaders
 * live in `./pack.server.ts`. The identity (`brand`) is its own module, `./brand`.
 *
 * Run it with `COUNTRY=br pnpm dev`. Nothing in `src/app`, `src/components` or `src/lib` changes.
 */
import {
  Baby,
  BookUser,
  Briefcase,
  Building2,
  CloudSun,
  CreditCard,
  Earth,
  FolderOpen,
  GraduationCap,
  HandCoins,
  HeartPulse,
  House,
  IdCard,
  Landmark,
  PiggyBank,
  Receipt,
  Scale,
  Shield,
  Sun,
  TrainFront,
  Zap,
} from 'lucide-react';
import type { ClientPack } from '../types';
import { brand } from './brand';

/** Widget ids in Menu/Lab order. `holidays` is the first one built; the rest follow the roadmap in docs/PLAN_BR.md. */
export const WIDGET_IDS = ['holidays', 'economia', 'ibge', 'servico', 'camara'] as const;

export const pack: ClientPack = {
  id: 'br',
  region: 'BR',
  currency: 'BRL',
  timeZone: 'America/Sao_Paulo',
  locales: {
    // Portuguese is the only official language of Brazil (Constituição, art. 13) and the product is
    // Portuguese-first. English is kept as a genuinely reviewed second language so visitors, expatriates
    // and English speakers still get a full interface, and so the parity checkers have a pair to check.
    supported: ['pt', 'en', 'es'],
    official: ['pt', 'en'],
    default: 'pt',
  },
  brand,
  // Verify every number on the official page before shipping: these are rendered in the footer and injected
  // into the model's prompt by src/lib/ai/system-prompt.ts, so a wrong one is a safety bug.
  // `number` is the line the footer and the prompt lead with, and it has to be the general one: 190 Polícia
  // Militar (police) · 192 SAMU (medical only) · 193 Bombeiros · 191 PRF · CVV 188 (mental health, 24/7).
  emergency: { number: '190', crisis: 'ligue 188', crisisTel: '188' },
  sources: {
    allowlist: [
      'gov.br',
      'sougov.br',
      'jus.br',
      'bcb.gov.br',
      'ibge.gov.br',
      'serpro.gov.br',
      'dataprev.gov.br',
      'inep.gov.br',
      'mre.gov.br',
      'planalto.gov.br',
      'camara.leg.br',
      'senado.leg.br',
      'tse.jus.br',
      'aneel.gov.br',
      'ans.gov.br',
      'anp.gov.br',
      'antt.gov.br',
      'senatran.gov.br',
      'dados.gov.br',
    ],
    showcase: [
      'gov.br',
      'meu.inss.gov.br',
      'cadunico.dataprev.gov.br',
      'servicos.gov.br',
      'conecte.saude.gov.br',
      'ibge.gov.br',
      'bcb.gov.br',
      'tse.jus.br',
      'dadosabertos.camara.leg.br',
      'pncp.gov.br',
    ],
  },
  officialHome: { pt: 'https://www.gov.br/pt-br', en: 'https://www.gov.br/en' },
  officialHomeLabel: 'gov.br',
  services: [
    // The gov.br service areas. Everything listed here also appears in the Menu, so every id needs
    // services.<id>.{name,desc,starter,go} in messages/pt.json + en.json and a scenario for its starter.
    { id: 'benefits', icon: HandCoins, featured: true },
    { id: 'taxes', icon: Receipt, featured: true },
    { id: 'retirement', icon: Sun, featured: true },
    { id: 'health', icon: HeartPulse, featured: true },
    { id: 'education', icon: GraduationCap, featured: true },
    { id: 'work', icon: Briefcase, featured: true },
    { id: 'business', icon: Building2, featured: true },
    { id: 'documents', icon: FolderOpen, featured: true },
    { id: 'family', icon: Baby, featured: true },
    { id: 'housing', icon: House, featured: true },
    { id: 'passports', icon: BookUser, featured: true },
    { id: 'immigration', icon: Landmark, featured: true },
    { id: 'civic', icon: Landmark, featured: true },
    { id: 'transport', icon: TrainFront, featured: true },
    { id: 'energy', icon: Zap, featured: true },
    { id: 'environment', icon: CloudSun, featured: true },
    { id: 'justice', icon: Scale, featured: true },
    { id: 'security', icon: Shield, featured: true },
    { id: 'money', icon: PiggyBank, featured: true },
    { id: 'world', icon: Earth },
  ],
  art: {
    hero: {
      land: { light: '/art/br/land-hero-light.svg', dark: '/art/br/land-hero-dark.svg' },
      aurora: '/art/br/sky-day.svg',
      auroraDark: '/art/br/sky-night.svg',
    },
    night: {
      land: { light: '/art/br/land-night.svg', dark: '/art/br/land-night.svg' },
      aurora: '/art/br/sky-night.svg',
    },
    dusk: {
      land: { light: '/art/br/land-dusk-light.svg', dark: '/art/br/land-dusk-dark.svg' },
      aurora: '/art/br/sky-dusk.svg',
      auroraDark: '/art/br/sky-night.svg',
    },
  },
  // The starter chips across the hero. Phones keep the four without `wideOnly`.
  // Each chip names its own glyph and phone-tile hue from the Brazilian identity.
  chips: [
    { id: 'cpf', icon: CreditCard, tile: { light: '#0c326f', dark: '#8cc6ea' } },
    { id: 'rg', icon: IdCard, tile: { light: '#007a2e', dark: '#7fd7a4' } },
    { id: 'bolsafamilia', icon: HandCoins, tile: { light: '#8a5a00', dark: '#e9bd72' } },
    { id: 'passaporte', icon: BookUser, tile: { light: '#2c4f8c', dark: '#9dbcf0' } },
    { id: 'inss', wideOnly: true, icon: Shield, tile: { light: '#0b5c8a', dark: '#8cc6ea' } },
    { id: 'imposto', wideOnly: true, icon: Receipt, tile: { light: '#a3305f', dark: '#f0a3c2' } },
  ],
  // Landing artwork paths for the Brazil pack.
  phoneArt: {
    shore: { light: '/art/br/shore-light.svg', dark: '/art/br/shore-dark.svg' },
    'shore-mist': { light: '/art/br/shore-mist-light.svg', dark: '/art/br/shore-mist-dark.svg' },
    'shore-canoe': { light: '/art/br/shore-canoe-light.svg', dark: '/art/br/shore-canoe-dark.svg' },
    'shore-fore': { light: '/art/br/shore-fore-light.svg', dark: '/art/br/shore-fore-dark.svg' },
    prairie: { light: '/art/br/prairie-light.svg', dark: '/art/br/prairie-dark.svg' },
  },
  silentTools: ['officialGuidance'],
  widgetIds: WIDGET_IDS,
};

export default pack;