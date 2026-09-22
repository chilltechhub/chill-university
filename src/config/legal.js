// src/config/legal.js
// The legal URLs the app links out to.
//
// Onboarding shows this link inside the parent/guardian consent step,
// directly under the paragraph describing what this app stores. It pointed
// at Kids Web Services' own corporate policy for a while — the vendor used
// for parent verification — which says nothing about this app's data
// practices.
//
// Why it has to be this app's own policy and not a vendor's:
//   • App Store Review (5.1.1) and Google Play's Data Safety section both
//     require a policy that actually covers the app being submitted.
//   • Play's Families policy requires the privacy policy link to be the
//     developer's own for any app targeting children.
//   • COPPA verifiable parental consent means disclosing *your* collection,
//     use, and deletion practices — pointing at a vendor's page doesn't
//     satisfy that, and the consent checkbox right below this link is what
//     the app treats as consent having been given.
//
// Resolved 2026-09-12: the marketing site is live and its policy page is
// published, so this now points at the developer's own policy as all three
// of the above require. (Canonical URL drops the .html — /privacy-policy.html
// 307s to /privacy-policy.) Verified reachable.
export const PRIVACY_POLICY_URL = 'https://chilltechhub.com/privacy-policy';

// The support address the Terms of Service give for account, billing and
// deletion questions. Help's FAQ and Settings > Contact support use it.
export const SUPPORT_EMAIL = 'help@chilltechhub.com';

// The app's own Terms of Service (published 2026-09-21, verified reachable).
// Covers Deskartes Plus auto-renewal and cancellation, so it doubles as the
// subscription Terms of Use both stores ask for — Google Play has no
// "standard EULA" fallback, so this is the link that satisfies Play.
export const TERMS_URL = 'https://chilltechhub.com/terms';

// Apple requires every auto-renewing subscription screen to link to Terms of
// Use (a EULA). TERMS_URL is that link now; Apple's standard EULA stays as
// the fallback only. The same link has to go in the App Store description.
export const APPLE_STANDARD_EULA_URL = 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/';
export const SUBSCRIPTION_TERMS_URL = TERMS_URL || APPLE_STANDARD_EULA_URL;
