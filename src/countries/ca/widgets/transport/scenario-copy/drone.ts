/** Scripted answer for drone certificates: verdicts from the same pure helpers as the widget. */
import type { Scenario } from '@/lib/scripted/types';
import { URLS } from '../data';
import { MIN_AGE, categoryOf, sizeOf, tooYoungFor, type DroneCategory } from '../drone';
import { ageOf, droneOpOf, droneWeightOf } from '../parse';
import { weight, type Ctx, type Lang } from './text';

const CERT: Record<Exclude<DroneCategory, 'micro' | 'special'>, Record<Lang, string>> = {
  basic: { en: 'a *Basic* pilot certificate', fr: 'un certificat de pilote pour les *opérations de base*' },
  advanced: { en: 'an *Advanced* pilot certificate', fr: 'un certificat de pilote pour les *opérations avancées*' },
  complex: { en: 'a *Level 1 Complex* pilot certificate', fr: 'un certificat pour les *opérations complexes de niveau 1*' },
};

function droneHead(text: string, lang: Lang): string {
  const fr = lang === 'fr';
  const w = droneWeightOf(text);
  const op = droneOpOf(text);
  const age = ageOf(text);
  const cat = categoryOf(w != null ? sizeOf(w) : 'small', op ?? 'standard');
  if (tooYoungFor(cat, age)) {
    if (cat === 'complex') return fr ? `À ${age} ans, seulement en formation, sous la *supervision directe* d’un pilote certifié.` : `At ${age}, only in training, with a *certified pilot* supervising.`;
    return fr ? `À ${age} ans, seulement sous la *supervision directe* d’un pilote certifié.` : `At ${age}, only with a *certified pilot* supervising.`;
  }
  if (cat === 'micro')
    return w != null && w < 250 && /\d/.test(text)
      ? fr
        ? `À ${weight(w, lang)}, c’est un microdrone : *aucun certificat* ni immatriculation requis.`
        : `At ${weight(w, lang)}, it’s a microdrone: *no certificate* or registration needed.`
      : fr
        ? 'Moins de 250 g? *Aucun certificat* ni immatriculation requis.'
        : 'Under 250 g? *No certificate* or registration needed.';
  if (cat === 'special')
    return op === 'event'
      ? fr
        ? 'Lors d’un événement annoncé, il vous faut d’abord *la permission de Transports Canada*.'
        : 'At an advertised event, you need *Transport Canada’s permission* first.'
      : fr
        ? `À ${weight(w ?? 150_001, lang)}, il vous faut d’abord *la permission de Transports Canada*.`
        : `At ${weight(w ?? 150_001, lang)}, you need *Transport Canada’s permission* first.`;
  const cert = CERT[cat][lang];
  if (w != null) return fr ? `À ${weight(w, lang)}, il vous faut ${cert}.` : `At ${weight(w, lang)}, you need ${cert}.`;
  if (op === 'near-people') return fr ? `Pour voler près des gens, il vous faut ${cert}.` : `To fly close to people, you need ${cert}.`;
  if (op === 'controlled-airspace') return fr ? `Près d’un aéroport, il vous faut ${cert}.` : `Near an airport, you need ${cert}.`;
  if (op === 'bvlos') return fr ? `Au-delà de la visibilité directe, il vous faut ${cert}.` : `Beyond visual line-of-sight, you need ${cert}.`;
  return fr ? 'La plupart des drones exigent une *immatriculation* et un certificat de pilote.' : 'Most drones need *registration* and a pilot certificate.';
}

/** The under-age paragraph: flying under a certified pilot's direct supervision (CAR 901.54(2), 901.63(2), 901.89(2)). */
function droneYoung(text: string, lang: Lang): string {
  const fr = lang === 'fr';
  const w = droneWeightOf(text);
  const age = ageOf(text);
  const cat = categoryOf(w != null ? sizeOf(w) : 'small', droneOpOf(text) ?? 'standard');
  if (!tooYoungFor(cat, age) || age == null) return '';
  const owner =
    age < 14
      ? fr
        ? ` Le drone doit toutefois être immatriculé par un propriétaire âgé d’au moins 14 ans, comme un parent. [7](${URLS.carOwner.fr}) Seul, un enfant de tout âge peut piloter un microdrone (moins de 250 g).`
        : ` The drone itself must be registered by an owner who is 14 or older, like a parent. [7](${URLS.carOwner.en}) On their own, kids of any age can fly a microdrone (under 250 g).`
      : '';
  if (cat === 'complex')
    return fr
      ? `Avant ${MIN_AGE.complex} ans, les vols complexes de niveau 1 sont permis seulement en formation, sous la supervision directe d’un pilote certifié pour ces opérations âgé d’au moins 18 ans. [6](${URLS.carPilot.complex.fr})${owner}`
      : `Under ${MIN_AGE.complex}, Level 1 Complex flights are allowed only for training, directly supervised by a Level 1 Complex pilot who is 18 or older. [6](${URLS.carPilot.complex.en})${owner}`;
  if (cat === 'advanced')
    return fr
      ? `Avant ${MIN_AGE.advanced} ans, on peut effectuer une opération avancée seulement sous la supervision directe d’une personne titulaire d’un certificat pour les opérations avancées ou complexes de niveau 1. [6](${URLS.carPilot.advanced.fr})${owner}`
      : `Under ${MIN_AGE.advanced}, you can fly an Advanced operation only under the direct supervision of someone with an Advanced or Level 1 Complex certificate. [6](${URLS.carPilot.advanced.en})${owner}`;
  return fr
    ? `Avant ${MIN_AGE.basic} ans, on peut quand même piloter un drone de 250 g ou plus, sous la supervision directe d’une personne titulaire d’un certificat de pilote de drone : la règle d’âge ne s’applique pas dans ce cas. [6](${URLS.carPilot.basic.fr})${owner}`
    : `Under ${MIN_AGE.basic}, a pilot can still fly a drone of 250 g or more while someone who holds a drone pilot certificate directly supervises them: the age rule doesn’t apply in that case. [6](${URLS.carPilot.basic.en})${owner}`;
}

export const droneScenario: Scenario = {
  id: 'transport-drone',
  priority: 8,
  match: [/\bdrones?\b/i, /\b(rpas|remotely piloted)\b/i, /\b(dji|mavic|drone pilot)\b/i, /\b(télépilot\w*|aéronef télépiloté)\b/i],
  exclude: [/\b(parks? canada|national park|parc national)\b/i],
  reply: {
    en: `# {headEn}

In Canada, every drone that weighs 250 g or more must be registered with Transport Canada, and its pilot needs a drone pilot certificate. Drones under 250 g (microdrones) need neither. [1](${URLS.droneCategories.en}) [2](${URLS.droneRegister.en})

For most people, the **Basic** certificate is enough: pass a 35-question online exam (65% to pass) and it’s issued right away. Flying close to people or in controlled airspace needs the **Advanced** certificate, which adds a harder exam and an in-person flight review. [3](${URLS.droneExam.en}) [4](${URLS.droneAdvanced.en})

Fines for individuals go up to $1,000 for flying without a certificate and $5,000 for an unregistered drone. [5](${URLS.droneBasic.en})

{youngEn}

Set your drone’s weight and how you’ll fly below to see your exact path and Transport Canada’s fees today.`,
    fr: `# {headFr}

Au Canada, tout drone de 250 g ou plus doit être immatriculé auprès de Transports Canada, et son pilote doit avoir un certificat de pilote de drone. Les drones de moins de 250 g (microdrones) n’exigent ni l’un ni l’autre. [1](${URLS.droneCategories.fr}) [2](${URLS.droneRegister.fr})

Pour la plupart des gens, le certificat pour les **opérations de base** suffit : réussissez un examen en ligne de 35 questions (note de passage de 65 %) et il est délivré immédiatement. Voler près des gens ou dans l’espace aérien contrôlé exige le certificat pour les **opérations avancées**, qui ajoute un examen plus difficile et une révision en vol en personne. [3](${URLS.droneExam.fr}) [4](${URLS.droneAdvanced.fr})

Pour les particuliers, les amendes vont jusqu’à 1 000 $ pour voler sans certificat et jusqu’à 5 000 $ pour un drone non immatriculé. [5](${URLS.droneBasic.fr})

{youngFr}

Indiquez ci-dessous le poids de votre drone et comment vous volerez pour voir votre parcours exact et les frais de Transports Canada aujourd’hui.`,
  },
  vars: ({ text }) => ({ headEn: droneHead(text, 'en'), headFr: droneHead(text, 'fr'), youngEn: droneYoung(text, 'en'), youngFr: droneYoung(text, 'fr') }),
  toolCalls: [
    {
      toolName: 'transportDrone',
      input: ({ text, lang, timeZone }: Ctx) => ({ weightGrams: droneWeightOf(text), operation: droneOpOf(text), age: ageOf(text), lang, timeZone }),
    },
  ],
};
