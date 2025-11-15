import React, { useState } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  StyleSheet, Modal, Button
} from 'react-native';

export default function PortfolioScreen() {
  const [portfolioItems, setPortfolioItems] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newLink, setNewLink] = useState('');

  const addProject = () => {
    if (!newTitle.trim()) return;
    const newItem = {
      id: Date.now().toString(),
      title: newTitle,
      description: newDescription,
      link: newLink,
    };
    setPortfolioItems([...portfolioItems, newItem]);
    setNewTitle('');
    setNewDescription('');
    setNewLink('');
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📁 My Portfolio</Text>

      <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
        <Text style={styles.addBtnText}>+ Add Project</Text>
      </TouchableOpacity>

      <FlatList
        data={portfolioItems}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            {item.description ? <Text style={styles.cardText}>{item.description}</Text> : null}
            {item.link ? (
              <Text style={styles.cardLink}>🔗 {item.link}</Text>
            ) : null}
          </View>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No projects added yet.</Text>}
      />

      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Add New Project</Text>
            <TextInput
              style={styles.input}
              placeholder="Project Title"
              value={newTitle}
              onChangeText={setNewTitle}
            />
            <TextInput
              style={styles.input}
              placeholder="Short Description (optional)"
              value={newDescription}
              onChangeText={setNewDescription}
            />
            <TextInput
              style={styles.input}
              placeholder="Link (optional)"
              value={newLink}
              onChangeText={setNewLink}
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
  cardLink: { marginTop: 5, color: '#1a73e8', fontStyle: 'italic' },
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
