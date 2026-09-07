// src/screens/ResetPasswordScreen.js
// Where a password-reset (or email-confirmation) link lands. Reached only
// via App.js routing you here after supabase-js's detectSessionInUrl (web)
// or the deep-link handler (native) turns the link into a real session —
// see App.js's PASSWORD_RECOVERY listener. Same visual language as
// LoginScreen.js, since this is still part of the auth flow.

import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Alert,
  ActivityIndicator, StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../api/supabaseClient';

export default function ResetPasswordScreen({ linkInvalid }) {
  const navigation = useNavigation();
  const [password,        setPassword]        = useState('');
  const [confirmPassword, setConfirmPassword]  = useState('');
  const [showPass,        setShowPass]         = useState(false);
  const [loading,         setLoading]          = useState(false);

  const backToSignIn = () => navigation.reset({ index: 0, routes: [{ name: 'Login' }] });

  const submit = async () => {
    if (password.length < 6) {
      Alert.alert('Password too short', 'Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Passwords don't match", 'Type the same password in both fields.');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) { Alert.alert("Couldn't update password", error.message); return; }

      // updateUser() succeeding on the recovery session leaves you signed
      // in with it — same onboarding check LoginScreen does after a real
      // sign-in, so a mid-onboarding account doesn't skip straight to
      // MainTabs.
      const { data: { user } } = await supabase.auth.getUser();
      let target = 'MainTabs';
      if (user) {
        const { data: profile } = await supabase
          .from('profiles').select('onboarding_completed').eq('id', user.id).maybeSingle();
        if (!profile || profile.onboarding_completed !== true) target = 'MultiStepOnboarding';
      }
      Alert.alert('Password updated ✅', 'You\'re signed in with your new password.', [
        { text: 'OK', onPress: () => navigation.reset({ index: 0, routes: [{ name: target }] }) },
      ]);
    } catch (e) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
      console.warn('reset password error', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={s.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={s.stars}>
        {['✦','·','✦','·','✦','·','✦'].map((ch, i) => (
          <Text key={i} style={[s.star, { opacity: 0.1 + i * 0.05, fontSize: 8 + (i % 3) * 4, top: 40 + i * 30, left: 20 + i * 42 }]}>{ch}</Text>
        ))}
      </View>

      <View style={s.content}>
        <View style={s.logoWrap}>
          <Text style={s.logoEmoji}>🛸</Text>
          <Text style={s.ornament}>✦  ·  ·  ✦</Text>
          <Text style={s.appName}>ChillTech Hub</Text>
        </View>

        <View style={s.card}>
          {linkInvalid ? (
            <>
              <Text style={s.cardTitle}>This link is invalid or has expired</Text>
              <Text style={s.cardSub}>
                Reset links expire after a while, and a link only works once — request a fresh one and try again.
              </Text>
              <TouchableOpacity style={s.btn} onPress={backToSignIn} activeOpacity={0.85}>
                <Text style={s.btnText}>Back to Sign In</Text>
                <Text style={s.btnEmoji}>🚀</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={s.cardTitle}>Choose a new password</Text>
              <Text style={s.cardSub}>Make it something you haven't used here before.</Text>

              <View style={s.inputWrap}>
                <Ionicons name="lock-closed-outline" size={16} color="rgba(255,255,255,0.3)" style={s.inputIcon} />
                <TextInput
                  style={[s.input, { flex: 1 }]}
                  placeholder="New password"
                  placeholderTextColor="rgba(255,255,255,0.25)"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPass}
                  autoFocus
                />
                <TouchableOpacity onPress={() => setShowPass(v => !v)} style={{ padding: 4 }}>
                  <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={16} color="rgba(255,255,255,0.3)" />
                </TouchableOpacity>
              </View>

              <View style={s.inputWrap}>
                <Ionicons name="lock-closed-outline" size={16} color="rgba(255,255,255,0.3)" style={s.inputIcon} />
                <TextInput
                  style={[s.input, { flex: 1 }]}
                  placeholder="Confirm new password"
                  placeholderTextColor="rgba(255,255,255,0.25)"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showPass}
                  onSubmitEditing={submit}
                />
              </View>

              <TouchableOpacity style={s.btn} onPress={submit} disabled={loading} activeOpacity={0.85}>
                {loading
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <>
                      <Text style={s.btnText}>Update Password</Text>
                      <Text style={s.btnEmoji}>🔐</Text>
                    </>
                }
              </TouchableOpacity>

              <TouchableOpacity style={s.switchRow} onPress={backToSignIn}>
                <Text style={s.switchText}><Text style={s.switchLink}>← Back to sign in</Text></Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  screen:      { flex: 1, backgroundColor: '#080612', justifyContent: 'center' },
  stars:       { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  star:        { position: 'absolute', color: '#fff' },
  content:     { paddingHorizontal: 24 },
  logoWrap:    { alignItems: 'center', marginBottom: 32 },
  logoEmoji:   { fontSize: 56, marginBottom: 8 },
  ornament:    { color: '#c9a84c', fontSize: 13, letterSpacing: 8, marginBottom: 6 },
  appName:     { fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
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
});
