// library/components/LinkedText.js
// Parses [[Plant Name]] syntax and renders tappable highlighted links
// Usage: <LinkedText text={someText} cores={cores} onLinkPress={(core) => ...} />

import React from 'react';
import { Text, StyleSheet } from 'react-native';

// Splits text into segments: plain strings and [[link]] tokens
function parseLinks(text) {
  if (!text) return [];
  const segments = [];
  const regex = /\[\[([^\]]+)\]\]/g;
  let lastIndex = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', value: text.slice(lastIndex, match.index) });
    }
    segments.push({ type: 'link', value: match[1].trim() });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    segments.push({ type: 'text', value: text.slice(lastIndex) });
  }
  return segments;
}

// Fuzzy match — finds a core by title (case-insensitive, partial ok)
function findCore(cores, name) {
  const lower = name.toLowerCase();
  return cores.find(c => c.title.toLowerCase() === lower)
    || cores.find(c => c.title.toLowerCase().includes(lower))
    || cores.find(c => lower.includes(c.title.toLowerCase()));
}

export default function LinkedText({ text, cores = [], onLinkPress, style, linkStyle }) {
  const segments = parseLinks(text);

  return (
    <Text style={style}>
      {segments.map((seg, i) => {
        if (seg.type === 'text') {
          return <Text key={i} style={style}>{seg.value}</Text>;
        }
        const linked = findCore(cores, seg.value);
        return (
          <Text
            key={i}
            style={[
              styles.link,
              linked ? { backgroundColor: linked.color_light || '#e1f5ee', color: linked.color || '#1d9e75' } : styles.linkBroken,
              linkStyle,
            ]}
            onPress={() => linked && onLinkPress && onLinkPress(linked)}
          >
            {' '}{seg.value}{' '}
          </Text>
        );
      })}
    </Text>
  );
}

const styles = StyleSheet.create({
  link: {
    borderRadius: 4,
    paddingHorizontal: 4,
    fontWeight: '600',
    overflow: 'hidden',
  },
  linkBroken: {
    backgroundColor: '#1a3a1a',
    color: '#4a7a4a',
    fontStyle: 'italic',
  },
});
