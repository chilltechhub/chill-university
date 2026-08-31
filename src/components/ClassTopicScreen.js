// src/components/ClassTopicScreen.js
// Shared, themed presentation for every Academy Classes subject page.
// Each subject file (src/screens/classes/**) just supplies a title + a
// `topics` array — this renders it consistently, in both light and dark.
//
// "Mark complete" writes to `class_topic_progress` (see the Academy plan's
// Phase 1 SQL) and feeds the same points/xp everything else in the app
// reads, via the same `increment_user_progress` RPC gamificationService.js
// already calls from game events — so a finished lesson moves the same
// numbers shown in TopBar and the Games Stats tab. No parallel stats system.
import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, Linking, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../api/supabaseClient';
import { fetchContentPool } from '../api/remoteConfigService';
import { advanceTopicMission } from '../logic/gamificationService';

const LESSON_XP = 15;
const LESSON_POINTS = 8;

// Deterministic, filesystem-free subject key — matches title text, slugified.
function slugify(title) {
  return title.replace(/[^A-Za-z0-9]+/g, '');
}

// `classKey` (the registered navigation screen name, e.g. 'AlgebraAndFunctions')
// scopes the Supabase fetch — see ClassesStack.js for the full list. Edit,
// add, or remove topics for a class any time via app_content
// (type='class_topic', key=classKey); `fallbackTopics` is what still renders
// before that resolves, or if it ever fails/comes back empty, so nothing
// regresses if Supabase is unreachable.
export default function ClassTopicScreen({ title, classKey, fallbackTopics }) {
  const { colors: c, typography: t, spacing: s, radius: r } = useTheme();
  const [openSections, setOpenSections] = useState({});
  const [completed, setCompleted] = useState({});   // topicKey -> true
  const [saving, setSaving] = useState({});         // topicKey -> true while writing
  const [userId, setUserId] = useState(null);
  const [topics, setTopics] = useState(fallbackTopics);
  const toggleHelp = (key) => setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));

  const subjectKey = slugify(title);

  // Remote topics — falls back to fallbackTopics until this resolves, or
  // forever if it fails/is empty. `meta.topic_key` (preserved from the
  // original hardcoded data) is what markComplete() below keys progress on,
  // so migrating a class to Supabase didn't reset anyone's completed
  // topics; a brand-new topic added straight in Supabase just falls back
  // to its row id instead.
  useEffect(() => {
    if (!classKey) return;
    fetchContentPool('class_topic', classKey).then((rows) => {
      if (rows.length) {
        setTopics(rows.map((row) => ({
          key: row.meta?.topic_key || row.id,
          title: row.title,
          grade: row.meta?.grade,
          color: row.meta?.color,
          description: row.body,
          help: row.meta?.help || {},
        })));
      }
    });
  }, [classKey]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const uid = data?.user?.id;
      if (!uid) return;
      setUserId(uid);
      supabase
        .from('class_topic_progress')
        .select('topic_key')
        .eq('user_id', uid)
        .eq('subject_key', subjectKey)
        .then(({ data: rows, error }) => {
          if (error) { console.warn('ClassTopicScreen load progress', error.message); return; }
          const map = {};
          (rows || []).forEach(row => { map[row.topic_key] = true; });
          setCompleted(map);
        });
    });
  }, [subjectKey]);

  const markComplete = async (topicKey) => {
    if (!userId || completed[topicKey] || saving[topicKey]) return;
    setSaving(prev => ({ ...prev, [topicKey]: true }));
    try {
      const { error } = await supabase.from('class_topic_progress').upsert(
        { user_id: userId, subject_key: subjectKey, topic_key: topicKey, status: 'completed', completed_at: new Date().toISOString() },
        { onConflict: 'user_id,subject_key,topic_key' }
      );
      if (error) throw error;

      setCompleted(prev => ({ ...prev, [topicKey]: true }));

      // Same reward pipeline as game events — one shared stats system.
      await supabase.rpc('increment_user_progress', { p_user_id: userId, p_xp: LESSON_XP, p_points: LESSON_POINTS });
      await supabase.from('activity_log').insert({
        user_id: userId,
        activity_type: 'TOPIC_COMPLETED',
        subject: subjectKey,
        xp_earned: LESSON_XP,
        points_earned: LESSON_POINTS,
        metadata: { topicKey, subjectTitle: title },
      });
      await advanceTopicMission(userId, subjectKey);
    } catch (e) {
      console.warn('ClassTopicScreen markComplete', e.message || e);
    }
    setSaving(prev => ({ ...prev, [topicKey]: false }));
  };

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
            {completed[topic.key] && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="checkmark-circle" size={16} color={topic.color} />
                <Text style={{ fontSize: 11, fontWeight: '700', color: topic.color }}>Done</Text>
              </View>
            )}
          </View>

          <View style={{ paddingHorizontal: s.lg, paddingVertical: s.md }}>
            <Text style={{ fontSize: t.sm, fontWeight: t.semibold, marginBottom: 4, color: c.text2 }}>What is it?</Text>
            <Text style={{ fontSize: t.sm, lineHeight: 20, marginBottom: s.md, color: c.text2 }}>{topic.description}</Text>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <TouchableOpacity onPress={() => toggleHelp(topic.key)} activeOpacity={0.7}>
                <Text style={{ fontSize: t.sm, fontWeight: t.semibold, color: c.teal }}>
                  Need help? {openSections[topic.key] ? '▲' : '▼'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => markComplete(topic.key)}
                disabled={completed[topic.key] || saving[topic.key]}
                activeOpacity={0.8}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 6,
                  paddingHorizontal: 12, paddingVertical: 7, borderRadius: r.full,
                  backgroundColor: completed[topic.key] ? topic.color + '22' : topic.color,
                  borderWidth: completed[topic.key] ? 1 : 0, borderColor: topic.color,
                }}
              >
                {saving[topic.key]
                  ? <ActivityIndicator size="small" color={completed[topic.key] ? topic.color : '#fff'} />
                  : <Ionicons name={completed[topic.key] ? 'checkmark-circle' : 'checkmark-circle-outline'} size={14} color={completed[topic.key] ? topic.color : '#fff'} />
                }
                <Text style={{ fontSize: 12, fontWeight: '800', color: completed[topic.key] ? topic.color : '#fff' }}>
                  {completed[topic.key] ? 'Completed' : 'Mark complete'}
                </Text>
              </TouchableOpacity>
            </View>

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
          </View>
        </View>
      ))}
    </ScrollView>
  );
}
