// src/components/ClassTopicScreen.js
// Shared, themed presentation for every Academy Classes subject page.
// Each subject file (src/screens/classes/**) just supplies a title + a
// `topics` array — this renders it consistently, in both light and dark.
import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { fetchContentPool } from '../api/remoteConfigService';
import TopicLessonPanel from './TopicLessonPanel';
import { gamesForTopic, openGame } from '../data/skillLinks';
import { CLASS_SUBJECTS, CLASS_SCREEN_MAP } from '../data/classCatalog';
import { catalogCounts } from '../data/topicCatalog';
import { Ionicons } from '@expo/vector-icons';
import { FONTS } from '../theme';

const FONTS_MONO = FONTS.mono;

// `classKey` (the registered navigation screen name, e.g. 'AlgebraAndFunctions')
// scopes the Supabase fetch — see ClassesStack.js for the full list. Edit,
// add, or remove topics for a class any time via app_content
// (type='class_topic', key=classKey); `fallbackTopics` is what still renders
// before that resolves, or if it ever fails/comes back empty, so nothing
// regresses if Supabase is unreachable.
// `header` — optional node rendered under the title, above the topics. Used by
// the curriculum levels (LevelScreen.js) to state what the level is for and
// how many Vault deliverables it holds. Every existing caller omits it and is
// unaffected.
export default function ClassTopicScreen({ title, classKey, fallbackTopics, header }) {
  const { colors: c, typography: t, spacing: s, radius: r } = useTheme();
  const navigation = useNavigation();
  const [openSections, setOpenSections] = useState({});
  const [topics, setTopics] = useState(fallbackTopics);
  const toggleHelp = (key) => setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));

  // Remote topics — falls back to fallbackTopics until this resolves, or
  // forever if it fails/is empty.
  useEffect(() => {
    if (!classKey) return;
    fetchContentPool('class_topic', classKey).then((rows) => {
      if (rows.length) {
        // Defensive dedupe by topic_key — app_content has no unique
        // constraint across (type, key, title), so a migration re-run (or
        // any other accidental double-insert in Supabase) produces real
        // duplicate rows. Same row shape wins either way; last one in sort
        // order takes it, keeping edits made after a duplicate visible.
        const seen = new Map();
        rows.forEach((row) => {
          const key = row.meta?.topic_key || row.id;
          seen.set(key, {
            key,
            title: row.title,
            grade: row.meta?.grade,
            color: row.meta?.color,
            description: row.body,
            help: row.meta?.help || {},
            // The optional "go deeper" layer — see TopicLessonPanel.js.
            learn: row.meta?.learn || [],
            practice: row.meta?.practice || [],
            apply: row.meta?.apply || null,
          });
        });
        setTopics(Array.from(seen.values()));
      }
    });
  }, [classKey]);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.bg0 }}
      contentContainerStyle={{ padding: s.lg, paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Class pages had no way back on web (no swipe, no hardware button),
          and the Library tab doesn't pop a nested stack there. */}
      <TouchableOpacity
        onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('ClassesMain'))}
        style={{ alignSelf: 'flex-start', marginBottom: 4 }}
        accessibilityLabel="Back"
        hitSlop={8}
      >
        <Ionicons name="chevron-back" size={22} color={c.teal} />
      </TouchableOpacity>
      <Text style={{ fontSize: t.xxl, fontWeight: t.bold, textAlign: 'center', marginBottom: header ? s.sm : s.lg, color: c.text1 }}>
        {title}
      </Text>

      {header}

      {topics.map((topic, ti) => (
        <React.Fragment key={topic.key}>
        {/* Module heading — only for topics that carry one (the curriculum
            levels). Printed when the module changes, so a 20-lesson level
            reads as its five modules instead of one flat list. */}
        {topic.module && (ti === 0 || topics[ti - 1]?.module !== topic.module) && (
          <Text style={{
            fontSize: 11, color: c.text4, fontFamily: FONTS_MONO,
            textTransform: 'uppercase', letterSpacing: 1, marginTop: ti === 0 ? 4 : s.md, marginBottom: s.sm,
          }}>
            {topic.module}
          </Text>
        )}
        <View
          style={{
            marginBottom: s.lg, borderRadius: r.lg, overflow: 'hidden',
            backgroundColor: c.bg1, borderWidth: 0.5, borderColor: c.border,
            borderTopWidth: 3, borderTopColor: topic.color,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: s.md, paddingHorizontal: s.lg, backgroundColor: topic.color + '18' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: t.lg, fontWeight: t.bold, color: topic.color }}>{topic.title}</Text>
              {topic.grade && (
                <Text style={{ fontSize: 10, fontWeight: '800', letterSpacing: 0.5, color: topic.color, marginTop: 2, opacity: 0.8 }}>
                  GRADES {topic.grade}
                </Text>
              )}
            </View>
          </View>

          <View style={{ paddingHorizontal: s.lg, paddingVertical: s.md }}>
            <Text style={{ fontSize: t.sm, fontWeight: t.semibold, marginBottom: 4, color: c.text2 }}>What is it?</Text>
            <Text style={{ fontSize: t.sm, lineHeight: 20, marginBottom: s.md, color: c.text2 }}>{topic.description}</Text>

            {(topic.help?.videos?.length > 0 || topic.help?.readings?.length > 0) && (
              <TouchableOpacity onPress={() => toggleHelp(topic.key)} activeOpacity={0.7}>
                <Text style={{ fontSize: t.sm, fontWeight: t.semibold, color: c.teal }}>
                  Need help? {openSections[topic.key] ? '▲' : '▼'}
                </Text>
              </TouchableOpacity>
            )}

            {openSections[topic.key] && (
              <View style={{ marginTop: s.sm, padding: s.md, borderRadius: r.md, backgroundColor: c.bg2 }}>
                {/* Readings were in almost every class file but were never
                    shown: this section only listed videos. */}
                {topic.help?.readings?.length > 0 && (
                  <>
                    <Text style={{ fontSize: t.sm, fontWeight: t.semibold, marginBottom: 6, color: c.text1 }}>Readings</Text>
                    {topic.help.readings.map((reading, idx) => (
                      <Text
                        key={idx}
                        style={{ fontSize: t.sm, color: c.teal, marginLeft: s.sm, marginTop: 4, textDecorationLine: 'underline' }}
                        onPress={() => Linking.openURL(reading.url)}
                      >
                        • {reading.title}
                      </Text>
                    ))}
                  </>
                )}
                {topic.help?.videos?.length > 0 && topic.help?.readings?.length > 0 && <View style={{ height: s.md }} />}
                {topic.help?.videos?.length > 0 && (
                  <>
                    <Text style={{ fontSize: t.sm, fontWeight: t.semibold, marginBottom: 6, color: c.text1 }}>Videos</Text>
                    {topic.help.videos.map((video, idx) => (
                      <Text
                        key={idx}
                        style={{ fontSize: t.sm, color: c.teal, marginLeft: s.sm, marginTop: 4, textDecorationLine: 'underline' }}
                        onPress={() => Linking.openURL(video.url)}
                      >
                        • {video.title}
                      </Text>
                    ))}
                  </>
                )}
              </View>
            )}

            <TopicLessonPanel topic={topic} color={topic.color} c={c} t={t} s={s} r={r} />

            {/* The lessons -> games half of the Training/Academy link:
                every Training Center game that practises THIS topic (see
                src/data/skillLinks.js), so a topic isn't a dead end that
                only reads. Renders nothing for topics no game covers. */}
            <TopicGames
              screen={classKey}
              topicKey={topic.key}
              color={topic.color}
              navigation={navigation}
              c={c} t={t} s={s} r={r}
            />
          </View>
        </View>
        </React.Fragment>
      ))}

      <ComingFooter classKey={classKey} navigation={navigation} c={c} t={t} s={s} r={r} />
    </ScrollView>
  );
}

// Which Classes subject a class screen belongs to. Subjects with topics list
// them as children; the rest open straight to one screen named after them.
function subjectForScreen(screen) {
  return CLASS_SUBJECTS.find(subj => (subj.children
    ? subj.children.some(ch => CLASS_SCREEN_MAP[ch.label] === screen)
    : CLASS_SCREEN_MAP[subj.title] === screen)) || null;
}

// The end of a subject's page: what else is planned for it, on the Topic map.
// Subjects that open straight to one screen (Technology, Health, Business,
// Foreign Language) never show Classes' expanded list, so this is where
// their roadmap link lives.
function ComingFooter({ classKey, navigation, c, t, s, r }) {
  const subject = subjectForScreen(classKey);
  if (!subject) return null;
  const { total, built } = catalogCounts(subject.title);
  if (!total) return null;
  return (
    <TouchableOpacity
      onPress={() => navigation.navigate('TopicCatalog', { subject: subject.title })}
      activeOpacity={0.8}
      style={{
        flexDirection: 'row', alignItems: 'center', gap: s.md, padding: s.md,
        borderRadius: r.lg, borderWidth: 1, borderStyle: 'dashed', borderColor: subject.color + '88',
        backgroundColor: subject.color + '0f',
      }}
    >
      <Ionicons name="map-outline" size={20} color={subject.color} />
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: t.sm, fontWeight: t.bold, color: c.text1 }}>More {subject.title} on the way</Text>
        <Text style={{ fontSize: 12, color: c.text3, marginTop: 2 }}>{built} of {total} planned topics are ready. See what's coming.</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={c.text4} />
    </TouchableOpacity>
  );
}

// One row of "practise this for real" game chips under a topic. Kept as its
// own component so the lookup only runs for topics that render, and so a
// topic with no linked game costs nothing but an early return.
function TopicGames({ screen, topicKey, color, navigation, c, t, s, r }) {
  const games = gamesForTopic(screen, topicKey);
  if (!games.length) return null;

  return (
    <View style={{ marginTop: s.md, paddingTop: s.md, borderTopWidth: 0.5, borderTopColor: c.border }}>
      <Text style={{ fontSize: 10, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase', color: c.text3, marginBottom: s.sm }}>
        Practise this
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: s.sm }}>
        {games.map((game) => (
          <TouchableOpacity
            key={game.id}
            onPress={() => openGame(navigation, game.id)}
            activeOpacity={0.8}
            style={{
              flexDirection: 'row', alignItems: 'center', gap: 6,
              borderWidth: 1, borderColor: color + '66', backgroundColor: color + '14',
              borderRadius: r.md, paddingHorizontal: s.md, paddingVertical: s.sm,
            }}
          >
            <Text style={{ fontSize: 14 }}>{game.icon}</Text>
            <Text style={{ fontSize: t.sm, fontWeight: t.semibold, color: c.text1 }}>{game.name}</Text>
            <Text style={{ fontSize: t.sm, color, fontWeight: t.bold }}>▸</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
