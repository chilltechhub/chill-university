// src/screens/LeaderboardScreen.js
import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  FlatList, RefreshControl, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useUserProgress } from '../../context/UserProgressContext';
import { useTheme } from '../../context/ThemeContext';
import { FONTS } from '../theme';
import { getRank, getRankLabel } from '../logic/rankUtils';
import { getLeaderboard, getMyLeaderboardPosition, LEADERBOARD_NOT_CONFIGURED } from '../logic/leaderboardService';

const MEDAL = { 1: '🥇', 2: '🥈', 3: '🥉' };

export default function LeaderboardScreen() {
  const navigation = useNavigation();
  const { user } = useUserProgress();
  const { colors: c, typography: t, spacing: s, radius: r, shadows: sh } = useTheme();
  const styles = makeStyles(c, t, s, r, sh);

  const [rows, setRows] = useState([]);
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [status, setStatus] = useState('loading'); // loading | ready | empty | not_configured | error

  const load = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const [board, mine] = await Promise.all([
        getLeaderboard(50),
        getMyLeaderboardPosition(user?.id),
      ]);
      setRows(board);
      setMe(mine);
      setStatus(board.length ? 'ready' : 'empty');
    } catch (e) {
      setStatus(e?.message === LEADERBOARD_NOT_CONFIGURED ? 'not_configured' : 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const iAmVisible = me && rows.some(row => row.id === me.id);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color={c.text2} />
        </TouchableOpacity>
        <Text style={styles.title}>🏆 Leaderboard</Text>
        <View style={{ width: 34 }} />
      </View>

      {status === 'loading' || loading ? (
        <View style={styles.centerWrap}>
          <ActivityIndicator size="large" color={c.teal} />
          <Text style={styles.centerText}>Loading rankings...</Text>
        </View>
      ) : status === 'not_configured' ? (
        <View style={styles.centerWrap}>
          <Text style={styles.centerEmoji}>🛠️</Text>
          <Text style={styles.centerTitle}>Leaderboard isn't set up yet</Text>
          <Text style={styles.centerSub}>
            This needs a one-time database migration applied on the backend before rankings can load.
          </Text>
        </View>
      ) : status === 'error' ? (
        <View style={styles.centerWrap}>
          <Text style={styles.centerEmoji}>⚠️</Text>
          <Text style={styles.centerTitle}>Couldn't load the leaderboard</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => load()}>
            <Text style={styles.retryText}>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : status === 'empty' ? (
        <View style={styles.centerWrap}>
          <Text style={styles.centerEmoji}>🏁</Text>
          <Text style={styles.centerTitle}>No rankings yet</Text>
          <Text style={styles.centerSub}>Be the first to score points and top the board.</Text>
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={c.teal} />}
          renderItem={({ item }) => (
            <LeaderboardRow item={item} isMe={item.id === user?.id} styles={styles} c={c} />
          )}
          ListFooterComponent={
            me && !iAmVisible ? (
              <View style={styles.myPositionWrap}>
                <Text style={styles.myPositionLabel}>Your position</Text>
                <LeaderboardRow item={me} isMe styles={styles} c={c} />
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}

function LeaderboardRow({ item, isMe, styles, c }) {
  const rankTier = getRank(item.points || 0);
  const rankLabel = getRankLabel(rankTier);
  const medal = MEDAL[item.rank_position];

  return (
    <View style={[styles.row, isMe && styles.rowMe, item.rank_position <= 3 && styles.rowTop3]}>
      <View style={styles.posWrap}>
        {medal ? (
          <Text style={styles.medal}>{medal}</Text>
        ) : (
          <Text style={styles.posText}>#{item.rank_position}</Text>
        )}
      </View>
      <Text style={styles.rankEmoji}>{rankLabel.emoji}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.name} numberOfLines={1}>
          {item.display_name}{isMe ? ' (You)' : ''}
        </Text>
        <Text style={styles.subLine}>{rankLabel.label} · Level {item.level}</Text>
      </View>
      <Text style={styles.points}>{(item.points || 0).toLocaleString()}</Text>
    </View>
  );
}

const makeStyles = (c, t, s, r, sh) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.bg0 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: s.md, paddingVertical: s.md,
    borderBottomWidth: 1, borderBottomColor: c.border, backgroundColor: c.headerBg,
  },
  backBtn: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: t.xl, fontFamily: FONTS.display, fontWeight: t.bold, color: c.text1 },
  centerWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: s.xxxl },
  centerEmoji: { fontSize: 48, marginBottom: s.lg },
  centerTitle: { fontSize: t.lg, fontWeight: t.bold, color: c.text1, marginBottom: s.sm, textAlign: 'center' },
  centerSub: { fontSize: t.sm, color: c.text3, textAlign: 'center', lineHeight: 20 },
  centerText: { marginTop: s.md, fontSize: t.sm, color: c.text3 },
  retryBtn: { marginTop: s.lg, backgroundColor: c.teal, borderRadius: r.md, paddingVertical: s.sm, paddingHorizontal: s.xl },
  retryText: { color: '#fff', fontWeight: t.bold, fontSize: t.sm },
  list: { padding: s.lg, paddingBottom: s.xxxl },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: s.sm,
    backgroundColor: c.bg1, borderWidth: 0.5, borderColor: c.border,
    borderRadius: r.lg, padding: s.md, marginBottom: s.sm,
  },
  rowMe: { borderColor: c.teal, borderWidth: 1.5, backgroundColor: c.tealLight },
  rowTop3: { borderTopWidth: 2, borderTopColor: c.gold },
  posWrap: { width: 34, alignItems: 'center' },
  medal: { fontSize: 22 },
  posText: { fontSize: t.sm, fontWeight: t.bold, color: c.text3, fontFamily: FONTS.mono },
  rankEmoji: { fontSize: 20 },
  name: { fontSize: t.sm, fontWeight: t.bold, color: c.text1 },
  subLine: { fontSize: t.xs, color: c.text3, marginTop: 1 },
  points: { fontSize: t.md, fontWeight: t.bold, color: c.gold, fontFamily: FONTS.mono },
  myPositionWrap: { marginTop: s.lg, paddingTop: s.lg, borderTopWidth: 1, borderTopColor: c.border },
  myPositionLabel: { fontSize: t.xs, color: c.text3, textTransform: 'uppercase', letterSpacing: 1, marginBottom: s.sm, fontWeight: t.semibold },
});
