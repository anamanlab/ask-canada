/** Practice questions: more on rights, responsibilities and who Canadians are (see ../quiz-bank.ts). */
import { TF, type Question } from '../quiz';

export const PEOPLES: Question[] = [
  {
    id: 'r-rule-of-law',
    topic: 'rights',
    chapter: 'rights',
    q: { en: 'What does the rule of law mean?', fr: 'Que signifie la primauté du droit?' },
    choices: {
      en: ['No person or group is above the law', 'The government can act without Parliament', 'Only citizens must obey the law', 'Judges are elected every four years'],
      fr: ['Aucune personne ni aucun groupe n’est au-dessus des lois', 'Le gouvernement peut agir sans le Parlement', 'Seuls les citoyens doivent respecter les lois', 'Les juges sont élus tous les quatre ans'],
    },
    answer: 0,
    why: {
      en: 'The rule of law is one of Canada’s founding principles: individuals and governments are regulated by laws, not by arbitrary actions. No person or group is above the law.',
      fr: 'La primauté du droit est l’un des principes fondateurs du Canada : les individus et les gouvernements sont régis par des lois et non par des mesures arbitraires. Personne n’est au-dessus des lois.',
    },
  },
  {
    id: 'r-assembly',
    topic: 'rights',
    chapter: 'rights',
    q: { en: 'Which of these is a fundamental freedom in Canada?', fr: 'Lequel de ces énoncés est une liberté fondamentale au Canada?' },
    choices: {
      en: ['Freedom of peaceful assembly', 'Freedom from paying taxes', 'Freedom to ignore a court order', 'Freedom from jury duty'],
      fr: ['La liberté de réunion pacifique', 'La liberté de ne pas payer d’impôts', 'La liberté d’ignorer une ordonnance du tribunal', 'La liberté de refuser d’être juré'],
    },
    answer: 0,
    why: {
      en: 'The fundamental freedoms are freedom of conscience and religion; of thought, belief, opinion and expression; of peaceful assembly; and of association.',
      fr: 'Les libertés fondamentales sont la liberté de conscience et de religion; de pensée, de croyance, d’opinion et d’expression; de réunion pacifique; et d’association.',
    },
  },
  {
    id: 'r-languages',
    topic: 'rights',
    chapter: 'rights',
    q: {
      en: 'Which two languages have equal status in Parliament and throughout the government?',
      fr: 'Quelles sont les deux langues qui ont un statut égal au Parlement et dans l’ensemble du gouvernement?',
    },
    choices: {
      en: ['English and French', 'English and Inuktitut', 'French and Michif', 'English and Spanish'],
      fr: ['Le français et l’anglais', 'L’anglais et l’inuktitut', 'Le français et le michif', 'L’anglais et l’espagnol'],
    },
    answer: 0,
    why: {
      en: 'Under the Charter’s official language rights, French and English have equal status in Parliament and throughout the government.',
      fr: 'Selon les droits relatifs aux langues officielles énoncés dans la Charte, le français et l’anglais ont un statut égal au Parlement et dans l’ensemble du gouvernement.',
    },
  },
  {
    id: 'r-equality',
    topic: 'rights',
    chapter: 'rights',
    q: { en: 'True or false? In Canada, men and women are equal under the law.', fr: 'Vrai ou faux? Au Canada, les hommes et les femmes sont égaux devant la loi.' },
    choices: TF,
    answer: 0,
    why: {
      en: 'In Canada, men and women are equal under the law. Practices that tolerate gender-based violence are crimes that are severely punished.',
      fr: 'Au Canada, les hommes et les femmes sont égaux devant la loi. Les pratiques qui tolèrent la violence fondée sur le sexe sont des crimes sévèrement punis.',
    },
  },
  {
    id: 'r-vote-resp',
    topic: 'rights',
    chapter: 'rights',
    q: { en: 'The right to vote comes with a responsibility to vote in which elections?', fr: 'Le droit de vote s’accompagne de la responsabilité de voter à quelles élections?' },
    choices: {
      en: ['Federal, provincial or territorial, and local elections', 'Federal elections only', 'Provincial elections only', 'Only the first election after you become a citizen'],
      fr: ['Les élections fédérales, provinciales ou territoriales, et locales', 'Les élections fédérales seulement', 'Les élections provinciales seulement', 'Seulement la première élection après être devenu citoyen'],
    },
    answer: 0,
    why: {
      en: 'The right to vote comes with a responsibility to vote in federal, provincial or territorial and local elections.',
      fr: 'Voter est non seulement un droit, mais aussi une responsabilité, que l’on exerce aux élections fédérales, provinciales ou territoriales, et locales.',
    },
  },
  {
    id: 'r-volunteer',
    topic: 'rights',
    chapter: 'rights',
    q: {
      en: 'Which responsibility of citizenship do millions of Canadians meet by freely giving their time without pay?',
      fr: 'Quelle responsabilité liée à la citoyenneté des millions de Canadiens assument-ils en donnant de leur temps sans être payés?',
    },
    choices: {
      en: ['Helping others in the community', 'Serving on a jury', 'Obeying the law', 'Voting in elections'],
      fr: ['Offrir de l’aide aux membres de la communauté', 'Faire partie d’un jury', 'Respecter les lois', 'Voter aux élections'],
    },
    answer: 0,
    why: {
      en: 'Millions of volunteers freely donate their time to help others without pay, for example at a school, a food bank or another charity.',
      fr: 'Des millions de bénévoles donnent de leur temps aux autres sans être payés, par exemple dans une école, une banque d’alimentation ou un autre organisme de bienfaisance.',
    },
  },
  {
    id: 'r-aboriginal-groups',
    topic: 'rights',
    chapter: 'who',
    q: { en: 'Today, the term Aboriginal peoples refers to which three groups?', fr: 'Aujourd’hui, le terme « peuples autochtones » désigne quels trois groupes?' },
    choices: {
      en: ['First Nations, Inuit and Métis', 'Inuit, Acadians and Métis', 'First Nations, Loyalists and Inuit', 'Métis, Quebecers and First Nations'],
      fr: ['Les Premières Nations, les Inuits et les Métis', 'Les Inuits, les Acadiens et les Métis', 'Les Premières Nations, les loyalistes et les Inuits', 'Les Métis, les Québécois et les Premières Nations'],
    },
    answer: 0,
    why: {
      en: 'The term Aboriginal peoples refers to three distinct groups: Indian (First Nations), Inuit and Métis.',
      fr: 'Le terme « peuples autochtones » désigne trois groupes distincts : les Indiens (Premières Nations), les Inuits et les Métis.',
    },
  },
  {
    id: 'r-acadians',
    topic: 'rights',
    chapter: 'who',
    q: { en: 'Who are the Acadians?', fr: 'Qui sont les Acadiens?' },
    choices: {
      en: [
        'Descendants of French colonists who began settling in what are now the Maritime provinces in 1604',
        'Loyalists who left the United States after the American Revolution',
        'Fur traders who worked for the Hudson’s Bay Company',
        'Settlers who came north for the Yukon Gold Rush',
      ],
      fr: [
        'Les descendants des colons français qui ont commencé à s’établir en 1604 dans ce que sont aujourd’hui les Maritimes',
        'Des loyalistes qui ont quitté les États-Unis après la Révolution américaine',
        'Des commerçants de fourrures de la Compagnie de la Baie d’Hudson',
        'Des colons venus au nord pour la ruée vers l’or du Yukon',
      ],
    },
    answer: 0,
    why: {
      en: 'The Acadians are the descendants of French colonists who began settling in what are now the Maritime provinces in 1604. They survived the deportation known as the “Great Upheaval”.',
      fr: 'Les Acadiens sont les descendants des colons français qui ont commencé à s’établir en 1604 dans ce que sont aujourd’hui les Maritimes. Ils ont survécu à la déportation appelée le « Grand Dérangement ».',
    },
  },
  {
    id: 'r-quebecois',
    topic: 'rights',
    chapter: 'who',
    q: {
      en: 'In what year did the House of Commons recognize that the Quebecois form a nation within a united Canada?',
      fr: 'En quelle année la Chambre des communes a-t-elle reconnu que les Québécois forment une nation au sein d’un Canada uni?',
    },
    choices: { en: ['1867', '1982', '2006', '2017'], fr: ['1867', '1982', '2006', '2017'] },
    answer: 2,
    why: {
      en: 'The House of Commons recognized in 2006 that the Quebecois form a nation within a united Canada.',
      fr: 'En 2006, la Chambre des communes a reconnu que les Québécois forment une nation au sein d’un Canada uni.',
    },
  },
  {
    id: 'r-apology',
    topic: 'rights',
    chapter: 'who',
    q: { en: 'In 2008, Ottawa formally apologized to which group?', fr: 'En 2008, à qui Ottawa a-t-il présenté des excuses officielles?' },
    choices: {
      en: ['Former students of residential schools', 'Descendants of the Loyalists', 'Fishers of the Atlantic provinces', 'Gold Rush miners in Yukon'],
      fr: ['Aux anciens élèves des pensionnats indiens', 'Aux descendants des loyalistes', 'Aux pêcheurs des provinces de l’Atlantique', 'Aux mineurs de la ruée vers l’or du Yukon'],
    },
    answer: 0,
    why: {
      en: 'From the 1800s until the 1980s, many Aboriginal children were placed in residential schools, which inflicted hardship on the students. In 2008, Ottawa formally apologized to the former students.',
      fr: 'Des années 1800 jusqu’aux années 1980, de nombreux enfants autochtones ont été placés dans des pensionnats, où ils ont vécu dans la misère. En 2008, Ottawa a présenté des excuses officielles aux anciens élèves.',
    },
  },
  {
    id: 'r-proclamation',
    topic: 'rights',
    chapter: 'who',
    q: { en: 'Which document first guaranteed Aboriginal territorial rights?', fr: 'Quel document a garanti pour la première fois les droits territoriaux des Autochtones?' },
    choices: {
      en: ['The Royal Proclamation of 1763', 'The Quebec Act of 1774', 'The Constitutional Act of 1791', 'The Canadian Charter of Rights and Freedoms'],
      fr: ['La Proclamation royale de 1763', 'L’Acte de Québec de 1774', 'L’Acte constitutionnel de 1791', 'La Charte canadienne des droits et libertés'],
    },
    answer: 0,
    why: {
      en: 'Territorial rights were first guaranteed through the Royal Proclamation of 1763 by King George III, which set the basis for negotiating treaties.',
      fr: 'Les droits territoriaux ont été garantis pour la première fois par la Proclamation royale de 1763, du roi George III, qui établissait les bases de la négociation des traités.',
    },
  },
];
