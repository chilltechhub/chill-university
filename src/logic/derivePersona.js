// src/logic/derivePersona.js
// The account type, worked out instead of asked (docs/shake-up-plan-2026-10-21.md
// §7.2). The welcome no longer has a persona card, but createMasterProfile,
// the curriculum, Home's widgets, quests and experienceStages all still read
// one, so this keeps every one of them working.
//
//   a business Build      ENTREPRENEUR  (a choice they made beats where they start)
//   finishing school, GED STUDENT
//   anything else         PERSONAL
//
// No imports, so scripts/check-tailoring.mjs can run it.

export function derivePersona({ startPoint, buildKind } = {}) {
  if (buildKind === 'business') return 'ENTREPRENEUR';
  if (startPoint === 'highSchool' || startPoint === 'ged') return 'STUDENT';
  return 'PERSONAL';
}
