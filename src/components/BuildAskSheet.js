// src/components/BuildAskSheet.js
// The one or two questions a Studio Build needs before the app makes it
// (src/data/builds.js `asks`), and the same sheet for changing the words
// later. A box with `fromDream` starts from their Dream when it's empty,
// so "a page about you" is about the life they said they want.
import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { Button } from './ui';
import { BUILD_KIND_MAP } from '../data/builds';
import { missingAsks } from '../logic/builds';

export default function BuildAskSheet({ visible, kindId, initial, dream, editing, onClose, onDone }) {
  const { colors: c, typography: t, spacing: s, radius: r, accent } = useTheme();
  const kind = BUILD_KIND_MAP[kindId];
  const [answers, setAnswers] = useState({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!visible || !kind) return;
    const next = {};
    for (const ask of kind.asks) {
      next[ask.key] = initial?.[ask.key] || (ask.fromDream ? (dream?.[ask.fromDream] || '') : '');
    }
    setAnswers(next);
    setBusy(false);
  }, [visible, kindId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!kind) return null;
  const missing = missingAsks(kind.id, answers);
  const input = { fontSize: t.md, color: c.text1, backgroundColor: c.bg0, borderRadius: r.md, borderWidth: 0.5, borderColor: c.border, padding: s.md };

  const done = async () => {
    setBusy(true);
    try { await onDone?.(answers); } finally { setBusy(false); }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <TouchableOpacity style={{ flex: 1, backgroundColor: c.overlay || 'rgba(0,0,0,0.4)' }} activeOpacity={1} onPress={onClose} accessibilityLabel="Close" />
        <View style={{ backgroundColor: c.bg1, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '85%' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', padding: s.lg, paddingBottom: s.xs }}>
            <Ionicons name={kind.icon} size={20} color={accent.primary} style={{ marginRight: s.sm }} />
            <Text style={{ flex: 1, fontSize: t.lg, fontWeight: t.bold, color: c.text1 }}>{kind.label}</Text>
            <TouchableOpacity onPress={onClose} accessibilityLabel="Close" hitSlop={8}><Ionicons name="close" size={22} color={c.text3} /></TouchableOpacity>
          </View>
          <ScrollView automaticallyAdjustKeyboardInsets keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: s.lg, paddingBottom: s.xxl }}>
            <Text style={{ fontSize: t.sm, color: c.text3 }}>
              {editing ? 'Change the words. Everything else stays.' : 'Answer this and the app makes it for you. Then you take it apart.'}
            </Text>
            {kind.asks.map(ask => (
              <View key={ask.key} style={{ marginTop: s.lg }}>
                <Text style={{ fontSize: t.sm, fontWeight: t.semibold, color: c.text1, marginBottom: s.sm }}>{ask.label}</Text>
                <TextInput
                  value={answers[ask.key] || ''}
                  onChangeText={(v) => setAnswers(prev => ({ ...prev, [ask.key]: v }))}
                  maxLength={ask.max}
                  placeholder={ask.placeholder}
                  placeholderTextColor={c.text4}
                  accessibilityLabel={ask.label}
                  style={input}
                />
                {!!ask.hint && <Text style={{ fontSize: t.xs, color: c.text3, marginTop: 4 }}>{ask.hint}</Text>}
                {!!ask.fromDream && !!dream?.[ask.fromDream] && !initial?.[ask.key] && (
                  <Text style={{ fontSize: t.xs, color: c.text3, marginTop: 4 }}>From your dream. Change it if you like.</Text>
                )}
              </View>
            ))}
            <Button
              label={editing ? 'Save' : 'Make it'}
              icon={editing ? 'checkmark' : 'sparkles-outline'}
              busy={busy}
              disabled={missing.length > 0}
              onPress={done}
              style={{ marginTop: s.xl }}
            />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
