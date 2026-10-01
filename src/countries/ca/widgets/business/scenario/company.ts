/** Scripted answers about business structures and federal incorporation (EN + FR). Facts and URLs: ../data.ts. */
import { INCORPORATION } from '../data';
import { wantsExpress } from '../parse';
import { c } from './cite';

export const structureReply = {
  en: `# A *sole proprietorship* is the simplest start; a corporation protects your personal assets.

A **sole proprietorship** has one owner and isn’t separate from you: profits go on your personal tax return, and you’re personally responsible for the business’s debts, even with your personal property. ${c(1, 'soleProp', 'en')}

A **partnership** is two or more owners. It files no income tax return of its own: each partner reports their share. Like a sole proprietorship, the owners are directly liable for its debts. ${c(2, 'partnership', 'en')} ${c(3, 'structures', 'en')}

A **corporation** is a separate legal entity. Shareholders aren’t responsible for its debts, though a lender may ask you for a personal guarantee, and it files its own T2 return within 6 months of its year-end. ${c(4, 'corporation', 'en')} Incorporating federally costs $200 online and protects your name across Canada. ${c(5, 'ccBenefits', 'en')}

Tell the tool who owns the business and what matters most to you, and it shows which structure fits.`,
  fr: `# L’*entreprise individuelle* est la plus simple; la société par actions protège vos biens personnels.

Une **entreprise individuelle** a un seul propriétaire et n’est pas distincte de vous : les profits vont dans votre déclaration de revenus personnelle, et vous êtes personnellement responsable des dettes de l’entreprise, même sur vos biens personnels. ${c(1, 'soleProp', 'fr')}

Une **société de personnes** compte deux propriétaires ou plus. Elle ne produit pas sa propre déclaration de revenus : chaque associé déclare sa part. Comme pour l’entreprise individuelle, les propriétaires sont directement responsables de ses dettes. ${c(2, 'partnership', 'fr')} ${c(3, 'structures', 'fr')}

Une **société par actions** est une entité juridique distincte. Les actionnaires ne sont pas responsables de ses dettes, même si un prêteur peut exiger une garantie personnelle, et elle produit sa propre déclaration T2 dans les 6 mois suivant la fin de son exercice. ${c(4, 'corporation', 'fr')} La constitution au fédéral coûte 200 $ en ligne et protège votre dénomination partout au Canada. ${c(5, 'ccBenefits', 'fr')}

Indiquez à l’outil à qui appartient l’entreprise et ce qui compte le plus pour vous : il vous montre la structure qui convient.`,
};

export const incorporateReply = {
  en: `# {headEn}

There are 5 steps: name your corporation (a number is simplest), create your articles, set your registered office and first directors, file who has significant control, then submit and pay. ${c(1, 'howIncorporate', 'en')}

{speedEn} You don’t need a Nuans report to incorporate online with a word name: the name search is built in. ${c(2, 'ccFees', 'en')} Your business number arrives by email within minutes, with your corporation income tax account. ${c(3, 'ccBenefits', 'en')} ${c(4, 'needBn', 'en')}

A federal corporation must also register in each province or territory where it does business; Ontario, Nova Scotia and Newfoundland and Labrador forms are filled in during incorporation. ${c(5, 'extraProvincial', 'en')} Every year after, file a $12 annual return. ${c(6, 'annualReturn', 'en')}

Here’s your plan. Tick off each step as you go: your progress stays on this device.`,
  fr: `# {headFr}

Il y a 5 étapes : choisir la dénomination (un numéro est le plus simple), préparer les statuts, établir le siège social et les premiers administrateurs, déclarer les particuliers ayant un contrôle important, puis soumettre la demande et payer. ${c(1, 'howIncorporate', 'fr')}

{speedFr} Aucun rapport Nuans n’est nécessaire pour vous constituer en ligne avec un nom : la recherche est intégrée. ${c(2, 'ccFees', 'fr')} Votre numéro d’entreprise arrive par courriel en quelques minutes, avec votre compte d’impôt des sociétés. ${c(3, 'ccBenefits', 'fr')} ${c(4, 'needBn', 'fr')}

Une société fédérale doit aussi s’enregistrer dans chaque province ou territoire où elle exerce ses activités; les formulaires de l’Ontario, de la Nouvelle-Écosse et de Terre-Neuve-et-Labrador sont remplis pendant la constitution. ${c(5, 'extraProvincial', 'fr')} Chaque année par la suite, déposez un rapport annuel de 12 $. ${c(6, 'annualReturn', 'fr')}

Voici votre plan. Cochez chaque étape au fur et à mesure : votre progression reste sur cet appareil.`,
};

/** In a hurry? The verdict leads with express service (the planner opens on it too), so heading and widget agree. */
export const incorporateVars = ({ text }: { text: string }) => {
  const { fee, express, expressTime, standardTime } = INCORPORATION;
  const day = standardTime.days;
  return wantsExpress(text)
    ? {
        headEn: `With express service, you can be incorporated federally in *${expressTime.hours} hours* for $${fee + express}.`,
        headFr: `Avec le service express, votre société peut être constituée au fédéral en *${expressTime.hours} heures* pour ${fee + express} $.`,
        speedEn: `That’s the $${fee} online fee plus $${express} for express service; standard service usually takes ${day} business day.`,
        speedFr: `C’est le droit de ${fee} $ en ligne, plus ${express} $ pour le service express; le service régulier prend habituellement ${day} jour ouvrable.`,
      }
    : {
        headEn: `Incorporating federally costs *$${fee}* online and usually takes ${day} business day.`,
        headFr: `La constitution au fédéral coûte *${fee} $* en ligne et prend habituellement ${day} jour ouvrable.`,
        speedEn: `Need it faster? Express service is $${express} more and done in ${expressTime.hours} hours.`,
        speedFr: `Pressé? Le service express coûte ${express} $ de plus et est traité en ${expressTime.hours} heures.`,
      };
};
