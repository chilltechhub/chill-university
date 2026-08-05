import React, { useState } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  StyleSheet, Modal, Button, Linking, Alert
} from 'react-native';

export default function ResourcesToolsScreen() {
  const [myResources, setMyResources] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newLink, setNewLink] = useState('');

  const recommendedTools = [
    { id: '1', title: 'Khan Academy', link: 'https://www.khanacademy.org' },
    { id: '2', title: 'Wolfram Alpha', link: 'https://www.wolframalpha.com' },
    { id: '3', title: 'Code.org', link: 'https://code.org' },
    { id: '4', title: 'Tinkercad', link: 'https://www.tinkercad.com' },
    { id: '5', title: 'Scratch', link: 'https://scratch.mit.edu' },
  ];

  const saveNewResource = () => {
    if (!newTitle.trim() || !newLink.trim()) return;
    const newItem = {
      id: Date.now().toString(),
      title: newTitle,
      link: newLink,
    };
    setMyResources([...myResources, newItem]);
    setNewTitle('');
    setNewLink('');
    setModalVisible(false);
  };

  const saveRecommended = (item) => {
    const alreadySaved = myResources.some(r => r.link === item.link);
    if (alreadySaved) {
      Alert.alert('Already Saved', 'You’ve already added this to your resources.');
      return;
    }
    setMyResources([...myResources, item]);
  };

  const openLink = (url) => {
    Linking.openURL(url).catch(() => Alert.alert('Error', 'Could not open the link.'));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🧰 My Resources</Text>

      <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
        <Text style={styles.addBtnText}>+ Add Resource</Text>
      </TouchableOpacity>

      <FlatList
        data={myResources}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.resourceCard} onPress={() => openLink(item.link)}>
            <Text style={styles.resourceTitle}>{item.title}</Text>
            <Text style={styles.resourceLink}>{item.link}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No saved resources yet.</Text>}
      />

      <Text style={styles.title}>🔍 Discover</Text>

      <FlatList
        data={recommendedTools}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.recommendCard}>
            <TouchableOpacity onPress={() => openLink(item.link)}>
              <Text style={styles.recommendTitle}>{item.title}</Text>
              <Text style={styles.resourceLink}>{item.link}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.saveBtn}
              onPress={() => saveRecommended(item)}
            >
              <Text style={styles.saveBtnText}>Save</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      {/* Modal for Adding */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Add Resource</Text>
            <TextInput
              style={styles.input}
              placeholder="Resource Title"
              value={newTitle}
              onChangeText={setNewTitle}
            />
            <TextInput
              style={styles.input}
              placeholder="Resource Link"
              value={newLink}
              onChangeText={setNewLink}
            />
            <View style={styles.modalActions}>
              <Button title="Cancel" onPress={() => setModalVisible(false)} />
              <Button title="Add" onPress={saveNewResource} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 20, fontWeight: 'bold', marginTop: 20, marginBottom: 10 },
  addBtn: {
    backgroundColor: '#4285F4', padding: 10, borderRadius: 8,
    alignSelf: 'flex-start', marginBottom: 10,
  },
  addBtnText: { color: '#fff', fontWeight: 'bold' },
  resourceCard: {
    backgroundColor: '#f1f1f1', padding: 12, borderRadius: 10, marginBottom: 10,
  },
  resourceTitle: { fontSize: 16, fontWeight: '600' },
  resourceLink: { fontSize: 14, color: '#1a73e8', marginTop: 2 },
  emptyText: { textAlign: 'center', color: '#888', fontStyle: 'italic', marginTop: 20 },
  recommendCard: {
    backgroundColor: '#e8f0fe', padding: 12, borderRadius: 10,
    marginBottom: 10,
  },
  recommendTitle: { fontSize: 16, fontWeight: '600' },
  saveBtn: {
    marginTop: 8, alignSelf: 'flex-start',
    backgroundColor: '#34a853', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6,
  },
  saveBtnText: { color: '#fff', fontWeight: 'bold' },
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

