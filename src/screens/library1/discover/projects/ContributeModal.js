// src/features/discover/ContributeModal.js
import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';

export default function ContributeModal({ visible, onClose, project }) {
  const [message, setMessage] = useState('');
  const [selectedNeedId, setSelectedNeedId] = useState(project?.needs?.[0]?.id ?? null);

  if (!project) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Contribute to {project.title}</Text>
          <Text style={styles.label}>Pick a role</Text>
          <View style={styles.pillRow}>
            {project.needs.map((n) => (
              <TouchableOpacity
                key={n.id}
                onPress={() => setSelectedNeedId(n.id)}
                style={[styles.pill, selectedNeedId === n.id && styles.pillActive]}
              >
                <Text style={[styles.pillText, selectedNeedId === n.id && styles.pillTextActive]}>{n.role}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.label, { marginTop: 12 }]}>Message (why you’re a fit)</Text>
          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder="Short intro, availability, portfolio link..."
            multiline
            style={styles.input}
          />

          <View style={styles.row}>
            <TouchableOpacity onPress={onClose} style={[styles.btn, styles.btnGhost]}>
              <Text style={[styles.btnText, styles.btnTextGhost]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                // TODO: send to backend
                onClose({ needId: selectedNeedId, message });
              }}
              style={[styles.btn, styles.btnPrimary]}
            >
              <Text style={styles.btnText}>Send</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', padding: 16, borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  title: { fontSize: 16, fontWeight: '800' },
  label: { marginTop: 8, fontWeight: '700' },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  pill: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 999, backgroundColor: '#f1f1f1' },
  pillActive: { backgroundColor: '#2f6fde' },
  pillText: { color: '#333' },
  pillTextActive: { color: '#fff', fontWeight: '700' },
  input: { minHeight: 90, padding: 10, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, marginTop: 6, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: 10, marginTop: 12 },
  btn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  btnPrimary: { backgroundColor: '#2f6fde' },
  btnGhost: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd' },
  btnText: { color: '#fff', fontWeight: '700' },
  btnTextGhost: { color: '#333' },
});