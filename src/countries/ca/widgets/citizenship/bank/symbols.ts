/** Practice questions: symbols (see ../quiz-bank.ts for how the bank is written and used). */
import type { Question } from '../quiz';

export const SYMBOLS: Question[] = [
  {
    id: 's-motto',
    topic: 'symbols',
    chapter: 'symbols',
    q: { en: 'What does Canada’s motto, A Mari Usque Ad Mare, mean?', fr: 'Que signifie la devise du Canada, A mari usque ad mare?' },
    choices: {
      en: ['True north strong and free', 'From sea to sea', 'Peace, order and good government', 'Glorious and free'],
      fr: ['Terre de nos aïeux', 'D’un océan à l’autre', 'Paix, ordre et bon gouvernement', 'Glorieux et libre'],
    },
    answer: 1,
    why: {
      en: 'Adopted after the First World War, the national motto A Mari Usque Ad Mare means “from sea to sea” in Latin.',
      fr: 'Adoptée après la Première Guerre mondiale, la devise nationale A mari usque ad mare signifie « d’un océan à l’autre » en latin.',
    },
  },
  {
    id: 's-lacrosse',
    topic: 'symbols',
    chapter: 'symbols',
    q: { en: 'What is Canada’s official summer sport?', fr: 'Quel est le sport officiel de l’été au Canada?' },
    choices: { en: ['Soccer', 'Baseball', 'Lacrosse', 'Canadian football'], fr: ['Le soccer', 'Le baseball', 'La crosse', 'Le football canadien'] },
    answer: 2,
    why: {
      en: 'Lacrosse, an ancient sport first played by Aboriginal peoples, is the official summer sport. Hockey is the national winter sport.',
      fr: 'La crosse, sport ancien joué à l’origine par les Autochtones, est le sport officiel de l’été. Le hockey est le sport national d’hiver.',
    },
  },
  {
    id: 's-vc',
    topic: 'symbols',
    chapter: 'symbols',
    q: { en: 'What is the highest honour available to Canadians?', fr: 'Quelle est la plus haute distinction que peuvent recevoir les Canadiens?' },
    choices: {
      en: ['The Order of Canada', 'The Victoria Cross', 'The Stanley Cup', 'The Governor General’s Medal'],
      fr: ['L’Ordre du Canada', 'La Croix de Victoria', 'La coupe Stanley', 'La Médaille du gouverneur général'],
    },
    answer: 1,
    why: {
      en: 'The Victoria Cross is the highest honour available to Canadians, awarded for the most conspicuous bravery in the presence of the enemy.',
      fr: 'La Croix de Victoria est la plus haute distinction que peuvent recevoir les Canadiens. Elle récompense la plus grande bravoure face à l’ennemi.',
    },
  },
  {
    id: 's-flag',
    topic: 'symbols',
    chapter: 'symbols',
    q: { en: 'In what year was the current Canadian flag raised for the first time?', fr: 'En quelle année le drapeau canadien actuel a-t-il été hissé pour la première fois?' },
    choices: { en: ['1867', '1921', '1965', '1982'], fr: ['1867', '1921', '1965', '1982'] },
    answer: 2,
    why: {
      en: 'The new Canadian flag was raised for the first time in 1965. Its red-white-red pattern comes from the flag of the Royal Military College in Kingston.',
      fr: 'Le nouveau drapeau canadien a été hissé pour la première fois en 1965. Son motif rouge-blanc-rouge vient du drapeau du Collège militaire royal de Kingston.',
    },
  },
  {
    id: 's-ola',
    topic: 'symbols',
    chapter: 'symbols',
    q: { en: 'When did Parliament pass the Official Languages Act?', fr: 'Quand le Parlement a-t-il adopté la Loi sur les langues officielles?' },
    choices: { en: ['1867', '1969', '1982', '1995'], fr: ['1867', '1969', '1982', '1995'] },
    answer: 1,
    why: {
      en: 'Parliament passed the Official Languages Act in 1969. English and French are Canada’s two official languages.',
      fr: 'Le Parlement a adopté la Loi sur les langues officielles en 1969. Le français et l’anglais sont les deux langues officielles du Canada.',
    },
  },
  {
    id: 's-anthem',
    topic: 'symbols',
    chapter: 'symbols',
    q: { en: 'When was O Canada proclaimed as the national anthem?', fr: 'Quand l’Ô Canada a-t-il été proclamé hymne national?' },
    choices: { en: ['1880', '1927', '1967', '1980'], fr: ['1880', '1927', '1967', '1980'] },
    answer: 3,
    why: {
      en: 'O Canada was proclaimed as the national anthem in 1980. It was first sung in Québec City in 1880.',
      fr: 'L’Ô Canada a été proclamé hymne national en 1980. Il a été chanté pour la première fois à Québec en 1880.',
    },
  },
  {
    id: 's-beaver',
    topic: 'symbols',
    chapter: 'symbols',
    q: { en: 'Which animal appears on Canada’s five-cent coin?', fr: 'Quel animal figure sur la pièce de cinq cents?' },
    choices: { en: ['The loon', 'The caribou', 'The beaver', 'The polar bear'], fr: ['Le huard', 'Le caribou', 'Le castor', 'L’ours polaire'] },
    answer: 2,
    why: {
      en: 'The beaver, a symbol since the days of the Hudson’s Bay Company, appears on the five-cent coin.',
      fr: 'Le castor, symbole depuis l’époque de la Compagnie de la Baie d’Hudson, figure sur la pièce de cinq cents.',
    },
  },
];
