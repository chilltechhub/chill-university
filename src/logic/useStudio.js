// src/logic/useStudio.js
// Everything a Studio surface needs about the person, in one place: their
// Builds (live, from buildService), and who they are in the app: their
// character, their pet (and its nickname), their room, and their Dream.
// `me` is what buildRender.js puts into a made thing.
//
// Used by the Studio screens and the Home card, so they all agree.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useUserProgress } from '../../context/UserProgressContext';
import { supabase } from '../api/supabaseClient';
import { loadBuilds, cachedBuilds, latestBuilds, onBuildsChange } from '../api/buildService';
import useCharacterLoadout from './useCharacterLoadout';
import usePetCare from './usePetCare';
import useDream from './useDream';
import { petLook } from './studio';

export default function useStudio() {
  const { level, points, rank, streakDays } = useUserProgress();
  const [userId, setUserId] = useState(undefined); // undefined until known
  const [builds, setBuilds] = useState(() => latestBuilds() || []);
  const loadout = useCharacterLoadout({ level, points, rank, streakDays });
  const petCare = usePetCare(userId || null, !!loadout.pet);
  const { dream } = useDream(userId || null);

  useEffect(() => {
    let alive = true;
    supabase.auth.getSession()
      .then(({ data }) => { if (alive) setUserId(data?.session?.user?.id || null); })
      .catch(() => { if (alive) setUserId(null); });
    return () => { alive = false; };
  }, []);

  useFocusEffect(useCallback(() => {
    if (userId === undefined) return undefined;
    let alive = true;
    const cached = cachedBuilds(userId);
    if (cached) setBuilds(cached);
    loadBuilds(userId).then(list => { if (alive) setBuilds(list); });
    const off = onBuildsChange((uid, list) => { if (alive && (uid || null) === (userId || null)) setBuilds(list); });
    return () => { alive = false; off(); };
  }, [userId]));

  const petName = petCare.nickname || loadout.pet?.name || null;
  const me = useMemo(() => ({ pet: petLook(loadout.pet, petCare.nickname), dream }), [loadout.pet, petCare.nickname, dream]);

  return {
    ready: userId !== undefined,
    userId: userId ?? null,
    builds,
    me,
    level: level || 1,
    outfit: loadout.outfit,
    accessory: loadout.accessory,
    pet: loadout.pet,
    petName,
    background: loadout.background,
    decor: loadout.decor,
  };
}
