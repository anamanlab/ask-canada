/** Practice questions: history (see ../quiz-bank.ts for how the bank is written and used). */
import type { Question } from '../quiz';

export const HISTORY: Question[] = [
  {
    id: 'h-1867',
    topic: 'history',
    chapter: 'history',
    q: { en: 'When was the Dominion of Canada officially born?', fr: 'Quand le Dominion du Canada est-il officiellement né?' },
    choices: { en: ['July 1, 1867', 'July 1, 1982', 'November 11, 1918', 'April 9, 1917'], fr: ['Le 1er juillet 1867', 'Le 1er juillet 1982', 'Le 11 novembre 1918', 'Le 9 avril 1917'] },
    answer: 0,
    why: {
      en: 'The British North America Act was passed in 1867, and the Dominion of Canada was officially born on July 1, 1867.',
      fr: 'L’Acte de l’Amérique du Nord britannique a été adopté en 1867, et le Dominion du Canada est officiellement né le 1er juillet 1867.',
    },
  },
  {
    id: 'h-first-pm',
    topic: 'history',
    chapter: 'history',
    q: { en: 'Who was Canada’s first Prime Minister?', fr: 'Qui a été le premier premier ministre du Canada?' },
    choices: {
      en: ['Sir Wilfrid Laurier', 'Sir John A. Macdonald', 'Sir George-Étienne Cartier', 'Sir Robert Borden'],
      fr: ['Sir Wilfrid Laurier', 'Sir John A. Macdonald', 'Sir George-Étienne Cartier', 'Sir Robert Borden'],
    },
    answer: 1,
    why: {
      en: 'In 1867, Sir John Alexander Macdonald, a Father of Confederation, became Canada’s first Prime Minister.',
      fr: 'En 1867, sir John Alexander Macdonald, un Père de la Confédération, est devenu le premier premier ministre du Canada.',
    },
  },
  {
    id: 'h-cpr',
    topic: 'history',
    chapter: 'history',
    q: { en: 'The last spike of the Canadian Pacific Railway, a symbol of unity, was driven in which year?', fr: 'En quelle année a-t-on posé le dernier crampon du Chemin de fer Canadien Pacifique, symbole d’unité?' },
    choices: { en: ['1867', '1885', '1905', '1931'], fr: ['1867', '1885', '1905', '1931'] },
    answer: 1,
    why: {
      en: 'On November 7, 1885, Donald Smith (Lord Strathcona) drove the last spike of the CPR, linking the country from sea to sea.',
      fr: 'Le 7 novembre 1885, Donald Smith (lord Strathcona), administrateur du Chemin de fer Canadien Pacifique, a posé le dernier crampon, reliant le pays d’un océan à l’autre.',
    },
  },
  {
    id: 'h-vimy',
    topic: 'history',
    chapter: 'history',
    q: { en: 'During which war did the Canadian Corps capture Vimy Ridge?', fr: 'Au cours de quelle guerre le Corps canadien a-t-il pris la crête de Vimy?' },
    choices: {
      en: ['The War of 1812', 'The First World War', 'The Second World War', 'The Korean War'],
      fr: ['La guerre de 1812', 'La Première Guerre mondiale', 'La Seconde Guerre mondiale', 'La guerre de Corée'],
    },
    answer: 1,
    why: {
      en: 'The Canadian Corps captured Vimy Ridge in April 1917, during the First World War. April 9 is Vimy Day.',
      fr: 'Le Corps canadien a pris la crête de Vimy en avril 1917, pendant la Première Guerre mondiale. Le 9 avril est le jour de Vimy.',
    },
  },
  {
    id: 'h-women',
    topic: 'history',
    chapter: 'history',
    q: { en: 'Which was the first province to give women the right to vote?', fr: 'Quelle a été la première province à accorder le droit de vote aux femmes?' },
    choices: { en: ['Ontario', 'Quebec', 'Manitoba', 'British Columbia'], fr: ['L’Ontario', 'Le Québec', 'Le Manitoba', 'La Colombie-Britannique'] },
    answer: 2,
    why: {
      en: 'In 1916, Manitoba became the first province to grant voting rights to women.',
      fr: 'En 1916, le Manitoba est devenu la première province à accorder le droit de vote aux femmes.',
    },
  },
  {
    id: 'h-poppy',
    topic: 'history',
    chapter: 'history',
    q: { en: 'Why do Canadians wear a red poppy on Remembrance Day (November 11)?', fr: 'Pourquoi les Canadiens portent-ils un coquelicot rouge le jour du Souvenir (11 novembre)?' },
    choices: {
      en: [
        'To celebrate Confederation',
        'To remember those who served and died in wars up to the present day',
        'To mark the start of winter',
        'To honour former prime ministers',
      ],
      fr: [
        'Pour célébrer la Confédération',
        'Pour honorer ceux qui ont servi et qui sont morts dans les guerres jusqu’à aujourd’hui',
        'Pour souligner le début de l’hiver',
        'Pour rendre hommage aux anciens premiers ministres',
      ],
    },
    answer: 1,
    why: {
      en: 'On November 11, Canadians wear the red poppy and observe a moment of silence to remember the sacrifices of veterans and the fallen in all wars.',
      fr: 'Le 11 novembre, les Canadiens portent le coquelicot rouge et observent une minute de silence en mémoire des anciens combattants et des soldats tombés dans toutes les guerres.',
    },
  },
  {
    id: 'h-lafontaine',
    topic: 'history',
    chapter: 'history',
    q: { en: 'Who became the first leader of a responsible government in the Canadas?', fr: 'Qui est devenu le premier chef d’un gouvernement responsable des deux Canadas?' },
    choices: {
      en: ['Sir Louis-Hippolyte La Fontaine', 'Lord Durham', 'Joseph Howe', 'Sir John A. Macdonald'],
      fr: ['Sir Louis-Hippolyte La Fontaine', 'Lord Durham', 'Joseph Howe', 'Sir John A. Macdonald'],
    },
    answer: 0,
    why: {
      en: 'La Fontaine, a champion of democracy and French language rights, became the first leader of a responsible government in the Canadas.',
      fr: 'La Fontaine, défenseur de la démocratie et des droits linguistiques des francophones, est devenu le premier chef d’un gouvernement responsable des deux Canadas.',
    },
  },
  {
    id: 'h-railroad',
    topic: 'history',
    chapter: 'history',
    q: { en: 'What was the Underground Railroad?', fr: 'Qu’était le « chemin de fer clandestin »?' },
    choices: {
      en: [
        'The first subway in Toronto',
        'An anti-slavery network that helped thousands of enslaved people reach Canada',
        'A secret railway built during the First World War',
        'A network of fur-trading routes',
      ],
      fr: [
        'Le premier métro de Toronto',
        'Un réseau antiesclavagiste qui a aidé des milliers d’esclaves à gagner le Canada',
        'Un chemin de fer secret construit pendant la Première Guerre mondiale',
        'Un réseau de routes de traite des fourrures',
      ],
    },
    answer: 1,
    why: {
      en: 'Thousands of slaves escaped from the United States, followed “the North Star” and settled in Canada via the Underground Railroad.',
      fr: 'Des milliers d’esclaves ont fui les États-Unis en suivant « l’étoile du Nord » et se sont établis au Canada grâce au chemin de fer clandestin.',
    },
  },
];
