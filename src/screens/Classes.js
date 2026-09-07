// src/screens/Classes.js
import React, { useState, useEffect, useMemo } from 'react';
import { ScrollView, TouchableOpacity, Text, View, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../context/ThemeContext';
import { useUIPrefs } from '../../context/UIPrefsContext';
import { supabase } from '../api/supabaseClient';
import { fetchContentPool } from '../api/remoteConfigService';
import { listLessonPlans } from '../api/lessonBuilderService';
import useSetting, { SETTING_KEYS } from '../logic/useSetting';
import { pickRecommendedTopics, pickRecommendedGames } from '../logic/classRecommendations';
import TourSpot from '../components/TourSpot';
import { CLASS_SUBJECTS, CLASS_SCREEN_MAP } from '../data/classCatalog';
import { lessonsForGame } from '../data/skillLinks';
import { getWeakGames } from '../logic/skillStats';
import { getGame } from '../services/gameRegistry';

const GRADE_BAND_KEY = '@cth_academy_grade_band';
const BANDS = ['All', 'K-2', '3-5', '6-8', '9-12'];
const BAND_LABEL = { 'K-2': 'Grades K–2', '3-5': 'Grades 3–5', '6-8': 'Grades 6–8', '9-12': 'Grades 9–12' };

export default function Classes() {
  const [open, setOpen] = useState({});
  const [band, setBand] = useState('All');
  // title -> { icon, color, description, comingSoon } from Supabase
  // (type='class_subject'). Only the subject CARD metadata is remote —
  // each subject's topic sublist (labels + grades) still comes from the
  // hardcoded `subjects` below, same as before. Falls back to nothing
  // (local hardcoded values win) if the fetch fails or is empty, so this
  // never blanks the screen — same pattern as ClassTopicScreen.js.
  const [remoteSubjects, setRemoteSubjects] = useState({});
  // Teacher / Educator Mode (Settings -> Personalization). This screen is a
  // learner's: grade bands, topic readings, practice quizzes. The Classroom
  // Day Lesson Plan Builder is an authoring tool, so its entry points only
  // appear for whoever has said they're teaching.
  const [educatorMode, setEducatorMode, educatorReady] = useSetting(SETTING_KEYS.EDUCATOR_MODE, null);
  const navigation = useNavigation();
  const { colors: c, typography: t, spacing: s, radius: r } = useTheme();
  const { showEmojis, showSubtext } = useUIPrefs();
  const styles = makeStyles(c, t, s, r);

  // Lessons drawn from how the player is ACTUALLY doing in the Training
  // Center, rather than only from their grade band: skillStats keeps a
  // rolling per-game accuracy (written by GameOver), skillLinks maps a
  // game to the topics that teach it. Empty until someone has played the
  // same game a couple of times, so a new account sees nothing odd.
  const [fromGames, setFromGames] = useState([]);
  useEffect(() => {
    let alive = true;
    getWeakGames({ limit: 3 }).then((weak) => {
      if (!alive) return;
      const seen = new Set();
      const picks = [];
      weak.forEach(({ gameId, accuracy }) => {
        const game = getGame(gameId);
        lessonsForGame(gameId).forEach((lesson) => {
          const id = lesson.screen + '/' + lesson.topicKey;
          if (seen.has(id) || picks.length >= 4) return;
          seen.add(id);
          picks.push({ ...lesson, gameName: game?.name || gameId, gameIcon: game?.icon, accuracy });
        });
      });
      setFromGames(picks);
    });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    AsyncStorage.getItem(GRADE_BAND_KEY).then(saved => {
      if (saved && BANDS.includes(saved)) setBand(saved);
    });
  }, []);

  useEffect(() => {
    fetchContentPool('class_subject').then((rows) => {
      if (!rows.length) return;
      const map = {};
      rows.forEach((row) => {
        map[row.title] = {
          icon: row.meta?.icon,
          color: row.meta?.color,
          description: row.body,
          comingSoon: !!row.meta?.comingSoon,
        };
      });
      setRemoteSubjects(map);
    });
  }, []);

  // Anyone who built lesson plans before this toggle existed keeps their
  // entry points: on the first run where the setting has never been decided
  // (null), having saved plans turns Educator Mode on and writes that
  // decision, so this check never runs again. Everyone else lands on false.
  useEffect(() => {
    if (!educatorReady || educatorMode !== null) return;
    let alive = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      const uid = data?.user?.id;
      if (!uid) return; // signed out — leave undecided rather than writing false
      const plans = await listLessonPlans(uid);
      if (alive) setEducatorMode(plans.length > 0);
    })();
    return () => { alive = false; };
  }, [educatorReady, educatorMode, setEducatorMode]);

  const chooseBand = (next) => {
    setBand(next);
    AsyncStorage.setItem(GRADE_BAND_KEY, next);
  };

  const toggle = (key) => {
    setOpen((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Catalog lives in src/data/classCatalog.js — shared with the Planner's
  // "Link to a class" picker (PlannerScreen.js) so both read one list
  // instead of keeping their own copies that can drift out of sync.
  const subjects = CLASS_SUBJECTS;
  const screenMap = CLASS_SCREEN_MAP;

  const goToChild = (label) => {
    const screen = screenMap[label];
    if (screen) navigation.navigate(screen);
  };

  // Overlay Supabase's class_subject rows onto the hardcoded list — remote
  // wins per-field when present, so editing just `comingSoon` or `body` in
  // the dashboard doesn't require every field to be duplicated there too.
  const mergedSubjects = useMemo(() => subjects.map((subj) => {
    const remote = remoteSubjects[subj.title];
    return remote ? { ...subj, ...remote } : subj;
  }), [remoteSubjects]);

  const recTopics = useMemo(() => pickRecommendedTopics(mergedSubjects, band, 3), [band, mergedSubjects]);
  const recGames  = useMemo(() => pickRecommendedGames(band, 2), [band]);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('LibraryScreen'))}
          style={{ marginBottom: 10 }}
        >
          <Ionicons name="chevron-back" size={22} color={c.teal} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Academy Classes</Text>
        {showSubtext && <Text style={styles.headerSubtitle}>Pick a subject to build up that wing of your base</Text>}

        {educatorMode === true && (
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
          <TouchableOpacity
            onPress={() => navigation.navigate('LessonBuilder')}
            activeOpacity={0.85}
            style={[styles.builderCta, { backgroundColor: c.teal }]}
          >
            <Ionicons name="hammer-outline" size={15} color="#fff" />
            <Text style={styles.builderCtaText}>Build a Classroom Lesson</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('MyLessonPlans')}
            activeOpacity={0.85}
            style={[styles.builderCta, { backgroundColor: c.bg1, borderWidth: 1, borderColor: c.border }]}
          >
            <Ionicons name="folder-open-outline" size={15} color={c.teal} />
            <Text style={[styles.builderCtaText, { color: c.text1 }]}>My Plans</Text>
          </TouchableOpacity>
        </View>
        )}
      </View>

      {/* Grade band selector */}
      <TourSpot id="classes-list">
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.bandRow}>
        {BANDS.map(b => (
          <TouchableOpacity
            key={b}
            onPress={() => chooseBand(b)}
            style={[styles.bandChip, band === b && { backgroundColor: c.teal, borderColor: c.teal }]}
          >
            <Text style={[styles.bandChipText, band === b && { color: '#fff', fontWeight: '800' }]}>
              {b === 'All' ? 'All grades' : b}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      </TourSpot>

      {/* Suggested by how the games actually went — the other half of the
          Training <-> Academy link. Unlike "Recommended for <band>" below
          (which is a static grade-band pick), these are the topics behind
          the games this player is currently weakest at. */}
      {fromGames.length > 0 && (
        <View style={styles.recSection}>
          <Text style={styles.recTitle}>From your games</Text>
          {showSubtext && (
            <Text style={styles.fromGamesSub}>
              Topics behind the drills you're finding hardest right now.
            </Text>
          )}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recRow}>
            {fromGames.map((rec, i) => (
              <TouchableOpacity
                key={'weak-' + i}
                style={[styles.recCard, { borderTopColor: rec.subjectColor || c.gold }]}
                onPress={() => navigation.navigate(rec.screen)}
                activeOpacity={0.85}
              >
                {showEmojis && rec.gameIcon
                  ? <Text style={{ fontSize: 18 }}>{rec.gameIcon}</Text>
                  : <Ionicons name="school-outline" size={16} color={rec.subjectColor || c.gold} />}
                <Text style={styles.recCardSubject} numberOfLines={1}>
                  {rec.gameName} · {rec.accuracy}%
                </Text>
                <Text style={styles.recCardLabel} numberOfLines={2}>{rec.topicTitle}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Recommended for you */}
      {(recTopics.length > 0 || recGames.length > 0) && (
        <View style={styles.recSection}>
          <Text style={styles.recTitle}>Recommended for {BAND_LABEL[band] || 'you'}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recRow}>
            {recTopics.map((rec, i) => (
              <TouchableOpacity
                key={'topic-' + i}
                style={[styles.recCard, { borderTopColor: rec.subjectColor }]}
                onPress={() => goToChild(rec.label)}
                activeOpacity={0.85}
              >
                <Ionicons name={rec.subjectIcon} size={18} color={rec.subjectColor} />
                <Text style={styles.recCardSubject}>{rec.subjectTitle}</Text>
                <Text style={styles.recCardLabel} numberOfLines={2}>{rec.label}</Text>
              </TouchableOpacity>
            ))}
            {recGames.map(game => (
              <TouchableOpacity
                key={'game-' + game.id}
                style={[styles.recCard, { borderTopColor: c.gold }]}
                onPress={() => navigation.navigate('Play', { gameId: game.id })}
                activeOpacity={0.85}
              >
                {showEmojis ? <Text style={{ fontSize: 18 }}>{game.icon}</Text> : <Ionicons name="game-controller-outline" size={16} color={c.gold} />}
                <Text style={styles.recCardSubject}>Game</Text>
                <Text style={styles.recCardLabel} numberOfLines={2}>{game.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {mergedSubjects.map((item, index) => {
        const matchingChildren = item.children
          ? (band === 'All' ? item.children : item.children.filter(ch => ch.grade === band))
          : null;

        return (
          <View key={index} style={styles.cardWrapper}>
            <TouchableOpacity
              style={[styles.category, { borderTopColor: item.color }]}
              onPress={() => {
                if (item.children) toggle(item.title);
                else if (item.comingSoon) {
                  Alert.alert('Coming soon', `${item.title} classes are still being built.`);
                } else {
                  goToChild(item.title);
                }
              }}
              activeOpacity={0.8}
            >
              <View style={styles.categoryHeader}>
                <View style={[styles.iconContainer, { backgroundColor: item.color + '22' }]}>
                  <Ionicons name={item.icon} size={26} color={item.color} />
                </View>
                <View style={styles.categoryTextContainer}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={styles.categoryText}>{item.title}</Text>
                    {item.comingSoon && (
                      <View style={[styles.comingSoonBadge, { backgroundColor: item.color + '22', borderColor: item.color + '55' }]}>
                        <Text style={[styles.comingSoonBadgeText, { color: item.color }]}>SOON</Text>
                      </View>
                    )}
                  </View>
                  {showSubtext && <Text style={styles.categoryDescription}>{item.description}</Text>}
                </View>
                {item.children && (
                  <Ionicons
                    name={open[item.title] ? 'chevron-up' : 'chevron-down'}
                    size={22}
                    color={c.text4}
                    style={styles.chevron}
                  />
                )}
              </View>
            </TouchableOpacity>

            {item.children && open[item.title] && (
              <View style={styles.sublist}>
                {educatorMode === true && (
                  band === 'All' ? (
                    <Text style={styles.noneForBand}>Pick a grade above, then tap "Build a Classroom Lesson" to put together a {item.title} lesson plan.</Text>
                  ) : (
                    <TouchableOpacity
                      onPress={() => navigation.navigate('LessonBuilder', { subjectTitle: item.title, gradeBand: band })}
                      activeOpacity={0.8}
                      style={[styles.lessonPlanCta, { borderColor: item.color + '55', backgroundColor: item.color + '12' }]}
                    >
                      <Ionicons name="clipboard-outline" size={16} color={item.color} style={{ marginRight: 8 }} />
                      <Text style={[styles.lessonPlanCtaText, { color: item.color }]}>
                        Build a Classroom Day Lesson Plan for {BAND_LABEL[band] || band}
                      </Text>
                      <Ionicons name="chevron-forward" size={16} color={item.color} />
                    </TouchableOpacity>
                  )
                )}
                {matchingChildren.length === 0 ? (
                  <Text style={styles.noneForBand}>No {BAND_LABEL[band] || band} content in this subject yet.</Text>
                ) : (
                  matchingChildren.map((child, subIndex) => (
                    <TouchableOpacity
                      key={subIndex}
                      style={styles.subItemContainer}
                      onPress={() => goToChild(child.label)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.subItemDot, { backgroundColor: item.color }]} />
                      <Text style={styles.subItem}>{child.label}</Text>
                      <Text style={styles.subItemGrade}>{child.grade}</Text>
                      <Ionicons name="chevron-forward" size={18} color={c.text4} />
                    </TouchableOpacity>
                  ))
                )}
              </View>
            )}
          </View>
        );
      })}

      <View style={styles.footer} />
    </ScrollView>
  );
}

const makeStyles = (c, t, s, r) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: c.bg0,
    paddingTop: 50,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: t.xxxl,
    fontWeight: '700',
    color: c.text1,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: t.md,
    color: c.text3,
    fontWeight: '400',
  },
  bandRow: {
    paddingHorizontal: 20,
    gap: 8,
    paddingBottom: 4,
  },
  bandChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: r.full,
    backgroundColor: c.bg1,
    borderWidth: 1,
    borderColor: c.border,
  },
  bandChipText: {
    fontSize: t.sm,
    color: c.text2,
    fontWeight: '600',
  },
  recSection: {
    marginTop: 18,
    marginBottom: 6,
  },
  recTitle: {
    fontSize: t.md,
    fontWeight: '800',
    color: c.text1,
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  fromGamesSub: {
    fontSize: t.xs,
    color: c.text3,
    paddingHorizontal: 20,
    marginTop: -6,
    marginBottom: 10,
  },
  recRow: {
    paddingHorizontal: 20,
    gap: 10,
    paddingBottom: 4,
  },
  recCard: {
    width: 130,
    backgroundColor: c.bg1,
    borderRadius: r.md,
    borderWidth: 0.5,
    borderColor: c.border,
    borderTopWidth: 3,
    padding: 12,
    gap: 4,
  },
  recCardSubject: {
    fontSize: 9,
    color: c.text4,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  recCardLabel: {
    fontSize: t.sm,
    color: c.text1,
    fontWeight: '700',
    lineHeight: 17,
  },
  cardWrapper: {
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  category: {
    padding: 18,
    borderRadius: r.lg,
    backgroundColor: c.bg1,
    borderWidth: 0.5,
    borderColor: c.border,
    borderTopWidth: 3,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  categoryTextContainer: {
    flex: 1,
  },
  categoryText: {
    fontSize: t.lg,
    fontWeight: '700',
    color: c.text1,
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: t.sm,
    color: c.text3,
    fontWeight: '400',
  },
  chevron: {
    marginLeft: 8,
  },
  comingSoonBadge: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  comingSoonBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  sublist: {
    backgroundColor: c.bg2,
    borderRadius: r.md,
    marginTop: 8,
    paddingVertical: 8,
  },
  builderCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: r.full,
  },
  builderCtaText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#fff',
  },
  lessonPlanCta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
    marginBottom: 8,
    padding: 12,
    borderRadius: r.md,
    borderWidth: 1,
  },
  lessonPlanCtaText: {
    flex: 1,
    fontSize: t.sm,
    fontWeight: '700',
  },
  noneForBand: {
    color: c.text4,
    fontSize: t.sm,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  subItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: c.border,
  },
  subItemDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  subItem: {
    flex: 1,
    fontSize: t.md,
    color: c.text1,
    fontWeight: '500',
  },
  subItemGrade: {
    fontSize: 10,
    color: c.text4,
    fontWeight: '700',
    marginRight: 8,
  },
  footer: {
    height: 30,
  },
});
