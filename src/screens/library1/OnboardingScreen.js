// src/screens/library/OnboardingScreen.js
// First-launch onboarding: user picks/creates life areas + sets daily goal

import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { insertLifeAreas, upsertSettings } from '../../api/commandCenterService';

// ─── Preset categories users can pick from ───────────────────────────────────
const PRESETS = [
  { label: 'Business', icon: 'briefcase', color: '#378add', color_light: '#e6f1fb', subtitle: 'Projects, revenue, clients' },
  { label: 'Career & Jobs', icon: 'trending-up', color: '#7f77dd', color_light: '#eeedfe', subtitle: 'Job search, skills, growth' },
  { label: 'App Development', icon: 'phone-portrait', color: '#1d9e75', color_light: '#e1f5ee', subtitle: 'Builds, code, launches' },
  { label: 'Health & Fitness', icon: 'fitness', color: '#639922', color_light: '#eaf3de', subtitle: 'Nutrition, exercise, rest' },
  { label: 'Content & Brand', icon: 'megaphone', color: '#ba7517', color_light: '#faeeda', subtitle: 'Social, media, presence' },
  { label: 'Money', icon: 'cash', color: '#3b6d11', color_light: '#eaf3de', subtitle: 'Budget, savings, income' },
  { label: 'Travel', icon: 'airplane', color: '#d85a30', color_light: '#faece7', subtitle: 'Plans, destinations, adventures' },
  { label: 'Relationships', icon: 'people', color: '#bd10e0', color_light: '#f5eafe', subtitle: 'Friends, family, network' },
  { label: 'Learning', icon: 'school', color: '#0f6e56', color_light: '#e1f5ee', subtitle: 'Courses, books, research' },
  { label: 'Mental Wellness', icon: 'leaf', color: '#639922', color_light: '#eaf3de', subtitle: 'Mindfulness, self-care' },
  { label: 'Side Projects', icon: 'flask', color: '#993556', color_light: '#fbeaf0', subtitle: 'Experiments, passion work' },
  { label: 'Community', icon: 'globe', color: '#185fa5', color_light: '#e6f1fb', subtitle: 'Events, giving back, causes' },
];

const DAILY_GOAL_OPTIONS = [1, 2, 3, 4, 5, 6];

export default function OnboardingScreen({ userId, onComplete }) {
  const [step, setStep] = useState(1); // 1 = pick areas, 2 = goal, 3 = confirm
  const [selected, setSelected] = useState([]);
  const [customLabel, setCustomLabel] = useState('');
  const [customSubtitle, setCustomSubtitle] = useState('');
  const [customAreas, setCustomAreas] = useState([]);
  const [dailyGoal, setDailyGoal] = useState(3);
  const [saving, setSaving] = useState(false);

  const togglePreset = (preset) => {
    setSelected(prev =>
      prev.find(p => p.label === preset.label)
        ? prev.filter(p => p.label !== preset.label)
        : [...prev, preset]
    );
  };

  const addCustom = () => {
    const label = customLabel.trim();
    if (!label) return;
    if ([...selected, ...customAreas].find(a => a.label.toLowerCase() === label.toLowerCase())) {
      Alert.alert('Already added', 'You already have an area with that name.');
      return;
    }
    const newArea = {
      label,
      subtitle: customSubtitle.trim() || null,
      icon: 'star',
      color: '#888780',
      color_light: '#f1efe8',
    };
    setCustomAreas(prev => [...prev, newArea]);
    setCustomLabel('');
    setCustomSubtitle('');
  };

  const removeCustom = (label) => {
    setCustomAreas(prev => prev.filter(a => a.label !== label));
  };

  const allSelected = [...selected, ...customAreas];

  const handleFinish = async () => {
    if (allSelected.length === 0) {
      Alert.alert('Add at least one area', 'Pick or create at least one life area to track.');
      return;
    }
    setSaving(true);
    try {
      await insertLifeAreas(userId, allSelected.map((a, i) => ({ ...a, sort_order: i, progress: 0 })));
      await upsertSettings(userId, {
        daily_goal_hours: dailyGoal,
        onboarding_complete: true,
        streak_count: 0,
        last_active_date: new Date().toISOString().split('T')[0],
      });
      onComplete();
    } catch (err) {
      Alert.alert('Error', 'Could not save your setup. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>

        {/* Progress dots */}
        <View style={styles.dots}>
          {[1, 2, 3].map(n => (
            <View key={n} style={[styles.dot, step >= n && styles.dotActive]} />
          ))}
        </View>

        {/* ── Step 1: Pick life areas ── */}
        {step === 1 && (
          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
            <Text style={styles.title}>What areas of your life{'\n'}do you want to track?</Text>
            <Text style={styles.subtitle}>Pick all that apply. You can always change these later.</Text>

            <View style={styles.presetGrid}>
              {PRESETS.map(preset => {
                const isSelected = !!selected.find(p => p.label === preset.label);
                return (
                  <TouchableOpacity
                    key={preset.label}
                    style={[styles.presetCard, isSelected && { borderColor: preset.color, borderWidth: 2, backgroundColor: preset.color_light }]}
                    onPress={() => togglePreset(preset)}
                  >
                    <Ionicons name={preset.icon} size={22} color={isSelected ? preset.color : '#888'} />
                    <Text style={[styles.presetLabel, isSelected && { color: preset.color }]}>{preset.label}</Text>
                    <Text style={styles.presetSub} numberOfLines={1}>{preset.subtitle}</Text>
                    {isSelected && (
                      <View style={[styles.checkBadge, { backgroundColor: preset.color }]}>
                        <Ionicons name="checkmark" size={10} color="#fff" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.sectionLabel}>Add your own</Text>
            <View style={styles.customInputRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Area name (e.g. Music)"
                value={customLabel}
                onChangeText={setCustomLabel}
                maxLength={30}
              />
            </View>
            <TextInput
              style={styles.input}
              placeholder="Short description (optional)"
              value={customSubtitle}
              onChangeText={setCustomSubtitle}
              maxLength={50}
            />
            <TouchableOpacity style={styles.addBtn} onPress={addCustom}>
              <Ionicons name="add" size={18} color="#fff" />
              <Text style={styles.addBtnText}>Add area</Text>
            </TouchableOpacity>

            {customAreas.map(area => (
              <View key={area.label} style={styles.customTag}>
                <Text style={styles.customTagText}>{area.label}</Text>
                {area.subtitle ? <Text style={styles.customTagSub}>{area.subtitle}</Text> : null}
                <TouchableOpacity onPress={() => removeCustom(area.label)} style={styles.removeBtn}>
                  <Ionicons name="close-circle" size={18} color="#999" />
                </TouchableOpacity>
              </View>
            ))}

            {allSelected.length > 0 && (
              <View style={styles.selectedSummary}>
                <Text style={styles.selectedCount}>{allSelected.length} area{allSelected.length !== 1 ? 's' : ''} selected</Text>
              </View>
            )}
          </ScrollView>
        )}

        {/* ── Step 2: Daily goal ── */}
        {step === 2 && (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <Text style={styles.title}>How many hours of{'\n'}focused work is your goal?</Text>
            <Text style={styles.subtitle}>This sets your daily progress target. Be honest with yourself.</Text>
            <View style={styles.goalGrid}>
              {DAILY_GOAL_OPTIONS.map(hrs => (
                <TouchableOpacity
                  key={hrs}
                  style={[styles.goalCard, dailyGoal === hrs && styles.goalCardActive]}
                  onPress={() => setDailyGoal(hrs)}
                >
                  <Text style={[styles.goalNumber, dailyGoal === hrs && styles.goalNumberActive]}>{hrs}h</Text>
                  <Text style={[styles.goalLabel, dailyGoal === hrs && styles.goalLabelActive]}>
                    {hrs === 1 ? 'light' : hrs === 2 ? 'steady' : hrs === 3 ? 'solid' : hrs === 4 ? 'strong' : hrs === 5 ? 'intense' : 'beast'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.goalHint}>You can change this anytime from settings.</Text>
          </ScrollView>
        )}

        {/* ── Step 3: Confirm ── */}
        {step === 3 && (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <Text style={styles.title}>You're all set 🎯</Text>
            <Text style={styles.subtitle}>Here's what your command center will track:</Text>
            {allSelected.map(area => (
              <View key={area.label} style={[styles.confirmRow, { borderLeftColor: area.color }]}>
                <Ionicons name={area.icon} size={18} color={area.color} style={{ marginRight: 10 }} />
                <View>
                  <Text style={styles.confirmLabel}>{area.label}</Text>
                  {area.subtitle ? <Text style={styles.confirmSub}>{area.subtitle}</Text> : null}
                </View>
              </View>
            ))}
            <View style={styles.confirmGoal}>
              <Ionicons name="time" size={18} color="#378add" />
              <Text style={styles.confirmGoalText}>Daily goal: {dailyGoal} hour{dailyGoal !== 1 ? 's' : ''}</Text>
            </View>
          </ScrollView>
        )}

        {/* Navigation buttons */}
        <View style={styles.navRow}>
          {step > 1 && (
            <TouchableOpacity style={styles.backBtn} onPress={() => setStep(s => s - 1)}>
              <Text style={styles.backBtnText}>Back</Text>
            </TouchableOpacity>
          )}
          {step < 3 ? (
            <TouchableOpacity
              style={[styles.nextBtn, allSelected.length === 0 && step === 1 && styles.nextBtnDisabled]}
              onPress={() => {
                if (step === 1 && allSelected.length === 0) {
                  Alert.alert('Pick at least one area');
                  return;
                }
                setStep(s => s + 1);
              }}
            >
              <Text style={styles.nextBtnText}>Continue</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.nextBtn} onPress={handleFinish} disabled={saving}>
              {saving
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.nextBtnText}>Let's go</Text>
              }
            </TouchableOpacity>
          )}
        </View>

      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingTop: 20, paddingBottom: 4 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#e0e0e0' },
  dotActive: { backgroundColor: '#378add', width: 20 },
  scrollContent: { padding: 24, paddingBottom: 40 },
  title: { fontSize: 26, fontWeight: '700', color: '#1a1a1a', lineHeight: 34, marginBottom: 8 },
  subtitle: { fontSize: 15, color: '#666', marginBottom: 24, lineHeight: 22 },

  presetGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 28 },
  presetCard: {
    width: '47%', padding: 12, borderRadius: 12,
    borderWidth: 1.5, borderColor: '#e5e5e5',
    backgroundColor: '#fafafa', position: 'relative',
  },
  presetLabel: { fontSize: 13, fontWeight: '600', color: '#333', marginTop: 6, marginBottom: 2 },
  presetSub: { fontSize: 11, color: '#999' },
  checkBadge: {
    position: 'absolute', top: 8, right: 8,
    width: 18, height: 18, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
  },

  sectionLabel: { fontSize: 13, fontWeight: '600', color: '#888', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },
  customInputRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  input: {
    borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 10,
    padding: 12, fontSize: 15, color: '#1a1a1a', backgroundColor: '#fafafa', marginBottom: 8,
  },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, backgroundColor: '#0f1923', borderRadius: 10,
    paddingVertical: 12, marginBottom: 16,
  },
  addBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  customTag: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f5f5',
    borderRadius: 10, padding: 12, marginBottom: 8,
  },
  customTagText: { fontWeight: '600', fontSize: 14, color: '#333', flex: 1 },
  customTagSub: { fontSize: 12, color: '#888', marginRight: 8 },
  removeBtn: { padding: 2 },
  selectedSummary: { alignItems: 'center', paddingTop: 12 },
  selectedCount: { fontSize: 13, color: '#888' },

  goalGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20, justifyContent: 'center' },
  goalCard: {
    width: 90, height: 90, borderRadius: 16,
    borderWidth: 1.5, borderColor: '#e5e5e5',
    backgroundColor: '#fafafa', alignItems: 'center', justifyContent: 'center',
  },
  goalCardActive: { borderColor: '#378add', backgroundColor: '#e6f1fb' },
  goalNumber: { fontSize: 26, fontWeight: '700', color: '#333' },
  goalNumberActive: { color: '#378add' },
  goalLabel: { fontSize: 12, color: '#999', marginTop: 2 },
  goalLabelActive: { color: '#378add' },
  goalHint: { textAlign: 'center', fontSize: 13, color: '#aaa' },

  confirmRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, paddingHorizontal: 14,
    borderLeftWidth: 4, backgroundColor: '#fafafa',
    borderRadius: 8, marginBottom: 8,
  },
  confirmLabel: { fontSize: 15, fontWeight: '600', color: '#1a1a1a' },
  confirmSub: { fontSize: 12, color: '#888', marginTop: 2 },
  confirmGoal: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginTop: 16, padding: 14, backgroundColor: '#e6f1fb',
    borderRadius: 10,
  },
  confirmGoalText: { fontSize: 15, fontWeight: '600', color: '#378add' },

  navRow: {
    flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center',
    padding: 20, gap: 12, borderTopWidth: 1, borderTopColor: '#f0f0f0',
  },
  backBtn: { paddingVertical: 12, paddingHorizontal: 20 },
  backBtnText: { fontSize: 15, color: '#666', fontWeight: '500' },
  nextBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#0f1923', borderRadius: 12,
    paddingVertical: 14, paddingHorizontal: 24,
  },
  nextBtnDisabled: { backgroundColor: '#ccc' },
  nextBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
