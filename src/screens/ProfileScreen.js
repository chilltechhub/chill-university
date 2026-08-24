// src/screens/ProfileScreen.js
//
// Identity-focused: display name, avatar, bio. Preferences (topics, formats,
// daily goal, experience level) and account actions live in SettingsScreen.

import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, StyleSheet, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../api/supabaseClient';
import { useTheme } from '../../context/ThemeContext';

const AVATARS = ['📚', '🦉', '🦊', '🐱', '🤖', '🌱'];

export default function ProfileScreen() {
  const { colors: c, typography: t, spacing: s, radius: r } = useTheme();
  const styles = makeStyles(c, t, s, r);
  const navigation = useNavigation();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [session, setSession] = useState(null);
  const [displayName, setDisplayName] = useState('');
  const [avatarId, setAvatarId] = useState(AVATARS[0]);
  const [bio, setBio] = useState('');
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data: { session: activeSession } } = await supabase.auth.getSession();
        if (!mounted) return;
        setSession(activeSession);
        const userId = activeSession?.user?.id;
        if (!userId) { setLoading(false); return; }

        const { data, error } = await supabase
          .from('profiles')
          .select('display_name, avatar_id, bio')
          .eq('id', userId)
          .maybeSingle();

        if (error) console.error('profile load error', error);
        if (data && mounted) {
          setDisplayName(data.display_name || '');
          setAvatarId(data.avatar_id || AVATARS[0]);
          setBio(data.bio || '');
        }
      } catch (err) {
        console.error('unexpected profile load error', err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const markDirty = (setter) => (val) => { setter(val); setDirty(true); };

  const handleSave = async () => {
    if (!session?.user?.id) return;
    if (displayName.trim().length < 2) {
      Alert.alert('Almost there', 'Display name needs to be at least 2 characters.');
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: displayName.trim(),
          avatar_id: avatarId,
          bio: bio.trim(),
        })
        .eq('id', session.user.id);

      if (error) {
        Alert.alert('Save error', error.message || 'Could not save profile.');
        return;
      }
      try {
        await supabase.auth.updateUser({ data: { display_name: displayName.trim(), avatar_id: avatarId } });
      } catch (e) { console.warn('auth.updateUser warning', e); }
      setDirty(false);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={c.gold} size="large" />
      </View>
    );
  }

  if (!session) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Not signed in</Text>
        <Text style={styles.subtitle}>Sign in to view or edit your profile.</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Profile</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={styles.gearBtn}>
          <Ionicons name="settings-outline" size={22} color={c.text3} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <View style={styles.avatarBig}>
          <Text style={styles.avatarBigEmoji}>{avatarId}</Text>
        </View>
        <View style={styles.avatarRow}>
          {AVATARS.map(a => (
            <TouchableOpacity
              key={a}
              style={[styles.avatarCircle, avatarId === a && styles.avatarCircleActive]}
              onPress={() => markDirty(setAvatarId)(a)}
            >
              <Text style={styles.avatarEmoji}>{a}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Display name</Text>
        <TextInput
          style={styles.input}
          value={displayName}
          onChangeText={markDirty(setDisplayName)}
          placeholder="Your name"
          placeholderTextColor={c.text4}
          autoCapitalize="words"
        />

        <Text style={styles.label}>Email</Text>
        <Text style={styles.value}>{session.user.email}</Text>

        <Text style={styles.label}>Bio</Text>
        <TextInput
          style={[styles.input, styles.bioInput]}
          value={bio}
          onChangeText={markDirty(setBio)}
          placeholder="A short bio (optional)"
          placeholderTextColor={c.text4}
          multiline
        />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveBtn, (!dirty || saving) && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={!dirty || saving}
        >
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save changes</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const makeStyles = (c, t, s, r) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.bg0 },
  center: { flex: 1, backgroundColor: c.bg0, alignItems: 'center', justifyContent: 'center', padding: s.xl },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: s.xl, paddingTop: s.xxl, paddingBottom: s.md,
  },
  title: { fontSize: t.xl, fontWeight: t.bold, color: c.text1 },
  gearBtn: { padding: s.sm },
  subtitle: { fontSize: t.sm, color: c.text3, marginTop: s.sm, textAlign: 'center' },

  body: { paddingHorizontal: s.xl, paddingBottom: s.xl },

  avatarBig: {
    alignSelf: 'center', width: 88, height: 88, borderRadius: 44,
    backgroundColor: c.bg1, borderWidth: 1.5, borderColor: c.gold,
    alignItems: 'center', justifyContent: 'center', marginBottom: s.lg,
  },
  avatarBigEmoji: { fontSize: 40 },
  avatarRow: { flexDirection: 'row', justifyContent: 'center', gap: s.sm, marginBottom: s.xl },
  avatarCircle: {
    width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center',
    backgroundColor: c.bg1, borderWidth: 1.5, borderColor: c.border,
  },
  avatarCircleActive: { borderColor: c.gold, backgroundColor: c.inputBg },
  avatarEmoji: { fontSize: 20 },

  label: { fontSize: t.xs, fontWeight: t.semibold, color: c.text4, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: s.sm, marginTop: s.md },
  value: { fontSize: t.md, color: c.text1, marginBottom: s.sm },
  input: {
    borderWidth: 1, borderColor: c.inputBorder, borderRadius: r.md,
    padding: s.md, fontSize: t.md, color: c.text1, backgroundColor: c.inputBg,
  },
  bioInput: { height: 90, textAlignVertical: 'top' },

  footer: { padding: s.xl, borderTopWidth: 0.5, borderTopColor: c.border },
  saveBtn: {
    backgroundColor: c.goldMid, borderRadius: r.md,
    paddingVertical: s.md + 2, alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnText: { color: '#fff', fontWeight: t.bold, fontSize: t.md },
});
