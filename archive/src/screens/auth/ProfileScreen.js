// src/screens/ProfileScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { supabase } from '../api/supabaseClient';
import { useNavigation } from '@react-navigation/native';
import ChildInviteCode from './ChildInviteCode';

export default function ProfileScreen() {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null); // null = no profile row, object = row
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const navigation = useNavigation();

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const s = await supabase.auth.getSession();
        const activeSession = s?.data?.session ?? null;
        if (!mounted) return;
        setSession(activeSession);

        const userId = activeSession?.user?.id;
        if (!userId) {
          setProfile(null);
          setLoading(false);
          return;
        }

        // fetch profile row
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        if (error) {
          console.error('Error fetching profile:', error);
          Alert.alert('Error', 'Could not fetch profile.');
          setProfile(null);
        } else if (!data) {
          setProfile(null);
        } else {
          setProfile(data);
          setUsername(data.username ?? '');
          setBio(data.bio ?? '');
        }
      } catch (err) {
        console.error('Unexpected profile load error', err);
        Alert.alert('Error', 'Unexpected error loading profile.');
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, []);

  const createProfile = async () => {
    if (!session?.user?.id) return Alert.alert('No session');
    const userId = session.user.id;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert([{ id: userId, username, email: session.user.email, bio }]);

      if (error) {
        console.error('createProfile error', error);
        Alert.alert('Error', error.message || 'Could not create profile');
        return;
      }

      setProfile(data[0]);
      Alert.alert('Profile created');
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async () => {
    if (!session?.user?.id) return Alert.alert('No session');
    const userId = session.user.id;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ username, bio }) // <-- bio included
        .eq('id', userId)
        .select()
        .maybeSingle();

      if (error) {
        console.error('updateProfile error', error);
        Alert.alert('Error', error.message || 'Could not update profile');
        return;
      }
      setProfile(data);
      Alert.alert('Profile updated');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setSession(null);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!session) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Not signed in</Text>
        <Text>Please sign in to view or edit your profile.</Text>
      </View>
    );
  }

  // profile row missing: allow create
  if (!profile) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Create your profile</Text>
        <TextInput
          placeholder="Username"
          value={username}
          onChangeText={setUsername}
          style={styles.input}
          autoCapitalize="none"
        />
        <TextInput
          placeholder="A short bio (optional)"
          value={bio}
          onChangeText={setBio}
          style={[styles.input, { height: 80 }]}
          multiline
        />
        <Button title="Create profile" onPress={createProfile} />
        <View style={{ height: 12 }} />
        <Button title="Sign out" onPress={handleLogout} />
      </View>
    );
  }

  // profile exists: show and allow edit
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Profile</Text>
      <Text style={styles.label}>Email</Text>
      <Text style={styles.value}>{profile.email}</Text>

      <Text style={styles.label}>Username</Text>
      <TextInput value={username} onChangeText={setUsername} style={styles.input} />

      <Text style={styles.label}>Bio</Text>
      <TextInput value={bio} onChangeText={setBio} style={[styles.input, { height: 80 }]} multiline />

      <View style={{ height: 12 }} />
      <Button title="Save" onPress={updateProfile} />
      <View style={{ height: 12 }} />
      <Button title="Sign out" onPress={handleLogout} />
      <Button
  title="Generate Parent Invite Code"
  onPress={() => navigation.navigate('MainTabs', {
  screen: 'Parent',
  params: {
    screen: 'ChildInviteCode',
    params: { childId: session.user.id }
  }
})
}
/>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1, padding: 20 },
  title: { fontSize: 20, fontWeight: '600', marginBottom: 12 },
  label: { fontSize: 12, color: '#444', marginTop: 8 },
  value: { fontSize: 14, marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 8, borderRadius: 6, marginBottom: 8 },
});
