// src/logic/onboardingCards.js
// Which onboarding cards a new account sees (MultiStepOnboarding.js's
// STEPS, by key). No imports, so scripts/check-pickables.mjs can run it.
//
//   features  only when you pick your own tools: Level up ('auto') opens
//             them by stage, and My features is there any time
//   sectors   only with Life Areas in the app (Level up always has it)
//   dream     not for under-13s ('kid' band) until the founder decides how
//             to ask them (docs/north-star-plan-2026-10-17.md, 3.7)
// Everything else always shows. Light/dark is no longer a card (Settings).

export const ONBOARDING_CARDS = ['welcome', 'aim', 'dream', 'persona', 'start', 'features', 'name', 'sectors'];

export function cardApplies(key, { mode, hasLifeAreas, ageBand }) {
  if (key === 'dream') return ageBand !== 'kid';
  if (key === 'features') return mode !== 'auto';
  if (key === 'sectors') return mode === 'auto' || !!hasLifeAreas;
  return true;
}

// Indexes into `keys` of the cards that show, in order. The first always does.
export function shownCards(keys, ctx) {
  return keys.map((k, i) => i).filter(i => i === 0 || cardApplies(keys[i], ctx));
}
