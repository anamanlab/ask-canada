/**
 * Occupations catalog: 55 common occupations with their Job Bank profile id, NOC 2021 code, titles, search
 * keyword, national wages and the title/skill aliases the matcher scores against. Verified 2026-09-30 (see
 * ./data.ts for the sources).
 *
 * Kept out of ./data.ts on purpose: no renderer imports this file (the tools put the titles, links and
 * matches they need in their outputs). Only the server (tools, scenarios) and the career matcher's scoring
 * chunk (./match.ts) load it; the browser fetches that chunk when the person first switches a skill off or
 * brings a resume.
 */
import { fold, type L10n, type Lang } from './data';

export type Occupation = {
  key: string;
  /** Job Bank job profile id (noc_job_title_concordance_id), used in wage/outlook URLs. */
  profileId: string;
  /** NOC 2021 code. */
  noc: string;
  title: L10n;
  /** Keyword used for Job Bank searches. */
  search: L10n;
  sector: Sector;
  /** National wages, $/hour (Job Bank, updated 2025-11-19, reference period 2023-2024). */
  wage: { low: number; median: number; high: number };
  /** Title aliases (EN + FR, folded) — a strong signal. */
  titles: string[];
  /** Skills and tools (EN + FR, folded) — each hit is a weaker signal. */
  skills: string[];
};

export type Sector = 'tech' | 'health' | 'education' | 'office' | 'finance' | 'retail' | 'food' | 'trades' | 'transport' | 'creative' | 'community' | 'public-safety' | 'agriculture' | 'engineering';

const o = (
  key: string,
  profileId: string,
  noc: string,
  sector: Sector,
  en: string,
  fr: string,
  search: [string, string],
  wage: [number, number, number],
  titles: string,
  skills: string,
): Occupation => ({
  key,
  profileId,
  noc,
  sector,
  title: { en, fr },
  search: { en: search[0], fr: search[1] },
  wage: { low: wage[0], median: wage[1], high: wage[2] },
  titles: titles.split('|').map(fold),
  skills: skills.split('|').map(fold),
});

/**
 * 55 common occupations. Profile ids, NOC 2021 codes and French titles from Job Bank's title search;
 * national wages from each wages page (checked 2026-09-30).
 */
export const OCCUPATIONS: Occupation[] = [
  o('software-developer', '22548', '21232', 'tech', 'Software developer', 'Développeur ou développeuse de logiciels', ['software developer', 'développeur logiciel'], [30, 48.08, 76.92],
    'software developer|developpeur logiciel|developpeuse logiciel|programmer|programmeur|full stack|front end developer|back end developer|developpeur web full stack',
    'javascript|typescript|react|node|python|java|c#|c++|git|api|rest|sql|agile|scrum|html|css|kotlin|swift|golang|ruby|php|docker|unit testing|tests unitaires|programmation|programming|code review'),
  o('software-engineer', '5485', '21231', 'tech', 'Software engineer', 'Ingénieur ou ingénieure en logiciels', ['software engineer', 'ingénieur logiciel'], [35, 56.49, 91.35],
    'software engineer|ingenieur logiciel|ingenieure logiciel|genie logiciel|software engineering|devops engineer|site reliability',
    'system design|architecture|distributed systems|kubernetes|aws|azure|gcp|microservices|ci cd|terraform|java|go|rust|c++|scalability|algorithms|algorithmes'),
  o('data-scientist', '227147', '21211', 'tech', 'Data scientist', 'Scientifique de données', ['data scientist', 'scientifique de données'], [30, 46.15, 69.74],
    'data scientist|scientifique de donnees|machine learning engineer|ingenieur apprentissage automatique',
    'machine learning|apprentissage automatique|python|pandas|scikit learn|tensorflow|pytorch|statistics|statistiques|modelling|modelisation|r|deep learning|nlp|forecasting|previsions'),
  o('data-analyst', '17882', '21223', 'tech', 'Data analyst', 'Analyste de données', ['data analyst', 'analyste de données'], [25, 40.87, 61.03],
    'data analyst|analyste de donnees|database analyst|analyste bases de donnees|bi analyst|reporting analyst',
    'sql|excel|power bi|tableau|dashboards|tableaux de bord|data visualization|visualisation|reporting|rapports|python|etl|data cleaning|google analytics|looker'),
  o('business-analyst', '22495', '21221', 'tech', 'Business systems analyst', 'Analyste de systèmes commerciaux', ['business analyst', 'analyste d’affaires'], [30.67, 45.13, 62.5],
    'business analyst|analyste d affaires|business systems analyst|systems analyst|analyste fonctionnel|analyste de systemes',
    'requirements|exigences|user stories|process mapping|cartographie des processus|stakeholders|parties prenantes|uml|jira|confluence|use cases|gap analysis|visio|bpmn'),
  o('web-developer', '17892', '21234', 'tech', 'Web developer', 'Développeur ou développeuse Web', ['web developer', 'développeur web'], [21.48, 38.46, 57.16],
    'web developer|developpeur web|developpeuse web|webmaster|front end|integrateur web|wordpress developer',
    'html|css|javascript|wordpress|react|vue|responsive|accessibility|accessibilite|wcag|seo|figma|shopify|php|web design'),
  o('network-technician', '24514', '22220', 'tech', 'Computer network technician', 'Technicien ou technicienne de réseau informatique', ['network technician', 'technicien réseau'], [21, 36, 55],
    'network technician|technicien reseau|technicienne reseau|network administrator|administrateur reseau|systems administrator|administrateur systemes',
    'cisco|ccna|routers|routeurs|switches|commutateurs|firewall|pare feu|vpn|tcp ip|active directory|windows server|linux|vmware|lan|wan|network security'),
  o('help-desk', '3761', '22221', 'tech', 'Help desk technician', 'Technicien ou technicienne de soutien informatique', ['help desk', 'soutien technique informatique'], [20.5, 31.47, 49],
    'help desk|service desk|it support|soutien informatique|support technique|technical support|technicien informatique|desktop support',
    'troubleshooting|depannage|ticketing|servicenow|office 365|microsoft 365|windows|hardware|materiel|password resets|comptia a|customer support|imaging|printers'),
  o('registered-nurse', '993', '31301', 'health', 'Registered nurse', 'Infirmier autorisé ou infirmière autorisée', ['registered nurse', 'infirmier'], [30, 43.27, 54.37],
    'registered nurse|rn|infirmier|infirmiere|infirmiere autorisee|infirmier autorise|nurse|clinical nurse|nursing|soins infirmiers',
    'patient care|soins aux patients|medication administration|administration des medicaments|charting|triage|acls|bls|wound care|soins des plaies|iv therapy|care plans|plans de soins|emergency department|urgence|med surg'),
  o('practical-nurse', '4383', '32101', 'health', 'Licensed practical nurse', 'Infirmier ou infirmière auxiliaire', ['licensed practical nurse', 'infirmier auxiliaire'], [25, 31.32, 38],
    'licensed practical nurse|lpn|rpn|registered practical nurse|infirmier auxiliaire|infirmiere auxiliaire',
    'patient care|soins aux patients|vital signs|signes vitaux|medication administration|charting|long term care|soins de longue duree|wound care|bls'),
  o('personal-support-worker', '296747', '33102', 'health', 'Personal support worker', 'Préposé ou préposée aux bénéficiaires', ['personal support worker', 'préposé aux bénéficiaires'], [19, 24, 28.84],
    'personal support worker|psw|nurse aide|aide soignant|aide soignante|health care aide|care aide|preposee aux beneficiaires|prepose aux beneficiaires|pab',
    'personal care|soins personnels|bathing|hygiene|mobility|mobilite|transfers|feeding|alimentation|long term care|soins de longue duree|dementia|demence|residents|residents care'),
  o('home-support-worker', '24584', '44101', 'health', 'Home support worker', 'Préposé ou préposée aux soins à domicile', ['home support worker', 'soins à domicile'], [16, 20.5, 27],
    'home support worker|home care worker|caregiver|aide a domicile|soins a domicile|personal aide|companion',
    'personal care|soins personnels|meal preparation|preparation des repas|housekeeping|entretien menager|seniors|aines|companionship|errands|medication reminders'),
  o('early-childhood-educator', '5189', '42202', 'education', 'Early childhood educator', 'Éducateur ou éducatrice de la petite enfance', ['early childhood educator', 'éducatrice petite enfance'], [16.95, 22.3, 30.03],
    'early childhood educator|ece|educatrice de la petite enfance|educateur de la petite enfance|daycare|garderie|cpe|preschool teacher',
    'child development|developpement de l enfant|play based learning|apprentissage par le jeu|curriculum|programmation|infants|poupons|toddlers|first aid|premiers soins|observation|parents'),
  o('elementary-teacher', '4714', '41221', 'education', 'Elementary school teacher', 'Enseignant ou enseignante au primaire', ['elementary teacher', 'enseignant primaire'], [26.67, 43.27, 56.59],
    'teacher|enseignant|enseignante|elementary teacher|primary teacher|occasional teacher|suppleant|suppleante|professeur',
    'lesson planning|planification de cours|classroom management|gestion de classe|curriculum|assessment|evaluation|literacy|litteratie|numeracy|differentiated instruction|iep|bachelor of education|b ed'),
  o('administrative-assistant', '24789', '13110', 'office', 'Administrative assistant', 'Adjoint administratif ou adjointe administrative', ['administrative assistant', 'adjointe administrative'], [19.23, 26.44, 36.88],
    'administrative assistant|adjoint administratif|adjointe administrative|executive assistant|office administrator|secretary|secretaire|office coordinator',
    'microsoft office|excel|word|outlook|scheduling|calendriers|agenda|minutes|proces verbaux|filing|classement|data entry|saisie de donnees|travel arrangements|correspondence|correspondance|bilingual|bilingue'),
  o('receptionist', '24391', '14101', 'office', 'Receptionist', 'Réceptionniste', ['receptionist', 'réceptionniste'], [16.25, 21, 29],
    'receptionist|receptionniste|front desk|commis a l accueil|agent d accueil|front office',
    'phones|telephone|greeting|accueil|scheduling|appointments|rendez vous|switchboard|standard|customer service|service a la clientele|data entry'),
  o('bookkeeper', '12562', '12200', 'finance', 'Bookkeeper', 'Teneur ou teneuse de livres', ['bookkeeper', 'teneur de livres'], [19.55, 28.02, 45.07],
    'bookkeeper|teneur de livres|teneuse de livres|accounting clerk|commis comptable|accounts payable|accounts receivable|comptes fournisseurs|comptes clients|payroll clerk',
    'quickbooks|sage|xero|reconciliation|conciliation|invoices|factures|payroll|paie|general ledger|grand livre|gst|tps|excel|accounts payable|accounts receivable'),
  o('accountant', '113', '11100', 'finance', 'Accountant', 'Comptable', ['accountant', 'comptable'], [25, 40.36, 71.43],
    'accountant|comptable|cpa|staff accountant|auditor|auditeur|controller|controleur|financial analyst',
    'financial statements|etats financiers|ifrs|aspe|audit|tax|impot|fiscalite|month end|fin de mois|budgeting|budgets|variance analysis|sap|excel|reconciliation|cpa'),
  o('financial-advisor', '296495', '11102', 'finance', 'Financial advisor', 'Conseiller ou conseillère financier', ['financial advisor', 'conseiller financier'], [23.91, 36.06, 73.08],
    'financial advisor|financial planner|conseiller financier|conseillere financiere|planificateur financier|wealth advisor|investment advisor',
    'investments|placements|rrsp|reer|tfsa|celi|retirement planning|planification de la retraite|mutual funds|fonds communs|insurance|assurance|client portfolio|cfp|csc|financial planning'),
  o('customer-service', '14211', '64409', 'office', 'Customer service representative', 'Préposé ou préposée au service à la clientèle', ['customer service representative', 'service à la clientèle'], [16, 22, 33.14],
    'customer service representative|customer service|service a la clientele|call centre agent|agent de centre d appels|customer care|client service|contact centre',
    'customer service|service a la clientele|call centre|centre d appels|complaints|plaintes|crm|salesforce|phones|telephone|email support|chat support|problem solving|resolution de problemes|bilingual|bilingue'),
  o('retail-salesperson', '20599', '64100', 'retail', 'Retail salesperson', 'Vendeur ou vendeuse au détail', ['retail sales associate', 'vendeur'], [15, 17.31, 28.85],
    'retail sales associate|sales associate|salesperson|vendeur|vendeuse|conseiller aux ventes|conseillere aux ventes|retail associate|store associate',
    'sales|ventes|merchandising|marchandisage|pos|point of sale|point de vente|upselling|customer service|service a la clientele|inventory|inventaire|visual merchandising|product knowledge'),
  o('cashier', '24143', '65100', 'retail', 'Cashier', 'Caissier ou caissière', ['cashier', 'caissier'], [15, 16, 19.02],
    'cashier|caissier|caissiere|cashier clerk|front end cashier',
    'cash handling|manipulation d argent|pos|point of sale|caisse|customer service|service a la clientele|balancing|bagging|returns|retours'),
  o('retail-supervisor', '16383', '62010', 'retail', 'Retail store supervisor', 'Superviseur ou superviseure de magasin', ['retail supervisor', 'superviseur de magasin'], [16.55, 22, 36.06],
    'retail supervisor|store supervisor|assistant store manager|key holder|shift supervisor|superviseur de magasin|superviseure de magasin|gerant adjoint|chef d equipe',
    'scheduling|horaires|staff training|formation du personnel|opening and closing|ouverture et fermeture|inventory|inventaire|loss prevention|sales targets|objectifs de vente|merchandising|cash handling|team leadership|leadership'),
  o('cook', '6225', '63200', 'food', 'Cook', 'Cuisinier ou cuisinière', ['cook', 'cuisinier'], [15, 18, 25],
    'cook|line cook|prep cook|cuisinier|cuisiniere|chef de partie|sous chef|commis de cuisine',
    'food preparation|preparation des aliments|food safe|food handler|hygiene et salubrite|grill|menu|kitchen|cuisine|knife skills|plating|inventory|mapaq'),
  o('food-service-supervisor', '6005', '62020', 'food', 'Food service supervisor', 'Superviseur ou superviseure des services alimentaires', ['food service supervisor', 'superviseur service alimentaire'], [15.75, 19, 27.69],
    'food service supervisor|restaurant supervisor|shift manager|superviseur de restaurant|gerant de quart|assistant manager restaurant',
    'food safety|salubrite|scheduling|horaires|staff training|formation|inventory|inventaire|cash handling|customer service|quick service|restauration rapide|team leadership'),
  o('server', '6637', '65200', 'food', 'Food and beverage server', 'Serveur ou serveuse', ['server', 'serveur'], [15, 18.5, 30],
    'server|waiter|waitress|serveur|serveuse|bartender|barman|barmaid|host|hote|hotesse',
    'smart serve|serving it right|service aux tables|table service|pos|wine|vin|menu knowledge|customer service|cash handling|banquets|fine dining'),
  o('barista', '24592', '65201', 'food', 'Barista', 'Barista', ['barista', 'barista'], [15, 16.55, 21.5],
    'barista|coffee shop|cafe|counter attendant|preposee au comptoir|prepose au comptoir',
    'espresso|latte art|coffee|cafe|customer service|cash handling|pos|food safety|cleaning|nettoyage'),
  o('electrician', '20684', '72200', 'trades', 'Electrician', 'Électricien ou électricienne', ['electrician', 'électricien'], [20, 35, 48],
    'electrician|electricien|electricienne|electrical apprentice|apprenti electricien|journeyman electrician|309a|construction electrician',
    'wiring|cablage|conduit|panels|panneaux|electrical code|code de l electricite|blueprints|blueprint reading|reading blueprints|lecture de plans|lire des plans|troubleshooting|depannage|red seal|sceau rouge|residential wiring|lockout|cadenassage'),
  o('plumber', '4747', '72300', 'trades', 'Plumber', 'Plombier ou plombière', ['plumber', 'plombier'], [21, 34, 46],
    'plumber|plombier|plombiere|pipefitter|tuyauteur|apprentice plumber|apprenti plombier|306a',
    'piping|tuyauterie|drains|fixtures|appareils|water heaters|chauffe eau|backflow|soldering|soudure|blueprints|blueprint reading|reading blueprints|plans|lecture de plans|lire des plans|plumbing code|red seal|sceau rouge'),
  o('carpenter', '6388', '72310', 'trades', 'Carpenter', 'Charpentier-menuisier ou charpentière-menuisière', ['carpenter', 'charpentier menuisier'], [22, 32.12, 44.23],
    'carpenter|charpentier|menuisier|charpentiere|framer|finish carpenter|apprentice carpenter',
    'framing|charpente|formwork|coffrage|finishing|finition|blueprints|blueprint reading|reading blueprints|plans|lecture de plans|lire des plans|power tools|outils electriques|renovation|renovations|drywall|cabinetry|ebenisterie|red seal|sceau rouge|measuring'),
  o('welder', '23242', '72106', 'trades', 'Welder', 'Soudeur ou soudeuse', ['welder', 'soudeur'], [22, 30, 47],
    'welder|soudeur|soudeuse|welder fitter|monteur soudeur|fabricator|fabricant',
    'mig|tig|stick|smaw|gmaw|fcaw|gtaw|cwb|blueprints|blueprint reading|reading blueprints|plans|lecture de plans|lire des plans|fabrication|metal|acier|steel|grinding|meulage|cutting torch|red seal'),
  o('automotive-technician', '14799', '72410', 'trades', 'Automotive service technician', 'Mécanicien ou mécanicienne automobile', ['automotive technician', 'mécanicien automobile'], [19, 29.89, 43.27],
    'automotive technician|auto mechanic|mechanic|mecanicien|mecanicienne|technicien automobile|310s|lube technician',
    'diagnostics|diagnostic|brakes|freins|engine repair|moteur|suspension|oil changes|vidange|scan tools|electrical systems|hybrid|red seal|sceau rouge|tires|pneus|alignment'),
  o('heavy-equipment-operator', '15029', '73400', 'trades', 'Heavy equipment operator', 'Conducteur ou conductrice d’équipement lourd', ['heavy equipment operator', 'opérateur machinerie lourde'], [24, 32.5, 45],
    'heavy equipment operator|equipment operator|operateur de machinerie lourde|conducteur d engins de chantier|excavator operator|loader operator',
    'excavator|pelle mecanique|loader|chargeuse|bulldozer|grader|niveleuse|backhoe|retrocaveuse|skid steer|earthmoving|terrassement|road construction|mining|mines'),
  o('truck-driver', '10553', '73300', 'transport', 'Truck driver', 'Camionneur ou camionneuse', ['truck driver', 'camionneur'], [19.45, 26.42, 37],
    'truck driver|camionneur|camionneuse|long haul driver|az driver|dz driver|class 1 driver|classe 1|chauffeur de camion|transport routier',
    'class 1|class a|az licence|dz licence|permis classe 1|logbook|hours of service|heures de service|pre trip inspection|ronde de securite|air brakes|freins a air|tdg|cross border|transfrontalier|reefer|flatbed'),
  o('delivery-driver', '21667', '75201', 'transport', 'Delivery driver', 'Chauffeur-livreur ou chauffeuse-livreuse', ['delivery driver', 'chauffeur livreur'], [15, 20, 29.35],
    'delivery driver|courier|chauffeur livreur|chauffeuse livreuse|messager|driver helper|route driver',
    'deliveries|livraisons|route planning|driver s licence|permis de conduire|clean driving record|dossier de conduite|scanners|parcels|colis|customer service|lifting'),
  o('warehouse-worker', '16702', '75101', 'transport', 'Warehouse worker', 'Manutentionnaire', ['warehouse worker', 'manutentionnaire'], [16.55, 22, 30.29],
    'warehouse worker|warehouse associate|material handler|manutentionnaire|preparateur de commandes|order picker|shipper receiver|expediteur|receptionnaire|forklift operator|cariste',
    'forklift|chariot elevateur|picking|cueillette|packing|emballage|shipping|expedition|receiving|reception|inventory|inventaire|rf scanner|pallet jack|transpalette|lifting|whmis|simdut'),
  o('construction-labourer', '8447', '75110', 'trades', 'Construction labourer', 'Journalier ou journalière en construction', ['construction labourer', 'journalier construction'], [18.25, 25, 40],
    'construction labourer|general labourer|journalier|journaliere|manoeuvre|labourer|construction helper|aide construction',
    'site cleanup|nettoyage de chantier|demolition|concrete|beton|lifting|power tools|outils electriques|whmis|simdut|working at heights|travail en hauteur|fall protection|safety boots|asp construction'),
  o('graphic-designer', '5703', '52120', 'creative', 'Graphic designer', 'Graphiste', ['graphic designer', 'graphiste'], [20, 31.25, 52.88],
    'graphic designer|graphiste|designer graphique|visual designer|ui designer|brand designer|illustrator',
    'adobe|photoshop|illustrator|indesign|figma|branding|image de marque|typography|typographie|layout|mise en page|logo|print|impression|social media graphics|motion graphics|after effects|canva'),
  o('marketing-specialist', '24727', '11202', 'creative', 'Marketing specialist', 'Spécialiste en marketing', ['marketing specialist', 'spécialiste marketing'], [20.5, 35.58, 57.44],
    'marketing specialist|marketing coordinator|coordonnateur marketing|specialiste en marketing|communications specialist|conseiller en communication|social media manager|digital marketer|content strategist',
    'social media|medias sociaux|seo|sem|google ads|google analytics|content|contenu|campaigns|campagnes|email marketing|hubspot|copywriting|redaction|branding|market research|communications|public relations|relations publiques'),
  o('hr-generalist', '274', '11200', 'office', 'Human resources professional', 'Professionnel ou professionnelle en ressources humaines', ['human resources', 'ressources humaines'], [26, 40.87, 59.77],
    'human resources|hr generalist|hr advisor|hr business partner|recruiter|recruteur|recruteuse|talent acquisition|conseiller en ressources humaines|conseillere en ressources humaines|chrp|crha',
    'recruitment|recrutement|onboarding|accueil et integration|employee relations|relations de travail|payroll|paie|hris|performance management|gestion du rendement|labour relations|employment standards|normes du travail|workday|interviews|entrevues'),
  o('social-worker', '23025', '41300', 'community', 'Social worker', 'Travailleur social ou travailleuse sociale', ['social worker', 'travailleur social'], [25, 38.46, 50.26],
    'social worker|travailleur social|travailleuse sociale|msw|bsw|case manager|intervenant social|intervenante sociale|child protection worker',
    'case management|gestion de cas|counselling|counseling|relation d aide|crisis intervention|intervention de crise|assessments|evaluations|mental health|sante mentale|child welfare|protection de la jeunesse|advocacy|trauma informed'),
  o('community-service-worker', '5066', '42201', 'community', 'Community service worker', 'Intervenant ou intervenante communautaire', ['community support worker', 'intervenant communautaire'], [19, 26, 36.06],
    'community service worker|community support worker|youth worker|outreach worker|intervenant communautaire|intervenante communautaire|travailleur de rue|educateur specialise|educatrice specialisee|peer support',
    'outreach|intervention|youth|jeunes|newcomers|nouveaux arrivants|mental health|sante mentale|addictions|dependances|harm reduction|reduction des mefaits|group facilitation|animation|case notes|nonviolent crisis intervention'),
  o('pharmacist', '18196', '31120', 'health', 'Pharmacist', 'Pharmacien ou pharmacienne', ['pharmacist', 'pharmacien'], [40, 55.49, 67],
    'pharmacist|pharmacien|pharmacienne|pharmd|clinical pharmacist',
    'dispensing|dispensation|medication review|revue de la medication|prescriptions|ordonnances|vaccinations|kroll|drug interactions|interactions medicamenteuses|patient counselling|compounding|pharmacy'),
  o('physiotherapist', '18214', '31202', 'health', 'Physiotherapist', 'Physiothérapeute', ['physiotherapist', 'physiothérapeute'], [30, 46.15, 56.21],
    'physiotherapist|physiotherapeute|physical therapist|pt|mpt',
    'rehabilitation|readaptation|exercise prescription|manual therapy|therapie manuelle|musculoskeletal|musculosquelettique|orthopedics|sports injuries|assessment|evaluation|treatment plans'),
  o('dental-assistant', '4475', '33100', 'health', 'Dental assistant', 'Assistant ou assistante dentaire', ['dental assistant', 'assistante dentaire'], [21, 27, 35],
    'dental assistant|assistant dentaire|assistante dentaire|cda|level ii dental assistant|dental receptionist',
    'chairside|au fauteuil|sterilization|sterilisation|radiographs|radiographies|x rays|infection control|prevention des infections|dentrix|abeldent|coronal polishing|impressions|patient care'),
  o('security-officer', '14299', '64410', 'public-safety', 'Security guard', 'Agent ou agente de sécurité', ['security guard', 'agent de sécurité'], [16.55, 21, 31.45],
    'security guard|security officer|agent de securite|agente de securite|gardien de securite|loss prevention|concierge security',
    'security licence|permis d agent de securite|bspp|patrols|rondes|access control|controle d acces|cctv|surveillance|incident reports|rapports d incident|first aid|premiers soins|emergency response|de escalation'),
  o('janitor', '14394', '65312', 'office', 'Janitor', 'Concierge ou préposé à l’entretien', ['janitor', 'concierge'], [16, 21.27, 28.72],
    'janitor|custodian|caretaker|concierge|prepose a l entretien|preposee a l entretien|cleaner|nettoyeur|building maintenance',
    'cleaning|nettoyage|floor care|entretien des planchers|whmis|simdut|waste removal|minor repairs|petites reparations|sanitation|salubrite|buffing|snow removal|deneigement'),
  o('farm-worker', '9297', '85100', 'agriculture', 'General farm worker', 'Ouvrier agricole ou ouvrière agricole', ['farm worker', 'ouvrier agricole'], [15, 20, 28],
    'farm worker|farm hand|ouvrier agricole|ouvriere agricole|agricultural worker|greenhouse worker|travailleur de serre|harvester|dairy worker',
    'harvesting|recolte|planting|plantation|livestock|betail|milking|traite|tractor|tracteur|greenhouse|serre|irrigation|feeding|alimentation des animaux|farm equipment|machinerie agricole'),
  o('mechanical-engineer', '2757', '21301', 'engineering', 'Mechanical engineer', 'Ingénieur mécanicien ou ingénieure mécanicienne', ['mechanical engineer', 'ingénieur mécanique'], [30, 45.67, 72.49],
    'mechanical engineer|ingenieur mecanique|ingenieure mecanique|ingenieur mecanicien|design engineer|p eng|eit|ing jr',
    'solidworks|autocad|catia|inventor|hvac|cvca|finite element|fea|thermodynamics|thermodynamique|gd t|manufacturing|fabrication|product design|conception|prototyping|matlab|ansys'),
  o('civil-engineer', '22376', '21300', 'engineering', 'Civil engineer', 'Ingénieur civil ou ingénieure civile', ['civil engineer', 'ingénieur civil'], [32, 48.56, 72.12],
    'civil engineer|ingenieur civil|ingenieure civile|structural engineer|ingenieur en structure|transportation engineer|geotechnical engineer|p eng|eit',
    'autocad|civil 3d|revit|structural design|conception structurale|site inspections|inspections de chantier|stormwater|eaux pluviales|roads|routes|bridges|ponts|geotechnical|project management|gestion de projet|concrete|beton'),
  o('paralegal', '16074', '42200', 'office', 'Paralegal', 'Parajuriste', ['paralegal', 'parajuriste'], [21.63, 33.05, 52.19],
    'paralegal|parajuriste|technicien juridique|technicienne juridique|legal assistant|adjointe juridique|law clerk|law office',
    'legal research|recherche juridique|drafting|redaction|court filings|depots au tribunal|litigation|litige|real estate law|immobilier|corporate records|registres|conveyancing|pclaw|clio|small claims'),
  o('police-officer', '21250', '42100', 'public-safety', 'Police officer', 'Policier ou policière', ['police officer', 'policier'], [32, 50, 64.1],
    'police officer|policier|policiere|constable|agent de police|rcmp|grc|special constable|by law officer',
    'law enforcement|application de la loi|patrol|patrouille|investigations|enquetes|report writing|redaction de rapports|de escalation|community policing|police communautaire|firearms|arrest|emergency response'),
  o('project-coordinator', '25781', '13100', 'office', 'Project coordinator', 'Chargé ou chargée de projet', ['project coordinator', 'chargé de projet'], [21, 29, 44.15],
    'project coordinator|project manager|charge de projet|chargee de projet|coordonnateur de projet|coordonnatrice de projet|program coordinator|pmp',
    'project management|gestion de projet|timelines|echeanciers|budgets|stakeholders|parties prenantes|ms project|asana|trello|jira|risk management|gestion des risques|meeting minutes|reporting|pmp|agile|scrum'),
  o('hairstylist', '16452', '63210', 'creative', 'Hairstylist', 'Coiffeur ou coiffeuse', ['hairstylist', 'coiffeur'], [15, 19.88, 30],
    'hairstylist|hair stylist|coiffeur|coiffeuse|barber|barbier|colourist|coloriste',
    'cutting|coupe|colouring|coloration|highlights|meches|blowouts|styling|braids|tresses|fades|clientele|salon|booking|rendez vous|product sales'),
  o('construction-project-manager', '24311', '70010', 'trades', 'Construction project manager', 'Directeur ou directrice de projets de construction', ['construction project manager', 'gestionnaire de projets construction'], [31.25, 48.72, 83.76],
    'construction project manager|construction manager|site superintendent|surintendant de chantier|directeur de projets de construction|estimator|estimateur|project engineer construction',
    'scheduling|echeancier|estimating|estimation|procore|tenders|appels d offres|subcontractors|sous traitants|budgets|site safety|sante securite chantier|change orders|ordres de changement|construction management|gestion de construction|pmp|gold seal'),
];

export const occupationByProfile = (id: string) => OCCUPATIONS.find((x) => x.profileId === id);

/** Both titles and both search keywords, as tool outputs carry them (the renderers never load this catalog). */
export const occupationNames = (o: Occupation) => ({ titles: o.title, search: o.search });

/** Match a free-text job title to the catalog (exact alias first, then contains). */
export function occupationFromTitle(text: string | undefined): Occupation | undefined {
  if (!text) return undefined;
  const f = fold(text);
  if (!f) return undefined;
  const exact = OCCUPATIONS.find((x) => x.titles.includes(f) || fold(x.title.en) === f || fold(x.title.fr) === f || fold(x.search.en) === f || fold(x.search.fr) === f);
  if (exact) return exact;
  // Longest alias contained in the text (e.g. "jobs as a registered nurse in Halifax").
  let best: { occ: Occupation; len: number } | undefined;
  for (const x of OCCUPATIONS) {
    for (const a of x.titles) {
      if (a.length < 4) continue;
      if (new RegExp(`(^| )${a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}s?( |$)`).test(f) && (!best || a.length > best.len)) best = { occ: x, len: a.length };
    }
  }
  return best?.occ;
}

/**
 * The keyword to search Job Bank with. The person's own words are kept ("nurse", "bartender"), so a
 * search never narrows or shifts what was asked for; the occupation still gives the pay context. Only an
 * occupation's formal title ("Infirmier autorisé ou infirmière autorisée" → "infirmier"), its keyword in
 * the other language ("welder" ⇄ "soudeur") and an acronym typed in capitals ("PSW") become Job Bank's
 * usual keyword.
 */
export function canonicalQuery(q: string, lang: Lang): string {
  const f = fold(q);
  const acronym = /^[A-Z0-9]{2,5}$/.test(q.trim());
  const o = OCCUPATIONS.find((x) => [x.title.en, x.title.fr, x.search.en, x.search.fr].some((w) => fold(w) === f) || (acronym && x.titles.includes(f)));
  return o ? o.search[lang] : q;
}
