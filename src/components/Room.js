// src/components/Room.js
// Your room (docs/shake-up-plan-2026-10-21.md §5.2, P5): your backdrop and
// decor, your character and your pet, in one place you choose: You (the
// default, a 160px header) or Today (a 120px card), or nowhere. Practice
// keeps its own walking pet (GamesScreen), and the Studio and the welcome
// keep their own stages.
//
// The whole pet system works here as anywhere: it wanders, finds coins
// (useCoinRewards), gives its daily gift (useBonusRewards), gets hungry and
// is fed from the pet sheet. Calm draws a still frame: no walking.
//
// "Edit room" opens the one editor (RoomEditorSheet); the ⋯ moves it.

import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ON_ART } from '../ui';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useUserProgress } from '../../context/UserProgressContext';
import useCharacterLoadout from '../logic/useCharacterLoadout';
import useBonusRewards from '../logic/useBonusRewards';
import useCoinRewards from '../logic/useCoinRewards';
import usePetCare from '../logic/usePetCare';
import { bondLevel } from '../logic/petBond';
import useRoomPlace from '../logic/useRoomPlace';
import LandscapeBackground from './LandscapeBackground';
import CharacterWalker from './CharacterWalker';
import PlayerCharacter from './PlayerCharacter';
import PetCompanion from './PetCompanion';
import PetCareSheet from './PetCareSheet';
import MoreMenu from './MoreMenu';
import RoomEditorSheet from './RoomEditorSheet';

const PLACE_LABEL = { you: 'You', today: 'Today' };

export default function Room({ size = 160, calm = false, place = 'you', style }) {
  const { colors: c, typography: t, spacing: s, radius: r } = useTheme();
  const { user, level, points, rank, streakDays, gameplayStats, refreshDailyMissions } = useUserProgress();
  const stats = { level, points, rank, streakDays, played: gameplayStats?.totalProblemsAttempted || 0 };
  const loadout = useCharacterLoadout(stats);
  const { outfit, pet, accessory, background, decor } = loadout;
  const bonusRewards = useBonusRewards(user?.id, refreshDailyMissions);
  const coinRewards = useCoinRewards(user?.id);
  const petCare = usePetCare(user?.id, !!pet);
  const [petOpen, setPetOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [where, setRoomPlace] = useRoomPlace();
  const walkerRef = useRef(null);
  // A fresh pet sheet each time it opens (it reads the bowl on open).
  useEffect(() => { if (!pet) setPetOpen(false); }, [pet]);

  if (!loadout.ready || !outfit) {
    return <View style={[{ height: size, borderRadius: r.lg, backgroundColor: c.bg2 }, style]} />;
  }

  const other = place === 'today' ? 'you' : 'today';
  const menu = [
    { label: `Show on ${PLACE_LABEL[other]}`, icon: other === 'today' ? 'today-outline' : 'person-circle-outline', onPress: () => setRoomPlace(other) },
    { label: 'Hide my room', icon: 'eye-off-outline', onPress: () => setRoomPlace('off') },
    { label: 'Edit room', icon: 'brush-outline', onPress: () => setEditOpen(true) },
  ];
  const petName = petCare.nickname || pet?.name;
  const chip = { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999, backgroundColor: ON_ART.chip };

  return (
    <View style={style}>
      <View style={{ borderRadius: r.lg, overflow: 'hidden' }}>
        <LandscapeBackground background={background} height={size} level={level} decor={decor} style={{ width: '100%' }}>
          {calm ? (
            // Calm: a still frame, the character and the pet side by side.
            <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, bottom: 6, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 6 }}>
              <PlayerCharacter outfit={outfit} accessory={accessory} size={Math.round(size * 0.62)} />
              {!!pet && <PetCompanion pet={pet} size={Math.round(size * 0.27)} lying />}
            </View>
          ) : (
            <CharacterWalker
              ref={walkerRef}
              outfit={outfit} accessory={accessory} pet={pet}
              characterSize={Math.round(size * 0.62)} petSize={Math.round(size * 0.28)}
              rewards={bonusRewards.slots}
              onClaimReward={bonusRewards.claim}
              rewardPoints={bonusRewards.points}
              onCoinCollected={coinRewards.collect}
              coinRewardsRemaining={coinRewards.remaining}
              nextCoinAt={coinRewards.ready ? coinRewards.nextAt : Infinity}
              coinRewardPoints={coinRewards.points}
              showJumpArrow={false} tapToJump
              bowlX={decor?.bowlX}
              petHearts={pet && petCare.ready ? petCare.hearts : undefined}
              petName={petName} petLevel={bondLevel(petCare.bond).level} petGiftReady={petCare.giftReady}
              onPetPress={() => setPetOpen(true)}
            />
          )}
          <View style={{ position: 'absolute', top: 8, right: 8, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <TouchableOpacity onPress={() => setEditOpen(true)} accessibilityRole="button" accessibilityLabel="Edit your room" hitSlop={6} style={chip}>
              <Ionicons name="brush-outline" size={13} color={ON_ART.text} />
              <Text style={{ fontSize: 11, fontWeight: '700', color: ON_ART.text }}>Edit room</Text>
            </TouchableOpacity>
            <View style={[chip, { paddingHorizontal: 2, paddingVertical: 0 }]}>
              <MoreMenu items={menu} label={`Your room: show on ${PLACE_LABEL[other]}, hide or edit`} color={ON_ART.text} />
            </View>
          </View>
        </LandscapeBackground>
      </View>
      {where !== place && (
        <Text style={{ fontSize: t.xs, color: c.text3, marginTop: 4 }}>Moving to {where === 'off' ? 'nowhere' : PLACE_LABEL[where]}…</Text>
      )}
      <PetCareSheet visible={petOpen} onClose={() => setPetOpen(false)} pet={pet} />
      <RoomEditorSheet visible={editOpen} onClose={() => setEditOpen(false)} loadout={loadout} stats={stats}
        place={where} onPlace={setRoomPlace} />
    </View>
  );
}

/**
 * Where the room isn't: one line that says where it is and moves it here.
 * For You and Today when the room is placed elsewhere or hidden.
 */
export function RoomElsewhere({ here, style }) {
  const { colors: c, typography: t, spacing: s, radius: r, accent } = useTheme();
  const [where, setRoomPlace] = useRoomPlace();
  if (where === here) return null;
  return (
    <TouchableOpacity onPress={() => setRoomPlace(here)} accessibilityRole="button"
      accessibilityLabel={`Your room is ${where === 'off' ? 'hidden' : `on ${PLACE_LABEL[where]}`}. Show it here`}
      style={[{ flexDirection: 'row', alignItems: 'center', gap: s.sm, paddingHorizontal: s.md, paddingVertical: 10,
        borderRadius: r.lg, backgroundColor: c.bg1, borderWidth: 0.5, borderColor: c.border }, style]}>
      <Ionicons name="home-outline" size={16} color={c.text3} />
      <Text style={{ flex: 1, fontSize: t.sm, color: c.text3 }}>
        Your room is {where === 'off' ? 'hidden' : <>on <Text style={{ fontWeight: t.bold, color: c.text2 }}>{PLACE_LABEL[where]}</Text></>}
      </Text>
      <Text style={{ fontSize: t.sm, fontWeight: t.bold, color: accent.primary }}>Show here</Text>
    </TouchableOpacity>
  );
}
