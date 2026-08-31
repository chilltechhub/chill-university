// src/screens/portfolio/PortfolioScreen.js
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  FlatList, Image, Linking, Modal, TextInput, KeyboardAvoidingView, Platform
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const SECTIONS = [
  { key: 'projects', label: 'Projects', icon: 'rocket-outline', color: '#00F0FF' },
  { key: 'skills', label: 'Skills & XP', icon: 'flash-outline', color: '#FFB800' },
  { key: 'experience', label: 'Experience', icon: 'briefcase-outline', color: '#00E676' },
  { key: 'research', label: 'Research', icon: 'flask-outline', color: '#7C4DFF' },
  { key: 'hobbies', label: 'Passions', icon: 'color-palette-outline', color: '#FF4081' },
];

const INITIAL_DATA = {
  projects: [
    { id: '1', title: 'Mars Rover Kinematics', desc: 'Autonomous nav algorithm built in Python.', link: 'https://github.com', tag: 'Robotics', status: 'Verified' },
  ],
  skills: [
    { id: '2', title: 'React Native & Expo', desc: 'Mastery Level 8 • 4 Completed Projects', tag: 'Mobile Dev', status: 'Level 8' },
    { id: '3', title: 'Python Systems', desc: 'Mastery Level 6 • Kinematics & Data', tag: 'Backend', status: 'Level 6' },
  ],
  experience: [
    { id: '4', title: 'Lead Systems Architect', desc: 'Horizon Delmarva • 2024 - Present', link: 'https://linkedin.com', tag: 'Full-Time' },
  ],
  research: [
    { id: '5', title: 'Exoplanet Atmospheric Density Model', desc: 'Published research paper on orbital gas dynamics.', link: 'https://arxiv.org', tag: 'Astrophysics' },
  ],
  hobbies: [
    { id: '6', title: 'Generative UI Design', desc: 'Designing futuristic dark-mode UI systems.', tag: 'Creative' },
  ],
};

export default function PortfolioScreen({ navigation }) {
  const [data, setData] = useState(INITIAL_DATA);
  const [activeSection, setActiveSection] = useState('projects');
  const [showAdd, setShowAdd] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [link, setLink] = useState('');
  const [tag, setTag] = useState('');

  const currentSection = SECTIONS.find(s => s.key === activeSection);
  const currentItems = data[activeSection] || [];

  const handleAddItem = () => {
    if (!title.trim()) return;
    const newItem = {
      id: Date.now().toString(),
      title: title.trim(),
      desc: desc.trim(),
      link: link.trim(),
      tag: tag.trim() || 'General',
      status: 'Active'
    };
    setData(prev => ({ ...prev, [activeSection]: [newItem, ...prev[activeSection]] }));
    resetForm();
  };

  const removeItem = (id) => {
    setData(prev => ({
      ...prev,
      [activeSection]: prev[activeSection].filter(item => item.id !== id)
    }));
  };

  const resetForm = () => {
    setTitle(''); setDesc(''); setLink(''); setTag(''); setShowAdd(false);
  };

  return (
    <View style={styles.container}>
      {/* Captain Profile Banner */}
      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          <Image 
            source={{ uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300' }} 
            style={styles.avatar} 
          />
          <View style={styles.rankBadge}>
            <Text style={styles.rankBadgeText}>LVL 14</Text>
          </View>
        </View>

        <View style={styles.profileMeta}>
          <Text style={styles.commanderName}>Commander Tyler</Text>
          <Text style={styles.commanderTitle}>Full-Stack Engineer & Designer</Text>
          
          <View style={styles.badgeRow}>
            <View style={styles.statBadge}>
              <Ionicons name="trophy" size={12} color="#FFB800" />
              <Text style={styles.statText}>1,420 XP</Text>
            </View>
            <View style={styles.statBadge}>
              <Ionicons name="checkmark-done-circle" size={12} color="#00E676" />
              <Text style={styles.statText}>12 Badges</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.shareFleetBtn}
          onPress={() => Linking.openURL('https://portfolio.dev')}
        >
          <Ionicons name="share-social-outline" size={18} color="#FFB800" />
        </TouchableOpacity>
      </View>

      {/* Navigation Chips */}
      <View style={styles.categoriesContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
          {SECTIONS.map((sec) => {
            const isActive = activeSection === sec.key;
            return (
              <TouchableOpacity
                key={sec.key}
                style={[styles.chip, isActive && { borderColor: sec.color, backgroundColor: 'rgba(20,24,41,0.9)' }]}
                onPress={() => setActiveSection(sec.key)}
              >
                <Ionicons name={sec.icon} size={16} color={isActive ? sec.color : '#626D82'} />
                <Text style={[styles.chipText, isActive && { color: '#FFF', fontWeight: 'bold' }]}>
                  {sec.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Main Content Header */}
      <View style={styles.sectionHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={styles.sectionTitle}>{currentSection?.label.toUpperCase()}</Text>
          <Text style={styles.sectionCount}>({currentItems.length})</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAdd(true)}>
          <Ionicons name="add" size={16} color="#000" />
          <Text style={styles.addBtnText}>Deploy Artifact</Text>
        </TouchableOpacity>
      </View>

      {/* Item Fleet List */}
      <FlatList
        data={currentItems}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="shield-star-outline" size={50} color="#1F263E" />
            <Text style={styles.emptyTitle}>No {currentSection?.label} Logged</Text>
            <Text style={styles.emptySubtitle}>Tap "Deploy Artifact" to add your work to your command vault.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.card, { borderLeftColor: currentSection?.color }]}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTagBadge}>
                <Text style={[styles.cardTagText, { color: currentSection?.color }]}>{item.tag || 'Artifact'}</Text>
              </View>
              <TouchableOpacity onPress={() => removeItem(item.id)}>
                <Ionicons name="trash-outline" size={16} color="#626D82" />
              </TouchableOpacity>
            </View>

            <Text style={styles.cardTitle}>{item.title}</Text>
            {item.desc ? <Text style={styles.cardDesc}>{item.desc}</Text> : null}

            {item.link ? (
              <TouchableOpacity style={styles.linkRow} onPress={() => Linking.openURL(item.link)}>
                <Ionicons name="planet-outline" size={14} color="#00F0FF" />
                <Text style={styles.linkText}>Launch Telemetry / View URL</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        )}
      />

      {/* Add Item Modal */}
      <Modal visible={showAdd} transparent animationType="slide" onRequestClose={resetForm}>
        <KeyboardAvoidingView 
          style={styles.modalOverlay} 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>
              Deploy New {currentSection?.label} Artifact
            </Text>

            <TextInput 
              style={styles.input} 
              placeholder="Artifact Title *" 
              placeholderTextColor="#626D82" 
              value={title} 
              onChangeText={setTitle} 
              autoFocus 
            />
            <TextInput 
              style={styles.input} 
              placeholder="Tag / Discipline (e.g. Mobile Dev, Research)" 
              placeholderTextColor="#626D82" 
              value={tag} 
              onChangeText={setTag} 
            />
            <TextInput 
              style={[styles.input, { height: 70, textAlignVertical: 'top' }]} 
              placeholder="Description & Key Achievements" 
              placeholderTextColor="#626D82" 
              value={desc} 
              onChangeText={setDesc} 
              multiline 
            />
            <TextInput 
              style={styles.input} 
              placeholder="External Link / Repository URL" 
              placeholderTextColor="#626D82" 
              value={link} 
              onChangeText={setLink} 
              autoCapitalize="none" 
            />

            <View style={styles.modalActionRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={resetForm}>
                <Text style={styles.cancelText}>Abort</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.submitBtn, { opacity: !title.trim() ? 0.5 : 1 }]} 
                onPress={handleAddItem}
                disabled={!title.trim()}
              >
                <Text style={styles.submitText}>Save to Vault</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0D17', paddingTop: 50 },
  profileHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 20, gap: 14 },
  avatarContainer: { position: 'relative' },
  avatar: { width: 60, height: 60, borderRadius: 30, borderWidth: 2, borderColor: '#FFB800' },
  rankBadge: { position: 'absolute', bottom: -4, right: -4, backgroundColor: '#FFB800', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  rankBadgeText: { color: '#000', fontSize: 9, fontWeight: 'bold' },
  profileMeta: { flex: 1 },
  commanderName: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  commanderTitle: { color: '#8E9BB0', fontSize: 12, marginBottom: 6 },
  badgeRow: { flexDirection: 'row', gap: 8 },
  statBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#141829', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, borderWidth: 1, borderColor: '#1F263E' },
  statText: { color: '#A0AABF', fontSize: 10, fontWeight: 'bold' },
  shareFleetBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,184,0,0.1)', borderWidth: 1, borderColor: '#FFB800', justifyContent: 'center', alignItems: 'center' },
  categoriesContainer: { marginBottom: 15 },
  categoryScroll: { paddingHorizontal: 20, gap: 10 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#141829', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#1F263E' },
  chipText: { color: '#626D82', fontSize: 12 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 12 },
  sectionTitle: { color: '#FFB800', fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  sectionCount: { color: '#626D82', fontSize: 12, fontWeight: 'bold' },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FFB800', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  addBtnText: { color: '#000', fontWeight: 'bold', fontSize: 11 },
  listContent: { paddingHorizontal: 20, paddingBottom: 40, gap: 12 },
  card: { backgroundColor: '#141829', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#1F263E', borderLeftWidth: 4 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardTagBadge: { backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  cardTagText: { fontSize: 10, fontWeight: 'bold' },
  cardTitle: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  cardDesc: { color: '#8E9BB0', fontSize: 13, lineHeight: 18, marginBottom: 10 },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  linkText: { color: '#00F0FF', fontSize: 12, fontWeight: '600' },
  emptyState: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 20 },
  emptyTitle: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginTop: 12 },
  emptySubtitle: { color: '#626D82', fontSize: 12, textAlign: 'center', marginTop: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#141829', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, borderTopWidth: 1, borderTopColor: 'rgba(255,184,0,0.3)' },
  modalHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#1F263E', alignSelf: 'center', marginBottom: 16 },
  modalTitle: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginBottom: 16 },
  input: { backgroundColor: '#0B0D17', borderRadius: 10, borderWidth: 1, borderColor: '#1F263E', padding: 12, color: '#FFF', fontSize: 13, marginBottom: 10 },
  modalActionRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  cancelBtn: { flex: 1, backgroundColor: '#0B0D17', padding: 12, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#1F263E' },
  cancelText: { color: '#8E9BB0', fontSize: 13 },
  submitBtn: { flex: 2, backgroundColor: '#FFB800', padding: 12, borderRadius: 10, alignItems: 'center' },
  submitText: { color: '#000', fontWeight: 'bold', fontSize: 13 }
});