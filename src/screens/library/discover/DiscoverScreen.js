// src/screens/library/discover/DiscoverScreen.js
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../../../context/ThemeContext';

const SECTIONS = [
  { screen:'BreakthroughsScreen',  emoji:'💡', title:'Breakthroughs',      desc:'Latest discoveries from the community' },
  { screen:'FellowScholarsScreen', emoji:'🎓', title:'Fellow Scholars',    desc:'Connect with people on similar journeys' },
  { screen:'TopTalentScreen',      emoji:'⭐', title:'Top Talent',         desc:'Exceptional work from the community' },
  { screen:'MentorsScreen',        emoji:'🧙', title:'Mentors & Experts',  desc:'Learn from experienced people' },
  { screen:'DiscoverPScreen',      emoji:'🚀', title:'Community Projects', desc:'Collaborate on open ideas and projects' },
];

export default function DiscoverScreen() {
  const navigation = useNavigation();
  const { colors: c, typography: t, spacing: s, radius: r } = useTheme();
  return (
    <View style={{ flex:1, backgroundColor:c.bg0 }}>
      <View style={{ backgroundColor:c.headerBg, padding:s.lg, borderBottomWidth:0.5, borderBottomColor:c.border }}>
        <Text style={{ fontSize:t.xxl, fontWeight:t.bold, color:c.text1 }}>🧭 Discover</Text>
        <Text style={{ fontSize:t.xs, color:c.text3, marginTop:3 }}>Explore the community</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding:s.lg, gap:s.sm, paddingBottom:40 }}>
        <View style={{ backgroundColor:c.tealLight, borderRadius:r.lg, padding:s.lg, borderWidth:1, borderColor:c.teal, marginBottom:s.sm }}>
          <Text style={{ fontSize:t.sm, fontWeight:t.bold, color:c.teal, marginBottom:s.sm }}>
            🌱 Community features launching soon
          </Text>
          <Text style={{ fontSize:t.xs, color:c.teal, lineHeight:18 }}>
            Discover is where you will share breakthroughs, find collaborators, and connect with other learners. It gets better as the community grows.
          </Text>
        </View>
        {SECTIONS.map((sec, i) => (
          <TouchableOpacity key={i}
            style={{ backgroundColor:c.bg1, borderRadius:r.lg, padding:s.lg, borderWidth:0.5, borderColor:c.border, flexDirection:'row', alignItems:'center', gap:s.md }}
            onPress={() => navigation.navigate(sec.screen)}>
            <View style={{ width:44, height:44, borderRadius:22, backgroundColor:c.bg2, alignItems:'center', justifyContent:'center' }}>
              <Text style={{ fontSize:22 }}>{sec.emoji}</Text>
            </View>
            <View style={{ flex:1 }}>
              <Text style={{ fontSize:t.sm, fontWeight:t.bold, color:c.text1 }}>{sec.title}</Text>
              <Text style={{ fontSize:t.xs, color:c.text3, marginTop:2 }}>{sec.desc}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={c.text4} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}
