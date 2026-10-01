/** Practice questions: geography and economy (see ../quiz-bank.ts for how the bank is written and used). */
import type { Question } from '../quiz';

export const GEOGRAPHY: Question[] = [
  {
    id: 'geo-oceans',
    topic: 'geography',
    chapter: 'regions',
    q: { en: 'Which three oceans border Canada?', fr: 'Quels sont les trois océans qui bordent le Canada?' },
    choices: {
      en: ['Pacific, Atlantic and Arctic', 'Pacific, Indian and Arctic', 'Atlantic, Indian and Southern', 'Arctic, Southern and Pacific'],
      fr: ['Pacifique, Atlantique et Arctique', 'Pacifique, Indien et Arctique', 'Atlantique, Indien et Austral', 'Arctique, Austral et Pacifique'],
    },
    answer: 0,
    why: {
      en: 'Three oceans line Canada’s frontiers: the Pacific in the west, the Atlantic in the east and the Arctic to the north.',
      fr: 'Trois océans bordent les frontières du Canada : le Pacifique à l’ouest, l’Atlantique à l’est et l’Arctique au nord.',
    },
  },
  {
    id: 'geo-atlantic',
    topic: 'geography',
    chapter: 'regions',
    q: { en: 'Which provinces are the Atlantic Provinces?', fr: 'Quelles provinces forment les provinces de l’Atlantique?' },
    choices: {
      en: [
        'Newfoundland and Labrador, Prince Edward Island, Nova Scotia and New Brunswick',
        'Quebec, Ontario, Nova Scotia and New Brunswick',
        'Nova Scotia, New Brunswick and Quebec',
        'Newfoundland and Labrador, Quebec and Nunavut',
      ],
      fr: [
        'Terre-Neuve-et-Labrador, l’Île-du-Prince-Édouard, la Nouvelle-Écosse et le Nouveau-Brunswick',
        'Le Québec, l’Ontario, la Nouvelle-Écosse et le Nouveau-Brunswick',
        'La Nouvelle-Écosse, le Nouveau-Brunswick et le Québec',
        'Terre-Neuve-et-Labrador, le Québec et le Nunavut',
      ],
    },
    answer: 0,
    why: {
      en: 'The Atlantic Provinces are Newfoundland and Labrador, Prince Edward Island, Nova Scotia and New Brunswick.',
      fr: 'Les provinces de l’Atlantique sont Terre-Neuve-et-Labrador, l’Île-du-Prince-Édouard, la Nouvelle-Écosse et le Nouveau-Brunswick.',
    },
  },
  {
    id: 'geo-prairies',
    topic: 'geography',
    chapter: 'regions',
    q: { en: 'Which provinces are the Prairie Provinces?', fr: 'Quelles provinces forment les provinces des Prairies?' },
    choices: {
      en: ['Manitoba, Saskatchewan and Alberta', 'Ontario, Manitoba and Saskatchewan', 'Alberta and British Columbia', 'Saskatchewan, Alberta and Yukon'],
      fr: ['Le Manitoba, la Saskatchewan et l’Alberta', 'L’Ontario, le Manitoba et la Saskatchewan', 'L’Alberta et la Colombie-Britannique', 'La Saskatchewan, l’Alberta et le Yukon'],
    },
    answer: 0,
    why: {
      en: 'Manitoba, Saskatchewan and Alberta are the Prairie Provinces, rich in energy resources and fertile farmland.',
      fr: 'Le Manitoba, la Saskatchewan et l’Alberta forment les provinces des Prairies, riches en ressources énergétiques et en terres fertiles.',
    },
  },
  {
    id: 'geo-bilingual',
    topic: 'geography',
    chapter: 'regions',
    q: { en: 'Which is the only officially bilingual province?', fr: 'Quelle est la seule province officiellement bilingue?' },
    choices: { en: ['Quebec', 'Ontario', 'New Brunswick', 'Manitoba'], fr: ['Le Québec', 'L’Ontario', 'Le Nouveau-Brunswick', 'Le Manitoba'] },
    answer: 2,
    why: {
      en: 'New Brunswick is the only officially bilingual province. About one-third of its people live and work in French.',
      fr: 'Le Nouveau-Brunswick est la seule province officiellement bilingue. Environ le tiers de sa population vit et travaille en français.',
    },
  },
  {
    id: 'geo-ottawa',
    topic: 'geography',
    chapter: 'regions',
    q: { en: 'Who chose Ottawa as Canada’s capital in 1857?', fr: 'Qui a choisi Ottawa comme capitale du Canada en 1857?' },
    choices: {
      en: ['Sir John A. Macdonald', 'Queen Victoria', 'Lord Durham', 'Samuel de Champlain'],
      fr: ['Sir John A. Macdonald', 'La reine Victoria', 'Lord Durham', 'Samuel de Champlain'],
    },
    answer: 1,
    why: {
      en: 'Ottawa, on the Ottawa River, was chosen as the capital in 1857 by Queen Victoria.',
      fr: 'Située sur la rivière des Outaouais, Ottawa a été choisie comme capitale en 1857 par la reine Victoria.',
    },
  },
  {
    id: 'geo-nunavut',
    topic: 'geography',
    chapter: 'regions',
    q: { en: 'Nunavut means “our land” in Inuktitut. When was it created?', fr: 'Nunavut signifie « notre terre » en inuktitut. Quand a-t-il été créé?' },
    choices: { en: ['1867', '1949', '1982', '1999'], fr: ['1867', '1949', '1982', '1999'] },
    answer: 3,
    why: {
      en: 'Nunavut was established in 1999 from the eastern part of the Northwest Territories.',
      fr: 'Le Nunavut a été créé en 1999 à partir de la partie est des Territoires du Nord-Ouest.',
    },
  },
  {
    id: 'geo-count',
    topic: 'geography',
    chapter: 'regions',
    q: { en: 'How many provinces and territories does Canada have?', fr: 'Combien de provinces et de territoires le Canada compte-t-il?' },
    choices: {
      en: ['10 provinces and 3 territories', '9 provinces and 4 territories', '12 provinces and 1 territory', '8 provinces and 5 territories'],
      fr: ['10 provinces et 3 territoires', '9 provinces et 4 territoires', '12 provinces et 1 territoire', '8 provinces et 5 territoires'],
    },
    answer: 0,
    why: {
      en: 'Canada has ten provinces and three territories, in five regions.',
      fr: 'Le Canada compte dix provinces et trois territoires, répartis en cinq régions.',
    },
  },
  {
    id: 'geo-trade',
    topic: 'geography',
    chapter: 'economy',
    q: { en: 'Who is Canada’s largest trading partner?', fr: 'Quel est le plus important partenaire commercial du Canada?' },
    choices: { en: ['China', 'The United Kingdom', 'The United States', 'Mexico'], fr: ['La Chine', 'Le Royaume-Uni', 'Les États-Unis', 'Le Mexique'] },
    answer: 2,
    why: {
      en: 'Canada and the United States are each other’s largest trading partner.',
      fr: 'Le Canada et les États-Unis sont, l’un pour l’autre, le plus important partenaire commercial.',
    },
  },
  {
    id: 'geo-industries',
    topic: 'geography',
    chapter: 'economy',
    q: { en: 'What are the three main types of industries in Canada’s economy?', fr: 'Quels sont les trois grands secteurs de l’économie canadienne?' },
    choices: {
      en: ['Service, manufacturing and natural resources', 'Banking, tourism and fishing', 'Mining, farming and forestry', 'Technology, film and retail'],
      fr: ['Les services, la fabrication et les ressources naturelles', 'Les banques, le tourisme et la pêche', 'Les mines, l’agriculture et la foresterie', 'La technologie, le cinéma et le commerce de détail'],
    },
    answer: 0,
    why: {
      en: 'Canada’s economy has three main types of industries: service, manufacturing and natural resources. Over 75% of working Canadians work in services.',
      fr: 'L’économie canadienne compte trois grands secteurs : les services, la fabrication et les ressources naturelles. Plus de 75 % des travailleurs canadiens occupent un emploi dans les services.',
    },
  },
];
