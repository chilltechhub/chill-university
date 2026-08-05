// library/components/LinkSuggest.js
// Shows an autocomplete list when user types [[ in a TextInput
// Usage: wrap your TextInput with this and pass cores

import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Returns the partial link query if cursor is inside [[ ... ]]
function getLinkQuery(text, selection) {
  const before = text.slice(0, selection?.start || text.length);
  const match = before.match(/\[\[([^\]]*)$/);
  return match ? match[1] : null;
}

// Inserts the chosen core title at the [[ position
function insertLink(text, selection, coreTitle) {
  const pos = selection?.start || text.length;
  const before = text.slice(0, pos);
  const after = text.slice(pos);
  // Replace the partial [[query with [[Full Title]]
  const replaced = before.replace(/\[\[([^\]]*)$/, `[[${coreTitle}]]`);
  return replaced + after;
}

export default function LinkSuggest({
  value, onChangeText, cores = [],
  style, placeholder, placeholderTextColor,
  multiline, autoFocus, inputStyle,
}) {
  const [selection, setSelection] = useState(null);
  const [suggestions, setSuggestions] = useState([]);

  const handleChange = useCallback((text) => {
    onChangeText(text);
    const query = getLinkQuery(text, selection);
    if (query !== null) {
      const lower = query.toLowerCase();
      const matches = cores.filter(c =>
        c.title.toLowerCase().includes(lower)
      ).slice(0, 5);
      setSuggestions(matches);
    } else {
      setSuggestions([]);
    }
  }, [selection, cores, onChangeText]);

  const pickSuggestion = (core) => {
    const newText = insertLink(value, selection, core.title);
    onChangeText(newText);
    setSuggestions([]);
  };

  const PLANT_EMOJI = { tree: '🌳', flower: '🌸', plant: '🌿', sprout: '🌱' };

  return (
    <View style={style}>
      <TextInput
        style={inputStyle}
        value={value}
        onChangeText={handleChange}
        onSelectionChange={e => setSelection(e.nativeEvent.selection)}
        placeholder={placeholder}
        placeholderTextColor={placeholderTextColor}
        multiline={multiline}
        autoFocus={autoFocus}
      />

      {/* Autocomplete dropdown */}
      {suggestions.length > 0 && (
        <View style={styles.dropdown}>
          <Text style={styles.dropdownHint}>
            <Ionicons name="git-network-outline" size={11} color="#4a7a4a" /> link to plant
          </Text>
          {suggestions.map(core => (
            <TouchableOpacity
              key={core.id}
              style={styles.suggestion}
              onPress={() => pickSuggestion(core)}
            >
              <View style={[styles.dot, { backgroundColor: core.color }]} />
              <Text style={styles.suggestionEmoji}>
                {PLANT_EMOJI[core.plant_type] || '🌱'}
              </Text>
              <Text style={styles.suggestionTitle}>{core.title}</Text>
            </TouchableOpacity>
          ))}
          <Text style={styles.dropdownTip}>type [[ to link to any plant</Text>
        </View>
      )}

      {/* Hint shown when not typing a link */}
      {suggestions.length === 0 && value?.length === 0 && (
        <Text style={styles.linkHint}>
          tip: type [[ to link to another plant
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  dropdown: {
    backgroundColor: '#0a180a',
    borderWidth: 0.5,
    borderColor: '#2e7d32',
    borderRadius: 10,
    marginTop: 4,
    overflow: 'hidden',
  },
  dropdownHint: {
    fontSize: 10,
    color: '#4a7a4a',
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderTopWidth: 0.5,
    borderTopColor: '#1a3a1a',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  suggestionEmoji: { fontSize: 14 },
  suggestionTitle: { fontSize: 14, color: '#8fbc8f', fontWeight: '500' },
  dropdownTip: {
    fontSize: 10,
    color: '#2a5a2a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderTopWidth: 0.5,
    borderTopColor: '#1a3a1a',
  },
  linkHint: {
    fontSize: 11,
    color: '#2a5a2a',
    marginTop: 4,
    paddingHorizontal: 2,
  },
});
