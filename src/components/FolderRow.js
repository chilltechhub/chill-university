// src/components/FolderRow.js
// Horizontal "All" + folder chips — used by Research Vault and Resources
// to filter by folder, and to create/rename/delete folders in place (tap
// to filter, long-press to rename/delete, "New Folder" to create). Folders
// themselves are managed by src/logic/useFolders.js; this component only
// renders and edits them — filtering the actual list is the screen's job.

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { FOLDER_COLORS } from '../logic/useFolders';

export default function FolderRow({ folders, activeFolderId, onSelect, onCreate, onRename, onDelete }) {
  const { colors: c } = useTheme();
  const styles = makeStyles(c);
  const [editing, setEditing] = useState(null); // null | 'new' | the folder being renamed
  const [name, setName] = useState('');
  const [color, setColor] = useState(FOLDER_COLORS[0]);

  const openCreate = () => { setEditing('new'); setName(''); setColor(FOLDER_COLORS[folders.length % FOLDER_COLORS.length]); };
  const openRename = (folder) => { setEditing(folder); setName(folder.name); setColor(folder.color); };
  const close = () => setEditing(null);

  const submit = () => {
    if (!name.trim()) return;
    if (editing === 'new') onCreate(name, color);
    else onRename(editing.id, name, color);
    close();
  };

  const longPress = (folder) => {
    Alert.alert(folder.name, undefined, [
      { text: 'Rename', onPress: () => openRename(folder) },
      { text: 'Delete', style: 'destructive', onPress: () => onDelete(folder.id) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  return (
    <View style={{ marginBottom: 12 }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        <TouchableOpacity style={[styles.chip, !activeFolderId && styles.chipActive]} onPress={() => onSelect(null)}>
          <Ionicons name="albums-outline" size={12} color={!activeFolderId ? c.text1 : c.text3} />
          <Text style={[styles.chipText, !activeFolderId && styles.chipTextActive]}>All</Text>
        </TouchableOpacity>
        {folders.map(folder => {
          const isActive = activeFolderId === folder.id;
          return (
            <TouchableOpacity
              key={folder.id}
              style={[styles.chip, isActive && { borderColor: folder.color, backgroundColor: folder.color + '22' }]}
              onPress={() => onSelect(folder.id)}
              onLongPress={() => longPress(folder)}
            >
              <Ionicons name="folder" size={12} color={folder.color} />
              <Text style={[styles.chipText, isActive && { color: folder.color, fontWeight: 'bold' }]}>{folder.name}</Text>
            </TouchableOpacity>
          );
        })}
        <TouchableOpacity style={styles.newChip} onPress={openCreate}>
          <Ionicons name="add" size={14} color={c.text3} />
          <Text style={styles.newChipText}>New Folder</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Inline create/rename card — a name + color is all folders need,
          so this sits right below the chip row instead of a full modal. */}
      {editing && (
        <View style={styles.editCard}>
          <TextInput
            style={styles.editInput}
            value={name}
            onChangeText={setName}
            placeholder="Folder name"
            placeholderTextColor={c.text4}
            autoFocus
          />
          <View style={styles.swatchRow}>
            {FOLDER_COLORS.map(sw => (
              <TouchableOpacity
                key={sw}
                style={[styles.swatch, { backgroundColor: sw }, color === sw && styles.swatchSelected]}
                onPress={() => setColor(sw)}
              />
            ))}
          </View>
          <View style={styles.editActions}>
            <TouchableOpacity style={styles.editCancelBtn} onPress={close}>
              <Text style={styles.editCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.editSaveBtn, { backgroundColor: color }, !name.trim() && { opacity: 0.5 }]} onPress={submit} disabled={!name.trim()}>
              <Text style={styles.editSaveText}>{editing === 'new' ? 'Create' : 'Save'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const makeStyles = (c) => StyleSheet.create({
  row: { paddingHorizontal: 20, gap: 8, alignItems: 'center' },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: c.bg1, borderWidth: 1, borderColor: c.border },
  chipActive: { borderColor: c.text3, backgroundColor: c.bg2 },
  chipText: { color: c.text3, fontSize: 11, fontWeight: '600' },
  chipTextActive: { color: c.text1, fontWeight: 'bold' },
  newChip: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: c.border, borderStyle: 'dashed' },
  newChipText: { color: c.text3, fontSize: 11, fontWeight: '600' },
  editCard: { marginHorizontal: 20, marginTop: 8, backgroundColor: c.bg1, borderRadius: 12, borderWidth: 1, borderColor: c.border, padding: 12 },
  editInput: { backgroundColor: c.bg2, borderWidth: 1, borderColor: c.border, borderRadius: 8, padding: 10, color: c.text1, fontSize: 13, marginBottom: 10 },
  swatchRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  swatch: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: 'transparent' },
  swatchSelected: { borderColor: c.text1 },
  editActions: { flexDirection: 'row', gap: 8 },
  editCancelBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', backgroundColor: c.bg2, borderRadius: 8, borderWidth: 1, borderColor: c.border },
  editCancelText: { color: c.text3, fontSize: 12, fontWeight: 'bold' },
  editSaveBtn: { flex: 2, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  editSaveText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
});
