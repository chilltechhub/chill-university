// src/features/discover/LinkRow.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';

const ICON = {
  github: 'GitHub',
  gitlab: 'GitLab',
  bitbucket: 'Bitbucket',
  figma: 'Figma',
  codesandbox: 'CodeSandbox',
  replit: 'Replit',
  glitch: 'Glitch',
  notion: 'Notion',
  drive: 'Google Drive',
  video: 'Video',
  site: 'Website',
};

export default function LinkRow({ links }) {
  if (!links?.length) return null;
  return (
    <View style={styles.wrap}>
      {links.map((l, idx) => (
        <TouchableOpacity key={idx} style={styles.link} onPress={() => Linking.openURL(l.url)}>
          <Text style={styles.linkText}>{ICON[l.type] || 'Link'} • {l.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 8, gap: 8 },
  link: { paddingVertical: 10, paddingHorizontal: 12, backgroundColor: '#f7f7f7', borderRadius: 8 },
  linkText: { color: '#16489b', fontWeight: '600' },
});