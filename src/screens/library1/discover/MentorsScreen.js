import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Button,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';

import { fetchMentors, upsertMentor, createMentorRequest } from '../../../api/mentorService';
import { supabase } from '../../../api/supabaseClient'; // used to fetch existing mentor by id

export default function MentorsScreen({ navigation }) {
  // Replace with your auth/profile flow to get current user's profile id
  const [currentUserId, setCurrentUserId] = useState(null);

  const [mentors, setMentors] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);

  // Signup modal state
  const [signupVisible, setSignupVisible] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [subjectsText, setSubjectsText] = useState('');
  const [bio, setBio] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [saving, setSaving] = useState(false);

  // Mentor detail / request modal
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [requestMessage, setRequestMessage] = useState('');
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    // get current user id from auth - adjust to your auth system
    const loadUser = async () => {
      const user = supabase.auth?.user?.(); // if using supabase auth client
      // if you use a different auth, replace above
      setCurrentUserId(user?.id || null);
    };
    loadUser();
    loadMentors();
  }, []);

  async function loadMentors(subject = null) {
    setLoading(true);
    try {
      const data = await fetchMentors({ subject });
      setMentors(data);
    } catch (err) {
      Alert.alert('Error loading mentors');
    } finally {
      setLoading(false);
    }
  }

  // open signup modal and load existing mentor data if any
  async function openSignup() {
    if (!currentUserId) {
      return Alert.alert('Login required', 'Please sign in to become a mentor.');
    }
    setSignupVisible(true);
    // fetch existing mentor record
    try {
      const { data, error } = await supabase
        .from('mentors')
        .select('*')
        .eq('id', currentUserId)
        .single();
      if (!error && data) {
        setDisplayName(data.display_name || '');
        setBio(data.bio || '');
        setSubjectsText((data.subjects || []).join(', '));
        setHourlyRate(data.hourly_rate ? String(data.hourly_rate) : '');
      } else {
        // clear fields for new mentor
        setDisplayName('');
        setBio('');
        setSubjectsText('');
        setHourlyRate('');
      }
    } catch (err) {
      console.warn('openSignup fetch error', err);
    }
  }

  async function submitSignup() {
    if (!currentUserId) return Alert.alert('Missing profile id');
    if (!displayName || !subjectsText) return Alert.alert('Please fill required fields');

    setSaving(true);
    const subjects = subjectsText.split(',').map(s => s.trim()).filter(Boolean);
    const payload = {
      id: currentUserId,
      display_name: displayName,
      bio,
      subjects,
      hourly_rate: hourlyRate ? Number(hourlyRate) : null,
      is_active: true,
    };

    try {
      await upsertMentor(payload);
      Alert.alert('Saved', 'You are now listed as a mentor.');
      setSignupVisible(false);
      loadMentors();
    } catch (err) {
      Alert.alert('Error saving mentor');
    } finally {
      setSaving(false);
    }
  }

  function openDetail(mentor) {
    setSelectedMentor(mentor);
    setRequestMessage('');
    setDetailVisible(true);
  }

  async function sendRequest() {
    if (!currentUserId) return Alert.alert('Login required', 'Please sign in to request mentorship.');
    if (!selectedMentor) return;
    if (!requestMessage) return Alert.alert('Please add a message');

    setRequesting(true);
    try {
      await createMentorRequest({
        mentorId: selectedMentor.id,
        requesterId: currentUserId,
        message: requestMessage,
      });
      Alert.alert('Request sent', 'The mentor will be notified.');
      setDetailVisible(false);
    } catch (err) {
      Alert.alert('Error sending request');
    } finally {
      setRequesting(false);
    }
  }

  function onSearchSubmit() {
    const s = query.trim();
    loadMentors(s || null);
  }

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => openDetail(item)}>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{item.display_name}</Text>
        <Text numberOfLines={2} style={styles.bio}>{item.bio}</Text>
        <Text style={styles.meta}>{(item.subjects || []).join(', ')} • {item.hourly_rate ? `$${item.hourly_rate}/h` : 'Free'}</Text>
      </View>
      <Text style={styles.rating}>⭐ {item.rating ? item.rating.toFixed(1) : '0'} ({item.rating_count || 0})</Text>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, padding: 12 }}>
      <View style={styles.headerRow}>
        <TextInput
          placeholder="Search by subject or mentor name"
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={onSearchSubmit}
          style={styles.search}
        />
        <TouchableOpacity onPress={onSearchSubmit} style={styles.searchBtn}><Text>Search</Text></TouchableOpacity>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
        <Text style={{ fontSize: 18, fontWeight: '700' }}>Mentors</Text>
        <Button title="Become a mentor" onPress={openSignup} />
      </View>

      {loading ? <ActivityIndicator style={{ marginTop: 20 }} /> :
        <FlatList
          style={{ marginTop: 12 }}
          data={mentors}
          keyExtractor={(i) => i.id}
          renderItem={renderItem}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          ListEmptyComponent={() => <Text style={{ marginTop: 20 }}>No mentors found.</Text>}
        />
      }

      {/* Signup modal */}
      <Modal visible={signupVisible} animationType="slide">
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <Text style={styles.label}>Display name *</Text>
          <TextInput style={styles.input} value={displayName} onChangeText={setDisplayName} placeholder="How should mentees call you?" />

          <Text style={styles.label}>Subjects (comma separated) *</Text>
          <TextInput style={styles.input} value={subjectsText} onChangeText={setSubjectsText} placeholder="embedded systems, c++, pcb design" />

          <Text style={styles.label}>Short bio</Text>
          <TextInput style={[styles.input, { height: 100 }]} value={bio} onChangeText={setBio} multiline placeholder="What do you teach? Experience? Hours available?" />

          <Text style={styles.label}>Hourly rate (optional)</Text>
          <TextInput style={styles.input} value={hourlyRate} onChangeText={setHourlyRate} keyboardType="numeric" placeholder="e.g. 25" />

          <View style={{ marginTop: 14 }}>
            <Button title={saving ? 'Saving...' : 'Save as Mentor'} onPress={submitSignup} disabled={saving} />
            <View style={{ height: 8 }} />
            <Button title="Cancel" onPress={() => setSignupVisible(false)} />
          </View>
        </ScrollView>
      </Modal>

      {/* Mentor detail / request modal */}
      <Modal visible={detailVisible} animationType="slide">
        <View style={{ padding: 16, flex: 1 }}>
          {selectedMentor ? (
            <>
              <Text style={styles.name}>{selectedMentor.display_name}</Text>
              <Text style={{ marginTop: 6 }}>{(selectedMentor.subjects || []).join(', ')}</Text>
              <Text style={{ marginTop: 12 }}>{selectedMentor.bio}</Text>
              <Text style={{ marginTop: 12 }}>Rate: {selectedMentor.hourly_rate ? `$${selectedMentor.hourly_rate}/h` : 'Free'}</Text>

              <Text style={{ marginTop: 16 }}>Message to mentor</Text>
              <TextInput
                style={[styles.input, { height: 120 }]}
                value={requestMessage}
                onChangeText={setRequestMessage}
                multiline
                placeholder="Describe your goals or what you need help with"
              />

              <View style={{ marginTop: 12 }}>
                <Button title={requesting ? 'Sending...' : 'Request Mentorship'} onPress={sendRequest} disabled={requesting} />
                <View style={{ height: 8 }} />
                <Button title="Close" onPress={() => setDetailVisible(false)} />
              </View>
            </>
          ) : <Text>Loading...</Text>}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  search: { flex: 1, borderWidth: 1, borderColor: '#ddd', padding: 8, borderRadius: 8 },
  searchBtn: { marginLeft: 8 },
  card: { flexDirection: 'row', padding: 12, borderRadius: 10, backgroundColor: '#f8f8f8', alignItems: 'center' },
  title: { fontWeight: '700', fontSize: 16 },
  bio: { color: '#666', marginTop: 6 },
  meta: { marginTop: 6, color: '#333', fontSize: 12 },
  rating: { marginLeft: 12, textAlign: 'right' },

  label: { marginTop: 12, fontWeight: '600' },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 10, borderRadius: 8, marginTop: 6 },
  name: { fontSize: 22, fontWeight: '700' },
});
