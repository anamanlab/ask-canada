/** Practice questions: more on the regions, provinces, territories and the economy (see ../quiz-bank.ts). */
import type { Question } from '../quiz';

export const PROVINCES: Question[] = [
  {
    id: 'geo-size',
    topic: 'geography',
    chapter: 'regions',
    q: { en: 'Where does Canada rank among the largest countries on earth?', fr: 'À quel rang le Canada se classe-t-il parmi les pays du monde pour son étendue?' },
    choices: { en: ['Largest', 'Second largest', 'Third largest', 'Fifth largest'], fr: ['Premier', 'Deuxième', 'Troisième', 'Cinquième'] },
    answer: 1,
    why: {
      en: 'Canada is the second largest country on earth: 10 million square kilometres.',
      fr: 'Le Canada est le deuxième pays du monde en étendue : son territoire couvre près de 10 millions de kilomètres carrés.',
    },
  },
  {
    id: 'geo-regions',
    topic: 'geography',
    chapter: 'regions',
    q: { en: 'How many distinct regions does Canada include?', fr: 'Combien de régions distinctes le Canada compte-t-il?' },
    choices: { en: ['Three', 'Five', 'Ten', 'Thirteen'], fr: ['Trois', 'Cinq', 'Dix', 'Treize'] },
    answer: 1,
    why: {
      en: 'Canada includes five distinct regions: the Atlantic Provinces, Central Canada, the Prairie Provinces, the West Coast and the Northern Territories.',
      fr: 'Le Canada compte cinq régions distinctes : les provinces de l’Atlantique, le centre du Canada, les provinces des Prairies, la côte Ouest et les territoires du Nord.',
    },
  },
  {
    id: 'geo-pei',
    topic: 'geography',
    chapter: 'regions',
    q: { en: 'Which is the smallest province, known as the birthplace of Confederation?', fr: 'Quelle est la plus petite des provinces, berceau de la Confédération?' },
    choices: {
      en: ['Prince Edward Island', 'Nova Scotia', 'New Brunswick', 'Newfoundland and Labrador'],
      fr: ['L’Île-du-Prince-Édouard', 'La Nouvelle-Écosse', 'Le Nouveau-Brunswick', 'Terre-Neuve-et-Labrador'],
    },
    answer: 0,
    why: {
      en: 'Prince Edward Island is the smallest province. It is the birthplace of Confederation, connected to mainland Canada by the Confederation Bridge.',
      fr: 'L’Île-du-Prince-Édouard est la plus petite des provinces. Berceau de la Confédération, elle est reliée à la terre ferme par le pont de la Confédération.',
    },
  },
  {
    id: 'geo-nl',
    topic: 'geography',
    chapter: 'regions',
    q: {
      en: 'Which province is the most easterly point in North America and has its own time zone?',
      fr: 'Quelle province, à l’extrême est de l’Amérique du Nord, occupe son propre fuseau horaire?',
    },
    choices: {
      en: ['Newfoundland and Labrador', 'Nova Scotia', 'Prince Edward Island', 'Quebec'],
      fr: ['Terre-Neuve-et-Labrador', 'La Nouvelle-Écosse', 'L’Île-du-Prince-Édouard', 'Le Québec'],
    },
    answer: 0,
    why: {
      en: 'Newfoundland and Labrador is the most easterly point in North America and has its own time zone.',
      fr: 'Terre-Neuve-et-Labrador, à l’extrême est de l’Amérique du Nord, occupe son propre fuseau horaire.',
    },
  },
  {
    id: 'geo-hydro',
    topic: 'geography',
    chapter: 'regions',
    q: { en: 'Which province is Canada’s largest producer of hydro-electricity?', fr: 'Quelle province est le plus grand producteur d’hydroélectricité du pays?' },
    choices: { en: ['Quebec', 'Ontario', 'Saskatchewan', 'Nova Scotia'], fr: ['Le Québec', 'L’Ontario', 'La Saskatchewan', 'La Nouvelle-Écosse'] },
    answer: 0,
    why: {
      en: 'Quebec’s huge supply of fresh water has made it Canada’s largest producer of hydro-electricity. It is also the main producer of pulp and paper.',
      fr: 'Les immenses réserves d’eau douce du Québec en ont fait le plus grand producteur d’hydroélectricité du pays. Il est aussi le principal producteur de pâtes et papiers.',
    },
  },
  {
    id: 'geo-ontario',
    topic: 'geography',
    chapter: 'regions',
    q: { en: 'Which province is home to more than one-third of Canadians?', fr: 'Quelle province compte plus d’un tiers de la population canadienne?' },
    choices: { en: ['Ontario', 'Quebec', 'British Columbia', 'Alberta'], fr: ['L’Ontario', 'Le Québec', 'La Colombie-Britannique', 'L’Alberta'] },
    answer: 0,
    why: {
      en: 'The people of Ontario make up more than one-third of Canadians. Toronto is the largest city in Canada and the country’s main financial centre.',
      fr: 'L’Ontario compte plus d’un tiers de la population canadienne. Toronto est la plus grande ville du Canada et le principal centre financier du pays.',
    },
  },
  {
    id: 'geo-superior',
    topic: 'geography',
    chapter: 'regions',
    q: { en: 'Which of the Great Lakes is the largest freshwater lake in the world?', fr: 'Lequel des Grands Lacs est le plus grand lac d’eau douce au monde?' },
    choices: { en: ['Lake Superior', 'Lake Ontario', 'Lake Huron', 'Lake Erie'], fr: ['Le lac Supérieur', 'Le lac Ontario', 'Le lac Huron', 'Le lac Érié'] },
    answer: 0,
    why: {
      en: 'There are five Great Lakes between Ontario and the United States. Lake Superior is the largest freshwater lake in the world.',
      fr: 'Cinq Grands Lacs se situent entre l’Ontario et les États-Unis. Le lac Supérieur est le plus grand lac d’eau douce au monde.',
    },
  },
  {
    id: 'geo-sask',
    topic: 'geography',
    chapter: 'regions',
    q: { en: 'Which province was once known as the “breadbasket of the world”?', fr: 'Quelle province était autrefois surnommée « le grenier du monde »?' },
    choices: { en: ['Saskatchewan', 'Manitoba', 'Alberta', 'Ontario'], fr: ['La Saskatchewan', 'Le Manitoba', 'L’Alberta', 'L’Ontario'] },
    answer: 0,
    why: {
      en: 'Saskatchewan, once known as the “breadbasket of the world” and the “wheat province”, has 40% of the arable land in Canada.',
      fr: 'La Saskatchewan, autrefois surnommée « le grenier du monde » et « la province du blé », possède 40 pour 100 des terres arables du Canada.',
    },
  },
  {
    id: 'geo-victoria',
    topic: 'geography',
    chapter: 'regions',
    q: { en: 'What is the capital city of British Columbia?', fr: 'Quelle est la capitale de la Colombie-Britannique?' },
    choices: { en: ['Victoria', 'Vancouver', 'Whitehorse', 'Edmonton'], fr: ['Victoria', 'Vancouver', 'Whitehorse', 'Edmonton'] },
    answer: 0,
    why: {
      en: 'Victoria is the capital of British Columbia. Whitehorse is the capital of Yukon and Edmonton the capital of Alberta.',
      fr: 'Victoria est la capitale de la Colombie-Britannique. Whitehorse est la capitale du Yukon et Edmonton, celle de l’Alberta.',
    },
  },
  {
    id: 'geo-yukon',
    topic: 'geography',
    chapter: 'regions',
    q: {
      en: 'Which territory holds the record for the coldest temperature ever recorded in Canada?',
      fr: 'Quel territoire détient le record de la température la plus froide jamais enregistrée au Canada?',
    },
    choices: { en: ['Yukon', 'Northwest Territories', 'Nunavut'], fr: ['Le Yukon', 'Les Territoires du Nord-Ouest', 'Le Nunavut'] },
    answer: 0,
    why: {
      en: 'Yukon holds the record for the coldest temperature ever recorded in Canada (-63°C).',
      fr: 'Le Yukon détient le record de la température la plus froide jamais enregistrée au Canada (-63 °C).',
    },
  },
  {
    id: 'geo-midnight',
    topic: 'geography',
    chapter: 'regions',
    q: { en: 'Why is the North often called the “Land of the Midnight Sun”?', fr: 'Pourquoi le Nord est-il souvent appelé « la terre du soleil de minuit »?' },
    choices: {
      en: ['At the height of summer, daylight can last up to 24 hours', 'The sun never sets there in winter', 'Its summers are long and hot', 'It has the most sunny days in Canada'],
      fr: ['Au milieu de l’été, le soleil peut briller jusqu’à 24 heures de suite', 'Le soleil ne s’y couche jamais en hiver', 'Ses étés sont longs et chauds', 'On y compte le plus de journées ensoleillées au Canada'],
    },
    answer: 0,
    why: {
      en: 'At the height of summer, daylight can last up to 24 hours. In winter, the sun disappears and darkness sets in for three months.',
      fr: 'Au milieu de l’été, le soleil peut briller jusqu’à 24 heures consécutives. En hiver, il disparaît et l’obscurité règne pendant trois mois.',
    },
  },
  {
    id: 'geo-border',
    topic: 'geography',
    chapter: 'economy',
    q: { en: 'What is the border between Canada and the United States traditionally known as?', fr: 'Comment appelle-t-on couramment la frontière entre le Canada et les États-Unis?' },
    choices: {
      en: ['The world’s longest undefended border', 'The Peace Tower', 'The Underground Railroad', 'The Land of the Midnight Sun'],
      fr: ['La plus longue frontière non défendue du monde', 'La Tour de la Paix', 'Le chemin de fer clandestin', 'La terre du soleil de minuit'],
    },
    answer: 0,
    why: {
      en: 'Millions of Canadians and Americans cross every year, in safety, what is traditionally known as “the world’s longest undefended border”.',
      fr: 'Des millions de Canadiens et d’Américains traversent chaque année en toute sécurité ce qu’on appelle couramment « la plus longue frontière non défendue du monde ».',
    },
  },
];
