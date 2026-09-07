// src/components/PlacementEditor.js
// MINIMAL VERSION — isolate black screen crash

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, ActivityIndicator } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

export default function PlacementEditor({ visible, userId, components, areaKey, onDone, onCancel }) {
  const { colors: c } = useTheme();
  const [placed, setPlaced] = useState(new Set());

  console.log('PlacementEditor render', { visible, areaKey, componentCount: components?.length });

  return (
    <Modal visible={!!visible} animationType="slide" >
      <View style={{ flex: 1, backgroundColor: c.bg0, padding: 40 }}>
        <Text style={{ fontSize: 20, fontWeight: '700', color: c.text1, marginBottom: 20 }}>
          Placement Editor
        </Text>
        <Text style={{ color: c.text3, marginBottom: 8 }}>Area: {areaKey}</Text>
        <Text style={{ color: c.text3, marginBottom: 20 }}>Components: {components?.length || 0}</Text>

        <TouchableOpacity
          style={{ backgroundColor: c.teal, padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 12 }}
          onPress={onDone}
        >
          <Text style={{ color: '#fff', fontWeight: '700' }}>Go to Agenda</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{ backgroundColor: c.bg1, padding: 16, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: c.border }}
          onPress={onCancel}
        >
          <Text style={{ color: c.text3 }}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}
