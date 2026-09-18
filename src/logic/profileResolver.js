// src/logic/profileResolver.js
//
// The one place that answers "who is this, for tailoring purposes?" Today
// that's the age band; the plan (.claude/plans/life-areas-action-first.md)
// grows it into resolveProfile() — areas, actions, wording, gates — so every
// screen reads one answer instead of re-deciding.
//
// ─── Why age comes from here and not from profiles.is_minor ──────────────────
// is_minor is the DIGITAL-CONSENT flag: isMinorRequiringConsent() sets it for
// anyone under the age of digital consent, which is 13 in the US and 13–16 in
// the EU. It is right for the parent-consent flow and wrong for everything
// else. Persona gating read it as "under 18", so a 15-year-old in the US was
// offered Business and Entrepreneur profiles. Anything that means "is this
// person a child or a teen" reads the band below, from the birth date.
//
// No imports: kept pure so data files and scripts can use it too.

export const AGE_BANDS = ['kid', 'teen', 'young_adult', 'adult', 'professional'];
export const MINOR_BANDS = ['kid', 'teen'];

// Band for a birth date. Keys match what recommendationEngine.scoreItem()
// and the area_actions / area_resources age_bands columns expect.
export function ageCategoryFromDob(dob) {
  if (!dob) return null;
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return null;

  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const monthDelta = now.getMonth() - birth.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && now.getDate() < birth.getDate())) age -= 1;

  if (age < 13) return 'kid';
  if (age < 18) return 'teen';
  if (age < 26) return 'young_adult';
  if (age <= 40) return 'adult';
  return 'professional';
}

// The band to tailor for. Birth date first — it's always current, where the
// stored age_category was computed at onboarding and goes stale as people
// age. Unknown (a guest, or no birth date on file) reads as 'teen': no adult
// content, and no talking down to an adult who skipped the question.
export function ageBandFor(profile) {
  if (!profile) return 'teen';
  const fromDob = ageCategoryFromDob(profile.date_of_birth);
  if (fromDob) return fromDob;
  if (AGE_BANDS.includes(profile.age_category)) return profile.age_category;
  return 'teen';
}

export const isMinorBand = (band) => MINOR_BANDS.includes(band);

// For content that carries an age_bands list (area_actions, area_resources,
// and app_content rows with meta.age_bands). No list means everyone.
export function bandAllows(bands, band) {
  return !Array.isArray(bands) || bands.length === 0 || bands.includes(band);
}
