// src/components/TopicLessonPanel.js
// The "go deeper" layer for one Academy Classes topic — Learn concept
// cards, an interactive Practice quiz, and an Apply mini-project checklist.
// Rendered inside ClassTopicScreen.js under a topic's existing description
// + video links (those stay exactly as they were — this is purely additive).
// A topic with no `learn`/`practice`/`apply` in its meta renders nothing,
// so older/not-yet-enriched topics look exactly like before.
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../api/supabaseClient';
import { useProfiles } from '../../context/ProfileAccountsContext';
import { saveVaultDocument, listVaultDocuments } from '../api/personaService';
import { optionOrder } from '../logic/optionOrder';

function LearnCards({ learn, color, c, t, s, r }) {
  return (
    <View style={{ marginTop: 8 }}>
      {learn.map((card, i) => (
        <View key={i} style={{ marginBottom: 8, padding: 10, borderRadius: r.md, backgroundColor: c.bg1 }}>
          {card.heading ? (
            <Text style={{ fontSize: t.sm, fontWeight: t.bold, color: color, marginBottom: 3 }}>{card.heading}</Text>
          ) : null}
          <Text style={{ fontSize: t.sm, lineHeight: 19, color: c.text2 }}>{card.body}</Text>
        </View>
      ))}
    </View>
  );
}

function PracticeQuiz({ practice, color, c, t, s, r }) {
  const [answers, setAnswers] = useState({}); // index -> chosen option index

  const choose = (qIndex, optIndex) => {
    if (answers[qIndex] !== undefined) return; // lock after first pick
    setAnswers(prev => ({ ...prev, [qIndex]: optIndex }));
  };

  const correctCount = practice.reduce((n, q, i) => (answers[i] === q.answerIndex ? n + 1 : n), 0);
  const answeredCount = Object.keys(answers).length;

  return (
    <View style={{ marginTop: 8 }}>
      {practice.map((q, qi) => {
        const picked = answers[qi];
        const isAnswered = picked !== undefined;
        return (
          <View key={qi} style={{ marginBottom: 10, padding: 10, borderRadius: r.md, backgroundColor: c.bg1 }}>
            <Text style={{ fontSize: t.sm, fontWeight: t.semibold, color: c.text1, marginBottom: 6 }}>{q.question}</Text>
            {optionOrder(q.question, (q.options || []).length).map((oi) => {
              const opt = q.options[oi];
              const isCorrect = oi === q.answerIndex;
              const isPicked = oi === picked;
              let bg = 'transparent';
              let borderColor = c.border;
              if (isAnswered && isCorrect) { bg = '#3AC86022'; borderColor = '#3AC860'; }
              else if (isAnswered && isPicked && !isCorrect) { bg = '#E0585822'; borderColor = '#E05858'; }
              return (
                <TouchableOpacity
                  key={oi}
                  onPress={() => choose(qi, oi)}
                  disabled={isAnswered}
                  activeOpacity={0.7}
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: 8,
                    paddingVertical: 8, paddingHorizontal: 10, borderRadius: r.sm,
                    borderWidth: 1, borderColor, backgroundColor: bg, marginTop: 6,
                  }}
                >
                  <Ionicons
                    name={isAnswered && isCorrect ? 'checkmark-circle' : isAnswered && isPicked ? 'close-circle' : 'ellipse-outline'}
                    size={16}
                    color={isAnswered && isCorrect ? '#3AC860' : isAnswered && isPicked ? '#E05858' : c.text4}
                  />
                  <Text style={{ fontSize: t.sm, color: c.text2, flex: 1 }}>{opt}</Text>
                </TouchableOpacity>
              );
            })}
            {isAnswered && q.explanation ? (
              <Text style={{ fontSize: 12, color: c.text3, marginTop: 6, fontStyle: 'italic' }}>{q.explanation}</Text>
            ) : null}
          </View>
        );
      })}
      {practice.length > 0 && (
        <Text style={{ fontSize: 12, fontWeight: '700', color: c.text3 }}>
          {answeredCount === practice.length
            ? `Score: ${correctCount}/${practice.length}`
            : `${answeredCount}/${practice.length} answered`}
        </Text>
      )}
    </View>
  );
}

// A topic can opt into the Vault by adding `apply.deliverable`:
//   deliverable: { track: 'L2', title: 'Entity Selection Decision Matrix' }
//
// When it's present, the checklist is no longer throwaway local state — it
// persists to vault_documents, survives app restarts, and counts toward that
// level's gate review (getTrackProgress in personaService.js). When it's
// absent — every pre-existing topic in the app — behaviour is exactly as
// before: local-only checkboxes, zero network calls, no signed-in requirement.
function ApplyChallenge({ apply, color, topicKey, c, t, s, r }) {
  const items = apply.checklist || [];
  const deliverable = apply.deliverable;
  const tracked = !!deliverable && !!topicKey;
  // Which profile this worksheet belongs to. Someone running two startups
  // fills this lesson in separately for each — same lesson, different vault
  // document.
  const { active: activeProfile } = useProfiles();

  const [checked, setChecked] = useState({});
  const [userId, setUserId] = useState(null);
  const [hydrated, setHydrated] = useState(!tracked);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);

  // Load any previously saved state for this lesson.
  useEffect(() => {
    if (!tracked) return;
    let alive = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      const uid = data?.user?.id;
      if (!alive) return;
      if (!uid) { setHydrated(true); return; } // signed out — falls back to local-only
      setUserId(uid);
      const docs = await listVaultDocuments(uid, { track: deliverable.track, profileId: activeProfile?.id });
      if (!alive) return;
      const mine = docs.find(d => d.lesson_key === topicKey);
      if (mine?.payload?.checked) setChecked(mine.payload.checked);
      if (mine?.updated_at) setSavedAt(mine.updated_at);
      setHydrated(true);
    })();
    return () => { alive = false; };
  }, [tracked, topicKey, deliverable?.track, activeProfile?.id]);

  const toggle = async (i) => {
    const next = { ...checked, [i]: !checked[i] };
    setChecked(next);
    if (!tracked || !userId) return;

    // A lesson's deliverable is 'complete' only when every box is ticked —
    // that's what the level's gate review counts, so partial work stays a
    // draft rather than inflating progress.
    const allDone = items.length > 0 && items.every((_, idx) => next[idx]);
    setSaving(true);
    try {
      const row = await saveVaultDocument(userId, {
        profileId: activeProfile?.id,
        track: deliverable.track,
        lessonKey: topicKey,
        title: deliverable.title,
        payload: { checked: next },
        status: allDone ? 'complete' : 'draft',
      });
      if (row?.updated_at) setSavedAt(row.updated_at);
    } catch (e) {
      // Don't fight the user mid-tap with an alert — the box stays ticked
      // locally and the next toggle retries the write.
      console.warn('[vault] save failed', e?.message);
    } finally {
      setSaving(false);
    }
  };

  const doneCount = items.reduce((n, _, i) => (checked[i] ? n + 1 : n), 0);
  const allDone = items.length > 0 && doneCount === items.length;

  return (
    <View style={{ marginTop: 8, padding: 10, borderRadius: r.md, backgroundColor: c.bg1 }}>
      <Text style={{ fontSize: t.sm, lineHeight: 19, color: c.text2, marginBottom: items.length ? 8 : 0 }}>{apply.prompt}</Text>

      {tracked && !hydrated && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6 }}>
          <ActivityIndicator size="small" color={color} />
          <Text style={{ fontSize: 11, color: c.text4 }}>Loading your saved work…</Text>
        </View>
      )}

      {(!tracked || hydrated) && items.map((label, i) => (
        <TouchableOpacity key={i} onPress={() => toggle(i)} activeOpacity={0.7} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 }}>
          <Ionicons name={checked[i] ? 'checkbox' : 'square-outline'} size={17} color={checked[i] ? color : c.text4} />
          <Text style={{ fontSize: t.sm, color: c.text2, flex: 1, textDecorationLine: checked[i] ? 'line-through' : 'none' }}>{label}</Text>
        </TouchableOpacity>
      ))}

      {tracked && hydrated && (
        <View style={{ marginTop: 10, paddingTop: 8, borderTopWidth: 0.5, borderTopColor: c.border }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons
              name={allDone ? 'shield-checkmark' : 'folder-open-outline'}
              size={14}
              color={allDone ? color : c.text4}
            />
            <Text style={{ fontSize: 11, fontWeight: '700', color: allDone ? color : c.text3, flex: 1 }}>
              {allDone
                ? `Vault: ${deliverable.title} — complete`
                : `Vault: ${deliverable.title} — ${doneCount}/${items.length}`}
            </Text>
            {saving && <ActivityIndicator size="small" color={c.text4} />}
          </View>
          {!userId && (
            <Text style={{ fontSize: 10, color: c.text4, marginTop: 4, lineHeight: 14 }}>
              Sign in to save this to your Vault — right now it only lives on this device.
            </Text>
          )}
          {userId && savedAt && (
            <Text style={{ fontSize: 10, color: c.text4, marginTop: 4 }}>Saved to your Vault</Text>
          )}
        </View>
      )}
    </View>
  );
}

const TABS = [
  { key: 'learn', label: 'Learn', icon: 'bulb-outline' },
  { key: 'practice', label: 'Practice', icon: 'create-outline' },
  { key: 'apply', label: 'Apply', icon: 'construct-outline' },
];

export default function TopicLessonPanel({ topic, color, c, t, s, r }) {
  const hasLearn = topic.learn?.length > 0;
  const hasPractice = topic.practice?.length > 0;
  const hasApply = !!topic.apply?.prompt;
  const available = TABS.filter(tab =>
    (tab.key === 'learn' && hasLearn) ||
    (tab.key === 'practice' && hasPractice) ||
    (tab.key === 'apply' && hasApply)
  );

  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState(available[0]?.key);

  if (available.length === 0) return null;

  return (
    <View style={{ marginTop: s.sm }}>
      <TouchableOpacity onPress={() => setOpen(!open)} activeOpacity={0.7} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Ionicons name="school-outline" size={15} color={color} />
        <Text style={{ fontSize: t.sm, fontWeight: t.semibold, color }}>
          Full lesson: Learn · Practice · Apply {open ? '▲' : '▼'}
        </Text>
      </TouchableOpacity>

      {open && (
        <View style={{ marginTop: 8 }}>
          <View style={{ flexDirection: 'row', gap: 6, marginBottom: 6 }}>
            {available.map(tabDef => (
              <TouchableOpacity
                key={tabDef.key}
                onPress={() => setTab(tabDef.key)}
                activeOpacity={0.7}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 4,
                  paddingHorizontal: 10, paddingVertical: 6, borderRadius: r.full,
                  backgroundColor: tab === tabDef.key ? color : 'transparent',
                  borderWidth: 1, borderColor: color,
                }}
              >
                <Ionicons name={tabDef.icon} size={13} color={tab === tabDef.key ? '#fff' : color} />
                <Text style={{ fontSize: 12, fontWeight: '800', color: tab === tabDef.key ? '#fff' : color }}>{tabDef.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {tab === 'learn' && hasLearn && <LearnCards learn={topic.learn} color={color} c={c} t={t} s={s} r={r} />}
          {tab === 'practice' && hasPractice && <PracticeQuiz practice={topic.practice} color={color} c={c} t={t} s={s} r={r} />}
          {tab === 'apply' && hasApply && <ApplyChallenge apply={topic.apply} topicKey={topic.key} color={color} c={c} t={t} s={s} r={r} />}
        </View>
      )}
    </View>
  );
}
