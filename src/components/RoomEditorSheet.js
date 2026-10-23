// src/components/RoomEditorSheet.js
// The one room editor (docs/shake-up-plan-2026-10-21.md §5.2, P5): where the
// room shows (You, Today or hidden), your pet-food points, and Wardrobe ·
// Decorate · Pet · Trophies. It opens from the room wherever it is, so You
// and Today edit the same room. Each part opens its own sheet (the
// wardrobe, the decorate canvas, the pet's care sheet with feeding) and
// comes back here when it closes.
//
// Points live here and in the pet sheet now, not in the top bar: they're
// the pet's food (useSpendablePoints), the one currency left.

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useUserProgress } from '../../context/UserProgressContext';
import { useSpendablePoints } from '../logic/usePetCare';
import useSetting, { SETTING_KEYS } from '../logic/useSetting';
import { earnedTrophyCount } from '../logic/stageDecor';
import WardrobeModal from './WardrobeModal';
import DecorateSheet from './DecorateSheet';
import PetCareSheet from './PetCareSheet';

const PLACES = [['you', 'You'], ['today', 'Today'], ['off', 'Hide']];

export default function RoomEditorSheet({ visible, onClose, loadout, stats, place, onPlace }) {
  const { colors: c, typography: t, spacing: s, radius: r, accent } = useTheme();
  const { user, points } = useUserProgress();
  const wallet = useSpendablePoints(user?.id, points);
  const [open, setOpen] = useState(null); // 'wardrobe' | 'decorate' | 'pet' | null
  const [tab, setTab] = useState('outfitId');
  const [heroTap, setHeroTap] = useSetting(SETTING_KEYS.HERO_TAP_TO_PROFILE, true);
  const { outfit, pet, accessory, background, decor, equip, saveDecor } = loadout || {};
  const trophies = earnedTrophyCount();

  const parts = [
    { key: 'wardrobe', icon: 'shirt-outline', label: 'Wardrobe', sub: 'Outfit, item, backdrop, pet' },
    { key: 'decorate', icon: 'brush-outline', label: 'Decorate', sub: 'Place, move and size things' },
    pet && { key: 'pet', icon: 'paw-outline', label: 'Pet', sub: 'Feed and look after it' },
    { key: 'trophies', icon: 'trophy-outline', label: 'Trophies',
      sub: trophies ? `${trophies} earned. Place them in Decorate` : 'Master a Build in the Studio to earn one' },
  ].filter(Boolean);
  const pick = (key) => setOpen(key === 'trophies' ? 'decorate' : key);

  return (
    <>
      <Modal visible={visible && !open} transparent animationType="slide" onRequestClose={onClose}>
        <TouchableOpacity activeOpacity={1} onPress={onClose} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }}>
          <TouchableOpacity activeOpacity={1} style={{ backgroundColor: c.bg1, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: s.lg, paddingBottom: s.xxl }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: s.md }}>
              <Text style={{ flex: 1, fontSize: t.lg, fontWeight: t.bold, color: c.text1 }}>Your room</Text>
              <TouchableOpacity onPress={onClose} accessibilityRole="button" accessibilityLabel="Close">
                <Ionicons name="close" size={22} color={c.text3} />
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: t.xs, fontWeight: t.bold, color: c.text3, marginBottom: 6 }}>SHOW IT ON</Text>
            <View style={{ flexDirection: 'row', padding: 3, borderRadius: r.md, backgroundColor: c.bg2, marginBottom: s.md }} accessibilityRole="radiogroup">
              {PLACES.map(([key, label]) => {
                const on = place === key;
                return (
                  <TouchableOpacity key={key} onPress={() => onPlace?.(key)} accessibilityRole="radio" accessibilityState={{ selected: on }}
                    accessibilityLabel={key === 'off' ? 'Hide my room' : `Show my room on ${label}`}
                    style={{ flex: 1, alignItems: 'center', paddingVertical: 7, borderRadius: r.sm, backgroundColor: on ? c.bg1 : 'transparent' }}>
                    <Text style={{ fontSize: t.sm, fontWeight: on ? t.bold : t.semibold, color: on ? c.text1 : c.text3 }}>{label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {parts.map(p => (
              <TouchableOpacity key={p.key} onPress={() => pick(p.key)} accessibilityRole="button" accessibilityLabel={`${p.label}. ${p.sub}`}
                style={{ flexDirection: 'row', alignItems: 'center', gap: s.md, paddingVertical: 11, borderTopWidth: 0.5, borderTopColor: c.border }}>
                <Ionicons name={p.icon} size={20} color={accent.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: t.md, fontWeight: t.semibold, color: c.text1 }}>{p.label}</Text>
                  <Text style={{ fontSize: t.xs, color: c.text3 }}>{p.sub}</Text>
                </View>
                <Ionicons name="chevron-forward" size={15} color={c.text4} />
              </TouchableOpacity>
            ))}

            {!!pet && (
              <Text style={{ fontSize: t.xs, color: c.text2, textAlign: 'center', marginTop: s.md }}>
                <Text style={{ fontWeight: t.bold }}>{wallet.toLocaleString()}</Text> points for pet food
              </Text>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {!!outfit && (
        <WardrobeModal visible={visible && open === 'wardrobe'} onClose={() => setOpen(null)} tab={tab} setTab={setTab}
          loadout={{ outfit, pet, accessory, background }} stats={stats} equip={equip} heroTap={heroTap} setHeroTap={setHeroTap} />
      )}
      {!!background && (
        <DecorateSheet visible={visible && open === 'decorate'} onClose={() => setOpen(null)}
          background={background} level={stats?.level} decor={decor} pet={pet}
          onSave={(layout) => saveDecor?.(background.id, layout)} />
      )}
      {!!pet && <PetCareSheet visible={visible && open === 'pet'} onClose={() => setOpen(null)} pet={pet} />}
    </>
  );
}
