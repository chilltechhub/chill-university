// src/screens/library/notes.js
import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity,
  TextInput, FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../context/ThemeContext';

const FEATURES = [
  { emoji: '✏️', title: 'Quick capture',     desc: 'Write a note in seconds and find it later' },
  { emoji: '🏷️', title: 'Tag and organize', desc: 'Add tags to find related notes fast' },
  { emoji: '🔗', title: 'Link to projects', desc: 'Attach notes to projects and ideas' },
  { emoji: '🌱', title: 'Send to Garden',   desc: 'Turn a note into a full idea' },
];

export default function NotesScreen() {
  const { colors: c, typography: t, spacing: s, radius: r } = useTheme();
  const [notes, setNotes] = useState([]);
  const [input, setInput] = useState('');

  const add = () => {
    if (!input.trim()) return;
    setNotes(prev => [{ id: Date.now().toString(), text: input.trim(), created_at: new Date().toISOString() }, ...prev]);
    setInput('');
  };

  const remove = (id) => setNotes(prev => prev.filter(n => n.id !== id));

  return (
    <View style={{ flex: 1, backgroundColor: c.bg0 }}>
      {/* Header */}
      <View style={{ backgroundColor: c.headerBg, padding: s.lg, borderBottomWidth: 0.5, borderBottomColor: c.border }}>
        <Text style={{ fontSize: t.xxl, fontWeight: t.bold, color: c.text1 }}>📝 Notes</Text>
        <Text style={{ fontSize: t.xs, color: c.text3, marginTop: 4 }}>Quick notes and thoughts captured anywhere</Text>
      </View>

      {/* Input */}
      <View style={{ flexDirection: 'row', gap: s.sm, padding: s.lg, backgroundColor: c.bg1, borderBottomWidth: 0.5, borderBottomColor: c.border }}>
        <TextInput
          style={{ flex: 1, backgroundColor: c.bg0, borderRadius: r.md, padding: s.md, fontSize: t.sm, color: c.text1, borderWidth: 0.5, borderColor: c.border }}
          value={input} onChangeText={setInput}
          placeholder="Write a note..." placeholderTextColor={c.text4}
          onSubmitEditing={add}
        />
        <TouchableOpacity
          style={{ backgroundColor: c.teal, borderRadius: r.md, padding: s.md, alignItems: 'center', justifyContent: 'center' }}
          onPress={add}
        >
          <Ionicons name="add" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* List */}
      <FlatList
        data={notes}
        keyExtractor={n => n.id}
        contentContainerStyle={{ padding: s.lg, gap: s.sm }}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingTop: 60 }}>
            <Text style={{ fontSize: 44, marginBottom: s.lg }}>📝</Text>
            <Text style={{ fontSize: t.lg, fontWeight: t.bold, color: c.text1, marginBottom: s.sm }}>Notes</Text>
            <Text style={{ fontSize: t.sm, color: c.text3, textAlign: 'center', lineHeight: 20, marginBottom: s.xl }}>
              Quick notes and thoughts captured anywhere
            </Text>
            {FEATURES.map((f, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: s.md, width: '100%', backgroundColor: c.bg1, borderRadius: r.md, padding: s.md, marginBottom: s.sm, borderWidth: 0.5, borderColor: c.border }}>
                <Text style={{ fontSize: 20 }}>{f.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: t.sm, fontWeight: t.semibold, color: c.text1 }}>{f.title}</Text>
                  <Text style={{ fontSize: t.xs, color: c.text3, marginTop: 2 }}>{f.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        }
        renderItem={({ item }) => (
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: s.md, backgroundColor: c.bg1, borderRadius: r.md, padding: s.md, borderWidth: 0.5, borderColor: c.border, borderLeftWidth: 3, borderLeftColor: c.gold }}>
            <Text style={{ flex: 1, fontSize: t.sm, color: c.text1, lineHeight: 20 }}>{item.text}</Text>
            <TouchableOpacity onPress={() => remove(item.id)}>
              <Ionicons name="close-circle-outline" size={18} color={c.text4} />
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}
