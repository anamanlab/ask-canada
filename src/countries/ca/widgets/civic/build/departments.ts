/** News departments (pure; used by the news builder on the server, so the table stays out of the client bundle). */
import type { Lang } from '../data';

/**
 * Department URL slugs in canada.ca news links → applied titles (EN, FR). Unknown slugs fall back to a
 * tidied slug. Names follow the Federal Identity Program applied titles used on canada.ca.
 */
const DEPARTMENTS: { en: string; fr: string; name: { en: string; fr: string } }[] = [
  { en: 'housing-infrastructure-communities', fr: 'logement-infrastructures-collectivites', name: { en: 'Housing, Infrastructure and Communities Canada', fr: 'Logement, Infrastructures et Collectivités Canada' } },
  { en: 'global-affairs', fr: 'affaires-mondiales', name: { en: 'Global Affairs Canada', fr: 'Affaires mondiales Canada' } },
  { en: 'canadian-heritage', fr: 'patrimoine-canadien', name: { en: 'Canadian Heritage', fr: 'Patrimoine canadien' } },
  { en: 'correctional-service', fr: 'service-correctionnel', name: { en: 'Correctional Service Canada', fr: 'Service correctionnel du Canada' } },
  { en: 'employment-social-development', fr: 'emploi-developpement-social', name: { en: 'Employment and Social Development Canada', fr: 'Emploi et Développement social Canada' } },
  { en: 'innovation-science-economic-development', fr: 'innovation-sciences-developpement-economique', name: { en: 'Innovation, Science and Economic Development Canada', fr: 'Innovation, Sciences et Développement économique Canada' } },
  { en: 'department-finance', fr: 'ministere-finances', name: { en: 'Department of Finance Canada', fr: 'Ministère des Finances Canada' } },
  { en: 'natural-resources-canada', fr: 'ressources-naturelles-canada', name: { en: 'Natural Resources Canada', fr: 'Ressources naturelles Canada' } },
  { en: 'department-national-defence', fr: 'ministere-defense-nationale', name: { en: 'National Defence', fr: 'Défense nationale' } },
  { en: 'public-safety-canada', fr: 'securite-publique-canada', name: { en: 'Public Safety Canada', fr: 'Sécurité publique Canada' } },
  { en: 'transport-canada', fr: 'transports-canada', name: { en: 'Transport Canada', fr: 'Transports Canada' } },
  { en: 'environment-climate-change', fr: 'environnement-changement-climatique', name: { en: 'Environment and Climate Change Canada', fr: 'Environnement et Changement climatique Canada' } },
  { en: 'atlantic-canada-opportunities', fr: 'promotion-economique-canada-atlantique', name: { en: 'Atlantic Canada Opportunities Agency', fr: 'Agence de promotion économique du Canada atlantique' } },
  { en: 'agriculture-agri-food', fr: 'agriculture-agroalimentaire', name: { en: 'Agriculture and Agri-Food Canada', fr: 'Agriculture et Agroalimentaire Canada' } },
  { en: 'fisheries-oceans', fr: 'peches-oceans', name: { en: 'Fisheries and Oceans Canada', fr: 'Pêches et Océans Canada' } },
  { en: 'national-film-board', fr: 'office-national-film', name: { en: 'National Film Board of Canada', fr: 'Office national du film du Canada' } },
  { en: 'economic-development-quebec-regions', fr: 'developpement-economique-regions-quebec', name: { en: 'Canada Economic Development for Quebec Regions', fr: 'Développement économique Canada pour les régions du Québec' } },
  { en: 'public-services-procurement', fr: 'services-publics-approvisionnement', name: { en: 'Public Services and Procurement Canada', fr: 'Services publics et Approvisionnement Canada' } },
  { en: 'prairies-economic-development', fr: 'developpement-economique-prairies', name: { en: 'Prairies Economic Development Canada', fr: 'Développement économique Canada pour les Prairies' } },
  { en: 'border-services-agency', fr: 'agence-services-frontaliers', name: { en: 'Canada Border Services Agency', fr: 'Agence des services frontaliers du Canada' } },
  { en: 'canadian-coast-guard', fr: 'garde-cotiere-canadienne', name: { en: 'Canadian Coast Guard', fr: 'Garde côtière canadienne' } },
  { en: 'economic-development-southern-ontario', fr: 'developpement-economique-sud-ontario', name: { en: 'Federal Economic Development Agency for Southern Ontario', fr: 'Agence fédérale de développement économique pour le Sud de l’Ontario' } },
  { en: 'international-trade-tribunal', fr: 'tribunal-commerce-exterieur', name: { en: 'Canadian International Trade Tribunal', fr: 'Tribunal canadien du commerce extérieur' } },
  { en: 'pacific-economic-development', fr: 'developpement-economique-pacifique', name: { en: 'Pacific Economic Development Canada', fr: 'Développement économique Canada pour le Pacifique' } },
  { en: 'veterans-affairs-canada', fr: 'anciens-combattants-canada', name: { en: 'Veterans Affairs Canada', fr: 'Anciens Combattants Canada' } },
  { en: 'canada-water-agency', fr: 'agence-eau-canada', name: { en: 'Canada Water Agency', fr: 'Agence de l’eau du Canada' } },
  { en: 'crown-indigenous-relations-northern-affairs', fr: 'relations-couronne-autochtones-affaires-nord', name: { en: 'Crown-Indigenous Relations and Northern Affairs Canada', fr: 'Relations Couronne-Autochtones et Affaires du Nord Canada' } },
  { en: 'public-health', fr: 'sante-publique', name: { en: 'Public Health Agency of Canada', fr: 'Agence de la santé publique du Canada' } },
  { en: 'health-canada', fr: 'sante-canada', name: { en: 'Health Canada', fr: 'Santé Canada' } },
  { en: 'fednor', fr: 'fednor', name: { en: 'FedNor', fr: 'FedNor' } },
  { en: 'department-justice', fr: 'ministere-justice', name: { en: 'Department of Justice Canada', fr: 'Ministère de la Justice Canada' } },
  { en: 'women-gender-equality', fr: 'femmes-egalite-genres', name: { en: 'Women and Gender Equality Canada', fr: 'Femmes et Égalité des genres Canada' } },
  { en: 'competition-bureau', fr: 'bureau-concurrence', name: { en: 'Competition Bureau Canada', fr: 'Bureau de la concurrence Canada' } },
  { en: 'parks-canada', fr: 'parcs-canada', name: { en: 'Parks Canada', fr: 'Parcs Canada' } },
  { en: 'immigration-refugees-citizenship', fr: 'immigration-refugies-citoyennete', name: { en: 'Immigration, Refugees and Citizenship Canada', fr: 'Immigration, Réfugiés et Citoyenneté Canada' } },
  { en: 'indigenous-services-canada', fr: 'services-autochtones-canada', name: { en: 'Indigenous Services Canada', fr: 'Services aux Autochtones Canada' } },
  { en: 'impact-assessment-agency', fr: 'agence-evaluation-impact', name: { en: 'Impact Assessment Agency of Canada', fr: 'Agence d’évaluation d’impact du Canada' } },
  { en: 'northern-economic-development', fr: 'developpement-economique-nord', name: { en: 'Canadian Northern Economic Development Agency', fr: 'Agence canadienne de développement économique du Nord' } },
  { en: 'space-agency', fr: 'agence-spatiale', name: { en: 'Canadian Space Agency', fr: 'Agence spatiale canadienne' } },
  { en: 'radio-television-telecommunications', fr: 'radiodiffusion-telecommunications', name: { en: 'Canadian Radio-television and Telecommunications Commission', fr: 'Conseil de la radiodiffusion et des télécommunications canadiennes' } },
  { en: 'treasury-board-secretariat', fr: 'secretariat-conseil-tresor', name: { en: 'Treasury Board of Canada Secretariat', fr: 'Secrétariat du Conseil du Trésor du Canada' } },
  { en: 'institutes-health-research', fr: 'instituts-recherche-sante', name: { en: 'Canadian Institutes of Health Research', fr: 'Instituts de recherche en santé du Canada' } },
  { en: 'food-inspection-agency', fr: 'agence-inspection-aliments', name: { en: 'Canadian Food Inspection Agency', fr: 'Agence canadienne d’inspection des aliments' } },
  { en: 'intergovernmental-affairs', fr: 'affaires-intergouvernementales', name: { en: 'Intergovernmental Affairs', fr: 'Affaires intergouvernementales' } },
  { en: 'nuclear-safety-commission', fr: 'commission-surete-nucleaire', name: { en: 'Canadian Nuclear Safety Commission', fr: 'Commission canadienne de sûreté nucléaire' } },
  { en: 'canada-energy-regulator', fr: 'regie-energie-canada', name: { en: 'Canada Energy Regulator', fr: 'Régie de l’énergie du Canada' } },
  { en: 'revenue-agency', fr: 'agence-revenu', name: { en: 'Canada Revenue Agency', fr: 'Agence du revenu du Canada' } },
  { en: 'statistics-canada', fr: 'statistique-canada', name: { en: 'Statistics Canada', fr: 'Statistique Canada' } },
];

/** Department applied title from a canada.ca news link (…/en/<department-slug>/news/…). */
export function departmentOf(link: string, lang: Lang): string | undefined {
  const m = link.match(/canada\.ca\/(en|fr)\/([^/]+)\//);
  if (!m) return undefined;
  const slug = m[2];
  const d = DEPARTMENTS.find((x) => x.en === slug || x.fr === slug);
  if (d) return d.name[lang];
  const words = slug.replace(/-/g, ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}
