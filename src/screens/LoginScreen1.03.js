// src/screens/LoginScreen.js
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Alert,
  ActivityIndicator, StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../api/supabaseClient';
import { useNavigation } from '@react-navigation/native';
import { colors, typography, spacing, radius } from '../theme';

// onSuccess — called after successful login (used when opened as modal from TopBar)
// onClose   — called when user wants to dismiss without logging in
export default function LoginScreen({ onSuccess, onClose }) {
  const navigation = useNavigation();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [mode,     setMode]     = useState('login'); // 'login' | 'signup'

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
    } catch (err) {
      console.error('goAfterAuth', err);
    }
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
      if (session) {
        await goAfterAuth();
      } else {
        Alert.alert('Check your email', 'Confirm your email address before logging in.');
      }
    } catch {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={s.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Close button — only shown when opened as modal */}
      {onClose && (
        <TouchableOpacity style={s.closeBtn} onPress={onClose}>
          <Ionicons name="close" size={24} color={colors.creamDim} />
        </TouchableOpacity>
      )}

      <View style={s.card}>
        <Text style={s.logo}>📚</Text>
        <Text style={s.title}>
          {mode === 'login' ? 'Welcome back' : 'Create account'}
        </Text>
        <Text style={s.subtitle}>
          {mode === 'login'
            ? 'Sign in to save your progress'
            : 'Join and start your learning journey'}
        </Text>

        <TextInput
          style={s.input}
          placeholder="Email address"
          placeholderTextColor={colors.textLight}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoCorrect={false}
        />

        <TextInput
          style={s.input}
          placeholder="Password"
          placeholderTextColor={colors.textLight}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.lg }} />
        ) : (
          <TouchableOpacity style={s.button} onPress={handleSubmit} activeOpacity={0.85}>
            <Text style={s.buttonText}>
              {mode === 'login' ? 'Sign In' : 'Create Account'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Guest continue option */}
        {onClose && (
          <TouchableOpacity style={s.guestBtn} onPress={onClose}>
            <Text style={s.guestText}>Continue as guest</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={s.switchRow}
          onPress={() => setMode(m => m === 'login' ? 'signup' : 'login')}
        >
          <Text style={s.switchText}>
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <Text style={s.switchLink}>
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.navy,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  closeBtn: {
    position: 'absolute',
    top: spacing.xxl + spacing.lg,
    right: spacing.xl,
    zIndex: 10,
    padding: spacing.sm,
  },
  card: {
    backgroundColor: colors.navyMid,
    borderRadius: radius.xl,
    padding: spacing.xxl,
    borderWidth: 0.5,
    borderColor: colors.navyBorder,
  },
  logo: { fontSize: 48, textAlign: 'center', marginBottom: spacing.lg },
  title: {
    fontSize: typography.xxl,
    fontWeight: typography.bold,
    color: colors.cream,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.sm,
    color: colors.creamDim,
    textAlign: 'center',
    marginBottom: spacing.xxl,
    lineHeight: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.navyBorder,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    fontSize: typography.md,
    color: colors.cream,
    backgroundColor: colors.navy,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md + 2,
    borderRadius: radius.md,
    marginTop: spacing.sm,
    alignItems: 'center',
  },
  buttonText: {
    color: colors.white,
    fontWeight: typography.bold,
    fontSize: typography.md,
  },
  guestBtn: { marginTop: spacing.lg, alignItems: 'center' },
  guestText: { fontSize: typography.sm, color: colors.muted },
  switchRow: { marginTop: spacing.xl, alignItems: 'center' },
  switchText: { fontSize: typography.sm, color: colors.creamDim },
  switchLink: { color: colors.brass, fontWeight: typography.semibold },
});
