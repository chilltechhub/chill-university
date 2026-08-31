// src/logic/useCharacterLoadout.js
// Persists which cosmetics the player has equipped — outfit, accessory,
// pet tier, and background — the same local-first pattern as
// useGradeLevel.js (AsyncStorage via offlineCache, no backend migration
// required). Equipping something the player hasn't unlocked yet is
// rejected here, not just hidden in the UI, so the rule can't be bypassed
// by calling setters directly.
//
// There's no separate skin/hair slot: 32rogues outfits are full character
// sprites, so the outfit choice fully determines how the character looks.

import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { cacheRead, cacheWrite } from '../api/offlineCache';
import { OUTFITS, ACCESSORIES, DEFAULT_OUTFIT_ID, DEFAULT_ACCESSORY_ID } from '../data/characterOptions';
import { PET_TIERS, DEFAULT_PET_ID } from '../data/petOptions';
import { BACKGROUNDS, DEFAULT_BACKGROUND_ID } from '../data/backgroundOptions';

const KEY = 'characterLoadout';

const DEFAULT_LOADOUT = {
  outfitId: DEFAULT_OUTFIT_ID,
  accessoryId: DEFAULT_ACCESSORY_ID,
  petId: DEFAULT_PET_ID,
  backgroundId: DEFAULT_BACKGROUND_ID,
};

function findUnlocked(list, id, stats) {
  const found = list.find(o => o.id === id);
  return found && found.unlock(stats) ? found : list.find(o => o.unlock(stats)) || list[0];
}

export default function useCharacterLoadout(stats) {
  const [loadout, setLoadoutState] = useState(DEFAULT_LOADOUT);
  const [ready, setReady] = useState(false);

  // Re-read from storage every time the screen using this hook regains
  // focus, not just on first mount — each screen (Home, Profile, ...)
  // holds its own copy of this state, so equipping something on Profile
  // wouldn't otherwise reach Home's already-mounted copy until a full
  // reload.
  useFocusEffect(
    useCallback(() => {
      let alive = true;
      cacheRead(KEY).then(saved => {
        if (!alive) return;
        setLoadoutState(saved && typeof saved === 'object' ? { ...DEFAULT_LOADOUT, ...saved } : DEFAULT_LOADOUT);
        setReady(true);
      });
      return () => { alive = false; };
    }, [])
  );

  const persist = useCallback((next) => {
    setLoadoutState(next);
    cacheWrite(KEY, next);
  }, []);

  const equip = useCallback((category, id) => {
    const table = { outfitId: OUTFITS, accessoryId: ACCESSORIES, petId: PET_TIERS, backgroundId: BACKGROUNDS }[category];
    if (!table) return;
    const option = table.find(o => o.id === id);
    if (!option || !option.unlock(stats)) return; // can't equip something not yet unlocked
    persist({ ...loadout, [category]: id });
  }, [loadout, persist, stats]);

  // If a stat regresses somehow (shouldn't normally happen) or a saved
  // choice no longer resolves, fall back to something the player has
  // actually unlocked rather than rendering a broken/locked combo.
  const safeOutfit = findUnlocked(OUTFITS, loadout.outfitId, stats);
  const safeAccessory = findUnlocked(ACCESSORIES, loadout.accessoryId, stats);
  const safePet = findUnlocked(PET_TIERS, loadout.petId, stats);
  const safeBackground = findUnlocked(BACKGROUNDS, loadout.backgroundId, stats);

  return {
    ready,
    outfit: safeOutfit,
    accessory: safeAccessory,
    pet: safePet,
    background: safeBackground,
    equip,
  };
}
