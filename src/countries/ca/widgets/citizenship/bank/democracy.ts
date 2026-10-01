/** Practice questions: more on government, elections and justice (see ../quiz-bank.ts). */
import type { Question } from '../quiz';

export const DEMOCRACY: Question[] = [
  {
    id: 'g-head-state',
    topic: 'government',
    chapter: 'govern',
    q: { en: 'Who is Canada’s head of state?', fr: 'Qui est le chef d’État du Canada?' },
    choices: {
      en: ['The Sovereign (King or Queen)', 'The Prime Minister', 'The Speaker of the House of Commons', 'The Chief Justice of Canada'],
      fr: ['Le souverain (roi ou reine)', 'Le premier ministre', 'Le président de la Chambre des communes', 'Le juge en chef du Canada'],
    },
    answer: 0,
    why: {
      en: 'As a constitutional monarchy, Canada’s head of state is a hereditary Sovereign (Queen or King), who reigns in accordance with the Constitution. The Prime Minister is the head of government.',
      fr: 'Le Canada étant une monarchie constitutionnelle, son chef d’État est un souverain héréditaire (reine ou roi), qui règne conformément à la Constitution. Le premier ministre est le chef du gouvernement.',
    },
  },
  {
    id: 'g-gg',
    topic: 'government',
    chapter: 'govern',
    q: { en: 'How is the Governor General chosen?', fr: 'Comment le gouverneur général est-il choisi?' },
    choices: {
      en: ['Appointed by the Sovereign on the advice of the Prime Minister', 'Elected by Canadians every five years', 'Chosen by a vote of the Senate', 'Appointed by the Supreme Court of Canada'],
      fr: ['Il est nommé par le souverain sur recommandation du premier ministre', 'Il est élu par les Canadiens tous les cinq ans', 'Il est choisi par un vote du Sénat', 'Il est nommé par la Cour suprême du Canada'],
    },
    answer: 0,
    why: {
      en: 'The Sovereign is represented in Canada by the Governor General, who is appointed by the Sovereign on the advice of the Prime Minister, usually for five years.',
      fr: 'Le souverain est représenté au Canada par le gouverneur général, qui est nommé par le souverain sur recommandation du premier ministre, habituellement pour cinq ans.',
    },
  },
  {
    id: 'g-provincial',
    topic: 'government',
    chapter: 'govern',
    q: { en: 'Which of these is a provincial responsibility?', fr: 'Lequel de ces domaines relève des provinces?' },
    choices: {
      en: ['Education', 'National defence', 'Currency', 'Citizenship'],
      fr: ['L’éducation', 'La défense nationale', 'La monnaie', 'La citoyenneté'],
    },
    answer: 0,
    why: {
      en: 'The provinces are responsible for municipal government, education, health, natural resources, property and civil rights, and highways.',
      fr: 'Les provinces sont responsables des municipalités, de l’éducation, de la santé, des ressources naturelles, de la propriété et des droits civils ainsi que des autoroutes.',
    },
  },
  {
    id: 'g-cabinet',
    topic: 'government',
    chapter: 'elections',
    q: { en: 'Who chooses the Cabinet ministers?', fr: 'Qui choisit les ministres du Cabinet?' },
    choices: {
      en: ['The Prime Minister', 'The voters, in a separate election', 'The Senate', 'The Leader of the Opposition'],
      fr: ['Le premier ministre', 'Les électeurs, lors d’une élection distincte', 'Le Sénat', 'Le chef de l’opposition'],
    },
    answer: 0,
    why: {
      en: 'The Prime Minister chooses the ministers of the Crown, most of them from among members of the House of Commons. Together they are called the Cabinet.',
      fr: 'Le premier ministre choisit les ministres de la Couronne, la plupart d’entre eux parmi les députés de la Chambre des communes. Ensemble, ils forment le Cabinet.',
    },
  },
  {
    id: 'g-election-date',
    topic: 'government',
    chapter: 'elections',
    q: {
      en: 'Under legislation passed by Parliament, when must federal elections be held?',
      fr: 'D’après une loi adoptée par le Parlement, quand les élections fédérales doivent-elles avoir lieu?',
    },
    choices: {
      en: [
        'On the third Monday in October, every four years after the last general election',
        'On July 1, every five years',
        'On the first Monday in May, every two years',
        'Whenever the Senate decides',
      ],
      fr: [
        'Le troisième lundi d’octobre, tous les quatre ans après les dernières élections générales',
        'Le 1er juillet, tous les cinq ans',
        'Le premier lundi de mai, tous les deux ans',
        'Quand le Sénat le décide',
      ],
    },
    answer: 0,
    why: {
      en: 'Federal elections must be held on the third Monday in October every four years following the most recent general election. The Prime Minister may ask the Governor General to call an earlier election.',
      fr: 'Des élections fédérales doivent avoir lieu le troisième lundi d’octobre tous les quatre ans après les dernières élections générales. Le premier ministre peut demander au gouverneur général de déclencher une élection plus tôt.',
    },
  },
  {
    id: 'g-opposition',
    topic: 'government',
    chapter: 'elections',
    q: {
      en: 'What is the opposition party with the most members of the House of Commons called?',
      fr: 'Comment appelle-t-on le parti d’opposition qui a le plus grand nombre de députés à la Chambre des communes?',
    },
    choices: {
      en: ['The Official Opposition', 'The Cabinet', 'The Senate', 'The party in power'],
      fr: ['L’opposition officielle', 'Le Cabinet', 'Le Sénat', 'Le parti au pouvoir'],
    },
    answer: 0,
    why: {
      en: 'The opposition party with the most members of the House of Commons is the Official Opposition. Its role is to peacefully oppose or try to improve government proposals.',
      fr: 'Le parti d’opposition qui a le plus grand nombre de députés à la Chambre des communes est l’opposition officielle. Son rôle est de s’opposer pacifiquement aux propositions du gouvernement ou d’essayer de les améliorer.',
    },
  },
  {
    id: 'g-voter-card',
    topic: 'government',
    chapter: 'elections',
    q: {
      en: 'Once an election has been called, what does Elections Canada mail to each elector in the National Register of Electors?',
      fr: 'Quand une élection est déclenchée, qu’est-ce qu’Élections Canada envoie par la poste à chaque personne inscrite au Registre national des électeurs?',
    },
    choices: {
      en: ['A voter information card', 'A ballot to fill in at home', 'A passport application', 'A list of the candidates’ addresses'],
      fr: ['Une carte d’information de l’électeur', 'Un bulletin de vote à remplir à la maison', 'Une demande de passeport', 'Une liste des adresses des candidats'],
    },
    answer: 0,
    why: {
      en: 'Elections Canada mails a voter information card to each elector in the National Register of Electors. It lists when and where you vote.',
      fr: 'Élections Canada envoie par la poste une carte d’information de l’électeur à chaque personne inscrite au Registre national des électeurs. La carte indique quand et à quel endroit voter.',
    },
  },
  {
    id: 'g-innocent',
    topic: 'government',
    chapter: 'justice',
    q: { en: 'What does the presumption of innocence mean?', fr: 'Que signifie la présomption d’innocence?' },
    choices: {
      en: ['Everyone is innocent until proven guilty', 'The accused must prove they are innocent', 'Only citizens have the right to a trial', 'The police decide who is guilty'],
      fr: ['Chacun est innocent jusqu’à preuve du contraire', 'L’accusé doit prouver son innocence', 'Seuls les citoyens ont droit à un procès', 'La police décide qui est coupable'],
    },
    answer: 0,
    why: {
      en: 'Canada’s judicial system is founded on the presumption of innocence in criminal matters, meaning everyone is innocent until proven guilty.',
      fr: 'Le système judiciaire du Canada est fondé sur la présomption d’innocence dans les affaires criminelles, ce qui veut dire que chacun est innocent jusqu’à preuve du contraire.',
    },
  },
];
