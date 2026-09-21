// src/components/FillWithAIButton.js
// The "✨ AI" pill on Projects, Ideas, the Vault, the Planner, Life Areas and
// the Portfolio. Opens Fill with AI (src/screens/AIBridgeScreen.js) with that
// place already picked. All six screens live in the Library stack, so the
// route resolves by name.
import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';

export default function FillWithAIButton({ target, color, style }) {
  const navigation = useNavigation();
  const { colors: c } = useTheme();
  const tint = color || c.teal;
  return (
    <TouchableOpacity
      onPress={() => navigation.navigate('AIBridgeScreen', { target })}
      accessibilityRole="button"
      accessibilityLabel="Fill with AI"
      hitSlop={6}
      style={[{
        flexDirection: 'row', alignItems: 'center', gap: 4,
        borderRadius: 999, borderWidth: 1, borderColor: `${tint}66`,
        paddingHorizontal: 10, paddingVertical: 5,
      }, style]}
    >
      <Ionicons name="sparkles" size={13} color={tint} />
      <Text style={{ fontSize: 12, fontWeight: '700', color: tint }}>AI</Text>
    </TouchableOpacity>
  );
}
