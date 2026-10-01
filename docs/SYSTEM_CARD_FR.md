# Fiche système d’Ask Canada

*Version 0.1 · 2026-09-29 · [English](SYSTEM_CARD.md)* — inspirée de la
[fiche système de Réponses IA](../vendor/cds-ai-answers/SYSTEM_CARD_FR.md) du Service numérique canadien.

## Résumé
Ask Canada est une porte d’entrée indépendante, à code source ouvert et fondée sur l’IA vers les services du
gouvernement du Canada. Les gens posent leurs questions en langage clair (par écrit, à voix haute ou en
joignant une lettre) et obtiennent une réponse courte avec la source officielle, ainsi que des outils
interactifs (planificateurs, calculateurs, listes, données en direct) dans la conversation. Le service
fournit **de l’information seulement** : il ne prend ni n’influence aucune décision administrative, n’ouvre
jamais de session, ne présente pas de demandes et n’accepte pas de paiements. Ces étapes sont confiées aux
sites officiels.

## Objet et portée
- **Utilisateurs :** toute personne qui cherche des services fédéraux, en français, en anglais ou dans
  20 autres langues.
- **Contenu :** pages officielles du gouvernement du Canada (canada.ca, *.gc.ca, *.canada.ca) et données
  publiques (alertes météo, conseils aux voyageurs, rappels, jours fériés).
- **Hors de portée :** conseils juridiques, financiers ou médicaux; état d’un dossier personnel; tout ce qui
  exige une identité.

## Architecture
| Composant | Détail |
| --- | --- |
| Interface | Next.js 16 / React 19, réponses en continu (flux de messages AI SDK v7), outils affichés à partir d’appels d’outils |
| Modèle | Indépendant du fournisseur (`AI_PROVIDER` : Anthropic, Vercel AI Gateway, Azure, Bedrock); Claude Sonnet par défaut |
| Outils | Outils des widgets (p. ex. `passportPlanner`), `officialGuidance` (consignes ministérielles du SNC), `fetchOfficialPage`, `searchOfficialSources`, `suggestFollowUps` |
| Ancrage | Invite système + consignes ministérielles de Réponses IA acheminées + pages officielles consultées |
| Repli | Moteur scénarisé déterministe (mêmes outils) sans modèle configuré ou en cas de panne |
| Stockage | Aucun côté serveur. Conversations, plans et listes dans le navigateur seulement (clés `ac:`) |

**Déroulement :** question → retrait des renseignements personnels (client et serveur) → limite de débit et
plafonds → invite système (connaissances du pays, consignes de sécurité, consignes ministérielles) → modèle
avec outils (6 étapes au plus, sortie plafonnée) → réponse en continu avec citations numérotées → widgets →
liste des sources avec dates de vérification.

## Risques et mesures d’atténuation
**Exactitude.** Les réponses doivent citer des pages officielles; les widgets utilisent des faits vérifiés sur
canada.ca, avec l’URL et la date de modification consignées à côté des données; le modèle doit consulter et
citer les pages plutôt que se fier à sa mémoire, ne jamais inventer de montants, de délais ou de numéros de
téléphone. Les citations hors de la liste officielle sont signalées « Source non officielle ».

**Vie privée.** Aucun compte, témoin de pistage, profil analytique ni stockage des conversations côté serveur.
Les NAS, numéros de carte et de passeport sont retirés avant l’envoi, puis de nouveau sur le serveur. Le
limiteur de débit ne garde qu’un hachage salé de l’adresse IP, brièvement. Le fournisseur de modèle doit
s’engager contractuellement à ne conserver aucune donnée.

**Manipulation et sécurité.** Les consignes de neutralité, de lutte contre les biais et de résistance à la
manipulation de Réponses IA font partie de l’invite; les situations de crise sont dirigées vers le 911 et le
9-8-8; le modèle sait qu’il n’est pas le gouvernement et ne peut agir au nom de personne.

**Accessibilité et langues.** Cible WCAG 2.1 AA; parité français-anglais vérifiée par `pnpm check:i18n`; les
réponses suivent la langue de l’utilisateur et citent les pages françaises en français.

**Fiabilité.** Le repli scénarisé maintient des réponses sourcées pendant les pannes; les widgets renvoient à
la page officielle en cas d’erreur; les limites protègent les coûts et la disponibilité.

## Évaluation
- Les scénarios servent de tests de régression pour les widgets et le ton (FR + EN).
- Les exemples du laboratoire (`/lab`) couvrent chaque état en mode clair et sombre, FR/EN, ordinateur et
  mobile, et de droite à gauche.
- Avant une adoption officielle : évaluation par des experts selon la méthode de Réponses IA, par ministère.

## Limites connues
- Les menus dans les langues autres que le français et l’anglais restent en anglais jusqu’à leur révision.
- Sans la recherche Web d’Anthropic, la recherche utilise un index hors ligne de pages officielles; une recherche Web publique est facultative (`SEARCH_FALLBACK=duckduckgo`).
- Les données en direct dépendent d’API ouvertes; les widgets renvoient à la page officielle en cas de panne.
