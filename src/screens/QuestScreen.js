// src/screens/QuestScreen.js
// Runs one quest (src/data/quests.js), start to finish:
//
//   The idea → Research → Check → Do it → Done
//
// The research step is the point of the whole thing. The app can't be
// someone's whole education, so each quest sends them out to find a source,
// asks them to judge whether it can be trusted, and has them explain the
// idea back in their own words. That note is what gets saved.
//
// Progress is kept per step on the device (src/logic/questProgress.js), so
// leaving halfway and coming back picks up in the same place.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ScrollView, View, Text, TextInput, TouchableOpacity, ActivityIndicator,
  Linking, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useUserProgress } from '../../context/UserProgressContext';
import { useAccess } from '../../context/AccessContext';
import { getQuest, QUEST_XP, SOURCE_KINDS, SOURCE_CHECKS } from '../data/quests';
import {
  QUEST_STEPS, useQuestProgress, updateQuest, restartQuest,
  addQuestTask, finishQuest, saveQuestResources,
} from '../logic/questProgress';
import ReminderComposer from '../components/ReminderComposer';
import { optionOrder } from '../logic/optionOrder';

// Pass mark for the check: four in five. Missed questions can be retried
// straight away; the explanations are there to learn from, not to punish.
const PASS_SHARE = 0.8;
const MIN_EXPLANATION = 40;

// Readable text on an accent fill: dark on the light accents (amber, green,
// sky), white on the deep ones.
function onColor(hex) {
  const n = parseInt(String(hex).replace('#', ''), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(v => {
    const x = v / 255;
    return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
  });
  const lum = 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
  return lum > 0.3 ? '#111827' : '#ffffff';
}

// "1,000" or "$960" or " 960 " all read as a number.
function parseNumber(text) {
  const cleaned = String(text || '').replace(/[$,\s]/g, '');
  if (!cleaned) return NaN;
  return Number(cleaned);
}

export default function QuestScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const quest = getQuest(route.params?.questId);
  const { colors: c, typography: t, spacing: s, radius: r } = useTheme();
  const { user, refreshProfile } = useUserProgress();
  const { signalAction } = useAccess();
  const { byId, finished, ready } = useQuestProgress();
  const scrollRef = useRef(null);
  const [remindOpen, setRemindOpen] = useState(false);

  // Opening a quest counts as opening a class topic for a goal step like
  // "Open a class and pick one topic".
  useEffect(() => { if (quest) signalAction('class-opened'); }, [quest?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!quest) {
    return (
      <View style={{ flex: 1, backgroundColor: c.bg0, padding: s.lg, justifyContent: 'center' }}>
        <Text style={{ color: c.text2, textAlign: 'center', marginBottom: s.md }}>That quest isn't here any more.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ alignSelf: 'center' }}>
          <Text style={{ color: c.teal, fontWeight: t.bold }}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const progress = byId[quest.id] || {};
  const step = progress.step || 'spark';
  const stepIndex = QUEST_STEPS.findIndex(st => st.key === step);
  const accent = quest.color;
  const ink = onColor(accent);

  const go = (next) => {
    updateQuest(quest.id, { step: next });
    scrollRef.current?.scrollTo?.({ y: 0, animated: false });
  };

  const ui = { c, t, s, r, accent, ink };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: c.bg0 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView automaticallyAdjustKeyboardInsets
        ref={scrollRef}
        contentContainerStyle={{ padding: s.lg, paddingBottom: 60 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <TouchableOpacity
            onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('ClassesMain'))}
            accessibilityLabel="Back"
          >
            <Ionicons name="chevron-back" size={22} color={c.teal} />
          </TouchableOpacity>
          {/* A reminder to come back and finish — a planner item linked to
              this quest, so the notification opens it right here. */}
          {step !== 'done' && !!user && (
            <TouchableOpacity onPress={() => setRemindOpen(true)} accessibilityLabel="Remind me to finish this quest"
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: `${accent}66`, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 }}>
              <Ionicons name="alarm-outline" size={13} color={accent} />
              <Text style={{ fontSize: 12, fontWeight: '700', color: accent }}>Remind me</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <Ionicons name={quest.icon} size={14} color={accent} />
          <Text style={{ fontSize: 11, fontWeight: '800', letterSpacing: 1, color: accent, textTransform: 'uppercase' }}>
            Quest · {quest.subjectLabel} · {quest.minutes} min
          </Text>
        </View>
        <Text style={{ fontSize: t.xxl, fontWeight: t.bold, color: c.text1 }}>{quest.title}</Text>
        <Text style={{ fontSize: t.sm, color: c.text3, marginTop: 2, marginBottom: s.md }}>{quest.tagline}</Text>

        <StepBar step={stepIndex} ui={ui} />

        {!ready ? (
          <ActivityIndicator color={accent} style={{ marginTop: s.xl }} />
        ) : (
          <>
            {step === 'spark' && <SparkStep quest={quest} onNext={() => go('research')} ui={ui} />}
            {step === 'research' && (
              <ResearchStep quest={quest} progress={progress} onBack={() => go('spark')} onNext={() => go('check')} ui={ui} />
            )}
            {step === 'check' && (
              <CheckStep quest={quest} progress={progress} onBack={() => go('research')} onNext={() => go('doIt')} ui={ui} />
            )}
            {step === 'doIt' && (
              <DoItStep
                quest={quest}
                progress={progress}
                userId={user?.id}
                firstTime={!finished.has(quest.id)}
                onFinish={async () => {
                  const result = await finishQuest(user?.id, quest, { xp: QUEST_XP });
                  // Level-up popups fire off a fresh profile.
                  if (result.xp) refreshProfile?.();
                  return result;
                }}
                ui={ui}
              />
            )}
            {step === 'done' && (
              <DoneStep quest={quest} progress={progress} userId={user?.id} navigation={navigation} ui={ui} />
            )}
          </>
        )}
      </ScrollView>
      <ReminderComposer
        visible={remindOpen}
        userId={user?.id}
        onClose={() => setRemindOpen(false)}
        initial={{ title: `Finish the quest: ${quest.title}`, target: { kind: 'quest', key: quest.id }, targetLabel: quest.title, area: quest.area }}
      />
    </KeyboardAvoidingView>
  );
}

// ─── Pieces ──────────────────────────────────────────────────────────────────

function StepBar({ step, ui: { c, s, accent } }) {
  return (
    <View style={{ flexDirection: 'row', gap: 6, marginBottom: s.lg }}>
      {QUEST_STEPS.map((st, i) => (
        <View key={st.key} style={{ flex: 1 }}>
          <View style={{ height: 4, borderRadius: 2, backgroundColor: i <= step ? accent : c.border }} />
          <Text
            numberOfLines={1}
            style={{ fontSize: 10, marginTop: 4, color: i === step ? c.text1 : c.text4, fontWeight: i === step ? '700' : '500' }}
          >
            {st.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

function Card({ children, ui: { c, s, r }, style }) {
  return (
    <View style={[{ backgroundColor: c.bg1, borderRadius: r.lg, borderWidth: 0.5, borderColor: c.border, padding: s.lg, marginBottom: s.md }, style]}>
      {children}
    </View>
  );
}

function Label({ children, ui: { c } }) {
  return (
    <Text style={{ fontSize: 10, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase', color: c.text3, marginBottom: 8 }}>
      {children}
    </Text>
  );
}

function PrimaryButton({ label, onPress, disabled, busy, ui: { t, s, r, accent, ink, c } }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || busy}
      activeOpacity={0.85}
      style={{
        backgroundColor: disabled ? c.bg2 : accent, borderRadius: r.md,
        paddingVertical: 14, alignItems: 'center', marginTop: s.sm,
      }}
    >
      {busy
        ? <ActivityIndicator color={ink} />
        : <Text style={{ fontSize: t.md, fontWeight: '800', color: disabled ? c.text4 : ink }}>{label}</Text>}
    </TouchableOpacity>
  );
}

function SecondaryButton({ label, onPress, icon, ui: { t, s, c } }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, marginTop: s.xs }}>
      {icon ? <Ionicons name={icon} size={15} color={c.text3} /> : null}
      <Text style={{ fontSize: t.sm, fontWeight: '700', color: c.text3 }}>{label}</Text>
    </TouchableOpacity>
  );
}

function ResourceList({ resources, ui }) {
  const { c, t, s } = ui;
  const iconFor = { read: 'document-text-outline', tool: 'construct-outline', watch: 'play-circle-outline' };
  return resources.map(res => (
    <TouchableOpacity
      key={res.url}
      onPress={() => Linking.openURL(res.url)}
      activeOpacity={0.7}
      style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 8 }}
    >
      <Ionicons name={iconFor[res.kind] || 'link-outline'} size={16} color={ui.accent} style={{ marginTop: 1 }} />
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: t.sm, fontWeight: t.semibold, color: c.text1 }}>{res.title}</Text>
        <Text style={{ fontSize: 12, color: c.text3, marginTop: 1 }}>{res.who}</Text>
      </View>
      <Ionicons name="open-outline" size={14} color={c.text4} style={{ marginTop: 2 }} />
    </TouchableOpacity>
  ));
}

// ── 1. The idea ─────────────────────────────────────────────────────────────

function SparkStep({ quest, onNext, ui }) {
  const { c, t, s, r, accent } = ui;
  return (
    <>
      <Card ui={ui}>
        <Text style={{ fontSize: t.md, lineHeight: 23, color: c.text1 }}>{quest.spark.hook}</Text>
      </Card>
      {quest.spark.points.map((point, i) => (
        <View key={i} style={{ flexDirection: 'row', gap: 10, marginBottom: s.md, paddingHorizontal: 2 }}>
          <View style={{ width: 22, height: 22, borderRadius: r.full, backgroundColor: accent + '22', alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>
            <Text style={{ fontSize: 11, fontWeight: '800', color: accent }}>{i + 1}</Text>
          </View>
          <Text style={{ flex: 1, fontSize: t.sm, lineHeight: 20, color: c.text2 }}>{point}</Text>
        </View>
      ))}
      <PrimaryButton label="Start the research" onPress={onNext} ui={ui} />
    </>
  );
}

// ── 2. Research ─────────────────────────────────────────────────────────────

function ResearchStep({ quest, progress, onBack, onNext, ui }) {
  const { c, t, s, r, accent } = ui;
  const [explanation, setExplanation] = useState(progress.explanation || '');
  const [source, setSource] = useState(progress.source || { title: '', url: '', kind: null, checks: [] });

  // Keep the device copy in step as they type, without a write per keystroke.
  // Leaving the step (Next, Back, or the screen itself) saves straight away,
  // so the last few keystrokes before a tap aren't lost with the timer.
  const latest = useRef({ explanation, source });
  latest.current = { explanation, source };
  useEffect(() => {
    const id = setTimeout(() => updateQuest(quest.id, latest.current), 500);
    return () => clearTimeout(id);
  }, [explanation, source, quest.id]);
  useEffect(() => () => updateQuest(quest.id, latest.current), [quest.id]);

  const setField = (k, v) => setSource(prev => ({ ...prev, [k]: v }));
  const toggleCheck = (i) => setSource(prev => {
    const checks = [...(prev.checks || [])];
    checks[i] = !checks[i];
    return { ...prev, checks };
  });

  const ticks = (source.checks || []).filter(Boolean).length;
  const hasSource = !!(source.title?.trim() || source.url?.trim());
  const longEnough = explanation.trim().length >= MIN_EXPLANATION;
  const input = {
    backgroundColor: c.bg2, borderRadius: r.md, borderWidth: 0.5, borderColor: c.border,
    paddingHorizontal: 12, paddingVertical: 10, color: c.text1, fontSize: t.sm,
  };

  return (
    <>
      <Card ui={ui}>
        <Text style={{ fontSize: t.sm, fontWeight: t.bold, color: c.text1, marginBottom: s.sm }}>{quest.research.intro}</Text>
        {quest.research.tasks.map((task, i) => (
          <View key={i} style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
            <Text style={{ fontSize: t.sm, fontWeight: '800', color: accent, width: 16 }}>{i + 1}.</Text>
            <Text style={{ flex: 1, fontSize: t.sm, lineHeight: 20, color: c.text2 }}>{task}</Text>
          </View>
        ))}
      </Card>

      <Card ui={ui}>
        <Label ui={ui}>Places to start</Label>
        <ResourceList resources={quest.resources} ui={ui} />
      </Card>

      <Card ui={ui}>
        <Label ui={ui}>{quest.research.sourcePrompt}</Label>
        <TextInput
          value={source.title}
          onChangeText={v => setField('title', v)}
          placeholder="Name of the page, video, book or app"
          placeholderTextColor={c.text4}
          style={input}
        />
        <TextInput
          value={source.url}
          onChangeText={v => setField('url', v)}
          placeholder="Link (optional)"
          placeholderTextColor={c.text4}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          style={[input, { marginTop: 8 }]}
        />

        <Text style={{ fontSize: 12, fontWeight: t.semibold, color: c.text2, marginTop: s.md, marginBottom: 6 }}>What kind of source is it?</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {SOURCE_KINDS.map(kind => {
            const on = source.kind === kind;
            return (
              <TouchableOpacity
                key={kind}
                onPress={() => setField('kind', on ? null : kind)}
                activeOpacity={0.7}
                style={{
                  paddingHorizontal: 10, paddingVertical: 6, borderRadius: r.full, borderWidth: 1,
                  borderColor: on ? accent : c.border, backgroundColor: on ? accent + '1f' : 'transparent',
                }}
              >
                <Text style={{ fontSize: 12, color: on ? c.text1 : c.text3, fontWeight: on ? '700' : '500' }}>{kind}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={{ fontSize: 12, fontWeight: t.semibold, color: c.text2, marginTop: s.md, marginBottom: 2 }}>Can you trust it?</Text>
        {SOURCE_CHECKS.map((label, i) => (
          <TouchableOpacity key={label} onPress={() => toggleCheck(i)} activeOpacity={0.7} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 5 }}>
            <Ionicons name={source.checks?.[i] ? 'checkbox' : 'square-outline'} size={18} color={source.checks?.[i] ? accent : c.text4} />
            <Text style={{ fontSize: t.sm, color: c.text2, flex: 1 }}>{label}</Text>
          </TouchableOpacity>
        ))}
        {hasSource && ticks < 2 && (
          <Text style={{ fontSize: 12, color: c.warning, marginTop: 6, lineHeight: 17 }}>
            Fewer than two ticks? Find a second source and see whether they agree. That habit matters more than any one fact.
          </Text>
        )}
        {source.kind === 'Company selling something' && (
          <Text style={{ fontSize: 12, color: c.warning, marginTop: 6, lineHeight: 17 }}>
            A company can be right, but it has a reason to tell you one side. Check it against a source with nothing to sell.
          </Text>
        )}
      </Card>

      <Card ui={ui}>
        <Label ui={ui}>{quest.research.explainPrompt}</Label>
        <TextInput
          value={explanation}
          onChangeText={setExplanation}
          placeholder="In your own words…"
          placeholderTextColor={c.text4}
          multiline
          textAlignVertical="top"
          style={[input, { minHeight: 110 }]}
        />
        {!longEnough && explanation.length > 0 && (
          <Text style={{ fontSize: 11, color: c.text4, marginTop: 6 }}>A couple of full sentences.</Text>
        )}
      </Card>

      <PrimaryButton label="On to the check" onPress={onNext} disabled={!hasSource || !longEnough} ui={ui} />
      {(!hasSource || !longEnough) && (
        <Text style={{ fontSize: 11, color: c.text4, textAlign: 'center', marginTop: 6 }}>
          Add your source and your explanation to go on. Your work is saved as you type.
        </Text>
      )}
      <SecondaryButton label="Back to the idea" icon="arrow-back" onPress={onBack} ui={ui} />
    </>
  );
}

// ── 3. Check ────────────────────────────────────────────────────────────────

function CheckStep({ quest, progress, onBack, onNext, ui }) {
  const { c, t, s, r } = ui;
  const answers = progress.answers || {};
  const [drafts, setDrafts] = useState({}); // typed numbers not yet checked

  const isRight = (item, a) => (a === undefined ? false : 'answer' in item ? a === item.answer : a === item.answerIndex);
  const answered = quest.check.filter((_, i) => answers[i] !== undefined).length;
  const right = quest.check.filter((item, i) => isRight(item, answers[i])).length;
  const need = Math.ceil(quest.check.length * PASS_SHARE);
  const allAnswered = answered === quest.check.length;
  const passed = allAnswered && right >= need;

  const answer = (i, value) => {
    if (answers[i] !== undefined) return;
    updateQuest(quest.id, { answers: { ...answers, [i]: value } });
  };
  const retryMissed = () => {
    const keep = {};
    quest.check.forEach((item, i) => { if (isRight(item, answers[i])) keep[i] = answers[i]; });
    setDrafts({});
    updateQuest(quest.id, { answers: keep });
  };

  return (
    <>
      <Text style={{ fontSize: t.sm, color: c.text3, marginBottom: s.md, lineHeight: 19 }}>
        {quest.check.length} questions about the usual mix-ups. Get {need} right to go on. Every answer comes with the reason.
      </Text>

      {quest.check.map((item, i) => {
        const a = answers[i];
        const done = a !== undefined;
        const ok = isRight(item, a);
        return (
          <Card key={i} ui={ui}>
            <Text style={{ fontSize: t.sm, fontWeight: t.semibold, color: c.text1, lineHeight: 20, marginBottom: 8 }}>
              {i + 1}. {item.question}
            </Text>

            {'answer' in item ? (
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TextInput
                  value={done ? String(a) : (drafts[i] ?? '')}
                  onChangeText={v => setDrafts(prev => ({ ...prev, [i]: v }))}
                  editable={!done}
                  keyboardType="numeric"
                  placeholder="Your answer"
                  placeholderTextColor={c.text4}
                  style={{
                    flex: 1, backgroundColor: c.bg2, borderRadius: r.md, borderWidth: 1,
                    borderColor: done ? (ok ? c.success : c.error) : c.border,
                    paddingHorizontal: 12, paddingVertical: 10, color: c.text1, fontSize: t.md,
                  }}
                />
                {!done && (
                  <TouchableOpacity
                    onPress={() => { const n = parseNumber(drafts[i]); if (Number.isFinite(n)) answer(i, n); }}
                    disabled={!Number.isFinite(parseNumber(drafts[i]))}
                    style={{ justifyContent: 'center', paddingHorizontal: 16, borderRadius: r.md, backgroundColor: Number.isFinite(parseNumber(drafts[i])) ? ui.accent : c.bg2 }}
                  >
                    <Text style={{ fontWeight: '800', color: Number.isFinite(parseNumber(drafts[i])) ? ui.ink : c.text4 }}>Check</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              optionOrder(item.question, item.options.length).map((oi) => {
                const opt = item.options[oi];
                const correct = oi === item.answerIndex;
                const picked = oi === a;
                let border = c.border; let bg = 'transparent'; let icon = 'ellipse-outline'; let iconColor = c.text4;
                if (done && correct) { border = c.success; bg = c.success + '1f'; icon = 'checkmark-circle'; iconColor = c.success; }
                else if (done && picked) { border = c.error; bg = c.error + '1f'; icon = 'close-circle'; iconColor = c.error; }
                return (
                  <TouchableOpacity
                    key={oi}
                    onPress={() => answer(i, oi)}
                    disabled={done}
                    activeOpacity={0.7}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: r.sm, borderWidth: 1, borderColor: border, backgroundColor: bg, marginTop: 6 }}
                  >
                    <Ionicons name={icon} size={17} color={iconColor} />
                    <Text style={{ flex: 1, fontSize: t.sm, color: c.text2, lineHeight: 19 }}>{opt}</Text>
                  </TouchableOpacity>
                );
              })
            )}

            {done && (
              <Text style={{ fontSize: 12, lineHeight: 18, color: ok ? c.success : c.text2, marginTop: 8 }}>
                {ok ? 'Right. ' : 'answer' in item ? `It's ${item.answer.toLocaleString('en-US')}. ` : 'Not quite. '}
                <Text style={{ color: c.text2 }}>{item.explanation}</Text>
              </Text>
            )}
          </Card>
        );
      })}

      {allAnswered && (
        <Card ui={ui} style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: t.lg, fontWeight: t.bold, color: passed ? c.success : c.text1 }}>
            {right} of {quest.check.length} right
          </Text>
          <Text style={{ fontSize: t.sm, color: c.text3, marginTop: 4, textAlign: 'center' }}>
            {passed ? 'That\'s a pass.' : `Read the reasons on the ones you missed, then try just those again. You need ${need}.`}
          </Text>
        </Card>
      )}

      {passed
        ? <PrimaryButton label="On to doing it" onPress={onNext} ui={ui} />
        : allAnswered && <PrimaryButton label="Try the ones I missed" onPress={retryMissed} ui={ui} />}
      <SecondaryButton label="Back to research" icon="arrow-back" onPress={onBack} ui={ui} />
    </>
  );
}

// ── 4. Do it ────────────────────────────────────────────────────────────────

function DoItStep({ quest, progress, userId, firstTime, onFinish, ui }) {
  const { c, t, s } = ui;
  const [adding, setAdding] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [error, setError] = useState(null);
  const dueLabel = quest.doIt.due === 'tomorrow' ? 'tomorrow' : 'today';

  const add = async () => {
    setError(null); setAdding(true);
    try { await addQuestTask(userId, quest); }
    catch (e) { setError(e?.message || 'That didn\'t save. Try again.'); }
    finally { setAdding(false); }
  };
  const finish = async () => {
    setError(null); setFinishing(true);
    try { await onFinish(); }
    catch (e) { setError(e?.message || 'That didn\'t save. Try again.'); setFinishing(false); }
  };

  return (
    <>
      <Text style={{ fontSize: t.sm, color: c.text3, marginBottom: s.md, lineHeight: 19 }}>
        Knowing it is half. This is the part that changes something.
      </Text>
      <Card ui={ui} style={{ borderColor: ui.accent, borderWidth: 1 }}>
        <Text style={{ fontSize: t.lg, fontWeight: t.bold, color: c.text1, lineHeight: 23 }}>{quest.doIt.title}</Text>
        <Text style={{ fontSize: t.sm, color: c.text2, lineHeight: 20, marginTop: 6 }}>{quest.doIt.detail}</Text>
      </Card>

      {userId ? (
        progress.taskAdded ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center', paddingVertical: 10 }}>
            <Ionicons name="checkmark-circle" size={16} color={c.success} />
            <Text style={{ fontSize: t.sm, color: c.success, fontWeight: '700' }}>On your tasks for {dueLabel}</Text>
          </View>
        ) : (
          <SecondaryButton label={`Add it to my tasks for ${dueLabel}`} icon="add-circle-outline" onPress={add} ui={ui} />
        )
      ) : (
        <Text style={{ fontSize: 12, color: c.text4, textAlign: 'center', marginVertical: 8, lineHeight: 17 }}>
          Sign in to add this to your tasks and keep your notes in your Vault.
        </Text>
      )}
      {adding && <ActivityIndicator color={ui.accent} />}

      <PrimaryButton
        label={firstTime && userId ? `Finish the quest · +${QUEST_XP} XP` : 'Finish the quest'}
        onPress={finish}
        busy={finishing}
        ui={ui}
      />
      {error && <Text style={{ fontSize: 12, color: c.error, textAlign: 'center', marginTop: 8 }}>{error}</Text>}
    </>
  );
}

// ── 5. Done ─────────────────────────────────────────────────────────────────

function DoneStep({ quest, progress, userId, navigation, ui }) {
  const { c, t, s } = ui;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const when = useMemo(() => {
    const d = progress.completedAt ? new Date(progress.completedAt) : null;
    return d ? d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : null;
  }, [progress.completedAt]);

  const saveLinks = async () => {
    setError(null); setSaving(true);
    try { await saveQuestResources(userId, quest); }
    catch (e) { setError(e?.message || 'That didn\'t save. Try again.'); }
    finally { setSaving(false); }
  };

  return (
    <>
      <Card ui={ui} style={{ alignItems: 'center', paddingVertical: s.xl }}>
        <Ionicons name="ribbon-outline" size={34} color={ui.accent} />
        <Text style={{ fontSize: t.xl, fontWeight: t.bold, color: c.text1, marginTop: 8 }}>Quest complete</Text>
        {progress.xpEarned ? (
          <Text style={{ fontSize: t.lg, fontWeight: '800', color: c.gold, marginTop: 4 }}>+{progress.xpEarned} XP</Text>
        ) : null}
        {when && <Text style={{ fontSize: 12, color: c.text3, marginTop: 4 }}>Finished {when}</Text>}
        <View style={{ marginTop: s.md, gap: 6, alignSelf: 'stretch' }}>
          {userId && (progress.explanation || progress.source?.title) ? (
            <DoneRow icon="library-outline" text="Your explanation and source are saved in your Knowledge Vault." ui={ui} />
          ) : null}
          {progress.taskAdded ? <DoneRow icon="checkbox-outline" text={`"${quest.doIt.title}" is on your tasks.`} ui={ui} /> : null}
          {!userId ? <DoneRow icon="phone-portrait-outline" text="Your work is saved on this device. Sign in to keep it in your Vault." ui={ui} /> : null}
        </View>
      </Card>

      <Card ui={ui}>
        <Label ui={ui}>Go further</Label>
        <ResourceList resources={quest.resources} ui={ui} />
        {userId && (
          progress.resourcesSaved
            ? <DoneRow icon="checkmark-circle" text="Saved to your Vault as bookmarks." ui={ui} />
            : <SecondaryButton label={saving ? 'Saving…' : 'Save these links to my Vault'} icon="bookmark-outline" onPress={saveLinks} ui={ui} />
        )}
        {error && <Text style={{ fontSize: 12, color: c.error, marginTop: 6 }}>{error}</Text>}
      </Card>

      <PrimaryButton label="Done" onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('ClassesMain'))} ui={ui} />
      {userId && (progress.explanation || progress.source?.title) ? (
        <SecondaryButton label="Open my Vault" icon="library-outline" onPress={() => navigation.navigate('KnowledgeScreen')} ui={ui} />
      ) : null}
      <SecondaryButton label="Do this quest again" icon="refresh" onPress={() => restartQuest(quest.id)} ui={ui} />
    </>
  );
}

function DoneRow({ icon, text, ui: { c, t } }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
      <Ionicons name={icon} size={16} color={c.success} style={{ marginTop: 1 }} />
      <Text style={{ flex: 1, fontSize: t.sm, color: c.text2, lineHeight: 19 }}>{text}</Text>
    </View>
  );
}
