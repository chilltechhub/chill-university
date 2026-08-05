// src/screens/library/resourcetools.js
import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, FlatList, Linking, Alert, Modal,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../context/ThemeContext';

const CURATED = [
  { id:'1',  emoji:'📚', title:'Khan Academy',     link:'https://www.khanacademy.org',       desc:'Free courses on every subject' },
  { id:'2',  emoji:'🔢', title:'Wolfram Alpha',    link:'https://www.wolframalpha.com',       desc:'Computational knowledge engine' },
  { id:'3',  emoji:'💻', title:'Code.org',         link:'https://code.org',                   desc:'Learn to code for free' },
  { id:'4',  emoji:'🎓', title:'Coursera',         link:'https://www.coursera.org',           desc:'University courses online' },
  { id:'5',  emoji:'🌍', title:'Wikipedia',        link:'https://www.wikipedia.org',          desc:'The free encyclopedia' },
  { id:'6',  emoji:'🔬', title:'PubMed',           link:'https://pubmed.ncbi.nlm.nih.gov',    desc:'Medical and science research' },
  { id:'7',  emoji:'📝', title:'Notion',           link:'https://www.notion.so',              desc:'Notes and project management' },
  { id:'8',  emoji:'🎨', title:'Figma',            link:'https://www.figma.com',              desc:'Design and prototyping' },
  { id:'9',  emoji:'📊', title:'Google Sheets',    link:'https://sheets.google.com',          desc:'Free spreadsheets' },
  { id:'10', emoji:'🤖', title:'Claude AI',        link:'https://claude.ai',                  desc:'AI assistant for learning' },
  { id:'11', emoji:'🎬', title:'YouTube Learn',    link:'https://www.youtube.com/learning',   desc:'Video tutorials on anything' },
  { id:'12', emoji:'🌐', title:'Archive.org',      link:'https://archive.org',                desc:'Free books and media' },
];

export default function ResourcesToolsScreen() {
  const { colors: c, typography: t, spacing: s, radius: r } = useTheme();
  const [saved,    setSaved]    = useState([]);
  const [showAdd,  setShowAdd]  = useState(false);
  const [title,    setTitle]    = useState('');
  const [link,     setLink]     = useState('');
  const [search,   setSearch]   = useState('');

  const saveCustom = () => {
    if (!title.trim() || !link.trim()) return;
    setSaved(prev => [...prev, { id: Date.now().toString(), emoji:'🔗', title: title.trim(), link: link.trim(), desc:'Custom resource' }]);
    setTitle(''); setLink(''); setShowAdd(false);
  };

  const saveFromCurated = (item) => {
    if (saved.some(s => s.link === item.link)) {
      Alert.alert('Already saved', 'This resource is already in your list.');
      return;
    }
    setSaved(prev => [...prev, item]);
  };

  const remove = (id) => setSaved(prev => prev.filter(s => s.id !== id));

  const filteredCurated = CURATED.filter(item => !search || item.title.toLowerCase().includes(search.toLowerCase()) || item.desc.toLowerCase().includes(search.toLowerCase()));

  return (
    <View style={{ flex:1, backgroundColor:c.bg0 }}>
      <View style={{ backgroundColor:c.headerBg, padding:s.lg, borderBottomWidth:0.5, borderBottomColor:c.border, flexDirection:'row', justifyContent:'space-between', alignItems:'center' }}>
        <View>
          <Text style={{ fontSize:t.xxl, fontWeight:t.bold, color:c.text1 }}>🔗 Resources</Text>
          <Text style={{ fontSize:t.xs, color:c.text3, marginTop:3 }}>Tools and links you rely on</Text>
        </View>
        <TouchableOpacity style={{ backgroundColor:c.teal, borderRadius:r.lg, paddingHorizontal:s.lg, paddingVertical:s.sm, flexDirection:'row', alignItems:'center', gap:5 }} onPress={() => setShowAdd(true)}>
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={{ color:'#fff', fontWeight:t.bold, fontSize:t.sm }}>Add</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom:40 }}>
        {/* My saved */}
        {saved.length > 0 && (
          <View style={{ padding:s.lg }}>
            <Text style={{ fontSize:t.xs, fontWeight:t.semibold, color:c.gold, textTransform:'uppercase', letterSpacing:1.2, marginBottom:s.md }}>My Resources</Text>
            {saved.map(item => (
              <View key={item.id} style={{ flexDirection:'row', alignItems:'center', gap:s.md, backgroundColor:c.bg1, borderRadius:r.md, padding:s.md, marginBottom:s.sm, borderWidth:0.5, borderColor:c.border }}>
                <Text style={{ fontSize:20 }}>{item.emoji}</Text>
                <View style={{ flex:1 }}>
                  <Text style={{ fontSize:t.sm, fontWeight:t.semibold, color:c.text1 }}>{item.title}</Text>
                  <Text style={{ fontSize:t.xs, color:c.text3 }}>{item.desc}</Text>
                </View>
                <TouchableOpacity onPress={() => Linking.openURL(item.link)} style={{ backgroundColor:c.tealLight, borderRadius:r.sm, padding:6 }}>
                  <Ionicons name="open-outline" size={15} color={c.teal} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => remove(item.id)} style={{ padding:4 }}>
                  <Ionicons name="close" size={15} color={c.text4} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Search */}
        <View style={{ paddingHorizontal:s.lg, paddingBottom:s.sm }}>
          <View style={{ flexDirection:'row', alignItems:'center', backgroundColor:c.bg1, borderRadius:r.md, paddingHorizontal:s.md, borderWidth:0.5, borderColor:c.border }}>
            <Ionicons name="search" size={16} color={c.text3} />
            <TextInput style={{ flex:1, padding:s.sm, fontSize:t.sm, color:c.text1 }} value={search} onChangeText={setSearch} placeholder="Search resources..." placeholderTextColor={c.text4} />
          </View>
        </View>

        {/* Curated */}
        <View style={{ paddingHorizontal:s.lg }}>
          <Text style={{ fontSize:t.xs, fontWeight:t.semibold, color:c.gold, textTransform:'uppercase', letterSpacing:1.2, marginBottom:s.md }}>Curated Resources</Text>
          {filteredCurated.map(item => (
            <View key={item.id} style={{ flexDirection:'row', alignItems:'center', gap:s.md, backgroundColor:c.bg1, borderRadius:r.md, padding:s.md, marginBottom:s.sm, borderWidth:0.5, borderColor:c.border }}>
              <Text style={{ fontSize:20 }}>{item.emoji}</Text>
              <View style={{ flex:1 }}>
                <Text style={{ fontSize:t.sm, fontWeight:t.semibold, color:c.text1 }}>{item.title}</Text>
                <Text style={{ fontSize:t.xs, color:c.text3 }}>{item.desc}</Text>
              </View>
              <TouchableOpacity onPress={() => Linking.openURL(item.link)} style={{ padding:6 }}>
                <Ionicons name="open-outline" size={16} color={c.teal} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => saveFromCurated(item)} style={{ padding:6 }}>
                <Ionicons name={saved.some(s=>s.link===item.link) ? 'bookmark' : 'bookmark-outline'} size={16} color={c.gold} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>

      <Modal visible={showAdd} transparent animationType="slide" onRequestClose={() => setShowAdd(false)}>
        <KeyboardAvoidingView style={{ flex:1, backgroundColor:'rgba(0,0,0,0.5)', justifyContent:'flex-end' }} behavior={Platform.OS==='ios' ? 'padding' : undefined}>
          <View style={{ backgroundColor:c.bg1, borderTopLeftRadius:r.xl, borderTopRightRadius:r.xl, padding:s.xl, paddingBottom:40 }}>
            <View style={{ width:36, height:4, borderRadius:2, backgroundColor:c.border, alignSelf:'center', marginBottom:s.lg }} />
            <Text style={{ fontSize:t.lg, fontWeight:t.bold, color:c.text1, marginBottom:s.lg }}>Add Resource</Text>
            <TextInput style={{ borderWidth:1, borderColor:c.border, borderRadius:r.md, padding:s.md, fontSize:t.sm, color:c.text1, backgroundColor:c.bg0, marginBottom:s.sm }} value={title} onChangeText={setTitle} placeholder="Name *" placeholderTextColor={c.text4} autoFocus />
            <TextInput style={{ borderWidth:1, borderColor:c.border, borderRadius:r.md, padding:s.md, fontSize:t.sm, color:c.text1, backgroundColor:c.bg0, marginBottom:s.lg }} value={link} onChangeText={setLink} placeholder="URL *" placeholderTextColor={c.text4} autoCapitalize="none" />
            <View style={{ flexDirection:'row', gap:s.sm }}>
              <TouchableOpacity onPress={() => setShowAdd(false)} style={{ flex:1, padding:s.md, alignItems:'center', backgroundColor:c.bg0, borderRadius:r.md, borderWidth:0.5, borderColor:c.border }}>
                <Text style={{ color:c.text3 }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={saveCustom} disabled={!title.trim()||!link.trim()} style={{ flex:2, padding:s.md, alignItems:'center', backgroundColor:c.teal, borderRadius:r.md, opacity:(!title.trim()||!link.trim())?0.5:1 }}>
                <Text style={{ color:'#fff', fontWeight:t.bold }}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
