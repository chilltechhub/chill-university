// src/screens/LoginScreen.js
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Alert,
  ActivityIndicator, StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../api/supabaseClient';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';

export default function LoginScreen({ onSuccess, onClose }) {
  const { colors: c, typography: t, spacing: s, radius: r } = useTheme();
  const navigation = useNavigation();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [mode,     setMode]     = useState('login');

  const styles = makeStyles(c, t, s, r);

  const goAfterAuth = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) return;
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', user.id)
        .maybeSingle();
      const needsOnboarding = !profile || profile.onboarding_completed === false;
      if (onSuccess) {
        onSuccess();
        if (needsOnboarding) navigation.navigate('MultiStepOnboarding');
      } else {
        navigation.replace(needsOnboarding ? 'MultiStepOnboarding' : 'MainTabs');
      }
    } catch (err) { console.error('goAfterAuth', err); }
  };

  const handleSubmit = async () => {
    const trimEmail = email.trim();
    if (!trimEmail || !password) {
      Alert.alert('Missing fields', 'Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      const { error } = mode === 'login'
        ? await supabase.auth.signInWithPassword({ email: trimEmail, password })
        : await supabase.auth.signUp({ email: trimEmail, password });
      if (error) {
        Alert.alert(mode === 'login' ? 'Login Error' : 'Signup Error', error.message);
        return;
      }
      const { data: { session } } = await supabase.auth.getSession();
      if (session) await goAfterAuth();
      else Alert.alert('Check your email', 'Confirm your email address before logging in.');
    } catch {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {onClose && (
        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <Ionicons name="close" size={24} color={c.text3} />
        </TouchableOpacity>
      )}

      <View style={styles.card}>
        <Text style={styles.logo}>📚</Text>
        <Text style={styles.ornament}>✦ ·  · ✦</Text>
        <Text style={styles.title}>
          {mode === 'login' ? 'Welcome back, Scholar' : 'Begin your journey'}
        </Text>
        <Text style={styles.subtitle}>
          {mode === 'login'
            ? 'Sign in to save your progress and rank'
            : 'Create your account to start leveling up'}
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Email address"
          placeholderTextColor={c.text4}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoCorrect={false}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={c.text4}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {loading ? (
          <ActivityIndicator color={c.gold} style={{ marginTop: s.lg }} />
        ) : (
          <TouchableOpacity style={styles.btn} onPress={handleSubmit} activeOpacity={0.85}>
            <Text style={styles.btnGlyph}>✦</Text>
            <Text style={styles.btnText}>
              {mode === 'login' ? 'Enter the Library' : 'Create Account'}
            </Text>
          </TouchableOpacity>
        )}

        {onClose && (
          <TouchableOpacity style={styles.guestBtn} onPress={onClose}>
            <Text style={styles.guestText}>Continue as guest — progress won't be saved</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.switchRow}
          onPress={() => setMode(m => m === 'login' ? 'signup' : 'login')}
        >
          <Text style={styles.switchText}>
            {mode === 'login' ? "Don't have an account? " : 'Already a scholar? '}
            <Text style={styles.switchLink}>
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (c, t, s, r) => StyleSheet.create({
  screen: {
    flex: 1, backgroundColor: c.bg0,
    justifyContent: 'center', padding: s.xl,
  },
  closeBtn: {
    position: 'absolute', top: s.xxl + s.lg,
    right: s.xl, zIndex: 10, padding: s.sm,
  },
  card: {
    backgroundColor: c.bg1, borderRadius: r.xl,
    padding: s.xxl, borderWidth: 0.5, borderColor: c.border,
  },
  logo: { fontSize: 48, textAlign: 'center', marginBottom: s.xs },
  ornament: { textAlign: 'center', color: c.gold, fontSize: t.sm, letterSpacing: 6, marginBottom: s.md },
  title: {
    fontSize: t.xl, fontWeight: t.bold, color: c.text1,
    textAlign: 'center', marginBottom: s.sm,
  },
  subtitle: {
    fontSize: t.sm, color: c.text3, textAlign: 'center',
    marginBottom: s.xl, lineHeight: 20,
  },
  input: {
    borderWidth: 1, borderColor: c.inputBorder, borderRadius: r.md,
    padding: s.md, marginBottom: s.md, fontSize: t.md,
    color: c.text1, backgroundColor: c.inputBg,
  },
  btn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: s.sm, backgroundColor: c.goldMid,
    paddingVertical: s.md + 2, borderRadius: r.md, marginTop: s.sm,
  },
  btnGlyph: { color: '#fff', fontSize: t.xs, opacity: 0.8 },
  btnText: { color: '#fff', fontWeight: t.bold, fontSize: t.md },
  guestBtn: { marginTop: s.lg, alignItems: 'center' },
  guestText: { fontSize: t.xs, color: c.text4, textAlign: 'center' },
  switchRow: { marginTop: s.lg, alignItems: 'center' },
  switchText: { fontSize: t.sm, color: c.text3 },
  switchLink: { color: c.teal, fontWeight: t.semibold },
});
