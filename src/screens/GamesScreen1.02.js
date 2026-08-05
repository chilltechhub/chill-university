// src/screens/GamesScreen.js
// Games hub — browse and launch all 9 games
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { useUserProgress } from '../../context/UserProgressContext';

// Game imports
import CoinGame          from '../components/CoinGame';
import FactorCraftGame   from '../components/FactorCraftGame';
import WordTypeGame      from '../components/WordTypeGame';
import FoodSortGame      from '../components/FoodSortGame';
import ScienceSortGame   from '../components/ScienceSortGame';
import ExerciseMatchGame from '../components/ExerciseMatchGame';
import BudgetBalanceGame from '../components/BudgetBalanceGame';
import ToolMatchGame     from '../components/ToolMatchGame';
import RecipeBuilderGame from '../components/RecipeBuilderGame';

const GAMES = [
  { id:'coin',     title:'Coin Game',       emoji:'🪙', subject:'Math',         color:'#c9a84c', component: CoinGame,          desc:'Count coins and make change' },
  { id:'factor',   title:'Factor Craft',    emoji:'🔢', subject:'Math',         color:'#2bb5a0', component: FactorCraftGame,   desc:'Select tiles to hit the target number' },
  { id:'word',     title:'Word Detective',  emoji:'📖', subject:'Language Arts', color:'#8b4fc4', component: WordTypeGame,      desc:'Identify nouns, verbs, adjectives and more' },
  { id:'food',     title:'Food Sort',       emoji:'🍎', subject:'Health',        color:'#3ac860', component: FoodSortGame,      desc:'Sort healthy vs junk food' },
  { id:'science',  title:'Science Sort',    emoji:'🔬', subject:'Science',       color:'#2bb5a0', component: ScienceSortGame,   desc:'Classify animals, matter and space' },
  { id:'exercise', title:'Exercise Match',  emoji:'💪', subject:'Health',        color:'#e05858', component: ExerciseMatchGame, desc:'Match exercises to their benefits' },
  { id:'budget',   title:'Budget Balance',  emoji:'💰', subject:'Finance',       color:'#3ac860', component: BudgetBalanceGame, desc:'Balance budgets by cutting wants' },
  { id:'tool',     title:'Tool Match',      emoji:'🔧', subject:'Home Ec',       color:'#c9a84c', component: ToolMatchGame,     desc:'Match tools to what they do' },
  { id:'recipe',   title:'Recipe Builder',  emoji:'🍳', subject:'Home Ec',       color:'#e0a830', component: RecipeBuilderGame, desc:'Put recipe steps in the right order' },
];

const SUBJECTS = ['All', 'Math', 'Language Arts', 'Science', 'Health', 'Finance', 'Home Ec'];

export default function GamesScreen() {
  const { colors: c, typography: t, spacing: s, radius: r, shadows: sh } = useTheme();
  const { subjectProgress } = useUserProgress();
  const [filter, setFilter]     = useState('All');

  const navigation = useNavigation();
  const styles = makeStyles(c, t, s, r, sh);
  const filtered = filter === 'All' ? GAMES : GAMES.filter(g => g.subject === filter);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Game Hall</Text>
        <Text style={styles.headerSub}>✦ {GAMES.length} quests available</Text>
      </View>

      {/* Subject filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {SUBJECTS.map(sub => (
          <TouchableOpacity
            key={sub}
            style={[styles.filterChip, filter === sub && styles.filterChipActive]}
            onPress={() => setFilter(sub)}
          >
            <Text style={[styles.filterText, filter === sub && styles.filterTextActive]}>
              {sub}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Games grid */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
      >
        {filtered.map(game => {
          const progress = subjectProgress?.[game.subject?.toLowerCase().replace(' ', '_')];
          return (
            <TouchableOpacity
              key={game.id}
              style={[styles.gameCard, { borderTopColor: game.color }]}
              onPress={() => navigation.navigate('Play', { gameId: game.id })}
              activeOpacity={0.85}
            >
              <View style={styles.gameTop}>
                <Text style={styles.gameEmoji}>{game.emoji}</Text>
                <View style={[styles.subjectBadge, { backgroundColor: game.color + '22', borderColor: game.color }]}>
                  <Text style={[styles.subjectText, { color: game.color }]}>{game.subject}</Text>
                </View>
              </View>
              <Text style={styles.gameTitle}>{game.title}</Text>
              <Text style={styles.gameDesc}>{game.desc}</Text>
              {progress && (
                <View style={styles.progressRow}>
                  <View style={styles.progressBg}>
                    <View style={[styles.progressFill, {
                      width: `${Math.min((progress.xp % 100), 100)}%`,
                      backgroundColor: game.color,
                    }]} />
                  </View>
                  <Text style={styles.progressXp}>{progress.xp || 0} XP</Text>
                </View>
              )}
              <View style={[styles.playBtn, { backgroundColor: game.color }]}>
                <Text style={styles.playBtnText}>Play →</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const makeStyles = (c, t, s, r, sh) => StyleSheet.create({
  container:       { flex: 1, backgroundColor: c.bg0 },
  header:          { padding: s.lg, paddingTop: s.md, backgroundColor: c.headerBg, borderBottomWidth: 0.5, borderBottomColor: c.border },
  headerTitle:     { fontSize: t.xxl, fontWeight: t.bold, color: c.text1 },
  headerSub:       { fontSize: t.xs, color: c.gold, marginTop: 2 },
  filterRow:       { paddingHorizontal: s.lg, paddingVertical: s.sm, gap: s.sm },
  filterChip:      { paddingHorizontal: s.md, paddingVertical: 7, borderRadius: r.full, backgroundColor: c.bg1, borderWidth: 0.5, borderColor: c.border },
  filterChipActive:{ backgroundColor: c.teal, borderColor: c.teal },
  filterText:      { fontSize: t.xs, color: c.text3, fontWeight: t.medium },
  filterTextActive:{ color: '#fff', fontWeight: t.bold },
  grid:            { padding: s.lg, flexDirection: 'row', flexWrap: 'wrap', gap: s.md, paddingBottom: 40 },
  gameCard:        { width: '47%', backgroundColor: c.bg1, borderRadius: r.lg, padding: s.md, borderWidth: 0.5, borderColor: c.border, borderTopWidth: 3, ...sh.sm },
  gameTop:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: s.sm },
  gameEmoji:       { fontSize: 28 },
  subjectBadge:    { borderWidth: 0.5, borderRadius: r.full, paddingHorizontal: 6, paddingVertical: 2 },
  subjectText:     { fontSize: 9, fontWeight: t.bold, textTransform: 'uppercase', letterSpacing: 0.5 },
  gameTitle:       { fontSize: t.sm, fontWeight: t.bold, color: c.text1, marginBottom: 3 },
  gameDesc:        { fontSize: 11, color: c.text3, lineHeight: 15, marginBottom: s.sm },
  progressRow:     { flexDirection: 'row', alignItems: 'center', gap: s.sm, marginBottom: s.sm },
  progressBg:      { flex: 1, height: 3, backgroundColor: c.bg2, borderRadius: 2, overflow: 'hidden' },
  progressFill:    { height: 3, borderRadius: 2 },
  progressXp:      { fontSize: 10, color: c.text4 },
  playBtn:         { borderRadius: r.md, paddingVertical: 8, alignItems: 'center' },
  playBtnText:     { fontSize: t.xs, fontWeight: t.bold, color: '#fff' },
});
