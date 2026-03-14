import type { Person } from '../types/genealogy';
import { getBirthEvent } from '../types/genealogy';

/** Map of country name variants (French, English, German, etc.) to ISO 3166-1 alpha-2 codes */
const COUNTRY_NAME_TO_CODE: Record<string, string> = {
  // France
  france: 'FR',
  // Romania
  roumanie: 'RO',
  romania: 'RO',
  rumänien: 'RO',
  // Serbia
  serbie: 'RS',
  serbia: 'RS',
  serbien: 'RS',
  // Austria
  autriche: 'AT',
  austria: 'AT',
  österreich: 'AT',
  // Germany
  allemagne: 'DE',
  germany: 'DE',
  deutschland: 'DE',
  // Russia
  russie: 'RU',
  russia: 'RU',
  russland: 'RU',
  // Moldova
  moldavie: 'MD',
  moldova: 'MD',
  // Hungary
  hongrie: 'HU',
  hungary: 'HU',
  ungarn: 'HU',
  // Czech Republic
  tchéquie: 'CZ',
  czechia: 'CZ',
  'czech republic': 'CZ',
  tschechien: 'CZ',
  // Italy
  italie: 'IT',
  italy: 'IT',
  italien: 'IT',
  // Switzerland
  suisse: 'CH',
  switzerland: 'CH',
  schweiz: 'CH',
  // Belgium
  belgique: 'BE',
  belgium: 'BE',
  belgien: 'BE',
  // Poland
  pologne: 'PL',
  poland: 'PL',
  polen: 'PL',
  // Ukraine
  ukraine: 'UA',
  // Croatia
  croatie: 'HR',
  croatia: 'HR',
  kroatien: 'HR',
  // Bosnia
  bosnie: 'BA',
  bosnia: 'BA',
  bosnien: 'BA',
  // Slovakia
  slovaquie: 'SK',
  slovakia: 'SK',
  slowakei: 'SK',
  // Slovenia
  slovénie: 'SI',
  slovenia: 'SI',
  slowenien: 'SI',
  // Bulgaria
  bulgarie: 'BG',
  bulgaria: 'BG',
  bulgarien: 'BG',
  // Turkey
  turquie: 'TR',
  turkey: 'TR',
  türkei: 'TR',
  // Spain
  espagne: 'ES',
  spain: 'ES',
  spanien: 'ES',
  // Portugal
  portugal: 'PT',
  // United Kingdom
  'royaume-uni': 'GB',
  'united kingdom': 'GB',
  england: 'GB',
  angleterre: 'GB',
  // Netherlands
  'pays-bas': 'NL',
  netherlands: 'NL',
  niederlande: 'NL',
  // Luxembourg
  luxembourg: 'LU',
  // USA
  'états-unis': 'US',
  'united states': 'US',
  usa: 'US',
  // Canada
  canada: 'CA',
  // Argentina
  argentine: 'AR',
  argentina: 'AR',
  // Brazil
  brésil: 'BR',
  brazil: 'BR',
  brasilien: 'BR',
  // Algeria
  algérie: 'DZ',
  algeria: 'DZ',
  algerien: 'DZ',
};

/** Fallback: known city names → country code, for places missing a parsed country field */
const CITY_TO_COUNTRY_CODE: Record<string, string> = {
  // Romania
  lenauheim: 'RO',
  lovrin: 'RO',
  // Serbia
  homolitz: 'RS',
  omoljica: 'RS',
  'pločica': 'RS',
  brestovac: 'RS',
  'knićanin': 'RS',
  // France
  carpentras: 'FR',
  'la roque-sur-pernes': 'FR',
  'la roques sur pernes': 'FR',
  riedseltz: 'FR',
  morscheld: 'FR',
  // Germany
  berghausen: 'DE',
  // Austria
  ottenschlag: 'AT',
  // Czech Republic
  'dürnholz': 'CZ',
  drnholec: 'CZ',
  // Moldova
  lazo: 'MD',
};

/** Convert an ISO 3166-1 alpha-2 code to a flag emoji via regional indicator symbols */
export function countryCodeToFlag(code: string): string {
  const upper = code.toUpperCase();
  if (upper.length !== 2) return '';
  return String.fromCodePoint(
    upper.charCodeAt(0) + 0x1F1A5,
    upper.charCodeAt(1) + 0x1F1A5,
  );
}

/** Get birth country flag emoji for a person, or empty string if unknown */
export function getBirthFlag(person: Person): string {
  const birth = getBirthEvent(person);
  if (!birth?.place) return '';

  // Try parsed country field first
  const country = birth.place.country;
  if (country) {
    const code = COUNTRY_NAME_TO_CODE[country.toLowerCase()];
    if (code) return countryCodeToFlag(code);
  }

  // Fallback: match city name against known cities
  const city = (birth.place.city || birth.place.original || '').toLowerCase();
  for (const [key, code] of Object.entries(CITY_TO_COUNTRY_CODE)) {
    if (city.includes(key)) return countryCodeToFlag(code);
  }

  return '';
}
