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

// `classKey` (the registered navigation screen name, e.g. 'AlgebraAndFunctions')
// scopes the Supabase fetch — see ClassesStack.js for the full list. Edit,
// add, or remove topics for a class any time via app_content
// (type='class_topic', key=classKey); `fallbackTopics` is what still renders
// before that resolves, or if it ever fails/comes back empty, so nothing
// regresses if Supabase is unreachable.
export default function ClassTopicScreen({ title, classKey, fallbackTopics }) {
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
      <Text style={{ fontSize: t.xxl, fontWeight: t.bold, textAlign: 'center', marginBottom: s.lg, color: c.text1 }}>
        {title}
      </Text>

      {topics.map((topic) => (
        <View
          key={topic.key}
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

            {topic.help?.videos?.length > 0 && (
              <TouchableOpacity onPress={() => toggleHelp(topic.key)} activeOpacity={0.7}>
                <Text style={{ fontSize: t.sm, fontWeight: t.semibold, color: c.teal }}>
                  Need help? {openSections[topic.key] ? '▲' : '▼'}
                </Text>
              </TouchableOpacity>
            )}

            {openSections[topic.key] && (
              <View style={{ marginTop: s.sm, padding: s.md, borderRadius: r.md, backgroundColor: c.bg2 }}>
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
      ))}
    </ScrollView>
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
