/** Practice questions: more symbols, honours, sports and important dates (see ../quiz-bank.ts). */
import type { Question } from '../quiz';

export const EMBLEMS: Question[] = [
  {
    id: 's-maple',
    topic: 'symbols',
    chapter: 'symbols',
    q: { en: 'What is Canada’s best-known symbol?', fr: 'Quel est le symbole du Canada le plus connu?' },
    choices: { en: ['The maple leaf', 'The beaver', 'The fleur-de-lys', 'The Peace Tower'], fr: ['La feuille d’érable', 'Le castor', 'La fleur de lys', 'La Tour de la Paix'] },
    answer: 0,
    why: {
      en: 'The maple leaf is Canada’s best-known symbol. Maple leaves were adopted as a symbol by French-Canadians in the 1700s and have appeared on Canadian uniforms since the 1850s.',
      fr: 'La feuille d’érable est le symbole du Canada le plus connu. Adoptée comme symbole par les Canadiens français au dix-huitième siècle, elle figure sur les uniformes canadiens depuis les années 1850.',
    },
  },
  {
    id: 's-crown',
    topic: 'symbols',
    chapter: 'symbols',
    q: { en: 'For how long has the Crown been a symbol of the state in Canada?', fr: 'Depuis combien de temps la Couronne est-elle un symbole de l’État au Canada?' },
    choices: { en: ['50 years', '100 years', '400 years', '1,000 years'], fr: ['50 ans', '100 ans', '400 ans', '1 000 ans'] },
    answer: 2,
    why: {
      en: 'The Crown has been a symbol of the state in Canada for 400 years. Canada has been a constitutional monarchy in its own right since Confederation in 1867.',
      fr: 'La Couronne est un symbole de l’État au Canada depuis 400 ans. Le Canada est une monarchie constitutionnelle à part entière depuis la Confédération, en 1867.',
    },
  },
  {
    id: 's-fleur',
    topic: 'symbols',
    chapter: 'symbols',
    q: {
      en: 'In 1948, which province adopted its own flag, based on the Cross and the fleur-de-lys?',
      fr: 'En 1948, quelle province a adopté son propre drapeau, conçu à partir de la croix et de la fleur de lys?',
    },
    choices: { en: ['Quebec', 'New Brunswick', 'Manitoba', 'Nova Scotia'], fr: ['Le Québec', 'Le Nouveau-Brunswick', 'Le Manitoba', 'La Nouvelle-Écosse'] },
    answer: 0,
    why: {
      en: 'The fleur-de-lys was the symbol of French royalty for more than a thousand years. In 1948 Quebec adopted its own flag, based on the Cross and the fleur-de-lys.',
      fr: 'La fleur de lys a été le symbole de la royauté française pendant plus de 1 000 ans. En 1948, le Québec a adopté son propre drapeau, conçu à partir de la croix et de la fleur de lys.',
    },
  },
  {
    id: 's-arms',
    topic: 'symbols',
    chapter: 'symbols',
    q: { en: 'When did Canada adopt an official coat of arms?', fr: 'Quand le Canada a-t-il adopté des armoiries officielles?' },
    choices: {
      en: ['After the First World War', 'At Confederation, in 1867', 'After the Second World War', 'In 1982, with the Charter'],
      fr: ['Après la Première Guerre mondiale', 'À la Confédération, en 1867', 'Après la Seconde Guerre mondiale', 'En 1982, avec la Charte'],
    },
    answer: 0,
    why: {
      en: 'As an expression of national pride after the First World War, Canada adopted an official coat of arms. The arms contain symbols of England, France, Scotland and Ireland as well as red maple leaves.',
      fr: 'Pour exprimer sa fierté nationale après la Première Guerre mondiale, le Canada a adopté des armoiries officielles. Elles contiennent des symboles de l’Angleterre, de la France, de l’Écosse et de l’Irlande ainsi que des feuilles d’érable rouges.',
    },
  },
  {
    id: 's-peace-tower',
    topic: 'symbols',
    chapter: 'symbols',
    q: { en: 'The Peace Tower was completed in 1927 in memory of what?', fr: 'La Tour de la Paix a été terminée en 1927 en souvenir de quoi?' },
    choices: {
      en: ['The First World War', 'Confederation', 'The War of 1812', 'The Battle of the Plains of Abraham'],
      fr: ['La Première Guerre mondiale', 'La Confédération', 'La guerre de 1812', 'La bataille des plaines d’Abraham'],
    },
    answer: 0,
    why: {
      en: 'The Peace Tower was completed in 1927 in memory of the First World War. Its Memorial Chamber holds the Books of Remembrance.',
      fr: 'La Tour de la Paix a été terminée en 1927 en souvenir de la Première Guerre mondiale. Sa Chapelle du Souvenir contient les Livres du Souvenir.',
    },
  },
  {
    id: 's-library',
    topic: 'symbols',
    chapter: 'symbols',
    q: {
      en: 'Which part of the original Centre Block of Parliament survived the fire of 1916?',
      fr: 'Quelle partie de l’édifice du Centre du Parlement d’origine a été épargnée par l’incendie de 1916?',
    },
    choices: {
      en: ['The Library', 'The Peace Tower', 'The Senate chamber', 'The House of Commons chamber'],
      fr: ['La Bibliothèque', 'La Tour de la Paix', 'La salle du Sénat', 'La salle de la Chambre des communes'],
    },
    answer: 0,
    why: {
      en: 'The Centre Block was destroyed by an accidental fire in 1916 and rebuilt in 1922. The Library is the only part of the original building remaining.',
      fr: 'L’édifice du Centre a été détruit par un incendie accidentel en 1916 et reconstruit en 1922. La Bibliothèque est l’unique partie de l’édifice qui a été épargnée par les flammes.',
    },
  },
  {
    id: 's-hockey',
    topic: 'symbols',
    chapter: 'symbols',
    q: { en: 'Which sport is considered to be Canada’s national winter sport?', fr: 'Quel sport est considéré comme le sport d’hiver national du Canada?' },
    choices: { en: ['Hockey', 'Curling', 'Canadian football', 'Soccer'], fr: ['Le hockey', 'Le curling', 'Le football canadien', 'Le soccer'] },
    answer: 0,
    why: {
      en: 'Hockey is Canada’s most popular spectator sport and is considered to be the national winter sport. Ice hockey was developed in Canada in the 1800s.',
      fr: 'Le hockey, sport de spectacle favori des Canadiens, est considéré comme le sport d’hiver national. Le hockey sur glace a vu le jour au Canada au dix-neuvième siècle.',
    },
  },
  {
    id: 's-stanley',
    topic: 'symbols',
    chapter: 'symbols',
    q: { en: 'Who donated the Stanley Cup, in 1892?', fr: 'Qui a donné la Coupe Stanley, en 1892?' },
    choices: {
      en: ['Lord Stanley, the Governor General', 'Sir John A. Macdonald, the Prime Minister', 'Queen Victoria', 'The Hudson’s Bay Company'],
      fr: ['Lord Stanley, gouverneur général', 'Sir John A. Macdonald, premier ministre', 'La reine Victoria', 'La Compagnie de la Baie d’Hudson'],
    },
    answer: 0,
    why: {
      en: 'The National Hockey League plays for the championship Stanley Cup, donated by Lord Stanley, the Governor General, in 1892.',
      fr: 'Les équipes de la Ligue nationale de hockey se disputent la Coupe Stanley, donnée en 1892 par lord Stanley, gouverneur général du Canada.',
    },
  },
  {
    id: 's-royal-anthem',
    topic: 'symbols',
    chapter: 'symbols',
    q: { en: 'What is the Royal Anthem of Canada?', fr: 'Quel est l’hymne royal du Canada?' },
    choices: {
      en: ['God Save the King (or Queen)', 'O Canada', 'A Mari Usque Ad Mare', 'The Maple Leaf'],
      fr: ['Dieu protège le Roi (ou la Reine)', 'Ô Canada', 'A mari usque ad mare', 'La feuille d’érable'],
    },
    answer: 0,
    why: {
      en: 'The Royal Anthem of Canada, “God Save the King (or Queen)”, can be played or sung on any occasion when Canadians wish to honour the Sovereign.',
      fr: 'L’hymne royal du Canada, « Dieu protège le Roi (ou la Reine) », peut être joué ou chanté à toute occasion où les Canadiens veulent honorer le souverain.',
    },
  },
  {
    id: 's-order',
    topic: 'symbols',
    chapter: 'symbols',
    q: {
      en: 'In what year did Canada start its own honours system with the Order of Canada?',
      fr: 'En quelle année le Canada a-t-il mis en place son propre système de distinctions honorifiques en créant l’Ordre du Canada?',
    },
    choices: { en: ['1867', '1927', '1967', '1982'], fr: ['1867', '1927', '1967', '1982'] },
    answer: 2,
    why: {
      en: 'After using British honours for many years, Canada started its own honours system with the Order of Canada in 1967, the centennial of Confederation.',
      fr: 'Après avoir utilisé les distinctions britanniques pendant de nombreuses années, le Canada a créé l’Ordre du Canada en 1967, année du centenaire de la Confédération.',
    },
  },
  {
    id: 's-victoria-day',
    topic: 'symbols',
    chapter: 'symbols',
    q: {
      en: 'Which holiday falls on the Monday preceding May 25 and marks the Sovereign’s birthday?',
      fr: 'Quelle fête a lieu le lundi précédant le 25 mai et souligne l’anniversaire du souverain?',
    },
    choices: {
      en: ['Victoria Day', 'Canada Day', 'Labour Day', 'Thanksgiving Day'],
      fr: ['La fête de Victoria', 'La fête du Canada', 'La fête du Travail', 'L’Action de grâces'],
    },
    answer: 0,
    why: {
      en: 'Victoria Day is the Monday preceding May 25 (the Sovereign’s birthday).',
      fr: 'La fête de Victoria a lieu le lundi précédant le 25 mai (anniversaire du souverain).',
    },
  },
  {
    id: 's-thanksgiving',
    topic: 'symbols',
    chapter: 'symbols',
    q: { en: 'When is Thanksgiving Day in Canada?', fr: 'Quand a lieu l’Action de grâces au Canada?' },
    choices: {
      en: ['The second Monday of October', 'The first Monday of September', 'The Monday preceding May 25', 'November 20'],
      fr: ['Le deuxième lundi d’octobre', 'Le premier lundi de septembre', 'Le lundi précédant le 25 mai', 'Le 20 novembre'],
    },
    answer: 0,
    why: {
      en: 'Thanksgiving Day is the second Monday of October. Labour Day is the first Monday of September.',
      fr: 'L’Action de grâces a lieu le deuxième lundi d’octobre. La fête du Travail a lieu le premier lundi de septembre.',
    },
  },
  {
    id: 's-vimy-day',
    topic: 'symbols',
    chapter: 'symbols',
    q: { en: 'On what date is Vimy Day?', fr: 'À quelle date a lieu le Jour de Vimy?' },
    choices: { en: ['January 11', 'April 9', 'July 1', 'December 26'], fr: ['Le 11 janvier', 'Le 9 avril', 'Le 1er juillet', 'Le 26 décembre'] },
    answer: 1,
    why: {
      en: 'Vimy Day is April 9. Sir John A. Macdonald Day is January 11, Canada Day is July 1 and Boxing Day is December 26.',
      fr: 'Le Jour de Vimy est le 9 avril. La Journée sir John A. Macdonald est le 11 janvier, la fête du Canada, le 1er juillet, et le lendemain de Noël, le 26 décembre.',
    },
  },
];
