// src/features/discover/ProjectCard.js
import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';

export default function ProjectCard({ project, onPress, onContribute }) {
  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(project)}>
      <Image source={{ uri: project.thumbnail }} style={styles.thumb} />
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>{project.title}</Text>
        <Text style={styles.owner} numberOfLines={1}>by {project.owner}</Text>

        <View style={styles.row}>
          <Text style={styles.status}>{project.status}</Text>
          <View style={styles.progressWrap}>
            <View style={[styles.progressFill, { width: `${project.progress}%` }]} />
          </View>
          <Text style={styles.meta}>{project.contributors} contrib.</Text>
        </View>

        <View style={styles.tags}>
          {project.tags.slice(0, 4).map((t) => (
            <View key={t} style={styles.tag}><Text style={styles.tagText}>{t}</Text></View>
          ))}
        </View>

        {project.needs?.length > 0 && (
          <View style={styles.needsRow}>
            <Text style={styles.needsLabel}>Help Wanted:</Text>
            <Text style={styles.needsText} numberOfLines={1}>
              {project.needs.map(n => n.role).join(', ')}
            </Text>
          </View>
        )}

        {project.needs?.length > 0 && (
          <TouchableOpacity style={styles.cta} onPress={() => onContribute(project)}>
            <Text style={styles.ctaText}>Contribute</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', marginBottom: 16, elevation: 2 },
  thumb: { width: '100%', height: 160, backgroundColor: '#eee' },
  content: { padding: 12 },
  title: { fontSize: 16, fontWeight: '700' },
  owner: { marginTop: 2, color: '#666' },
  row: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  status: { fontSize: 12, paddingVertical: 2, paddingHorizontal: 8, backgroundColor: '#f1f1f1', borderRadius: 999 },
  progressWrap: { flex: 1, height: 6, backgroundColor: '#eee', borderRadius: 4, marginHorizontal: 10 },
  progressFill: { height: 6, backgroundColor: '#4a90e2', borderRadius: 4 },
  meta: { color: '#666', fontSize: 12 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8, gap: 6 },
  tag: { backgroundColor: '#eef5ff', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 999 },
  tagText: { fontSize: 12, color: '#2f6fde' },
  needsRow: { marginTop: 10 },
  needsLabel: { fontWeight: '700', fontSize: 12 },
  needsText: { color: '#333', marginTop: 2 },
  cta: { marginTop: 10, backgroundColor: '#2f6fde', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  ctaText: { color: '#fff', fontWeight: '700' },
});