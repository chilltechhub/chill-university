// src/screens/library/wayfinder/WayfinderSheets.js
//
// The bottom sheets the map opens:
//   PathSheet      — one job path: why it's here, ways in, and the experiment ladder
//   LifePathSheet  — one way to live something outside work, in three steps
//   ReflectSheet   — "how did it go?" after any experiment or practice
//   StatementSheet — the "Who I'm becoming" builder

import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, Modal, ScrollView, TextInput, Switch,
  KeyboardAvoidingView, Platform, Linking, StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../../context/ThemeContext';
import { FONTS } from '../../../theme';
import {
  THEME_MAP, ROUTE_MAP, EXPERIMENT_RUNGS, experimentText, LINKS,
  REFLECT_ENERGY, REFLECT_CURIOSITY, STATEMENT_STEMS,
} from '../../../data/wayfinder';
import { composeStatement } from '../../../logic/wayfinderScoring';
import { LIFE_RUNGS, LIFE_ZONE_MAP } from '../../../data/wayfinderDeeper';

function Sheet({ visible, onClose, title, headerRight, children, footer }) {
  const { colors: c } = useTheme();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} accessibilityLabel="Close" />
        <View style={{ backgroundColor: c.bg1, borderTopLeftRadius: 22, borderTopRightRadius: 22, maxHeight: '92%', borderTopWidth: 1, borderColor: c.border }}>
          <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: c.border, alignSelf: 'center', marginTop: 10 }} />
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 14, paddingBottom: 8, gap: 10 }}>
            <Text style={{ flex: 1, fontSize: 19, fontWeight: '700', color: c.text1 }}>{title}</Text>
            {headerRight}
            <TouchableOpacity onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={22} color={c.text3} />
            </TouchableOpacity>
          </View>
          <ScrollView automaticallyAdjustKeyboardInsets contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: footer ? 12 : 34 }} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
          {footer && <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 28, borderTopWidth: 0.5, borderTopColor: c.border }}>{footer}</View>}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function Label({ children, style }) {
  const { colors: c } = useTheme();
  return (
    <Text style={[{ fontSize: 11, color: c.text3, fontFamily: FONTS.mono, letterSpacing: 1, textTransform: 'uppercase', marginTop: 20, marginBottom: 8 }, style]}>
      {children}
    </Text>
  );
}

function PrimaryButton({ label, onPress, disabled, tone }) {
  const { colors: c, radius: r } = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={{ backgroundColor: tone || c.teal, borderRadius: r.md, paddingVertical: 14, alignItems: 'center', opacity: disabled ? 0.45 : 1 }}
    >
      <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── PathSheet ──────────────────────────────────────────────────────────────
export function PathSheet({ visible, result, experiments, saved, reality, canAddTask, onClose, onToggleSave, onCommit, onReflect, onOpenCareer }) {
  const { colors: c, radius: r } = useTheme();
  const [confirming, setConfirming] = useState(null);
  const [addTask, setAddTask] = useState(true);

  useEffect(() => { if (!visible) setConfirming(null); }, [visible]);

  if (!result) return null;
  const { path, reasons, realityNote, verdict } = result;
  const isSaved = saved.includes(path.id);
  const training = reality?.training || [];

  const commit = (rungId) => {
    onCommit(path.id, rungId, canAddTask && addTask);
    setConfirming(null);
  };

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={path.title}
      headerRight={(
        <TouchableOpacity
          onPress={() => onToggleSave(path.id)}
          accessibilityRole="button"
          accessibilityLabel={isSaved ? 'Unstar this path' : 'Star this path'}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name={isSaved ? 'star' : 'star-outline'} size={21} color={c.gold} />
        </TouchableOpacity>
      )}
    >
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
        {path.themes.map(id => (
          <View key={id} style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: THEME_MAP[id].color + '22' }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: THEME_MAP[id].color }}>{THEME_MAP[id].emoji} {THEME_MAP[id].short}</Text>
          </View>
        ))}
        {verdict && (
          <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: c.bg2 }}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: c.text2 }}>{verdict.label}</Text>
          </View>
        )}
      </View>

      <Text style={{ fontSize: 15, color: c.text1, lineHeight: 22 }}>{path.what}</Text>

      {(reasons.length > 0 || realityNote) && (
        <>
          <Label>Why it’s on your map</Label>
          {reasons.map(reason => (
            <View key={reason.text} style={{ flexDirection: 'row', gap: 8, marginBottom: 6 }}>
              <Ionicons name="checkmark-circle" size={16} color={c.teal} style={{ marginTop: 1 }} />
              <Text style={{ flex: 1, fontSize: 13, color: c.text2, lineHeight: 19 }}>{reason.text}</Text>
            </View>
          ))}
          {realityNote && (
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 2 }}>
              <Ionicons name="time-outline" size={16} color={c.warning} style={{ marginTop: 1 }} />
              <Text style={{ flex: 1, fontSize: 13, color: c.text2, lineHeight: 19 }}>{realityNote}</Text>
            </View>
          )}
        </>
      )}

      <Label>Ways in</Label>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {path.routes.map(id => {
          const fits = training.includes(id);
          return (
            <View key={id} style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14, borderWidth: 1, borderColor: fits ? c.teal : c.border, backgroundColor: fits ? c.teal + '14' : 'transparent' }}>
              <Text style={{ fontSize: 12, color: fits ? c.teal : c.text2, fontWeight: fits ? '700' : '400' }}>
                {ROUTE_MAP[id].label}{ROUTE_MAP[id].paid && !/paid/i.test(ROUTE_MAP[id].label) ? ' · paid' : ''}
              </Text>
            </View>
          );
        })}
      </View>

      <Label>Test it — cheapest first</Label>
      <Text style={{ fontSize: 13, color: c.text3, lineHeight: 19, marginBottom: 10 }}>
        You won’t figure out if this fits by thinking about it. Pick one small thing, do it this week, then come back and say how it felt.
      </Text>

      {EXPERIMENT_RUNGS.map((rung, i) => {
        const mine = experiments.filter(x => x.pathId === path.id && x.rung === rung.id);
        const active = mine.find(x => x.status === 'active');
        const done = mine.filter(x => x.status === 'done');
        const isConfirming = confirming === rung.id;
        return (
          <View key={rung.id} style={{ borderRadius: r.md, borderWidth: 1, borderColor: active ? c.teal : c.border, backgroundColor: c.bg0, padding: 14, marginBottom: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: c.teal + '22', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: c.teal }}>{i + 1}</Text>
              </View>
              <Text style={{ fontSize: 14, fontWeight: '700', color: c.text1 }}>{rung.label}</Text>
              <Text style={{ fontSize: 12, color: c.text3 }}>· {rung.effort}</Text>
              {done.length > 0 && <Ionicons name="checkmark-done" size={16} color={c.success} style={{ marginLeft: 'auto' }} />}
            </View>
            <Text style={{ fontSize: 13, color: c.text2, lineHeight: 19 }}>{experimentText(path, rung.id)}</Text>
            {rung.questions && (
              <View style={{ marginTop: 8, paddingLeft: 10, borderLeftWidth: 2, borderLeftColor: c.border }}>
                {rung.questions.map(q => (
                  <Text key={q} style={{ fontSize: 12.5, color: c.text2, lineHeight: 19 }}>“{q}”</Text>
                ))}
              </View>
            )}

            {active ? (
              <TouchableOpacity onPress={() => onReflect(active)} accessibilityRole="button" style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="chatbox-ellipses-outline" size={16} color={c.teal} />
                <Text style={{ fontSize: 13, fontWeight: '700', color: c.teal }}>In progress — did it? Say how it went</Text>
              </TouchableOpacity>
            ) : isConfirming ? (
              <View style={{ marginTop: 12 }}>
                {canAddTask && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                    <Text style={{ flex: 1, fontSize: 13, color: c.text2 }}>
                      Add to my tasks, due in {rung.days} day{rung.days === 1 ? '' : 's'}
                    </Text>
                    <Switch value={addTask} onValueChange={setAddTask} trackColor={{ true: c.teal }} />
                  </View>
                )}
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity onPress={() => setConfirming(null)} style={{ flex: 1, paddingVertical: 11, borderRadius: r.md, borderWidth: 1, borderColor: c.border, alignItems: 'center' }}>
                    <Text style={{ fontSize: 13, color: c.text2, fontWeight: '600' }}>Not now</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => commit(rung.id)} style={{ flex: 2, paddingVertical: 11, borderRadius: r.md, backgroundColor: c.teal, alignItems: 'center' }}>
                    <Text style={{ fontSize: 13, color: '#fff', fontWeight: '700' }}>I’ll do this</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity onPress={() => setConfirming(rung.id)} accessibilityRole="button" style={{ marginTop: 10, alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16, borderWidth: 1, borderColor: c.teal }}>
                <Text style={{ fontSize: 12.5, fontWeight: '700', color: c.teal }}>{done.length ? 'Try it again' : 'Try this'}</Text>
              </TouchableOpacity>
            )}
          </View>
        );
      })}

      <Label>Go deeper</Label>
      {path.careerId && (
        <TouchableOpacity onPress={() => onOpenCareer(path.careerId)} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 }}>
          <Ionicons name="compass-outline" size={17} color={c.teal} />
          <Text style={{ flex: 1, fontSize: 13.5, color: c.teal, fontWeight: '600' }}>Full write-up in Career Expeditions — skills, tools, roadmap</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity onPress={() => Linking.openURL(LINKS.outlook.url)} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 }}>
        <Ionicons name="open-outline" size={17} color={c.teal} />
        <Text style={{ flex: 1, fontSize: 13.5, color: c.teal, fontWeight: '600' }}>{LINKS.outlook.label}</Text>
      </TouchableOpacity>
      {path.routes.includes('apprentice') && (
        <TouchableOpacity onPress={() => Linking.openURL(LINKS.apprenticeships.url)} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 }}>
          <Ionicons name="open-outline" size={17} color={c.teal} />
          <Text style={{ flex: 1, fontSize: 13.5, color: c.teal, fontWeight: '600' }}>{LINKS.apprenticeships.label}</Text>
        </TouchableOpacity>
      )}
    </Sheet>
  );
}

// ─── LifePathSheet ──────────────────────────────────────────────────────────
// A way to live something outside of work: no routes, no careers — just what
// it is, why it's on the map, and three steps from dipping in to going deep.
export function LifePathSheet({ visible, result, experiments, canAddTask, onClose, onCommit, onReflect }) {
  const { colors: c, radius: r } = useTheme();
  const [confirming, setConfirming] = useState(null);
  const [addTask, setAddTask] = useState(true);

  useEffect(() => { if (!visible) setConfirming(null); }, [visible]);

  if (!result) return null;
  const { path, reasons } = result;

  return (
    <Sheet visible={visible} onClose={onClose} title={path.title}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
        {path.themes.map(id => (
          <View key={id} style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: THEME_MAP[id].color + '22' }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: THEME_MAP[id].color }}>{THEME_MAP[id].emoji} {THEME_MAP[id].short}</Text>
          </View>
        ))}
        {path.zones.map(id => (
          <View key={id} style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: c.bg2 }}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: c.text2 }}>{LIFE_ZONE_MAP[id].emoji} {LIFE_ZONE_MAP[id].label}</Text>
          </View>
        ))}
      </View>

      <Text style={{ fontSize: 15, color: c.text1, lineHeight: 22 }}>{path.what}</Text>

      {reasons.length > 0 && (
        <>
          <Label>Why it’s on your map</Label>
          {reasons.map(reason => (
            <View key={reason.text} style={{ flexDirection: 'row', gap: 8, marginBottom: 6 }}>
              <Ionicons name="checkmark-circle" size={16} color={c.teal} style={{ marginTop: 1 }} />
              <Text style={{ flex: 1, fontSize: 13, color: c.text2, lineHeight: 19 }}>{reason.text}</Text>
            </View>
          ))}
        </>
      )}

      <Label>Start small</Label>
      {LIFE_RUNGS.map((rung, i) => {
        const mine = experiments.filter(x => x.pathId === path.id && x.rung === rung.id);
        const active = mine.find(x => x.status === 'active');
        const done = mine.some(x => x.status === 'done');
        return (
          <View key={rung.id} style={{ borderRadius: r.md, borderWidth: 1, borderColor: active ? c.teal : c.border, backgroundColor: c.bg0, padding: 14, marginBottom: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: c.teal + '22', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: c.teal }}>{i + 1}</Text>
              </View>
              <Text style={{ fontSize: 14, fontWeight: '700', color: c.text1 }}>{rung.label}</Text>
              <Text style={{ fontSize: 12, color: c.text3 }}>· {rung.effort}</Text>
              {done && <Ionicons name="checkmark-done" size={16} color={c.success} style={{ marginLeft: 'auto' }} />}
            </View>
            <Text style={{ fontSize: 13, color: c.text2, lineHeight: 19 }}>{path.steps[rung.id]}</Text>

            {active ? (
              <TouchableOpacity onPress={() => onReflect(active)} style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="chatbox-ellipses-outline" size={16} color={c.teal} />
                <Text style={{ fontSize: 13, fontWeight: '700', color: c.teal }}>In progress — did it? Say how it went</Text>
              </TouchableOpacity>
            ) : confirming === rung.id ? (
              <View style={{ marginTop: 12 }}>
                {canAddTask && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                    <Text style={{ flex: 1, fontSize: 13, color: c.text2 }}>Add to my tasks, due in {rung.days} days</Text>
                    <Switch value={addTask} onValueChange={setAddTask} trackColor={{ true: c.teal }} />
                  </View>
                )}
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity onPress={() => setConfirming(null)} style={{ flex: 1, paddingVertical: 11, borderRadius: r.md, borderWidth: 1, borderColor: c.border, alignItems: 'center' }}>
                    <Text style={{ fontSize: 13, color: c.text2, fontWeight: '600' }}>Not now</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => { onCommit(path.id, rung.id, canAddTask && addTask); setConfirming(null); }} style={{ flex: 2, paddingVertical: 11, borderRadius: r.md, backgroundColor: c.teal, alignItems: 'center' }}>
                    <Text style={{ fontSize: 13, color: '#fff', fontWeight: '700' }}>I’ll do this</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity onPress={() => setConfirming(rung.id)} style={{ marginTop: 10, alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16, borderWidth: 1, borderColor: c.teal }}>
                <Text style={{ fontSize: 12.5, fontWeight: '700', color: c.teal }}>{done ? 'Do it again' : 'Try this'}</Text>
              </TouchableOpacity>
            )}
          </View>
        );
      })}
    </Sheet>
  );
}

// ─── ReflectSheet ───────────────────────────────────────────────────────────
function ChoiceRow({ options, value, onChange }) {
  const { colors: c, radius: r } = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      {options.map(opt => {
        const on = value === opt.value;
        return (
          <TouchableOpacity
            key={opt.value}
            onPress={() => onChange(opt.value)}
            accessibilityRole="radio"
            accessibilityState={{ checked: on }}
            style={{ flex: 1, alignItems: 'center', paddingVertical: 12, paddingHorizontal: 4, borderRadius: r.md, borderWidth: 1.5, borderColor: on ? c.teal : c.border, backgroundColor: on ? c.teal + '18' : c.bg0 }}
          >
            <Text style={{ fontSize: 20 }}>{opt.emoji}</Text>
            <Text style={{ fontSize: 12, fontWeight: on ? '700' : '500', color: on ? c.teal : c.text2, marginTop: 4, textAlign: 'center' }}>{opt.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const RESULT_COPY = {
  up:    { emoji: '⚡', title: 'That’s a real signal.', body: 'Something in there gave you energy. Go one rung further while it’s fresh — the next step up the ladder tells you a lot more.' },
  mixed: { emoji: '🧪', title: 'Mixed is normal.',     body: 'One try rarely settles it. A different kind of experiment — talking to someone instead of watching, or doing instead of reading — usually tells you more.' },
  down:  { emoji: '🧭', title: 'That counts.',          body: 'Crossing something off is progress, not failure. Your map just got clearer, and it now points somewhere else.' },
};

// `title` and `rungLabel` rather than a path object: an experiment can point
// at a job path, a way to live outside work, or a quality practice.
export function ReflectSheet({ visible, experiment, title, rungLabel, onClose, onSubmit, onRemove }) {
  const { colors: c, radius: r } = useTheme();
  const [energy, setEnergy] = useState(null);
  const [curiosity, setCuriosity] = useState(null);
  const [note, setNote] = useState('');
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (visible) { setEnergy(null); setCuriosity(null); setNote(''); setResult(null); }
  }, [visible, experiment?.id]);

  if (!experiment || !title) return null;

  const submit = () => {
    const verdict = onSubmit(experiment.id, { energy, curiosity, note: note.trim(), at: new Date().toISOString() });
    setResult(verdict?.tone || (energy + curiosity >= 1 ? 'up' : energy + curiosity <= -1 ? 'down' : 'mixed'));
  };

  if (result) {
    const copy = RESULT_COPY[result] || RESULT_COPY.mixed;
    return (
      <Sheet visible={visible} onClose={onClose} title={title} footer={<PrimaryButton label="Back to my map" onPress={onClose} />}>
        <View style={{ alignItems: 'center', paddingVertical: 20 }}>
          <Text style={{ fontSize: 44, marginBottom: 10 }}>{copy.emoji}</Text>
          <Text style={{ fontSize: 19, fontWeight: '700', color: c.text1, marginBottom: 8 }}>{copy.title}</Text>
          <Text style={{ fontSize: 14.5, color: c.text2, textAlign: 'center', lineHeight: 21 }}>{copy.body}</Text>
        </View>
      </Sheet>
    );
  }

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title="How did it go?"
      footer={<PrimaryButton label="Save to my map" onPress={submit} disabled={energy === null || curiosity === null} />}
    >
      <View style={{ backgroundColor: c.bg0, borderRadius: r.md, padding: 12, borderWidth: 0.5, borderColor: c.border }}>
        <Text style={{ fontSize: 12, color: c.text3, fontFamily: FONTS.mono, marginBottom: 4 }}>{rungLabel?.toUpperCase()} · {title}</Text>
        <Text style={{ fontSize: 13.5, color: c.text2, lineHeight: 19 }}>{experiment.text}</Text>
      </View>

      <Label>While you were doing it, you felt…</Label>
      <ChoiceRow options={REFLECT_ENERGY} value={energy} onChange={setEnergy} />

      <Label>Afterwards, you’re…</Label>
      <ChoiceRow options={REFLECT_CURIOSITY} value={curiosity} onChange={setCuriosity} />

      <Label>What surprised you? (optional)</Label>
      <TextInput
        value={note}
        onChangeText={setNote}
        placeholder="Anything — good, bad, or just unexpected"
        placeholderTextColor={c.text4}
        multiline
        maxLength={500}
        style={{ minHeight: 80, borderRadius: r.md, borderWidth: 1, borderColor: c.border, backgroundColor: c.bg0, color: c.text1, padding: 12, fontSize: 14, textAlignVertical: 'top' }}
      />

      <TouchableOpacity onPress={() => onRemove(experiment.id)} style={{ alignSelf: 'center', marginTop: 18, padding: 6 }}>
        <Text style={{ fontSize: 13, color: c.text3 }}>Didn’t get to it — take it off my map</Text>
      </TouchableOpacity>
    </Sheet>
  );
}

// ─── StatementSheet ─────────────────────────────────────────────────────────
export function StatementSheet({ visible, statement, suggestions, onClose, onSave }) {
  const { colors: c, radius: r } = useTheme();
  const [draft, setDraft] = useState({});

  useEffect(() => {
    if (!visible) return;
    const seed = {};
    STATEMENT_STEMS.forEach(({ key }) => { seed[key] = statement?.[key] ?? suggestions?.[key] ?? ''; });
    setDraft(seed);
  }, [visible]);

  const preview = composeStatement(draft);

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title="Who I’m becoming"
      footer={<PrimaryButton label="Save" onPress={() => onSave(draft)} disabled={!preview} />}
    >
      <Text style={{ fontSize: 13.5, color: c.text2, lineHeight: 20 }}>
        Not a slogan and not forever — just something true enough to reread on a bad day. We filled in drafts from your map. Change anything.
      </Text>

      {STATEMENT_STEMS.map(({ key, stem, placeholder }) => {
        const suggestion = suggestions?.[key];
        // Boolean, not `suggestion && …` — an empty-string suggestion would
        // render as a bare text node inside the View.
        const showSuggest = !!suggestion && suggestion !== draft[key];
        return (
          <View key={key}>
            <Label>{stem}…</Label>
            <TextInput
              value={draft[key] || ''}
              onChangeText={v => setDraft(prev => ({ ...prev, [key]: v }))}
              placeholder={placeholder}
              placeholderTextColor={c.text4}
              multiline
              maxLength={200}
              // Multiline inputs don't grow with their text on web, so the
              // skills line — the longest draft — starts tall enough for it.
              style={{ borderRadius: r.md, borderWidth: 1, borderColor: c.border, backgroundColor: c.bg0, color: c.text1, padding: 12, fontSize: 14, minHeight: key === 'self' ? 92 : 64, textAlignVertical: 'top' }}
            />
            {showSuggest && (
              <TouchableOpacity onPress={() => setDraft(prev => ({ ...prev, [key]: suggestion }))} style={{ marginTop: 6 }}>
                <Text style={{ fontSize: 12, color: c.teal }} numberOfLines={2}>Use: “{suggestion}”</Text>
              </TouchableOpacity>
            )}
          </View>
        );
      })}

      {!!preview && (
        <>
          <Label>Reads as</Label>
          <View style={{ borderRadius: r.md, padding: 14, backgroundColor: c.teal + '12', borderWidth: 1, borderColor: c.teal + '44' }}>
            <Text style={{ fontSize: 15, color: c.text1, lineHeight: 23, fontStyle: 'italic' }}>{preview}</Text>
          </View>
        </>
      )}
    </Sheet>
  );
}
