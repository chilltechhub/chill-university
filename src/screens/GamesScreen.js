// src/screens/GamesScreen.js — the Training Center hub: pick a drill, check
// your progress, and see what's up next in your objectives.
import React, { useState, useCallback, useRef, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Modal, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useUserProgress, SUBJECT_CONFIG } from '../../context/UserProgressContext';
import { useTheme } from '../../context/ThemeContext';
import { useUIPrefs } from '../../context/UIPrefsContext';
import { RANK_LABELS, FONTS } from '../theme';
import LevelRing from '../components/LevelRing';
import MissionsScreen from './MissionsScreen';
import { getEnabledGames, MECHANIC_META } from '../services/gameRegistry';
import { GRADE_BANDS, getAllGradeLevels } from '../logic/useGradeLevel';
import useCharacterLoadout from '../logic/useCharacterLoadout';
import useBonusRewards from '../logic/useBonusRewards';
import useCoinRewards from '../logic/useCoinRewards';
import useSetting, { SETTING_KEYS } from '../logic/useSetting';
import { useFeatureFlag, useConfigValue } from '../../context/RemoteConfigContext';
import TourSpot from '../components/TourSpot';
import LandscapeBackground from '../components/LandscapeBackground';
import CharacterWalker from '../components/CharacterWalker';

// Single source of truth: src/services/gameRegistry.js. GamesScreen and
// GameFeed both read from it now, so a game's id/subject/icon can never
// drift between the grid and the swipe feed again.
//
// GAMES_MASTER is every code-enabled game; HomeScreen imports this same
// master list and applies its own copy of the 'disabled_games' filter
// below rather than a pre-filtered export, since a module-level constant
// can't react to that config arriving after this file already evaluated
// it (see the component body for the actual reactive `GAMES`).
export const GAMES_MASTER = getEnabledGames().map(g => ({
  key: g.id,
  title: g.name,
  emoji: g.icon,
  subject: g.subjectLabel,
  mechanic: g.mechanic,
  color: g.color,
  desc: g.desc,
}));
const GAME_IDS = GAMES_MASTER.map(g => g.key);
const { width: SW } = Dimensions.get('window');

const TABS = ['Overview', 'Training', 'Progress'];

// Order matters here — it's the order the "Type" filter chips render in.
const MECHANIC_FILTERS = ['All', 'quiz', 'matching', 'building', 'strategy', 'thinking', 'fun', 'racing', 'puzzle', 'survival', 'cards', 'sports'];

const LEVEL_TINT = {
  'K-2': '#3fcf9e', '3-5': '#8fd3ff', '6-8': '#e8b34a', '9-12': '#e05858',
};
const LEVEL_META = Object.fromEntries(GRADE_BANDS.map(l => [l.key, l]));

// Ionicon fallback for SUBJECT_CONFIG's emoji-only `icon` field, used only
// when the emoji toggle is off — doesn't touch SUBJECT_CONFIG itself since
// that's shared across many other screens.
const SUBJECT_ICON = {
  math: 'calculator-outline', language_arts: 'book-outline', science: 'flask-outline',
  health: 'fitness-outline', finance: 'cash-outline', home_ec: 'construct-outline',
  social_studies: 'globe-outline', arts: 'color-palette-outline', technology: 'laptop-outline',
  foreign_language: 'chatbubbles-outline', mental: 'bulb-outline', social_skills: 'people-outline',
  career: 'compass-outline', general: 'star-outline',
};

export default function GamesScreen() {
  const { user, profile, points, rank, level, gameplayStats, progress, streakDays, subjectProgress, refreshDailyMissions } = useUserProgress();
  const { colors: c, typography: t, spacing: s, radius: r, shadows: sh } = useTheme();
  const { showEmojis, showSubtext } = useUIPrefs();
  const navigation = useNavigation();
  const { outfit, pet, accessory, background } = useCharacterLoadout({ level, points, rank, streakDays });
  const bonusRewards = useBonusRewards(user?.id, refreshDailyMissions);
  const coinRewards = useCoinRewards(user?.id);
  const [heroTapEnabled] = useSetting(SETTING_KEYS.HERO_TAP_TO_PROFILE, true);
  const heroWalkerRef = useRef(null);
  // Remote feature flag — flip app_config.show_leaderboard off in Supabase
  // to hide this for everyone with no app update. Defaults on if the row
  // doesn't exist yet.
  const showLeaderboard = useFeatureFlag('show_leaderboard', true);
  // Admin-side kill switch — an array of game ids in app_config's
  // 'disabled_games' row (Supabase → Table Editor, no build/redeploy
  // needed) — e.g. hide a game that shipped broken until it's fixed.
  const disabledGameIds = useConfigValue('disabled_games', []);
  const GAMES = useMemo(
    () => GAMES_MASTER.filter(g => !disabledGameIds.includes(g.key)),
    [disabledGameIds]
  );
  const [activeTab, setActiveTab] = useState('Overview');
  const [showMissions, setShowMissions] = useState(false);
  const [showTasks, setShowTasks] = useState(false);
  const [gameFilter, setGameFilter] = useState('All');
  const [mechanicFilter, setMechanicFilter] = useState('All');
  const [skillLevels, setSkillLevels] = useState({});
  const styles = makeStyles(c, t, s, r, sh);
  // display_name first, matching Home/Profile/Settings — profile.username
  // is just the email's local-part set at signup (see LoginScreen.js) and
  // never updated after that, so leading with it here showed the raw
  // signup email as this screen's header instead of the chosen name.
  const displayName = profile?.traveler_name || profile?.display_name || profile?.username || 'Adventurer';

  // Refresh saved skill levels whenever this screen regains focus, so a
  // level picked mid-game shows up here as soon as you back out.
  useFocusEffect(
    useCallback(() => {
      let alive = true;
      getAllGradeLevels(GAME_IDS).then(map => { if (alive) setSkillLevels(map); });
      return () => { alive = false; };
    }, [])
  );

  const accuracy = gameplayStats?.totalProblemsAttempted
    ? Math.round(gameplayStats.totalProblemsCorrect / gameplayStats.totalProblemsAttempted * 100)
    : null;
  const trainedCount = Object.values(skillLevels).filter(Boolean).length;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.eyebrow}>TRAINING CENTER</Text>
        <Text style={styles.name}>{displayName}</Text>
        <View style={styles.tabs}>
          {TABS.map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab}
              </Text>
              {activeTab === tab && <View style={styles.tabDot} />}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView
        style={{ flex: 1, backgroundColor: c.bg0 }}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'Overview' && (
          <>
            {/* Avatar — your actual equipped character, pet, and backdrop
                (Profile screen's wardrobe), not a fixed placeholder image.
                Tapping it opens your Profile when that setting's on; when
                it's off, the tap isn't wasted — it jumps the character
                instead (same jump as the walker's own up-arrow). */}
            <TouchableOpacity
              style={styles.avatarWrap}
              onPress={() => (heroTapEnabled ? navigation.navigate('Profile') : heroWalkerRef.current?.jump())}
              activeOpacity={0.85}
            >
              <LandscapeBackground background={background} height={150} style={{ width: '100%' }}>
                <CharacterWalker
                  ref={heroWalkerRef}
                  outfit={outfit} accessory={accessory} pet={pet} characterSize={100} petSize={42}
                  rewards={bonusRewards.slots}
                  onClaimReward={bonusRewards.claim}
                  rewardPoints={bonusRewards.points}
                  onCoinCollected={coinRewards.collect}
                  coinRewardsRemaining={coinRewards.remaining}
                  coinRewardPoints={coinRewards.points}
                />
              </LandscapeBackground>
            </TouchableOpacity>

            {/* Quick stat chips */}
            <TourSpot id="training-stats">
            <View style={styles.chipRow}>
              <QuickChip icon="✦" iconName="sparkles-outline" value={points?.toLocaleString() || '0'} label="Points" c={c} t={t} s={s} r={r} />
              <QuickChip icon="🔥" iconName="flame-outline" value={streakDays || 0} label="Streak" c={c} t={t} s={s} r={r} />
              {/* This is the character's title tier (RANK_LABELS, 1=best..20=starter),
                  not a leaderboard placement — a real leaderboard position is shown
                  elsewhere (LeaderboardScreen). Showing it as "#17" read like the same
                  kind of ranking and could easily be confused with that competitive
                  position, so this shows the tier name instead of its number. */}
              <QuickChip icon={(RANK_LABELS[rank] || RANK_LABELS[20]).emoji} iconName="ribbon-outline" value={(RANK_LABELS[rank] || RANK_LABELS[20]).label} label="Tier" c={c} t={t} s={s} r={r} />
            </View>
            </TourSpot>

            {/* Enter Training */}
            <TourSpot id="training-enter">
            <TouchableOpacity
              style={styles.playBtn}
              onPress={() => navigation.navigate('Play', { index: 0 })}
              activeOpacity={0.85}
            >
              <Ionicons name="play" size={16} color="#fff" />
              <Text style={styles.playText}>ENTER TRAINING</Text>
            </TouchableOpacity>
            </TourSpot>

            {/* Objectives + Drills */}
            <TourSpot id="training-games">
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => setShowMissions(true)}
              >
                {showEmojis ? <Text style={styles.actionEmoji}>⚔️</Text> : <Ionicons name="flag-outline" size={18} color={c.gold} />}
                <Text style={styles.actionText}>Objectives</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, styles.actionBtnTeal]}
                onPress={() => setShowTasks(true)}
              >
                {showEmojis ? <Text style={styles.actionEmoji}>📋</Text> : <Ionicons name="clipboard-outline" size={18} color={c.teal} />}
                <Text style={[styles.actionText, { color: c.teal }]}>Daily Drills</Text>
              </TouchableOpacity>
            </View>
            </TourSpot>
          </>
        )}

        {activeTab === 'Training' && (
          <View style={{ width: '100%' }}>
            {showSubtext && (
              <Text style={styles.sectionIntro}>
                {trainedCount > 0
                  ? `You've trained in ${trainedCount} of ${GAMES.length} drills. Pick one to continue.`
                  : 'Pick a drill below and choose your grade level to begin.'}
              </Text>
            )}

            {/* Subject filter */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: s.sm, gap: s.sm, paddingBottom: s.sm }}>
              {['All','Math','Language Arts','Science','Health','Finance','Home Ec','Social Studies','Art & Music','Technology','Foreign Language','Mental Wellness','Social & Relationships','Career & Life Skills','General'].map(sub => (
                <TouchableOpacity
                  key={sub}
                  style={[styles.filterChip, gameFilter === sub && styles.filterChipActive]}
                  onPress={() => setGameFilter(sub)}
                >
                  <Text style={[styles.filterText, gameFilter === sub && styles.filterTextActive]}>
                    {sub}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Type filter — what KIND of game, not just what subject */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: s.sm, gap: s.sm, paddingBottom: s.md }}>
              {MECHANIC_FILTERS.map(m => {
                const meta = MECHANIC_META[m];
                const label = m === 'All' ? 'All Types' : meta.label;
                const emoji = m === 'All' ? '🎲' : meta.emoji;
                return (
                  <TouchableOpacity
                    key={m}
                    style={[styles.filterChip, styles.mechanicChip, mechanicFilter === m && styles.filterChipActive]}
                    onPress={() => setMechanicFilter(m)}
                  >
                    <Text style={[styles.filterText, mechanicFilter === m && styles.filterTextActive]}>
                      {showEmojis ? `${emoji} ` : ''}{label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Drill grid */}
            <View style={styles.gameGrid}>
              {GAMES.filter(g =>
                (gameFilter === 'All' || g.subject === gameFilter) &&
                (mechanicFilter === 'All' || g.mechanic === mechanicFilter)
              ).map(game => {
                const savedLevel = skillLevels[game.key];
                const levelMeta = savedLevel ? LEVEL_META[savedLevel] : null;
                const mechMeta = MECHANIC_META[game.mechanic];
                return (
                  <TouchableOpacity
                    key={game.key}
                    style={[styles.gameCard, { borderTopColor: game.color }]}
                    onPress={() => navigation.navigate('Play', { gameId: game.key })}
                    activeOpacity={0.85}
                  >
                    <View style={styles.gameCardTop}>
                      {showEmojis ? <Text style={styles.gameEmoji}>{game.emoji}</Text> : <Ionicons name="game-controller-outline" size={26} color={game.color} />}
                      {levelMeta ? (
                        <View style={[styles.levelPill, { borderColor: LEVEL_TINT[savedLevel] }]}>
                          <Text style={[styles.levelPillText, { color: LEVEL_TINT[savedLevel] }]}>
                            {showEmojis ? `${levelMeta.emoji} ` : ''}{levelMeta.label}
                          </Text>
                        </View>
                      ) : (
                        <View style={styles.levelPillNew}>
                          <Text style={styles.levelPillNewText}>NEW</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.gameTitle}>{game.title}</Text>
                    {mechMeta && (
                      <View style={styles.mechBadge}>
                        <Text style={styles.mechBadgeText}>{showEmojis ? `${mechMeta.emoji} ` : ''}{mechMeta.label}</Text>
                      </View>
                    )}
                    {showSubtext && <Text style={styles.gameDesc}>{game.desc}</Text>}
                    <View style={[styles.gamePlayBtn, { backgroundColor: game.color }]}>
                      <Text style={styles.gamePlayText}>{levelMeta ? 'Continue →' : 'Start →'}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {activeTab === 'Progress' && (
          <View style={{ width: '100%', alignItems: 'center' }}>
            <View style={styles.rankPanel}>
              <LevelRing pct={progress || 0} size={72} strokeWidth={5} color={c.gold} trackColor={c.bg2}>
                <Text style={{ fontSize: 24 }}>{(RANK_LABELS[rank] || RANK_LABELS[20]).emoji}</Text>
              </LevelRing>
              <View style={{ marginLeft: s.lg, flex: 1 }}>
                <Text style={{ fontSize: t.lg, fontWeight: t.bold, color: c.text1 }}>
                  {(RANK_LABELS[rank] || RANK_LABELS[20]).label}
                </Text>
                <Text style={{ fontSize: t.xs, color: c.text3, marginTop: 2 }}>
                  Rank {rank || 20} · {Math.round(progress || 0)}% to next rank
                </Text>
              </View>
            </View>

            {showLeaderboard && (
              <TouchableOpacity
                style={styles.leaderboardBtn}
                onPress={() => navigation.navigate('Leaderboard')}
                activeOpacity={0.85}
              >
                {showEmojis ? <Text style={styles.leaderboardBtnEmoji}>🏆</Text> : <Ionicons name="trophy-outline" size={18} color={c.gold} />}
                <Text style={styles.leaderboardBtnText}>View Leaderboard</Text>
                <Ionicons name="chevron-forward" size={16} color={c.gold} />
              </TouchableOpacity>
            )}

            <View style={styles.statsGrid}>
              <StatCard label="Points" value={points?.toLocaleString() || '0'} emoji="✦" iconName="sparkles-outline" c={c} t={t} s={s} r={r} />
              <StatCard label="Accuracy" value={accuracy != null ? `${accuracy}%` : '—'} emoji="🎯" iconName="locate-outline" c={c} t={t} s={s} r={r} />
              <StatCard label="Sessions" value={gameplayStats?.levelsCompleted || 0} emoji="🏁" iconName="flag-outline" c={c} t={t} s={s} r={r} />
              <StatCard label="Day Streak" value={streakDays || 0} emoji="🔥" iconName="flame-outline" c={c} t={t} s={s} r={r} />
            </View>

            <View style={styles.statsGridSecondary}>
              <StatCard label="Fastest" value={gameplayStats?.fastestTime ? `${gameplayStats.fastestTime}s` : '—'} emoji="⚡" iconName="flash-outline" c={c} t={t} s={s} r={r} small />
              <StatCard label="Avg Response" value={gameplayStats?.avgTime ? `${gameplayStats.avgTime}s` : '—'} emoji="⏱️" iconName="timer-outline" c={c} t={t} s={s} r={r} small />
            </View>

            {/* Skill levels per drill */}
            <SectionHeader title="Grade Levels" c={c} t={t} s={s} />
            <View style={styles.skillGrid}>
              {GAMES.map(game => {
                const savedLevel = skillLevels[game.key];
                const meta = savedLevel ? LEVEL_META[savedLevel] : null;
                const mechMeta = MECHANIC_META[game.mechanic];
                return (
                  <TouchableOpacity
                    key={game.key}
                    style={styles.skillCard}
                    onPress={() => navigation.navigate('Play', { gameId: game.key })}
                    activeOpacity={0.85}
                  >
                    {showEmojis ? <Text style={styles.skillEmoji}>{game.emoji}</Text> : <Ionicons name="game-controller-outline" size={18} color={c.text3} style={{ marginBottom: 4 }} />}
                    <Text style={styles.skillTitle} numberOfLines={1}>{game.title}</Text>
                    {mechMeta && <Text style={styles.skillMechText}>{showEmojis ? `${mechMeta.emoji} ` : ''}{mechMeta.label}</Text>}
                    <Text style={[styles.skillLevelText, { color: meta ? LEVEL_TINT[savedLevel] : c.text4 }]}>
                      {meta ? `${showEmojis ? `${meta.emoji} ` : ''}${meta.label}` : 'Not started'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Subject mastery */}
            <SectionHeader title="Subject Mastery" c={c} t={t} s={s} />
            <View style={{ width: '100%' }}>
              {Object.keys(subjectProgress || {}).length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyCardText}>Complete a drill to start building mastery.</Text>
                </View>
              ) : (
                Object.entries(subjectProgress).map(([subject, data]) => {
                  const cfg = SUBJECT_CONFIG[subject] || SUBJECT_CONFIG.general;
                  const acc = data.questions_answered > 0 ? (data.correct_answers / data.questions_answered * 100) : 0;
                  return (
                    <View key={subject} style={styles.subjectCard}>
                      <View style={styles.subjectRow}>
                        {showEmojis ? <Text style={styles.subjectIcon}>{cfg.icon}</Text> : <Ionicons name={SUBJECT_ICON[subject] || 'star-outline'} size={20} color={cfg.color} style={{ marginRight: s.sm }} />}
                        <View style={{ flex: 1 }}>
                          <Text style={styles.subjectName}>{cfg.name}</Text>
                          <Text style={styles.subjectSub}>Level {data.level || 1} · {data.questions_answered || 0} answered</Text>
                        </View>
                        <Text style={[styles.subjectAcc, { color: cfg.color }]}>{acc.toFixed(0)}%</Text>
                      </View>
                      <View style={styles.xpBg}>
                        <View style={[styles.xpFill, { width: `${Math.min(data.xp % 100, 100)}%`, backgroundColor: cfg.color }]} />
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          </View>
        )}
      </ScrollView>

      <Modal visible={showMissions} animationType="slide" onRequestClose={() => setShowMissions(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: c.bg0 }}>
          <MissionsScreen onClose={() => setShowMissions(false)} />
        </SafeAreaView>
      </Modal>
      <Modal visible={showTasks} animationType="slide" onRequestClose={() => setShowTasks(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: c.bg0 }}>
          <MissionsScreen initialTab="daily" onClose={() => setShowTasks(false)} />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

function QuickChip({ icon, iconName, value, label, c, t, s, r }) {
  const { showEmojis } = useUIPrefs();
  return (
    <View style={{
      flex: 1, alignItems: 'center', backgroundColor: c.bg1, borderWidth: 0.5, borderColor: c.border,
      borderRadius: r.lg, paddingVertical: s.sm, marginHorizontal: s.xs,
    }}>
      {showEmojis ? (
        <Text style={{ fontSize: 16, marginBottom: 2 }}>{icon}</Text>
      ) : (
        <Ionicons name={iconName} size={15} color={c.gold} style={{ marginBottom: 2 }} />
      )}
      <Text style={{ fontSize: t.md, fontFamily: FONTS.mono, fontWeight: t.bold, color: c.text1 }}>{value}</Text>
      <Text style={{ fontSize: 9, color: c.text4, textTransform: 'uppercase', letterSpacing: 0.6 }}>{label}</Text>
    </View>
  );
}

function StatCard({ label, value, emoji, iconName, c, t, s, r, small }) {
  const { showEmojis } = useUIPrefs();
  return (
    <View style={{
      flex: 1, minWidth: small ? '45%' : '45%',
      backgroundColor: c.bg1, borderWidth: 0.5, borderColor: c.border,
      borderRadius: r.lg, padding: small ? s.md : s.lg, margin: s.xs, alignItems: 'center',
    }}>
      {showEmojis ? (
        <Text style={{ fontSize: small ? 18 : 22, marginBottom: 4 }}>{emoji}</Text>
      ) : (
        <Ionicons name={iconName} size={small ? 16 : 20} color={c.gold} style={{ marginBottom: 4 }} />
      )}
      <Text style={{ fontSize: small ? t.lg : t.xxl, fontFamily: FONTS.mono, fontWeight: t.bold, color: c.gold, marginBottom: 2 }}>{value}</Text>
      <Text style={{ fontSize: t.xs, fontFamily: FONTS.mono, color: c.text3, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</Text>
    </View>
  );
}

function SectionHeader({ title, c, t, s }) {
  return (
    <Text style={{
      width: '100%', fontSize: t.sm, fontWeight: t.bold, color: c.text1,
      textTransform: 'uppercase', letterSpacing: 1, marginTop: s.xl, marginBottom: s.md,
    }}>
      {title}
    </Text>
  );
}

const makeStyles = (c, t, s, r, sh) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.headerBg },
  header: {
    backgroundColor: c.headerBg,
    paddingTop: 0,
    paddingBottom: s.md,
    borderBottomWidth: 1,
    borderBottomColor: c.border,
    alignItems: 'center',
    ...sh.sm,
  },
  eyebrow: { fontSize: 10, fontFamily: FONTS.mono, color: c.text4, letterSpacing: 2, marginBottom: 2 },
  name: { fontSize: t.xl, fontFamily: FONTS.display, fontWeight: t.bold, color: c.text1, marginBottom: s.sm },
  tabs: { flexDirection: 'row', gap: s.xl },
  tab: { alignItems: 'center', paddingBottom: 4 },
  tabActive: {},
  tabText: { fontSize: t.sm, color: c.text3, fontWeight: t.medium },
  tabTextActive: { color: c.text1, fontWeight: t.bold },
  tabDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: c.gold, marginTop: 3 },
  scroll: { alignItems: 'center', paddingVertical: s.xl, paddingHorizontal: s.lg },
  avatarWrap: {
    width: '100%', marginBottom: s.lg,
  },
  chipRow: { flexDirection: 'row', width: '100%', marginBottom: s.lg },
  playBtn: {
    flexDirection: 'row', alignItems: 'center', gap: s.md,
    backgroundColor: c.gold, borderRadius: r.xl,
    paddingVertical: s.lg, paddingHorizontal: s.xxl,
    marginBottom: s.lg,
    ...sh.md,
  },
  playText: { fontSize: t.lg, fontFamily: FONTS.display, fontWeight: t.bold, color: '#fff', letterSpacing: 2 },
  actionRow: { flexDirection: 'row', gap: s.md, width: '80%' },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: s.sm, backgroundColor: c.goldLight,
    borderWidth: 1, borderColor: c.gold,
    borderRadius: r.lg, paddingVertical: s.md,
  },
  actionBtnTeal: { backgroundColor: c.tealLight, borderColor: c.teal },
  actionEmoji: { fontSize: t.lg },
  actionText: { fontSize: t.md, fontWeight: t.semibold, color: c.gold },
  sectionIntro: { width: '100%', fontSize: t.sm, color: c.text3, marginBottom: s.md, paddingHorizontal: s.sm, lineHeight: 18 },
  rankPanel: {
    flexDirection: 'row', alignItems: 'center', width: '100%',
    backgroundColor: c.bg1, borderWidth: 0.5, borderColor: c.border,
    borderTopWidth: 2, borderTopColor: c.gold,
    borderRadius: r.lg, padding: s.lg, marginBottom: s.md,
  },
  leaderboardBtn: {
    flexDirection: 'row', alignItems: 'center', gap: s.sm, width: '100%',
    backgroundColor: c.goldLight, borderWidth: 1, borderColor: c.gold,
    borderRadius: r.lg, paddingVertical: s.md, paddingHorizontal: s.lg, marginBottom: s.lg,
  },
  leaderboardBtnEmoji: { fontSize: 18 },
  leaderboardBtnText: { flex: 1, fontSize: t.sm, fontWeight: t.bold, color: c.gold },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', width: '100%' },
  statsGridSecondary: { flexDirection: 'row', flexWrap: 'wrap', width: '100%', marginBottom: s.sm },
  skillGrid: { flexDirection: 'row', flexWrap: 'wrap', width: '100%', gap: s.sm },
  skillCard: {
    width: '31%', backgroundColor: c.bg1, borderWidth: 0.5, borderColor: c.border,
    borderRadius: r.md, paddingVertical: s.md, alignItems: 'center',
  },
  skillEmoji: { fontSize: 20, marginBottom: 4 },
  skillTitle: { fontSize: 10, fontWeight: t.semibold, color: c.text2, textAlign: 'center', paddingHorizontal: 4 },
  skillMechText: { fontSize: 8, color: c.text4, marginTop: 2 },
  skillLevelText: { fontSize: 9, fontWeight: t.bold, marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  emptyCard: { width: '100%', backgroundColor: c.bg1, borderWidth: 0.5, borderColor: c.border, borderRadius: r.lg, padding: s.lg, alignItems: 'center' },
  emptyCardText: { fontSize: t.sm, color: c.text3 },
  subjectCard: { width: '100%', backgroundColor: c.bg1, borderWidth: 0.5, borderColor: c.border, borderRadius: r.md, padding: s.md, marginBottom: s.sm },
  subjectRow: { flexDirection: 'row', alignItems: 'center', marginBottom: s.sm },
  subjectIcon: { fontSize: 22, marginRight: s.sm },
  subjectName: { fontSize: t.sm, fontWeight: t.semibold, color: c.text1 },
  subjectSub: { fontSize: t.xs, color: c.text3, marginTop: 1 },
  subjectAcc: { fontSize: t.sm, fontWeight: t.bold },
  xpBg: { height: 4, backgroundColor: c.bg2, borderRadius: 2, overflow: 'hidden' },
  xpFill: { height: 4, borderRadius: 2 },
  filterChip:       { paddingHorizontal: s.md, paddingVertical: 6, borderRadius: r.full, backgroundColor: c.bg1, borderWidth: 0.5, borderColor: c.border },
  filterChipActive: { backgroundColor: c.teal, borderColor: c.teal },
  filterText:       { fontSize: t.xs, color: c.text3, fontWeight: t.medium },
  filterTextActive: { color: '#fff', fontWeight: t.bold },
  mechanicChip:     { backgroundColor: c.bg2 },
  gameGrid:         { flexDirection: 'row', flexWrap: 'wrap', width: '100%', padding: s.sm },
  gameCard:         { width: '47%', margin: '1.5%', backgroundColor: c.bg1, borderRadius: r.lg, padding: s.md, borderWidth: 0.5, borderColor: c.border, borderTopWidth: 3 },
  gameCardTop:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: s.sm },
  gameEmoji:        { fontSize: 28 },
  mechBadge:        { alignSelf: 'flex-start', backgroundColor: c.bg2, borderRadius: r.full, paddingHorizontal: 6, paddingVertical: 2, marginBottom: s.xs },
  mechBadgeText:    { fontSize: 9, color: c.text3, fontWeight: t.semibold },
  levelPill:        { borderWidth: 1, borderRadius: r.full, paddingHorizontal: 6, paddingVertical: 2 },
  levelPillText:    { fontSize: 8, fontWeight: t.bold },
  levelPillNew:     { backgroundColor: c.teal, borderRadius: r.full, paddingHorizontal: 6, paddingVertical: 2 },
  levelPillNewText: { fontSize: 8, fontWeight: t.bold, color: '#fff' },
  gameTitle:        { fontSize: t.sm, fontWeight: t.bold, color: c.text1, marginBottom: 3 },
  gameDesc:         { fontSize: 10, color: c.text3, lineHeight: 14, marginBottom: s.sm },
  gamePlayBtn:      { borderRadius: r.md, paddingVertical: 7, alignItems: 'center', marginTop: s.sm },
  gamePlayText:     { fontSize: t.xs, fontWeight: t.bold, color: '#fff' },
});
