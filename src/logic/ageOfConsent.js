// src/logic/ageOfConsent.js
//
// Age of Digital Consent (AODC) lookup — the age below which we need a
// parent/guardian's verified consent before creating a full account
// (COPPA in the US, GDPR-K equivalents elsewhere).
//
// NOT LEGAL ADVICE. This is a reasonable default table, not a substitute
// for your own legal counsel reviewing which jurisdictions you actually
// operate in — see Kids Web Services' own disclaimer on this same point
// (dev.epicgames.com/docs/kids-web-services/kws-overview). Update AODC_BY_COUNTRY
// if counsel gives you different numbers.
//
// Sources used to seed these defaults: COPPA (US, 13), UK Age Appropriate
// Design Code (13), and each EU member state's chosen GDPR Article 8
// digital-consent age (13-16, member states set their own).

export const DEFAULT_AODC = 13; // COPPA baseline; used for any country not listed below

// ISO 3166-1 alpha-2 country code -> age of digital consent.
// Only countries that deviate from the 13 default are listed.
export const AODC_BY_COUNTRY = {
  AT: 14, // Austria
  BG: 14, // Bulgaria
  CY: 14, // Cyprus
  CZ: 15, // Czechia
  DE: 16, // Germany
  ES: 14, // Spain
  FR: 15, // France
  GR: 15, // Greece
  HU: 16, // Hungary
  IE: 16, // Ireland
  IT: 14, // Italy
  LI: 16, // Liechtenstein
  LT: 14, // Lithuania
  LU: 16, // Luxembourg
  NL: 16, // Netherlands
  PL: 16, // Poland
  SI: 15, // Slovenia
  SK: 16, // Slovakia
};

export function ageOfDigitalConsent(countryCode) {
  const code = (countryCode || '').toUpperCase();
  return AODC_BY_COUNTRY[code] ?? DEFAULT_AODC;
}

// A 'YYYY-MM-DD' string as a LOCAL calendar date. `new Date('2013-09-28')`
// is UTC midnight, which is the evening of the 27th anywhere west of London —
// so in the US a child turning 13 tomorrow read as 13 today and skipped the
// consent step.
export function parseLocalDate(value) {
  if (value instanceof Date) return value;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value ?? ''));
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return new Date(value);
}

// Whole-years age as of today, from a 'YYYY-MM-DD' (or Date) birth date.
export function calculateAge(dateOfBirth) {
  const dob = parseLocalDate(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age -= 1;
  }
  return age;
}

// True if this person needs verified parental consent before we can give
// them a full account, given their birth date and where they live.
export function isMinorRequiringConsent(dateOfBirth, countryCode) {
  const age = calculateAge(dateOfBirth);
  if (age === null) return null; // caller should treat this as "don't know yet"
  return age < ageOfDigitalConsent(countryCode);
}
