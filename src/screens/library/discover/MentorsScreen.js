// src/screens/library/discover/MentorsScreen.js
import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useTheme } from '../../../../context/ThemeContext';

export default function MentorsScreen() {
  const { colors: c, typography: t, spacing: s } = useTheme();
  return (
    <View style={{ flex:1, backgroundColor:c.bg0 }}>
      <View style={{ backgroundColor:c.headerBg, padding:s.lg, borderBottomWidth:0.5, borderBottomColor:c.border }}>
        <Text style={{ fontSize:t.xxl, fontWeight:t.bold, color:c.text1 }}>Mentors</Text>
        <Text style={{ fontSize:t.xs, color:c.text3, marginTop:3 }}>Coming soon</Text>
      </View>
      <View style={{ flex:1, alignItems:'center', justifyContent:'center', padding:s.xl }}>
        <Text style={{ fontSize:52, marginBottom:s.lg }}>🌱</Text>
        <Text style={{ fontSize:t.lg, fontWeight:t.bold, color:c.text1, marginBottom:s.sm, textAlign:'center' }}>
          Mentors is coming
        </Text>
        <Text style={{ fontSize:t.sm, color:c.text3, textAlign:'center', lineHeight:20 }}>
          This section will be available when the community launches. Check back soon.
        </Text>
      </View>
    </View>
  );
}
