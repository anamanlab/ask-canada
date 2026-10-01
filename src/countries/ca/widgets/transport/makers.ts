/**
 * Vehicle makers from Transport Canada's manufacturer list (find-vehicle-tire-child-car-seat-manufacturer, 2019-04-16;
 * CSV export read 2026-09-30): each maker's VIN recall lookup and customer line. Server side only. Links the list gives
 * as `http://` (Kia, Mopar) are stored as `https://`; both answer there (checked 2026-10-01).
 */
type Maker = { name: string; match: RegExp; url?: string; phone?: string; moto?: boolean };
const MAKERS: Maker[] = [
  { name: 'Acura', match: /^acura/i, url: 'https://www.acura.ca/recalls', phone: '1-888-922-8729' },
  { name: 'Alfa Romeo', match: /^alfa/i, url: 'https://recalls.mopar.ca/', phone: '1-800-465-2001' },
  { name: 'Audi', match: /^audi/i, url: 'https://www.audi.ca/en/recalls/', phone: '1-800-822-2834' },
  { name: 'BMW', match: /^bmw$/i, url: 'https://www.bmw.ca/en/ssl/VehicleRecall.html', phone: '1-800-567-2691' },
  { name: 'Chevrolet', match: /^chev/i, url: 'https://experience.gm.ca/en/ownercenter/recalls', phone: '1-800-263-3777' },
  { name: 'Buick', match: /^buick/i, url: 'https://experience.gm.ca/en/ownercenter/recalls', phone: '1-800-263-3777' },
  { name: 'Cadillac', match: /^cadillac/i, url: 'https://experience.gm.ca/en/ownercenter/recalls', phone: '1-800-263-3777' },
  { name: 'GMC', match: /^gmc/i, url: 'https://experience.gm.ca/en/ownercenter/recalls', phone: '1-800-263-3777' },
  { name: 'Chrysler', match: /^chrysler/i, url: 'https://recalls.mopar.ca/', phone: '1-800-465-2001' },
  { name: 'Dodge', match: /^dodge/i, url: 'https://recalls.mopar.ca/', phone: '1-800-465-2001' },
  { name: 'Jeep', match: /^jeep/i, url: 'https://recalls.mopar.ca/', phone: '1-800-465-2001' },
  { name: 'Ram', match: /^ram$/i, url: 'https://recalls.mopar.ca/', phone: '1-800-465-2001' },
  { name: 'Fiat', match: /^fiat/i, url: 'https://recalls.mopar.ca/', phone: '1-800-465-2001' },
  { name: 'Ferrari', match: /^ferrari/i, url: 'https://www.ferrari.com/en-US/auto/recall-campaigns', phone: '1-201-510-2369' },
  { name: 'Ford', match: /^ford/i, url: 'https://www.ford.ca/support/recalls/', phone: '1-800-565-3673' },
  { name: 'Lincoln', match: /^lincoln/i, url: 'https://www.lincolncanada.com/support/recalls/', phone: '1-800-387-9333' },
  { name: 'Genesis', match: /^genesis/i, url: 'https://recall.genesis.ca/en', phone: '1-866-999-9895' },
  { name: 'Honda', match: /^honda/i, url: 'https://www.honda.ca/recalls', phone: '1-888-946-6329' },
  { name: 'Hyundai', match: /^hyundai/i, url: 'https://recall.hyundaicanada.com/en', phone: '1-888-216-2626' },
  { name: 'Infiniti', match: /^infiniti/i, url: 'https://service.infiniti.ca/en/vin-recall', phone: '1-855-835-3855' },
  { name: 'Jaguar', match: /^jaguar/i, url: 'https://www.jaguar.com/en-ca/jdx/ownership/vin-recall.html', phone: '1-800-668-6257' },
  { name: 'Kia', match: /^kia/i, url: 'https://www.kia.ca/kia-recall', phone: '1-877-542-2886' },
  { name: 'Land Rover', match: /^land ?rover/i, url: 'https://www.landrover.ca/en/ownership/vin-recall.html', phone: '1-800-346-3493' },
  { name: 'Lexus', match: /^lexus/i, url: 'https://www.lexus.ca/lexus/en/secure/owners/campaigns', phone: '1-800-265-3987' },
  { name: 'Maserati', match: /^maserati/i, url: 'https://www.maserati.com/ca/en/ownership/service-assistance/recall-information', phone: '1-201-510-2369' },
  { name: 'Mazda', match: /^mazda/i, url: 'https://www.mazdarecalls.ca/', phone: '1-800-263-4680' },
  { name: 'Mercedes-Benz', match: /^mercedes/i, url: 'https://www.mercedes-benz.ca/en/recalls', phone: '1-800-387-0100' },
  { name: 'Mini', match: /^mini/i, url: 'https://www.mini.ca/en/owners/mini-recall', phone: '1-866-378-6464' },
  { name: 'Mitsubishi', match: /^mitsubishi/i, url: 'https://www.mitsubishi-motors.ca/en/owners/maintenance-service/mitsubishi-recalls', phone: '1-888-576-4878' },
  { name: 'Nissan', match: /^nissan/i, url: 'https://service.nissan.ca/en/vin-recall', phone: '1-855-835-3854' },
  { name: 'Porsche', match: /^porsche/i, phone: '1-800-767-7243' },
  { name: 'Subaru', match: /^subaru/i, url: 'https://www.subaru.ca/WebPage.aspx?WebSiteID=282&WebPageID=21091', phone: '1-800-894-4212' },
  { name: 'Suzuki', match: /^suzuki/i, url: 'https://www.suzuki.ca/recalls/', phone: '1-866-828-7252' },
  { name: 'Tesla', match: /^tesla/i, url: 'https://www.tesla.com/vin-recall-search', phone: '1-877-798-3752' },
  { name: 'Toyota', match: /^toyota|^scion/i, url: 'https://www.toyota.ca/toyota/en/my-toyota/recalls', phone: '1-888-869-6828' },
  { name: 'Volkswagen', match: /^(volkswagen|vw)/i, url: 'https://www.vw.ca/en/owners-and-drivers/recalls.html', phone: '1-800-822-8987' },
  { name: 'Volvo', match: /^volvo/i, url: 'https://www.volvocars.com/en-ca/l/recall-information/', phone: '1-800-663-8255' },
  { name: 'Harley-Davidson', match: /^harley/i, url: 'https://serviceinfo.harley-davidson.com/sip/vehicle/lookupForm', phone: '1-800-258-2464', moto: true },
  { name: 'Kawasaki', match: /^kawasaki/i, url: 'https://www.kawasaki.ca/en-ca/owner-center/recalls', phone: '1-416-445-7775', moto: true },
  { name: 'Yamaha', match: /^yamaha/i, url: 'https://www.yamaha-motor.ca/en/vehicle-status-2', phone: '1-800-267-8577', moto: true },
  { name: 'Can-Am (BRP)', match: /^(can-?am|brp)/i, url: 'https://can-am.brp.com/on-road/ca/en/owner-zone/safety-recalls.html', phone: '1-888-272-9222', moto: true },
  { name: 'Ducati', match: /^ducati/i, url: 'https://www.ducati.com/ca/en/service-maintenance/recall-campaign', phone: '1-844-688-4978', moto: true },
];

export const makerFor = (make: string) => MAKERS.find((m) => m.match.test(make.trim()));
