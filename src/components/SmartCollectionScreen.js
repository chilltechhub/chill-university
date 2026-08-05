import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';

const DEFAULT_COLLECTIONS = [
  {
    id: 'focus',
    title: 'Focus Boosters',
    emoji: '🧠',
    color: '#BFDBFE',
    items: [
      { id: 1, text: 'Take 5 Deep Breaths' },
      { id: 2, text: 'Quick Stretch' },
      { id: 3, text: 'Positive Thought' }
    ]
  },
  {
    id: 'calm',
    title: 'Calm Down Tools',
    emoji: '🌿',
    color: '#BBF7D0',
    items: [
      { id: 1, text: 'Count to 10' },
      { id: 2, text: 'Drink Water' },
      { id: 3, text: 'Ask for a Break' }
    ]
  }
];

const SmartCollectionScreen = ({
  userId = null,
  supabaseClient = null
}) => {
  const [collections, setCollections] = useState(DEFAULT_COLLECTIONS);
  const [selectedCollection, setSelectedCollection] = useState(DEFAULT_COLLECTIONS[0]);
  const [usageHistory, setUsageHistory] = useState([]);

  useEffect(() => {
    loadCollections();
  }, []);

  const loadCollections = async () => {
    // If no supabase, just use built in data
    if (!supabaseClient || !userId) return;

    try {
      const { data, error } = await supabaseClient
        .from('smart_collections')
        .select('*')
        .eq('user_id', userId);

      if (!error && data && data.length > 0) {
        setCollections(data);
        setSelectedCollection(data[0]);
      }
    } catch (err) {
      console.log('Error loading collections:', err);
    }
  };

  const handleSelectItem = async(item) => {
    const entry = {
      id: Date.now(),
      item,
      collection: selectedCollection.id,
      used_at: new Date().toISOString()
    };

    setUsageHistory(prev => [...prev, entry]);

    if (supabaseClient && userId) {
      try {
        await supabaseClient
          .from('collection_usage')
          .insert({
            user_id: userId,
            collection_id: selectedCollection.id,
            item: item.text,
            created_at: new Date().toISOString()
          });
      } catch (error) {
        console.log('Error saving usage:', error);
      }
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        
        <View style={styles.header}>
          <Text style={styles.emoji}>{selectedCollection.emoji}</Text>
          <Text style={styles.title}>{selectedCollection.title}</Text>
        </View>

        {/* Collection Selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabs}>
          {collections.map((col) => (
            <TouchableOpacity
              key={col.id}
              style={[
                styles.tab,
                selectedCollection.id === col.id && styles.tabActive
              ]}
              onPress={() => setSelectedCollection(col)}
            >
              <Text style={styles.tabText}>{col.emoji} {col.title}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Collection Items */}
        <View style={styles.itemsBox}>
          {selectedCollection.items.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.itemCard, { backgroundColor: selectedCollection.color }]}
              onPress={() => handleSelectItem(item)}
            >
              <Text style={styles.itemText}>{item.text}</Text>
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container:{
    flex:1,
    backgroundColor:'#A78BFA'
  },
  content:{
    padding:16
  },
  header:{
    alignItems:'center',
    marginBottom:12
  },
  emoji:{
    fontSize:40
  },
  title:{
    fontSize:22,
    fontWeight:'bold',
    color:'#111827'
  },
  tabs:{
    marginVertical:10
  },
  tab:{
    backgroundColor:'#E5E7EB',
    paddingVertical:8,
    paddingHorizontal:14,
    borderRadius:20,
    marginRight:8
  },
  tabActive:{
    backgroundColor:'#4F46E5'
  },
  tabText:{
    color:'#111827',
    fontWeight:'600'
  },
  itemsBox:{
    marginTop:10,
    gap:10
  },
  itemCard:{
    padding:16,
    borderRadius:16
  },
  itemText:{
    fontWeight:'bold',
    color:'#111827'
  }
});

export default SmartCollectionScreen;
