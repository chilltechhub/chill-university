// src/screens/ProfileQuickSetup.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../api/supabaseClient'; // <-- adjust if your client is at a different path

// Small avatar placeholders (replace with your images or storage URLs)
const AVATARS = [
  { id: 'cat', label: 'Cat', src: null },
  { id: 'robot', label: 'Robot', src: null },
  { id: 'fox', label: 'Fox', src: null },
  { id: 'owl', label: 'Owl', src: null },
];

const TOPICS = [
  { id: 'ai', label: 'AI' },
  { id: 'web', label: 'Web Dev' },
  { id: 'robotics', label: 'Robotics' },
  { id: 'finance', label: 'Finance' },
  { id: 'science', label: 'Science' },
];

const FORMATS = [
  { id: 'video', label: 'Videos' },
  { id: 'article', label: 'Articles' },
  { id: 'game', label: 'Games' },
  { id: 'quiz', label: 'Quizzes' },
];

export default function ProfileQuickSetup() {
  const navigation = useNavigation();
  const [displayName, setDisplayName] = useState('');
  const [avatarId, setAvatarId] = useState(AVATARS[0].id);
  const [ageCategory, setAgeCategory] = useState('kid');
  const [birthYear, setBirthYear] = useState('');
  const [topics, setTopics] = useState([]);
  const [formats, setFormats] = useState([]);
  const [dailyMinutes, setDailyMinutes] = useState(10);
  const [learningLevel, setLearningLevel] = useState('beginner');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    // Prefill profile if exists
    let mounted = true;
    (async () => {
      try {
        const { data: userData, error: userErr } = await supabase.auth.getUser();
        if (userErr) {
          console.warn('getUser error', userErr);
          // Allow to continue as guest but inform user
          setInitialLoading(false);
          return;
        }
        const user = userData?.user;
        if (!user) {
          setInitialLoading(false);
          return;
        }

        // Load profile if it exists
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (error) {
          console.warn('profiles select error', error);
        }

        if (data && mounted) {
          setDisplayName(data.display_name || '');
          setAvatarId(data.avatar_id || AVATARS[0].id);
          setAgeCategory(data.age_category || 'kid');
          setBirthYear(data.birth_year ? String(data.birth_year) : '');
          setTopics(data.topics || []);
          setFormats(data.formats || []);
          setDailyMinutes(data.daily_minutes ?? 10);
          setLearningLevel(data.learning_level || 'beginner');
        }
      } catch (err) {
        console.error('fetchProfile unexpected error', err);
      } finally {
        if (mounted) setInitialLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, []);

  const toggleArray = (arr, setArr, val) => {
    if (arr.includes(val)) setArr(arr.filter(x => x !== val));
    else setArr([...arr, val]);
  };

  const handleSave = async () => {
    // Basic validation
    if (!displayName || displayName.trim().length < 2) {
      Alert.alert('Validation', 'Please enter a display name (2+ characters).');
      return;
    }

    setLoading(true);
    try {
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr) {
        console.error('getUser error', userErr);
        Alert.alert('Error', 'Unable to verify user session. Please sign in again.');
        setLoading(false);
        return;
      }

      const user = userData?.user;
      if (!user) {
        Alert.alert('Not signed in', 'Please sign in before saving your profile.');
        setLoading(false);
        return;
      }

      const birthYearInt = birthYear ? parseInt(birthYear, 10) : null;

      const payload = {
        id: user.id,
        display_name: displayName.trim(),
        avatar_id: avatarId,
        age_category: ageCategory,
        birth_year: birthYearInt,
        topics,
        formats,
        daily_minutes: dailyMinutes,
        learning_level: learningLevel,
        is_guest: false,
        onboarding_completed: true,
      };

      console.log('ProfileQuickSetup: upserting profile payload', payload);

      const { data, error } = await supabase
        .from('profiles')
        .upsert(payload, { returning: 'representation' });

      if (error) {
        console.error('profiles upsert error', error);
        // Common cause: Row Level Security prevents writes. Inform about RLS
        if (error.code === '42501' || error.message?.includes('permission')) {
          Alert.alert('Save Error', 'Permission error saving profile. Check database RLS policies.');
        } else {
          Alert.alert('Save Error', error.message || 'Unable to save profile. Try again later.');
        }
        setLoading(false);
        return;
      }

      console.log('profiles upsert success', data);

      // Update auth metadata (non-fatal if it fails)
      try {
        await supabase.auth.updateUser({
          data: { display_name: payload.display_name, avatar_id: payload.avatar_id },
        });
      } catch (e) {
        console.warn('auth.updateUser warning', e);
      }

      // Navigate into the app (Home). Replace so user can't hit back to setup.
      navigation.replace('Home');
    } catch (err) {
      console.error('handleSave unexpected error', err);
      Alert.alert('Unexpected Error', 'An unexpected error occurred while saving your profile.');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 10 }}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Set up your profile</Text>

      <Text style={styles.label}>Display name</Text>
      <TextInput
        value={displayName}
        onChangeText={setDisplayName}
        placeholder="What should we call you?"
        style={styles.input}
        autoCapitalize="words"
      />

      <Text style={styles.label}>Choose avatar</Text>
      <FlatList
        horizontal
        data={AVATARS}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.avatarItem, avatarId === item.id && styles.avatarSelected]}
            onPress={() => setAvatarId(item.id)}
          >
            {/* For now we show the label; replace with <Image source={...} /> if you have images */}
            <View style={styles.avatarPreview}>
              <Text style={{ fontSize: 18 }}>{item.label}</Text>
            </View>
          </TouchableOpacity>
        )}
        keyExtractor={i => i.id}
      />

      <Text style={styles.label}>Age category</Text>
      <View style={styles.row}>
        <TouchableOpacity
          onPress={() => setAgeCategory('kid')}
          style={[styles.pill, ageCategory === 'kid' && styles.pillActive]}
        >
          <Text>Kid</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setAgeCategory('teen')}
          style={[styles.pill, ageCategory === 'teen' && styles.pillActive]}
        >
          <Text>Teen</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setAgeCategory('adult')}
          style={[styles.pill, ageCategory === 'adult' && styles.pillActive]}
        >
          <Text>Adult</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>Birth year (optional)</Text>
      <TextInput
        value={birthYear}
        onChangeText={setBirthYear}
        placeholder="e.g. 2012"
        style={styles.input}
        keyboardType="numeric"
      />

      <Text style={styles.label}>Topics you like</Text>
      <View style={styles.grid}>
        {TOPICS.map(t => (
          <TouchableOpacity
            key={t.id}
            onPress={() => toggleArray(topics, setTopics, t.id)}
            style={[styles.chip, topics.includes(t.id) && styles.chipActive]}
          >
            <Text>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>How do you like to learn?</Text>
      <View style={styles.grid}>
        {FORMATS.map(f => (
          <TouchableOpacity
            key={f.id}
            onPress={() => toggleArray(formats, setFormats, f.id)}
            style={[styles.chip, formats.includes(f.id) && styles.chipActive]}
          >
            <Text>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Daily minutes</Text>
      <View style={styles.row}>
        <TouchableOpacity
          onPress={() => setDailyMinutes(5)}
          style={[styles.pill, dailyMinutes === 5 && styles.pillActive]}
        >
          <Text>5</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setDailyMinutes(10)}
          style={[styles.pill, dailyMinutes === 10 && styles.pillActive]}
        >
          <Text>10</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setDailyMinutes(20)}
          style={[styles.pill, dailyMinutes === 20 && styles.pillActive]}
        >
          <Text>20</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={handleSave} style={styles.saveButton} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: 'white' }}>Save & Continue</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { flex: 1, padding: 20 },
  title: { fontSize: 22, marginBottom: 12 },
  label: { marginTop: 12, marginBottom: 6, fontWeight: '600' },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 10, borderRadius: 8 },
  avatarItem: { padding: 8, marginRight: 8, borderRadius: 8, borderWidth: 1, borderColor: '#eee', alignItems: 'center' },
  avatarSelected: { borderColor: '#333' },
  avatarPreview: { width: 64, height: 64, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  pill: { padding: 10, borderRadius: 20, borderWidth: 1, borderColor: '#ddd', marginRight: 8 },
  pillActive: { backgroundColor: '#dfefff' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#ddd', marginRight: 8, marginBottom: 8 },
  chipActive: { backgroundColor: '#e6ffe6' },
  saveButton: { marginTop: 18, padding: 14, borderRadius: 10, backgroundColor: '#0b63d6', alignItems: 'center' },
});
