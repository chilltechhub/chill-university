// src/components/FolderAssignSheet.js
// Bottom-sheet modal for assigning ONE entry to a folder — opened from a
// card's folder icon in Research Vault / Resources. Lets you pick an
// existing folder, clear it, or create-and-assign a new one in one step.

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Modal, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { FOLDER_COLORS } from '../logic/useFolders';

export default function FolderAssignSheet({ visible, folders, currentFolderId, onAssign, onClose, onCreateFolder }) {
  const { colors: c } = useTheme();
  const styles = makeStyles(c);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [color, setColor] = useState(FOLDER_COLORS[0]);

  const startCreate = () => { setCreating(true); setName(''); setColor(FOLDER_COLORS[folders.length % FOLDER_COLORS.length]); };

  const submitCreate = () => {
    if (!name.trim()) return;
    const id = onCreateFolder(name, color);
    if (id) onAssign(id);
    setCreating(false);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>Move to Folder</Text>

          <ScrollView style={{ maxHeight: 280 }} showsVerticalScrollIndicator={false}>
            <TouchableOpacity style={styles.row} onPress={() => onAssign(null)}>
              <Ionicons name="close-circle-outline" size={18} color={c.text3} />
              <Text style={styles.rowText}>No Folder</Text>
              {!currentFolderId && <Ionicons name="checkmark" size={16} color={c.teal} />}
            </TouchableOpacity>
            {folders.map(folder => (
              <TouchableOpacity key={folder.id} style={styles.row} onPress={() => onAssign(folder.id)}>
                <Ionicons name="folder" size={18} color={folder.color} />
                <Text style={styles.rowText}>{folder.name}</Text>
                {currentFolderId === folder.id && <Ionicons name="checkmark" size={16} color={c.teal} />}
              </TouchableOpacity>
            ))}
          </ScrollView>

          {creating ? (
            <View style={styles.createCard}>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="New folder name"
                placeholderTextColor={c.text4}
                autoFocus
              />
              <View style={styles.swatchRow}>
                {FOLDER_COLORS.map(sw => (
                  <TouchableOpacity key={sw} style={[styles.swatch, { backgroundColor: sw }, color === sw && styles.swatchSelected]} onPress={() => setColor(sw)} />
                ))}
              </View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setCreating(false)}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.createBtn, { backgroundColor: color }, !name.trim() && { opacity: 0.5 }]} onPress={submitCreate} disabled={!name.trim()}>
                  <Text style={styles.createBtnText}>Create & Assign</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity style={styles.newFolderRow} onPress={startCreate}>
              <Ionicons name="add-circle-outline" size={18} color={c.teal} />
              <Text style={styles.newFolderText}>New Folder</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>Done</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const makeStyles = (c) => StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: c.bg1, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, borderTopWidth: 2, borderTopColor: c.teal },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: c.border, alignSelf: 'center', marginBottom: 14 },
  title: { color: c.text1, fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: c.border },
  rowText: { flex: 1, color: c.text1, fontSize: 14 },
  newFolderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 14 },
  newFolderText: { color: c.teal, fontSize: 13, fontWeight: 'bold' },
  createCard: { paddingTop: 10 },
  input: { backgroundColor: c.bg2, borderWidth: 1, borderColor: c.border, borderRadius: 8, padding: 10, color: c.text1, fontSize: 13, marginBottom: 10 },
  swatchRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  swatch: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: 'transparent' },
  swatchSelected: { borderColor: c.text1 },
  cancelBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', backgroundColor: c.bg2, borderRadius: 8, borderWidth: 1, borderColor: c.border },
  cancelText: { color: c.text3, fontSize: 12, fontWeight: 'bold' },
  createBtn: { flex: 2, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  createBtnText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  closeBtn: { marginTop: 14, alignItems: 'center', paddingVertical: 10 },
  closeBtnText: { color: c.text3, fontSize: 13, fontWeight: 'bold' },
});
