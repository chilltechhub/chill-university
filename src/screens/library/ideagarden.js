import React, { useState } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  StyleSheet, Modal, Button, Alert
} from 'react-native';

export default function IdeaGardenScreen() {
  const [notes, setNotes] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [editIndex, setEditIndex] = useState(null);

  const saveNote = () => {
    if (!newNote.trim()) return;

    if (editIndex !== null) {
      const updatedNotes = [...notes];
      updatedNotes[editIndex].text = newNote;
      setNotes(updatedNotes);
    } else {
      setNotes([...notes, { id: Date.now().toString(), text: newNote }]);
    }

    setNewNote('');
    setEditIndex(null);
    setModalVisible(false);
  };

  const editNote = (index) => {
    setNewNote(notes[index].text);
    setEditIndex(index);
    setModalVisible(true);
  };

  const deleteNote = (index) => {
    Alert.alert('Delete Note', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        onPress: () => {
          const updated = [...notes];
          updated.splice(index, 1);
          setNotes(updated);
        },
        style: 'destructive'
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🌱 Idea Garden & Notes</Text>

      <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
        <Text style={styles.addBtnText}>+ New Note</Text>
      </TouchableOpacity>

      <FlatList
        data={notes}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            style={styles.noteCard}
            onPress={() => editNote(index)}
            onLongPress={() => deleteNote(index)}
          >
            <Text style={styles.noteText}>{item.text}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No notes yet — plant an idea!</Text>}
      />

      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>{editIndex !== null ? 'Edit Note' : 'New Note'}</Text>
            <TextInput
              style={styles.input}
              multiline
              placeholder="Write your idea or note..."
              value={newNote}
              onChangeText={setNewNote}
            />
            <View style={styles.modalActions}>
              <Button title="Cancel" onPress={() => { setModalVisible(false); setNewNote(''); setEditIndex(null); }} />
              <Button title={editIndex !== null ? 'Update' : 'Add'} onPress={saveNote} />
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
    backgroundColor: '#4285F4', padding: 10, borderRadius: 8,
    alignSelf: 'flex-start', marginBottom: 10,
  },
  addBtnText: { color: '#fff', fontWeight: 'bold' },
  noteCard: {
    borderWidth: 1, borderColor: '#ccc', borderRadius: 10,
    padding: 12, marginBottom: 10, backgroundColor: '#f9f9f9',
  },
  noteText: { fontSize: 16, color: '#333' },
  emptyText: { marginTop: 30, textAlign: 'center', color: '#888', fontStyle: 'italic' },
  modalContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalBox: {
    width: '90%', backgroundColor: 'white', padding: 20, borderRadius: 12,
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  input: {
    borderWidth: 1, borderColor: '#ccc', borderRadius: 8,
    padding: 10, minHeight: 80, textAlignVertical: 'top', marginBottom: 10,
  },
  modalActions: {
    flexDirection: 'row', justifyContent: 'space-between',
  },
});
