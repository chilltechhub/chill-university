// src/screens/LoginScreen.js
// Clean auth screen — space traveler theme, handles both login and signup

import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Alert,
  ActivityIndicator, StyleSheet, KeyboardAvoidingView,
  Platform, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../api/supabaseClient';
import { useNavigation } from '@react-navigation/native';


export default function LoginScreen({ onSuccess, onClose }) {
  const navigation = useNavigation();
  const [email,       setEmail]       = useState('');
  const [password,    setPassword]    = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading,     setLoading]     = useState(false);
  const [mode,        setMode]        = useState('login'); // login | signup
  const [showPass,    setShowPass]    = useState(false);

  const goAfterAuth = async (user) => {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', user.id)
      .maybeSingle();

    const needsOnboarding = !profile || profile.onboarding_completed !== true;

    if (needsOnboarding) {
      if (onSuccess) onSuccess();
      navigation.navigate('MultiStepOnboarding');
    } else {
      if (onSuccess) onSuccess();
      navigation.navigate('MainTabs');
    }
  } catch (e) {
    console.warn('goAfterAuth', e);
    // Fallback — just call onSuccess and let App.js handle routing
    if (onSuccess) onSuccess();
  }
};

  const handleSubmit = async () => {
    const trimEmail = email.trim().toLowerCase();
    if (!trimEmail || !password) {
      Alert.alert('Missing fields', 'Please enter your email and password.');
      return;
    }
    if (mode === 'signup' && password.length < 6) {
      Alert.alert('Password too short', 'Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({ email: trimEmail, password });
        if (error) { Alert.alert('Sign in failed', error.message); return; }
        if (data.user) await goAfterAuth(data.user);
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: trimEmail, password,
          options: { data: { display_name: displayName.trim() || trimEmail.split('@')[0] } },
        });
        if (error) { Alert.alert('Sign up failed', error.message); return; }

        if (data.user) {
          // Manual profile create as safety net for trigger
          await supabase.from('profiles').upsert({
            id:                   data.user.id,
            display_name:         displayName.trim() || trimEmail.split('@')[0],
            username:             trimEmail.split('@')[0],
            email:                trimEmail,
            points:               0,
            xp:                   0,
            level:                1,
            rank:                 20,
            streak_count:         0,
            onboarding_completed: false,
          });

          if (data.session) {
            await goAfterAuth(data.user);
          } else {
            Alert.alert(
              'Check your email 📬',
              'We sent you a confirmation link. Click it then come back to sign in.',
              [{ text: 'OK', onPress: () => setMode('login') }]
            );
          }
        }
      }
    } catch (e) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
      console.warn('auth error', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={s.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Close button */}
      {onClose && (
        <TouchableOpacity style={s.closeBtn} onPress={onClose}>
          <Ionicons name="close" size={22} color="rgba(255,255,255,0.5)" />
        </TouchableOpacity>
      )}

      {/* Stars bg decoration */}
      <View style={s.stars}>
        {['✦','·','✦','·','✦','·','✦'].map((ch, i) => (
          <Text key={i} style={[s.star, { opacity: 0.1 + i * 0.05, fontSize: 8 + (i % 3) * 4, top: 40 + i * 30, left: 20 + i * 42 }]}>{ch}</Text>
        ))}
      </View>

      <View style={s.content}>
        {/* Logo */}
        <View style={s.logoWrap}>
          <Text style={s.logoEmoji}>🛸</Text>
          <Text style={s.ornament}>✦  ·  ·  ✦</Text>
          <Text style={s.appName}>ChillTech Hub</Text>
          <Text style={s.tagline}>Tech for the rest of us</Text>
        </View>

        {/* Card */}
        <View style={s.card}>
          <Text style={s.cardTitle}>
            {mode === 'login' ? 'Welcome back, Traveler' : 'Begin your mission'}
          </Text>
          <Text style={s.cardSub}>
            {mode === 'login'
              ? 'Sign in to return to your base'
              : 'Create your account to launch'}
          </Text>

          {/* Display name (signup only) */}
          {mode === 'signup' && (
            <View style={s.inputWrap}>
              <Ionicons name="person-outline" size={16} color="rgba(255,255,255,0.3)" style={s.inputIcon} />
              <TextInput
                style={s.input}
                placeholder="Display name"
                placeholderTextColor="rgba(255,255,255,0.25)"
                value={displayName}
                onChangeText={setDisplayName}
                autoCapitalize="words"
              />
            </View>
          )}

          {/* Email */}
          <View style={s.inputWrap}>
            <Ionicons name="mail-outline" size={16} color="rgba(255,255,255,0.3)" style={s.inputIcon} />
            <TextInput
              style={s.input}
              placeholder="Email address"
              placeholderTextColor="rgba(255,255,255,0.25)"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoCorrect={false}
            />
          </View>

          {/* Password */}
          <View style={s.inputWrap}>
            <Ionicons name="lock-closed-outline" size={16} color="rgba(255,255,255,0.3)" style={s.inputIcon} />
            <TextInput
              style={[s.input, { flex: 1 }]}
              placeholder="Password"
              placeholderTextColor="rgba(255,255,255,0.25)"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPass}
            />
            <TouchableOpacity onPress={() => setShowPass(v => !v)} style={{ padding: 4 }}>
              <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={16} color="rgba(255,255,255,0.3)" />
            </TouchableOpacity>
          </View>

          {/* Submit */}
          <TouchableOpacity style={s.btn} onPress={handleSubmit} disabled={loading} activeOpacity={0.85}>
            {loading
              ? <ActivityIndicator color="#fff" size="small" />
              : <>
                  <Text style={s.btnText}>{mode === 'login' ? 'Enter Base' : 'Launch Mission'}</Text>
                  <Text style={s.btnEmoji}>{mode === 'login' ? '🚀' : '🛸'}</Text>
                </>
            }
          </TouchableOpacity>

          {/* Switch mode */}
          <TouchableOpacity style={s.switchRow} onPress={() => setMode(m => m === 'login' ? 'signup' : 'login')}>
            <Text style={s.switchText}>
              {mode === 'login' ? "New traveler? " : 'Already have a base? '}
              <Text style={s.switchLink}>{mode === 'login' ? 'Create account' : 'Sign in'}</Text>
            </Text>
          </TouchableOpacity>

          {/* Guest */}
          {onClose && (
            <TouchableOpacity style={s.guestBtn} onPress={onClose}>
              <Text style={s.guestText}>Continue as guest — progress won't be saved</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  screen:      { flex: 1, backgroundColor: '#080612', justifyContent: 'center' },
  closeBtn:    { position: 'absolute', top: 54, right: 20, zIndex: 10, padding: 8, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 20 },
  stars:       { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  star:        { position: 'absolute', color: '#fff' },
  content:     { paddingHorizontal: 24 },
  logoWrap:    { alignItems: 'center', marginBottom: 32 },
  logoEmoji:   { fontSize: 56, marginBottom: 8 },
  ornament:    { color: '#c9a84c', fontSize: 13, letterSpacing: 8, marginBottom: 6 },
  appName:     { fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
  tagline:     { fontSize: 13, color: 'rgba(255,255,255,0.35)', marginTop: 4 },
  card:        { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 24, padding: 24, borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.1)' },
  cardTitle:   { fontSize: 20, fontWeight: '700', color: '#fff', textAlign: 'center', marginBottom: 6 },
  cardSub:     { fontSize: 13, color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginBottom: 24 },
  inputWrap:   { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 12, paddingHorizontal: 14, borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.1)', marginBottom: 12 },
  inputIcon:   { marginRight: 8 },
  input:       { flex: 1, paddingVertical: 14, fontSize: 15, color: '#fff' },
  btn:         { backgroundColor: '#2bb5a0', borderRadius: 14, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8 },
  btnText:     { color: '#fff', fontWeight: '700', fontSize: 16 },
  btnEmoji:    { fontSize: 16 },
  switchRow:   { marginTop: 18, alignItems: 'center' },
  switchText:  { fontSize: 13, color: 'rgba(255,255,255,0.4)' },
  switchLink:  { color: '#2bb5a0', fontWeight: '600' },
  guestBtn:    { marginTop: 14, alignItems: 'center' },
  guestText:   { fontSize: 12, color: 'rgba(255,255,255,0.25)', textAlign: 'center' },
});
