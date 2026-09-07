// src/config/legal.js
// The legal URLs the app links out to.
//
// ⚠️ SHIP BLOCKER — PRIVACY_POLICY_URL still points at a third party.
//
// Both onboarding flows show this link inside the parent/guardian consent
// step, directly under the paragraph describing what *this* app stores. It
// currently resolves to Kids Web Services' own corporate privacy policy —
// the vendor used for parent verification — which says nothing about this
// app's data practices.
//
// That is a problem on three fronts:
//   • App Store Review (5.1.1) and Google Play's Data Safety section both
//     require a policy that actually covers the app being submitted.
//   • Play's Families policy requires the privacy policy link to be the
//     developer's own for any app targeting children.
//   • COPPA verifiable parental consent means disclosing *your* collection,
//     use, and deletion practices — pointing at a vendor's page doesn't
//     satisfy that, and the consent checkbox right below this link is what
//     the app treats as consent having been given.
//
// There is already a privacy-policy.html in the chilltechhub-site repo —
// this just needs to point at wherever that is published.
export const PRIVACY_POLICY_URL = 'https://www.kidswebservices.com/privacy-policy';

// Set alongside the privacy policy when the marketing site has a terms page.
// Null hides the link rather than rendering a dead one.
export const TERMS_URL = null;
