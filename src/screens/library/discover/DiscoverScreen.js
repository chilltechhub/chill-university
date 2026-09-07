// src/screens/library/discover/DiscoverScreen.js
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../../../context/ThemeContext';
import { useUIPrefs } from '../../../../context/UIPrefsContext';

// Three entries, not five. Breakthroughs, Top Talent and Community Projects
// are now tabs inside one Community feed — splitting a small community's
// activity across three screens made every one of them look abandoned.
const SECTIONS = [
  { screen:'CommunityFeedScreen', emoji:'💬', icon:'chatbubbles-outline', title:'Community Feed',   desc:'Breakthroughs, showcased work and open projects' },
  { screen:'FellowScholarsScreen',emoji:'🎓', icon:'school-outline',      title:'Fellow Scholars',  desc:'People learning what you are learning' },
  { screen:'MentorsScreen',       emoji:'🧙', icon:'people-outline',      title:'Mentors & Experts',desc:'Learn from people who have done it' },
];

export default function DiscoverScreen() {
  const navigation = useNavigation();
  const { colors: c, typography: t, spacing: s, radius: r } = useTheme();
  const { showEmojis } = useUIPrefs();
  return (
    <View style={{ flex:1, backgroundColor:c.bg0 }}>
      <View style={{ backgroundColor:c.headerBg, padding:s.lg, borderBottomWidth:0.5, borderBottomColor:c.border }}>
        <Text style={{ fontSize:t.xxl, fontWeight:t.bold, color:c.text1 }}>{showEmojis ? '🧭 ' : ''}Discover</Text>
        <Text style={{ fontSize:t.xs, color:c.text3, marginTop:3 }}>Explore the community</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding:s.lg, gap:s.sm, paddingBottom:40 }}>
        <View style={{ backgroundColor:c.tealLight, borderRadius:r.lg, padding:s.lg, borderWidth:1, borderColor:c.teal, marginBottom:s.sm }}>
          <Text style={{ fontSize:t.sm, fontWeight:t.bold, color:c.teal, marginBottom:s.sm }}>
            {showEmojis ? '🌱 ' : ''}This grows with the people in it
          </Text>
          <Text style={{ fontSize:t.xs, color:c.teal, lineHeight:18 }}>
            Share what you figure out, show your work, and find people working on the same
            things. Everything here is public to other members — student accounts can read
            along but stay private.
          </Text>
        </View>
        {SECTIONS.map((sec, i) => (
          <TouchableOpacity key={i}
            style={{ backgroundColor:c.bg1, borderRadius:r.lg, padding:s.lg, borderWidth:0.5, borderColor:c.border, flexDirection:'row', alignItems:'center', gap:s.md }}
            onPress={() => navigation.navigate(sec.screen)}>
            <View style={{ width:44, height:44, borderRadius:22, backgroundColor:c.bg2, alignItems:'center', justifyContent:'center' }}>
              {showEmojis ? <Text style={{ fontSize:22 }}>{sec.emoji}</Text> : <Ionicons name={sec.icon} size={20} color={c.text2} />}
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
