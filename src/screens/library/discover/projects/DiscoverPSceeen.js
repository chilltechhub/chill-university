// src/features/discover/DiscoverScreen.js
import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import ProjectCard from './ProjectCard';
import ContributeModal from './ContributeModal';
import { sampleProjects, PROJECT_STATUSES } from './data';
import { useNavigation } from '@react-navigation/native';

export default function DiscoverScreen() {
  const navigation = useNavigation();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('All');
  const [needsOnly, setNeedsOnly] = useState(false);
  const [contribTarget, setContribTarget] = useState(null);
  const [contribVisible, setContribVisible] = useState(false);

  const filtered = useMemo(() => {
    return sampleProjects.filter((p) => {
      const text = (p.title + ' ' + p.summary + ' ' + p.tags.join(' ') + ' ' + p.owner).toLowerCase();
      const passesQ = q.trim().length ? text.includes(q.toLowerCase()) : true;
      const passesStatus = status === 'All' ? true : p.status === status;
      const passesNeeds = needsOnly ? (p.needs && p.needs.length > 0) : true;
      return passesQ && passesStatus && passesNeeds;
    });
  }, [q, status, needsOnly]);

  const openProject = (project) => {
    navigation.navigate('ProjectDetailScreen', { project });
  };

  const openContribute = (project) => {
    setContribTarget(project);
    setContribVisible(true);
  };

  return (
    <View style={styles.screen}>
      {/* Search + filters */}
      <View style={styles.top}>
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Search projects, tags, owners"
          style={styles.search}
          returnKeyType="search"
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pills} contentContainerStyle={{ gap: 8 }}>
          <FilterPill label="All" active={status === 'All'} onPress={() => setStatus('All')} />
          {PROJECT_STATUSES.map(s => (
            <FilterPill key={s} label={s} active={status === s} onPress={() => setStatus(s)} />
          ))}
          <FilterPill
            label="Help Wanted"
            active={needsOnly}
            onPress={() => setNeedsOnly(v => !v)}
          />
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {filtered.map((p) => (
          <ProjectCard
            key={p.id}
            project={p}
            onPress={openProject}
            onContribute={openContribute}
          />
        ))}
        {filtered.length === 0 && (
          <View style={{ padding: 24, alignItems: 'center' }}>
            <Text style={{ color: '#666' }}>No projects match your filters.</Text>
          </View>
        )}
      </ScrollView>

      <ContributeModal
        visible={contribVisible}
        project={contribTarget}
        onClose={(payload) => {
          setContribVisible(false);
          setContribTarget(null);
          if (payload) {
            // For now just confirm locally in; later this becomes a mutation
            // You can also add a toast
            console.log('Contribute payload:', payload);
          }
        }}
      />
    </View>
  );
}

function FilterPill({ label, active, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.pill, active && styles.pillActive]}>
      <Text style={[styles.pillText, active && styles.pillTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff' },
  top: { padding: 12 },
  search: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
  },
  pills: { marginTop: 10 },
  pill: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 999, backgroundColor: '#f1f1f1' },
  pillActive: { backgroundColor: '#2f6fde' },
  pillText: { color: '#333' },
  pillTextActive: { color: '#fff', fontWeight: '700' },
  list: { padding: 12 },
});