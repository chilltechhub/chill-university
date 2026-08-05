// src/screens/HomeScreen.js
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Modal, Dimensions, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useNavigation } from '@react-navigation/native';
import { useUserProgress } from '../../context/UserProgressContext';
import { useTheme } from '../../context/ThemeContext';
import MissionsScreen from './MissionsScreen';

const GAMES = [
  { key:'factor',   title:'Factor Craft',   emoji:'🔢', subject:'Math',         color:'#2bb5a0', desc:'Hit the target number' },
  { key:'coin',     title:'Coin Game',      emoji:'🪙', subject:'Math',         color:'#c9a84c', desc:'Count coins and make change' },
  { key:'word',     title:'Word Detective', emoji:'📖', subject:'Language Arts', color:'#8b4fc4', desc:'Identify word types' },
  { key:'classify', title:'Science Sort',   emoji:'🔬', subject:'Science',       color:'#2bb5a0', desc:'Classify animals and matter' },
  { key:'recipe',   title:'Recipe Builder', emoji:'🍳', subject:'Home Ec',       color:'#e0a830', desc:'Put steps in order' },
  { key:'junk',     title:'Food Sort',      emoji:'🍎', subject:'Health',        color:'#3ac860', desc:'Healthy vs junk food' },
  { key:'exercise', title:'Exercise Match', emoji:'💪', subject:'Health',        color:'#e05858', desc:'Match exercises to benefits' },
  { key:'budget',   title:'Budget Balance', emoji:'💰', subject:'Finance',       color:'#3ac860', desc:'Cut wants, keep needs' },
  { key:'tools',    title:'Tool Match',     emoji:'🔧', subject:'Home Ec',       color:'#c9a84c', desc:'Match tools to their use' },
];
const { width: SW } = Dimensions.get('window');

const TABS = ['You', 'Games', 'Stats'];

export default function HomeScreen() {
  const { profile, points, rank, stats } = useUserProgress();
  const { colors: c, typography: t, spacing: s, radius: r, shadows: sh } = useTheme();
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState('You');
  const [showMissions, setShowMissions] = useState(false);
  const [showTasks, setShowTasks] = useState(false);
const [gameFilter, setGameFilter] = useState('All');
  const styles = makeStyles(c, t, s, r, sh);
  const displayName = profile?.username || profile?.display_name || 'Adventurer';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* ── Header ── */}
      <View style={styles.header}>
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
        {activeTab === 'You' && (
          <>
            {/* Avatar */}
            <TouchableOpacity
              style={styles.avatarWrap}
              onPress={() => navigation.navigate('Profile')}
            >
              <Image
                source={require('../../assets/character1.png')}
                style={styles.avatar}
                resizeMode="contain"
              />
              <Image
                source={require('../../assets/pet1.png')}
                style={styles.pet}
                resizeMode="contain"
              />
            </TouchableOpacity>

            {/* Play */}
            <TouchableOpacity
              style={styles.playBtn}
              onPress={() => navigation.navigate('Play', { index: 0 })}
              activeOpacity={0.85}
            >
              <Text style={styles.playGlyph}>✦</Text>
              <Text style={styles.playText}>PLAY</Text>
              <Text style={styles.playGlyph}>✦</Text>
            </TouchableOpacity>

            {/* Missions + Tasks */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => setShowMissions(true)}
              >
                <Text style={styles.actionEmoji}>⚔️</Text>
                <Text style={styles.actionText}>Missions</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, styles.actionBtnTeal]}
                onPress={() => setShowTasks(true)}
              >
                <Text style={styles.actionEmoji}>📋</Text>
                <Text style={[styles.actionText, { color: c.teal }]}>Tasks</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {activeTab === 'Games' && (
  <View style={{ width: '100%' }}>
    {/* Subject filter */}
    <ScrollView horizontal showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: s.sm, gap: s.sm, paddingBottom: s.sm }}>
      {['All','Math','Language Arts','Science','Health','Finance','Home Ec'].map(sub => (
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

    {/* Game grid */}
    <View style={styles.gameGrid}>
      {GAMES.filter(g => gameFilter === 'All' || g.subject === gameFilter).map(game => (
        <TouchableOpacity
          key={game.key}
          style={[styles.gameCard, { borderTopColor: game.color }]}
          onPress={() => navigation.navigate('Play', { gameId: game.key })}
          activeOpacity={0.85}
        >
          <Text style={styles.gameEmoji}>{game.emoji}</Text>
          <Text style={styles.gameTitle}>{game.title}</Text>
          <Text style={styles.gameDesc}>{game.desc}</Text>
          <View style={[styles.gamePlayBtn, { backgroundColor: game.color }]}>
            <Text style={styles.gamePlayText}>Play →</Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  </View>
)}
        {activeTab === 'Stats' && (
          <View style={styles.statsGrid}>
            <StatCard label="Points" value={points?.toLocaleString() || '0'} emoji="✦" c={c} t={t} s={s} r={r} />
            <StatCard label="Rank" value={`#${rank || 20}`} emoji="🏆" c={c} t={t} s={s} r={r} />
            <StatCard label="Level" value={stats?.level || 1} emoji="⚡" c={c} t={t} s={s} r={r} />
            <StatCard label="Accuracy" value={stats?.accuracy || '0%'} emoji="🎯" c={c} t={t} s={s} r={r} />
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

function StatCard({ label, value, emoji, c, t, s, r }) {
  return (
    <View style={{
      flex: 1, minWidth: '45%',
      backgroundColor: c.bg1, borderWidth: 0.5, borderColor: c.border,
      borderRadius: r.lg, padding: s.lg, margin: s.xs, alignItems: 'center',
    }}>
      <Text style={{ fontSize: 22, marginBottom: 4 }}>{emoji}</Text>
      <Text style={{ fontSize: t.xxl, fontWeight: t.bold, color: c.gold, marginBottom: 2 }}>{value}</Text>
      <Text style={{ fontSize: t.xs, color: c.text3, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</Text>
    </View>
  );
}

const makeStyles = (c, t, s, r, sh) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.headerBg },
  header: {
    backgroundColor: c.headerBg,
    paddingTop: s.sm,
    paddingBottom: s.md,
    borderBottomWidth: 1,
    borderBottomColor: c.border,
    alignItems: 'center',
    ...sh.sm,
  },
  name: { fontSize: t.xl, fontWeight: t.bold, color: c.text1, marginBottom: s.sm },
  tabs: { flexDirection: 'row', gap: s.xl },
  tab: { alignItems: 'center', paddingBottom: 4 },
  tabActive: {},
  tabText: { fontSize: t.sm, color: c.text3, fontWeight: t.medium },
  tabTextActive: { color: c.text1, fontWeight: t.bold },
  tabDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: c.gold, marginTop: 3 },
  scroll: { alignItems: 'center', paddingVertical: s.xl, paddingHorizontal: s.lg },
  avatarWrap: {
    alignItems: 'center', justifyContent: 'center',
    marginBottom: s.xl, position: 'relative',
  },
  avatar: { width: 160, height: 200 },
  pet: { position: 'absolute', width: 70, height: 70, left: -10, bottom: -10 },
  playBtn: {
    flexDirection: 'row', alignItems: 'center', gap: s.md,
    backgroundColor: c.gold, borderRadius: r.xl,
    paddingVertical: s.lg, paddingHorizontal: s.xxl + s.md,
    marginBottom: s.lg,
    ...sh.md,
  },
  playGlyph: { fontSize: t.md, color: '#fff', opacity: 0.7 },
  playText: { fontSize: t.xl, fontWeight: t.bold, color: '#fff', letterSpacing: 2 },
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
  comingSoon: { alignItems: 'center', paddingTop: s.xxxl },
  comingSoonEmoji: { fontSize: 48, marginBottom: s.lg },
  comingSoonTitle: { fontSize: t.xl, fontWeight: t.bold, color: c.text1, marginBottom: s.sm },
  comingSoonSub: { fontSize: t.sm, color: c.text3 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', width: '100%' },
filterChip:       { paddingHorizontal: s.md, paddingVertical: 6, borderRadius: r.full, backgroundColor: c.bg1, borderWidth: 0.5, borderColor: c.border },
filterChipActive: { backgroundColor: c.teal, borderColor: c.teal },
filterText:       { fontSize: t.xs, color: c.text3, fontWeight: t.medium },
filterTextActive: { color: '#fff', fontWeight: t.bold },
gameGrid:         { flexDirection: 'row', flexWrap: 'wrap', width: '100%', padding: s.sm },
gameCard:         { width: '47%', margin: '1.5%', backgroundColor: c.bg1, borderRadius: r.lg, padding: s.md, borderWidth: 0.5, borderColor: c.border, borderTopWidth: 3 },
gameEmoji:        { fontSize: 28, marginBottom: s.sm },
gameTitle:        { fontSize: t.sm, fontWeight: t.bold, color: c.text1, marginBottom: 3 },
gameDesc:         { fontSize: 10, color: c.text3, lineHeight: 14, marginBottom: s.sm },
gamePlayBtn:      { borderRadius: r.md, paddingVertical: 7, alignItems: 'center', marginTop: s.sm },
gamePlayText:     { fontSize: t.xs, fontWeight: t.bold, color: '#fff' },
});
