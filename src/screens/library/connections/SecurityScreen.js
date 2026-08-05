// src/screens/library/connections/SecurityScreen.js
import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useTheme } from '../../../../context/ThemeContext';

export default function SecurityScreen() {
  const { colors: c, typography: t, spacing: s, radius: r } = useTheme();
  return (
    <View style={{ flex:1, backgroundColor:c.bg0 }}>
      <View style={{ backgroundColor:c.headerBg, padding:s.lg, borderBottomWidth:0.5, borderBottomColor:c.border }}>
        <Text style={{ fontSize:t.xxl, fontWeight:t.bold, color:c.text1 }}>🛡️ Security</Text>
        <Text style={{ fontSize:t.xs, color:c.text3, marginTop:3 }}>Keep your account safe and secure.</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding:s.lg, paddingBottom:40 }}>
        <View style={{ alignItems:'center', paddingTop:60 }}>
          <Text style={{ fontSize:52, marginBottom:s.lg }}>🛡️</Text>
          <Text style={{ fontSize:t.lg, fontWeight:t.bold, color:c.text1, marginBottom:s.sm }}>Coming soon</Text>
          <Text style={{ fontSize:t.sm, color:c.text3, textAlign:'center', lineHeight:20 }}>Keep your account safe and secure.</Text>
        </View>
      </ScrollView>
    </View>
  );
}
