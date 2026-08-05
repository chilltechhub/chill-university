// src/features/discover/ProjectDetailScreen.js
import React, { useLayoutEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity } from 'react-native';
import LinkRow from './LinkRow';

export default function ProjectDetailScreen({ route, navigation }) {
  const { project } = route.params;
  const [showAllNeeds, setShowAllNeeds] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({ title: project.title });
  }, [navigation, project.title]);

  const needs = showAllNeeds ? project.needs : project.needs.slice(0, 3);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Image source={{ uri: project.thumbnail }} style={styles.banner} />
      <Text style={styles.owner}>by {project.owner}</Text>
      <Text style={styles.summary}>{project.summary}</Text>

      <View style={styles.row}>
        <Text style={styles.badge}>{project.status}</Text>
        <Text style={styles.meta}>{project.contributors} contributors</Text>
      </View>

      <View style={styles.tags}>
        {project.tags.map((t) => (
          <View key={t} style={styles.tag}><Text style={styles.tagText}>{t}</Text></View>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Links</Text>
      <LinkRow links={project.links} />

      {project.needs?.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Help Wanted</Text>
          <View style={{ gap: 10 }}>
            {needs.map((n) => (
              <View key={n.id} style={styles.needCard}>
                <Text style={styles.needRole}>{n.role}</Text>
                <Text style={styles.needMeta}>Commitment: {n.commitment}</Text>
                {n.skills?.length ? <Text style={styles.needSkills}>Skills: {n.skills.join(', ')}</Text> : null}
              </View>
            ))}
          </View>
          {project.needs.length > 3 && (
            <TouchableOpacity style={styles.moreBtn} onPress={() => setShowAllNeeds((s) => !s)}>
              <Text style={styles.moreText}>{showAllNeeds ? 'Show less' : 'Show all roles'}</Text>
            </TouchableOpacity>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#fff' },
  banner: { width: '100%', height: 200, borderRadius: 12, backgroundColor: '#eee' },
  owner: { marginTop: 10, color: '#666' },
  summary: { marginTop: 8, fontSize: 15, lineHeight: 22, color: '#222' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
  badge: { fontSize: 12, paddingVertical: 2, paddingHorizontal: 8, backgroundColor: '#f1f1f1', borderRadius: 999 },
  meta: { color: '#666' },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 },
  tag: { backgroundColor: '#eef5ff', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 999 },
  tagText: { fontSize: 12, color: '#2f6fde' },
  sectionTitle: { marginTop: 18, fontWeight: '800', fontSize: 16 },
  needCard: { backgroundColor: '#f7f7f7', padding: 10, borderRadius: 8 },
  needRole: { fontWeight: '800' },
  needMeta: { color: '#555', marginTop: 2 },
  needSkills: { color: '#333', marginTop: 4 },
  moreBtn: { marginTop: 10, alignSelf: 'flex-start' },
  moreText: { color: '#16489b', fontWeight: '700' },
});