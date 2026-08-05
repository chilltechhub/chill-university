/**
 * ExerciseScreen
 * ---------------------------------------
 * - Exercise categories (tabs)
 * - Search exercises
 * - Add your own exercises
 * - Complete + log exercises
 * - Weekly expandable journal calendar
 * - Notes per completed exercise
 * - POPUP NOTE ENTRY when logging
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
// Default Exercise Categories
// ---------------------------------------
const DEFAULT_EXERCISES = [
  {
    id: 'quick',
    title: 'Quick Energizers',
    emoji: '⚡',
    color: '#FDE68A',
    items: [
      { id: 'q1', text: '10 Jumping Jacks' },
      { id: 'q2', text: 'Run in Place – 20 seconds' },
      { id: 'q3', text: 'Arm Circles – 15 seconds' }
    ]
  },
  {
    id: 'strength',
    title: 'Strength Builders',
    emoji: '💪',
    color: '#BFDBFE',
    items: [
      { id: 's1', text: '5 Pushups' },
      { id: 's2', text: '10 Squats' },
      { id: 's3', text: 'Wall Sit – 20 seconds' }
    ]
  },
  {
    id: 'calm',
    title: 'Gentle Movement',
    emoji: '🌿',
    color: '#BBF7D0',
    items: [
      { id: 'c1', text: 'Neck Stretch' },
      { id: 'c2', text: 'Toe Touch – 15 seconds' },
      { id: 'c3', text: 'Slow Breathing + Reach Up' }
    ]
  }
];


// ---------------------------------------
// Build Current Week
// ---------------------------------------
const getWeekDays = () => {
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - today.getDay()); // Sunday

  return [...Array(7)].map((_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return {
      label: d.toLocaleDateString('en-US', { weekday: 'short' }),
      full: d.toISOString().split('T')[0]
    };
  });
};


const ExerciseScreen = ({ userId = null, supabaseClient = null }) => {

  // ---------------------------------------
  // Core State
  // ---------------------------------------
  const [categories, setCategories] = useState(DEFAULT_EXERCISES);
  const [selectedCategory, setSelectedCategory] = useState(DEFAULT_EXERCISES[0]);

  const [completed, setCompleted] = useState([]);

  const [searchText, setSearchText] = useState('');
  const [newExercise, setNewExercise] = useState('');

  // Weekly Journal
  const [week] = useState(getWeekDays());
  const [selectedDay, setSelectedDay] = useState(getWeekDays()[new Date().getDay()].full);

  // Popup Note Modal
  const [noteModal, setNoteModal] = useState(false);
  const [currentEntry, setCurrentEntry] = useState(null);
  const [note, setNote] = useState('');

  const dayEntries = completed.filter(e =>
    e.done_at?.split('T')[0] === selectedDay
  );


  // ---------------------------------------
  // Load Existing Data
  // ---------------------------------------
  useEffect(() => {
    loadUserCreated();
    loadCompletedHistory();
  }, []);

  const loadUserCreated = async () => {
    if (!supabaseClient || !userId) return;

    const { data } = await supabaseClient
      .from('custom_exercises')
      .select('*')
      .eq('user_id', userId);

    if (!data || data.length === 0) return;

    setCategories(prev => {
      const updated = [...prev];
      let custom = updated.find(c => c.id === 'custom');

      if (!custom) {
        custom = {
          id: 'custom',
          title: 'Your Exercises',
          emoji: '✨',
          color: '#FBCFE8',
          items: []
        };
        updated.push(custom);
      }

      custom.items = data.map(d => ({
        id: d.id,
        text: d.exercise
      }));

      return updated;
    });
  };

  const loadCompletedHistory = async () => {
    if (!supabaseClient || !userId) return;

    const { data } = await supabaseClient
      .from('exercise_history')
      .select('*')
      .eq('user_id', userId);

    if (data) setCompleted(data);
  };


  // ---------------------------------------
  // OPEN POPUP
  // ---------------------------------------
  const openNote = (entry) => {
    setCurrentEntry(entry);
    setNote(entry.note || '');
    setNoteModal(true);
  };


  // ---------------------------------------
  // SAVE NOTE
  // ---------------------------------------
  const saveNote = async () => {
    setCompleted(prev =>
      prev.map(l =>
        l.id === currentEntry.id
          ? { ...l, note }
          : l
      )
    );

    if (supabaseClient && userId) {
      await supabaseClient
        .from('exercise_history')
        .update({ note })
        .eq('id', currentEntry.id);
    }

    setNoteModal(false);
  };


  // ---------------------------------------
  // Complete Exercise + Trigger Popup
  // ---------------------------------------
  const handleComplete = async (item) => {
    const entry = {
      id: Date.now(),
      exercise: item.text,
      category: selectedCategory.id,
      created_at: new Date().toISOString(),
      done_at: new Date().toISOString(),
      note: ''
    };

    setCompleted(prev => [...prev, entry]);
    openNote(entry);

    if (supabaseClient && userId) {
      await supabaseClient.from('exercise_history').insert({
        user_id: userId,
        exercise: item.text,
        category: selectedCategory.id,
        created_at: entry.created_at,
        done_at: entry.created_at,
        note: ''
      });
    }
  };


  // ---------------------------------------
  // Add Custom Exercise
  // ---------------------------------------
  const handleAddExercise = async () => {
    if (!newExercise.trim()) return;

    const exerciseObject = {
      id: Date.now().toString(),
      text: newExercise
    };

    setCategories(prev => {
      const copy = [...prev];
      let custom = copy.find(c => c.id === 'custom');

      if (!custom) {
        custom = {
          id: 'custom',
          title: 'Your Exercises',
          emoji: '✨',
          color: '#FBCFE8',
          items: []
        };
        copy.push(custom);
      }

      custom.items.push(exerciseObject);
      return copy;
    });

    if (supabaseClient && userId) {
      await supabaseClient.from('custom_exercises').insert({
        user_id: userId,
        exercise: newExercise,
        created_at: new Date().toISOString()
      });
    }

    setNewExercise('');
  };


  // ---------------------------------------
  // Filter Search
  // ---------------------------------------
  const filteredItems = selectedCategory.items.filter(item =>
    item.text.toLowerCase().includes(searchText.toLowerCase())
  );


  // ---------------------------------------
  // UI
  // ---------------------------------------
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>

        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.emoji}>{selectedCategory.emoji}</Text>
          <Text style={styles.title}>{selectedCategory.title}</Text>
          <Text style={styles.sub}>
            Search, create, and move your body 💪
          </Text>
        </View>

        {/* CATEGORY TABS */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabs}>
          {categories.map(cat => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.tab,
                selectedCategory.id === cat.id && styles.tabActive
              ]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text style={styles.tabText}>{cat.emoji} {cat.title}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* SEARCH */}
        <TextInput
          placeholder="Search exercises..."
          value={searchText}
          onChangeText={setSearchText}
          style={styles.search}
        />

        {/* EXERCISES */}
        <View style={styles.itemsBox}>
          {filteredItems.length === 0 && (
            <Text style={styles.empty}>No matches. Try adding one!</Text>
          )}

          {filteredItems.map(item => (
            <TouchableOpacity
              key={item.id}
              style={[styles.card, { backgroundColor: selectedCategory.color }]}
              onPress={() => handleComplete(item)}
            >
              <Text style={styles.cardText}>{item.text}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ADD CUSTOM */}
        <View style={styles.addBox}>
          <Text style={styles.addTitle}>Add Your Own Exercise</Text>
          <TextInput
            placeholder="ex: 20 second plank"
            value={newExercise}
            onChangeText={setNewExercise}
            style={styles.addInput}
          />
          <TouchableOpacity style={styles.addBtn} onPress={handleAddExercise}>
            <Text style={styles.addBtnText}>Add Exercise</Text>
          </TouchableOpacity>
        </View>

        {/* JOURNAL */}
        <View style={styles.journalContainer}>
          <Text style={styles.journalTitle}>Weekly Activity Journal</Text>

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

          <View style={styles.entriesBox}>
            {dayEntries.length === 0 && (
              <Text style={styles.empty}>No exercises logged this day.</Text>
            )}

            {dayEntries.map(entry => (
              <View key={entry.id} style={styles.entryCard}>
                <Text style={styles.entryExercise}>✅ {entry.exercise}</Text>

                <TextInput
                  style={styles.noteBox}
                  placeholder="Write how it felt..."
                  value={entry.note || ''}
                  onChangeText={(t) => setCompleted(prev =>
                    prev.map(e =>
                      e.id === entry.id ? { ...e, note: t } : e
                    )
                  )}
                  multiline
                />
              </View>
            ))}
          </View>
        </View>

      </ScrollView>

      {/* NOTE POPUP */}
      <Modal transparent visible={noteModal} animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Great Job!</Text>
            <Text style={styles.modalSub}>
              How did {currentEntry?.exercise} feel?
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Optional reflection..."
              value={note}
              onChangeText={setNote}
              multiline
            />

            <TouchableOpacity style={styles.saveBtn} onPress={saveNote}>
              <Text style={styles.saveBtnText}>Save Note</Text>
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
  container:{ flex:1, backgroundColor:'#F9A8D4' },
  content:{ padding:16 },

  header:{ alignItems:'center', marginBottom:10 },
  emoji:{ fontSize:40 },
  title:{ fontSize:22, fontWeight:'bold', color:'#111827' },
  sub:{ color:'#374151', marginTop:4, textAlign:'center' },

  tabs:{ marginVertical:10 },
  tab:{
    backgroundColor:'#E5E7EB',
    paddingVertical:8,
    paddingHorizontal:14,
    borderRadius:20,
    marginRight:8
  },
  tabActive:{ backgroundColor:'#7C3AED' },
  tabText:{ fontWeight:'600', color:'#111827' },

  search:{
    backgroundColor:'#FFF',
    padding:10,
    borderRadius:12,
    marginBottom:12
  },

  itemsBox:{ gap:10, marginTop:6 },
  empty:{ textAlign:'center', color:'#374151', marginVertical:10 },
  card:{ padding:16, borderRadius:16 },
  cardText:{ fontWeight:'bold', color:'#111827' },

  addBox:{ marginTop:20, backgroundColor:'#FFF', padding:14, borderRadius:16 },
  addTitle:{ fontWeight:'bold', marginBottom:6, color:'#111827' },
  addInput:{
    backgroundColor:'#F3F4F6',
    padding:10,
    borderRadius:10,
    marginBottom:10
  },
  addBtn:{
    backgroundColor:'#7C3AED',
    padding:10,
    borderRadius:10,
    alignItems:'center'
  },
  addBtnText:{ color:'#FFF', fontWeight:'bold' },

  journalContainer:{
    marginTop:20,
    backgroundColor:'#FFF',
    padding:14,
    borderRadius:16
  },
  journalTitle:{
    fontWeight:'bold',
    fontSize:18,
    marginBottom:10,
    color:'#111827'
  },

  weekRow:{
    flexDirection:'row',
    justifyContent:'space-between',
    marginBottom:10
  },
  dayBox:{
    backgroundColor:'#E5E7EB',
    paddingVertical:8,
    paddingHorizontal:10,
    borderRadius:12
  },
  dayActive:{ backgroundColor:'#7C3AED' },
  dayLabel:{ fontWeight:'600', color:'#111827' },

  entriesBox:{ gap:10 },
  entryCard:{
    backgroundColor:'#F3F4F6',
    padding:10,
    borderRadius:12
  },
  entryExercise:{ fontWeight:'bold', marginBottom:6, color:'#111827' },
  noteBox:{
    backgroundColor:'#FFF',
    padding:8,
    borderRadius:10,
    minHeight:40
  },

  overlay:{
    flex:1,
    backgroundColor:'rgba(0,0,0,0.7)',
    justifyContent:'center',
    alignItems:'center'
  },
  modalBox:{
    backgroundColor:'#FFF',
    padding:18,
    borderRadius:16,
    width:'85%'
  },
  modalTitle:{ fontSize:20, fontWeight:'bold', marginBottom:6 },
  modalSub:{ color:'#374151', marginBottom:10 },
  modalInput:{
    backgroundColor:'#F3F4F6',
    borderRadius:10,
    padding:10,
    minHeight:70
  },
  saveBtn:{
    backgroundColor:'#7C3AED',
    marginTop:12,
    borderRadius:10,
    padding:10,
    alignItems:'center'
  },
  saveBtnText:{ color:'#FFF', fontWeight:'bold' }
});

export default ExerciseScreen;
