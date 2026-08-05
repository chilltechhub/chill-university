// src/screens/library/careerexplore.js
import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, FlatList, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../context/ThemeContext';

const CAREERS = [
  { id:'1',  emoji:'💻', title:'Software Engineer',       field:'Technology',  skills:['Coding','Problem-Solving','Math'],        salary:'$90k-$180k', demand:'Very High' },
  { id:'2',  emoji:'🎨', title:'UX/UI Designer',          field:'Design',      skills:['Design','Research','Creativity'],         salary:'$65k-$130k', demand:'High' },
  { id:'3',  emoji:'📊', title:'Data Analyst',            field:'Technology',  skills:['Statistics','SQL','Critical Thinking'],   salary:'$60k-$120k', demand:'Very High' },
  { id:'4',  emoji:'🏥', title:'Nurse Practitioner',      field:'Healthcare',  skills:['Empathy','Science','Communication'],      salary:'$95k-$150k', demand:'Very High' },
  { id:'5',  emoji:'⚖️', title:'Lawyer',                  field:'Law',         skills:['Research','Writing','Argumentation'],     salary:'$80k-$200k', demand:'Medium' },
  { id:'6',  emoji:'🎓', title:'Teacher/Educator',        field:'Education',   skills:['Communication','Patience','Creativity'],  salary:'$40k-$80k',  demand:'High' },
  { id:'7',  emoji:'🏗️', title:'Civil Engineer',         field:'Engineering', skills:['Math','Physics','Planning'],              salary:'$65k-$130k', demand:'High' },
  { id:'8',  emoji:'💰', title:'Financial Advisor',       field:'Finance',     skills:['Math','Communication','Analysis'],        salary:'$55k-$150k', demand:'Medium' },
  { id:'9',  emoji:'🌍', title:'Environmental Scientist', field:'Science',     skills:['Biology','Data Analysis','Field Work'],   salary:'$50k-$100k', demand:'Medium' },
  { id:'10', emoji:'🎬', title:'Content Creator',         field:'Media',       skills:['Creativity','Communication','Tech'],      salary:'$30k-$500k', demand:'Very High' },
  { id:'11', emoji:'🤖', title:'AI/ML Engineer',          field:'Technology',  skills:['Python','Math','Research'],               salary:'$120k-$250k',demand:'Very High' },
  { id:'12', emoji:'🏥', title:'Physical Therapist',      field:'Healthcare',  skills:['Science','Empathy','Exercise'],           salary:'$65k-$110k', demand:'High' },
];

const FIELDS = ['All', 'Technology', 'Design', 'Healthcare', 'Education', 'Engineering', 'Finance', 'Science', 'Law', 'Media'];
const DEMAND_COLORS = { 'Very High':'#3ac860', 'High':'#2bb5a0', 'Medium':'#c9a84c', 'Low':'#e05858' };

export default function CareerExplorationScreen() {
  const { colors: c, typography: t, spacing: s, radius: r } = useTheme();
  const [search,   setSearch]   = useState('');
  const [field,    setField]    = useState('All');
  const [selected, setSelected] = useState(null);
  const [saved,    setSaved]    = useState([]);

  const filtered = CAREERS.filter(ca => {
    const matchField  = field === 'All' || ca.field === field;
    const matchSearch = !search || ca.title.toLowerCase().includes(search.toLowerCase()) || ca.field.toLowerCase().includes(search.toLowerCase());
    return matchField && matchSearch;
  });

  const toggleSave = (id) => {
    setSaved(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  return (
    <View style={{ flex:1, backgroundColor:c.bg0 }}>
      <View style={{ backgroundColor:c.headerBg, padding:s.lg, borderBottomWidth:0.5, borderBottomColor:c.border }}>
        <Text style={{ fontSize:t.xxl, fontWeight:t.bold, color:c.text1 }}>📈 Career Explorer</Text>
        <Text style={{ fontSize:t.xs, color:c.text3, marginTop:3 }}>Discover careers and what they require</Text>
      </View>

      {/* Search */}
      <View style={{ padding:s.lg, paddingBottom:s.sm }}>
        <View style={{ flexDirection:'row', alignItems:'center', backgroundColor:c.bg1, borderRadius:r.md, paddingHorizontal:s.md, borderWidth:0.5, borderColor:c.border }}>
          <Ionicons name="search" size={16} color={c.text3} />
          <TextInput style={{ flex:1, padding:s.sm, fontSize:t.sm, color:c.text1 }} value={search} onChangeText={setSearch} placeholder="Search careers..." placeholderTextColor={c.text4} />
        </View>
      </View>

      {/* Field filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal:s.lg, paddingBottom:s.sm, gap:s.sm }}>
        {FIELDS.map(f => (
          <TouchableOpacity key={f}
            style={{ paddingHorizontal:s.md, paddingVertical:6, borderRadius:r.full, borderWidth:1, borderColor: field===f ? c.teal : c.border, backgroundColor: field===f ? c.tealLight : 'transparent' }}
            onPress={() => setField(f)}>
            <Text style={{ fontSize:t.xs, fontWeight: field===f ? t.bold : t.regular, color: field===f ? c.teal : c.text3 }}>{f}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Career cards */}
      <FlatList
        data={filtered}
        keyExtractor={ca => ca.id}
        contentContainerStyle={{ padding:s.lg, gap:s.sm, paddingBottom:40 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={{ backgroundColor:c.bg1, borderRadius:r.lg, padding:s.lg, borderWidth:0.5, borderColor: selected?.id===item.id ? c.teal : c.border }}
            onPress={() => setSelected(selected?.id===item.id ? null : item)}
          >
            <View style={{ flexDirection:'row', alignItems:'center', gap:s.md }}>
              <Text style={{ fontSize:28 }}>{item.emoji}</Text>
              <View style={{ flex:1 }}>
                <Text style={{ fontSize:t.sm, fontWeight:t.bold, color:c.text1 }}>{item.title}</Text>
                <Text style={{ fontSize:t.xs, color:c.text3, marginTop:2 }}>{item.field}</Text>
              </View>
              <View style={{ alignItems:'flex-end', gap:4 }}>
                <View style={{ backgroundColor:(DEMAND_COLORS[item.demand]||c.teal)+'22', borderRadius:r.full, paddingHorizontal:7, paddingVertical:2 }}>
                  <Text style={{ fontSize:9, color:DEMAND_COLORS[item.demand]||c.teal, fontWeight:t.bold }}>{item.demand}</Text>
                </View>
                <TouchableOpacity onPress={() => toggleSave(item.id)}>
                  <Ionicons name={saved.includes(item.id) ? 'bookmark' : 'bookmark-outline'} size={18} color={c.gold} />
                </TouchableOpacity>
              </View>
            </View>

            {selected?.id === item.id && (
              <View style={{ marginTop:s.md, paddingTop:s.md, borderTopWidth:0.5, borderTopColor:c.border }}>
                <Text style={{ fontSize:t.xs, color:c.text3, marginBottom:s.sm }}>💰 Salary range: <Text style={{ color:c.teal, fontWeight:t.semibold }}>{item.salary}</Text></Text>
                <Text style={{ fontSize:t.xs, color:c.text3, marginBottom:s.sm }}>🎯 Key skills:</Text>
                <View style={{ flexDirection:'row', flexWrap:'wrap', gap:s.sm }}>
                  {item.skills.map(sk => (
                    <View key={sk} style={{ backgroundColor:c.bg2, borderRadius:r.full, paddingHorizontal:8, paddingVertical:3 }}>
                      <Text style={{ fontSize:10, color:c.text2 }}>{sk}</Text>
                    </View>
                  ))}
                </View>
                <TouchableOpacity
                  style={{ marginTop:s.md, flexDirection:'row', alignItems:'center', gap:5 }}
                  onPress={() => Linking.openURL('https://www.bls.gov/ooh/')}
                >
                  <Ionicons name="open-outline" size={13} color={c.teal} />
                  <Text style={{ fontSize:t.xs, color:c.teal }}>View career outlook data →</Text>
                </TouchableOpacity>
              </View>
            )}
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
