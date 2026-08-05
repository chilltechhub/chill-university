// src/screens/library/portfolio.js
import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, Modal, Linking, Alert,
  KeyboardAvoidingView, Platform, FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../context/ThemeContext';

const SECTIONS = [
  { key:'projects',   label:'Projects',   emoji:'🚀', desc:'Things you have built or worked on' },
  { key:'skills',     label:'Skills',     emoji:'⚡', desc:'What you are good at' },
  { key:'experience', label:'Experience', emoji:'💼', desc:'Jobs, internships, volunteer work' },
  { key:'research',   label:'Research',   emoji:'🔬', desc:'Papers, studies, findings' },
  { key:'hobbies',    label:'Hobbies',    emoji:'🎨', desc:'What you love outside of work' },
];

export default function PortfolioScreen() {
  const { colors: c, typography: t, spacing: s, radius: r } = useTheme();
  const [data, setData]       = useState({ projects:[], skills:[], experience:[], research:[], hobbies:[] });
  const [activeSection, setActive] = useState('projects');
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle]     = useState('');
  const [desc,  setDesc]      = useState('');
  const [link,  setLink]      = useState('');

  const currentSection = SECTIONS.find(s => s.key === activeSection);

  const addItem = () => {
    if (!title.trim()) return;
    const item = { id: Date.now().toString(), title: title.trim(), desc: desc.trim(), link: link.trim() };
    setData(prev => ({ ...prev, [activeSection]: [...prev[activeSection], item] }));
    setTitle(''); setDesc(''); setLink(''); setShowAdd(false);
  };

  const removeItem = (id) => {
    setData(prev => ({ ...prev, [activeSection]: prev[activeSection].filter(i => i.id !== id) }));
  };

  const items = data[activeSection] || [];

  return (
    <View style={{ flex:1, backgroundColor:c.bg0 }}>
      <View style={{ backgroundColor:c.headerBg, padding:s.lg, borderBottomWidth:0.5, borderBottomColor:c.border, flexDirection:'row', justifyContent:'space-between', alignItems:'center' }}>
        <View>
          <Text style={{ fontSize:t.xxl, fontWeight:t.bold, color:c.text1 }}>🗂️ Portfolio</Text>
          <Text style={{ fontSize:t.xs, color:c.text3, marginTop:3 }}>Your work, skills and achievements</Text>
        </View>
        <TouchableOpacity style={{ backgroundColor:c.gold, borderRadius:r.lg, paddingHorizontal:s.lg, paddingVertical:s.sm, flexDirection:'row', alignItems:'center', gap:5 }} onPress={() => setShowAdd(true)}>
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={{ color:'#fff', fontWeight:t.bold, fontSize:t.sm }}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* Section tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal:s.lg, paddingVertical:s.sm, gap:s.sm }}>
        {SECTIONS.map(sec => (
          <TouchableOpacity key={sec.key}
            style={{ flexDirection:'row', alignItems:'center', gap:5, paddingHorizontal:s.md, paddingVertical:7, borderRadius:r.full, borderWidth:1, borderColor: activeSection===sec.key ? c.gold : c.border, backgroundColor: activeSection===sec.key ? c.goldLight : 'transparent' }}
            onPress={() => setActive(sec.key)}>
            <Text style={{ fontSize:14 }}>{sec.emoji}</Text>
            <Text style={{ fontSize:t.xs, fontWeight: activeSection===sec.key ? t.bold : t.regular, color: activeSection===sec.key ? c.gold : c.text3 }}>{sec.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Section desc */}
      <View style={{ paddingHorizontal:s.lg, paddingBottom:s.sm }}>
        <Text style={{ fontSize:t.xs, color:c.text3, fontStyle:'italic' }}>{currentSection?.desc}</Text>
      </View>

      {/* Items */}
      <FlatList
        data={items}
        keyExtractor={i => i.id}
        contentContainerStyle={{ paddingHorizontal:s.lg, gap:s.sm, paddingBottom:40 }}
        ListEmptyComponent={
          <View style={{ alignItems:'center', paddingTop:60 }}>
            <Text style={{ fontSize:44 }}>{currentSection?.emoji}</Text>
            <Text style={{ fontSize:t.lg, fontWeight:t.bold, color:c.text1, marginTop:s.lg, marginBottom:s.sm }}>No {currentSection?.label} yet</Text>
            <Text style={{ fontSize:t.sm, color:c.text3, textAlign:'center' }}>Add your {activeSection} to build your portfolio</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={{ backgroundColor:c.bg1, borderRadius:r.lg, padding:s.lg, borderWidth:0.5, borderColor:c.border, borderLeftWidth:3, borderLeftColor:c.gold }}>
            <View style={{ flexDirection:'row', alignItems:'flex-start', gap:s.sm }}>
              <View style={{ flex:1 }}>
                <Text style={{ fontSize:t.sm, fontWeight:t.bold, color:c.text1, marginBottom:3 }}>{item.title}</Text>
                {item.desc && <Text style={{ fontSize:t.xs, color:c.text3, lineHeight:16 }}>{item.desc}</Text>}
                {item.link && (
                  <TouchableOpacity onPress={() => Linking.openURL(item.link)} style={{ marginTop:4 }}>
                    <Text style={{ fontSize:t.xs, color:c.teal }}>🔗 View</Text>
                  </TouchableOpacity>
                )}
              </View>
              <TouchableOpacity onPress={() => removeItem(item.id)} style={{ padding:4 }}>
                <Ionicons name="trash-outline" size={15} color={c.text4} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      <Modal visible={showAdd} transparent animationType="slide" onRequestClose={() => setShowAdd(false)}>
        <KeyboardAvoidingView style={{ flex:1, backgroundColor:'rgba(0,0,0,0.5)', justifyContent:'flex-end' }} behavior={Platform.OS==='ios' ? 'padding' : undefined}>
          <View style={{ backgroundColor:c.bg1, borderTopLeftRadius:r.xl, borderTopRightRadius:r.xl, padding:s.xl, paddingBottom:40 }}>
            <View style={{ width:36, height:4, borderRadius:2, backgroundColor:c.border, alignSelf:'center', marginBottom:s.lg }} />
            <Text style={{ fontSize:t.lg, fontWeight:t.bold, color:c.text1, marginBottom:s.lg }}>{currentSection?.emoji} Add {currentSection?.label}</Text>
            <TextInput style={{ borderWidth:1, borderColor:c.border, borderRadius:r.md, padding:s.md, fontSize:t.sm, color:c.text1, backgroundColor:c.bg0, marginBottom:s.sm }} value={title} onChangeText={setTitle} placeholder="Title *" placeholderTextColor={c.text4} autoFocus />
            <TextInput style={{ borderWidth:1, borderColor:c.border, borderRadius:r.md, padding:s.md, fontSize:t.sm, color:c.text1, backgroundColor:c.bg0, marginBottom:s.sm, minHeight:60, textAlignVertical:'top' }} value={desc} onChangeText={setDesc} placeholder="Description" placeholderTextColor={c.text4} multiline />
            <TextInput style={{ borderWidth:1, borderColor:c.border, borderRadius:r.md, padding:s.md, fontSize:t.sm, color:c.text1, backgroundColor:c.bg0, marginBottom:s.lg }} value={link} onChangeText={setLink} placeholder="Link (optional)" placeholderTextColor={c.text4} autoCapitalize="none" />
            <View style={{ flexDirection:'row', gap:s.sm }}>
              <TouchableOpacity onPress={() => setShowAdd(false)} style={{ flex:1, padding:s.md, alignItems:'center', backgroundColor:c.bg0, borderRadius:r.md, borderWidth:0.5, borderColor:c.border }}>
                <Text style={{ color:c.text3 }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={addItem} disabled={!title.trim()} style={{ flex:2, padding:s.md, alignItems:'center', backgroundColor:c.gold, borderRadius:r.md, opacity:!title.trim()?0.5:1 }}>
                <Text style={{ color:'#fff', fontWeight:t.bold }}>Add to Portfolio</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
