// src/logic/useGradeLevel.js
// Replaces the old Beginner/Intermediate/Advanced skill-level system
// (useSkillLevel.js — now unused) with the same grade bands Classes.js
// already uses: K-2, 3-5, 6-8, 9-12. One difficulty model across the whole
// app, so a grade band picked here means the same thing it means there.

import { useState, useEffect, useCallback, useMemo } from 'react';
import { cacheRead, cacheWrite } from '../api/offlineCache';
import { useUserProgress } from '../../context/UserProgressContext';
import { AGE_BANDS, ageCategoryFromDob, isMinorBand } from './profileResolver';

export const GRADE_BANDS = [
  { key: 'K-2',  label: 'Grades K–2',  emoji: '🎒', icon: 'happy-outline',  tier: 1 },
  { key: '3-5',  label: 'Grades 3–5',  emoji: '✏️', icon: 'pencil-outline', tier: 2 },
  { key: '6-8',  label: 'Grades 6–8',  emoji: '📐', icon: 'book-outline',   tier: 3 },
  { key: '9-12', label: 'Grades 9–12', emoji: '🎓', icon: 'school-outline',tier: 4 },
];

// The same four bands, named for an adult. The content behind them is fine
// for adults (Mind Gym's top band is resilience, burnout and boundaries) —
// it's the "Grades K–2" framing that isn't, so only the labels change.
// Games that already relabel the bands their own way (tierLabels on
// GradeSelectCard — Register Ready, Shift Manager, Survive the Month) keep
// theirs.
export const ADULT_TIERS = {
  'K-2':  { label: 'Starter',      emoji: '🌱', icon: 'leaf-outline' },
  '3-5':  { label: 'Foundations',  emoji: '🧱', icon: 'layers-outline' },
  '6-8':  { label: 'Intermediate', emoji: '📈', icon: 'trending-up-outline' },
  '9-12': { label: 'Advanced',     emoji: '🏔️', icon: 'trophy-outline' },
};

// Age band when we actually know it — birth date first, then the stored
// age_category. Unlike ageBandFor() this returns null for unknown instead of
// guessing 'teen', so a guest keeps the old default rather than being
// treated as a known teenager.
function knownAgeBand(profile) {
  if (!profile) return null;
  const fromDob = ageCategoryFromDob(profile.date_of_birth);
  if (fromDob) return fromDob;
  return AGE_BANDS.includes(profile.age_category) ? profile.age_category : null;
}

/** True for a signed-in account known to be 18+ (young_adult and up). */
export function isAdultProfile(profile) {
  const band = knownAgeBand(profile);
  return !!band && !isMinorBand(band);
}

/**
 * Starting band before a player has picked one for a game. Adults start at
 * the top tier, teens at 6–8, and kids or unknown ages at 3–5 (the old
 * default for everyone). The adaptive tier moves them from there either way.
 */
export function defaultLevelFor(profile) {
  const band = knownAgeBand(profile);
  if (!band) return '3-5';
  if (!isMinorBand(band)) return '9-12';
  return band === 'teen' ? '6-8' : '3-5';
}

/** GRADE_BANDS, relabelled for adults. Same keys and tiers either way. */
export function bandsFor(profile) {
  if (!isAdultProfile(profile)) return GRADE_BANDS;
  return GRADE_BANDS.map(b => ({ ...b, ...ADULT_TIERS[b.key] }));
}

/**
 * The signed-in profile's view of the bands: the list to render, whether
 * they're adult-framed, and the default starting band. Guests read as
 * unknown age.
 */
export function useBandFraming() {
  const { user, profile } = useUserProgress();
  const p = user ? profile : null;
  return useMemo(() => ({
    adult: isAdultProfile(p),
    bands: bandsFor(p),
    defaultLevel: defaultLevelFor(p),
  }), [p]);
}

export function tierForLevel(bandKey) {
  return (GRADE_BANDS.find(b => b.key === bandKey) || GRADE_BANDS[1]).tier;
}

export function levelForTier(tier) {
  const clamped = Math.max(1, Math.min(4, Math.round(tier)));
  return GRADE_BANDS[clamped - 1].key;
}

const KEY = gameId => `gradeLevel:${gameId}`;

/**
 * Persisted grade-band picker for one game.
 * `level` is the saved/selected band key (e.g. '6-8'); `tier` is its 1-4
 * numeric form. With nothing saved for this game, `level` follows the
 * profile's age (defaultLevelFor) — derived rather than stored, so it's right
 * even when the profile loads after the cache read.
 *
 * Pass { byAge: false } for games whose bands are job experience rather than
 * difficulty-by-age (Register Ready's "Day One … Shift Lead"): an adult new
 * hire still starts at the start.
 */
export default function useGradeLevel(gameId, { byAge = true } = {}) {
  const { defaultLevel: ageDefault } = useBandFraming();
  const defaultLevel = byAge ? ageDefault : '3-5';
  const [picked, setPicked] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    setPicked(null);
    cacheRead(KEY(gameId)).then(saved => {
      if (!alive) return;
      if (saved && GRADE_BANDS.some(b => b.key === saved)) setPicked(saved);
      setReady(true);
    });
    return () => { alive = false; };
  }, [gameId]);

  const setLevel = useCallback((next) => {
    setPicked(next);
    cacheWrite(KEY(gameId), next);
  }, [gameId]);

  const level = picked || defaultLevel;

  return { level, setLevel, ready, tier: tierForLevel(level) };
}

/**
 * Reads the saved grade band for every game id given, without subscribing
 * to a component's lifecycle. Returns { [gameId]: bandKey | null } — null
 * means the player has never picked a band for that game.
 */
export async function getAllGradeLevels(gameIds) {
  const entries = await Promise.all(
    gameIds.map(async (id) => {
      const saved = await cacheRead(KEY(id));
      return [id, GRADE_BANDS.some(b => b.key === saved) ? saved : null];
    })
  );
  return Object.fromEntries(entries);
}
