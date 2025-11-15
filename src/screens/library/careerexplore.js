import React, { useState } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet } from 'react-native';

// Sample career data
const careers = [
  {
    id: '1',
    title: '💻 Software Engineer',
    description: 'Designs and builds software applications.',
    skills: ['Coding', 'Problem-Solving'],
    field: 'Technology',
  },
  {
    id: '2',
    title: '🛠 Mechanical Engineer',
    description: 'Designs machines and mechanical systems.',
    skills: ['Physics', 'CAD', 'Problem-Solving'],
    field: 'Engineering',
  },
  {
    id: '3',
    title: '🧪 Environmental Scientist',
    description: 'Studies ecosystems and environmental health.',
    skills: ['Data Analysis', 'Field Work'],
    field: 'Science',
  },
  {
    id: '4',
    title: '🎨 UX Designer',
    description: 'Designs user interfaces and improves experience.',
    skills: ['Design', 'Research', 'Creativity'],
    field: 'Design',
  },
  {
    id: '5',
    title: '🧮 Data Analyst',
    description: 'Interprets data to help make business decisions.',
    skills: ['Statistics', 'SQL', 'Critical Thinking'],
    field: 'Technology',
  },
];

export default function CareerExplorationScreen() {
  const [searchText, setSearchText] = useState('');
  const [selectedField, setSelectedField] = useState('All');

  const filteredCareers = careers.filter(career => {
    const matchesSearch = career.title.toLowerCase().includes(searchText.toLowerCase());
    const matchesField = selectedField === 'All' || career.field === selectedField;
    return matchesSearch && matchesField;
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔍 Career Exploration</Text>

      {/* Search Input */}
      <TextInput
        style={styles.searchBar}
        placeholder="Search careers..."
        value={searchText}
        onChangeText={setSearchText}
      />

      {/* Filter */}
      <View style={styles.filterRow}>
        {['All', 'Technology', 'Engineering', 'Science', 'Design'].map(field => (
          <TouchableOpacity
            key={field}
            style={[styles.filterBtn, selectedField === field && styles.activeFilter]}
            onPress={() => setSelectedField(field)}
          >
            <Text style={styles.filterText}>{field}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Career List */}
      <FlatList
        data={filteredCareers}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <CareerCard career={item} />}
        contentContainerStyle={{ paddingBottom: 100 }}
      />
    </View>
  );
}

// 🧱 Card Component
const CareerCard = ({ career }) => (
  <View style={styles.card}>
    <Text style={styles.cardTitle}>{career.title}</Text>
    <Text style={styles.cardDesc}>• {career.description}</Text>
    <Text style={styles.cardSkills}>• Skills: {career.skills.join(', ')}</Text>
    <TouchableOpacity>
      <Text style={styles.learnMore}>Learn More</Text>
    </TouchableOpacity>
  </View>
);

// 💅 Styles
const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 15 },
  searchBar: {
    borderWidth: 1, borderColor: '#ccc', borderRadius: 8,
    padding: 10, marginBottom: 10,
  },
  filterRow: {
    flexDirection: 'row', flexWrap: 'wrap',
    marginBottom: 15, gap: 10,
  },
  filterBtn: {
    paddingVertical: 6, paddingHorizontal: 12,
    backgroundColor: '#eee', borderRadius: 20,
  },
  activeFilter: {
    backgroundColor: '#4285F4',
  },
  filterText: {
    color: '#000',
  },
  card: {
    padding: 15, borderWidth: 1, borderColor: '#ddd',
    borderRadius: 10, marginBottom: 12,
    backgroundColor: '#fafafa',
  },
  cardTitle: { fontSize: 18, fontWeight: '600' },
  cardDesc: { marginTop: 5, color: '#444' },
  cardSkills: { marginTop: 4, fontStyle: 'italic', color: '#555' },
  learnMore: {
    marginTop: 8,
    color: '#4285F4',
    fontWeight: '600',
  },
});
