// src/screens/ProfileScreen.js
//
// Player hub: character + pet + landscape backdrop, real progress stats,
// subject mastery, an honest awards grid, wardrobe customization (outfit /
// pet / accessory / background, each unlock-gated by real stats), and the
// identity fields (display name / bio) that used to be the whole screen.
// Preferences (topics, formats, daily goal, experience level) and account
// actions still live in SettingsScreen.

import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, StyleSheet, Alert, Modal, FlatList, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../api/supabaseClient';
import { useTheme } from '../../context/ThemeContext';
import { useUserProgress, SUBJECT_CONFIG } from '../../context/UserProgressContext';
import useCharacterLoadout from '../logic/useCharacterLoadout';
import useBonusRewards from '../logic/useBonusRewards';
import { OUTFITS, ACCESSORIES, unlockLabel } from '../data/characterOptions';
import { PET_TIERS, petUnlockLabel } from '../data/petOptions';
import { BACKGROUNDS, backgroundUnlockLabel } from '../data/backgroundOptions';
import { splitBadges } from '../data/badgeDefinitions';
import PlayerCharacter from '../components/PlayerCharacter';
import PetCompanion from '../components/PetCompanion';
import LandscapeBackground from '../components/LandscapeBackground';
import CharacterWalker from '../components/CharacterWalker';
import BadgeMedal from '../components/BadgeMedal';

const WARDROBE_TABS = [
  { key: 'outfitId', label: 'Outfit', icon: 'shirt-outline' },
  { key: 'petId', label: 'Pet', icon: 'paw-outline' },
  { key: 'accessoryId', label: 'Item', icon: 'flash-outline' },
  { key: 'backgroundId', label: 'Backdrop', icon: 'image-outline' },
];

export default function ProfileScreen() {
  const { colors: c, typography: t, spacing: s, radius: r } = useTheme();
  const styles = makeStyles(c, t, s, r);
  const navigation = useNavigation();
  const progress = useUserProgress();
  const { user, level, points, rank, streakDays, subjectProgress, gameplayStats, refreshDailyMissions } = progress;

  const stats = { level, points, rank, streakDays };
  const { ready: loadoutReady, outfit, pet, accessory, background, equip } = useCharacterLoadout(stats);
  const bonusRewards = useBonusRewards(user?.id, refreshDailyMissions);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [session, setSession] = useState(null);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [dirty, setDirty] = useState(false);
  const [wardrobeOpen, setWardrobeOpen] = useState(false);
  const [wardrobeTab, setWardrobeTab] = useState('outfitId');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data: { session: activeSession } } = await supabase.auth.getSession();
        if (!mounted) return;
        setSession(activeSession);
        const userId = activeSession?.user?.id;
        if (!userId) { setLoading(false); return; }

        const { data, error } = await supabase
          .from('profiles')
          .select('display_name, bio')
          .eq('id', userId)
          .maybeSingle();

        if (error) console.error('profile load error', error);
        if (data && mounted) {
          setDisplayName(data.display_name || '');
          setBio(data.bio || '');
        }
      } catch (err) {
        console.error('unexpected profile load error', err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const markDirty = (setter) => (val) => { setter(val); setDirty(true); };

  const handleSave = async () => {
    if (!session?.user?.id) return;
    if (displayName.trim().length < 2) {
      Alert.alert('Almost there', 'Display name needs to be at least 2 characters.');
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ display_name: displayName.trim(), bio: bio.trim() })
        .eq('id', session.user.id);

      if (error) {
        Alert.alert('Save error', error.message || 'Could not save profile.');
        return;
      }
      try {
        await supabase.auth.updateUser({ data: { display_name: displayName.trim() } });
      } catch (e) { console.warn('auth.updateUser warning', e); }
      setDirty(false);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !loadoutReady) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={c.gold} size="large" />
      </View>
    );
  }

  if (!session) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Not signed in</Text>
        <Text style={styles.subtitle}>Sign in to view or edit your profile.</Text>
      </View>
    );
  }

  const badgeCtx = { level, streakDays, points, subjectProgress, gameplayStats };
  const { earned: earnedBadges, locked: lockedBadges } = splitBadges(badgeCtx);

  const subjectRows = Object.entries(subjectProgress || {})
    .map(([key, sp]) => ({ key, cfg: SUBJECT_CONFIG[key] || { name: key, icon: '⭐', color: c.gold }, level: sp?.level || 0 }))
    .sort((a, b) => b.level - a.level)
    .slice(0, 6);

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Profile</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={styles.gearBtn}>
          <Ionicons name="settings-outline" size={22} color={c.text3} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        {/* ── Hero: character + pet on a landscape backdrop ─────────────── */}
        <LandscapeBackground background={background} height={200} style={styles.hero}>
          <CharacterWalker
            outfit={outfit} accessory={accessory} pet={pet} characterSize={110} petSize={48}
            rewards={bonusRewards.slots}
            onClaimReward={bonusRewards.claim}
            rewardPoints={bonusRewards.points}
          />
          <View style={styles.heroLabel}>
            <Text style={styles.heroName} numberOfLines={1}>{displayName || 'Player'}</Text>
            <Text style={styles.heroSub}>Level {level} · Rank #{rank}</Text>
          </View>
          <TouchableOpacity style={styles.customizeBtn} onPress={() => setWardrobeOpen(true)}>
            <Ionicons name="color-palette-outline" size={15} color="#fff" />
            <Text style={styles.customizeBtnText}>Customize</Text>
          </TouchableOpacity>
        </LandscapeBackground>

        {/* ── Stats ──────────────────────────────────────────────────────── */}
        <View style={styles.statsRow}>
          <StatChip label="Level" value={level} icon="trending-up-outline" c={c} t={t} s={s} r={r} />
          <StatChip label="Points" value={points.toLocaleString()} icon="star-outline" c={c} t={t} s={s} r={r} />
          <StatChip label="Streak" value={`${streakDays}d`} icon="flame-outline" c={c} t={t} s={s} r={r} />
          <StatChip label="Rank" value={`#${rank}`} icon="ribbon-outline" c={c} t={t} s={s} r={r} />
        </View>

        {/* ── Skills / subject mastery ───────────────────────────────────── */}
        <Text style={styles.sectionTitle}>Skills</Text>
        {subjectRows.length === 0 ? (
          <Text style={styles.emptyText}>Play a few games to start building subject mastery.</Text>
        ) : (
          <View style={styles.skillsGrid}>
            {subjectRows.map(row => (
              <View key={row.key} style={styles.skillCard}>
                <Text style={styles.skillIcon}>{row.cfg.icon}</Text>
                <Text style={styles.skillName} numberOfLines={1}>{row.cfg.name}</Text>
                <Text style={[styles.skillLevel, { color: row.cfg.color }]}>Lv {row.level}</Text>
              </View>
            ))}
          </View>
        )}

        {/* ── Awards ─────────────────────────────────────────────────────── */}
        <Text style={styles.sectionTitle}>Awards ({earnedBadges.length}/{earnedBadges.length + lockedBadges.length})</Text>
        <View style={styles.badgeGrid}>
          {[...earnedBadges, ...lockedBadges].map(badge => (
            <BadgeMedal key={badge.id} badge={badge} earned={earnedBadges.includes(badge)} />
          ))}
        </View>

        {/* ── Identity ───────────────────────────────────────────────────── */}
        <Text style={styles.sectionTitle}>Profile details</Text>
        <Text style={styles.label}>Display name</Text>
        <TextInput
          style={styles.input}
          value={displayName}
          onChangeText={markDirty(setDisplayName)}
          placeholder="Your name"
          placeholderTextColor={c.text4}
          autoCapitalize="words"
        />

        <Text style={styles.label}>Email</Text>
        <Text style={styles.value}>{session.user.email}</Text>

        <Text style={styles.label}>Bio</Text>
        <TextInput
          style={[styles.input, styles.bioInput]}
          value={bio}
          onChangeText={markDirty(setBio)}
          placeholder="A short bio (optional)"
          placeholderTextColor={c.text4}
          multiline
        />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveBtn, (!dirty || saving) && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={!dirty || saving}
        >
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save changes</Text>}
        </TouchableOpacity>
      </View>

      <WardrobeModal
        visible={wardrobeOpen}
        onClose={() => setWardrobeOpen(false)}
        tab={wardrobeTab}
        setTab={setWardrobeTab}
        loadout={{ outfit, pet, accessory, background }}
        stats={stats}
        equip={equip}
        styles={styles}
        c={c}
      />
    </View>
  );
}

function StatChip({ label, value, icon, c, t, s, r }) {
  return (
    <View style={{
      flex: 1, alignItems: 'center', backgroundColor: c.bg1, borderRadius: r.md,
      borderWidth: 1, borderColor: c.border, paddingVertical: s.md, marginHorizontal: 3,
    }}>
      <Ionicons name={icon} size={16} color={c.gold} />
      <Text style={{ fontSize: t.md, fontWeight: t.bold, color: c.text1, marginTop: 4 }}>{value}</Text>
      <Text style={{ fontSize: t.xs, color: c.text4 }}>{label}</Text>
    </View>
  );
}

function WardrobeModal({ visible, onClose, tab, setTab, loadout, stats, equip, styles, c }) {
  const TABLES = { outfitId: OUTFITS, petId: PET_TIERS, accessoryId: ACCESSORIES, backgroundId: BACKGROUNDS };
  const LABELERS = {
    outfitId: unlockLabel, petId: petUnlockLabel, accessoryId: unlockLabel, backgroundId: backgroundUnlockLabel,
  };
  const CURRENT = {
    outfitId: loadout.outfit.id, petId: loadout.pet.id, accessoryId: loadout.accessory.id, backgroundId: loadout.background.id,
  };

  const options = TABLES[tab];
  const labelFor = LABELERS[tab];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.wardrobeCard}>
          <View style={styles.wardrobeHeader}>
            <Text style={styles.modalTitle}>Customize</Text>
            <TouchableOpacity onPress={onClose}>
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
                <Ionicons name={wt.icon} size={15} color={tab === wt.key ? '#fff' : c.text3} />
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
                  onPress={() => equip(tab, item.id)}
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
  return (
    <View style={{ width: 56, height: 32, borderRadius: 6, overflow: 'hidden', flexDirection: 'row' }}>
      <View style={{ flex: 1, backgroundColor: item.sky[0] }} />
      <View style={{ flex: 1, backgroundColor: item.sky[1] }} />
    </View>
  );
}

const makeStyles = (c, t, s, r) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.bg0 },
  center: { flex: 1, backgroundColor: c.bg0, alignItems: 'center', justifyContent: 'center', padding: s.xl },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: s.xl, paddingTop: s.xxl, paddingBottom: s.md,
  },
  title: { fontSize: t.xl, fontWeight: t.bold, color: c.text1 },
  gearBtn: { padding: s.sm },
  subtitle: { fontSize: t.sm, color: c.text3, marginTop: s.sm, textAlign: 'center' },

  body: { paddingHorizontal: s.xl, paddingBottom: s.xl },

  hero: { marginBottom: s.lg, justifyContent: 'flex-end' },
  heroLabel: {
    position: 'absolute', left: 12, top: 10,
    backgroundColor: 'rgba(0,0,0,0.35)', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  heroName: { color: '#fff', fontWeight: t.bold, fontSize: t.md },
  heroSub: { color: '#fff', fontSize: t.xs, opacity: 0.9 },
  customizeBtn: {
    position: 'absolute', right: 10, top: 10,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: c.goldMid, borderRadius: r.md,
    paddingHorizontal: 10, paddingVertical: 6,
  },
  customizeBtnText: { color: '#fff', fontWeight: t.semibold, fontSize: t.xs },

  statsRow: { flexDirection: 'row', marginBottom: s.lg, marginHorizontal: -3 },

  sectionTitle: { fontSize: t.md, fontWeight: t.bold, color: c.text1, marginTop: s.md, marginBottom: s.sm },
  emptyText: { fontSize: t.sm, color: c.text4, marginBottom: s.md },

  skillsGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -3, marginBottom: s.md },
  skillCard: {
    width: '31%', margin: '1.16%', backgroundColor: c.bg1, borderRadius: r.md,
    borderWidth: 1, borderColor: c.border, alignItems: 'center', paddingVertical: s.md,
  },
  skillIcon: { fontSize: 20, marginBottom: 4 },
  skillName: { fontSize: t.xs, color: c.text2, marginBottom: 2, maxWidth: '90%' },
  skillLevel: { fontSize: t.sm, fontWeight: t.bold },

  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: s.md },

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
  wardrobeLockText: { fontSize: 10, color: c.text4, textAlign: 'center', marginTop: 2, maxWidth: '90%' },
  wardrobeEquippedText: { fontSize: 10, color: c.gold, fontWeight: t.bold, marginTop: 2 },

  label: { fontSize: t.xs, fontWeight: t.semibold, color: c.text4, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: s.sm, marginTop: s.md },
  value: { fontSize: t.md, color: c.text1, marginBottom: s.sm },
  input: {
    borderWidth: 1, borderColor: c.inputBorder, borderRadius: r.md,
    padding: s.md, fontSize: t.md, color: c.text1, backgroundColor: c.inputBg,
  },
  bioInput: { height: 90, textAlignVertical: 'top' },

  footer: { padding: s.xl, borderTopWidth: 0.5, borderTopColor: c.border },
  saveBtn: {
    backgroundColor: c.goldMid, borderRadius: r.md,
    paddingVertical: s.md + 2, alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnText: { color: '#fff', fontWeight: t.bold, fontSize: t.md },
});
