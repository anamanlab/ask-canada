/** Practice questions: government, elections and justice (see ../quiz-bank.ts for how the bank is written and used). */
import { TF, type Question } from '../quiz';

export const GOVERNMENT: Question[] = [
  {
    id: 'g-three-facts',
    topic: 'government',
    chapter: 'govern',
    q: { en: 'What are the three key facts about Canada’s system of government?', fr: 'Quels sont les trois faits principaux du système de gouvernement du Canada?' },
    choices: {
      en: [
        'A federal state, a parliamentary democracy and a constitutional monarchy',
        'A republic, a federation and a direct democracy',
        'A unitary state, a monarchy and a dictatorship',
        'A confederacy, a presidential system and an empire',
      ],
      fr: [
        'Un État fédéral, une démocratie parlementaire et une monarchie constitutionnelle',
        'Une république, une fédération et une démocratie directe',
        'Un État unitaire, une monarchie et une dictature',
        'Une confédération, un régime présidentiel et un empire',
      ],
    },
    answer: 0,
    why: {
      en: 'Canada is a federal state, a parliamentary democracy and a constitutional monarchy.',
      fr: 'Le Canada est un État fédéral, une démocratie parlementaire et une monarchie constitutionnelle.',
    },
  },
  {
    id: 'g-parliament',
    topic: 'government',
    chapter: 'govern',
    q: { en: 'What are the three parts of Parliament?', fr: 'Quelles sont les trois parties du Parlement?' },
    choices: {
      en: [
        'The Prime Minister, Cabinet and the courts',
        'The Sovereign, the Senate and the House of Commons',
        'The Governor General, the premiers and the mayors',
        'The House of Commons, the Supreme Court and the police',
      ],
      fr: [
        'Le premier ministre, le Cabinet et les tribunaux',
        'Le souverain, le Sénat et la Chambre des communes',
        'Le gouverneur général, les premiers ministres provinciaux et les maires',
        'La Chambre des communes, la Cour suprême et la police',
      ],
    },
    answer: 1,
    why: {
      en: 'Parliament has three parts: the Sovereign (Queen or King), the Senate and the House of Commons.',
      fr: 'Le Parlement comprend trois parties : le souverain (la reine ou le roi), le Sénat et la Chambre des communes.',
    },
  },
  {
    id: 'g-mps',
    topic: 'government',
    chapter: 'elections',
    q: { en: 'How are members of Parliament (MPs) chosen?', fr: 'Comment les députés fédéraux sont-ils choisis?' },
    choices: {
      en: ['Appointed by the Prime Minister', 'Chosen by the provincial premiers', 'Elected by voters in their electoral district (riding)', 'Appointed by the Governor General'],
      fr: ['Ils sont nommés par le premier ministre', 'Ils sont choisis par les premiers ministres des provinces', 'Ils sont élus par les électeurs de leur circonscription', 'Ils sont nommés par le gouverneur général'],
    },
    answer: 2,
    why: {
      en: 'People in each electoral district vote for the candidate of their choice. The candidate with the most votes becomes the MP.',
      fr: 'Dans chaque circonscription, les gens votent pour le candidat de leur choix. Le candidat qui obtient le plus de votes devient le député.',
    },
  },
  {
    id: 'g-senate',
    topic: 'government',
    chapter: 'govern',
    q: { en: 'How do people become senators?', fr: 'Comment devient-on sénateur?' },
    choices: {
      en: [
        'They are elected every four years',
        'They are appointed by the Governor General on the advice of the Prime Minister',
        'They are chosen by the House of Commons',
        'They inherit the seat',
      ],
      fr: [
        'Ils sont élus tous les quatre ans',
        'Ils sont nommés par le gouverneur général sur recommandation du premier ministre',
        'Ils sont choisis par la Chambre des communes',
        'Ils héritent de leur siège',
      ],
    },
    answer: 1,
    why: {
      en: 'Senators are appointed by the Governor General on the advice of the Prime Minister and serve until age 75.',
      fr: 'Les sénateurs sont nommés par le gouverneur général sur recommandation du premier ministre et siègent jusqu’à 75 ans.',
    },
  },
  {
    id: 'g-federal',
    topic: 'government',
    chapter: 'govern',
    q: { en: 'Which of these is a federal government responsibility?', fr: 'Laquelle de ces responsabilités relève du gouvernement fédéral?' },
    choices: { en: ['Education', 'Highways', 'Defence', 'Municipal government'], fr: ['L’éducation', 'Les routes', 'La défense', 'L’administration municipale'] },
    answer: 2,
    why: {
      en: 'The federal government handles national and international matters such as defence, foreign policy, currency, criminal law and citizenship. Education and highways are provincial.',
      fr: 'Le gouvernement fédéral s’occupe des affaires nationales et internationales, comme la défense, la politique étrangère, la monnaie, le droit criminel et la citoyenneté. L’éducation et les routes relèvent des provinces.',
    },
  },
  {
    id: 'g-head-gov',
    topic: 'government',
    chapter: 'govern',
    q: { en: 'Who is the head of government in Canada?', fr: 'Qui est le chef du gouvernement au Canada?' },
    choices: {
      en: ['The Governor General', 'The Prime Minister', 'The Sovereign', 'The Chief Justice'],
      fr: ['Le gouverneur général', 'Le premier ministre', 'Le souverain', 'Le juge en chef'],
    },
    answer: 1,
    why: {
      en: 'The Sovereign is the head of state. The Prime Minister is the head of government and directs the governing of the country.',
      fr: 'Le souverain est le chef d’État. Le premier ministre est le chef du gouvernement et dirige réellement le pays.',
    },
  },
  {
    id: 'g-lg',
    topic: 'government',
    chapter: 'govern',
    q: { en: 'Who represents the Sovereign in each province?', fr: 'Qui représente le souverain dans chaque province?' },
    choices: {
      en: ['The Premier', 'The Lieutenant Governor', 'The Speaker', 'The Commissioner'],
      fr: ['Le premier ministre de la province', 'Le lieutenant-gouverneur', 'Le président de l’assemblée', 'Le commissaire'],
    },
    answer: 1,
    why: {
      en: 'In each of the ten provinces, the Sovereign is represented by the Lieutenant Governor. In the territories, a Commissioner represents the federal government.',
      fr: 'Dans chacune des dix provinces, le souverain est représenté par le lieutenant-gouverneur. Dans les territoires, un commissaire représente le gouvernement fédéral.',
    },
  },
  {
    id: 'g-assent',
    topic: 'government',
    chapter: 'govern',
    q: { en: 'What is the last step before a bill becomes law?', fr: 'Quelle est la dernière étape avant qu’un projet de loi devienne une loi?' },
    choices: {
      en: ['Third reading', 'Committee stage', 'Royal assent', 'First reading'],
      fr: ['La troisième lecture', 'L’étude en comité', 'La sanction royale', 'La première lecture'],
    },
    answer: 2,
    why: {
      en: 'A bill must pass both the House of Commons and the Senate, then receive royal assent, before it becomes law.',
      fr: 'Un projet de loi doit être adopté par la Chambre des communes et le Sénat, puis recevoir la sanction royale, avant de devenir une loi.',
    },
  },
  {
    id: 'g-vote',
    topic: 'government',
    chapter: 'elections',
    q: { en: 'Who can vote in a federal election?', fr: 'Qui peut voter à une élection fédérale?' },
    choices: {
      en: [
        'Anyone living in Canada',
        'Canadian citizens 18 or older on voting day who are on the voters’ list',
        'Permanent residents who have lived here 3 years',
        'Canadian citizens 21 or older',
      ],
      fr: [
        'Toute personne qui vit au Canada',
        'Les citoyens canadiens de 18 ans ou plus le jour du scrutin qui sont inscrits sur la liste électorale',
        'Les résidents permanents qui vivent ici depuis 3 ans',
        'Les citoyens canadiens de 21 ans ou plus',
      ],
    },
    answer: 1,
    why: {
      en: 'To vote in a federal election you must be a Canadian citizen, at least 18 on voting day, and on the voters’ list. You can be added even on election day.',
      fr: 'Pour voter à une élection fédérale, vous devez être citoyen canadien, avoir au moins 18 ans le jour du scrutin et être inscrit sur la liste électorale. On peut s’inscrire même le jour de l’élection.',
    },
  },
  {
    id: 'g-secret',
    topic: 'government',
    chapter: 'elections',
    q: { en: 'True or false? Your employer can require you to tell them how you voted.', fr: 'Vrai ou faux? Votre employeur peut exiger que vous lui disiez pour qui vous avez voté.' },
    choices: TF,
    answer: 1,
    why: {
      en: 'Canadian law secures the right to a secret ballot. No one, including your family or your employer, can insist that you tell them how you voted.',
      fr: 'La loi canadienne garantit le droit au scrutin secret. Personne, pas même votre famille ou votre employeur, ne peut exiger que vous révéliez votre vote.',
    },
  },
  {
    id: 'g-supreme',
    topic: 'government',
    chapter: 'justice',
    q: { en: 'What is the highest court in Canada?', fr: 'Quel est le plus haut tribunal du Canada?' },
    choices: {
      en: ['The Federal Court', 'The Supreme Court of Canada', 'The Court of Appeal', 'The Senate'],
      fr: ['La Cour fédérale', 'La Cour suprême du Canada', 'La Cour d’appel', 'Le Sénat'],
    },
    answer: 1,
    why: {
      en: 'The Supreme Court of Canada is the country’s highest court. The Federal Court deals with matters concerning the federal government.',
      fr: 'La Cour suprême du Canada est le plus haut tribunal du pays. La Cour fédérale traite des affaires concernant le gouvernement fédéral.',
    },
  },
  {
    id: 'g-police',
    topic: 'government',
    chapter: 'justice',
    q: { en: 'True or false? In Canada, you can question the police about their service or conduct.', fr: 'Vrai ou faux? Au Canada, vous pouvez vous plaindre des services ou de la conduite de la police.' },
    choices: TF,
    answer: 0,
    why: {
      en: 'You can question the police about their service or conduct. Almost all police forces have a process to bring your concerns forward.',
      fr: 'Vous pouvez remettre en question les services ou la conduite de la police. Presque tous les corps policiers ont un processus pour recevoir vos plaintes.',
    },
  },
  {
    id: 'g-rcmp',
    topic: 'government',
    chapter: 'justice',
    q: { en: 'Which police force enforces federal laws throughout Canada?', fr: 'Quel corps policier fait appliquer les lois fédérales partout au Canada?' },
    choices: {
      en: ['The Ontario Provincial Police', 'The Royal Canadian Mounted Police (RCMP)', 'The Sûreté du Québec', 'Municipal police'],
      fr: ['La Police provinciale de l’Ontario', 'La Gendarmerie royale du Canada (GRC)', 'La Sûreté du Québec', 'La police municipale'],
    },
    answer: 1,
    why: {
      en: 'The RCMP enforces federal laws across Canada and serves as the provincial police everywhere except Ontario and Quebec.',
      fr: 'La GRC fait appliquer les lois fédérales partout au Canada et agit comme police provinciale partout sauf en Ontario et au Québec.',
    },
  },
];
