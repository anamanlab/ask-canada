/** Scripted answers for travelling with cannabis or a pet, one verdict per kind of trip. */
import type { Scenario } from '@/lib/scripted/types';
import { URLS } from '../data';
import { petOf, tripOf } from '../parse';
import type { Ctx } from './text';

export const cannabisScenario: Scenario = {
  id: 'transport-cannabis',
  priority: 9,
  match: [
    /\b(cannabis|weed|marijuana|pot|edibles?|thc|cbd|gummies)\b.*\b(fly|flying|flight|plane|travel\w*|border|airport|bring|carry|take|us|u\.s\.|states|abroad|trip|how much)\b/i,
    /\b(fly|flying|flight|plane|travel\w*|border|bring|carry|take)\b.*\b(cannabis|weed|marijuana|edibles?|thc|cbd)\b/i,
    /\b(cannabis|marijuana|pot|comestibles?|cbd)\b.*\b(avion|vol|voyag\w*|fronti[èe]re|a[ée]roport|apporter|transporter|traverser|[ÉE]tats-Unis|combien)\b/i,
    /\b(avion|voyag\w*|fronti[èe]re|apporter|transporter)\b.*\b(cannabis|marijuana|pot|cbd|comestibles?)\b/i,
  ],
  reply: {
    en: `# {headEn}

{bodyEn}

{closeEn}`,
    fr: `# {headFr}

{bodyFr}

{closeFr}`,
  },
  vars: ({ text }) => {
    const trip = tripOf(text);
    if (trip === 'leaving-canada' || trip === 'entering-canada')
      return {
        headEn: 'No: never take cannabis *across the border*.',
        headFr: 'Non : ne traversez *jamais la frontière* avec du cannabis.',
        bodyEn: `Taking cannabis into or out of Canada, in any form or amount, is a serious criminal offence, even if you’re going to or coming from a place where it’s legal, and even with a medical document. That includes edibles, oils and CBD. [1](${URLS.cannabisBorder.en}) If you have any when you enter Canada, you must declare it to the CBSA. Not declaring it can lead to arrest and prosecution [1](${URLS.cannabisBorder.en}), and penalties of up to $2,000. [2](${URLS.cannabisPenalties.en})`,
        bodyFr: `Entrer au Canada ou en sortir avec du cannabis, sous toute forme et en toute quantité, est une infraction criminelle grave, même en provenance ou à destination d’un endroit où il est légal, et même avec un document médical. Cela comprend les produits comestibles, les huiles et le CBD. [1](${URLS.cannabisBorder.fr}) Si vous en avez en entrant au Canada, vous devez le déclarer à l’ASFC. Ne pas le déclarer peut mener à une arrestation et à des poursuites [1](${URLS.cannabisBorder.fr}), ainsi qu’à des sanctions allant jusqu’à 2 000 $. [2](${URLS.cannabisPenalties.fr})`,
        closeEn: `Travelling within Canada instead? Adults can carry up to 30 g of dried cannabis in public, or the equivalent. Switch the trip below to see those rules. [3](${URLS.cannabisLimit.en})`,
        closeFr: `Vous voyagez plutôt au Canada? Les adultes peuvent avoir jusqu’à 30 g de cannabis séché en public, ou l’équivalent. Changez de voyage ci-dessous pour voir ces règles. [3](${URLS.cannabisLimit.fr})`,
      };
    if (trip === 'domestic-road')
      return {
        headEn: 'Yes: adults can carry *up to 30 g* within Canada.',
        headFr: 'Oui : les adultes peuvent transporter *jusqu’à 30 g* au Canada.',
        bodyEn: `Within Canada, adults can carry up to 30 g of dried cannabis in public, or the equivalent in other forms like edibles, oils or vapes. [1](${URLS.cannabisLimit.en}) Taking it into or out of Canada, in any amount, is a serious criminal offence, so leave it behind if your route crosses into the U.S. [2](${URLS.cannabisBorder.en})`,
        bodyFr: `Au Canada, les adultes peuvent avoir jusqu’à 30 g de cannabis séché en public, ou l’équivalent sous d’autres formes, comme des produits comestibles, des huiles ou des vapoteuses. [1](${URLS.cannabisLimit.fr}) L’apporter au Canada ou à l’étranger, en toute quantité, est une infraction criminelle grave : laissez-le derrière vous si votre trajet passe par les États-Unis. [2](${URLS.cannabisBorder.fr})`,
        closeEn: `Provinces and territories can add their own restrictions, so check the rules where you’re driving, including how to pack it in the car. [3](${URLS.cannabisProvinces.en}) The calculator below converts edibles, vapes, oils and drinks.`,
        closeFr: `Les provinces et territoires peuvent ajouter leurs propres restrictions : vérifiez les règles de l’endroit où vous conduisez, y compris la façon de le transporter dans la voiture. [3](${URLS.cannabisProvinces.fr}) Le calculateur ci-dessous convertit les produits comestibles, les vapoteuses, les huiles et les boissons.`,
      };
    return {
      headEn: 'Yes, within Canada, *up to 30 g*. Never across the border.',
      headFr: 'Oui, au Canada, *jusqu’à 30 g*. Jamais à la frontière.',
      bodyEn: `On flights within Canada, legal cannabis is allowed in carry-on and checked bags; oils and other liquids go in your 1 L clear bag. You’re responsible for the laws where you land. [1](${URLS.cannabisFlights.en}) Taking it into or out of Canada, in any amount, is a serious criminal offence. [2](${URLS.cannabisBorder.en})`,
      bodyFr: `Sur les vols au Canada, le cannabis légal est permis dans les bagages de cabine et enregistrés; les huiles et autres liquides vont dans votre sac transparent de 1 L. Vous devez connaître les lois de votre destination. [1](${URLS.cannabisFlights.fr}) L’apporter au Canada ou à l’étranger, en toute quantité, est une infraction criminelle grave. [2](${URLS.cannabisBorder.fr})`,
      closeEn: `Adults can carry up to 30 g of dried cannabis in public, or the equivalent in other forms. [3](${URLS.cannabisLimit.en}) The calculator below converts edibles, vapes, oils and drinks.`,
      closeFr: `Les adultes peuvent avoir jusqu’à 30 g de cannabis séché en public, ou l’équivalent sous d’autres formes. [3](${URLS.cannabisLimit.fr}) Le calculateur ci-dessous convertit les produits comestibles, les vapoteuses, les huiles et les boissons.`,
    };
  },
  toolCalls: [{ toolName: 'transportTravelRules', input: ({ text, lang }: Ctx) => ({ topic: 'cannabis', trip: tripOf(text), lang }) }],
};

export const petsScenario: Scenario = {
  id: 'transport-pets',
  priority: 7,
  match: [
    /\b(dogs?|cats?|pets?|puppy|puppies|kittens?|ferrets?)\b.*\b(travel\w*|fly|flying|flight|plane|border|cross\w*|bring|back|us|u\.s\.|states|abroad|trip|airport|rabies)\b/i,
    /\b(travel\w*|fly|flying|flight|bring|cross\w*)\b.*\b(dogs?|cats?|pets?|puppy|kittens?)\b/i,
    /\b(chiens?|chats?|animal|animaux|chiots?|chatons?)\b.*\b(voyag\w*|avion|vol|fronti[èe]re|traverser|revenir|rentrer|[ÉE]tats-Unis|rage|a[ée]roport)\b/i,
    /\b(voyag\w*|avion|traverser|revenir|rentrer|aller)\b.*\b(chiens?|chats?|animal|chiots?|chatons?)\b/i,
  ],
  exclude: [/\b(park|parc|trail|sentier|leash|laisse)\b/i],
  reply: {
    en: `# {headEn}

{bodyEn} Start with your veterinarian as soon as you know your dates. [2](${URLS.pets.en})

Pick your pet and your trip below to see what applies.`,
    fr: `# {headFr}

{bodyFr} Consultez votre vétérinaire dès que vous connaissez vos dates. [2](${URLS.pets.fr})

Choisissez votre animal et votre voyage ci-dessous pour voir ce qui s’applique.`,
  },
  vars: ({ text }) => {
    const trip = tripOf(text);
    if (trip === 'domestic-flight' || trip === 'domestic-road')
      return {
        headEn: 'Within Canada, *your airline* sets the pet rules.',
        headFr: 'Au Canada, c’est *votre transporteur aérien* qui fixe les règles.',
        bodyEn: `Contact your airline well before you fly to ask about carriers, cabin or cargo, and documents. At security, take your pet out of its carrier and carry it through the metal detector while the carrier is scanned. [1](${URLS.petsTravel.en})`,
        bodyFr: `Communiquez avec votre transporteur bien avant le vol au sujet de la cage, du transport en cabine ou en soute et des documents. Au contrôle de sécurité, sortez votre animal de sa cage et tenez-le dans vos bras au détecteur de métal pendant que la cage passe dans l’appareil. [1](${URLS.petsTravel.fr})`,
      };
    if (trip === 'leaving-canada')
      return {
        headEn: 'Check *your destination’s rules* first, then Canada’s for the trip home.',
        headFr: 'Vérifiez d’abord *les règles de votre destination*, puis celles du Canada pour le retour.',
        bodyEn: `Each country sets its own requirements; most need an export certificate from a licensed vet, endorsed by a CFIA veterinarian. Dogs going to the U.S. must meet the CDC’s rules, in force since August 1, 2024. [1](${URLS.petsUs.en})`,
        bodyFr: `Chaque pays fixe ses propres exigences; la plupart exigent un certificat d’exportation d’un vétérinaire autorisé, approuvé par un vétérinaire de l’ACIA. Les chiens qui vont aux États-Unis doivent respecter les règles des CDC, en vigueur depuis le 1er août 2024. [1](${URLS.petsUs.fr})`,
      };
    return {
      headEn: 'Bring your pet’s *rabies certificate* to cross into Canada.',
      headFr: 'Apportez le *certificat de vaccination contre la rage* de votre animal pour entrer au Canada.',
      bodyEn: `Dogs and cats 3 months or older need a valid rabies vaccination certificate, in English or French, from a licensed veterinarian, even when they’re Canadian pets coming home. Other rules can apply depending on where you’re coming from and your pet’s age. [1](${URLS.petsImport.en})`,
      bodyFr: `Les chiens et les chats de 3 mois ou plus doivent avoir un certificat valide de vaccination contre la rage, en français ou en anglais, d’un vétérinaire autorisé, même s’ils rentrent au Canada. D’autres règles peuvent s’appliquer selon votre provenance et l’âge de l’animal. [1](${URLS.petsImport.fr})`,
    };
  },
  toolCalls: [
    {
      toolName: 'transportTravelRules',
      input: ({ text, lang }: Ctx) => ({ topic: 'pets', pet: petOf(text), trip: tripOf(text) ?? 'entering-canada', lang }),
    },
  ],
};
