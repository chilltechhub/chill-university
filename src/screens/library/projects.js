import React, { useState } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  StyleSheet, Modal, Button
} from 'react-native';

export default function ProjectsScreen() {
  const [projects, setProjects] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [goal, setGoal] = useState('');
  const [status, setStatus] = useState('');

  const addProject = () => {
    if (!title.trim()) return;
    const newProject = {
      id: Date.now().toString(),
      title,
      goal,
      status,
    };
    setProjects([...projects, newProject]);
    setTitle('');
    setGoal('');
    setStatus('');
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🛠 My Projects</Text>

      <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
        <Text style={styles.addBtnText}>+ Add Project</Text>
      </TouchableOpacity>

      <FlatList
        data={projects}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            {item.goal ? <Text style={styles.cardText}>🎯 Goal: {item.goal}</Text> : null}
            {item.status ? <Text style={styles.cardStatus}>📌 Status: {item.status}</Text> : null}
          </View>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No active projects yet.</Text>}
      />

      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Add New Project</Text>
            <TextInput
              style={styles.input}
              placeholder="Project Title"
              value={title}
              onChangeText={setTitle}
            />
            <TextInput
              style={styles.input}
              placeholder="Project Goal (optional)"
              value={goal}
              onChangeText={setGoal}
            />
            <TextInput
              style={styles.input}
              placeholder="Current Status (optional)"
              value={status}
              onChangeText={setStatus}
            />
            <View style={styles.modalActions}>
              <Button title="Cancel" onPress={() => setModalVisible(false)} />
              <Button title="Add" onPress={addProject} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// 💅 Styles
const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 15 },
  addBtn: {
    backgroundColor: '#4285F4', padding: 10, borderRadius: 8, alignSelf: 'flex-start',
    marginBottom: 10,
  },
  addBtnText: { color: '#fff', fontWeight: 'bold' },
  card: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 10,
    padding: 15, marginBottom: 12, backgroundColor: '#fafafa',
  },
  cardTitle: { fontSize: 18, fontWeight: '600' },
  cardText: { marginTop: 5, color: '#444' },
  cardStatus: { marginTop: 5, fontStyle: 'italic', color: '#777' },
  emptyText: { marginTop: 20, fontStyle: 'italic', textAlign: 'center', color: '#999' },
  modalContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalBox: {
    width: '90%', backgroundColor: 'white', padding: 20, borderRadius: 12,
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  input: {
    borderWidth: 1, borderColor: '#ccc', borderRadius: 8,
    padding: 10, marginBottom: 10,
  },
  modalActions: {
    flexDirection: 'row', justifyContent: 'space-between',
  },
});
