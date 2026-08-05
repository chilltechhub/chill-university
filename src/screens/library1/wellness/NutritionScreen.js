/**
 * NutritionScreen
 * ---------------------------------------
 * - Food categories (tabs)
 * - Search foods
 * - Add custom foods
 * - Log food → opens popup note modal
 * - Weekly expandable journal calendar
 * - Notes saved to Supabase
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
// Default Food Categories
// ---------------------------------------
const DEFAULT_FOODS = [
  {
    id: 'breakfast',
    title: 'Breakfast',
    emoji: '🍳',
    color: '#FFE8A3',
    items: [
      { id: 'b1', text: 'Cereal' },
      { id: 'b2', text: 'Eggs & Toast' },
      { id: 'b3', text: 'Fruit & Yogurt' }
    ]
  },
  {
    id: 'lunch',
    title: 'Lunch',
    emoji: '🥪',
    color: '#BEE3F8',
    items: [
      { id: 'l1', text: 'Sandwich' },
      { id: 'l2', text: 'Pizza Slice' },
      { id: 'l3', text: 'Chicken & Rice' }
    ]
  },
  {
    id: 'dinner',
    title: 'Dinner',
    emoji: '🍽️',
    color: '#C7F9CC',
    items: [
      { id: 'd1', text: 'Spaghetti' },
      { id: 'd2', text: 'Tacos' },
      { id: 'd3', text: 'Chicken + Veggies' }
    ]
  },
  {
    id: 'snack',
    title: 'Snacks',
    emoji: '🍎',
    color: '#FFC1C1',
    items: [
      { id: 's1', text: 'Apple' },
      { id: 's2', text: 'Granola Bar' },
      { id: 's3', text: 'Crackers' }
    ]
  }
];


// ---------------------------------------
// Helper → Build current week calendar
// ---------------------------------------
const getWeekDays = () => {
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - today.getDay()); // Sunday start

  return [...Array(7)].map((_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return {
      label: d.toLocaleDateString('en-US', { weekday: 'short' }),
      full: d.toISOString().split('T')[0]
    };
  });
};


const NutritionScreen = ({ userId = null, supabaseClient = null }) => {

  // ---------------------------------------
  // Core State
  // ---------------------------------------
  const [categories, setCategories] = useState(DEFAULT_FOODS);
  const [selectedCategory, setSelectedCategory] = useState(DEFAULT_FOODS[0]);
  
  const [log, setLog] = useState([]);

  // Search + Add
  const [search, setSearch] = useState('');
  const [newFood, setNewFood] = useState('');

  // Weekly Journal
  const [week, setWeek] = useState(getWeekDays());
  const [selectedDay, setSelectedDay] = useState(
    getWeekDays()[new Date().getDay()].full
  );

  const dayEntries = log.filter(
    e => e.consumed_at?.split('T')[0] === selectedDay
  );

  // Popup Note
  const [noteModal, setNoteModal] = useState(false);
  const [currentEntry, setCurrentEntry] = useState(null);
  const [note, setNote] = useState('');


  // ---------------------------------------
  // Load Data on Start
  // ---------------------------------------
  useEffect(() => {
    loadCustomFoods();
    loadHistory();
  }, []);

  const loadCustomFoods = async () => {
    if (!supabaseClient || !userId) return;

    const { data } = await supabaseClient
      .from('custom_foods')
      .select('*')
      .eq('user_id', userId);

    if (!data || data.length === 0) return;

    setCategories(prev => {
      const updated = [...prev];
      let custom = updated.find(c => c.id === 'custom');

      if (!custom) {
        custom = {
          id: 'custom',
          title: 'Your Foods',
          emoji: '✨',
          color: '#E9D5FF',
          items: []
        };
        updated.push(custom);
      }

      custom.items = data.map(d => ({
        id: d.id,
        text: d.food
      }));

      return updated;
    });
  };


  const loadHistory = async () => {
    if (!supabaseClient || !userId) return;

    const { data } = await supabaseClient
      .from('nutrition_history')
      .select('*')
      .eq('user_id', userId);

    if (data) setLog(data);
  };


  // ---------------------------------------
  // Handle Log Food → popup
  // ---------------------------------------
  const handleLog = async (item) => {
    const entry = {
      id: Date.now(),
      user_id: userId,
      food: item.text,
      category: selectedCategory.id,
      created_at: new Date().toISOString(),
      consumed_at: new Date().toISOString(),
      note: ''
    };

    setLog(prev => [entry, ...prev]);
    openNote(entry);

    if (supabaseClient && userId) {
      await supabaseClient.from('nutrition_history').insert({
        user_id: userId,
        food: item.text,
        category: selectedCategory.id,
        created_at: entry.created_at,
        consumed_at: entry.consumed_at,
        note: ''
      });
    }
  };


  // ---------------------------------------
  // Notes Popup
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
        .from('nutrition_history')
        .update({ note })
        .eq('created_at', currentEntry.created_at)
        .eq('user_id', userId);
    }
  };


  // ---------------------------------------
  // Delete Entry
  // ---------------------------------------
  const deleteEntry = async (entry) => {
    setLog(prev => prev.filter(e => e.id !== entry.id));

    if (supabaseClient && userId) {
      await supabaseClient
        .from('nutrition_history')
        .delete()
        .eq('created_at', entry.created_at)
        .eq('user_id', userId);
    }
  };


  // ---------------------------------------
  // Add Custom Food
  // ---------------------------------------
  const addFood = async () => {
    if (!newFood.trim()) return;

    const obj = {
      id: Date.now().toString(),
      text: newFood
    };

    setCategories(prev => {
      const copy = [...prev];
      let custom = copy.find(c => c.id === 'custom');

      if (!custom) {
        custom = {
          id: 'custom',
          title: 'Your Foods',
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
      await supabaseClient.from('custom_foods').insert({
        user_id: userId,
        food: newFood,
        category: selectedCategory.id,
        created_at: new Date().toISOString()
      });
    }

    setNewFood('');
  };


  // ---------------------------------------
  // Filter Foods by Search
  // ---------------------------------------
  const filtered = selectedCategory.items.filter(item =>
    item.text.toLowerCase().includes(search.toLowerCase())
  );


  // ---------------------------------------
  // UI
  // ---------------------------------------
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.emoji}>{selectedCategory.emoji}</Text>
          <Text style={styles.title}>{selectedCategory.title}</Text>
          <Text style={styles.sub}>Log meals and reflect 🍎</Text>
        </View>

        {/* Category Tabs */}
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

        {/* Search */}
        <TextInput
          placeholder="Search foods..."
          value={search}
          onChangeText={setSearch}
          style={styles.search}
        />

        {/* Foods */}
        <View style={styles.itemsBox}>
          {filtered.length === 0 && (
            <Text style={styles.empty}>No matches. Try adding one!</Text>
          )}

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

        {/* Add Food */}
        <View style={styles.addBox}>
          <Text style={styles.addTitle}>Add Your Own Food</Text>
          <TextInput
            placeholder="ex: Chicken Nuggets"
            value={newFood}
            onChangeText={setNewFood}
            style={styles.addInput}
          />
          <TouchableOpacity style={styles.addBtn} onPress={addFood}>
            <Text style={styles.addBtnText}>Add Food</Text>
          </TouchableOpacity>
        </View>

        {/* Journal */}
        <View style={styles.journal}>
          <Text style={styles.journalTitle}>Weekly Nutrition Journal</Text>

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

          {/* Entries */}
          {dayEntries.length === 0 && (
            <Text style={styles.empty}>Nothing logged this day.</Text>
          )}

          {dayEntries.map(entry => (
  <View key={entry.id} style={styles.entryCard}>
    <View style={{ flexDirection:'row', justifyContent:'space-between' }}>
      <Text style={styles.entryFood}>🍽️ {entry.food}</Text>
      <TouchableOpacity onPress={() => deleteEntry(entry)}>
        <Text style={{ color:'red' }}>Delete</Text>
      </TouchableOpacity>
    </View>

    {entry.note ? (
      <Text style={styles.entryNote}>
        {entry.note}
      </Text>
    ) : null}

    <TouchableOpacity
      style={styles.noteBtn}
      onPress={() => openNote(entry)}
    >
      <Text style={styles.noteBtnText}>
        {entry.note ? 'Edit Note' : 'Add Note'}
      </Text>
    </TouchableOpacity>
  </View>
))}
        </View>

      </ScrollView>


      {/* ---------------- NOTE MODAL ---------------- */}
      <Modal visible={noteModal} transparent animationType="slide">
        <View style={styles.modalWrap}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Food Journal Note</Text>

            <TextInput
              placeholder="How did this meal feel? Was it filling? Healthy? 😊"
              value={note}
              onChangeText={setNote}
              style={styles.modalInput}
              multiline
            />

            <TouchableOpacity style={styles.modalBtn} onPress={saveNote}>
              <Text style={styles.modalBtnText}>Save Note</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setNoteModal(false)}>
              <Text style={{ marginTop:8, textAlign:'center' }}>
                Cancel
              </Text>
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
  tab:{
    backgroundColor:'#E5E7EB',
    paddingVertical:8,
    paddingHorizontal:14,
    borderRadius:20,
    marginRight:8
  },
  tabActive:{ backgroundColor:'#7C3AED' },
  tabText:{ color:'#111827', fontWeight:'600' },

  search:{
    backgroundColor:'#FFF',
    padding:10,
    borderRadius:12,
    marginBottom:10
  },

  itemsBox:{ gap:10 },
  card:{ padding:16, borderRadius:16 },
  cardText:{ fontWeight:'bold', color:'#111827' },
  empty:{ textAlign:'center', marginVertical:10, color:'#374151' },

  addBox:{ marginTop:20, backgroundColor:'#FFF', padding:14, borderRadius:16 },
  addTitle:{ fontWeight:'bold', marginBottom:6 },
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

  journal:{
    marginTop:20,
    backgroundColor:'#FFF',
    padding:14,
    borderRadius:16
  },
  journalTitle:{ fontWeight:'bold', fontSize:18, marginBottom:10 },
  weekRow:{ flexDirection:'row', justifyContent:'space-between', marginBottom:10 },
  dayBox:{
    backgroundColor:'#E5E7EB',
    paddingVertical:8,
    paddingHorizontal:10,
    borderRadius:12
  },
  dayActive:{ backgroundColor:'#7C3AED' },
  dayLabel:{ fontWeight:'600', color:'#111827' },

  entryCard:{
    backgroundColor:'#F3F4F6',
    padding:10,
    borderRadius:12,
    marginBottom:10
  },
  entryFood:{ fontWeight:'bold', marginBottom:6 },

  noteBtn:{
    backgroundColor:'#7C3AED',
    padding:8,
    borderRadius:8,
    alignItems:'center'
  },
  noteBtnText:{ color:'#FFF' },

  modalWrap:{
    flex:1,
    backgroundColor:'rgba(0,0,0,0.5)',
    justifyContent:'center',
    padding:20
  },
  modalBox:{
    backgroundColor:'#FFF',
    padding:16,
    borderRadius:16
  },
  modalTitle:{
    fontWeight:'bold',
    fontSize:18,
    marginBottom:10
  },
  modalInput:{
    backgroundColor:'#F3F4F6',
    minHeight:80,
    borderRadius:10,
    padding:10
  },
  modalBtn:{
    backgroundColor:'#7C3AED',
    padding:10,
    borderRadius:10,
    marginTop:10
  },
  modalBtnText:{
    color:'#FFF',
    textAlign:'center',
    fontWeight:'bold'
  }
});

export default NutritionScreen;
