// src/components/AddKnowledgeSheet.js
// "Add my own knowledge" from the Classes screen: something the player
// already knows, learned somewhere else, or wants to keep, filed under a
// subject and, where it fits, a life area. First version on purpose — it
// saves a plain Vault note (captures.type 'note') tagged 'my-knowledge' +
// the subject + the life area id, so nothing new is needed in the database:
//   - the Knowledge Vault shows it (searchable, foldered, exportable), and
//     its life-area filter reads the area id off the tags (getItemAreaId);
//   - the Library's Domains view finds it the same way (getDomainContent
//     matches `tags` containing the area id).
// Classes reads them back (getMyKnowledge): each subject's list shows the
// entries tagged with it, and "My knowledge" shows the latest of all.

import React, { useState } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, StyleSheet, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { addCapture } from '../api/captureService';
import { LIFE_AREAS } from '../screens/library/LifeAreaScreen';

export const MY_KNOWLEDGE_TAG = 'my-knowledge';
const OTHER = 'Other';

// The life area a subject most often belongs to, pre-picked until the
// player chooses one themselves. Subjects not listed get no guess.
const SUBJECT_AREA = {
  'Health & Fitness': 'physical',
  'Art & Music': 'creative',
  'Technology & Engineering': 'digital',
  'Business & Finance': 'financial',
  'Business Foundations': 'professional',
  'Acquisition & Ownership': 'professional',
  'Startup & Venture': 'professional',
  'Operations & Compliance': 'professional',
};

export default function AddKnowledgeSheet({ visible, onClose, subjects, userId, onOpenVault, onSaved, c, t, r }) {
  const [subject, setSubject] = useState(null);
  const [area, setArea] = useState(null);
  const [areaTouched, setAreaTouched] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);
  const styles = makeStyles(c, t, r);

  const reset = () => {
    setSubject(null); setArea(null); setAreaTouched(false);
    setTitle(''); setBody('');
    setSaved(false); setError(null);
  };
  const close = () => { reset(); onClose(); };

  const pickSubject = (name) => {
    const next = subject === name ? null : name;
    setSubject(next);
    if (!areaTouched) setArea(SUBJECT_AREA[next] || null);
  };
  const pickArea = (id) => {
    setAreaTouched(true);
    setArea(area === id ? null : id);
  };

  const canSave = !!userId && !!body.trim() && !saving;

  const save = async () => {
    if (!canSave) return;
    setSaving(true);
    setError(null);
    try {
      await addCapture(userId, {
        type: 'note',
        title: title.trim() || (subject && subject !== OTHER ? `My ${subject} notes` : 'My own knowledge'),
        body: body.trim(),
        tags: [
          MY_KNOWLEDGE_TAG,
          ...(subject && subject !== OTHER ? [subject] : []),
          ...(area ? [area] : []),
        ],
        // Filed straight into the Vault, not left in the Capture Inbox.
        status: 'active',
        source: 'manual',
      });
      setSaved(true);
      onSaved?.();
    } catch (e) {
      setError("Couldn't save that. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.sheet}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>Add my own knowledge</Text>
            <TouchableOpacity onPress={close} accessibilityRole="button" accessibilityLabel="Close">
              <Ionicons name="close" size={22} color={c.text3} />
            </TouchableOpacity>
          </View>

          {saved ? (
            <View style={{ gap: 12 }}>
              <View style={styles.savedRow}>
                <Ionicons name="checkmark-circle" size={20} color={c.success} />
                <Text style={styles.savedText}>Saved to your Vault.</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity style={[styles.btn, styles.btnGhost]} onPress={reset} accessibilityRole="button">
                  <Text style={[styles.btnText, { color: c.text1 }]}>Add another</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btn} onPress={() => { const a = area; close(); onOpenVault(a); }} accessibilityRole="button">
                  <Text style={styles.btnText}>Open my Vault</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <ScrollView keyboardShouldPersistTaps="handled">
              <Text style={styles.help}>
                Something you already know, learned somewhere else, or want to remember. It saves to your Vault.
              </Text>

              <Text style={styles.label}>Subject</Text>
              <View style={styles.chipWrap}>
                {[...subjects, OTHER].map(name => {
                  const on = subject === name;
                  return (
                    <TouchableOpacity
                      key={name}
                      onPress={() => pickSubject(name)}
                      style={[styles.chip, on && { backgroundColor: c.teal, borderColor: c.teal }]}
                      accessibilityRole="button"
                      accessibilityState={{ selected: on }}
                    >
                      <Text style={[styles.chipText, on && { color: c.onFill }]}>{name}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.label}>Life area (optional)</Text>
              <View style={styles.chipWrap}>
                {LIFE_AREAS.map(a => {
                  const on = area === a.id;
                  return (
                    <TouchableOpacity
                      key={a.id}
                      onPress={() => pickArea(a.id)}
                      style={[styles.chip, on && { backgroundColor: a.color, borderColor: a.color }]}
                      accessibilityRole="button"
                      accessibilityState={{ selected: on }}
                    >
                      <Text style={[styles.chipText, on && { color: c.onFill }]}>{a.emoji} {a.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.label}>Title (optional)</Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="e.g. How compound interest works"
                placeholderTextColor={c.text4}
                style={styles.input}
              />

              <Text style={styles.label}>What you know</Text>
              <TextInput
                value={body}
                onChangeText={setBody}
                placeholder="Write it in your own words."
                placeholderTextColor={c.text4}
                style={[styles.input, { minHeight: 120, textAlignVertical: 'top' }]}
                multiline
              />

              {!userId && <Text style={styles.error}>Sign in to save to your Vault.</Text>}
              {error && <Text style={styles.error}>{error}</Text>}

              <TouchableOpacity
                style={[styles.btn, { marginTop: 14 }, !canSave && { opacity: 0.5 }]}
                onPress={save}
                disabled={!canSave}
                accessibilityRole="button"
              >
                {saving
                  ? <ActivityIndicator color={c.onFill} />
                  : <Text style={styles.btnText}>Save to my Vault</Text>}
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const makeStyles = (c, t, r) => StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: {
    backgroundColor: c.bg1,
    borderTopLeftRadius: r.lg,
    borderTopRightRadius: r.lg,
    padding: 20,
    maxHeight: '90%',
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  title: { fontSize: t.lg, fontWeight: '800', color: c.text1 },
  help: { fontSize: t.sm, color: c.text3, marginBottom: 12 },
  label: { fontSize: t.sm, fontWeight: '700', color: c.text2, marginTop: 12, marginBottom: 6 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: r.full,
    backgroundColor: c.bg2, borderWidth: 1, borderColor: c.border,
  },
  chipText: { fontSize: t.sm, color: c.text2, fontWeight: '600' },
  input: {
    backgroundColor: c.bg2, borderWidth: 1, borderColor: c.border, borderRadius: r.md,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: t.md, color: c.text1,
  },
  error: { color: c.error, fontSize: t.sm, marginTop: 10 },
  btn: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: c.teal, borderRadius: r.full, paddingVertical: 12,
  },
  btnGhost: { backgroundColor: c.bg2, borderWidth: 1, borderColor: c.border },
  btnText: { fontSize: t.md, fontWeight: '800', color: c.onFill },
  savedRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  savedText: { fontSize: t.md, color: c.text1, fontWeight: '600' },
});
