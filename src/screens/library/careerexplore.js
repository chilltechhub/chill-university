// src/screens/career/CareerExplorationScreen.js
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, FlatList, Linking, Modal, Dimensions
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const CAREERS = [
  { id: '1', title: 'AI / ML Systems Architect', field: 'Technology', skills: ['Python', 'Neural Networks', 'Math', 'Data Pipelines'], salary: '$120k - $250k', demand: 'Very High', trajectory: '+32% Growth', icon: 'robot-outline', color: '#00F0FF' },
  { id: '2', title: 'UX / Spatial Designer', field: 'Design', skills: ['Figma', 'User Research', 'Spatial UI', 'Prototyping'], salary: '$75k - $145k', demand: 'High', trajectory: '+15% Growth', icon: 'palette-outline', color: '#FF4081' },
  { id: '3', title: 'Quantum Data Engineer', field: 'Technology', skills: ['SQL', 'Linear Algebra', 'Python', 'Cloud Infra'], salary: '$95k - $180k', demand: 'Very High', trajectory: '+28% Growth', icon: 'database-outline', color: '#00F0FF' },
  { id: '4', title: 'Robotics Kinematics Lead', field: 'Engineering', skills: ['Physics', 'C++', 'CAD', 'Control Systems'], salary: '$90k - $165k', demand: 'Very High', trajectory: '+22% Growth', icon: 'cog-outline', color: '#FFB800' },
  { id: '5', title: 'Biomedical Researcher', field: 'Healthcare', skills: ['Genomics', 'Lab Analysis', 'Chemistry', 'Statistics'], salary: '$70k - $135k', demand: 'High', trajectory: '+12% Growth', icon: 'medical-outline', color: '#00E676' },
  { id: '6', title: 'FinTech Strategist', field: 'Finance', skills: ['Financial Modeling', 'Blockchain', 'Analytics'], salary: '$85k - $175k', demand: 'Medium', trajectory: '+8% Growth', icon: 'stats-chart-outline', color: '#7C4DFF' },
];

const FIELDS = ['All', 'Technology', 'Design', 'Engineering', 'Healthcare', 'Finance'];

const DEMAND_COLORS = {
  'Very High': '#00E676',
  'High': '#00F0FF',
  'Medium': '#FFB800',
  'Low': '#FF5252'
};

export default function CareerExplorationScreen() {
  const [search, setSearch] = useState('');
  const [activeField, setActiveField] = useState('All');
  const [selectedCareer, setSelectedCareer] = useState(null);
  const [savedCareers, setSavedCareers] = useState(['1', '4']);

  const filtered = CAREERS.filter(career => {
    const matchField = activeField === 'All' || career.field === activeField;
    const matchSearch = !search || 
      career.title.toLowerCase().includes(search.toLowerCase()) || 
      career.field.toLowerCase().includes(search.toLowerCase());
    return matchField && matchSearch;
  });

  const toggleSave = (id) => {
    setSavedCareers(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  return (
    <View style={styles.container}>
      {/* Top Telemetry Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSubtitle}>SECTOR INTELLIGENCE</Text>
          <Text style={styles.headerTitle}>Career Trajectories</Text>
        </View>
        <View style={styles.savedBadge}>
          <Ionicons name="bookmark" size={14} color="#FFB800" />
          <Text style={styles.savedCountText}>{savedCareers.length} Targets</Text>
        </View>
      </View>

      {/* Search Input Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#00F0FF" />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Scan career titles, skills, or fields..."
            placeholderTextColor="#626D82"
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color="#626D82" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Horizontal Field Selector */}
      <View style={styles.fieldScrollContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.fieldScroll}>
          {FIELDS.map(f => {
            const isActive = activeField === f;
            return (
              <TouchableOpacity
                key={f}
                style={[styles.fieldChip, isActive && styles.activeFieldChip]}
                onPress={() => setActiveField(f)}
              >
                <Text style={[styles.fieldChipText, isActive && styles.activeFieldChipText]}>
                  {f}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Career Fleet List */}
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="radar" size={50} color="#1F263E" />
            <Text style={styles.emptyTitle}>No Career Trajectories Found</Text>
            <Text style={styles.emptySubtitle}>Try adjusting your search query or field filter.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const isSaved = savedCareers.includes(item.id);
          const demandColor = DEMAND_COLORS[item.demand] || '#00F0FF';

          return (
            <TouchableOpacity
              style={[styles.careerCard, { borderLeftColor: item.color }]}
              onPress={() => setSelectedCareer(item)}
            >
              <View style={styles.cardHeader}>
                <View style={styles.iconBox}>
                  <Ionicons name={item.icon} size={22} color={item.color} />
                </View>

                <View style={styles.titleArea}>
                  <Text style={styles.careerTitle}>{item.title}</Text>
                  <Text style={styles.careerField}>{item.field.toUpperCase()}</Text>
                </View>

                <TouchableOpacity onPress={() => toggleSave(item.id)} style={styles.bookmarkBtn}>
                  <Ionicons 
                    name={isSaved ? "bookmark" : "bookmark-outline"} 
                    size={18} 
                    color={isSaved ? "#FFB800" : "#626D82"} 
                  />
                </TouchableOpacity>
              </View>

              {/* Metrics Pill Row */}
              <View style={styles.metricsRow}>
                <View style={styles.metricBadge}>
                  <Ionicons name="cash-outline" size={12} color="#00E676" />
                  <Text style={styles.metricText}>{item.salary}</Text>
                </View>

                <View style={[styles.metricBadge, { backgroundColor: 'rgba(0,240,255,0.08)' }]}>
                  <Ionicons name="trending-up-outline" size={12} color={demandColor} />
                  <Text style={[styles.metricText, { color: demandColor }]}>{item.demand} Demand</Text>
                </View>

                <View style={styles.trajectoryBadge}>
                  <Text style={styles.trajectoryText}>{item.trajectory}</Text>
                </View>
              </View>

              {/* Skill Chips */}
              <View style={styles.skillsRow}>
                {item.skills.slice(0, 3).map(sk => (
                  <View key={sk} style={styles.skillChip}>
                    <Text style={styles.skillChipText}>{sk}</Text>
                  </View>
                ))}
                {item.skills.length > 3 && (
                  <Text style={styles.moreSkillsText}>+{item.skills.length - 3} more</Text>
                )}
              </View>
            </TouchableOpacity>
          );
        }}
      />

      {/* Detailed Career Intel Modal */}
      <Modal visible={!!selectedCareer} transparent animationType="slide" onRequestClose={() => setSelectedCareer(null)}>
        <View style={styles.modalOverlay}>
          {selectedCareer && (
            <View style={styles.modalContent}>
              <View style={styles.modalHandle} />

              <View style={styles.modalHeader}>
                <View style={[styles.iconBox, { backgroundColor: 'rgba(0,240,255,0.1)' }]}>
                  <Ionicons name={selectedCareer.icon} size={28} color={selectedCareer.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalTitle}>{selectedCareer.title}</Text>
                  <Text style={styles.modalSubtitle}>{selectedCareer.field} Sector</Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedCareer(null)}>
                  <Ionicons name="close-circle" size={24} color="#626D82" />
                </TouchableOpacity>
              </View>

              <View style={styles.statsGrid}>
                <View style={styles.statBox}>
                  <Text style={styles.statBoxLabel}>EST. SALARY</Text>
                  <Text style={styles.statBoxValue}>{selectedCareer.salary}</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statBoxLabel}>MARKET DEMAND</Text>
                  <Text style={[styles.statBoxValue, { color: DEMAND_COLORS[selectedCareer.demand] }]}>
                    {selectedCareer.demand}
                  </Text>
                </View>
              </View>

              <Text style={styles.modalSectionTitle}>🎯 REQUIRED SKILLS & CORE COMPETENCIES</Text>
              <View style={styles.modalSkillsList}>
                {selectedCareer.skills.map(sk => (
                  <View key={sk} style={styles.modalSkillTag}>
                    <Ionicons name="checkmark-circle" size={14} color="#00E676" />
                    <Text style={styles.modalSkillText}>{sk}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.externalLinkBtn}
                  onPress={() => Linking.openURL('https://www.bls.gov/ooh/')}
                >
                  <Ionicons name="compass-outline" size={16} color="#00F0FF" />
                  <Text style={styles.externalLinkText}>Open Bureau of Labor Data</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.saveCareerBtn, savedCareers.includes(selectedCareer.id) && styles.savedBtnActive]}
                  onPress={() => toggleSave(selectedCareer.id)}
                >
                  <Ionicons name={savedCareers.includes(selectedCareer.id) ? "bookmark" : "bookmark-outline"} size={16} color="#000" />
                  <Text style={styles.saveBtnText}>
                    {savedCareers.includes(selectedCareer.id) ? "Targeted" : "Target Career"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0D17', paddingTop: 50 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 16 },
  headerSubtitle: { color: '#00E676', fontSize: 10, letterSpacing: 2, fontWeight: '800' },
  headerTitle: { color: '#FFF', fontSize: 24, fontWeight: 'bold' },
  savedBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#141829', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,184,0,0.3)' },
  savedCountText: { color: '#FFB800', fontSize: 11, fontWeight: 'bold' },
  searchContainer: { paddingHorizontal: 20, marginBottom: 12 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#141829', borderRadius: 12, paddingHorizontal: 12, borderWidth: 1, borderColor: '#1F263E', gap: 8 },
  searchInput: { flex: 1, paddingVertical: 10, color: '#FFF', fontSize: 13 },
  fieldScrollContainer: { marginBottom: 16 },
  fieldScroll: { paddingHorizontal: 20, gap: 8 },
  fieldChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#141829', borderWidth: 1, borderColor: '#1F263E' },
  activeFieldChip: { borderColor: '#00E676', backgroundColor: 'rgba(0,230,118,0.1)' },
  fieldChipText: { color: '#626D82', fontSize: 12 },
  activeFieldChipText: { color: '#00E676', fontWeight: 'bold' },
  listContent: { paddingHorizontal: 20, paddingBottom: 40, gap: 12 },
  careerCard: { backgroundColor: '#141829', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#1F263E', borderLeftWidth: 4 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  iconBox: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#06080F', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#1F263E' },
  titleArea: { flex: 1 },
  careerTitle: { color: '#FFF', fontSize: 15, fontWeight: 'bold' },
  careerField: { color: '#626D82', fontSize: 10, fontWeight: '700', letterSpacing: 0.5, marginTop: 2 },
  bookmarkBtn: { padding: 4 },
  metricsRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' },
  metricBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#06080F', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  metricText: { color: '#A0AABF', fontSize: 11, fontWeight: '600' },
  trajectoryBadge: { marginLeft: 'auto', backgroundColor: 'rgba(0,230,118,0.15)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  trajectoryText: { color: '#00E676', fontSize: 10, fontWeight: 'bold' },
  skillsRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  skillChip: { backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  skillChipText: { color: '#8E9BB0', fontSize: 10 },
  moreSkillsText: { color: '#626D82', fontSize: 10, fontStyle: 'italic' },
  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyTitle: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginTop: 12 },
  emptySubtitle: { color: '#626D82', fontSize: 12, marginTop: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#141829', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, borderTopWidth: 1, borderTopColor: 'rgba(0,230,118,0.3)' },
  modalHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#1F263E', alignSelf: 'center', marginBottom: 16 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  modalTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  modalSubtitle: { color: '#8E9BB0', fontSize: 12 },
  statsGrid: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statBox: { flex: 1, backgroundColor: '#06080F', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#1F263E' },
  statBoxLabel: { color: '#626D82', fontSize: 9, fontWeight: 'bold', letterSpacing: 1, marginBottom: 4 },
  statBoxValue: { color: '#00E676', fontSize: 14, fontWeight: 'bold' },
  modalSectionTitle: { color: '#00F0FF', fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 10 },
  modalSkillsList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  modalSkillTag: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#06080F', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#1F263E' },
  modalSkillText: { color: '#FFF', fontSize: 12 },
  actionRow: { flexDirection: 'row', gap: 10 },
  externalLinkBtn: { flex: 1.2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#06080F', paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: '#00F0FF' },
  externalLinkText: { color: '#00F0FF', fontSize: 12, fontWeight: 'bold' },
  saveCareerBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#00E676', paddingVertical: 12, borderRadius: 10 },
  savedBtnActive: { backgroundColor: '#FFB800' },
  saveBtnText: { color: '#000', fontSize: 12, fontWeight: 'bold' }
});