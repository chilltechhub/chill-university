// src/screens/TopicCatalogScreen.js
// The Topic map: every topic planned for Classes (src/data/topicCatalog.js),
// ready now or not.
//
//   no `subject` param   every subject this person's Classes shows, with
//                        how many of its topics are ready
//   `subject`            that subject's topics, in their groups, each with
//                        its level, its example angle and a short summary.
//                        Ready ones open their lesson or quest.
//
// Showing what isn't built yet is deliberate. The example angle on each
// topic is useful on its own (it's a question worth looking up), and it
// tells people what the app is heading toward instead of hiding it.
import React, { useMemo, useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useAccess } from '../../context/AccessContext';
import { CLASS_SUBJECTS } from '../data/classCatalog';
import { TOPIC_CATALOG, catalogForSubject, catalogCounts, LEVEL_LABELS } from '../data/topicCatalog';
import { getQuest } from '../data/quests';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'ready', label: 'Ready now' },
  { key: 1, label: LEVEL_LABELS[1] },
  { key: 2, label: LEVEL_LABELS[2] },
  { key: 3, label: LEVEL_LABELS[3] },
];

export default function TopicCatalogScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const subject = route.params?.subject || null;
  const { colors: c, typography: t, spacing: s, radius: r } = useTheme();
  const { isSubjectVisible, signalAction } = useAccess();
  const [filter, setFilter] = useState('all');

  const back = () => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('ClassesMain'));
  const subjectMeta = (title) => CLASS_SUBJECTS.find(sj => sj.title === title);

  const open = (link) => {
    if (!link) return;
    signalAction('class-opened');
    if (link.quest) navigation.navigate('Quest', { questId: link.quest });
    else navigation.navigate(link.screen);
  };

  // ── Every subject ──────────────────────────────────────────────────────────
  const subjects = useMemo(
    () => TOPIC_CATALOG.filter(entry => {
      const meta = subjectMeta(entry.subject);
      return meta && (!isSubjectVisible || isSubjectVisible(meta));
    }),
    [isSubjectVisible], // eslint-disable-line react-hooks/exhaustive-deps
  );

  if (!subject) {
    const all = catalogCounts();
    return (
      <ScrollView style={{ flex: 1, backgroundColor: c.bg0 }} contentContainerStyle={{ padding: s.lg, paddingBottom: 60 }}>
        <BackButton onPress={back} c={c} />
        <Text style={{ fontSize: t.xxl, fontWeight: t.bold, color: c.text1 }}>Topic map</Text>
        <Text style={{ fontSize: t.sm, color: c.text3, marginTop: 4, marginBottom: s.lg, lineHeight: 19 }}>
          Every topic planned for Classes. {all.built} are ready now, and {all.total - all.built} more are on the way. Each one already has an angle worth looking into.
        </Text>
        {subjects.map(entry => {
          const meta = subjectMeta(entry.subject);
          const { total, built } = catalogCounts(entry.subject);
          return (
            <TouchableOpacity
              key={entry.subject}
              onPress={() => navigation.push('TopicCatalog', { subject: entry.subject })}
              activeOpacity={0.8}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: s.md,
                backgroundColor: c.bg1, borderRadius: r.lg, borderWidth: 0.5, borderColor: c.border,
                borderLeftWidth: 3, borderLeftColor: meta.color, padding: s.md, marginBottom: s.sm,
              }}
            >
              <Ionicons name={meta.icon} size={22} color={meta.color} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: t.md, fontWeight: t.bold, color: c.text1 }}>{entry.subject}</Text>
                <Text style={{ fontSize: 12, color: c.text3, marginTop: 2 }}>{built} ready · {total - built} coming</Text>
                <View style={{ height: 4, borderRadius: 2, backgroundColor: c.bg2, marginTop: 6, overflow: 'hidden' }}>
                  <View style={{ height: 4, width: `${total ? (built / total) * 100 : 0}%`, backgroundColor: meta.color }} />
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={c.text4} />
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    );
  }

  // ── One subject ────────────────────────────────────────────────────────────
  const entry = catalogForSubject(subject);
  const meta = subjectMeta(subject);
  const color = meta?.color || c.teal;
  const { total, built } = catalogCounts(subject);
  const keep = (tp) => filter === 'all' || (filter === 'ready' ? !!tp.built : tp.level === filter);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.bg0 }} contentContainerStyle={{ padding: s.lg, paddingBottom: 60 }}>
      <BackButton onPress={back} c={c} />
      <Text style={{ fontSize: 11, fontWeight: '800', letterSpacing: 1, color, textTransform: 'uppercase' }}>Topic map</Text>
      <Text style={{ fontSize: t.xxl, fontWeight: t.bold, color: c.text1 }}>{subject}</Text>
      <Text style={{ fontSize: t.sm, color: c.text3, marginTop: 4, marginBottom: s.md }}>
        {built} ready now · {total - built} on the way
      </Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingBottom: s.md }}>
        {FILTERS.map(f => {
          const on = filter === f.key;
          return (
            <TouchableOpacity
              key={String(f.key)}
              onPress={() => setFilter(f.key)}
              activeOpacity={0.7}
              style={{
                paddingHorizontal: 12, paddingVertical: 6, borderRadius: r.full, borderWidth: 1,
                borderColor: on ? color : c.border, backgroundColor: on ? color + '1f' : 'transparent',
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: on ? '800' : '600', color: on ? c.text1 : c.text3 }}>{f.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {(entry?.groups || []).map(group => {
        const shown = group.topics.filter(keep);
        if (!shown.length) return null;
        return (
          <View key={group.title} style={{ marginBottom: s.lg }}>
            <Text style={{ fontSize: 11, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase', color: c.text3, marginBottom: s.sm }}>
              {group.title}
            </Text>
            {shown.map(tp => (
              <TopicCard key={tp.id} topic={tp} color={color} onOpen={open} c={c} t={t} s={s} r={r} />
            ))}
          </View>
        );
      })}
      {(entry?.groups || []).every(g => !g.topics.some(keep)) && (
        <Text style={{ fontSize: t.sm, color: c.text3, textAlign: 'center', marginTop: s.lg }}>Nothing here for that filter yet.</Text>
      )}
    </ScrollView>
  );
}

function BackButton({ onPress, c }) {
  return (
    <TouchableOpacity onPress={onPress} style={{ marginBottom: 10, alignSelf: 'flex-start' }} accessibilityLabel="Back">
      <Ionicons name="chevron-back" size={22} color={c.teal} />
    </TouchableOpacity>
  );
}

function TopicCard({ topic, color, onOpen, c, t, s, r }) {
  const link = topic.built || topic.related;
  const isQuest = !!link?.quest;
  const questTitle = isQuest ? getQuest(link.quest)?.title : null;
  let status;
  if (topic.built) status = { label: isQuest ? 'Open the quest' : 'Open the lesson', icon: isQuest ? 'compass-outline' : 'book-outline', strong: true };
  else if (topic.related) status = { label: 'A related lesson is ready', icon: 'link-outline', strong: false };

  return (
    <View style={{
      backgroundColor: c.bg1, borderRadius: r.md, borderWidth: 0.5, borderColor: c.border,
      padding: s.md, marginBottom: s.sm, opacity: topic.built ? 1 : 0.97,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        <Text style={{ fontSize: 10, fontWeight: '800', letterSpacing: 0.6, color, textTransform: 'uppercase' }}>
          Level {topic.level} · {LEVEL_LABELS[topic.level]}
        </Text>
        <View style={{ flex: 1 }} />
        {topic.built ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
            <Ionicons name="checkmark-circle" size={13} color={c.success} />
            <Text style={{ fontSize: 10, fontWeight: '800', color: c.success, textTransform: 'uppercase', letterSpacing: 0.6 }}>Ready</Text>
          </View>
        ) : (
          <Text style={{ fontSize: 10, fontWeight: '800', color: c.text4, textTransform: 'uppercase', letterSpacing: 0.6 }}>Coming soon</Text>
        )}
      </View>
      <Text style={{ fontSize: t.md, fontWeight: t.bold, color: c.text1 }}>{topic.title}</Text>
      <Text style={{ fontSize: t.sm, fontStyle: 'italic', color: c.text2, marginTop: 2 }}>“{topic.hook}”</Text>
      <Text style={{ fontSize: t.sm, color: c.text3, marginTop: 4, lineHeight: 19 }}>{topic.summary}</Text>
      {status && (
        <TouchableOpacity
          onPress={() => onOpen(link)}
          activeOpacity={0.7}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: s.sm, alignSelf: 'flex-start' }}
          accessibilityRole="button"
        >
          <Ionicons name={status.icon} size={14} color={status.strong ? color : c.text3} />
          <Text style={{ fontSize: 12, fontWeight: '800', color: status.strong ? color : c.text3 }}>
            {status.label}{questTitle ? `: ${questTitle}` : ''}
          </Text>
          <Ionicons name="chevron-forward" size={13} color={status.strong ? color : c.text3} />
        </TouchableOpacity>
      )}
    </View>
  );
}
