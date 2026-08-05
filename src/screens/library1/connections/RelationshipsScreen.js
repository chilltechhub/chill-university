/**
 * RelationshipsScreen
 * ---------------------------------------
 * - Relationship categories (tabs)
 * - Search actions
 * - Add custom actions
 * - Log → popup reflection note
 * - Weekly expandable calendar
 * - Notes saved + viewable
 * - Delete entries
 * ---------------------------------------
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TextInput,
  Modal
} from 'react-native';


// ---------------------------------------
// Default Categories
// ---------------------------------------
const DEFAULT_RELATIONSHIP = [
  {
    id: 'family',
    title: 'Family',
    emoji: '👨‍👩‍👧‍👦',
    color: '#FDE68A',
    items: [
      { id: 'f1', text: 'Called Family' },
      { id: 'f2', text: 'Spent Time Together' },
      { id: 'f3', text: 'Supported Family Member' }
    ]
  },
  {
    id: 'friends',
    title: 'Friendships',
    emoji: '🫶',
    color: '#BBF7D0',
    items: [
      { id: 'fr1', text: 'Checked in on Friend' },
      { id: 'fr2', text: 'Hung Out / Talked' },
      { id: 'fr3', text: 'Offered Help or Kindness' }
    ]
  },
  {
    id: 'romantic',
    title: 'Romantic / Partner',
    emoji: '❤️',
    color: '#FCA5A5',
    items: [
      { id: 'r1', text: 'Quality Time' },
      { id: 'r2', text: 'Communicated Openly' },
      { id: 'r3', text: 'Did Something Thoughtful' }
    ]
  },
  {
    id: 'community',
    title: 'Community & Social',
    emoji: '🌍',
    color: '#C7D2FE',
    items: [
      { id: 'c1', text: 'Participated in Community' },
      { id: 'c2', text: 'Helped Someone' },
      { id: 'c3', text: 'Met Someone New' }
    ]
  }
];


// ---------------------------------------
// Helper → Week Calendar
// ---------------------------------------
const getWeekDays = () => {
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - today.getDay());

  return [...Array(7)].map((_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);

    return {
      label: d.toLocaleDateString('en-US', { weekday: 'short' }),
      full: d.toISOString().split('T')[0]
    };
  });
};


const RelationshipsScreen = ({ userId = null, supabaseClient = null }) => {

  const [categories, setCategories] = useState(DEFAULT_RELATIONSHIP);
  const [selectedCategory, setSelectedCategory] = useState(DEFAULT_RELATIONSHIP[0]);

  const [search, setSearch] = useState('');
  const [newAction, setNewAction] = useState('');

  const [log, setLog] = useState([]);
  const [week, setWeek] = useState(getWeekDays());
  const [selectedDay, setSelectedDay] = useState(
    getWeekDays()[new Date().getDay()].full
  );

  const dayEntries = log.filter(
    e => e.performed_at?.split('T')[0] === selectedDay
  );

  // Notes modal
  const [noteModal, setNoteModal] = useState(false);
  const [currentEntry, setCurrentEntry] = useState(null);
  const [note, setNote] = useState('');


  // ---------------------------------------
  // Load Custom + History
  // ---------------------------------------
  useEffect(() => {
    loadCustom();
    loadHistory();
  }, []);

  const loadCustom = async () => {
    if (!supabaseClient || !userId) return;

    const { data } = await supabaseClient
      .from('custom_relationships')
      .select('*')
      .eq('user_id', userId);

    if (!data || data.length === 0) return;

    setCategories(prev => {
      const updated = [...prev];
      let custom = updated.find(x => x.id === 'custom');

      if (!custom) {
        custom = {
          id: 'custom',
          title: 'Your Relationship Actions',
          emoji: '✨',
          color: '#E9D5FF',
          items: []
        };
        updated.push(custom);
      }

      custom.items = data.map(d => ({
        id: d.id,
        text: d.action
      }));

      return updated;
    });
  };


  const loadHistory = async () => {
    if (!supabaseClient || !userId) return;

    const { data } = await supabaseClient
      .from('relationships_history')
      .select('*')
      .eq('user_id', userId);

    if (data) setLog(data);
  };


  // ---------------------------------------
  // Log Relationship Action
  // ---------------------------------------
  const handleLog = async (item) => {
    const entry = {
      id: Date.now(),
      user_id: userId,
      action: item.text,
      category: selectedCategory.id,
      created_at: new Date().toISOString(),
      performed_at: new Date().toISOString(),
      note: ''
    };

    setLog(prev => [entry, ...prev]);
    openNote(entry);

    if (supabaseClient && userId) {
      await supabaseClient.from('relationships_history').insert({
        user_id: userId,
        action: item.text,
        category: selectedCategory.id,
        created_at: entry.created_at,
        performed_at: entry.performed_at,
        note: ''
      });
    }
  };


  // ---------------------------------------
  // Notes
  // ---------------------------------------
  const openNote = (entry) => {
    setCurrentEntry(entry);
    setNote(entry.note || '');
    setNoteModal(true);
  };

  const saveNote = async () => {
    const updated = log.map(l =>
      l.id === currentEntry.id ? { ...l, note } : l
    );

    setLog(updated);
    setNoteModal(false);

    if (supabaseClient && userId) {
      await supabaseClient
        .from('relationships_history')
        .update({ note })
        .eq('created_at', currentEntry.created_at)
        .eq('user_id', userId);
    }
  };


  // ---------------------------------------
  // Delete
  // ---------------------------------------
  const deleteEntry = async (entry) => {
    setLog(prev => prev.filter(e => e.id !== entry.id));

    if (supabaseClient && userId) {
      await supabaseClient
        .from('relationships_history')
        .delete()
        .eq('created_at', entry.created_at)
        .eq('user_id', userId);
    }
  };


  // ---------------------------------------
  // Add Custom
  // ---------------------------------------
  const addAction = async () => {
    if (!newAction.trim()) return;

    const obj = {
      id: Date.now().toString(),
      text: newAction
    };

    setCategories(prev => {
      const copy = [...prev];
      let custom = copy.find(c => c.id === 'custom');

      if (!custom) {
        custom = {
          id: 'custom',
          title: 'Your Relationship Actions',
          emoji: '✨',
          color: '#E9D5FF',
          items: []
        };
        copy.push(custom);
      }

      custom.items.push(obj);
      return copy;
    });

    if (supabaseClient && userId) {
      await supabaseClient.from('custom_relationships').insert({
        user_id: userId,
        action: newAction,
        created_at: new Date().toISOString()
      });
    }

    setNewAction('');
  };


  const filtered = selectedCategory.items.filter(item =>
    item.text.toLowerCase().includes(search.toLowerCase())
  );


  // ---------------------------------------
  // UI
  // ---------------------------------------
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>

        <View style={styles.header}>
          <Text style={styles.emoji}>{selectedCategory.emoji}</Text>
          <Text style={styles.title}>{selectedCategory.title}</Text>
          <Text style={styles.sub}>Strengthen your connections 🤝</Text>
        </View>

        {/* Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabs}>
          {categories.map(cat => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.tab, selectedCategory.id === cat.id && styles.tabActive]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text style={styles.tabText}>{cat.emoji} {cat.title}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Search */}
        <TextInput
          placeholder="Search relationship actions..."
          value={search}
          onChangeText={setSearch}
          style={styles.search}
        />

        {/* Cards */}
        <View style={styles.itemsBox}>
          {filtered.length === 0 && <Text style={styles.empty}>No matches</Text>}

          {filtered.map(item => (
            <TouchableOpacity
              key={item.id}
              style={[styles.card, { backgroundColor: selectedCategory.color }]}
              onPress={() => handleLog(item)}
            >
              <Text style={styles.cardText}>{item.text}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Add */}
        <View style={styles.addBox}>
          <Text style={styles.addTitle}>Add New Relationship Action</Text>
          <TextInput
            placeholder="ex: Sent an encouraging message"
            value={newAction}
            onChangeText={setNewAction}
            style={styles.addInput}
          />
          <TouchableOpacity style={styles.addBtn} onPress={addAction}>
            <Text style={styles.addBtnText}>Add</Text>
          </TouchableOpacity>
        </View>

        {/* Journal */}
        <View style={styles.journal}>
          <Text style={styles.journalTitle}>Weekly Relationship Journal</Text>

          {/* Week */}
          <View style={styles.weekRow}>
            {week.map(day => (
              <TouchableOpacity
                key={day.full}
                style={[
                  styles.dayBox,
                  selectedDay === day.full && styles.dayActive
                ]}
                onPress={() => setSelectedDay(day.full)}
              >
                <Text style={styles.dayLabel}>{day.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {dayEntries.length === 0 && (
            <Text style={styles.empty}>No relationship actions logged.</Text>
          )}

          {dayEntries.map(entry => (
            <View key={entry.id} style={styles.entryCard}>
              <View style={{ flexDirection:'row', justifyContent:'space-between' }}>
                <Text style={styles.entryFood}>
                  🤝 {entry.action}
                </Text>

                <TouchableOpacity onPress={() => deleteEntry(entry)}>
                  <Text style={{ color:'red' }}>Delete</Text>
                </TouchableOpacity>
              </View>

              {entry.note ? (
                <Text style={styles.entryNote}>{entry.note}</Text>
              ) : null}

              <TouchableOpacity style={styles.noteBtn} onPress={() => openNote(entry)}>
                <Text style={styles.noteBtnText}>
                  {entry.note ? 'Edit Reflection' : 'Add Reflection'}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

      </ScrollView>

      {/* NOTE MODAL */}
      <Modal visible={noteModal} transparent animationType="slide">
        <View style={styles.modalWrap}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Relationship Reflection</Text>

            <TextInput
              placeholder="How did this interaction feel? What did you learn?"
              value={note}
              onChangeText={setNote}
              style={styles.modalInput}
              multiline
            />

            <TouchableOpacity style={styles.modalBtn} onPress={saveNote}>
              <Text style={styles.modalBtnText}>Save</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setNoteModal(false)}>
              <Text style={{ marginTop:8, textAlign:'center' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
};


// ---------------------------------------
// Styles
// ---------------------------------------
const styles = StyleSheet.create({
  container:{ flex:1, backgroundColor:'#C7D2FE' },
  content:{ padding:16 },

  header:{ alignItems:'center' },
  emoji:{ fontSize:40 },
  title:{ fontSize:22, fontWeight:'bold', color:'#111827' },
  sub:{ color:'#374151', marginTop:4, marginBottom:6 },

  tabs:{ marginVertical:10 },
  tab:{ backgroundColor:'#E5E7EB', padding:8, borderRadius:20, marginRight:8 },
  tabActive:{ backgroundColor:'#6366F1' },
  tabText:{ fontWeight:'600' },

  search:{ backgroundColor:'#FFF', padding:10, borderRadius:12, marginBottom:10 },

  itemsBox:{ gap:10 },
  card:{ padding:16, borderRadius:16 },
  cardText:{ fontWeight:'bold' },
  empty:{ textAlign:'center', marginVertical:10, color:'#374151' },

  addBox:{ marginTop:20, backgroundColor:'#FFF', padding:14, borderRadius:16 },
  addTitle:{ fontWeight:'bold', marginBottom:6 },
  addInput:{ backgroundColor:'#F3F4F6', padding:10, borderRadius:10, marginBottom:10 },
  addBtn:{ backgroundColor:'#6366F1', padding:10, borderRadius:10, alignItems:'center' },
  addBtnText:{ color:'#FFF', fontWeight:'bold' },

  journal:{ marginTop:20, backgroundColor:'#FFF', padding:14, borderRadius:16 },
  journalTitle:{ fontWeight:'bold', fontSize:18, marginBottom:10 },

  weekRow:{ flexDirection:'row', justifyContent:'space-between', marginBottom:10 },
  dayBox:{ backgroundColor:'#E5E7EB', padding:8, borderRadius:10 },
  dayActive:{ backgroundColor:'#6366F1' },
  dayLabel:{ fontWeight:'600' },

  entryCard:{ backgroundColor:'#F3F4F6', padding:10, borderRadius:12, marginBottom:10 },
  entryFood:{ fontWeight:'bold', marginBottom:6 },

  entryNote:{
    backgroundColor:'#E5E7EB',
    padding:8,
    borderRadius:8,
    marginBottom:6
  },

  noteBtn:{ backgroundColor:'#6366F1', padding:8, borderRadius:8, alignItems:'center' },
  noteBtnText:{ color:'#FFF' },

  modalWrap:{ flex:1, backgroundColor:'rgba(0,0,0,0.5)', justifyContent:'center', padding:20 },
  modalBox:{ backgroundColor:'#FFF', padding:16, borderRadius:16 },
  modalTitle:{ fontWeight:'bold', fontSize:18, marginBottom:10 },
  modalInput:{ backgroundColor:'#F3F4F6', minHeight:80, borderRadius:10, padding:10 },
  modalBtn:{ backgroundColor:'#6366F1', padding:10, borderRadius:10, marginTop:10 },
  modalBtnText:{ color:'#FFF', textAlign:'center', fontWeight:'bold' }
});

export default RelationshipsScreen;
