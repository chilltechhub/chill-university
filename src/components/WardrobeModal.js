// src/components/WardrobeModal.js
// Customize: outfit, pet, held item and backdrop, every one open (shake-up
// P5, §6.3). Moved out of ProfileScreen.js so the room editor
// (RoomEditorSheet.js) opens the same one from You or Today.

import React from 'react';
import { View, Text, TouchableOpacity, FlatList, Image, Modal, Switch, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { OUTFITS, ACCESSORIES, unlockLabel } from '../data/characterOptions';
import { PET_TIERS, petUnlockLabel } from '../data/petOptions';
import { BACKGROUNDS, backgroundUnlockLabel } from '../data/backgroundOptions';
import PlayerCharacter from './PlayerCharacter';
import PetCompanion from './PetCompanion';
import PixelArt from './PixelArt';
import { textOn } from '../logic/contrast';

const WARDROBE_TABS = [
  { key: 'outfitId', label: 'Outfit', icon: 'shirt-outline' },
  { key: 'petId', label: 'Pet', icon: 'paw-outline' },
  { key: 'accessoryId', label: 'Item', icon: 'flash-outline' },
  { key: 'backgroundId', label: 'Backdrop', icon: 'image-outline' },
];

// `styles` from the caller is ignored now: the sheet has its own.
export default function WardrobeModal({ visible, onClose, tab, setTab, loadout, stats, equip, heroTap, setHeroTap }) {
  const { colors: c, typography: t, spacing: s, radius: r } = useTheme();
  const styles = makeStyles(c, t, s, r);
  // How the character behaves, under the looks: what tapping it does (off,
  // it jumps and Training shows a small Profile button instead) and the walk
  // arrows. Always shown since 2026-10-15 ("tap to jump should be in the
  // character settings"); it used to wait until something was picked.
  const pick = (category, id) => { equip(category, id); };
  const TABLES = { outfitId: OUTFITS, petId: PET_TIERS, accessoryId: ACCESSORIES, backgroundId: BACKGROUNDS };
  const LABELERS = {
    outfitId: unlockLabel, petId: petUnlockLabel, accessoryId: unlockLabel, backgroundId: backgroundUnlockLabel,
  };
  const CURRENT = {
    outfitId: loadout.outfit.id, petId: loadout.pet?.id, accessoryId: loadout.accessory.id, backgroundId: loadout.background.id,
  };

  const options = TABLES[tab];
  const labelFor = LABELERS[tab];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.wardrobeCard}>
          <View style={styles.wardrobeHeader}>
            <Text style={styles.modalTitle}>Customize</Text>
            <TouchableOpacity accessibilityLabel="Close" accessibilityRole="button" onPress={onClose}>
              <Ionicons name="close" size={22} color={c.text3} />
            </TouchableOpacity>
          </View>

          <View style={styles.wardrobeTabs}>
            {WARDROBE_TABS.map(wt => (
              <TouchableOpacity
                key={wt.key}
                style={[styles.wardrobeTabBtn, tab === wt.key && styles.wardrobeTabBtnActive]}
                onPress={() => setTab(wt.key)}
              >
                <Ionicons name={wt.icon} size={15} color={tab === wt.key ? textOn(c.goldMid) : c.text3} />
                <Text style={[styles.wardrobeTabText, tab === wt.key && styles.wardrobeTabTextActive]}>{wt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <FlatList
            data={options}
            keyExtractor={o => o.id}
            numColumns={3}
            contentContainerStyle={{ paddingVertical: 12 }}
            renderItem={({ item }) => {
              const locked = labelFor(item, stats);
              const equipped = CURRENT[tab] === item.id;
              return (
                <TouchableOpacity
                  style={[styles.wardrobeOption, equipped && styles.wardrobeOptionActive, locked && styles.wardrobeOptionLocked]}
                  disabled={!!locked}
                  onPress={() => pick(tab, item.id)}
                >
                  <WardrobePreview tab={tab} item={item} />
                  <Text style={styles.wardrobeOptionName} numberOfLines={1}>{item.name}</Text>
                  {locked ? (
                    <Text style={styles.wardrobeLockText} numberOfLines={2}>{locked}</Text>
                  ) : equipped ? (
                    <Text style={styles.wardrobeEquippedText}>Equipped</Text>
                  ) : null}
                </TouchableOpacity>
              );
            }}
          />
          <View style={{ borderTopWidth: 0.5, borderTopColor: c.border, paddingTop: 12, marginTop: 4, gap: 10 }}>
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Ionicons name="hand-left-outline" size={16} color={c.text3} />
                <Text style={{ flex: 1, fontSize: t.sm, color: c.text1 }}>Tap your character to open <Text style={{ fontWeight: '700' }}>Profile</Text></Text>
                <Switch value={heroTap !== false} onValueChange={setHeroTap} accessibilityLabel="Tap your character to open Profile" />
              </View>
              <Text style={{ fontSize: t.xs, color: c.text3, marginTop: 4, marginLeft: 26 }}>
                {heroTap !== false ? 'Off: a tap makes them jump, and the jump arrow goes away.' : 'A tap makes them jump (no jump arrow). A Profile button sits in the corner of Training.'}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function WardrobePreview({ tab, item }) {
  if (tab === 'petId') return <PetCompanion pet={item} size={56} />;
  if (tab === 'outfitId') return <PlayerCharacter outfit={item} accessory={null} size={64} />;
  if (tab === 'accessoryId') {
    if (!item.sheet) return <View style={{ width: 56, height: 56 }} />;
    return <PetCompanion pet={item} size={56} />; // same crop-and-scale trick, any sheet works
  }
  // background: a real thumbnail for illustrated scenes, a two-tone sky
  // swatch for the tile-based ones
  if (item.kind === 'image') {
    // Explicit numeric width/height on the Image itself, not aspectRatio —
    // on web, an Image sized via aspectRatio (rather than a real number)
    // renders at its source's native pixel height instead, same issue as
    // LandscapeBackground.js. The box is already a fixed 56x32, so there's
    // nothing for aspectRatio to add here anyway.
    return (
      <View style={{ width: 56, height: 32, borderRadius: 6, overflow: 'hidden', backgroundColor: '#0a0a12' }}>
        <Image
          source={item.source}
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
          resizeMode="cover"
        />
      </View>
    );
  }
  if (item.kind === 'plain') {
    return <View style={{ width: 56, height: 32, borderRadius: 6, borderWidth: 1, borderStyle: 'dashed', borderColor: '#9aa3b5' /* style-ok: neutral outline for "no backdrop" in both modes */ }} />;
  }
  if (item.kind === 'room') {
    // A tiny room: wall, floor, and its window.
    return (
      <View style={{ width: 56, height: 32, borderRadius: 6, overflow: 'hidden', backgroundColor: '#e8dccb' /* style-ok: fixed room-wall swatch */, alignItems: 'center' }}>
        <PixelArt art="windowCream" height={18} style={{ marginTop: 3 }} />
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 8, backgroundColor: '#b8977a' /* style-ok: fixed room-floor swatch */ }} />
      </View>
    );
  }
  // Tile scenes: the two-tone sky, with their tallest prop standing in it.
  const hero = (item.props || []).reduce((best, p) => (!best || (p.scale || 1) > (best.scale || 1) ? p : best), null);
  return (
    <View style={{ width: 56, height: 32, borderRadius: 6, overflow: 'hidden', flexDirection: 'row' }}>
      <View style={{ flex: 1, backgroundColor: item.sky[0] }} />
      <View style={{ flex: 1, backgroundColor: item.sky[1] }} />
      {hero && (
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: 1, alignItems: 'center' }}>
          <PixelArt art={hero.art} height={26} />
        </View>
      )}
    </View>
  );
}

const makeStyles = (c, t, s, r) => StyleSheet.create({
  modalBackdrop: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center', justifyContent: 'flex-end',
  },
  wardrobeCard: {
    width: '100%', maxHeight: '78%', backgroundColor: c.bg1,
    borderTopLeftRadius: r.lg, borderTopRightRadius: r.lg,
    borderWidth: 1, borderColor: c.border,
    paddingHorizontal: s.xl, paddingTop: s.lg, paddingBottom: s.xl,
  },
  wardrobeHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: s.md },
  modalTitle: { fontSize: t.md, fontWeight: t.bold, color: c.text1 },

  wardrobeTabs: { flexDirection: 'row', gap: 6, marginBottom: s.sm },
  wardrobeTabBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
    paddingVertical: 8, borderRadius: r.md, backgroundColor: c.bg0, borderWidth: 1, borderColor: c.border,
  },
  wardrobeTabBtnActive: { backgroundColor: c.goldMid, borderColor: c.goldMid },
  wardrobeTabText: { fontSize: t.xs, fontWeight: t.semibold, color: c.text3 },
  wardrobeTabTextActive: { color: '#fff' },

  wardrobeOption: {
    flex: 1, margin: 4, alignItems: 'center', backgroundColor: c.bg0,
    borderRadius: r.md, borderWidth: 1, borderColor: c.border, paddingVertical: 10,
  },
  wardrobeOptionActive: { borderColor: c.gold, borderWidth: 2 },
  wardrobeOptionLocked: { opacity: 0.45 },
  wardrobeOptionName: { fontSize: t.xs, fontWeight: t.semibold, color: c.text1, marginTop: 6, maxWidth: '90%' },
  wardrobeLockText: { fontSize: 11, color: c.text3, textAlign: 'center', marginTop: 2, maxWidth: '90%' },
  wardrobeEquippedText: { fontSize: 11, color: c.gold, fontWeight: t.bold, marginTop: 2 },
});
