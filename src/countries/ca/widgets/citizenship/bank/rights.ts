/** Practice questions: rights and responsibilities (see ../quiz-bank.ts for how the bank is written and used). */
import { TF, type Question } from '../quiz';

export const RIGHTS: Question[] = [
  {
    id: 'r-jury',
    topic: 'rights',
    chapter: 'rights',
    q: { en: 'Which of these is a responsibility of Canadian citizenship?', fr: 'Lequel de ces choix est une responsabilité liée à la citoyenneté canadienne?' },
    choices: {
      en: ['Owning a home', 'Serving on a jury when called', 'Joining a political party', 'Speaking both official languages'],
      fr: ['Être propriétaire d’une maison', 'Faire partie d’un jury lorsqu’on vous le demande', 'Adhérer à un parti politique', 'Parler les deux langues officielles'],
    },
    answer: 1,
    why: {
      en: 'When you’re called to serve on a jury, the law requires you to do it. Obeying the law, voting and helping your community are other responsibilities.',
      fr: 'Lorsqu’on vous le demande, la loi vous oblige à faire partie d’un jury. Respecter la loi, voter et aider votre collectivité sont d’autres responsabilités.',
    },
  },
  {
    id: 'r-charter',
    topic: 'rights',
    chapter: 'rights',
    q: { en: 'In what year was the Canadian Charter of Rights and Freedoms added to the Constitution?', fr: 'En quelle année la Charte canadienne des droits et libertés a-t-elle été enchâssée dans la Constitution?' },
    choices: { en: ['1867', '1931', '1982', '2000'], fr: ['1867', '1931', '1982', '2000'] },
    answer: 2,
    why: {
      en: 'The Constitution was amended in 1982 to entrench the Charter of Rights and Freedoms.',
      fr: 'La Constitution a été modifiée en 1982 pour y enchâsser la Charte des droits et libertés.',
    },
  },
  {
    id: 'r-mobility',
    topic: 'rights',
    chapter: 'rights',
    q: { en: 'What do mobility rights mean for Canadians?', fr: 'Que signifie la liberté de circulation et d’établissement pour les Canadiens?' },
    choices: {
      en: [
        'You must stay in the province where you first settled',
        'You can live and work anywhere in Canada, enter and leave freely, and apply for a passport',
        'You can drive in any province without a licence',
        'You can move to any country without a passport',
      ],
      fr: [
        'Vous devez rester dans la province où vous vous êtes établi en premier',
        'Vous pouvez vivre et travailler n’importe où au Canada, entrer au pays et en sortir librement, et demander un passeport',
        'Vous pouvez conduire dans toutes les provinces sans permis',
        'Vous pouvez vous établir dans n’importe quel pays sans passeport',
      ],
    },
    answer: 1,
    why: {
      en: 'Mobility rights let Canadians live and work anywhere in Canada, enter and leave the country freely, and apply for a passport.',
      fr: 'La liberté de circulation et d’établissement permet aux Canadiens de vivre et de travailler n’importe où au Canada, d’entrer au pays et d’en sortir librement, et de demander un passeport.',
    },
  },
  {
    id: 'r-military',
    topic: 'rights',
    chapter: 'rights',
    q: { en: 'True or false? Military service is compulsory in Canada.', fr: 'Vrai ou faux? Le service militaire est obligatoire au Canada.' },
    choices: TF,
    answer: 1,
    why: {
      en: 'There is no compulsory military service in Canada. Serving in the Canadian Forces is a choice and a noble way to contribute.',
      fr: 'Le Canada n’impose pas le service militaire obligatoire. Servir dans les Forces canadiennes est un choix et une noble façon de contribuer.',
    },
  },
  {
    id: 'r-magna',
    topic: 'rights',
    chapter: 'rights',
    q: { en: 'Canada’s tradition of ordered liberty dates back to Magna Carta. When was it signed?', fr: 'La tradition canadienne de liberté ordonnée remonte à la Grande Charte (Magna Carta). Quand a-t-elle été signée?' },
    choices: { en: ['1215', '1492', '1763', '1867'], fr: ['1215', '1492', '1763', '1867'] },
    answer: 0,
    why: {
      en: 'Magna Carta, also known as the Great Charter of Freedoms, was signed in England in 1215.',
      fr: 'La Grande Charte des libertés (Magna Carta) a été signée en Angleterre en 1215.',
    },
  },
  {
    id: 'r-habeas',
    topic: 'rights',
    chapter: 'rights',
    q: { en: 'What is habeas corpus?', fr: 'Qu’est-ce que l’habeas corpus?' },
    choices: {
      en: ['The right to vote in secret', 'The right to challenge unlawful detention by the state', 'Freedom of religion', 'The right to a free lawyer'],
      fr: ['Le droit de voter en secret', 'Le droit de contester une détention illégale par l’État', 'La liberté de religion', 'Le droit à un avocat gratuit'],
    },
    answer: 1,
    why: {
      en: 'Habeas corpus, the right to challenge unlawful detention by the state, comes from English common law.',
      fr: 'L’habeas corpus, ou droit de contester une détention illégale par l’État, est emprunté à la common law britannique.',
    },
  },
  {
    id: 'r-founding',
    topic: 'rights',
    chapter: 'who',
    q: { en: 'Who are Canada’s three founding peoples?', fr: 'Quels sont les trois peuples fondateurs du Canada?' },
    choices: {
      en: ['Aboriginal, French and British', 'English, Scottish and Irish', 'French, Spanish and Portuguese', 'Inuit, Métis and Acadian'],
      fr: ['Les Autochtones, les Français et les Britanniques', 'Les Anglais, les Écossais et les Irlandais', 'Les Français, les Espagnols et les Portugais', 'Les Inuits, les Métis et les Acadiens'],
    },
    answer: 0,
    why: {
      en: 'To understand what it means to be Canadian, the guide says, it’s important to know our three founding peoples: Aboriginal, French and British.',
      fr: 'Selon le guide, pour comprendre ce que signifie être Canadien, il faut connaître nos trois peuples fondateurs : les Autochtones, les Français et les Britanniques.',
    },
  },
  {
    id: 'r-inuit',
    topic: 'rights',
    chapter: 'who',
    q: { en: 'What does the word “Inuit” mean in Inuktitut?', fr: 'Que signifie le mot « Inuit » en inuktitut?' },
    choices: { en: ['The North', 'The people', 'Our land', 'The ice'], fr: ['Le Nord', 'Le peuple', 'Notre terre', 'La glace'] },
    answer: 1,
    why: {
      en: 'Inuit means “the people” in Inuktitut. Inuit live in communities across the Arctic.',
      fr: 'Inuit signifie « le peuple » en inuktitut. Les Inuits vivent dans des collectivités de l’Arctique.',
    },
  },
  {
    id: 'r-metis',
    topic: 'rights',
    chapter: 'who',
    q: { en: 'Who are the Métis?', fr: 'Qui sont les Métis?' },
    choices: {
      en: ['The first French settlers in Acadia', 'A distinct people of mixed Aboriginal and European ancestry', 'Fur traders from Scotland', 'The Inuit of Nunavut'],
      fr: ['Les premiers colons français d’Acadie', 'Un peuple distinct d’ascendance autochtone et européenne', 'Des commerçants de fourrures venus d’Écosse', 'Les Inuits du Nunavut'],
    },
    answer: 1,
    why: {
      en: 'The Métis are a distinct people of mixed Aboriginal and European ancestry. Most live in the Prairie provinces.',
      fr: 'Les Métis sont un peuple distinct né de l’union d’Autochtones et d’Européens. La plupart vivent dans les provinces des Prairies.',
    },
  },
];
