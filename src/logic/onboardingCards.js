// src/logic/onboardingCards.js
// Which onboarding cards a new account sees (MultiStepOnboarding.js's
// STEPS, by key). No imports, so scripts/check-pickables.mjs can run it.
//
//   features  only when you pick your own tools: Level up ('auto') opens
//             them by stage, and My features is there any time
//   sectors   only with Life Areas in the app (Level up always has it)
// Everything else always shows. Light/dark is no longer a card (Settings).

export const ONBOARDING_CARDS = ['welcome', 'aim', 'persona', 'start', 'features', 'name', 'sectors'];

export function cardApplies(key, { mode, hasLifeAreas }) {
  if (key === 'features') return mode !== 'auto';
  if (key === 'sectors') return mode === 'auto' || !!hasLifeAreas;
  return true;
}

// Indexes into `keys` of the cards that show, in order. The first always does.
export function shownCards(keys, ctx) {
  return keys.map((k, i) => i).filter(i => i === 0 || cardApplies(keys[i], ctx));
}
