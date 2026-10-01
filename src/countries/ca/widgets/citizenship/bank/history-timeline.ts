/** Practice questions: more history, from the first Europeans to the Second World War (see ../quiz-bank.ts). */
import type { Question } from '../quiz';

export const TIMELINE: Question[] = [
  {
    id: 'h-kanata',
    topic: 'history',
    chapter: 'history',
    q: { en: 'The name Canada comes from the Iroquoian word kanata. What does it mean?', fr: 'Le nom Canada vient du mot iroquois kanata. Que signifie-t-il?' },
    choices: { en: ['Village', 'Great river', 'Cold land', 'Our land'], fr: ['Village', 'Grande rivière', 'Terre froide', 'Notre terre'] },
    answer: 0,
    why: {
      en: 'Jacques Cartier heard two captured guides speak the Iroquoian word kanata, meaning “village”. By the 1550s, the name of Canada began appearing on maps.',
      fr: 'Jacques Cartier a entendu deux guides qu’il avait capturés prononcer le mot iroquois kanata, qui signifie « village ». Dès les années 1550, le nom Canada apparaît sur les cartes.',
    },
  },
  {
    id: 'h-vikings',
    topic: 'history',
    chapter: 'history',
    q: {
      en: 'Who were the first Europeans to reach Labrador and the island of Newfoundland, about 1,000 years ago?',
      fr: 'Quels ont été les premiers Européens à atteindre le Labrador et l’île de Terre-Neuve, il y a environ 1 000 ans?',
    },
    choices: { en: ['The Vikings', 'The French', 'The English', 'The Spanish'], fr: ['Les Vikings', 'Les Français', 'Les Anglais', 'Les Espagnols'] },
    answer: 0,
    why: {
      en: 'The Vikings from Iceland who colonized Greenland 1,000 years ago also reached Labrador and Newfoundland. The remains of their settlement, l’Anse aux Meadows, are a World Heritage site.',
      fr: 'Les Vikings d’Islande, qui ont colonisé le Groenland il y a 1 000 ans, ont aussi atteint le Labrador et Terre-Neuve. Les vestiges de leur établissement, l’Anse aux Meadows, sont un site du patrimoine mondial.',
    },
  },
  {
    id: 'h-cabot',
    topic: 'history',
    chapter: 'history',
    q: { en: 'Who was the first to draw a map of Canada’s East Coast, in 1497?', fr: 'Qui a été le premier à dessiner une carte de la côte Est du Canada, en 1497?' },
    choices: {
      en: ['John Cabot', 'Jacques Cartier', 'Samuel de Champlain', 'Sir Guy Carleton'],
      fr: ['Jean Cabot', 'Jacques Cartier', 'Samuel de Champlain', 'Sir Guy Carleton'],
    },
    answer: 0,
    why: {
      en: 'European exploration began in earnest in 1497 with the expedition of John Cabot, who was the first to draw a map of Canada’s East Coast.',
      fr: 'L’exploration européenne commence véritablement en 1497, avec l’expédition de Jean Cabot, le premier à dessiner une carte de la côte Est du Canada.',
    },
  },
  {
    id: 'h-champlain',
    topic: 'history',
    chapter: 'history',
    q: { en: 'Who built a fortress in 1608 at what is now Québec City?', fr: 'Qui a bâti en 1608 une forteresse sur l’emplacement actuel de la ville de Québec?' },
    choices: {
      en: ['Samuel de Champlain', 'Jacques Cartier', 'The Marquis de Montcalm', 'John Cabot'],
      fr: ['Samuel de Champlain', 'Jacques Cartier', 'Le marquis de Montcalm', 'Jean Cabot'],
    },
    answer: 0,
    why: {
      en: 'In 1608 Samuel de Champlain built a fortress at what is now Québec City.',
      fr: 'En 1608, Samuel de Champlain bâtit une forteresse sur l’emplacement actuel de la ville de Québec.',
    },
  },
  {
    id: 'h-hbc',
    topic: 'history',
    chapter: 'history',
    q: {
      en: 'In 1670, which company was granted exclusive trading rights over the watershed draining into Hudson Bay?',
      fr: 'En 1670, quelle compagnie obtient l’exclusivité du commerce dans le bassin se déversant dans la baie d’Hudson?',
    },
    choices: {
      en: ['The Hudson’s Bay Company', 'The Canadian Pacific Railway', 'The Montreal Stock Exchange', 'The Bank of Canada'],
      fr: ['La Compagnie de la Baie d’Hudson', 'Le Chemin de fer Canadien Pacifique', 'La Bourse de Montréal', 'La Banque du Canada'],
    },
    answer: 0,
    why: {
      en: 'In 1670, King Charles II of England granted the Hudson’s Bay Company exclusive trading rights over the watershed draining into Hudson Bay.',
      fr: 'En 1670, le roi Charles II d’Angleterre accorde à la Compagnie de la Baie d’Hudson l’exclusivité du commerce dans le bassin hydrographique se déversant dans la baie d’Hudson.',
    },
  },
  {
    id: 'h-plains',
    topic: 'history',
    chapter: 'history',
    q: { en: 'What did the Battle of the Plains of Abraham, in 1759, mark?', fr: 'Qu’a marqué la bataille des plaines d’Abraham, en 1759?' },
    choices: {
      en: ['The end of France’s empire in America', 'The start of the War of 1812', 'The birth of the Dominion of Canada', 'The founding of Québec City'],
      fr: ['La fin de l’Empire français en Amérique', 'Le début de la guerre de 1812', 'La naissance du Dominion du Canada', 'La fondation de la ville de Québec'],
    },
    answer: 0,
    why: {
      en: 'In 1759, the British defeated the French in the Battle of the Plains of Abraham at Québec City, marking the end of France’s empire in America.',
      fr: 'En 1759, les Britanniques gagnent la bataille des plaines d’Abraham à Québec, marquant ainsi la fin de l’Empire français en Amérique.',
    },
  },
  {
    id: 'h-quebec-act',
    topic: 'history',
    chapter: 'history',
    q: { en: 'What did the Quebec Act of 1774 do?', fr: 'Qu’a fait l’Acte de Québec de 1774?' },
    choices: {
      en: [
        'It allowed religious freedom for Catholics and restored French civil law',
        'It divided Quebec into Upper Canada and Lower Canada',
        'It created the Dominion of Canada',
        'It gave women the right to vote',
      ],
      fr: [
        'Il a accordé la liberté religieuse aux catholiques et rétabli le droit civil français',
        'Il a divisé le Québec en deux, le Haut-Canada et le Bas-Canada',
        'Il a créé le Dominion du Canada',
        'Il a donné le droit de vote aux femmes',
      ],
    },
    answer: 0,
    why: {
      en: 'The Quebec Act allowed religious freedom for Catholics and permitted them to hold public office. It restored French civil law while maintaining British criminal law.',
      fr: 'L’Acte de Québec accorde la liberté religieuse aux catholiques et leur permet d’exercer des fonctions publiques. Il rétablit le droit civil français tout en maintenant le droit criminel britannique.',
    },
  },
  {
    id: 'h-1791',
    topic: 'history',
    chapter: 'history',
    q: { en: 'What did the Constitutional Act of 1791 do?', fr: 'Qu’a fait l’Acte constitutionnel de 1791?' },
    choices: {
      en: [
        'It divided the Province of Quebec into Upper Canada and Lower Canada',
        'It united Upper Canada and Lower Canada',
        'It abolished slavery throughout the Empire',
        'It made Ottawa the capital',
      ],
      fr: [
        'Il a divisé la Province de Québec en deux, le Haut-Canada et le Bas-Canada',
        'Il a réuni le Haut-Canada et le Bas-Canada',
        'Il a aboli l’esclavage dans tout l’Empire',
        'Il a fait d’Ottawa la capitale',
      ],
    },
    answer: 0,
    why: {
      en: 'The Constitutional Act of 1791 divided the Province of Quebec into Upper Canada (later Ontario) and Lower Canada (later Quebec).',
      fr: 'L’Acte constitutionnel de 1791 divise la Province de Québec en deux entités, le Haut-Canada (aujourd’hui l’Ontario) et le Bas-Canada (aujourd’hui le Québec).',
    },
  },
  {
    id: 'h-1812',
    topic: 'history',
    chapter: 'history',
    q: { en: 'Which country launched an invasion of Canada in June 1812?', fr: 'Quel pays a lancé une invasion du Canada en juin 1812?' },
    choices: { en: ['The United States', 'France', 'Spain', 'Russia'], fr: ['Les États-Unis', 'La France', 'L’Espagne', 'La Russie'] },
    answer: 0,
    why: {
      en: 'Believing it would be easy to conquer Canada, the United States launched an invasion in June 1812. Canadian volunteers and First Nations supported British soldiers in Canada’s defence.',
      fr: 'Convaincus qu’il sera facile de s’emparer du Canada, les États-Unis lancent une invasion en juin 1812. Des volontaires canadiens et des membres des Premières Nations aident les soldats britanniques à défendre le Canada.',
    },
  },
  {
    id: 'h-confed',
    topic: 'history',
    chapter: 'history',
    q: { en: 'Which four provinces formed the Dominion of Canada in 1867?', fr: 'Quelles sont les quatre provinces qui ont formé le Dominion du Canada en 1867?' },
    choices: {
      en: [
        'Ontario, Quebec, Nova Scotia and New Brunswick',
        'Ontario, Quebec, Manitoba and British Columbia',
        'Quebec, Nova Scotia, Prince Edward Island and Newfoundland',
        'Ontario, Quebec, Alberta and Saskatchewan',
      ],
      fr: [
        'L’Ontario, le Québec, la Nouvelle-Écosse et le Nouveau-Brunswick',
        'L’Ontario, le Québec, le Manitoba et la Colombie-Britannique',
        'Le Québec, la Nouvelle-Écosse, l’Île-du-Prince-Édouard et Terre-Neuve',
        'L’Ontario, le Québec, l’Alberta et la Saskatchewan',
      ],
    },
    answer: 0,
    why: {
      en: 'In 1867 the Dominion was made up of Ontario, Quebec, Nova Scotia and New Brunswick. The other provinces and the territories joined later.',
      fr: 'En 1867, le Dominion se compose de l’Ontario, du Québec, de la Nouvelle-Écosse et du Nouveau-Brunswick. Les autres provinces et les territoires s’y joignent plus tard.',
    },
  },
  {
    id: 'h-manitoba',
    topic: 'history',
    chapter: 'history',
    q: {
      en: 'After Louis Riel’s uprising at Fort Garry, which new province did Canada establish in 1870?',
      fr: 'Après la révolte menée par Louis Riel à Fort Garry, quelle nouvelle province le Canada a-t-il établie en 1870?',
    },
    choices: {
      en: ['Manitoba', 'Saskatchewan', 'Alberta', 'British Columbia'],
      fr: ['Le Manitoba', 'La Saskatchewan', 'L’Alberta', 'La Colombie-Britannique'],
    },
    answer: 0,
    why: {
      en: 'Ottawa sent soldiers to retake Fort Garry in 1870. Riel fled to the United States and Canada established a new province: Manitoba.',
      fr: 'En 1870, Ottawa envoie des soldats reprendre Fort Garry. Riel s’enfuit aux États-Unis, et le Canada établit une nouvelle province : le Manitoba.',
    },
  },
  {
    id: 'h-juno',
    topic: 'history',
    chapter: 'history',
    q: { en: 'On D-Day, June 6, 1944, which beach did Canadian troops storm and capture?', fr: 'Le jour J, le 6 juin 1944, quelle plage les soldats canadiens ont-ils prise d’assaut?' },
    choices: {
      en: ['Juno Beach', 'Vimy Ridge', 'Queenston Heights', 'Beaver Dams'],
      fr: ['La plage Juno', 'La crête de Vimy', 'Queenston Heights', 'Beaver Dams'],
    },
    answer: 0,
    why: {
      en: 'In the invasion of Normandy on June 6, 1944, known as D-Day, 15,000 Canadian troops stormed and captured Juno Beach from the German Army.',
      fr: 'Le 6 juin 1944, le « jour J », lors de l’invasion de la Normandie, 15 000 soldats canadiens se lancent à l’assaut de la plage Juno et l’arrachent à l’armée allemande.',
    },
  },
  {
    id: 'h-macphail',
    topic: 'history',
    chapter: 'history',
    q: { en: 'Who became the first woman member of Parliament, in 1921?', fr: 'Qui est devenue la première députée, en 1921?' },
    choices: {
      en: ['Agnes Macphail', 'Thérèse Casgrain', 'Laura Secord', 'Mary Ann Shadd Cary'],
      fr: ['Agnes Macphail', 'Thérèse Casgrain', 'Laura Secord', 'Mary Ann Shadd Cary'],
    },
    answer: 0,
    why: {
      en: 'In 1921 Agnes Macphail, a farmer and teacher, became the first woman MP.',
      fr: 'En 1921, Agnes Macphail, fermière et enseignante, devient la première députée.',
    },
  },
];
