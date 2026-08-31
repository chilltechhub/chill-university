// src/screens/projects/ProjectsHomeScreen.js
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  FlatList, Image, ImageBackground, Dimensions
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const CATEGORIES = [
  { id: 'active', label: 'Active Missions', icon: 'rocket-outline', color: '#00F0FF' },
  { id: 'completed', label: 'Completed', icon: 'checkmark-circle-outline', color: '#00E676' },
  { id: 'ideas', label: 'Stargazer Ideas', icon: 'bulb-outline', color: '#FFB800' },
  { id: 'collaborations', label: 'Squad Fleet', icon: 'people-outline', color: '#7C4DFF' },
  { id: 'showcase', label: 'Hall of Fame', icon: 'trophy-outline', color: '#FF4081' },
];

const MOCK_PROJECTS = [
  {
    id: 'proj-1',
    title: 'Mars Rover Kinematics',
    category: 'Robotics & Code',
    lastModified: '2 mins ago',
    progress: 78,
    isFavorite: true,
    cover: 'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?q=80&w=1000',
    status: 'active',
  },
  {
    id: 'proj-2',
    title: 'Exoplanet Atmospheric Model',
    category: 'Data Science',
    lastModified: '1 day ago',
    progress: 42,
    isFavorite: false,
    cover: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1000',
    status: 'active',
  },
];

export default function ProjectsHomeScreen({ navigation }) {
  const [activeCategory, setActiveCategory] = useState('active');

  const activeProject = MOCK_PROJECTS[0]; // Hero "Continue Working" card

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSubtitle}>MISSION CONTROL</Text>
          <Text style={styles.headerTitle}>Projects Command</Text>
        </View>
        <TouchableOpacity style={styles.newMissionBtn}>
          <Ionicons name="add-circle" size={20} color="#000" />
          <Text style={styles.newMissionText}>Launch Project</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Continue Working / Active Mission Hero */}
        {activeProject && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⚡ CONTINUE MISSION</Text>
            <TouchableOpacity 
              style={styles.heroCard}
              onPress={() => navigation.navigate('ProjectDetail', { project: activeProject })}
            >
              <ImageBackground source={{ uri: activeProject.cover }} style={styles.heroImage} imageStyle={{ borderRadius: 16 }}>
                <View style={styles.heroOverlay}>
                  <View style={styles.heroHeader}>
                    <View style={styles.tagBadge}>
                      <Text style={styles.tagText}>{activeProject.category}</Text>
                    </View>
                    <Ionicons name="star" size={20} color="#FFB800" />
                  </View>
                  
                  <View>
                    <Text style={styles.heroTitle}>{activeProject.title}</Text>
                    <Text style={styles.heroMeta}>Active • Updated {activeProject.lastModified}</Text>
                    
                    <View style={styles.progressContainer}>
                      <View style={styles.progressBarBg}>
                        <View style={[styles.progressBarFill, { width: `${activeProject.progress}%` }]} />
                      </View>
                      <Text style={styles.progressText}>{activeProject.progress}% Ready</Text>
                    </View>
                  </View>
                </View>
              </ImageBackground>
            </TouchableOpacity>
          </View>
        )}

        {/* Categories Bar */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesBar}>
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.categoryChip, isActive && { borderColor: cat.color, backgroundColor: 'rgba(20,24,41,0.9)' }]}
                onPress={() => setActiveCategory(cat.id)}
              >
                <Ionicons name={cat.icon} size={16} color={isActive ? cat.color : '#8E9BB0'} />
                <Text style={[styles.categoryText, isActive && { color: '#FFF', fontWeight: '700' }]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Mission Cards Grid / List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🛰️ ACTIVE FLEET ({MOCK_PROJECTS.length})</Text>
          {MOCK_PROJECTS.map((project) => (
            <View key={project.id} style={styles.card}>
              <Image source={{ uri: project.cover }} style={styles.cardThumbnail} />
              <View style={styles.cardContent}>
                <View style={styles.cardTagRow}>
                  <Text style={styles.cardTag}>{project.category}</Text>
                  <Text style={styles.cardDate}>{project.lastModified}</Text>
                </View>
                <Text style={styles.cardTitle}>{project.title}</Text>
                
                {/* Actions Bar */}
                <View style={styles.cardActions}>
                  <TouchableOpacity 
                    style={styles.continueBtn}
                    onPress={() => navigation.navigate('ProjectDetail', { project })}
                  >
                    <Ionicons name="play-symbol" size={12} color="#00F0FF" />
                    <Text style={styles.continueText}>Enter Command</Text>
                  </TouchableOpacity>

                  <View style={styles.quickIcons}>
                    <TouchableOpacity style={styles.iconBtn}>
                      <Ionicons name={project.isFavorite ? "star" : "star-outline"} size={18} color="#FFB800" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconBtn}>
                      <Ionicons name="share-social-outline" size={18} color="#8E9BB0" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0D17', paddingTop: 50 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 20 },
  headerSubtitle: { color: '#00F0FF', fontSize: 10, letterSpacing: 2, fontWeight: '800' },
  headerTitle: { color: '#FFF', fontSize: 24, fontWeight: 'bold' },
  newMissionBtn: { backgroundColor: '#00F0FF', flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, gap: 6 },
  newMissionText: { color: '#000', fontWeight: 'bold', fontSize: 13 },
  section: { paddingHorizontal: 20, marginBottom: 25 },
  sectionTitle: { color: '#8E9BB0', fontSize: 12, fontWeight: '700', letterSpacing: 1.5, marginBottom: 12 },
  heroCard: { height: 200, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(0,240,255,0.3)' },
  heroImage: { width: '100%', height: '100%' },
  heroOverlay: { flex: 1, backgroundColor: 'rgba(11,13,23,0.75)', padding: 16, justifyContent: 'space-between' },
  heroHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tagBadge: { backgroundColor: 'rgba(0, 240, 255, 0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: '#00F0FF' },
  tagText: { color: '#00F0FF', fontSize: 11, fontWeight: '600' },
  heroTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold', marginBottom: 4 },
  heroMeta: { color: '#A0AABF', fontSize: 12, marginBottom: 10 },
  progressContainer: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  progressBarBg: { flex: 1, height: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#00F0FF' },
  progressText: { color: '#00F0FF', fontSize: 11, fontWeight: 'bold' },
  categoriesBar: { paddingLeft: 20, marginBottom: 20, flexDirection: 'row' },
  categoryChip: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#141829', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, marginRight: 10, borderWidth: 1, borderColor: '#1F263E' },
  categoryText: { color: '#8E9BB0', fontSize: 13 },
  card: { backgroundColor: '#141829', borderRadius: 16, borderWidth: 1, borderColor: '#1F263E', marginBottom: 15, flexDirection: 'row', overflow: 'hidden' },
  cardThumbnail: { width: 100, height: '100%' },
  cardContent: { flex: 1, padding: 12 },
  cardTagRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  cardTag: { color: '#7C4DFF', fontSize: 10, fontWeight: '700' },
  cardDate: { color: '#626D82', fontSize: 10 },
  cardTitle: { color: '#FFF', fontSize: 15, fontWeight: 'bold', marginBottom: 12 },
  cardActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  continueBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(0,240,255,0.1)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  continueText: { color: '#00F0FF', fontSize: 11, fontWeight: '600' },
  quickIcons: { flexDirection: 'row', gap: 8 },
  iconBtn: { padding: 4 }
});